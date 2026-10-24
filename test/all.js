#!/usr/bin/env node
/**
 * DevFlow 完整性验证测试
 *
 * 验证所有 domain 模块正确加载、引用完整、架构一致。
 * 用法: node test/all.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOMAINS_DIR = path.join(ROOT, 'domains');
const HARNESSES_DIR = path.join(ROOT, 'harnesses');

const REQUIRED_FILES = [
  'SKILL.md',
  'CONSTITUTION.md',
  'README.md',
  'domains/expertise/_SKILL.md',
  'domains/expertise/party-mode.md',
  'domains/code-intel/_SKILL.md',
  'bin/devflow.js',
  'lib/phase-engine.js',
  'lib/memory.js',
  'lib/task-planner.js',
  'lib/party-arbiter.js',
  'domains/code-intel/code-explorer.js',
  'domains/memory/caveman.js',
  'domains/execution/_SKILL.md',
  'domains/specification/_SKILL.md',
  'domains/specification/templates/00-strategy.md',
  'domains/specification/templates/01-analysis.md',
  'domains/specification/templates/02-design.md',
  'domains/specification/templates/06-review.md',
  'domains/memory/_SKILL.md',
  'domains/hooks/_SKILL.md',
  'domains/hooks/gate-check.js',
  'domains/hooks/context-rot-monitor.js',
  'domains/hooks/token-monitor.js',
  'harnesses/install.js',
  'harnesses/README.md',
];

const REQUIRED_FRONTMATTER_KEYS = ['name', 'version'];

/**
 * 创建隔离工作区。
 * 历史 bug: 测试直接 new PhaseEngine() 会以 process.cwd() 为工作区，
 * 跑一次测试就覆写用户真实的 .devflow/state.json。
 */
const os = require('os');
const _tmpDirs = [];
function mkWorkspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devflow-test-'));
  _tmpDirs.push(dir);
  return dir;
}
function cleanupWorkspaces() {
  while (_tmpDirs.length) {
    const d = _tmpDirs.pop();
    try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* 清理失败可忽略 */ }
  }
}

const TESTS = [];

// Test 1: 文件完整性
TESTS.push({
  name: '文件完整性 — 所有必需文件存在',
  run: () => {
    const missing = REQUIRED_FILES.filter(f => !fs.existsSync(path.join(ROOT, f)));
    if (missing.length > 0) {
      return { pass: false, detail: `缺少: ${missing.join(', ')}` };
    }
    return { pass: true, detail: `${REQUIRED_FILES.length} 文件全部存在` };
  },
});

// Test 2: frontmatter 完整性
TESTS.push({
  name: 'Frontmatter — 所有 _SKILL.md 含 name + version',
  run: () => {
    const skillFiles = REQUIRED_FILES.filter(f => f.endsWith('_SKILL.md'));
    const errors = [];
    skillFiles.forEach(f => {
      const content = fs.readFileSync(path.join(ROOT, f), 'utf-8');
      REQUIRED_FRONTMATTER_KEYS.forEach(key => {
        if (!content.includes(`${key}:`)) errors.push(`${f}: 缺少 ${key}`);
      });
    });
    return errors.length > 0
      ? { pass: false, detail: errors.join('\n') }
      : { pass: true, detail: `${skillFiles.length} 个 _SKILL.md 全部有效` };
  },
});

// Test 3: 内核路由表 — 所有域在 SKILL.md 中被引用
TESTS.push({
  name: '内核路由 — SKILL.md 引用所有 domain',
  run: () => {
    const skill = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    const domains = fs.readdirSync(DOMAINS_DIR).filter(d =>
      fs.statSync(path.join(DOMAINS_DIR, d)).isDirectory()
    );
    const missing = domains.filter(d => !skill.includes(d));
    return missing.length > 0
      ? { pass: false, detail: `未在路由中: ${missing.join(', ')}` }
      : { pass: true, detail: `${domains.length} 个域均在路由中` };
  },
});

