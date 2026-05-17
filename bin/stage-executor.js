#!/usr/bin/env node
/**
 * Stage Executor
 * 
 * 用途: 执行工作流阶段
 * 用法: node bin/stage-executor.js <phase> [--project-dir <path>] [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = '.ultimate-workflow/STATE.md';

const c = {
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
  console.log(`${c[color]}${msg}${c.reset}`);
}

// Stage 定义
const STAGES = {
  '0': {
    name: '战略评估',
    alias: ['0-confirm'],
    entry: 'SKILL.md, GO.md',
    gates: [],
    exit: '00-requirements.md'
  },
  '1': {
    name: '需求分析',
    alias: ['1-analysis'],
    entry: 'rules/RULES.md, 5-whys.md',
    gates: ['00-requirements.md'],
    exit: '01-analysis.md'
  },
  '2': {
    name: '方案设计',
    alias: ['2-design'],
    entry: 'rules/RULES.md, tech-stacks.md',
    gates: ['00-requirements.md', '01-analysis.md'],
    exit: '02-design.md'
  },
  '2a': {
    name: 'UI设计',
    alias: ['2a-ui-design'],
    entry: 'rules/RULES.md, ui-*.md',
    gates: ['01-analysis.md'],
    exit: '02a-ui-design.md'
  },
  '3': {
    name: '任务拆分',
    alias: ['3-task'],
    entry: 'rules/RULES.md, task-template.md',
    gates: ['02-design.md'],
    exit: '03-tasks.md'
  },
  '4': {
    name: '实施开发',
    alias: ['4-dev'],
    entry: 'rules/RULES.md, dev-*.md',
    gates: ['03-tasks.md'],
    exit: '代码提交'
  },
  '5': {
    name: '测试验证',
    alias: ['5-test'],
    entry: 'rules/RULES.md, test-*.md',
    gates: ['04-dev'],
    exit: '测试报告'
  },
  '6': {
    name: '代码审查',
    alias: ['6-review'],
    entry: 'rules/RULES.md, review-*.md',
    gates: ['05-test'],
    exit: '审查报告'
  },
  '7': {
    name: '集成发布',
    alias: ['7-integration'],
    entry: 'rules/RULES.md, deploy-*.md',
    gates: ['06-review'],
    exit: '部署'
  },
  '8': {
    name: '知识归档',
    alias: ['8-archive'],
    entry: 'rules/RULES.md, archive-*.md',
    gates: ['07-integration'],
    exit: 'LESSONS.md'
  }
};

/**
 * 读取 STATE.md
 */
function readState(projectDir) {
  const statePath = path.join(projectDir, STATE_FILE);
  if (!fs.existsSync(statePath)) {
    return null;
  }
  return fs.readFileSync(statePath, 'utf8');
}

/**
 * 更新 STATE.md
 */
function updateState(projectDir, updates) {
  const statePath = path.join(projectDir, STATE_FILE);
  if (!fs.existsSync(statePath)) {
    log('STATE.md 不存在', 'red');
    return false;
  }
  
  let content = fs.readFileSync(statePath, 'utf8');
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}[:\\s]*.*$`, 'im');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}: ${value}`);
    } else {
      // 添加新字段
      content += `\n${key}: ${value}`;
    }
  }
  
  fs.writeFileSync(statePath, content);
  return true;
}

/**
 * 解析阶段 ID
 */
function resolveStage(phaseInput) {
  // 直接数字
  if (STAGES[phaseInput]) {
    return phaseInput;
  }
  
  // 别名
  for (const [id, stage] of Object.entries(STAGES)) {
    if (stage.alias.includes(phaseInput)) {
      return id;
    }
  }
  
  return null;
}

/**
 * 检查门控条件
 */
function checkGates(projectDir, stage) {
  const gates = stage.gates || [];
  const results = [];
  
  for (const gate of gates) {
    // 简化检查：实际应该检查 reqs/<req-id>/<gate>
    const gatePath = path.join(projectDir, '.ultimate-workflow', 'reqs', gate);
    const exists = fs.existsSync(gatePath);
    results.push({ gate, passed: exists });
  }
  
  return results;
}

/**
 * 执行阶段
 */
async function executeStage(projectDir, stageId, dryRun = false) {
  const stage = STAGES[stageId];
  
  if (!stage) {
    log(`未知阶段: ${stageId}`, 'red');
    log('可用阶段: ' + Object.keys(STAGES).join(', '));
    return false;
  }
  
  log(`\n执行阶段 ${stageId}: ${stage.name}`, 'bold');
  
  // 检查门控
  log('\n检查门控条件:', 'blue');
  const gateResults = checkGates(projectDir, stage);
  
  let allPassed = true;
  for (const { gate, passed } of gateResults) {
    if (passed) {
      log(`  ✅ ${gate}`, 'green');
    } else {
      log(`  ❌ ${gate}`, 'red');
      allPassed = false;
    }
  }
  
  if (!allPassed) {
    log('\n⚠️  门控未通过，无法进入此阶段', 'yellow');
    log('请先完成前置阶段');
    return false;
  }
  
  // Dry run 模式
  if (dryRun) {
    log('\n🔍 Dry Run 模式 - 不执行实际操作', 'yellow');
    log('\n阶段信息:');
    log(`  名称: ${stage.name}`);
    log(`  入口文件: ${stage.entry}`);
    log(`  门控: ${gateResults.length}`);
    log(`  出口: ${stage.exit}`);
    return true;
  }
  
  // 更新状态
  updateState(projectDir, {
    '当前阶段': `${stageId}`,
    '阶段状态': 'in_progress',
    '更新时间': new Date().toISOString()
  });
  
  log('\n✅ 阶段入口条件已满足');
  log('请在 AI 对话中继续执行此阶段');
  
  return true;
}

/**
 * 显示阶段概览
 */
function showStages() {
  console.log('\n可用阶段:');
  console.log('='.repeat(50));
  
  for (const [id, stage] of Object.entries(STAGES)) {
    const aliases = stage.alias.slice(1).join(', ') || '-';
    console.log(`  ${id}: ${stage.name.padEnd(8)} (${aliases || '主'})`);
  }
  
  console.log('='.repeat(50));
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Stage Executor

用法: node bin/stage-executor.js <phase> [选项]

选项:
  --project-dir <path>    项目目录 (默认: 当前目录)
  --dry-run               仅检查，不执行
  --list                  显示所有阶段
  --help                  显示帮助

示例:
  node bin/stage-executor.js 1
  node bin/stage-executor.js 2-design --dry-run
  node bin/stage-executor.js --list
`);
    showStages();
    process.exit(0);
  }
  
  const phase = args[0];
  let projectDir = process.cwd();
  let dryRun = false;
  
  // 解析参数
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--project-dir' && args[i + 1]) {
      projectDir = args[i + 1];
    }
    if (args[i] === '--dry-run') {
      dryRun = true;
    }
    if (args[i] === '--list') {
      showStages();
      process.exit(0);
    }
  }
  
  // 解析阶段
  const stageId = resolveStage(phase);
  
  if (!stageId) {
    log(`无法解析阶段: ${phase}`, 'red');
    showStages();
    process.exit(1);
  }
  
  // 执行
  const success = await executeStage(projectDir, stageId, dryRun);
  
  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});
