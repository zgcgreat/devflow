#!/usr/bin/env node
/**
 * User Prompt Submit Hook
 * 
 * 用途: 用户提交提示词前执行的检查
 * 触发: 每次用户提交消息时自动调用
 * 
 * 用法: node hooks/user-prompt.js "<user-prompt>"
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = '.ultimate-workflow/STATE.md';
const CONTEXT_FILE = '.ultimate-workflow/CONTEXT.md';

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

/**
 * 检测横向命令
 */
function checkLateralCommands(prompt) {
  const lateralCommands = [
    { cmd: '/status', desc: '查看项目状态' },
    { cmd: '/lessons', desc: '查看经验教训' },
    { cmd: '/review', desc: '即时代码审查' },
    { cmd: '/grill', desc: '需求追问' },
    { cmd: '/diagnose', desc: '问题诊断' },
    { cmd: '/health', desc: '健康检查' },
    { cmd: '/zoom-out', desc: '抽象层导航' },
    { cmd: '/triage', desc: '问题状态机' },
    { cmd: '/tdd', desc: '激活TDD模式' },
    { cmd: '/debug', desc: '激活调试模式' },
    { cmd: '/caveman', desc: '激活压缩模式' }
  ];
  
  const matched = [];
  
  for (const { cmd, desc } of lateralCommands) {
    if (prompt.toLowerCase().includes(cmd.toLowerCase())) {
      matched.push({ cmd, desc });
    }
  }
  
  if (matched.length > 0) {
    log('\n🔧 横向命令检测:', 'blue');
    for (const { cmd, desc } of matched) {
      log(`   ${cmd} - ${desc}`, 'yellow');
    }
  }
  
  return matched;
}

/**
 * 检查紧急关键词
 */
function checkEmergencyKeywords(prompt) {
  const emergencyKeywords = [
    { keyword: 'emergency', severity: 'critical', action: '立即响应，跳过规划' },
    { keyword: 'urgent', severity: 'high', action: '优先处理' },
    { keyword: 'asap', severity: 'high', action: '尽快处理' },
    { keyword: 'critical', severity: 'critical', action: '立即响应' },
    { keyword: 'production down', severity: 'critical', action: '紧急响应' },
    { keyword: '宕机', severity: 'critical', action: '紧急响应' },
    { keyword: 'p0', severity: 'critical', action: 'P0问题，立即处理' },
    { keyword: 'blocker', severity: 'high', action: '阻塞问题' }
  ];
  
  const found = [];
  
  for (const { keyword, severity, action } of emergencyKeywords) {
    if (prompt.toLowerCase().includes(keyword.toLowerCase())) {
      found.push({ keyword, severity, action });
    }
  }
  
  if (found.length > 0) {
    log('\n🚨 紧急关键词检测:', 'red');
    for (const { keyword, severity, action } of found) {
      log(`   [${severity.toUpperCase()}] ${keyword} → ${action}`, 'red');
    }
  }
  
  return found;
}

/**
 * 检查 Gate 条件
 */
function checkGateConditions(projectDir, prompt) {
  const statePath = path.join(projectDir, STATE_FILE);
  
  if (!fs.existsSync(statePath)) {
    return { blocked: false, reason: null };
  }
  
  const content = fs.readFileSync(statePath, 'utf8');
  
  // 检查是否等待用户确认
  const waitingMatch = content.match(/阶段状态[:\s]*([^\n]+)/i);
  const phaseMatch = content.match(/当前阶段[:\s]*([^\n]+)/i);
  
  const waiting = waitingMatch && waitingMatch[1].toLowerCase().includes('waiting');
  const phase = phaseMatch ? phaseMatch[1].trim() : 'unknown';
  
  if (waiting) {
    log(`\n⏸️ Gate 条件检查:`, 'yellow');
    log(`   当前阶段 ${phase} 等待用户确认`, 'yellow');
    log(`   建议: 先回复确认内容`, 'gray');
    return { blocked: true, reason: 'waiting_confirmation', phase };
  }
  
  // 检查 Phase 门控
  const criticalPhases = ['0-confirm', '1-analysis', '2-design', '2a-ui-design'];
  if (criticalPhases.includes(phase)) {
    log(`\n⚠️ Gate 条件检查:`, 'yellow');
    log(`   当前阶段 ${phase} 是关键确认阶段`, 'yellow');
    log(`   建议: 确保完成当前阶段的确认流程`, 'gray');
  }
  
  return { blocked: false, reason: null };
}

/**
 * 检查 Token 使用率
 */
