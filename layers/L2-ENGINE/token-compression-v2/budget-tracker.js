#!/usr/bin/env node
/**
 * Budget Tracker — Context 预算追踪器
 * 监控 context 使用量，触发自动压缩
 */

const fs = require('fs');
const path = require('path');
const { suggestCompression } = require('./compressor');

const CONFIG_FILE = '.devflow/config.yaml';
const STATE_FILE = '.devflow/STATE.md';
const MEMORY_DIR = '.devflow/memory';

// 总预算 (tokens)
const TOTAL_BUDGET = 200000;

// 分配比例
const BUDGET_ALLOC = {
  systemPrompt: 0.05,    // 10K
  skillsRules:  0.10,    // 20K
  memory:       0.15,    // 30K
  phaseContext: 0.40,    // 80K
  codeFiles:    0.20,    // 40K
  buffer:       0.10     // 20K
};

/**
 * 估算当前 context 使用量
 * 通过文件大小粗略估算 token 数量 (中文约 1.5 字/token，英文约 4 字/token)
 */
function estimateContextUsage(projectDir) {
  const usage = {
    memory: 0,
    phaseContext: 0,
    codeFiles: 0,
    totalEstimated: 0
  };

  // Memory 文件
  const memoryPath = path.join(projectDir, MEMORY_DIR);
  if (fs.existsSync(memoryPath)) {
    for (const f of fs.readdirSync(memoryPath).filter(f => f.endsWith('.md'))) {
      const content = fs.readFileSync(path.join(memoryPath, f), 'utf8');
      usage.memory += estimateTokens(content);
    }
  }

  // Phase artifacts
  const state = readStateSimple(projectDir);
  const reqDir = path.join(projectDir, '.devflow', state.reqId || 'default');
  if (fs.existsSync(reqDir)) {
    for (const f of fs.readdirSync(reqDir).filter(f => f.endsWith('.md'))) {
      const content = fs.readFileSync(path.join(reqDir, f), 'utf8');
      usage.phaseContext += estimateTokens(content);
    }
  }

  usage.totalEstimated = usage.memory + usage.phaseContext + usage.codeFiles + 30000; // +30K for system/skills

  return usage;
}

/**
 * 估算 token 数量
 * 简化估算：英文 4 chars/token，中文 1.5 chars/token
 */
function estimateTokens(text) {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}

/**
 * 计算压缩建议
 */
function getCompressionRecommendation(projectDir) {
  const usage = estimateContextUsage(projectDir);
  const memoryBudget = TOTAL_BUDGET * BUDGET_ALLOC.memory;
  const memoryUsageRatio = usage.memory / memoryBudget;

  const state = readStateSimple(projectDir);
  const phaseSuggestion = suggestCompression(state.phase || '0');

  let recommendation;
  if (memoryUsageRatio > 0.9) {
    recommendation = 'extreme';
  } else if (memoryUsageRatio > 0.7) {
    recommendation = 'ultra';
  } else if (memoryUsageRatio > 0.5) {
    recommendation = 'lite';
  } else {
    recommendation = phaseSuggestion || 'none';
  }

  return {
    usage,
    budget: { total: TOTAL_BUDGET, memoryAlloc: memoryBudget, memoryUsed: usage.memory },
    ratios: { memory: memoryUsageRatio.toFixed(2) },
    recommendation,
    phaseSuggestion,
    shouldCompress: recommendation !== 'none'
  };
}

function readStateSimple(projectDir) {
  const statePath = path.join(projectDir, STATE_FILE);
  if (!fs.existsSync(statePath)) return { phase: null, reqId: null };
  const content = fs.readFileSync(statePath, 'utf8');
  const phaseMatch = content.match(/当前阶段[:\s]*([^\n]+)/i);
  const reqMatch = content.match(/当前Req[:\s]*([^\n]+)/i);
  return { phase: phaseMatch ? phaseMatch[1].trim() : null, reqId: reqMatch ? reqMatch[1].trim() : null };
}

module.exports = { estimateContextUsage, getCompressionRecommendation, TOTAL_BUDGET, BUDGET_ALLOC };