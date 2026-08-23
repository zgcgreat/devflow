#!/usr/bin/env node
/**
 * ForgeOS Core Bridge — 运行时无关的核心桥接逻辑
 *
 * 统一入口：阶段路由、状态读取、记忆加载、门禁检查、Token 压缩
 * 所有运行时适配器 (Claude Code / Cursor / Copilot / Codex / Gemini CLI) 调用此模块。
 *
 * 设计原则: 零子进程、纯 Node.js、降级不报错
 */

const fs = require('fs');
const path = require('path');

// ─── 常量 ──────────────────────────────────────────────

const FORGEOS_DIR = '.forgeos';
const STATE_FILE = 'STATE.md';
const MEMORY_DIR = 'memory';
const LESSONS_FILE = 'LESSONS.md';

const RUNTIMES = {
  'claude-code': { detect: () => !!process.env.CLAUDE_CODE_SESSION_ID },
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
    if (fs.existsSync(path.join(dir, FORGEOS_DIR))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function readState(projectDir) {
  const statePath = path.join(projectDir, FORGEOS_DIR, STATE_FILE);
  if (!fs.existsSync(statePath)) return { phase: 0, mode: 'standard', progress: 0, gateStatus: {} };

  const content = fs.readFileSync(statePath, 'utf8');
  const phaseMatch = content.match(/current_phase:\s*(\d+(?:\.\d+)?)/i);
  const modeMatch = content.match(/mode:\s*(fast|lean|standard|strict)/i);
  const progressMatch = content.match(/progress:\s*(\d+)%/i);

  return {
    phase: phaseMatch ? parseFloat(phaseMatch[1]) : 0,
    mode: modeMatch ? modeMatch[1] : 'standard',
    progress: progressMatch ? parseInt(progressMatch[1]) : 0,
    rawContent: content,
  };
}

// ─── 门禁检查 ───────────────────────────────────────────

function checkGate(projectDir, targetPhase) {
  const state = readState(projectDir);
  const gateRules = loadGateRules(projectDir);

  const requiredGate = `G${targetPhase}`;
  const rule = gateRules[requiredGate];

  if (!rule) return { passed: true, missingArtifacts: [], reason: 'No gate rule defined' };

  const missingArtifacts = rule.artifacts
    .filter(artifact => !fs.existsSync(path.join(projectDir, artifact)))
    .filter(artifact => !fs.existsSync(path.join(projectDir, FORGEOS_DIR, artifact)));

  return {
    passed: missingArtifacts.length === 0,
    missingArtifacts,
    reason: missingArtifacts.length > 0
      ? `Missing artifacts for G${targetPhase}: ${missingArtifacts.join(', ')}`
      : 'All artifacts present',
  };
}

function loadGateRules(projectDir) {
  const gateCheckPath = path.join(projectDir, 'domains', 'hooks', 'gate-check.js');
  if (fs.existsSync(gateCheckPath)) {
    try {
      const gateModule = require(gateCheckPath);
      if (gateModule.GATES) return gateModule.GATES;
    } catch (e) { /* fallback */ }
  }

  // Fallback: 静态门控规则
  return {
    G0: { phase: 0, artifacts: [], label: 'Strategy', type: 'manual' },
    G1: { phase: 1, artifacts: ['00-strategy.md'], label: 'Analysis', type: 'manual' },
    G2: { phase: 1, artifacts: ['01-analysis.md'], label: 'Requirements', type: 'auto' },
    'G2.5': { phase: 1.5, artifacts: ['CONTEXT.md'], label: 'Discuss', type: 'manual' },
    G3: { phase: 2, artifacts: ['02-design.md'], label: 'Design', type: 'manual' },
    'G3.5': { phase: 2.5, artifacts: ['02a-variants.md'], label: 'Shotgun', type: 'manual' },
    G4: { phase: 3, artifacts: ['03-tasks.md'], label: 'TaskPlan', type: 'auto' },
    G5: { phase: 4, artifacts: [], label: 'Build', type: 'auto' },
    G6: { phase: 5, artifacts: ['05-test-results.md'], label: 'Test', type: 'auto' },
    G7: { phase: 6, artifacts: ['06-review.md'], label: 'Review', type: 'manual' },
    'G7.5': { phase: 7, artifacts: ['07a-canary-report.md'], label: 'Canary', type: 'manual' },
    G8: { phase: 8, artifacts: ['08-archive-manifest.md'], label: 'Archive', type: 'auto' },
  };
}

// ─── 记忆加载 ───────────────────────────────────────────

function loadMemory(projectDir) {
  const memoryDir = path.join(projectDir, FORGEOS_DIR, MEMORY_DIR);
  const result = { projectContext: '', decisions: [], knownFailures: [], lessons: '' };

  if (!fs.existsSync(memoryDir)) return result;

  // 加载 LESSONS.md
  const lessonsPath = path.join(memoryDir, LESSONS_FILE);
  if (fs.existsSync(lessonsPath)) {
    result.lessons = fs.readFileSync(lessonsPath, 'utf8');
  }

  // 加载 STATE.md 作为项目上下文
  const statePath = path.join(projectDir, FORGEOS_DIR, STATE_FILE);
  if (fs.existsSync(statePath)) {
    result.projectContext = fs.readFileSync(statePath, 'utf8');
  }

  return result;
}

// ─── Token 压缩级别 ────────────────────────────────────

function getCompressionLevel(projectDir) {
  const configPath = path.join(projectDir, FORGEOS_DIR, 'config.yaml');
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
  FORGEOS_DIR,
  STATE_FILE,
  RUNTIMES,
};
