#!/usr/bin/env node
/**
 * DevFlow Core Bridge — 运行时无关的核心桥接逻辑
 *
 * 统一入口：阶段路由、状态读取、记忆加载、门禁检查、Token 压缩
 * 所有运行时适配器 (Claude Code / Cursor / Copilot / Codex / Gemini CLI) 调用此模块。
 *
 * 设计原则: 零子进程、纯 Node.js、降级不报错
 */

const fs = require('fs');
const path = require('path');

// ─── 常量 ──────────────────────────────────────────────

const DEVFLOW_DIR = '.devflow';
const STATE_FILE = 'state.json';
const MEMORY_DIR = 'memory';
const LESSONS_FILE = 'LESSONS.md';

const RUNTIMES = {
  // DeepSeek Harness 排在最前：它由宿主注入进程级环境变量，是权威信号，
  // 应当盖过 .cursorrules / codex.yaml 之类的"文件存在性"启发式判断。
  // DSH 每个会话都设置 DSH_SESSION_ID（另有 DSH_HOME / DSH_SHELL / DSH_WEB_URL）。
  'deepseek-harness': { detect: () => !!process.env.DSH_SESSION_ID },
  // Claude Code hooks 环境会设置进程级 CLAUDECODE=1（不设置 CLAUDE_CODE_SESSION_ID）
  'claude-code': { detect: () => process.env.CLAUDECODE === '1' },
  'cursor': { detect: () => fs.existsSync('.cursorrules') || fs.existsSync('.cursor/rules') },
  'copilot': { detect: () => fs.existsSync('.github/copilot-instructions.md') },
  'codex': { detect: () => fs.existsSync('codex.yaml') || fs.existsSync('AGENTS.md') },
  'gemini-cli': { detect: () => fs.existsSync('.gemini/GEMINI.md') },
};

// ─── 运行时检测 ─────────────────────────────────────────

function detectRuntime() {
  for (const [name, rt] of Object.entries(RUNTIMES)) {
    if (rt.detect()) return name;
  }
  return 'unknown';
}

// ─── 项目状态 ───────────────────────────────────────────

function findProjectDir(startDir = process.cwd()) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, DEVFLOW_DIR))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function readState(projectDir) {
  const statePath = path.join(projectDir, DEVFLOW_DIR, STATE_FILE);
  if (!fs.existsSync(statePath)) return { phase: 0, mode: 'standard', progress: 0, gates: {}, outputs: {} };

  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return {
      phase: typeof state.currentPhase === 'number' ? state.currentPhase : 0,
      mode: state.mode || 'standard',
      progress: 0,
      gates: state.gates || {},
      outputs: state.outputs || {},
      rawContent: JSON.stringify(state),
    };
  } catch (e) {
    return { phase: 0, mode: 'standard', progress: 0, gates: {}, outputs: {} };
  }
}

// ─── 门禁检查 ───────────────────────────────────────────

/**
 * 按 Phase 反查其全部门控。
 *
 * ⚠️ 历史 bug: 曾用 `G${targetPhase}` 字符串拼接门控 id。Phase id 与 Gate id
 * 并非该映射关系 —— phase 1.5 拼出 "G1.5"(不存在) 导致零校验放行，
 * phase 7 拼出 G7(应为 G7.5) 导致校验了 Phase 6 的门。现改为按 phaseAfter 反查。
 */
function gatesForPhase(gateRules, targetPhase) {
  return Object.values(gateRules).filter(rule => rule.phaseAfter === targetPhase);
}

function checkGate(projectDir, targetPhase) {
  const gateRules = loadGateRules(projectDir);
  const requiredGates = gatesForPhase(gateRules, targetPhase);

  // 未知 Phase / 无对应门控 —— 必须阻断，绝不可静默放行
  if (requiredGates.length === 0) {
    return {
      passed: false,
      missingArtifacts: [],
      reason: `未知或无需门控的 Phase: ${targetPhase}`,
    };
  }

  const missingArtifacts = [];
  for (const rule of requiredGates) {
    for (const artifact of (rule.artifacts || [])) {
      if (!findArtifact(projectDir, artifact)) missingArtifacts.push(artifact);
    }
  }

  const gateIds = requiredGates.map(g => g.id).join(' + ');
  return {
    passed: missingArtifacts.length === 0,
    missingArtifacts,
    reason: missingArtifacts.length > 0
      ? `Missing artifacts for ${gateIds} (phase ${targetPhase}): ${missingArtifacts.join(', ')}`
      : `All artifacts present for ${gateIds}`,
  };
}

/** 递归收集 .devflow/ 下所有子目录（限深 3 层，配合 <req-id>/waves/wave-{N}/ 布局） */
function collectDevflowDirs(dir, depth = 0, out = []) {
  if (depth > 3) return out;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch { return out; }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    out.push(full);
    collectDevflowDirs(full, depth + 1, out);
  }
  return out;
}

/** 定位产物：.devflow/ 根 → 各级 <req-id>/ 子目录 → 项目根（与 gate-checker.js resolveArtifactPath 顺序一致） */
function findArtifact(projectDir, name) {
  const devflowRoot = path.join(projectDir, DEVFLOW_DIR);
  const candidates = [
    path.join(devflowRoot, name),
    ...collectDevflowDirs(devflowRoot).map(d => path.join(d, name)),
    path.join(projectDir, name),
  ];
  return candidates.find(p => fs.existsSync(p)) || null;
}

/**
 * 加载门控规则 —— 单一权威源派生自 lib/phase-engine.js。
 * 不再维护硬编码副本（历史 bug: 与权威定义漂移，产物名错误）。
 */
