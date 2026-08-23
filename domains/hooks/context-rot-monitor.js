#!/usr/bin/env node
/**
 * ForgeOS context-rot-monitor — 上下文衰减监测仪
 *
 * 监测主 Agent 的上下文窗口使用率。
 * 当使用率 > 70% 时建议压缩，> 90% 时强制暂停。
 *
 * 用法: node context-rot-monitor.js --current 45000 --max 64000
 *       node context-rot-monitor.js --auto   (从运行时读取)
 *
 * 返回: JSON { usage%, status, recommendation }
 */

function estimateTokenUsage() {
  // L0 运行时: 估算不可用，基于交互轮次估算
  return { current: 0, max: 64000, source: 'estimated' };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { current: null, max: 64000, auto: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--current') opts.current = parseInt(args[++i]);
    if (args[i] === '--max') opts.max = parseInt(args[++i]);
    if (args[i] === '--auto') opts.auto = true;
  }
  return opts;
}

function main() {
  const opts = parseArgs();

  let current, max, source;
  if (opts.auto) {
    const est = estimateTokenUsage();
    current = est.current;
    max = est.max;
    source = est.source;
  } else if (opts.current !== null) {
    current = opts.current;
    max = opts.max;
    source = 'manual';
  } else {
    console.error('用法: node context-rot-monitor.js --current <N> --max <N>');
    console.error('       node context-rot-monitor.js --auto');
    process.exit(1);
  }

  const pct = Math.round((current / max) * 100);
  let status, recommendation;

  if (pct > 90) {
    status = '🔴 CRITICAL';
    recommendation = '暂停等待确认! 使用 caveman ultra 压缩上下文，或启动新子Agent';
  } else if (pct > 70) {
    status = '🟡 WARNING';
    recommendation = '建议压缩: 使用 caveman full, 归档 memory, 或将实施交给子Agent';
  } else if (pct > 50) {
    status = '🟢 OK';
    recommendation = '上下文健康。继续执行。';
  } else {
    status = '🟢 GOOD';
    recommendation = '上下文充足。';
  }

  const result = { current, max, usagePct: pct, status, recommendation, source };
  console.log(JSON.stringify(result, null, 2));
  process.exit(pct > 90 ? 1 : 0);
}

main();
