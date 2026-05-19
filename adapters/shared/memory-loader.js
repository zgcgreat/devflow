#!/usr/bin/env node
/**
 * Memory Loader — 记忆系统加载模块
 * 统一加载 .devflow/memory/ 下的所有记忆文件
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = '.devflow/memory';

/**
 * 默认记忆文件映射
 */
const MEMORY_FILES = {
  projectContext: 'PROJECT_CONTEXT.md',
  decisions: 'DECISIONS.md',
  knownFailures: 'KNOWN_FAILURES.md',
  lessons: 'LESSONS.md',
  patterns: 'PATTERNS.md',
  apiContracts: 'API_CONTRACTS.md'
};

/**
 * 加载所有记忆文件
 * @param {string} projectDir - 项目根目录
 * @param {object} [options] - 选项
 * @param {boolean} [options.compress=false] - 是否应用 caveman 压缩
 * @param {string[]} [options.only] - 只加载指定的 key
 * @returns {object} 记忆内容映射
 */
function loadMemory(projectDir, options = {}) {
  const memoryPath = path.join(projectDir, MEMORY_DIR);

  if (!fs.existsSync(memoryPath)) {
    return { _meta: { loaded: false, path: memoryPath, files: 0 } };
  }

  const filesToLoad = options.only
    ? Object.fromEntries(Object.entries(MEMORY_FILES).filter(([k]) => options.only.includes(k)))
    : MEMORY_FILES;

  const result = { _meta: { loaded: true, path: memoryPath, files: 0, skipped: [] } };

  for (const [key, file] of Object.entries(filesToLoad)) {
    const filePath = path.join(memoryPath, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (options.compress) {
        content = compressContent(content);
      }
      result[key] = content;
      result._meta.files++;
    } else {
      result[key] = null;
      result._meta.skipped.push(file);
    }
  }

  return result;
}

/**
 * 加载 Caveman 压缩级别的记忆
 * 根据级别截断或压缩内容
 */
function loadCompressed(projectDir, level = 'full') {
  const raw = loadMemory(projectDir);
  if (!raw._meta.loaded) return raw;

  const limits = {
    lite: 500,       // 每个文件最多 500 字符
    full: Infinity,  // 不截断
    ultra: 200,      // 极限压缩
    extreme: 100     // 超极限
  };

  const limit = limits[level] || Infinity;

  for (const [key, value] of Object.entries(raw)) {
    if (key === '_meta' || !value) continue;
    if (typeof value === 'string' && value.length > limit) {
      raw[key] = value.slice(0, limit) + '\n...[truncated]';
    }
  }

  return raw;
}

/**
 * 简单压缩：移除空行和注释
 */
function compressContent(content) {
  return content
    .replace(/<!--[\s\S]*?-->/g, '')           // 移除 HTML 注释
    .replace(/^#{1,6}\s+.*$/gm, '')            // 移除标题行（保留内容）
    .replace(/\n{3,}/g, '\n\n')                // 合并多余空行
    .trim();
}

/**
 * 列出所有可用的记忆文件
 */
function listMemoryFiles(projectDir) {
  const memoryPath = path.join(projectDir, MEMORY_DIR);

  if (!fs.existsSync(memoryPath)) return [];

  return fs.readdirSync(memoryPath)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f,
      key: Object.entries(MEMORY_FILES).find(([, v]) => v === f)?.[0] || f.replace('.md', '').toLowerCase(),
      size: fs.statSync(path.join(memoryPath, f)).size,
      modified: fs.statSync(path.join(memoryPath, f)).mtime
    }));
}

module.exports = { loadMemory, loadCompressed, listMemoryFiles, MEMORY_FILES };
