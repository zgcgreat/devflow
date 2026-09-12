#!/usr/bin/env node

/**
 * token-monitor.js — Token 预算运行时监控 Hook
 *
 * 监控 Token 使用率并在阈值触发时自动动作：
 * - >50%: ADVISORY — 显示提醒
 * - >70%: WARNING → 自动切换 lite 压缩模式 (surface-switch lite)
 * - >90%: CRITICAL → 暂停执行，等待用户确认
 *
 * 来源: CHANGELOG v1.1.0 — caveman caveman-stats + Ruflo context-monitor
 *
 * Hook 类型: post_tool_use
 * 超时: 3000ms
 * 失败策略: advisory (不阻塞)
 *
 * 使用方式:
 *   在 hooks.json 中注册为 post_tool_use 类型 Hook
 *   每次工具调用后自动检查 Token 使用率
 */

const path = require('path');
const fs = require('fs');

// ============================================================================
// 配置
// ============================================================================

const DEFAULT_CONFIG = {
  budget_model: 'claude-sonnet-4-6',
  total_budget: 200000,           // 200K tokens (Claude Sonnet context window)
  thresholds: {
    advisory: 0.5,                // 50% — 显示提醒
    compress: 0.7,                // 70% — 自动压缩
    pause: 0.9,                   // 90% — 暂停等待确认
  },
  auto_actions: {
    compress: 'surface-switch lite',  // 70% 时自动切换到 lite 模式
    pause: '等待用户确认继续',          // 90% 时暂停
  },
  statusline: {
    enabled: true,                // 是否在 statusline 显示 Token 消耗
    format: 'ForgeOS Token: {bar} {percent}% | Mode: {mode} | Saved: {saved}',
  },
};

// ============================================================================
// Token 预算检查核心逻辑
// ============================================================================

function checkTokenBudget(context) {
  const used = context.tokens_used || 0;
  const total = context.tokens_budget || DEFAULT_CONFIG.total_budget;

  if (total <= 0) {
    return { level: 'OK', action: 'NONE', message: 'Token budget not configured' };
  }

  const ratio = used / total;
  const percent = Math.round(ratio * 100);

  // 90% — CRITICAL: 暂停执行
  if (ratio >= DEFAULT_CONFIG.thresholds.pause) {
    return {
      level: 'CRITICAL',
      action: 'PAUSE',
      ratio: ratio,
      percent: percent,
      message: `⚠️ Token 使用率 ${percent}%，已超过 90% 阈值。` +
        `建议：1) compact 压缩上下文 2) 结束当前 Phase 3) 用户确认继续`,
      auto_trigger: 'pause',
      recommendation: [
        '运行 /compact 压缩上下文',
        '完成当前 Phase 的最小产出后停止',
        '等待用户确认是否继续',
      ],
    };
  }

  // 70% — WARNING: 自动压缩
  if (ratio >= DEFAULT_CONFIG.thresholds.compress) {
    return {
      level: 'WARNING',
      action: 'COMPRESS',
      ratio: ratio,
      percent: percent,
      message: `📊 Token 使用率 ${percent}%，已超过 70% 阈值。自动切换到 lite 压缩模式。`,
      auto_trigger: DEFAULT_CONFIG.auto_actions.compress,
      recommendation: [
        '自动切换到 surface-switch lite 模式',
        '减少加载的 reference 文件',
        '压缩 LESSONS 到 <5K tokens',
      ],
    };
  }

  // 50% — ADVISORY: 显示提醒
  if (ratio >= DEFAULT_CONFIG.thresholds.advisory) {
    return {
      level: 'ADVISORY',
      action: 'MONITOR',
      ratio: ratio,
      percent: percent,
      message: `📈 Token 使用率 ${percent}%，建议关注消耗趋势。`,
      auto_trigger: null,
      recommendation: [
        '关注 Token 消耗趋势',
        '避免加载不必要的 reference 文件',
      ],
    };
  }

  // 正常
  return {
    level: 'OK',
    action: 'NONE',
    ratio: ratio,
    percent: percent,
    message: `✅ Token 使用率 ${percent}%，在正常范围内。`,
  };
}

// ============================================================================
// Statusline 显示
// ============================================================================

function generateStatusline(result, context) {
  if (!DEFAULT_CONFIG.statusline.enabled) return null;

  const percent = result.percent || 0;
  const filled = Math.round(percent / 5);   // 20-char bar
  const empty = 20 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  const mode = result.action === 'COMPRESS' ? 'lite' :
               result.action === 'PAUSE' ? 'paused' : 'standard';

  const saved = context.tokens_saved || 0;
  const savedK = saved > 1000 ? `${(saved / 1000).toFixed(1)}K` : saved;

  return DEFAULT_CONFIG.statusline.format
    .replace('{bar}', bar)
    .replace('{percent}', percent)
    .replace('{mode}', mode)
    .replace('{saved}', savedK);
}

// ============================================================================
// Hook 入口
// ============================================================================

async function run(context) {
  // 从上下文或环境变量获取 Token 信息
  const tokenContext = {
    tokens_used: parseInt(process.env.FORGEOS_TOKENS_USED || '0', 10),
    tokens_budget: parseInt(
      process.env.FORGEOS_TOKENS_BUDGET || String(DEFAULT_CONFIG.total_budget), 10
    ),
    tokens_saved: parseInt(process.env.FORGEOS_TOKENS_SAVED || '0', 10),
  };

  // 如果上下文中提供了 Token 信息，优先使用
  if (context && context.tokens_used) {
    tokenContext.tokens_used = context.tokens_used;
  }
  if (context && context.tokens_budget) {
    tokenContext.tokens_budget = context.tokens_budget;
  }

  const result = checkTokenBudget(tokenContext);
  const statusline = generateStatusline(result, tokenContext);

  // 输出结果
  const output = {
    hook: 'token-monitor',
    level: result.level,
    action: result.action,
    percent: result.percent,
    message: result.message,
    auto_trigger: result.auto_trigger || null,
    recommendation: result.recommendation || [],
  };

  if (statusline) {
    output.statusline = statusline;
  }

  // 写入输出（AI 读取）
  if (result.level !== 'OK') {
    console.log(JSON.stringify(output, null, 2));
  }

  // 90% 暂停时返回非零退出码（advisory 模式下不会真正阻断）
  if (result.level === 'CRITICAL') {
    // 在 advisory 模式下，仅输出警告，不阻断
    // 如果希望真正阻断，将 hooks.json 中的 fail_action 改为 "gate_fail"
    return { exitCode: 0, result: output };
  }

  return { exitCode: 0, result: output };
}

// ============================================================================
// CLI 独立运行模式
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  // --check: 快速检查当前状态
  if (args.includes('--check')) {
    const result = checkTokenBudget({
      tokens_used: parseInt(args[args.indexOf('--used') + 1] || '0', 10) || 0,
      tokens_budget: parseInt(args[args.indexOf('--budget') + 1] || String(DEFAULT_CONFIG.total_budget), 10),
    });
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  // --config: 显示当前配置
  if (args.includes('--config')) {
    console.log(JSON.stringify(DEFAULT_CONFIG, null, 2));
    process.exit(0);
  }

  // 默认：运行 Hook
  run({}).then(({ result }) => {
    if (result) {
      console.log(JSON.stringify(result, null, 2));
    }
  });
}

module.exports = { run, checkTokenBudget, DEFAULT_CONFIG };
