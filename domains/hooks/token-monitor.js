#!/usr/bin/env node
/**
 * DevFlow token-monitor — Token 使用率监控 + 自动压缩建议
 *
 * 用法: node token-monitor.js --check
 *       node token-monitor.js --compress-level full
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const LEVELS = {
  lite: { savings: '~35%', desc: '日常开发', action: '简化注释, 缩短变量名' },
  full: { savings: '~50%', desc: '复杂任务', action: '使用 caveman full 压缩输出' },
  ultra: { savings: '~65%', desc: 'Token紧张', action: '归档历史, 压缩记忆文件, 清理上下文' },
  wenyan: { savings: '~70%', desc: '极限压缩', action: '文言文风格输出, 仅保留关键信息' },
};

function getSessionRange() {
  // L0: 无API可读，返回估算
  return { used: 0, total: 64000 };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { check: false, compressLevel: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') opts.check = true;
    if (args[i] === '--compress-level') opts.compressLevel = args[++i];
  }
  return opts;
}

function main() {
  const opts = parseArgs();

  if (opts.compressLevel) {
    const level = LEVELS[opts.compressLevel];
    if (!level) {
      console.error(`❌ 未知压缩级别: ${opts.compressLevel}. 可用: lite, full, ultra, wenyan`);
      process.exit(1);
    }
    console.log(JSON.stringify({
      level: opts.compressLevel,
      savings: level.savings,
      description: level.desc,
      recommendedAction: level.action,
    }, null, 2));
    process.exit(0);
  }

  if (opts.check) {
    const range = getSessionRange();
    const pct = range.total > 0 ? Math.round((range.used / range.total) * 100) : 0;

    const result = {
      currentTokens: range.used,
      maxTokens: range.total,
      usagePercent: pct,
      status: pct > 90 ? '🔴 CRITICAL (暂停!)' : pct > 70 ? '🟡 WARNING (压缩!)' : '🟢 OK',
      recommendedLevel: pct > 90 ? 'ultra' : pct > 70 ? 'full' : 'none',
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(result, null, 2));
    process.exit(pct > 90 ? 1 : 0);
  }

  console.error('用法: node token-monitor.js --check');
  console.error('       node token-monitor.js --compress-level <lite|full|ultra|wenyan>');
  process.exit(1);
}

main();
