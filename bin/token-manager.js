#!/usr/bin/env node
/**
 * Token Manager
 * 
 * 用途: Token 使用监控和自动压缩
 * 用法: node bin/token-manager.js <action> [args...]
 */

const fs = require('fs');
const path = require('path');

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

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  log(`  ${title}`, 'blue');
  console.log('='.repeat(60));
}

/**
 * 估算 Token
 */
function estimateTokens(text) {
  if (!text) return 0;
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const otherChars = text.length - chineseChars - englishWords * 4;
  return Math.round(chineseChars + englishWords * 1.3 + otherChars * 0.25);
}

/**
 * 7级压缩
 */
const COMPRESSION_RULES = {
  1: {
    name: 'lite',
    ratio: 0.30,
    desc: '删除废话词',
    rules: ['just', 'really', 'basically', 'actually', 'simply', 'very', 'quite']
  },
  2: {
    name: 'full',
    ratio: 0.50,
    desc: '删除冠词 + 缩短短语',
    rules: ['a, an, the', 'in order to→to', 'due to the fact→because']
  },
  3: {
    name: 'ultra',
    ratio: 0.65,
    desc: '技术缩写 + 符号替换',
    rules: ['database→DB', 'auth, config, env', '→ ← ∈ ∉ ∴ ∵']
  },
  4: {
    name: 'extreme',
    ratio: 0.75,
    desc: '极限压缩',
    rules: ['information→info', 'generation→gen', '保留代码块']
  },
  5: {
    name: 'wenyan-lite',
    ratio: 0.40,
    desc: '半文言',
    rules: ['need to→需', 'must→须', 'should→宜']
  },
  6: {
    name: 'wenyan-full',
    ratio: 0.60,
    desc: '全文言',
    rules: ['我→吾', '我们→我等', '这个→此']
  },
  7: {
    name: 'wenyan-ultra',
    ratio: 0.75,
    desc: '极致文言',
    rules: ['需要→需', '完成→成', '问题→问']
  }
};

/**
 * 获取 Token 使用状态
 */
function getTokenUsage() {
  // 尝试从环境变量读取
  const envUsage = process.env.TOKEN_USAGE;
  if (envUsage) {
    try {
      return JSON.parse(envUsage);
    } catch (e) {}
  }
  
  // 返回模拟数据
  return {
    session: {
      used: 0,
      limit: 30000,
      percentage: 0
    },
    task: {
      used: 0,
      limit: 4000,
      percentage: 0
    }
  };
}

/**
 * 显示 Token 状态
 */
function showStatus() {
  logSection('Token 使用状态');
  
  const usage = getTokenUsage();
  
  // Session 状态
  const session = usage.session;
  log('\n📊 Session 级别:', 'cyan');
  log(`   已使用: ${session.used} / ${session.limit} Token`);
  log(`   使用率: ${session.percentage}%`);
  
  const sessionBar = createBar(session.percentage);
  const sessionColor = session.percentage > 90 ? 'red' : session.percentage > 70 ? 'yellow' : 'green';
  log(`   [${sessionBar}]`, sessionColor);
  
  // Task 状态
  const task = usage.task;
  log('\n📋 Task 级别:', 'cyan');
  log(`   已使用: ${task.used} / ${task.limit} Token`);
  log(`   使用率: ${task.percentage}%`);
  
  const taskBar = createBar(task.percentage);
  const taskColor = task.percentage > 90 ? 'red' : task.percentage > 70 ? 'yellow' : 'green';
  log(`   [${taskBar}]`, taskColor);
  
  // 建议
  log('\n💡 压缩建议:', 'blue');
  const level = suggestCompressionLevel(session.percentage);
  if (level > 0) {
    const info = COMPRESSION_RULES[level];
    log(`   建议级别: ${level} (${info.name}) - ${info.desc}`);
    log(`   预计节省: ${info.ratio * 100}%`);
  } else {
    log('   当前无需压缩');
  }
  
  // 所有级别
  logSection('可用压缩级别');
  for (const [level, info] of Object.entries(COMPRESSION_RULES)) {
    log(`\n  ${level}. ${info.name.padEnd(15)} ${info.desc.padEnd(25)} 节省 ${info.ratio * 100}%`, 'cyan');
  }
}

/**
 * 创建进度条
 */
function createBar(percentage, length = 30) {
  const filled = Math.round(percentage / 100 * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 建议压缩级别
 */
function suggestCompressionLevel(percentage) {
  if (percentage < 50) return 0;
  if (percentage < 70) return 1; // lite
  if (percentage < 85) return 2; // full
  if (percentage < 90) return 3; // ultra
  return 4; // extreme
}

/**
 * 分析文件
 */
function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`文件不存在: ${filePath}`, 'red');
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const tokens = estimateTokens(content);
  const lines = content.split('\n').length;
  
  return {
    path: filePath,
    tokens,
    lines,
    chars: content.length,
    compression: suggestCompressionLevel((tokens / 4000) * 100)
  };
}

