#!/usr/bin/env node
/**
 * Blast Radius — 影响分析引擎
 * 
 * 分析代码变更的影响范围，输出风险评级和受影响文件列表。
 * 降级策略: AST → grep → 文件路径推测
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================
// 依赖图构建
// ============================================================

/**
 * 构建项目依赖图
 * 策略: import/require 解析 → 模块级依赖
 */
function buildDependencyGraph(projectDir, options = {}) {
  const scope = options.scope || 'project';
  const targetPath = options.path || projectDir;
  
  const graph = { nodes: {}, edges: [] };
  
  // 查找所有源文件
  const extensions = options.extensions || ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java'];
  const files = findSourceFiles(targetPath, extensions, options.exclude || ['node_modules', '.git', 'dist', 'build']);
  
  for (const file of files) {
    const relPath = path.relative(projectDir, file);
    const imports = extractImports(file);
    
    graph.nodes[relPath] = {
      path: relPath,
      language: detectLanguage(file),
      imports: imports.map(imp => resolveImport(imp, file, projectDir)).filter(Boolean)
    };
    
    for (const imp of graph.nodes[relPath].imports) {
      graph.edges.push({ from: relPath, to: imp });
    }
  }
  
  return graph;
}

// ============================================================
// 影响分析
// ============================================================

/**
 * 计算影响半径
 * @param {object} graph - 依赖图
 * @param {string[]} changedFiles - 变更文件列表
 * @param {string[]} [changedSymbols] - 变更符号列表
 */
function computeBlastRadius(graph, changedFiles, changedSymbols = []) {
  const result = {
    changed_files: changedFiles,
    changed_symbols: changedSymbols,
    impact: { direct: [], indirect: [], test: [] },
    overall_risk: 'low',
    recommended_tests: [],
    recommended_reviewers: []
  };
  
  // 反转图：从被依赖角度查找
  const reverseDeps = buildReverseDeps(graph);
  
  for (const file of changedFiles) {
    const relFile = file.replace(/\\/g, '/');
    
    // Direct: 直接依赖变更文件的文件
    if (reverseDeps[relFile]) {
      for (const dep of reverseDeps[relFile]) {
        result.impact.direct.push({
          file: dep,
          reason: 'Imports ' + relFile,
          risk: assessRisk(dep, graph.nodes[dep])
        });
      }
    }
    
    // Indirect: 二级依赖
    for (const direct of result.impact.direct) {
      if (reverseDeps[direct.file]) {
        for (const indirect of reverseDeps[direct.file]) {
          if (!result.impact.direct.some(d => d.file === indirect) &&
              !result.impact.indirect.some(d => d.file === indirect) &&
              !changedFiles.includes(indirect)) {
            result.impact.indirect.push({
              file: indirect,
              reason: 'Depends on ' + direct.file,
              risk: 'low'
            });
          }
        }
      }
    }
    
    // Test: 受影响的测试文件
    const testFiles = [...result.impact.direct, ...result.impact.indirect]
      .filter(d => isTestFile(d.file));
    result.impact.test = testFiles.map(d => ({
      file: d.file,
      reason: d.reason,
      risk: 'high'
    }));
  }
  
  // 计算总体风险
  result.overall_risk = computeOverallRisk(result.impact);
  result.recommended_tests = recommendTests(result.impact);
  
  return result;
}

// ============================================================
// 风险评估
// ============================================================

function assessRisk(file, nodeInfo) {
  if (!nodeInfo) return 'low';
  const importCount = (nodeInfo.imports || []).length;
  if (importCount > 10) return 'high';
  if (importCount > 5) return 'medium';
  return 'low';
}

function computeOverallRisk(impact) {
  const totalAffected = impact.direct.length + impact.indirect.length + impact.test.length;
  if (totalAffected > 10 || impact.test.length > 3) return 'critical';
  if (totalAffected > 5 || impact.test.length > 1) return 'high';
  if (totalAffected > 2) return 'medium';
  return 'low';
}

function recommendTests(impact) {
  const tests = [];
  if (impact.test.length > 0) tests.push('unit');
  if (impact.direct.length > 3) tests.push('integration');
  if (impact.indirect.length > 2) tests.push('e2e');
  if (tests.length === 0) tests.push('smoke');
  return tests;
}

// ============================================================
// 辅助函数
// ============================================================

function buildReverseDeps(graph) {
  const reverse = {};
  for (const [node, info] of Object.entries(graph.nodes)) {
    for (const imp of (info.imports || [])) {
      if (!reverse[imp]) reverse[imp] = [];
      if (!reverse[imp].includes(node)) reverse[imp].push(node);
    }
  }
  return reverse;
}

function extractImports(filePath) {
  const imports = [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // JS/TS imports
    const jsMatches = content.matchAll(/(?:import\s+.*?from\s+['"](.+?)['"]|require\(['"](.+?)['"]\))/g);
    for (const m of jsMatches) {
      imports.push(m[1] || m[2]);
    }
    // Python imports
    const pyMatches = content.matchAll(/(?:from\s+(\S+)\s+import|import\s+(\S+))/g);
    for (const m of pyMatches) {
      imports.push(m[1] || m[2]);
    }
  } catch (e) { /* skip unreadable files */ }
  return imports;
}

function resolveImport(imp, fromFile, projectDir) {
  if (!imp) return null;
  // 相对路径解析
  if (imp.startsWith('.')) {
    const dir = path.dirname(fromFile);
    const resolved = path.resolve(dir, imp);
    const relPath = path.relative(projectDir, resolved).replace(/\\/g, '/');
    // 尝试常见扩展名
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js']) {
      if (fs.existsSync(path.join(projectDir, relPath + ext))) return relPath + ext;
    }
    return relPath;
  }
  return null; // 跳过 node_modules
}

function findSourceFiles(dir, extensions, exclude) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (exclude.some(e => entry.name.includes(e))) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...findSourceFiles(full, extensions, exclude));
      else if (extensions.some(ext => entry.name.endsWith(ext))) results.push(full);
    }
  } catch (e) { /* permission denied, skip */ }
  return results;
}

function detectLanguage(file) {
  const ext = path.extname(file);
  const map = { '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
    '.py': 'python', '.go': 'go', '.rs': 'rust', '.java': 'java' };
  return map[ext] || 'unknown';
}

function isTestFile(file) {
  return /(?:test|spec|__tests__)/i.test(file);
}

module.exports = { buildDependencyGraph, computeBlastRadius, assessRisk };