function checkTokenUsage() {
  // 这个需要在实际运行时通过 AI 系统获取
  // 这里只是示例
  const mockUsage = {
    used: 0,
    limit: 0,
    percentage: 0
  };
  
  // 尝试从环境变量读取（如果有）
  if (process.env.TOKEN_USAGE) {
    try {
      const usage = JSON.parse(process.env.TOKEN_USAGE);
      mockUsage.used = usage.used;
      mockUsage.limit = usage.limit;
      mockUsage.percentage = usage.percentage;
    } catch (e) {}
  }
  
  if (mockUsage.percentage > 70) {
    log(`\n💡 Token 使用率: ${mockUsage.percentage}%`, 'yellow');
    if (mockUsage.percentage > 85) {
      log(`   建议: 使用 /caveman full 压缩上下文`, 'yellow');
    }
  }
  
  return mockUsage;
}

/**
 * 检查敏感文件防护
 */
function checkSensitiveFiles(prompt, projectDir) {
  const sensitivePatterns = [
    { pattern: /\.env$/, desc: '环境变量文件' },
    { pattern: /\.pem$/, desc: '密钥文件' },
    { pattern: /credentials\.json$/, desc: '凭据文件' },
    { pattern: /secret/i, desc: '密钥相关内容' },
    { pattern: /password/i, desc: '密码相关内容' },
    { pattern: /api.?key/i, desc: 'API Key相关内容' }
  ];
  
  const found = [];
  
  for (const { pattern, desc } of sensitivePatterns) {
    if (pattern.test(prompt)) {
      found.push({ pattern: pattern.toString(), desc });
    }
  }
  
  if (found.length > 0) {
    log('\n🔒 敏感内容检测:', 'red');
    for (const { desc } of found) {
      log(`   ⚠️  ${desc}`, 'red');
    }
    log('\n   提示: 不要在对话中分享敏感信息', 'yellow');
  }
  
  return found;
}

/**
 * 检查上下文连续性
 */
function checkContextContinuity(projectDir, prompt) {
  const continueKeywords = ['继续', 'continue', 'next', '下一步', '接着'];
  const isContinue = continueKeywords.some(k => 
    prompt.toLowerCase().includes(k.toLowerCase())
  );
  
  if (isContinue) {
    const statePath = path.join(projectDir, STATE_FILE);
    
    if (!fs.existsSync(statePath)) {
      log('\n⚠️ 上下文连续性检查:', 'yellow');
      log('   状态文件不存在，无法恢复上下文', 'yellow');
      log('   建议: 从头开始项目流程', 'gray');
      return { canContinue: false };
    }
    
    log('\n✅ 上下文连续性检查:', 'green');
    log('   将恢复上次会话状态', 'gray');
    return { canContinue: true };
  }
  
  return { canContinue: null };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法: node hooks/user-prompt.js "<user-prompt>" [--project-dir <path>]');
    process.exit(0);
  }
  
  const prompt = args[0];
  let projectDir = process.cwd();
  
  // 解析参数
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--project-dir' && args[i + 1]) {
      projectDir = args[i + 1];
    }
  }
  
  console.log('\n' + '='.repeat(60));
  log('  User Prompt Submit Hook', 'blue');
  console.log('='.repeat(60));
  console.log(`\n📝 用户输入预览: ${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}`);
  
  // 1. 检测横向命令
  const lateralCommands = checkLateralCommands(prompt);
  
  // 2. 检查紧急关键词
  const emergencies = checkEmergencyKeywords(prompt);
  
  // 3. 检查 Gate 条件
  const gate = checkGateConditions(projectDir, prompt);
  
  // 4. 检查 Token 使用率
  const tokenUsage = checkTokenUsage();
  
  // 5. 检查敏感文件
  const sensitiveFiles = checkSensitiveFiles(prompt, projectDir);
  
  // 6. 检查上下文连续性
  const continuity = checkContextContinuity(projectDir, prompt);
  
  // 输出总结
  console.log('\n' + '='.repeat(60));
  log('  检查完成', 'blue');
  console.log('='.repeat(60));
  
  const summary = {
    lateralCommands: lateralCommands.length,
    emergencies: emergencies.length,
    gateBlocked: gate.blocked,
    tokenPercentage: tokenUsage.percentage,
    sensitiveContent: sensitiveFiles.length > 0,
    canContinue: continuity.canContinue
  };
  
  // 警告
  if (emergencies.length > 0) {
    console.log('\n🚨 紧急模式已激活');
  }
  
  if (sensitiveFiles.length > 0) {
    console.log('\n🔒 包含敏感内容，请注意保护');
  }
  
  if (gate.blocked) {
    console.log(`\n⏸️ 当前阶段 ${gate.phase} 等待确认，请先回复确认`);
  }
  
  return summary;
}

// 执行
main().catch(console.error);