/**
 * 分析目录
 */
function analyzeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    log(`目录不存在: ${dirPath}`, 'red');
    return [];
  }
  
  const results = [];
  
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // 跳过特定目录
      if (entry.isDirectory()) {
        if (['node_modules', '.git', '.devflow', 'dist', 'build'].includes(entry.name)) {
          continue;
        }
        walk(fullPath);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.txt')) {
        const info = analyzeFile(fullPath);
        if (info) {
          results.push(info);
        }
      }
    }
  }
  
  walk(dirPath);
  return results.sort((a, b) => b.tokens - a.tokens);
}

/**
 * 显示分析结果
 */
function showAnalysis(dirPath) {
  logSection('Token 分析');
  log(`\n目录: ${dirPath}`, 'blue');
  
  const results = analyzeDirectory(dirPath);
  
  if (results.length === 0) {
    log('  未找到 Markdown 文件', 'gray');
    return;
  }
  
  const totalTokens = results.reduce((sum, f) => sum + f.tokens, 0);
  
  log(`\n找到 ${results.length} 个文件, 总计 ~${totalTokens} Token`, 'cyan');
  
  // Top 10
  log('\n📊 Top 10 最大文件:', 'blue');
  for (let i = 0; i < Math.min(10, results.length); i++) {
    const file = results[i];
    const bar = createBar((file.tokens / results[0].tokens) * 100, 20);
    log(`\n  ${(i + 1).toString().padStart(2)}. ${path.basename(file.path)}`, 'cyan');
    log(`      ${file.tokens} Token | ${file.lines} 行`, 'gray');
    log(`      [${bar}]`, file.tokens > 4000 ? 'yellow' : 'gray');
  }
  
  // 压缩建议
  logSection('压缩建议');
  
  const highPriority = results.filter(f => f.tokens > 4000);
  
  if (highPriority.length > 0) {
    log('\n🚨 高优先级 (需要压缩):', 'red');
    for (const file of highPriority) {
      const level = suggestCompressionLevel((file.tokens / 4000) * 100);
      const info = COMPRESSION_RULES[level];
      log(`  ${path.basename(file.path)}: ~${file.tokens} Token → 建议 ${info.name}`, 'yellow');
    }
  }
  
  const mediumPriority = results.filter(f => f.tokens > 2000 && f.tokens <= 4000);
  
  if (mediumPriority.length > 0) {
    log('\n⚠️  中优先级 (可以优化):', 'yellow');
    for (const file of mediumPriority) {
      log(`  ${path.basename(file.path)}: ~${file.tokens} Token`, 'gray');
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Token Manager - 7级 Token 压缩管理

用法: node bin/token-manager.js <action> [args...]

操作:
  status                    显示 Token 使用状态
  analyze [dir]             分析目录 (默认: .devflow)
  compress <level> [dir]    压缩目录中的文件
  suggest                   显示压缩建议

级别:
  1: lite      - 删除废话 (节省30%)
  2: full      - 删除冠词 + 缩短短语 (节省50%)
  3: ultra     - 缩写 + 符号 (节省65%)
  4: extreme   - 极限压缩 (节省75%)
  5-7: 文言压缩 (节省40-75%)

示例:
  node bin/token-manager.js status
  node bin/token-manager.js analyze .devflow
  node bin/token-manager.js compress 3 .devflow
`);
    process.exit(0);
  }
  
  const action = args[0];
  
  switch (action) {
    case 'status':
      showStatus();
      break;
    
    case 'analyze':
      const analyzeDir = args[1] || '.devflow';
      showAnalysis(analyzeDir);
      break;
    
    case 'suggest':
      const usage = getTokenUsage();
      const level = suggestCompressionLevel(usage.session.percentage);
      logSection('压缩建议');
      log(`\n当前使用率: ${usage.session.percentage}%`, 'cyan');
      if (level > 0) {
        const info = COMPRESSION_RULES[level];
        log(`\n推荐级别: ${level} (${info.name})`, 'green');
        log(`描述: ${info.desc}`, 'gray');
        log(`预计节省: ${info.ratio * 100}%`, 'gray');
      } else {
        log('\n当前无需压缩', 'green');
      }
      break;
    
    default:
      log(`未知操作: ${action}`, 'red');
      process.exit(1);
  }
}

main().catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});
