#!/usr/bin/env node
/**
 * DevFlow code-explorer — 代码解析引擎
 *
 * 零依赖的静态代码分析器。扫描文件提取符号、调用关系、影响范围。
 * 设计目标: 替代 90% 的 read_file + grep 调用。
 *
 * 用法:
 *   node code-explorer.js --symbol "login"                    # 搜索符号
 *   node code-explorer.js --callchain "authenticate"          # 调用链
 *   node code-explorer.js --impact "src/auth/login.ts"        # 爆炸半径
 *   node code-explorer.js --scan "."                          # 全量扫描
 *   node code-explorer.js --deps                              # 依赖图
 */

const fs = require('fs');
const path = require('path');

// 匹配常见语言的函数/类/方法定义
const PATTERNS = {
  functions: [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
    /(?:export\s+)?(?:async\s+)?(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>/g,
    /(?:export\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g,
    /def\s+(\w+)\s*\(/g,
    /fn\s+(\w+)\s*\(/g,
    /func\s+(\w+)\s*\(/g,
  ],
  classes: [
    /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g,
    /(?:export\s+)?interface\s+(\w+)/g,
    /(?:export\s+)?type\s+(\w+)\s*=/g,
  ],
  imports: [
    /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g,
    /from\s+['"]([^'"]+)['"]/g,
    /use\s+(?:\w+\s*::\s*)*(\w+)/g,
  ],
  exports: [
    /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
    /module\.exports\s*=\s*(\w+)/g,
    /pub\s+(?:fn|struct|enum|trait|impl)\s+(\w+)/g,
  ],
};

const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv', '.venv', 'target'];

function findFiles(dir, ext = ['.js', '.ts', '.jsx', '.tsx', '.py', '.rs', '.go', '.java', '.rb', '.php']) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.includes(entry.name) && !entry.name.startsWith('.')) {
          results.push(...findFiles(full, ext));
        }
      } else if (entry.isFile() && ext.includes(path.extname(entry.name))) {
        results.push(full);
      }
    }
  } catch { /* skip unreadable */ }
  return results;
}

function extractSymbols(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const symbols = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Functions
      for (const pat of PATTERNS.functions) {
        pat.lastIndex = 0;
        const m = pat.exec(line);
        if (m) symbols.push({ type: 'function', name: m[1], line: i + 1, file: filePath });
      }

      // Classes
      for (const pat of PATTERNS.classes) {
        pat.lastIndex = 0;
        const m = pat.exec(line);
        if (m) symbols.push({ type: 'class', name: m[1], line: i + 1, file: filePath });
      }

      // Imports
      for (const pat of PATTERNS.imports) {
        pat.lastIndex = 0;
        const m = pat.exec(line);
        if (m) symbols.push({ type: 'import', name: m[1], line: i + 1, file: filePath });
      }

      // Exports
      for (const pat of PATTERNS.exports) {
        pat.lastIndex = 0;
        const m = pat.exec(line);
        if (m) symbols.push({ type: 'export', name: m[1], line: i + 1, file: filePath });
      }
    }

    return symbols;
  } catch { return []; }
}

function analyzeCallChain(symbolName, symbols) {
  const definitions = symbols.filter(s => s.name === symbolName && s.type !== 'import');
  // 显式括号化（原写法依赖 && 优先于 || 的隐式优先级，易误读）；近似引用计数
  const callers = symbols.filter(s => (s.type === 'import' && s.name.includes(symbolName)) || s.type === 'function');
  return { symbol: symbolName, definitions, callers: callers.length };
}

function calculateImpact(filePath, allFiles) {
  const target = path.resolve(filePath);
  const base = path.basename(filePath, path.extname(filePath));
  const impacted = allFiles.filter(f => {
    // 用 resolve 后路径比较（原写法相对 vs 绝对路径直接 !==，目标文件会把自己算进影响面）
    if (path.resolve(f) === target) return false;
    try { return fs.readFileSync(f, 'utf-8').includes(base); } catch { return false; }
  });
  return {
    target: filePath,
    directImpact: impacted.length,
    impactedFiles: impacted.slice(0, 20), // 最多20
    suggested: impacted.length > 20 ? `+${impacted.length - 20} more` : '',
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--symbol') opts.symbol = args[++i];
    else if (args[i] === '--callchain') opts.callchain = args[++i];
    else if (args[i] === '--impact') opts.impact = args[++i];
    else if (args[i] === '--scan') opts.scan = args[++i];
    else if (args[i] === '--deps') opts.deps = true;
    else if (args[i] === '--json') opts.json = true;
    else if (args[i] === '--dir') opts.dir = args[++i];
  }
  return opts;
}

