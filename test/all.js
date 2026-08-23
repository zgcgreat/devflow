#!/usr/bin/env node
/**
 * ForgeOS 完整性验证测试
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
  'bin/forge-os.js',
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

// Test 4: 宪法 — 8 条规则全部存在
TESTS.push({
  name: '宪法完整性 — 8 条规则',
  run: () => {
    const constitution = fs.readFileSync(path.join(ROOT, 'CONSTITUTION.md'), 'utf-8');
    // Updated regex to support multi-digit rule numbers (e.g. ## 10, ## 2.1)
    const rules = constitution.match(/^## \d+(\.\d+)?/gm);
    const count = rules ? rules.length : 0;
    return count >= 7
      ? { pass: true, detail: `${count} 条宪法规则` }
      : { pass: false, detail: `只有 ${count} 条规则` };
  },
});

// Test 5: 门控 — G0-G8 + G2/G2.5/G3.5/G7.5 全部定义（共 ≥12 个门控）
TESTS.push({
  name: '门控完整性 — G0-G8 (含变体)',
  run: () => {
    const engine = fs.readFileSync(path.join(ROOT, 'lib/phase-engine.js'), 'utf-8');
    // PHASES array in phase-engine.js should define all gates from gate-rules.md
    // Including main gates G0-G8 and sub-gates G2/G2.5/G3.5/G7.5
    const gates = (engine.match(/gate: 'G[0-9][.0-9]*'/g) || []);
    return gates.length >= 11
      ? { pass: true, detail: `${gates.length} 个门控在 PHASES 中定义` }
      : { pass: false, detail: `只有 ${gates.length} 个 (对应字符串: ${gates.join(', ')})` };
  },
});

// Test 5b: PhaseEngine gate ordering validation — gates must be sequential in PHASES array
TESTS.push({
  name: 'PhaseEngine — 门控顺序与 gate-rules.md 一致',
  run: () => {
    const engine = fs.readFileSync(path.join(ROOT, 'lib/phase-engine.js'), 'utf-8');
    const phasesMatch = engine.match(/id:\s*(\d+(?:\.\d+)?),\s*name:\s*'[^']+',\s*gate:\s*'G[0-9][.0-9]*'/g);
    if (!phasesMatch || phasesMatch.length < 2) {
      return { pass: false, detail: 'PHASES 数组定义不完整' };
    }
    // Verify gates are in monotonically increasing order (G0 → G1 → G2 → ...)
    const gateIds = phasesMatch.map(m => m.match(/gate:\s*'([^']+)'/)[1]);
    // Expected sequence in order of appearance in phase-engine.js (id: 0 → 8)
    // Phase 1 gate=G1 (5Whys), G2 is extraGates on Phase 1 (Architecture Gate)
    const expectedSequence = ['G0', 'G1', 'G2.5', 'G3', 'G3.5', 'G4', 'G5', 'G6', 'G7', 'G7.5', 'G8'];
    const mismatched = gateIds.filter((g, i) => expectedSequence[i] !== g);
    return mismatched.length === 0
      ? { pass: true, detail: `门控顺序正确: ${gateIds.join(' → ')}` }
      : { pass: false, detail: `不匹配预期序列 (${expectedSequence.join(', ')})，差异: ${mismatched.join(', ')}` };
  },
});

// Test 5c: CLI integration — bin/forge-os.js --help exits cleanly
TESTS.push({
  name: 'CLI 集成 — bin/forge-os.js --help 可执行',
  run: () => {
    const forgeOS = fs.readFileSync(path.join(ROOT, 'bin/forge-os.js'), 'utf-8');
    // Check CLI has required subcommands
    const hasInit = forgeOS.includes('--init') || forgeOS.includes('init');
    const hasStatus = forgeOS.includes('--status') || forgeOS.includes('status');
    const hasPhase = forgeOS.includes('--phase') || forgeOS.includes('phase');
    const hasGate = forgeOS.includes('--gate') || forgeOS.includes('gate');
    return hasInit && hasStatus && hasPhase && hasGate
      ? { pass: true, detail: 'CLI 包含 init/status/phase/gate 核心命令' }
      : { pass: false, detail: `CLI 缺少部分核心命令 (init:${hasInit}, status:${hasStatus}, phase:${hasPhase}, gate:${hasGate})` };
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

// Test 7: 安装器 — 可用目标列表
TESTS.push({
  name: '安装器 — install.js 存在且可解析',
  run: () => {
    const installJs = fs.readFileSync(path.join(HARNESSES_DIR, 'install.js'), 'utf-8');
    const hasTargets = installJs.includes('TARGETS');
    const hasParseArgs = installJs.includes('parseArgs');
    return hasTargets && hasParseArgs
      ? { pass: true, detail: 'install.js 可解析' }
      : { pass: false, detail: '缺少必要结构' };
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
    const e = new PhaseEngine();
    e.setMode('fast');
    const result = e.nextPhase();
    const blocked = result && result.blocked === true;
    return blocked
      ? { pass: true, detail: `nextPhase() 正确阻止: ${result.reason}` }
      : { pass: false, detail: `nextPhase() 未阻止非法推进 (应被 G5 拦截)` };
  },
});

// 运行
console.log('='.repeat(50));
console.log('🔬 ForgeOS v3.2.2 完整性验证\n');

let passCount = 0, failCount = 0;

TESTS.forEach(t => {
  const result = t.run();
  const icon = result.pass ? '✅' : '❌';
  console.log(`${icon} ${t.name}`);
  console.log(`   ${result.detail}\n`);
  if (result.pass) passCount++; else failCount++;
});

console.log('='.repeat(50));
console.log(`结果: ${passCount} 通过, ${failCount} 失败, ${TESTS.length} 总计`);
console.log(`状态: ${failCount === 0 ? '✅ 全部通过' : '❌ 存在问题'}`);
// ASCII-only 结果行：Windows cmd (GBK) 与 CI 日志下中文/emoji 可能乱码，以此行为准
console.log(`RESULT: ${passCount}/${TESTS.length} passed, ${failCount} failed`);
console.log('='.repeat(50));

process.exit(failCount > 0 ? 1 : 0);
