#!/usr/bin/env node
/**
 * Session Start Hook
 * 
 * 用途: 会话开始时执行的初始化检查
 * 触发: 每次新会话启动时自动调用
 * 
 * 用法: node hooks/session-start.js [--project-dir <path>]
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = '.devflow/STATE.md';
const CONFIG_FILE = '.devflow/config.yaml';
const MEMORY_DIR = '.devflow/memory';

// ANSI 颜色
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
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

function logCheck(name, passed, details = '') {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`  ${symbol} ${name}`, color);
  if (details) {
    log(`     ${details}`, 'gray');
  }
}

/**
 * 检查 .devflow 目录
 */
function checkWorkflowDir(projectDir) {
  const dirExists = fs.existsSync(path.join(projectDir, '.devflow'));
  logCheck('.devflow 目录', dirExists, 
    dirExists ? '目录已存在' : '目录不存在，将自动创建');
  return dirExists;
}

/**
 * 检查 STATE.md
 */
function checkStateFile(projectDir) {
  const statePath = path.join(projectDir, STATE_FILE);
  const exists = fs.existsSync(statePath);
  
  if (exists) {
    const content = fs.readFileSync(statePath, 'utf8');
    const phaseMatch = content.match(/当前阶段[:\s]*([^\n]+)/i);
    const modeMatch = content.match(/模式[:\s]*([^\n]+)/i);
    
    const phase = phaseMatch ? phaseMatch[1].trim() : '未知';
    const mode = modeMatch ? modeMatch[1].trim() : '未知';
    
    logCheck('STATE.md', true, `当前阶段: ${phase}, 模式: ${mode}`);
    return { phase, mode, content };
  } else {
    logCheck('STATE.md', false, '文件不存在，需要初始化');
    return null;
  }
}

/**
 * 检查 config.yaml
 */
function checkConfigFile(projectDir) {
  const configPath = path.join(projectDir, CONFIG_FILE);
  const exists = fs.existsSync(configPath);
  logCheck('config.yaml', exists, 
    exists ? '配置文件存在' : '使用默认配置');
  return exists;
}

/**
 * 检查记忆文件
 */
function checkMemoryFiles(projectDir) {
  const memoryPath = path.join(projectDir, MEMORY_DIR);
  const exists = fs.existsSync(memoryPath);
  
  if (!exists) {
    logCheck('记忆文件', false, 'memory目录不存在');
    return [];
  }
  
  const files = ['PROJECT_CONTEXT.md', 'DECISIONS.md', 'KNOWN_FAILURES.md', 'LESSONS.md'];
  const found = [];
  
  for (const file of files) {
    const filePath = path.join(memoryPath, file);
    if (fs.existsSync(filePath)) {
      found.push(file);
    }
  }
  
  logCheck('记忆文件', found.length > 0, 
    found.length > 0 ? `已加载: ${found.join(', ')}` : '无记忆文件');
  return found;
}

/**
 * 检测外部工具 (GitNexus)
 */
function checkExternalTools() {
  const tools = {
    git: false,
    gitnexus: false,
    npm: false,
    node: false
  };
  
  // Node.js
  tools.node = process.version !== undefined;
  
  // Git
  try {
    require('child_process').execSync('git --version', { stdio: 'pipe' });
    tools.git = true;
  } catch (e) {}
  
  // npm
  try {
    require('child_process').execSync('npm --version', { stdio: 'pipe' });
    tools.npm = true;
  } catch (e) {}
  
  // GitNexus (可选)
  try {
    require('child_process').execSync('gitnexus --version', { stdio: 'pipe' });
    tools.gitnexus = true;
  } catch (e) {}
  
  logCheck('Node.js', tools.node, process.version);
  logCheck('Git', tools.git);
  logCheck('npm', tools.npm);
  logCheck('GitNexus', tools.gitnexus, 
    tools.gitnexus ? '已安装' : '未安装（可选）');
  
  return tools;
}

/**
 * 加载 Phase 相关规则
 */
function loadPhaseRules(phase) {
  const rulesDir = path.join(__dirname, '..', 'references');
  const rulesFile = path.join(rulesDir, 'RULES.md');
  
  if (!fs.existsSync(rulesFile)) {
    logCheck('规则文件', false);
    return null;
  }
  
  logCheck('规则文件', true, `已加载 RULES.md`);
  return rulesFile;
}

/**
 * 读取上次会话的教训
 */
function readLessons(projectDir) {
  const lessonsPath = path.join(projectDir, MEMORY_DIR, 'LESSONS.md');
  
  if (!fs.existsSync(lessonsPath)) {
    logCheck('LESSONS.md', false, '无历史教训');
    return null;
  }
  
  const content = fs.readFileSync(lessonsPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  
  logCheck('LESSONS.md', true, `${lines.length} 条教训记录`);
  return content;
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  let projectDir = process.cwd();
  
  // 解析参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project-dir' && args[i + 1]) {
      projectDir = args[i + 1];
    }
  }
  
  logSection('Session Start Hook');
  log(`项目目录: ${projectDir}`, 'blue');
  console.log(`时间: ${new Date().toLocaleString()}`);
  
  // 1. 检查工作流目录
  checkWorkflowDir(projectDir);
  
  // 2. 检查状态文件
  const state = checkStateFile(projectDir);
  
  // 3. 检查配置文件
  checkConfigFile(projectDir);
  
  // 4. 检查记忆文件
  checkMemoryFiles(projectDir);
  
  // 5. 检测外部工具
  logSection('外部工具检测');
  const tools = checkExternalTools();
  
  // 6. 加载规则
  logSection('规则加载');
  const rulesFile = loadPhaseRules(state?.phase || '0');
  
  // 7. 读取教训
  logSection('历史教训');
  const lessons = readLessons(projectDir);
  
  // 输出总结
  logSection('会话初始化完成');
  
  const summary = {
    projectDir,
    state: state ? { phase: state.phase, mode: state.mode } : null,
    tools: {
      node: tools.node,
      git: tools.git,
      npm: tools.npm,
      gitnexus: tools.gitnexus
    },
    rulesLoaded: rulesFile !== null,
    lessonsCount: lessons ? lessons.split('\n').length : 0
  };
  
  console.log('\n📊 初始化摘要:');
  console.log(JSON.stringify(summary, null, 2));
  
  // 如果 GitNexus 未安装，提示安装
  if (!tools.gitnexus) {
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ ⚠️  GitNexus 未检测到                                         │');
    console.log('│                                                              │');
    console.log('│ GitNexus 提供增强代码理解能力（调用链/依赖追踪）               │');
    console.log('│                                                              │');
    console.log('│ 安装命令: npm install -g gitnexus                            │');
    console.log('│                                                              │');
    console.log('│ 不安装不影响核心流程，将使用基础 grep 分析                      │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
  }
  
  return summary;
}

// 执行
main().catch(console.error);
