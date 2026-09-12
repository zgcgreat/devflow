#!/usr/bin/env node
/**
 * DevFlow caveman — Token 输出压缩引擎
 *
 * 4 级压缩: lite(~35%) / full(~50%) / ultra(~65%) / wenyan(~70%)
 * 用法:
 *   node caveman.js --compress "Your long text here..."          # 压缩文本
 *   node caveman.js --file README.md                             # 压缩文件
 *   node caveman.js --compress-level full                        # 基准对比
 *   node caveman.js --stats                                      # 统计
 *   node caveman.js --compress-memory .workbuddy/memory/        # 压缩记忆目录
 */

const fs = require('fs');
const path = require('path');

// --- 压缩规则（分层定义，避免初始化引用错误）---

const LITE_RULES = [
  (t) => t.replace(/\b(?:the|a|an|this|that|these|those|it|its|they|them|we|our)\b/gi, ''),
  (t) => t.replace(/\b(?:please|kindly|just|simply|basically|actually|literally)\b/gi, ''),
  (t) => t.replace(/(?:```[\s\S]*?```)/g, (m) => m.length > 60 ? '```...```' : m),
  (t) => t.split('\n').filter(l => l.trim()).join('\n'),
];

const FULL_RULES = [
  ...LITE_RULES,
  (t) => t.replace(/\b(?:however|therefore|furthermore|consequently|additionally|nevertheless|notwithstanding)\b/gi, ''),
  (t) => t.replace(/^#+\s*/gm, ''),
  (t) => t.replace(/---+/g, ''),
  (t) => t.replace(/```[\s\S]*?```/g, '```...```'),
  (t) => t.replace(/▸|→|⇒|✗|✓|⚠️|💡|📌|🔍|✅|❌|🟢|🟡|🔴|⭐/g, ''),
];

const ULTRA_RULES = [
  ...FULL_RULES,
  (t) => t.replace(/`.+?`/g, (m) => m.length > 30 ? m.slice(0, 28) + '`...' : m),
  (t) => t.replace(/\|.*\|/g, (m) => m.replace(/[^|\w\s]/g, '').length > 40 ? m.slice(0, 40) + '...|' : m),
  (t) => t.replace(/\n{3,}/g, '\n\n'),
  (t) => t.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'),
];

const WENYAN_RULES = [
  ...ULTRA_RULES,
  // \u4e00-\u9fff: CJK 统一表意文字 — JS 的 \w 不含中文，不保留会删光所有中文字符
  (t) => t.replace(/[^：。！？\n\w\s\d\u4e00-\u9fff]/g, ''),
  (t) => t.split('\n').filter(l => l.trim().length > 3).join('\n'),
  (t) => t.replace(/\b(?:very|really|quite|extremely|highly|absolutely|completely|totally|definitely)\b/gi, ''),
];

const RULES = {
  lite: { label: 'Lite', savings: '~35%', rules: LITE_RULES },
  full: { label: 'Full', savings: '~50%', rules: FULL_RULES },
  ultra: { label: 'Ultra', savings: '~65%', rules: ULTRA_RULES },
  wenyan: { label: 'WenYan', savings: '~70%', rules: WENYAN_RULES },
};

function compress(text, level = 'full') {
  const engine = RULES[level];
  if (!engine) throw new Error(`Unknown level: ${level}. Use lite, full, ultra, wenyan`);

  const before = text.length;
  let result = text;
  for (const rule of engine.rules) {
    result = rule(result);
  }

  // 规范化空白
  result = result.replace(/ +/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  const after = result.length;
  const saving = before > 0 ? Math.round((1 - after / before) * 100) : 0;

  return { original: before, compressed: after, saving, level, text: result };
}

function compressFile(filePath, level) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }
  const text = fs.readFileSync(filePath, 'utf-8');
  return compress(text, level);
}

function compressDir(dirPath, level, ext = ['.md', '.txt']) {
  const files = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') walk(full);
      else if (e.isFile() && ext.includes(path.extname(e.name))) files.push(full);
    }
  }
  walk(dirPath);

  let totalBefore = 0, totalAfter = 0;
  const results = [];

  for (const f of files) {
    const r = compressFile(f, level);
    if (r.saving > 0) {
      results.push({ file: path.relative(process.cwd(), f), ...r });
      totalBefore += r.original;
      totalAfter += r.compressed;
    }
  }

  return {
    files: results.length,
    totalBefore,
    totalAfter,
    totalSaving: totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0,
    level,
    details: results,
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--compress') opts.compress = args[++i];
    else if (args[i] === '--file') opts.file = args[++i];
    else if (args[i] === '--compress-memory') opts.compressMemory = args[++i];
    // --level 是 bin/devflow.js HELP 与 README 文档化的参数名；--compress-level 为兼容别名
    else if (args[i] === '--level' || args[i] === '--compress-level') opts.level = args[++i];
    else if (args[i] === '--stats') opts.stats = true;
    else if (args[i] === '--json') opts.json = true;
  }
  opts.level = opts.level || 'full';
  return opts;
}

function main() {
  const opts = parseArgs();

  if (opts.compress) {
    const result = compress(opts.compress, opts.level);
    console.log(opts.json ? JSON.stringify(result, null, 2) :
      `[${RULES[opts.level].label}] ${result.original} → ${result.compressed} chars (${result.saving}% saved)\n${result.text}`);
    return;
  }

  if (opts.file) {
    const result = compressFile(opts.file, opts.level);
    console.log(opts.json ? JSON.stringify(result, null, 2) :
      `[${RULES[opts.level].label}] ${path.basename(opts.file)}: ${result.original} → ${result.compressed} chars (${result.saving}% saved)\n---\n${result.text}`);
    return;
  }

  if (opts.compressMemory) {
    const result = compressDir(opts.compressMemory, opts.level);
    console.log(opts.json ? JSON.stringify(result, null, 2) :
      `🗜️ Memory compression [${RULES[opts.level].label}]
  Files: ${result.files}
  Total: ${result.totalBefore} → ${result.totalAfter} chars (${result.totalSaving}% saved)

  ${result.details.map(d => `  ${d.file}: ${d.original} → ${d.compressed} (${d.saving}%)`).join('\n')}`);
    return;
  }

  if (opts.stats) {
    console.log(`📊 Caveman Compression Engine
  Levels: ${Object.keys(RULES).join(', ')}
  Max savings: ${Math.max(...Object.values(RULES).map(r => parseInt(r.savings)))}%
  Min savings: ${Math.min(...Object.values(RULES).map(r => parseInt(r.savings)))}%

  Benchmark (10000 char input):
${Object.entries(RULES).map(([k, v]) => {
  const test = 'a '.repeat(5000);
  const r = compress(test, k);
  return `    ${k.padEnd(10)} ${v.savings.padEnd(8)} ${r.original} → ${r.compressed}`;
}).join('\n')}`);
    return;
  }

  console.log(`🗜️ DevFlow Caveman Compression Engine

Usage:
  --compress <text>           Compress inline text
  --file <path>               Compress a file
  --compress-memory <dir>     Compress all .md files in a directory
  --compress-level <level>    lite | full | ultra | wenyan (default: full)
  --stats                     Show benchmark
  --json                      JSON output
`);
}

// 与其他 lib 模块保持一致: require 时不自动运行 CLI，并导出核心 API
if (require.main === module) main();
module.exports = { compress, compressFile, compressDir, RULES };
