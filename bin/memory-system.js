#!/usr/bin/env node
/**
 * Memory System
 * 
 * 用途: 7级记忆压缩和检索
 * 用法: node bin/memory-system.js <action> [args...]
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = '.ultimate-workflow/memory';

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

// 7级压缩级别
const COMPRESSION_LEVELS = {
  0: { name: 'none', ratio: 0, desc: '不压缩' },
  1: { name: 'lite', ratio: 0.3, desc: '删除废话' },
  2: { name: 'full', ratio: 0.5, desc: '删除冠词 + 缩短短语' },
  3: { name: 'ultra', ratio: 0.65, desc: '缩写 + 符号替换' },
  4: { name: 'extreme', ratio: 0.75, desc: '极限压缩' },
  5: { name: 'wenyan-lite', ratio: 0.4, desc: '半文言' },
  6: { name: 'wenyan-full', ratio: 0.6, desc: '全文言' },
  7: { name: 'wenyan-ultra', ratio: 0.75, desc: '极致文言' }
};

/**
 * 计算 Token 使用率
 */
function estimateTokens(text) {
  // 简单估算：中文按字符，英文按单词
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const otherChars = text.length - chineseChars - englishWords;
  
  return chineseChars + englishWords * 1.3 + otherChars * 0.5;
}

/**
 * 读取记忆文件
 */
function readMemoryFile(projectDir, filename) {
  const filePath = path.join(projectDir, MEMORY_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * 写入记忆文件
 */
function writeMemoryFile(projectDir, filename, content) {
  const dirPath = path.join(projectDir, MEMORY_DIR);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const filePath = path.join(dirPath, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  
  return filePath;
}

/**
 * 列出记忆文件
 */
function listMemoryFiles(projectDir) {
  const dirPath = path.join(projectDir, MEMORY_DIR);
  
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f,
      path: path.join(dirPath, f),
      size: fs.statSync(path.join(dirPath, f)).size,
      modified: fs.statSync(path.join(dirPath, f)).mtime
    }));
}

/**
 * 级别1压缩: 删除废话
 */
function compressLite(text) {
  const fillers = [
    'just', 'really', 'basically', 'actually', 'simply', 'very', 'quite',
    'rather', 'pretty', 'obviously', 'clearly', 'generally', 'usually',
    'perhaps', 'maybe', 'probably', 'possibly', 'likely', 'certainly',
    'definitely'
  ];
  
  let result = text;
  for (const word of fillers) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }
  
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * 级别2压缩: 删除冠词 + 缩短短语
 */
function compressFull(text) {
  let result = compressLite(text);
  
  // 删除冠词
  result = result.replace(/\b(a|an|the)\b/gi, '');
  
  // 缩短短语
  const phrases = {
    'in order to': 'to',
    'due to the fact': 'because',
    'at this point': 'now',
    'for the purpose of': 'for',
    'in the event that': 'if',
    'with regard to': 'about',
    'in addition to': 'also',
    'on the other hand': 'but',
    'as well as': 'and',
    'has the ability to': 'can',
    'is able to': 'can',
    'it is necessary to': 'must',
    'take into account': 'consider',
    'make a decision': 'decide',
    'give consideration': 'consider',
    'take action': 'act'
  };
  
  for (const [from, to] of Object.entries(phrases)) {
    result = result.replace(new RegExp(from, 'gi'), to);
  }
  
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * 级别3压缩: 缩写 + 符号
 */
function compressUltra(text) {
  let result = compressFull(text);
  
  // 技术缩写
  const abbrevs = {
    'database': 'DB',
    'authentication': 'auth',
    'authorization': 'authz',
    'configuration': 'config',
    'initialization': 'init',
    'implementation': 'impl',
    'application': 'app',
    'environment': 'env',
    'development': 'dev',
    'production': 'prod',
    'parameter': 'param',
    'response': 'res',
    'request': 'req',
    'function': 'fn',
    'variable': 'var',
    'object': 'obj',
    'array': 'arr',
    'string': 'str',
    'boolean': 'bool',
    'integer': 'int'
  };
  
  for (const [from, to] of Object.entries(abbrevs)) {
    result = result.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
  }
  
  // 符号替换
  result = result
    .replace(/causes|leads to|triggers/gi, '→')
    .replace(/results in/gi, '→')
    .replace(/depends on/gi, '←')
    .replace(/requires|needs/gi, '←')
    .replace(/contains|includes/gi, '∈')
    .replace(/not equal/gi, '≠')
    .replace(/greater than or equal/gi, '≥')
    .replace(/less than or equal/gi, '≤')
    .replace(/approximately/gi, '≈')
    .replace(/therefore|hence/gi, '∴')
    .replace(/because/gi, '∵')
    .replace(/defined as/gi, '≡')
    .replace(/equivalent/gi, '≡');
  
  return result.trim();
}

/**
 * 应用压缩
 */
function compress(text, level = 1) {
  switch (level) {
    case 0: return text;
    case 1: return compressLite(text);
    case 2: return compressFull(text);
    case 3: return compressUltra(text);
    default: return compressUltra(text);
  }
}

/**
 * 显示状态
 */
function showStatus(projectDir) {
  log('\n记忆系统状态:', 'blue');
  
  const files = listMemoryFiles(projectDir);
  
  if (files.length === 0) {
    log('  暂无记忆文件', 'gray');
    return;
  }
  
  let totalTokens = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file.path, 'utf8');
    const tokens = estimateTokens(content);
    totalTokens += tokens;
    
    log(`\n  📄 ${file.name}`, 'cyan');
    log(`     大小: ${file.size} bytes`, 'gray');
    log(`     Token: ~${Math.round(tokens)}`, 'gray');
    log(`     修改: ${file.modified.toLocaleString()}`, 'gray');
  }
  
  log(`\n总计: ${files.length} 文件, ~${Math.round(totalTokens)} Token`, 'yellow');
  
  // 估算压缩潜力
  for (const [level, info] of Object.entries(COMPRESSION_LEVELS)) {
    if (info.ratio > 0) {
      const afterCompression = totalTokens * (1 - info.ratio);
      log(`  ${info.name.padEnd(15)} ${info.desc.padEnd(25)} → ~${Math.round(afterCompression)} Token`, 'gray');
    }
  }
}

