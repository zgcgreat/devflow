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
    const CMDS = ['init', 'status', 'phase', 'detect', 'task', 'mem', 'party', 'code', 'caveman', 'gates', 'install', 'doctor'];
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

// Test 5f: setPhase — 相位切换与非法值防护（守护 --phase 不再是死参数）
TESTS.push({
  name: 'setPhase — 相位切换生效且拒绝非法值',
  run: () => {
    const { PhaseEngine } = require(path.join(ROOT, 'lib', 'phase-engine'));
    const engine = new PhaseEngine(mkWorkspace());
    const errors = [];

    engine.setMode('standard');
    engine.setPhase(5);
    if (engine.state.currentPhase !== 5) errors.push(`setPhase(5) 未生效: ${engine.state.currentPhase}`);

    // 非法 Phase 必须抛错
    let threw = false;
    try { engine.setPhase(99); } catch { threw = true; }
    if (!threw) errors.push('setPhase(99) 未拒绝非法值');

    // 当前模式下被跳过的 Phase 必须拒绝（除非 force）
    engine.setMode('fast');
    let blocked = false;
    try { engine.setPhase(0); } catch { blocked = true; }
    if (!blocked) errors.push('fast 模式下 setPhase(0) 未被拦截');

    try { engine.setPhase(0, { force: true }); } catch (e) { errors.push(`force 切换失败: ${e.message}`); }
    if (engine.state.currentPhase !== 0) errors.push('force 切换未生效');

    return errors.length === 0
      ? { pass: true, detail: '相位切换生效，非法值与跨模式切换均被拒绝' }
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

// 运行
console.log('='.repeat(50));
console.log('🔬 DevFlow v3.3.0 完整性验证\n');

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
