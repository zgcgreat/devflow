#!/usr/bin/env node
/**
 * Statusline Hook
 * 
 * 用途: 更新和显示项目状态栏
 * 触发: 每次阶段切换、任务完成、或用户请求时
 * 
 * 用法: node hooks/statusline.js [--project-dir <path>] [--format mini|full]
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = '.ultimate-workflow/STATE.md';
const CONFIG_FILE = '.ultimate-workflow/config.yaml';

// ANSI 颜色
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  log(`  ${title}`, 'blue');
  console.log('='.repeat(60));
}

/**
 * 读取 STATE.md
 */
function readState(projectDir) {
  const statePath = path.join(projectDir, STATE_FILE);
  
  if (!fs.existsSync(statePath)) {
    return null;
  }
  
  const content = fs.readFileSync(statePath, 'utf8');
  const state = {};
  
  // 解析关键字段
  const patterns = [
    { key: 'currentPhase', regex: /当前阶段[:\s]*([^\n]+)/i },
    { key: 'phaseStatus', regex: /阶段状态[:\s]*([^\n]+)/i },
    { key: 'mode', regex: /模式[:\s]*([^\n]+)/i },
    { key: 'reqId', regex: /当前Req[:\s]*([^\n]+)/i },
    { key: 'taskId', regex: /当前Task[:\s]*([^\n]+)/i },
    { key: 'progress', regex: /完成进度[:\s]*([^\n]+)/i },
    { key: 'lastCompleted', regex: /上次完成阶段[:\s]*([^\n]+)/i },
    { key: 'nextPhase', regex: /下一阶段[:\s]*([^\n]+)/i }
  ];
  
  for (const { key, regex } of patterns) {
    const match = content.match(regex);
    if (match) {
      state[key] = match[1].trim();
    }
  }
  
  return state;
}

/**
 * 读取进度清单
 */
