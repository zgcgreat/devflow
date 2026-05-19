#!/usr/bin/env node
/**
 * Code Intelligence — 代码结构分析
 * grep 降级策略：AST 不可用时使用正则提取
 */

const fs = require('fs');
const path = require('path');

function extractStructure(content, lang) {
  const structure = { functions: [], classes: [], imports: [], exports: [] };
  let m;

  const funcPatterns = {
    typescript: /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
    javascript: /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
    python: /def\s+(\w+)\s*\(/g,
    go: /func\s+(?:\([^)]+\)\s*)?(\w+)\s*\(/g,
    rust: /(?:pub\s+)?fn\s+(\w+)\s*\(/g,
    java: /(?:public|private|protected)?\s+(?:static\s+)?(?:\w+[<\w\s,>]*\s+)+(\w+)\s*\(/g
  };

  const classPatterns = {
    typescript: /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g,
    javascript: /(?:export\s+)?class\s+(\w+)/g,
    python: /class\s+(\w+)/g,
    java: /(?:public\s+)?(?:abstract\s+)?class\s+(\w+)/g
  };

  const fp = funcPatterns[lang] || funcPatterns.javascript;
  while ((m = fp.exec(content)) !== null) structure.functions.push(m[1] || m[2]);

  const cp = classPatterns[lang];
  if (cp) { while ((m = cp.exec(content)) !== null) structure.classes.push(m[1]); }

  const importRe = /(?:import\s+.*?from\s+['"](.+?)['"]|require\(['"](.+?)['"]\))/g;
  while ((m = importRe.exec(content)) !== null) structure.imports.push(m[1] || m[2]);

  const exportRe = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
  while ((m = exportRe.exec(content)) !== null) structure.exports.push(m[1]);

  return structure;
}

function findCallers(projectDir, symbolName) {
  const files = findSourceFiles(projectDir);
  const callers = [];
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      if (!content.includes(symbolName)) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(symbolName)) {
          callers.push({ file: path.relative(projectDir, f), line: i + 1, content: lines[i].trim() });
        }
      }
    } catch (e) { /* skip */ }
  }
  return callers;
}

function findCallees(filePath, symbolName) {
  const callees = [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let inSymbol = false, braceCount = 0;
    for (const line of lines) {
      if (line.includes(symbolName) && (line.includes('function') || line.includes('=>') || line.includes('def '))) inSymbol = true;
      if (inSymbol) {
        braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        const callMatch = line.match(/(\w+)\s*\(/g);
        if (callMatch) {
          for (const c of callMatch) {
            const name = c.replace(/\s*\(/, '');
            if (name !== symbolName && !['if','for','while','switch','return','const','let','var','function'].includes(name)) callees.push(name);
          }
        }
        if (braceCount <= 0 && inSymbol) break;
      }
    }
  } catch (e) { /* skip */ }
  return [...new Set(callees)];
}

function findReferences(projectDir, symbolName) {
  return findCallers(projectDir, symbolName); // 同一实现
}

function detectLang(file) {
  const ext = path.extname(file);
  const map = { '.js':'javascript','.jsx':'javascript','.ts':'typescript','.tsx':'typescript',
    '.py':'python','.go':'go','.rs':'rust','.java':'java','.c':'c','.cpp':'cpp' };
  return map[ext] || 'unknown';
}

function findProjectRoot(startPath) {
  let dir = path.dirname(startPath);
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json')) || fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, '.devflow'))) return dir;
    dir = path.dirname(dir);
  }
  return path.dirname(startPath);
}

function findSourceFiles(dir, exts) {
  exts = exts || ['.js','.ts','.tsx','.py','.go','.rs','.java'];
  const results = [], exclude = ['node_modules','.git','dist','build','__pycache__'];
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (exclude.some(x => e.name.includes(x))) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) results.push(...findSourceFiles(p, exts));
      else if (exts.some(ext => e.name.endsWith(ext))) results.push(p);
    }
  } catch (e) { /* skip */ }
  return results;
}

module.exports = { extractStructure, findCallers, findCallees, findReferences, detectLang, findProjectRoot, findSourceFiles };