function loadGateRules(projectDir) {
  const candidates = [
    path.join(__dirname, '..', '..', 'lib', 'phase-engine'),
    path.join(projectDir, 'lib', 'phase-engine'),
  ];
  for (const p of candidates) {
    try {
      const { GATES, PHASES } = require(p);
      const map = {};
      for (const g of GATES) {
        map[g.id] = { id: g.id, name: g.name, type: g.type, phaseAfter: g.phaseAfter, artifacts: [] };
      }
      for (const phase of PHASES) {
        for (const gid of [phase.gate, ...(phase.extraGates || [])]) {
          if (map[gid] && !map[gid].artifacts.includes(phase.output)) {
            map[gid].artifacts.push(phase.output);
          }
        }
      }
      return map;
    } catch (e) { /* 尝试下一个候选 */ }
  }

  // 兜底: 静态门控规则 (键为 gate id, phaseAfter 与 phase-engine 权威定义保持一致)
  return {
    G0:    { id: 'G0',   phaseAfter: 0,   artifacts: ['00-strategy.md'],    label: 'Strategy',     type: 'auto' },
    G1:    { id: 'G1',   phaseAfter: 1,   artifacts: ['01-analysis.md'],    label: 'Analysis',     type: 'auto' },
    G2:    { id: 'G2',   phaseAfter: 1,   artifacts: ['01-analysis.md'],    label: 'Architecture', type: 'manual' },
    'G2.5':{ id: 'G2.5', phaseAfter: 1.5, artifacts: ['01b-context.md'],    label: 'Discuss',      type: 'manual' },
    G3:    { id: 'G3',   phaseAfter: 2,   artifacts: ['02-design.md'],      label: 'Design',       type: 'manual' },
    'G3.5':{ id: 'G3.5', phaseAfter: 2.5, artifacts: ['02a-variants.md'],   label: 'Shotgun',      type: 'manual' },
    G4:    { id: 'G4',   phaseAfter: 3,   artifacts: ['03-tasks.md'],       label: 'TaskPlan',     type: 'auto' },
    G5:    { id: 'G5',   phaseAfter: 4,   artifacts: ['04-wave-logs.md'],   label: 'Build',        type: 'manual' },
    G6:    { id: 'G6',   phaseAfter: 5,   artifacts: ['05-test-report.md'], label: 'Test',         type: 'auto' },
    G7:    { id: 'G7',   phaseAfter: 6,   artifacts: ['06-review.md'],      label: 'Review',       type: 'manual' },
    'G7.5':{ id: 'G7.5', phaseAfter: 7,   artifacts: ['07-canary.md'],      label: 'Canary',       type: 'manual' },
    G8:    { id: 'G8',   phaseAfter: 8,   artifacts: ['08-archive.md'],     label: 'Archive',      type: 'auto' },
  };
}

// ─── 记忆加载 ───────────────────────────────────────────

function loadMemory(projectDir) {
  const memoryDir = path.join(projectDir, DEVFLOW_DIR, MEMORY_DIR);
  const result = { projectContext: '', decisions: [], knownFailures: [], lessons: '' };

  if (!fs.existsSync(memoryDir)) return result;

  // 加载 LESSONS.md
  const lessonsPath = path.join(memoryDir, LESSONS_FILE);
  if (fs.existsSync(lessonsPath)) {
    result.lessons = fs.readFileSync(lessonsPath, 'utf8');
  }

  // 加载 state.json 作为项目上下文
  const statePath = path.join(projectDir, DEVFLOW_DIR, STATE_FILE);
  if (fs.existsSync(statePath)) {
    result.projectContext = fs.readFileSync(statePath, 'utf8');
  }

  return result;
}

// ─── Token 压缩级别 ────────────────────────────────────

function getCompressionLevel(projectDir) {
  const configPath = path.join(projectDir, DEVFLOW_DIR, 'config.yaml');
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const match = content.match(/caveman:\s*\n\s*level:\s*(lite|full|ultra|extreme)/);
    if (match) return match[1];
  }
  return 'full'; // 默认压缩级别
}

// ─── 导出 ───────────────────────────────────────────────

module.exports = {
  detectRuntime,
  findProjectDir,
  readState,
  checkGate,
  loadGateRules,
  loadMemory,
  getCompressionLevel,
  DEVFLOW_DIR,
  STATE_FILE,
  RUNTIMES,
};

// ─── CLI 入口 ───────────────────────────────────────────
//
// 各适配器文档（claude-code/install.md、codex/codex.yaml、gemini-cli/install.md、
// adapters/README.md）示范的命令行用法在此落地：
//   node core-bridge.js detect-runtime       打印 detectRuntime() 结果
//   node core-bridge.js read-state <dir>     读取并打印 <dir>/.devflow/state.json

if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'detect-runtime': {
      console.log(detectRuntime());
      break;
    }
    case 'read-state': {
      const dir = process.argv[3];
      if (!dir) {
        console.error('Usage: core-bridge.js read-state <dir>');
        process.exit(1);
      }
      const statePath = path.join(dir, DEVFLOW_DIR, STATE_FILE);
      if (!fs.existsSync(statePath)) {
        console.error(`未找到状态文件: ${statePath}`);
        process.exit(1);
      }
      console.log(fs.readFileSync(statePath, 'utf8'));
      break;
    }
    default:
      console.log('DevFlow Core Bridge');
      console.log('Commands: detect-runtime | read-state <dir>');
  }
}