function readProgressList(content) {
  const progressSection = content.match(/## 阶段进度\n([\s\S]*?)(?:\n##|$)/i);
  
  if (!progressSection) {
    return [];
  }
  
  const lines = progressSection[1].split('\n');
  const progress = [];
  
  for (const line of lines) {
    const match = line.match(/^\s*[-*]?\s*\[([ x])\]\s*(.+)/i);
    if (match) {
      progress.push({
        completed: match[1].toLowerCase() === 'x',
        name: match[2].trim()
      });
    }
  }
  
  return progress;
}

/**
 * 解析 Phase 名称
 */
function parsePhaseName(phase) {
  const phaseNames = {
    '0': '战略评估',
    '0-confirm': '需求确认',
    '1': '需求分析',
    '1-analysis': '需求分析',
    '2': '方案设计',
    '2-design': '方案设计',
    '2a': 'UI设计',
    '2a-ui-design': 'UI设计',
    '3': '任务拆分',
    '3-task': '任务拆分',
    '4': '实施开发',
    '4-dev': '实施开发',
    '5': '测试验证',
    '5-test': '测试验证',
    '6': '代码审查',
    '6-review': '代码审查',
    '7': '集成发布',
    '7-integration': '集成发布',
    '8': '知识归档',
    '8-archive': '知识归档'
  };
  
  return phaseNames[phase] || phaseNames[phase.split('-')[0]] || phase;
}

/**
 * 获取状态颜色
 */
function getStatusColor(status) {
  if (!status) return 'gray';
  if (status.toLowerCase().includes('waiting')) return 'yellow';
  if (status.toLowerCase().includes('completed')) return 'green';
  if (status.toLowerCase().includes('blocked')) return 'red';
  if (status.toLowerCase().includes('in_progress')) return 'cyan';
  return 'gray';
}

/**
 * 显示 Mini 格式（单行）
 */
function displayMini(state, projectDir) {
  const phase = state?.currentPhase || 'unknown';
  const phaseName = parsePhaseName(phase);
  const mode = state?.mode || 'Standard';
  const status = state?.phaseStatus || 'unknown';
  const statusColor = getStatusColor(status);
  
  const progress = calculateProgress(state, projectDir);
  
  console.log();
  log(`[${phaseName}]`, 'bold');
  log(` ${status}`, statusColor);
  log(` | ${mode}`, 'gray');
  log(` | 进度: ${progress}%`, 'cyan');
  log(` | req: ${state?.reqId || '-'}`, 'gray');
}

/**
 * 显示 Full 格式（多行）
 */
function displayFull(state, projectDir) {
  logSection('项目状态');
  
  if (!state) {
    log('❌ 状态文件不存在', 'red');
    console.log('   请先初始化项目: node bin/init.js');
    return;
  }
  
  const phase = state?.currentPhase || 'unknown';
  const phaseName = parsePhaseName(phase);
  
  // 基本信息
  console.log('\n📍 当前位置:');
  console.log(`   阶段: ${phaseName} (${phase})`);
  console.log(`   模式: ${state?.mode || 'Standard'}`);
  console.log(`   状态: ${state?.phaseStatus || 'unknown'}`);
  
  if (state?.reqId) {
    console.log(`   Req: ${state.reqId}`);
  }
  if (state?.taskId) {
    console.log(`   Task: ${state.taskId}`);
  }
  
  // 进度
  const progress = calculateProgress(state, projectDir);
  console.log(`\n📊 完成进度: ${progress}%`);
  
  // 进度条
  const barLength = 30;
  const filled = Math.round(progress / 100 * barLength);
  const empty = barLength - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  const barColor = progress < 30 ? 'red' : progress < 70 ? 'yellow' : 'green';
  log(`   [${bar}]`, barColor);
  
  // 阶段清单
  console.log('\n📋 阶段进度:');
  const phaseList = [
    { id: '0', name: '战略评估' },
    { id: '1', name: '需求分析' },
    { id: '2', name: '方案设计' },
    { id: '2a', name: 'UI设计' },
    { id: '3', name: '任务拆分' },
    { id: '4', name: '实施开发' },
    { id: '5', name: '测试验证' },
    { id: '6', name: '代码审查' },
    { id: '7', name: '集成发布' },
    { id: '8', name: '知识归档' }
  ];
  
  for (const { id, name } of phaseList) {
    const isCurrent = phase === id || phase.startsWith(id + '-');
    const isCompleted = isPhaseCompleted(id, state);
    
    if (isCurrent) {
      log(`   → ${name}`, 'cyan');
    } else if (isCompleted) {
      log(`   ✓ ${name}`, 'green');
    } else {
      log(`   ○ ${name}`, 'gray');
    }
  }
  
  // 最近的决策/教训
  console.log('\n📚 最近记录:');
  if (state?.lastCompleted) {
    console.log(`   上次完成: ${parsePhaseName(state.lastCompleted)}`);
  }
  if (state?.nextPhase) {
    console.log(`   下一步: ${parsePhaseName(state.nextPhase)}`);
  }
  
  // 时间信息
  console.log('\n⏰ 时间:');
  console.log(`   ${new Date().toLocaleString()}`);
}

/**
 * 计算进度
 */
function calculateProgress(state, projectDir) {
  if (!state) return 0;
  
  const phase = state?.currentPhase || '0';
  const phaseNumber = parseInt(phase.split('-')[0], 10) || 0;
  const status = state?.phaseStatus || '';
  
  // 基础进度：每个阶段 10%
  let progress = phaseNumber * 10;
  
  // 如果当前阶段进行中，加 5%
  if (status.includes('in_progress')) {
    progress += 5;
  }
  
  // 如果当前阶段完成，加 10%（但不超过 90%，保留最后 10% 给归档）
  if (status.includes('completed')) {
    progress += 10;
  }
  
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * 判断阶段是否完成
 */
function isPhaseCompleted(phaseId, state) {
  const currentPhase = state?.currentPhase || '0';
  const currentNum = parseInt(currentPhase.split('-')[0], 10) || 0;
  const checkNum = parseInt(phaseId, 10) || 0;
  
  return checkNum < currentNum;
}

/**
 * 验证产物文件
 */
function validateArtifacts(projectDir) {
  const statePath = path.join(projectDir, STATE_FILE);
  
  if (!fs.existsSync(statePath)) {
    return { valid: false, missing: [] };
  }
  
  const content = fs.readFileSync(statePath, 'utf8');
  const missing = [];
  
  // 定义必需的产物
  const artifacts = [
    { phase: 0, file: '00-requirements.md' },
    { phase: 1, file: '01-analysis.md' },
    { phase: 2, file: '02-design.md' },
    { phase: 4, file: '03-tasks.md' }
  ];
  
  for (const { phase, file } of artifacts) {
    const reqId = content.match(/当前Req[:\s]*([^\n]+)/i)?.[1] || 'default';
    const filePath = path.join(projectDir, '.ultimate-workflow', reqId, file);
    
    if (!fs.existsSync(filePath)) {
      missing.push({ phase, file });
    }
  }
  
  return { valid: missing.length === 0, missing };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  let projectDir = process.cwd();
  let format = 'full';
  
  // 解析参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project-dir' && args[i + 1]) {
      projectDir = args[i + 1];
    }
    if (args[i] === '--format' && args[i + 1]) {
      format = args[i + 1];
    }
    if (args[i] === '--mini') {
      format = 'mini';
    }
  }
  
  // 读取状态
  const state = readState(projectDir);
  
  // 显示状态
  if (format === 'mini') {
    displayMini(state, projectDir);
  } else {
    displayFull(state, projectDir);
  }
  
  // 验证产物
  const validation = validateArtifacts(projectDir);
  
  if (!validation.valid) {
    console.log('\n⚠️ 产物警告:');
    for (const { phase, file } of validation.missing) {
      log(`   ❌ Phase ${phase} 产物缺失: ${file}`, 'yellow');
    }
  }
  
  return {
    state,
    progress: calculateProgress(state, projectDir),
    artifactsValid: validation.valid
  };
}

// 执行
main().catch(console.error);