function main() {
  const opts = parseArgs();
  const targetDir = opts.dir || process.cwd();

  if (opts.symbol) {
    // Search for a symbol
    const files = findFiles(targetDir);
    const allSymbols = files.flatMap(extractSymbols);
    const matches = allSymbols.filter(s => s.name.toLowerCase().includes(opts.symbol.toLowerCase()));
    const result = {
      query: opts.symbol,
      total: matches.length,
      symbols: matches.slice(0, 30),
    };
    const output = opts.json ? JSON.stringify(result, null, 2) : formatSymbolTable(result);
    console.log(output);
    return;
  }

  if (opts.callchain) {
    const files = findFiles(targetDir);
    const allSymbols = files.flatMap(extractSymbols);
    const result = analyzeCallChain(opts.callchain, allSymbols);
    console.log(opts.json ? JSON.stringify(result, null, 2) : formatCallChain(result, allSymbols));
    return;
  }

  if (opts.impact) {
    const targetPath = path.resolve(targetDir, opts.impact);
    if (!fs.existsSync(targetPath)) {
      console.error(`❌ 文件不存在: ${targetPath}`);
      process.exit(1);
    }
    const files = findFiles(targetDir);
    const result = calculateImpact(opts.impact, files);
    console.log(opts.json ? JSON.stringify(result, null, 2) : formatImpact(result));
    return;
  }

  if (opts.scan) {
    const scanDir = path.resolve(targetDir, opts.scan);
    const files = findFiles(scanDir);
    const allSymbols = files.flatMap(extractSymbols);
    const result = {
      files: files.length,
      symbols: allSymbols.length,
      functions: allSymbols.filter(s => s.type === 'function').length,
      classes: allSymbols.filter(s => s.type === 'class').length,
    };
    console.log(opts.json ? JSON.stringify(result, null, 2) : formatScan(result));
    return;
  }

  if (opts.deps) {
    // 依赖图: 解析每个文件的 import，尝试将相对路径解析到实际文件
    const files = findFiles(targetDir);
    const fileSet = new Set(files.map(f => path.resolve(f)));
    const resolveLocal = (fromFile, spec) => {
      const base = path.resolve(path.dirname(fromFile), spec);
      const candidates = [
        base,
        `${base}.js`, `${base}.ts`, `${base}.jsx`, `${base}.tsx`,
        path.join(base, 'index.js'), path.join(base, 'index.ts'),
      ];
      return candidates.find(c => fileSet.has(path.resolve(c))) || null;
    };

    const deps = files.map(f => {
      const imports = extractSymbols(f).filter(s => s.type === 'import');
      const internal = [], external = [];
      for (const imp of imports) {
        if (imp.name.startsWith('.')) {
          const hit = resolveLocal(f, imp.name);
          if (hit) internal.push(hit); else external.push(imp.name); // 未解析的相对路径按外部处理
        } else {
          external.push(imp.name);
        }
      }
      return { file: f, internal, external };
    }).filter(d => d.internal.length > 0 || d.external.length > 0);

    const result = { files: deps.length, edges: deps.flatMap(d => d.internal.map(t => ({ from: d.file, to: t }))) };
    console.log(opts.json ? JSON.stringify(result, null, 2) : formatDeps(deps));
    return;
  }

  // Default: show help
  console.log(`🔬 DevFlow Code Explorer

Usage:
  --symbol <name>       Search for symbol across all source files
  --callchain <name>    Show call chain for a function/symbol
  --impact <file>       Calculate impact radius of changing a file
  --scan <dir>          Full scan: files, symbols, classes count
  --deps                Show dependency graph (imports)
  --json                JSON output (for hook consumption)
  --dir <path>          Project root directory (default: cwd)
`);
}

function formatSymbolTable(result) {
  const lines = [`🔍 "${result.query}" — ${result.total} matches\n`];
  result.symbols.forEach(s => {
    const relative = path.relative(process.cwd(), s.file);
    lines.push(`  ${s.type.padEnd(10)} ${s.name.padEnd(25)} ${relative}:${s.line}`);
  });
  return lines.join('\n');
}

function formatCallChain(chain, allSymbols) {
  const lines = [`📞 Call chain for "${chain.symbol}":`];
  lines.push(`  Definitions: ${chain.definitions.length}`);
  lines.push(`  Callers: ${chain.callers} references`);

  // Show related functions in same files
  const refFiles = chain.definitions.map(d => d.file);
  const related = allSymbols.filter(s => refFiles.includes(s.file) && s.type === 'function' && s.name !== chain.symbol);
  if (related.length > 0) {
    lines.push(`\n  Related functions in same scope:`);
    related.slice(0, 10).forEach(r => lines.push(`    ${r.name} (${path.relative(process.cwd(), r.file)}:${r.line})`));
  }
  return lines.join('\n');
}

function formatImpact(result) {
  const lines = [`💥 Impact analysis: ${result.target}\n`];
  lines.push(`  Directly impacted files: ${result.directImpact}`);
  lines.push(`\n  Impacted files:`);
  result.impactedFiles.forEach(f => lines.push(`    ${f}`));
  if (result.suggested) lines.push(`    ${result.suggested}`);
  return lines.join('\n');
}

function formatDeps(deps) {
  const lines = [`📦 Dependency graph: ${deps.length} files with imports\n`];
  deps.forEach(d => {
    const rel = path.relative(process.cwd(), d.file);
    lines.push(`  ${rel}`);
    d.internal.forEach(t => lines.push(`    → ${path.relative(process.cwd(), t)}`));
    if (d.external.length > 0) lines.push(`    ⊘ external: ${d.external.slice(0, 10).join(', ')}${d.external.length > 10 ? ` (+${d.external.length - 10})` : ''}`);
  });
  return lines.join('\n');
}

function formatScan(result) {
  return `📊 Codebase scan summary
  Source files: ${result.files}
  Total symbols: ${result.symbols}
  Functions: ${result.functions}
  Classes: ${result.classes}
  Avg symbols/file: ${result.files > 0 ? (result.symbols / result.files).toFixed(1) : 0}`;
}

// 仅在作为 CLI 直接执行时运行；被 require 加载时不得产生副作用输出
// (历史 bug: 无条件 main() 导致 devflow doctor 加载检查时打印横幅污染输出)
if (require.main === module) main();
