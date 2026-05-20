#!/usr/bin/env node
/**
 * Compressor — 分级压缩调度器
 * 决定何时压缩、压缩到什么级别、压缩哪些文件
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = '.devflow/memory';
const CONFIG_FILE = '.devflow/config.yaml';

// ============================================================
// 压缩策略
// ============================================================

const strategies = {
  lite: {
    name: 'lite',
    targetReduction: 0.4,
    description: 'Remove redundancy, merge short sentences',
    rules: [
      'Remove articles: a, an, the',
      'Remove filler: just, really, basically, actually, simply',
      'Shorten: "in order to" → "to"',
      'Shorten: "make sure to" → "ensure"',
      'Merge consecutive short sentences',
      'Preserve ALL code blocks exactly',
      'Preserve ALL URLs exactly'
    ]
  },
  ultra: {
    name: 'ultra',
    targetReduction: 0.7,
    description: 'Caveman compression + structural simplification',
    rules: [
      'Apply caveman-compress style compression',
      'Remove all pleasantries and hedging',
      'Convert prose to bullet points',
      'Replace descriptions with code examples',
      'Remove redundant sections',
      'Preserve code blocks, URLs, technical terms',
      'Apply Karpathy rules: code > comments, delete > simplify'
    ]
  },
  extreme: {
    name: 'extreme',
    targetReduction: 0.9,
    description: 'Keyword extraction + code preservation only',
    rules: [
      'Extract only keywords and identifiers',
      'Preserve code blocks (truncate to 5 lines max)',
      'Preserve URLs as-is',
      'Replace all prose with shorthand notation',
      'Use YAML/key-value format instead of markdown prose',
      'Remove ALL non-essential content'
    ]
  }
};

// ============================================================
// Phase 压缩建议
// NOTE: phaseSuggestions 是纯建议性的。当前无自动触发机制——
// 需要在 Phase 转换时由外部调用方（如 gate-checker.js 或 Phase skill）
// 调用 suggestCompression() 并根据结果执行 compress()。
// TODO: 在 Phase advance 流程中集成自动压缩触发。
// ============================================================

const phaseSuggestions = {
  '0': null,      // 初始阶段，不需要压缩
  '1': 'lite',    // 需求确认后轻度压缩
  '2': 'lite',    // 设计阶段轻度压缩
  '3': 'ultra',   // 任务规划后重度压缩
  '4': 'ultra',   // 构建阶段重度压缩
  '5': 'lite',    // 测试阶段还原细节
  '6': 'lite',    // 审查需完整上下文
  '7': 'lite',    // Canary 需完整上下文
  '8': 'ultra'    // 归档阶段重度压缩
};

// ============================================================
// 压缩执行
// ============================================================

/**
 * 执行压缩
 * @param {string} content - 原始内容
 * @param {string} level - 压缩级别 lite|ultra|extreme
 */
function compress(content, level) {
  const strategy = strategies[level] || strategies.lite;
  let result = content;

  if (level === 'lite') {
    result = liteCompress(result);
  } else if (level === 'ultra') {
    result = ultraCompress(result);
  } else if (level === 'extreme') {
    result = extremeCompress(result);
  }

  return {
    original: content.length,
    compressed: result.length,
    reduction: ((content.length - result.length) / content.length * 100).toFixed(1) + '%',
    level,
    content: result
  };
}

function liteCompress(content) {
  // 移除填充词和冗余
  return content
    .replace(/\b(just|really|basically|actually|simply|essentially|generally)\b/gi, '')
    .replace(/\bin order to\b/gi, 'to')
    .replace(/\bmake sure to\b/gi, 'ensure')
    .replace(/\bthe reason is because\b/gi, 'because')
    .replace(/\bhowever\b/gi, '')
    .replace(/\bfurthermore\b/gi, '')
    .replace(/\badditionally\b/gi, '')
    .replace(/\bin addition\b/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ultraCompress(content) {
  let result = liteCompress(content);
  // 转为 bullet points
  const lines = result.split('\n');
  const converted = lines.map(line => {
    if (line.trim().startsWith('-')) return line; // 已是 bullet
    if (line.trim().startsWith('#')) return line; // 保留标题
    if (line.trim().startsWith('```')) return line; // 保留代码块
    if (line.trim().length > 20 && !line.trim().startsWith('|'))
      return '- ' + line.trim();
    return line;
  });
  result = converted.join('\n');
  // 移除长段落中的描述性文本
  result = result.replace(/\n{3,}/g, '\n\n').trim();
  return result;
}

function extremeCompress(content) {
  // 极限压缩：提取关键词
  const lines = content.split('\n');
  const result = [];
  let inCodeBlock = false;
  let codeLines = 0;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      codeLines = 0;
      continue;
    }
    if (inCodeBlock) {
      codeLines++;
      if (codeLines <= 5) result.push(line);
      else if (codeLines === 6) result.push('# ... truncated');
      continue;
    }
    // 非代码行：只保留标题和 bullet
    if (line.trim().startsWith('#') || line.trim().startsWith('-') || line.trim().startsWith('|'))
      result.push(line);
    // URL 保留
    else if (/https?:\/\//.test(line)) result.push(line);
    // 其他内容转为 keyword 格式
    else if (line.trim().length > 0) {
      const keywords = line.trim().replace(/\b(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|shall|should|may|might|can|could|must|of|in|to|for|with|on|at|by|from|as|into|through|during|before|after|above|below|between|under|over|and|but|or|nor|not|so|yet)\b/gi, '').trim();
      if (keywords.length > 3) result.push('- ' + keywords);
    }
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ============================================================
// 项目级压缩
// ============================================================

function compressProject(projectDir, level) {
  const memoryPath = path.join(projectDir, MEMORY_DIR);
  if (!fs.existsSync(memoryPath)) return { compressed: [], skipped: 'No memory directory' };

  const strategy = strategies[level] || strategies.lite;
  const results = [];

  const files = fs.readdirSync(memoryPath).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(memoryPath, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // 备份原文件
    const backupPath = filePath.replace('.md', '.original.md');
    if (!fs.existsSync(backupPath)) fs.writeFileSync(backupPath, content);

    // 压缩
    const result = compress(content, level);
    fs.writeFileSync(filePath, result.content);

    results.push({
      file,
      originalSize: result.original,
      compressedSize: result.compressed,
      reduction: result.reduction
    });
  }

  // 更新配置
  updateConfig(projectDir, level);

  return { strategy: strategy.name, results };
}

function updateConfig(projectDir, level) {
  const configPath = path.join(projectDir, CONFIG_FILE);
  let config = '';
  if (fs.existsSync(configPath)) {
    config = fs.readFileSync(configPath, 'utf8');
    if (config.includes('caveman:')) {
      config = config.replace(/caveman:\s*\n\s*level:\s*\w+/, 'caveman:\n  level: ' + level);
    } else {
      config += '\ncaveman:\n  level: ' + level + '\n';
    }
  } else {
    config = 'caveman:\n  level: ' + level + '\n';
  }
  fs.writeFileSync(configPath, config);
}

function suggestCompression(currentPhase) {
  const key = currentPhase.split('-')[0];
  return phaseSuggestions[key] || null;
}

module.exports = { compress, compressProject, suggestCompression, strategies, phaseSuggestions };