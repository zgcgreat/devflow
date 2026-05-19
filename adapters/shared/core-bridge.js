#!/usr/bin/env node
/**
 * Core Bridge — 运行时无关的核心逻辑
 * 
 * 所有运行时适配器调用此模块获取 devflow 状态和功能。
 * 零子进程设计：纯文件系统读写，不 spawn 外部进程。
 * 
 * 用法:
 *   const bridge = require('./core-bridge');
 *   const state = bridge.readState(projectDir);
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = '.devflow/STATE.md';
const CONFIG_FILE = '.devflow/config.yaml';
const MEMORY_DIR = '.devflow/memory';

/**
 * 读取项目状态
 */
function readState(projectDir) {
  const statePath = path.join(projectDir, STATE_FILE);
  
  if (!fs.existsSync(statePath)) {
    return { phase: null, mode: null, progress: 0, gateStatus: 'uninitialized' };
  }
  
  const content = fs.readFileSync(statePath, 'utf8');
  const state = {};
  
  const patterns = {
    phase: /当前阶段[:\s]*([^\n]+)/i,
    mode: /模式[:\s]*([^\n]+)/i,
    phaseStatus: /阶段状态[:\s]*([^\n]+)/i,
    reqId: /当前Req[:\s]*([^\n]+)/i,
    taskId: /当前Task[:\s]*([^\n]+)/i,
    progress: /完成进度[:\s]*([^\n]+)/i,
    nextPhase: /下一阶段[:\s]*([^\n]+)/i
  };
  
  for (const [key, regex] of Object.entries(patterns)) {
    const match = content.match(regex);
    if (match) state[key] = match[1].trim();
  }
  
  // 计算进度
  if (!state.progress) {
    const phaseNum = parseInt((state.phase || '0').split('-')[0], 10) || 0;
    state.progress = Math.min(phaseNum * 10 + (state.phaseStatus?.includes('completed') ? 10 : 5), 100);
  }
  
  return state;
}

/**
 * 门禁检查
 */
function checkGate(projectDir, targetPhase) {
  const state = readState(projectDir);
  
  if (!state.phase) {
    return { passed: false, missingArtifacts: [], reason: '项目未初始化' };
  }
  
  // 定义阶段依赖和必需产物
  const gateRequirements = {
    '0': { requires: [], artifacts: [] },
    '1': { requires: ['0'], artifacts: ['00-requirements.md'] },
    '2': { requires: ['1'], artifacts: ['01-analysis.md'] },
    '2a': { requires: ['2'], artifacts: ['02-design.md'] },
    '3': { requires: ['2'], artifacts: ['02-design.md'] },
    '4': { requires: ['3'], artifacts: ['03-tasks.md'] },
    '5': { requires: ['4'], artifacts: ['04-dev-log.md'] },
    '6': { requires: ['5'], artifacts: ['05-test-report.md'] },
    '7': { requires: ['6'], artifacts: ['06-code-review.md'] },
    '8': { requires: ['7'], artifacts: ['07-release-checklist.md'] }
  };
  
  const target = targetPhase || state.phase;
  const targetKey = target.split('-')[0];
  const req = gateRequirements[targetKey] || { requires: [], artifacts: [] };
  
  // 检查前置阶段
  const currentPhaseNum = parseInt((state.phase || '0').split('-')[0], 10) || 0;
  const targetPhaseNum = parseInt(targetKey, 10) || 0;
  
  if (targetPhaseNum > currentPhaseNum + 1) {
    return { 
      passed: false, 
      missingArtifacts: req.artifacts,
      reason: `阶段跳跃：当前 ${state.phase}，目标 ${target}，缺少中间阶段`
    };
  }
  
  // 检查产物文件
  const missingArtifacts = [];
  for (const artifact of req.artifacts) {
    const reqId = state.reqId || 'default';
    const artifactPath = path.join(projectDir, '.devflow', reqId, artifact);
    if (!fs.existsSync(artifactPath)) {
      missingArtifacts.push(artifact);
    }
  }
  
  if (missingArtifacts.length > 0) {
    return {
      passed: false,
      missingArtifacts,
      reason: `缺少必需产物: ${missingArtifacts.join(', ')}`
    };
  }
  
  return { passed: true, missingArtifacts: [], reason: null };
}

/**
 * 加载记忆
 */
function loadMemory(projectDir) {
  const memoryPath = path.join(projectDir, MEMORY_DIR);
  
  if (!fs.existsSync(memoryPath)) {
    return { projectContext: null, decisions: null, knownFailures: null, lessons: null };
  }
  
  const memoryFiles = {
    projectContext: 'PROJECT_CONTEXT.md',
    decisions: 'DECISIONS.md',
    knownFailures: 'KNOWN_FAILURES.md',
    lessons: 'LESSONS.md'
  };
  
  const result = {};
  for (const [key, file] of Object.entries(memoryFiles)) {
    const filePath = path.join(memoryPath, file);
    if (fs.existsSync(filePath)) {
      result[key] = fs.readFileSync(filePath, 'utf8');
    } else {
      result[key] = null;
    }
  }
  
  return result;
}

/**
 * 获取当前压缩级别
 */
function getCompressionLevel(projectDir) {
  const configPath = path.join(projectDir, CONFIG_FILE);
  
  if (!fs.existsSync(configPath)) {
    return 'full'; // 默认级别
  }
  
  const content = fs.readFileSync(configPath, 'utf8');
  const match = content.match(/caveman:\s*\n\s*level:\s*(\w+)/i);
  
  const validLevels = ['lite', 'full', 'ultra', 'wenyan-lite', 'wenyan-full', 'wenyan-ultra', 'extreme'];
  const level = match ? match[1] : 'full';
  
  return validLevels.includes(level) ? level : 'full';
}

/**
 * 运行时检测
 */
function detectRuntime() {
  const env = process.env;
  
  // Claude Code
  if (env.CLAUDE_CODE_SESSION || env.CLAUDE_CONFIG_DIR) return 'claude-code';
  
  // Cursor
  if (env.CURSOR_TRACE_ID || env.CURSOR_SESSION) return 'cursor';
  
  // Copilot
  if (env.GITHUB_COPILOT_TOKEN || env.COPILOT_SESSION) return 'copilot';
  
  // Codex
  if (env.CODEX_SESSION || env.OPENAI_API_KEY && env.CODEX_HOME) return 'codex';
  
  // Gemini CLI
  if (env.GEMINI_CLI_SESSION || env.GOOGLE_API_KEY && env.GEMINI_HOME) return 'gemini-cli';
  
  // Windsurf
  if (env.WINDSURF_SESSION || env.CODEIUM_SESSION) return 'windsurf';
  
  return 'unknown';
}

/**
 * 获取运行时特定的配置模板路径
 */
function getAdapterConfigPath(runtime) {
  const adaptersDir = path.join(__dirname, '..');
  const runtimeDir = path.join(adaptersDir, runtime);
  
  if (!fs.existsSync(runtimeDir)) {
    return null;
  }
  
  return runtimeDir;
}

module.exports = {
  readState,
  checkGate,
  loadMemory,
  getCompressionLevel,
  detectRuntime,
  getAdapterConfigPath
};