// Test 4: 宪法 — 规则编号必须连续（历史 bug: 断言 count>=7 恒真，且标题写"8 条"而实际 12 条）
TESTS.push({
  name: '宪法完整性 — 规则编号连续无缺号',
  run: () => {
    const constitution = fs.readFileSync(path.join(ROOT, 'CONSTITUTION.md'), 'utf-8');
    const nums = (constitution.match(/^## (\d+)(?:\.\d+)?/gm) || [])
      .map(s => parseInt(s.replace(/^##\s*/, ''), 10));

    const errors = [];
    if (nums.length === 0) errors.push('未找到任何规则标题');
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] !== i + 1) {
        errors.push(`编号不连续: 第 ${i + 1} 条为 ${nums[i]}，应为 ${i + 1}`);
        break;
      }
    }
    // 防止规则被静默删减
    if (nums.length < 12) errors.push(`规则数 ${nums.length} < 12，疑似被删减`);

    return errors.length === 0
      ? { pass: true, detail: `${nums.length} 条宪法规则，编号 1-${nums.length} 连续` }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 5: 门控 — 从权威定义加载校验（历史 bug: 正则只抽 gate: 不抽 extraGates，导致 G2 结构性不可见）
TESTS.push({
  name: '门控完整性 — 12 个门控全部有派生产物',
  run: () => {
    const { GATES, PHASES } = require(path.join(ROOT, 'lib', 'phase-engine'));
    const EXPECTED = ['G0', 'G1', 'G2', 'G2.5', 'G3', 'G3.5', 'G4', 'G5', 'G6', 'G7', 'G7.5', 'G8'];
    const errors = [];

    const ids = GATES.map(g => g.id);
    for (const id of EXPECTED) if (!ids.includes(id)) errors.push(`缺门控 ${id}`);
    for (const id of ids) if (!EXPECTED.includes(id)) errors.push(`未知门控 ${id}`);

    // 每个门控都必须能从 PHASES 派生出产物（含 extraGates）
    const map = {};
    for (const p of PHASES) {
      for (const gid of [p.gate, ...(p.extraGates || [])]) {
        (map[gid] = map[gid] || []).push(p.output);
      }
    }
    for (const id of EXPECTED) {
      if (!map[id] || map[id].length === 0) errors.push(`门控 ${id} 无派生产物`);
    }

    return errors.length === 0
      ? { pass: true, detail: `${GATES.length} 个门控 (${ids.join(', ')})，全部有派生产物` }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 5b: PhaseEngine gate ordering validation — gates must be sequential in PHASES array
TESTS.push({
  name: 'PhaseEngine — 门控序列含 extraGates 且顺序正确',
  run: () => {
    // 历史 bug: 用正则只抽 `gate:` 字段，extraGates 中的 G2 结构性不可见，
    // 且 expectedSequence 里显式省略了 G2 —— 等于把缺陷固化成"预期行为"。
    // 现改为直接加载权威定义并按 phaseAfter 排序。
    const { GATES } = require(path.join(ROOT, 'lib', 'phase-engine'));
    const sorted = [...GATES].sort((a, b) => a.phaseAfter - b.phaseAfter);
    const ids = sorted.map(g => g.id);
    const expected = ['G0', 'G1', 'G2', 'G2.5', 'G3', 'G3.5', 'G4', 'G5', 'G6', 'G7', 'G7.5', 'G8'];

    return ids.join(',') === expected.join(',')
      ? { pass: true, detail: `门控顺序正确: ${ids.join(' → ')}` }
      : { pass: false, detail: `不匹配预期 (${expected.join(', ')})，实际 (${ids.join(', ')})` };
  },
});

// Test 5c: CLI 集成 — 真实 spawn 子进程执行（历史 bug: 名为"可执行"却只做源码文本 grep）
TESTS.push({
  name: 'CLI 集成 — bin/devflow.js 真实执行 + help 覆盖全部命令',
  run: () => {
    const { spawnSync } = require('child_process');
    const cli = path.join(ROOT, 'bin', 'devflow.js');
    const errors = [];

    const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: ROOT });

    const help = run(['help']);
    if (help.status !== 0) {
      errors.push(`devflow help 退出码 ${help.status}: ${(help.stderr || '').trim().split('\n')[0]}`);
    }
    const doctor = run(['doctor']);
    if (!doctor.stdout || !doctor.stdout.includes('DevFlow 健康检查')) {
      errors.push(`devflow doctor 无有效输出 (status=${doctor.status})`);
    }
    // doctor 必须包含 Node 运行时环境检查项 (v3.3.0 环境检测增强)
    if (!doctor.stdout || !doctor.stdout.includes('Node 运行时')) {
      errors.push('doctor 缺少 Node 运行时检查项');
    }

    // help 必须列出 CMDS 中实现的每一个命令，防止"实现了却不告知"
    const helpText = help.stdout || '';
    const CMDS = ['init', 'status', 'phase', 'detect', 'task', 'mem', 'party', 'code', 'caveman', 'gates', 'git', 'install', 'doctor'];
    for (const cmd of CMDS) {
      if (!new RegExp(`devflow ${cmd}\\b`).test(helpText)) errors.push(`help 未列出命令: ${cmd}`);
    }

    return errors.length === 0
      ? { pass: true, detail: `help/doctor 真实执行通过，help 覆盖全部 ${CMDS.length} 个命令` }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 5e: detectMode — 四档阈值判定（守护 SKILL.md/GO.md 声明与实现一致）
TESTS.push({
  name: 'detectMode — 四档阈值判定正确',
  run: () => {
    const { detectMode } = require(path.join(ROOT, 'lib', 'phase-engine'));
    const cases = [
      [{ files: 1, lines: 20 }, 'fast'],
      [{ files: 2, lines: 49 }, 'fast'],
      [{ files: 3, lines: 120, brownfield: true }, 'lean'],
      [{ files: 5, lines: 299, brownfield: true }, 'lean'],
      [{ files: 3, lines: 120 }, 'standard'],
      [{ files: 10, lines: 499 }, 'standard'],
      [{ files: 20, lines: 900 }, 'strict'],
      [{ files: 1, lines: 10, architectureChange: true }, 'strict'],
      [{ files: 1, lines: 10, dataModelChange: true }, 'strict'],
      [{ files: 1, lines: 10, risk: 'high' }, 'strict'],
      [{ files: 1, lines: 10, modules: 5 }, 'strict'],
      [{ risk: 'low' }, 'fast'],
      [{ files: 0, lines: 0, brownfield: false }, 'standard'], // greenfield 空项目必跑 Phase 0
    ];
    const errors = [];
    for (const [input, expect] of cases) {
      const got = detectMode(input).mode;
      if (got !== expect) errors.push(`${JSON.stringify(input)} → ${got}，应为 ${expect}`);
    }
    return errors.length === 0
      ? { pass: true, detail: `${cases.length} 组阈值判定全部正确` }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 5f: setPhase — 前向跳跃门控强制 + skips 审计（v3.3.1 硬化后的预期行为）
TESTS.push({
  name: 'setPhase — 前向门控拦截 + --force 审计记录',
  run: () => {
    const { PhaseEngine } = require(path.join(ROOT, 'lib', 'phase-engine'));
    const engine = new PhaseEngine(mkWorkspace());
    const errors = [];

    // 非法 Phase 必须抛错
    let threw = false;
    try { engine.setPhase(99); } catch { threw = true; }
    if (!threw) errors.push('setPhase(99) 未拒绝非法值');

    // 前向跳跃途经门控未通过 → 必须拒绝（防 --set 绕过门控体系）
    engine.setMode('standard');
    let blocked = false;
    try { engine.setPhase(5); } catch { blocked = true; }
    if (!blocked) errors.push('standard 下 setPhase(0→5) 未被门控拦截');

    // --force 显式跳过：生效且记录审计（skips 含越过的门控）
    let forced = null;
    try { forced = engine.setPhase(5, { force: true }); } catch (e) { errors.push(`force 切换失败: ${e.message}`); }
    if (engine.state.currentPhase !== 5) errors.push('force 切换未生效');
    const skips = engine.state.skips || [];
    if (skips.length !== 1) errors.push(`skips 应记录 1 次，实际 ${skips.length}`);
    if (skips[0] && !Array.isArray(skips[0].crossedGates)) errors.push('skips 缺少 crossedGates 审计字段');

    // 后向跳跃（回看）不受门控拦截
    try { engine.setPhase(2); } catch (e) { errors.push(`后向跳跃被误拦: ${e.message}`); }
    if (engine.state.currentPhase !== 2) errors.push('后向跳跃未生效');

    // 当前模式下被跳过的 Phase 拒绝（除非 force，并记录 crossedSkippedPhase）
    engine.setMode('fast');
    let skipBlocked = false;
    try { engine.setPhase(0); } catch { skipBlocked = true; }
    if (!skipBlocked) errors.push('fast 模式下 setPhase(0) 未被拦截');
    try { engine.setPhase(0, { force: true }); } catch (e) { errors.push(`force 跨模式切换失败: ${e.message}`); }
    const lastSkip = (engine.state.skips || [])[engine.state.skips.length - 1];
    if (!lastSkip || lastSkip.crossedSkippedPhase !== true) errors.push('跨模式 force 跳过未标记 crossedSkippedPhase');

    return errors.length === 0
      ? { pass: true, detail: '前向跳跃门控拦截 ✅ force 审计记录 ✅ 后向自由 ✅ 跨模式拦截 ✅' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 5g: outputWritten — 产物名硬校验 + manual 门审批凭证（v3.5.0 语义）
TESTS.push({
  name: 'outputWritten — 产物名校验 + 审批凭证 + 门控联动',
  run: () => {
    const { PhaseEngine } = require(path.join(ROOT, 'lib', 'phase-engine'));
    const dir = mkWorkspace();
    const engine = new PhaseEngine(dir);
    engine.setMode('standard');
    const errors = [];
    const expectThrow = (fn, label) => {
      try { fn(); errors.push(`${label} 未被拒绝`); } catch { /* expected */ }
    };

    // 缺路径 / 不存在 / 文件名不符 / 目录冒充 / 未知 Phase
    expectThrow(() => engine.outputWritten(2), '无路径调用');
    expectThrow(() => engine.outputWritten(2, path.join(dir, 'nope', '02-design.md')), '不存在文件');
    const decoy = path.join(dir, 'README.md');
    fs.writeFileSync(decoy, 'x');
    expectThrow(() => engine.outputWritten(2, decoy), '文件名不符(README.md 冒充)');
    const dirDecoy = path.join(dir, '.devflow', 'req-1', '02-design.md');
    fs.mkdirSync(dirDecoy, { recursive: true });
    expectThrow(() => engine.outputWritten(2, dirDecoy), '目录冒充产物');
    expectThrow(() => engine.outputWritten(99, decoy), '未知 Phase');

    if (engine.state.gates.G3) errors.push('校验失败时 G3 不应被标记通过');

    // v3.5.0: manual 主门控（G3）无凭证 → 拒绝；有凭证 → 通过并入审批账本
    const artifact = path.join(dir, '.devflow', 'req-1', '02-design.md');
    fs.rmSync(dirDecoy, { recursive: true, force: true });
    fs.writeFileSync(artifact, '# design');
    expectThrow(() => engine.outputWritten(2, artifact), 'manual 主门控缺 --note');
    if (engine.state.gates.G3) errors.push('无凭证时 G3 不应被标记通过');
    try { engine.outputWritten(2, artifact, { note: '用户确认方案A' }); } catch (e) { errors.push(`带凭证合法产物被拒: ${e.message}`); }
    if (!engine.state.gates.G3) errors.push('带凭证合法产物未联动通过 G3');
    if (!engine.state.outputs['02-design.md']) errors.push('产物未记录到 outputs');
    const approval = engine.state.approvals && engine.state.approvals.G3;
    if (!approval || !approval.noteHash || approval.noteHash.length !== 16) errors.push('审批凭证未入账或哈希异常');

    // auto 主门控无需凭证（G6: 05-test-report.md）
    const reqDir = path.join(dir, '.devflow', 'req-1');
    fs.writeFileSync(path.join(reqDir, '05-test-report.md'), '# test');
    try { engine.outputWritten(5, path.join(reqDir, '05-test-report.md')); } catch (e) { errors.push(`auto 门不应要求凭证: ${e.message}`); }
    if (!engine.state.gates.G6) errors.push('auto 门未联动通过');

    return errors.length === 0
      ? { pass: true, detail: '校验全拒绝 ✅ manual 缺凭证拒 ✅ 凭证入账 ✅ auto 免凭证 ✅' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 5h: 状态可靠性 — 损坏备份 + 从事件日志重建（v3.5.0）
TESTS.push({
  name: 'Phase引擎 — state.json 损坏 → 备份 + journal 重建',
  run: () => {
    const { PhaseEngine, rebuildStateFromJournal } = require(path.join(ROOT, 'lib', 'phase-engine'));
    const dir = mkWorkspace();
    const engine = new PhaseEngine(dir);
    engine.setMode('lean');
    engine.setPhase(5, { force: true }); // 制造可重建的状态
    const stateFile = path.join(dir, '.devflow', 'state.json');

    // 写入损坏内容 → 新实例应从 journal 重建（mode=lean, phase=5），而非清零
    fs.writeFileSync(stateFile, '{ this is not json !!');
    const revived = new PhaseEngine(dir);
    const errors = [];
    if (revived.state.mode !== 'lean') errors.push(`未从 journal 重建 mode (期望 lean，实际 ${revived.state.mode})`);
    if (revived.state.currentPhase !== 5) errors.push(`未从 journal 重建 phase (期望 5，实际 ${revived.state.currentPhase})`);
    const backups = fs.readdirSync(path.join(dir, '.devflow')).filter(f => f.startsWith('state.json.corrupt-'));
    if (backups.length !== 1) errors.push(`损坏备份缺失 (期望 1 个，实际 ${backups.length})`);

    // 重建结果已持久化：再开新实例不再触发损坏路径
    const again = new PhaseEngine(dir);
    if (again.state.mode !== 'lean' || again.state.currentPhase !== 5) errors.push('重建状态未持久化');

    // 正常保存后无 .tmp 残留（原子写）
    revived.setMode('fast');
    const tmpLeft = fs.readdirSync(path.join(dir, '.devflow')).filter(f => f.endsWith('.tmp'));
    if (tmpLeft.length > 0) errors.push(`原子写残留 tmp 文件: ${tmpLeft.join(', ')}`);

    // rebuildStateFromJournal 纯函数：缺失日志返回 null
    if (rebuildStateFromJournal(path.join(dir, 'nonexistent.jsonl')) !== null) errors.push('缺失日志应返回 null');

    return errors.length === 0
      ? { pass: true, detail: '损坏 → 备份 + journal 重建（mode/phase 恢复）✅ 持久化 ✅ 原子写 ✅' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 5d: Version consistency — package.json version matches GO.md changelog header
TESTS.push({
  name: '版本一致性 — package.json vs GO.md/changelog',
  run: () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    const goMd = fs.readFileSync(path.join(ROOT, 'GO.md'), 'utf-8');
    // Extract version from package.json
    const pkgVersion = pkg.version;
    // Check GO.md has matching version in changelog (e.g., "### v3.2.2")
    const hasChangelogEntry = goMd.match(new RegExp(`v${pkgVersion.replace(/[.]/g, '\\.')}`));
    return hasChangelogEntry
      ? { pass: true, detail: `版本一致: ${pkgVersion} (package.json + GO.md changelog)` }
      : { pass: false, detail: `版本号不一致 — package.json: v${pkg.version}, GO.md 无匹配条目` };
  },
});

// Test 6: Party Mode 评分公式
TESTS.push({
  name: 'Party Mode — 评分维度完整',
  run: () => {
    const party = fs.readFileSync(path.join(DOMAINS_DIR, 'expertise/party-mode.md'), 'utf-8');
    const dims = ['成本', '性能', '可维护', '安全'].every(d => party.includes(d));
    return dims
      ? { pass: true, detail: '4 维评分: 成本/性能/可维护/安全' }
      : { pass: false, detail: '评分维度不完整' };
  },
});

// Test 7: 安装器 — 真实语法校验（历史 bug: 名为"可解析"却只做 includes() 文本匹配）
TESTS.push({
  name: '安装器 — install.js 通过 node --check 语法校验',
  run: () => {
    const { spawnSync } = require('child_process');
    const p = path.join(HARNESSES_DIR, 'install.js');
    if (!fs.existsSync(p)) return { pass: false, detail: 'install.js 不存在' };

    const r = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' });
    return r.status === 0
      ? { pass: true, detail: 'node --check 通过（真实语法校验，非文本匹配）' }
      : { pass: false, detail: `语法错误: ${(r.stderr || '').trim().split('\n').slice(0, 3).join(' ')}` };
  },
});

// Test 8: 钩子脚本 — 可执行
TESTS.push({
  name: '钩子 — JS 脚本可执行',
  run: () => {
    const hooks = ['gate-check.js', 'context-rot-monitor.js', 'token-monitor.js'];
    const errors = hooks.filter(h => {
      const p = path.join(DOMAINS_DIR, 'hooks', h);
      return !fs.existsSync(p) || !fs.readFileSync(p, 'utf-8').includes('#!/usr/bin/env node');
    });
    return errors.length === 0
      ? { pass: true, detail: `${hooks.length} 个钩子脚本就绪` }
      : { pass: false, detail: `问题脚本: ${errors.join(', ')}` };
  },
});

// Test 9: 渐进式披露 — 内核 SKILL.md < 200 行
TESTS.push({
  name: '渐进式披露 — 内核 < 200 行',
  run: () => {
    const lines = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8').split('\n').length;
    return lines < 200
      ? { pass: true, detail: `${lines} 行 (低于 200 行限制)` }
      : { pass: false, detail: `${lines} 行 (超过 200 行)` };
  },
});

// Test 10: 门控链一致性 — 产物名硬断言（回归守护 P0 #1 修复）
TESTS.push({
  name: '门控链 — 产物名硬断言 (G2/G7.5/G8)',
  run: () => {
    const { PHASES } = require(path.join(ROOT, 'lib/phase-engine'));
    const map = {};
    for (const p of PHASES) {
      const gates = [p.gate, ...(p.extraGates || [])];
      for (const g of gates) {
        if (!map[g]) map[g] = [];
        if (!map[g].includes(p.output)) map[g].push(p.output);
      }
    }
    const errors = [];
    if (!map['G2']) errors.push('G2 缺失 (修复前 gate-check.js 漏列)');
    if (!map['G7.5'] || !map['G7.5'].includes('07-canary.md')) errors.push(`G7.5 产物错误: ${JSON.stringify(map['G7.5'])} (应为 07-canary.md)`);
    if (map['G7.5'] && map['G7.5'].includes('07a-canary-report.md')) errors.push('G7.5 仍含错误产物 07a-canary-report.md');
    if (!map['G8'] || !map['G8'].includes('08-archive.md')) errors.push(`G8 产物错误: ${JSON.stringify(map['G8'])} (应为 08-archive.md)`);
    if (map['G8'] && map['G8'].includes('08-archive-manifest.md')) errors.push('G8 仍含错误产物 08-archive-manifest.md');
    const noArt = Object.keys(map).filter(g => map[g].length === 0);
    if (noArt.length) errors.push(`无产物的门控: ${noArt.join(', ')}`);
    return errors.length === 0
      ? { pass: true, detail: `G2✓ G7.5→07-canary.md✓ G8→08-archive.md✓ (共 ${Object.keys(map).length} 门控全部有产物)` }
      : { pass: false, detail: errors.join('\n') };
  },
});

// Test 10b: 双门控系统一致性 — gate-check.js 必须派生自单一权威源（回归守护）
TESTS.push({
  name: '双门控系统 — gate-check.js 派生自 phase-engine (无重复副本)',
  run: () => {
    const src = fs.readFileSync(path.join(DOMAINS_DIR, 'hooks', 'gate-check.js'), 'utf-8');
    const errors = [];
    if (!src.includes("require('../../lib/phase-engine')") && !src.includes('require("../../lib/phase-engine")')) {
      errors.push('gate-check.js 未从 lib/phase-engine.js 派生（存在双源漂移风险）');
    }
    if (src.includes('07a-canary-report.md')) errors.push('仍含错误产物名 07a-canary-report.md');
    if (src.includes('08-archive-manifest.md')) errors.push('仍含错误产物名 08-archive-manifest.md');
    return errors.length === 0
      ? { pass: true, detail: 'gate-check.js 为 phase-engine 的单一派生，无硬编码错误产物名' }
      : { pass: false, detail: errors.join('\n') };
  },
});

// Test 11: Phase 序列合法性 — 四种模式的 Phase 顺序不可逆
TESTS.push({
  name: 'Phase引擎 — 四种模式 Phase 序列符合预期',
  run: () => {
    const { PHASES } = require(path.join(ROOT, 'lib/phase-engine'));
    const expected = {
      fast:     [4, 5, 6],
      lean:     [2, 4, 5, 6, 8],
      standard: [0, 1, 1.5, 2, 2.5, 4, 5, 6, 7, 8],
      strict:   [0, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8],
    };
    let allOk = true;
    const errors = [];
    for (const [mode, expectedIds] of Object.entries(expected)) {
      const active = PHASES.filter(p => !p.skip.includes(mode)).map(p => p.id);
      const matches = expectedIds.every((id, i) => id === active[i]);
      if (!matches || active.length !== expectedIds.length) {
        errors.push(`${mode}: 期望 [${expectedIds}] 实际 [${active}]`);
        allOk = false;
      }
    }
    return allOk
      ? { pass: true, detail: '4 种模式 Phase 序列与 GO.md 定义一致' }
      : { pass: false, detail: errors.join('\n') };
  },
});

// Test 12: 门控护卫 — phase-engine.js nextPhase() 阻止未过门控的推进
TESTS.push({
  name: 'Phase引擎 — 门控护卫阻止非法推进',
  run: () => {
    const { PhaseEngine, PHASES } = require(path.join(ROOT, 'lib/phase-engine'));
    const e = new PhaseEngine(mkWorkspace());   // 隔离工作区，避免污染真实 .devflow/
    e.setMode('fast');
    const result = e.nextPhase();
    const blocked = result && result.blocked === true;
    return blocked
      ? { pass: true, detail: `nextPhase() 正确阻止: ${result.reason}` }
      : { pass: false, detail: `nextPhase() 未阻止非法推进 (应被 G5 拦截)` };
  },
});

// Test 12b: 模式切换残留 — 被跳过 Phase 的门控不误拦 nextPhase 传送
TESTS.push({
  name: 'Phase引擎 — 残留 Phase 不被已跳过门控误拦',
  run: () => {
    const { PhaseEngine } = require(path.join(ROOT, 'lib', 'phase-engine'));
    const e = new PhaseEngine(mkWorkspace());
    const errors = [];
    // 制造残留：standard 落在 Phase 2，切 fast 后 Phase 2 被跳过
    e.setMode('standard');
    e.setPhase(2, { force: true });
    e.setMode('fast'); // setMode 重置到 Phase 4，故直接手改残留再验证
    e.state.currentPhase = 2;
    const result = e.nextPhase();
    if (result.blocked) errors.push(`被已跳过 Phase 的门控误拦: ${result.reason}`);
    else if (e.state.currentPhase !== 4) errors.push(`应传送到 fast 起点 Phase 4，实际 ${e.state.currentPhase}`);
    return errors.length === 0
      ? { pass: true, detail: '残留 Phase 2 在 fast 下正确传送到 Phase 4，无误拦' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 12c: TaskPlanner — 环检测 / 未知依赖 / Kahn 拓扑重算 Wave
TESTS.push({
  name: 'TaskPlanner — 环检测 + Kahn 拓扑 + Wave 重算',
  run: () => {
    const { TaskPlanner } = require(path.join(ROOT, 'lib', 'task-planner'));
    const errors = [];
    const expectThrow = (planner, label) => {
      try { planner._assignWaves(); errors.push(`${label} 未被拒绝`); } catch { /* expected */ }
    };

    // 环: T1→T2→T1
    const cyc = new TaskPlanner();
    cyc.tasks = [
      { id: 'T1', name: 'a', deps: ['T2'] },
      { id: 'T2', name: 'b', deps: ['T1'] },
    ];
    expectThrow(cyc, '循环依赖');

    // 未知依赖: T1 依赖 TX
    const unk = new TaskPlanner();
    unk.tasks = [{ id: 'T1', name: 'a', deps: ['TX'] }];
    expectThrow(unk, '未知依赖');

    // wave 缺失/非法 → 按依赖深度重算，依赖永远在更早 Wave
    const p = new TaskPlanner();
    p.tasks = [
      { id: 'T1', name: 'base', deps: [] },                       // 无 wave 字段
      { id: 'T2', name: 'mid', deps: ['T1'], wave: 'NaN-bad' },   // 非法 wave
      { id: 'T3', name: 'top', deps: ['T2'], wave: 1 },           // 声称 wave 1（错）
    ];
    p._assignWaves();
    const w = Object.fromEntries(p.tasks.map(t => [t.id, t.wave]));
    if (w.T1 !== 1 || w.T2 !== 2 || w.T3 !== 3) errors.push(`Wave 重算错误: ${JSON.stringify(w)}`);
    if (p.waves.some((wave, i) => i > 0 && wave.wave <= p.waves[i - 1].wave)) errors.push('Wave 序列非严格递增');
    const depOk = p.tasks.every(t => (t.deps || []).every(d => w[d] < t.wave));
    if (!depOk) errors.push('存在依赖未落在更早 Wave');

    // loadFromFile 对环的任务文件抛错且带上下文
    const dir = mkWorkspace();
    const badFile = path.join(dir, 'tasks.json');
    fs.writeFileSync(badFile, JSON.stringify({ tasks: [{ id: 'A', deps: ['B'] }, { id: 'B', deps: ['A'] }] }));
    try { p.loadFromFile(badFile); errors.push('loadFromFile 未拒绝环任务文件'); } catch { /* expected */ }

    return errors.length === 0
      ? { pass: true, detail: '环/未知依赖拒绝 ✅ wave 重算（T1=1,T2=2,T3=3）✅ 文件加载校验 ✅' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 12d: Memory — id 唯一 + 搜索访问统计持久化（隔离工作区）
TESTS.push({
  name: 'Memory — id 唯一 + 访问统计落盘',
  run: () => {
    const { DevFlowMemory } = require(path.join(ROOT, 'lib', 'memory'));
    const m = new DevFlowMemory(mkWorkspace());
    const errors = [];
    const a = m.save('JWT 认证决策记录', ['auth']);
    const b = m.save('第二条记忆');
    if (a.id === b.id) errors.push('同毫秒保存 id 碰撞');
    m.search('JWT');
    const hit = m.short.find(e => e.id === a.id);
    if (!hit || hit.accessCount !== 2) errors.push(`搜索后访问统计未持久化 (期望 2，实际 ${hit ? hit.accessCount : 'null'})`);
    return errors.length === 0
      ? { pass: true, detail: 'id 唯一 ✅ 访问统计持久化 ✅（工作区隔离）' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 13: adapters 门控映射 — 按 phaseAfter 反查，杜绝 G${phase} 拼接导致的错位与静默放行
TESTS.push({
  name: 'adapters 门控 — 相位映射正确且无静默放行',
  run: () => {
    const { checkGate } = require(path.join(ROOT, 'adapters', 'shared', 'core-bridge.js'));
    const dir = mkWorkspace();
    fs.mkdirSync(path.join(dir, '.devflow'), { recursive: true });
    const errors = [];

    // 全相位映射: phaseAfter 反查结果必须与权威定义一致
    const expected = {
      0: ['G0'], 1: ['G1', 'G2'], 1.5: ['G2.5'], 2: ['G3'], 2.5: ['G3.5'],
      3: ['G4'], 4: ['G5'], 5: ['G6'], 6: ['G7'], 7: ['G7.5'], 8: ['G8'],
    };
    for (const [ph, exp] of Object.entries(expected)) {
      const r = checkGate(dir, Number(ph));
      // 无产物时必须 FAIL，绝不可静默放行
      if (r.passed !== false) errors.push(`Phase ${ph} 无产物却判定通过（静默放行）`);
      const mentioned = exp.every(g => r.reason.includes(g));
      if (!mentioned) errors.push(`Phase ${ph} 原因未含 ${exp.join('+')}: ${r.reason}`);
    }

    // 补产物后应通过（含 <req-id>/ 子目录与三层深度）
    const req = path.join(dir, '.devflow', 'req-001');
    fs.mkdirSync(path.join(req, 'waves', 'wave-1'), { recursive: true });
    fs.writeFileSync(path.join(req, '01b-context.md'), 'x');
    if (!checkGate(dir, 1.5).passed) errors.push('Phase 1.5 补产物后仍未通过');
    fs.writeFileSync(path.join(req, 'waves', 'wave-1', '04-wave-logs.md'), 'x');
    if (!checkGate(dir, 4).passed) errors.push('Phase 4 三层深度产物未找到');

    return errors.length === 0
      ? { pass: true, detail: '11 个相位映射正确，无静默放行，支持 req-id/ 与三层深度' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 14: 产物目录约定 — 全项目统一 .devflow/，杜绝 .specs/ 分裂
TESTS.push({
  name: '产物目录约定 — 统一为 .devflow/ (无 .specs/ 残留)',
  run: () => {
    const { execFileSync } = require('child_process');
    let out = '';
    try {
      out = execFileSync('git', ['grep', '-ln', '\\.specs/', '--', '*.md', '*.js'],
        { cwd: ROOT, encoding: 'utf8' });
    } catch (e) {
      // git grep 无匹配时退出码为 1，视为通过
      if (e.status === 1) return { pass: true, detail: '全项目无 .specs/ 引用' };
      return { pass: false, detail: `git grep 失败: ${e.message}` };
    }
    const files = out.trim().split('\n').filter(Boolean)
      // 排除本测试文件自身（其中的模式字符串）与审计报告（历史记录）
      .filter(f => !f.includes('DEEP-AUDIT') && !f.startsWith('test/all.js'));
    return files.length === 0
      ? { pass: true, detail: '全项目无 .specs/ 引用' }
      : { pass: false, detail: `仍有 .specs/ 引用: ${files.join(', ')}` };
  },
});

// Test 15: 文档↔引擎一致性 — GO.md 的 Phase 表门控编号必须与权威定义一致
// (历史 bug: GO.md 曾把 Phase 0 标为 G1、Phase 5 标为 G2，与权威定义不符)
TESTS.push({
  name: 'GO.md 文档 — Phase 表门控编号与权威定义一致',
  run: () => {
    const { PHASES } = require(path.join(ROOT, 'lib', 'phase-engine'));
    const goMd = fs.readFileSync(path.join(ROOT, 'GO.md'), 'utf-8');
    const errors = [];

    // 权威映射: phase id -> 门控 id 集合
    const authoritative = {};
    for (const p of PHASES) {
      authoritative[String(p.id)] = [p.gate, ...(p.extraGates || [])].sort().join(' + ');
    }

    // 解析 GO.md 「Phase 详细执行流程」表: | id | Phase | 文件 | 门控 | 核心内容 |
    const rows = goMd.split('\n')
      .filter(l => /^\|\s*\d(\.\d)?\s*\|/.test(l))
      .map(l => l.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1));

    let checked = 0;
    for (const row of rows) {
      const id = row[0];
      if (/^7-8|^\d+-\d+$/.test(id)) continue;   // 合并行跳过
      const gateCell = row[3] || '';
      if (!gateCell) continue;
      const expected = authoritative[id];
      if (!expected) { errors.push(`GO.md 出现未知 Phase id: ${id}`); continue; }
      const got = gateCell.split('+').map(s => s.trim()).sort().join(' + ');
      if (got !== expected) errors.push(`Phase ${id}: GO.md 写 ${gateCell}，权威定义 ${expected}`);
      checked++;
    }

    if (checked < 8) errors.push(`仅校验到 ${checked} 行，GO.md 表格格式可能已变更`);

    return errors.length === 0
      ? { pass: true, detail: `GO.md ${checked} 行 Phase 门控编号与权威定义一致` }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 16: AC 覆盖率 — G6 门控的真实度量（v3.4.0）
TESTS.push({
  name: 'AC 覆盖率 — 解析/阈值/失败用例/模式豁免',
  run: () => {
    const { checkACCoverage } = require(path.join(ROOT, 'lib', 'ac-coverage'));
    const dir = mkWorkspace();
    const reqDir = path.join(dir, '.devflow', 'req-9');
    fs.mkdirSync(reqDir, { recursive: true });
    const analysis = ['# A', '## 验收准则（AC）',
      '### AC-1 · 登录', '### AC-2 · 登出', '### AC-3 · 记住我', '### AC-4 · 密码重置'].join('\n');
    fs.writeFileSync(path.join(reqDir, '01-analysis.md'), analysis);
    const mkReport = (rows) => ['# T', '## 第 1 轮 · 功能测试',
      '| AC | 类型 | 用例 | 状态 |', '|---|---|---|---|', ...rows].join('\n');
    const errors = [];

    // 3/4 覆盖 = 75% < 90% → FAIL
    fs.writeFileSync(path.join(reqDir, '05-test-report.md'), mkReport([
      '| AC-1 | unit | `a.test.ts` | ✅ |', '| AC-2 | unit | `b.test.ts` | ✅ |', '| AC-3 | e2e | `c.spec.ts` | 🟡 |']));
    let r = checkACCoverage(dir);
    if (r.applicable !== true || r.pass !== false || r.coveredPct !== 75) errors.push(`75% 场景判定错误: pass=${r.pass} pct=${r.coveredPct}`);
    if (!r.uncovered.includes('AC-4')) errors.push('未报告 AC-4 未覆盖');

    // 100% 覆盖但含 ❌ → FAIL
    fs.writeFileSync(path.join(reqDir, '05-test-report.md'), mkReport([
      '| AC-1 | unit | `a.test.ts` | ✅ |', '| AC-2 | unit | `b.test.ts` | ❌ |',
      '| AC-3 | e2e | `c.spec.ts` | ✅ |', '| AC-4 | manual | UAT-1 | ✅ |']));
    r = checkACCoverage(dir);
    if (r.pass !== false || !r.failing.includes('AC-2')) errors.push('❌ 用例未拦截');

    // 100% 覆盖全 ✅ → PASS
    fs.writeFileSync(path.join(reqDir, '05-test-report.md'), mkReport([
      '| AC-1 | unit | `a.test.ts` | ✅ |', '| AC-2 | unit | `b.test.ts` | ✅ |',
      '| AC-3 | e2e | `c.spec.ts` | ✅ |', '| AC-4 | manual | UAT-1 | ✅ |']));
    r = checkACCoverage(dir);
    if (r.pass !== true || r.coveredPct !== 100) errors.push(`全通过场景判定错误: pass=${r.pass} pct=${r.coveredPct}`);

    // 无 AC 来源（Fast/Lean）→ 不适用且放行
    const fastDir = mkWorkspace();
    const fastReq = path.join(fastDir, '.devflow', 'req-f');
    fs.mkdirSync(fastReq, { recursive: true });
    fs.writeFileSync(path.join(fastReq, '05-test-report.md'), mkReport(['| AC-9 | unit | `x.test.ts` | ✅ |']));
    r = checkACCoverage(fastDir);
    if (r.applicable !== false || r.pass !== true) errors.push('Fast/Lean 无 AC 来源未豁免');

    return errors.length === 0
      ? { pass: true, detail: '75%<90% 拦截 ✅ ❌用例拦截 ✅ 100% 通过 ✅ 无AC来源豁免 ✅' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 17: 模板内容校验 — R13.11 双载体清单的机器化（v3.4.0）
TESTS.push({
  name: '模板内容校验 — 必填段落 + 占位符 + 无模板豁免',
  run: () => {
    const { checkTemplate } = require(path.join(ROOT, 'lib', 'template-check'));
    const dir = mkWorkspace();
    const errors = [];

    // 01-analysis.md 模板自带 6 段清单 → 合法产物（全段落 + 无占位符）通过
    const good = ['# ANALYSIS: req-1', '## 用户故事', '## 验收准则（AC）', '## 范围切分',
      '## 非功能性需求', '## 依赖与假设', '## 需求完整性检查（SDD 强制 · 融合 spec-kit）'].join('\n');
    const goodPath = path.join(dir, '01-analysis.md');
    fs.writeFileSync(goodPath, good);
    let r = checkTemplate(goodPath);
    if (!r.hasChecklist || !r.pass) errors.push(`合法产物未通过: ${r.reason}`);

    // 缺一个段落 → FAIL 且点名
    fs.writeFileSync(goodPath, good.replace('## 范围切分\n', ''));
    r = checkTemplate(goodPath);
    if (r.pass !== false || !r.missing.includes('范围切分')) errors.push(`缺段未拦截: ${JSON.stringify(r.missing)}`);

    // 残留 CJK 占位符 → FAIL
    fs.writeFileSync(goodPath, good + '\n作为 <角色>，我想 <动作>\n');
    r = checkTemplate(goodPath);
    if (r.pass !== false || !r.placeholders.includes('<角色>')) errors.push(`占位符未拦截: ${JSON.stringify(r.placeholders)}`);

    // 无同名模板 → 豁免
    const unknown = path.join(dir, '99-unknown.md');
    fs.writeFileSync(unknown, 'x');
    r = checkTemplate(unknown);
    if (r.hasTemplate !== false || r.pass !== true) errors.push('无模板场景未豁免');

    return errors.length === 0
      ? { pass: true, detail: '全段落通过 ✅ 缺段拦截 ✅ 占位符拦截 ✅ 无模板豁免 ✅' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 18: Git 链路 — 真实临时仓库上的 start/checkpoint/verify（v3.4.0）
TESTS.push({
  name: 'Git 链路 — 分支/提交/健康检查',
  run: () => {
    const { execFileSync } = require('child_process');
    const { GitBridge } = require(path.join(ROOT, 'lib', 'git-bridge'));
    const dir = mkWorkspace();
    const errors = [];

    // 搭建真实仓库（本地身份，避免依赖全局 git 配置）
    const g = (args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    g(['init', '-q']);
    g(['config', 'user.email', 'test@devflow']);
    g(['config', 'user.name', 'devflow-test']);
    fs.writeFileSync(path.join(dir, 'README.md'), 'init');
    g(['add', '.']);
    g(['commit', '-q', '-m', 'init']);
    const base = g(['rev-parse', '--abbrev-ref', 'HEAD']).trim();

    const bridge = new GitBridge(dir);
    // start: 创建分支 + 链路记录
    const s = bridge.start('req-001');
    if (!s.created || s.branch !== 'devflow/req-001') errors.push(`start 结果异常: ${JSON.stringify(s)}`);
    if (bridge.currentBranch() !== 'devflow/req-001') errors.push('未切换到 devflow/req-001');
    const link = bridge.readLink('req-001');
    if (!link || link.base !== base) errors.push('git.json 链路记录缺失或 base 错误');

    // verify: 未提交产物 → 不通过
    const reqDir = path.join(dir, '.devflow', 'req-001');
    fs.mkdirSync(reqDir, { recursive: true });
    fs.writeFileSync(path.join(reqDir, '00-strategy.md'), 'x');
    const v1 = bridge.verify();
    if (v1.pass !== false || v1.uncommittedArtifacts < 1) errors.push('未提交产物未被检出');

    // checkpoint: 提交流程产物 → verify 通过，分支提交数 ≥ 1
    const c = bridge.checkpoint('Phase 0 战略产物');
    if (!c.commit) errors.push('checkpoint 未产生提交');
    const v2 = bridge.verify();
    if (!v2.pass) errors.push(`checkpoint 后 verify 失败: ${v2.issues.join('; ')}`);
    const bc = bridge.branchCommits('req-001');
    if (!bc || bc.count < 1) errors.push('分支提交数统计错误');

    // 非法 req-id 拒绝
    let threw = false;
    try { bridge.start('bad/req'); } catch { threw = true; }
    if (!threw) errors.push('非法 req-id 未拒绝');

    return errors.length === 0
      ? { pass: true, detail: `start/checkpoint/verify 链路闭合 (base=${base})` }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 19: gate-check 内容级集成 — G6 联动 AC 覆盖 + adapters 存在性口径兼容
TESTS.push({
  name: 'gate-check — 内容级检查生效且 adapters 口径不变',
  run: () => {
    const gc = require(path.join(ROOT, 'domains', 'hooks', 'gate-check.js'));
    const { checkACCoverage } = require(path.join(ROOT, 'lib', 'ac-coverage'));
    const dir = mkWorkspace();
    const reqDir = path.join(dir, '.devflow', 'req-9');
    fs.mkdirSync(reqDir, { recursive: true });
    const errors = [];

    fs.writeFileSync(path.join(reqDir, '01-analysis.md'),
      '## 验收准则（AC）\n### AC-1 · a\n### AC-2 · b\n');
    // 报告只覆盖 1/2 = 50% < 90%
    fs.writeFileSync(path.join(reqDir, '05-test-report.md'),
      '| AC | 类型 | 用例 | 状态 |\n|---|---|---|---|\n| AC-1 | unit | `a.test.ts` | ✅ |');

    // 内容级开启: G6 必须因覆盖率不足失败
    const g6 = gc.GATE_MAP['G6'];
    if (gc.checkGate(g6, path.join(dir, '.devflow'), { content: true }) !== false) {
      errors.push('G6 内容级检查未拦截 50% 覆盖率');
    }
    // 存在性口径（adapters 依赖）: 产物存在即通过，行为不变
    if (gc.checkGate(g6, path.join(dir, '.devflow')) !== true) {
      errors.push('G6 存在性口径被内容级检查污染（adapters 契约破坏）');
    }

    // 全覆盖场景
    fs.writeFileSync(path.join(reqDir, '05-test-report.md'),
      '| AC | 类型 | 用例 | 状态 |\n|---|---|---|---|\n| AC-1 | unit | `a.test.ts` | ✅ |\n| AC-2 | unit | `b.test.ts` | ✅ |');
    if (!checkACCoverage(dir).pass) errors.push('100% 覆盖未通过');

    return errors.length === 0
      ? { pass: true, detail: 'G6 联动 AC 覆盖 ✅ 存在性口径兼容 ✅' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 20: 写入守卫 — 四条规则的判定矩阵（v3.5.0）
TESTS.push({
  name: '写入守卫 — R0/R1/R2/R3/R4 判定矩阵',
  run: () => {
    const { evaluatePreToolUse, isEngineOwnedState } = require(path.join(ROOT, 'lib', 'write-guard'));
    const mk = (o) => Object.assign({
      tool: 'Write', toolInput: { file_path: 'src/a.js' },
      state: { currentPhase: 2, mode: 'standard' }, devflowInitialized: true, currentBranch: 'master',
    }, o);
    const errors = [];
    const expect = (cond, label) => { if (!cond) errors.push(label); };

    expect(evaluatePreToolUse(mk({ devflowInitialized: false })).action === 'allow', 'R0 未初始化应放行');
    expect(evaluatePreToolUse(mk({ toolInput: { file_path: '.devflow/state.json' } })).action === 'block', 'R1 state.json 应拦截');
    expect(evaluatePreToolUse(mk({ toolInput: { file_path: '.devflow/state-events.jsonl' } })).action === 'block', 'R1 journal 应拦截');
    expect(evaluatePreToolUse(mk({ toolInput: { file_path: '.devflow/req-1/02-design.md' } })).action === 'allow', 'R2 产物应放行');
    expect(evaluatePreToolUse(mk({})).action === 'block', 'R3 Phase2 源码应拦截');
    expect(evaluatePreToolUse(mk({ state: { currentPhase: 5 } })).action === 'allow', 'R3 Phase5 源码应放行');
    expect(evaluatePreToolUse(mk({ toolInput: { file_path: 'docs/notes.md' } })).action === 'allow', 'R3 md 文件应放行');
    expect(evaluatePreToolUse(mk({ tool: 'Bash', toolInput: { command: 'git commit -m "x"' }, currentBranch: 'devflow/req-1' })).action === 'block', 'R4 无格式提交应拦截');
    expect(evaluatePreToolUse(mk({ tool: 'Bash', toolInput: { command: 'git commit -m "devflow(req-1): x"' }, currentBranch: 'devflow/req-1' })).action === 'allow', 'R4 格式提交应放行');
    expect(evaluatePreToolUse(mk({ tool: 'Bash', toolInput: { command: 'git commit -m "x"' }, currentBranch: 'master' })).action === 'allow', 'R4 非 devflow 分支应放行');
    expect(evaluatePreToolUse(mk({ tool: 'Bash', toolInput: { command: 'npm test' } })).action === 'allow', '非 git 命令应放行');
    expect(isEngineOwnedState('C:\\proj\\.devflow\\state.json') === true, 'isEngineOwnedState Windows 路径');
    expect(isEngineOwnedState('C:\\proj\\state.json') === false, 'isEngineOwnedState 非 .devflow 路径');

    return errors.length === 0
      ? { pass: true, detail: '13 项判定全部正确（含 Windows 路径形态）' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 21: Claude 托管合并 — 幂等/保留用户配置/可卸载（v3.5.0）
TESTS.push({
  name: 'Claude 托管合并 — 幂等 + 用户配置保留 + 卸载',
  run: () => {
    const { mergeManagedHooks, removeManagedHooks, applyClaudeHooks } = require(path.join(ROOT, 'lib', 'claude-hooks'));
    const os = require('os');
    const errors = [];
    const userSettings = {
      model: 'claude-opus-4-6',
      hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'my-own-guard.js' }] }] },
    };

    // 合并：保留用户条目 + 追加 DevFlow 条目
    const merged = mergeManagedHooks(userSettings, ROOT);
    const pre = merged.settings.hooks.PreToolUse;
    if (pre.length !== 2 || !JSON.stringify(pre).includes('my-own-guard.js')) errors.push('用户已有 hook 未保留');
    if (!merged.settings.hooks.Stop || merged.settings.hooks.Stop.length !== 1) errors.push('Stop 守卫未注册');
    if (merged.settings.model !== 'claude-opus-4-6') errors.push('非 hooks 字段被改动');

    // 幂等：再合并一次无新条目
    const again = mergeManagedHooks(merged.settings, ROOT);
    if (again.changed) errors.push('重复合并非幂等');
    if (again.settings.hooks.PreToolUse.length !== 2) errors.push('幂等合并后条目数变化');

    // 旧版本托管条目被替换而非叠加
    const stale = JSON.parse(JSON.stringify(merged.settings));
    stale.hooks.PreToolUse[1].hooks[0].command = 'node "/old/path/phase-write-guard.js" pretooluse';
    const upgraded = mergeManagedHooks(stale, ROOT);
    const guardCount = upgraded.settings.hooks.PreToolUse.filter(e => JSON.stringify(e).includes('phase-write-guard.js')).length;
    if (guardCount !== 1) errors.push(`旧托管条目未替换 (guard 条目 ${guardCount})`);

    // 卸载：只删托管条目，用户配置完好
    const removed = removeManagedHooks(merged.settings);
    if (removed.settings.hooks.PreToolUse.length !== 1 || !JSON.stringify(removed.settings.hooks).includes('my-own-guard.js')) errors.push('卸载后用户 hook 丢失');

    // applyClaudeHooks 在隔离 home 的完整流程（备份 + 写盘）
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'df-claude-'));
    const r1 = applyClaudeHooks({ homeDir: home, devflowRoot: ROOT });
    if (!r1.changed) errors.push('首次 apply 应有变更');
    const settingsOnDisk = JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf-8'));
    if (!settingsOnDisk.hooks.PreToolUse.some(e => JSON.stringify(e).includes('phase-write-guard.js'))) errors.push('apply 后 settings 无守卫条目');
    const r2 = applyClaudeHooks({ homeDir: home, devflowRoot: ROOT });
    if (r2.changed) errors.push('二次 apply 非幂等');
    const r3 = applyClaudeHooks({ homeDir: home, devflowRoot: ROOT, remove: true });
    const afterRemove = JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf-8'));
    if (r3.changed === false || JSON.stringify(afterRemove).includes('phase-write-guard.js')) errors.push('卸载未生效');

    try { fs.rmSync(home, { recursive: true, force: true }); } catch { /* 清理失败可忽略 */ }
    return errors.length === 0
      ? { pass: true, detail: '保留用户配置 ✅ 幂等 ✅ 旧条目替换 ✅ 卸载 ✅ 备份写盘 ✅' }
      : { pass: false, detail: errors.join('; ') };
  },
});

// Test 22: 适配器生成器 — 权威定义与生成块零漂移（v3.5.0）
TESTS.push({
  name: '适配器生成器 — gen-adapters --check 零漂移',
  run: () => {
    const { execFileSync } = require('child_process');
    try {
      const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'gen-adapters.js'), '--check'], {
        cwd: ROOT, encoding: 'utf8', timeout: 30000,
      });
      return { pass: true, detail: out.trim().split('\n').pop() };
    } catch (e) {
      return { pass: false, detail: `漂移检测失败: ${String(e.stdout || e.message).trim().split('\n').slice(-3).join(' ')}` };
    }
  },
});

// 运行
console.log('='.repeat(50));
console.log('🔬 DevFlow v3.5.0 完整性验证\n');

let passCount = 0, failCount = 0;

TESTS.forEach(t => {
  const result = t.run();
  const icon = result.pass ? '✅' : '❌';
  console.log(`${icon} ${t.name}`);
  console.log(`   ${result.detail}\n`);
  if (result.pass) passCount++; else failCount++;
});

cleanupWorkspaces();

console.log('='.repeat(50));
console.log(`结果: ${passCount} 通过, ${failCount} 失败, ${TESTS.length} 总计`);
console.log(`状态: ${failCount === 0 ? '✅ 全部通过' : '❌ 存在问题'}`);
// ASCII-only 结果行：Windows cmd (GBK) 与 CI 日志下中文/emoji 可能乱码，以此行为准
console.log(`RESULT: ${passCount}/${TESTS.length} passed, ${failCount} failed`);
console.log('='.repeat(50));

process.exit(failCount > 0 ? 1 : 0);