/**
 * 搜索记忆
 */
function search(projectDir, query) {
  log(`\n搜索记忆: ${query}`, 'blue');
  
  const files = listMemoryFiles(projectDir);
  const results = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file.path, 'utf8').toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (content.includes(queryLower)) {
      // 提取匹配行
      const lines = content.split('\n');
      const matches = lines.filter(l => l.toLowerCase().includes(queryLower));
      
      results.push({
        file: file.name,
        matches: matches.slice(0, 3) // 最多3条
      });
    }
  }
  
  if (results.length === 0) {
    log('  未找到匹配结果', 'gray');
    return [];
  }
  
  for (const result of results) {
    log(`\n  📄 ${result.file}`, 'cyan');
    for (const match of result.matches) {
      log(`     ${match.trim().slice(0, 100)}...`, 'gray');
    }
  }
  
  return results;
}

/**
 * 添加记忆
 */
function add(projectDir, type, content) {
  const filename = `${MEMORY_DIR}/${type}.md`;
  writeMemoryFile(projectDir, filename, content);
  log(`✅ 已保存: ${filename}`, 'green');
}

/**
 * 压缩记忆
 */
function compressMemory(projectDir, level = 2) {
  log(`\n压缩记忆 (级别 ${level}: ${COMPRESSION_LEVELS[level]?.name})`, 'blue');
  
  const files = listMemoryFiles(projectDir);
  
  for (const file of files) {
    const original = fs.readFileSync(file.path, 'utf8');
    const tokensBefore = estimateTokens(original);
    const compressed = compress(original, level);
    const tokensAfter = estimateTokens(compressed);
    
    if (tokensAfter < tokensBefore) {
      // 只在确实节省空间时更新
      fs.writeFileSync(file.path, compressed, 'utf8');
      const saved = tokensBefore - tokensAfter;
      log(`  ✅ ${file.name}: ${Math.round(tokensBefore)} → ${Math.round(tokensAfter)} Token (-${Math.round(saved)})`, 'green');
    } else {
      log(`  ⏭️  ${file.name}: 无需压缩`, 'gray');
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
Memory System - 7级记忆压缩

用法: node bin/memory-system.js <action> [args...]

操作:
  status                      显示记忆状态
  search <query>              搜索记忆
  add <type> <content>        添加记忆
  compress [level]             压缩记忆 (1-7, 默认2)
  list                        列出所有记忆文件

级别说明:
  0: 不压缩
  1: lite     - 删除废话 (节省30%)
  2: full     - 删除冠词 + 缩短短语 (节省50%)
  3: ultra    - 缩写 + 符号替换 (节省65%)
  4: extreme   - 极限压缩 (节省75%)
  5: wenyan-lite  - 半文言 (节省40%)
  6: wenyan-full  - 全文言 (节省60%)
  7: wenyan-ultra - 极致文言 (节省75%)

示例:
  node bin/memory-system.js status
  node bin/memory-system.js search "数据库"
  node bin/memory-system.js compress 3
`);
    process.exit(0);
  }
  
  const action = args[0];
  const projectDir = process.cwd();
  
  switch (action) {
    case 'status':
      showStatus(projectDir);
      break;
    
    case 'search':
      if (!args[1]) {
        log('请提供搜索词', 'red');
        process.exit(1);
      }
      search(projectDir, args[1]);
      break;
    
    case 'add':
      if (!args[1] || !args[2]) {
        log('用法: add <type> <content>', 'red');
        process.exit(1);
      }
      add(projectDir, args[1], args.slice(2).join(' '));
      break;
    
    case 'compress':
      const level = parseInt(args[1] || '2', 10);
      if (level < 0 || level > 7) {
        log('级别必须是 0-7', 'red');
        process.exit(1);
      }
      compressMemory(projectDir, level);
      break;
    
    case 'list':
      const files = listMemoryFiles(projectDir);
      log('\n记忆文件列表:', 'blue');
      for (const file of files) {
        log(`  ${file.name} (${file.size} bytes)`, 'cyan');
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
