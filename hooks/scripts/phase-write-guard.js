#!/usr/bin/env node
/**
 * DevFlow Phase Write Guard — Claude Code hook 入口
 *
 * 注册进宿主 PreToolUse / Stop 生命周期（由 devflow install --target claude
 * 通过 lib/claude-hooks.js 写入 ~/.claude/settings.json 托管段）。
 *
 * 契约（与 Claude Code 一致，Codex PreToolUse 同款）：
 *   放行 = exit 0 且无阻断输出；
 *   拦截 = stderr 写理由 + exit 2（本次工具调用被拒绝，理由回给模型）。
 * 守卫自身任何异常一律 fail-open（exit 0），绝不卡死用户工作。
 *
 * 用法: node phase-write-guard.js pretooluse   (PreToolUse，默认)
 *       node phase-write-guard.js stop         (Stop，温和提醒不阻断)
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { evaluatePreToolUse } = require(path.join(__dirname, '..', '..', 'lib', 'write-guard'));

const MAX_STDIN = 256 * 1024;

function devflowDirOf(cwd) {
  return path.join(cwd, '.devflow');
}

/** 读 state.json（裸读，不走引擎：守卫必须无副作用、快） */
function readState(devflowDir) {
  const p = path.join(devflowDir, 'state.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

/** 探测当前 git 分支；任何失败返回 null（调用方按未知分支处理 = 放行） */
function currentBranch(cwd) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 2000,
    }).trim();
  } catch { return null; }
}

function cmdPreToolUse(payload) {
  const cwd = process.cwd();
  const devflowDir = devflowDirOf(cwd);
  const result = evaluatePreToolUse({
    tool: payload.tool_name || payload.tool || '',
    toolInput: payload.tool_input || payload.toolInput || {},
    state: readState(devflowDir),
    devflowInitialized: fs.existsSync(devflowDir),
    currentBranch: currentBranch(cwd),
  });

  if (result.action === 'block') {
    process.stderr.write(`[DevFlow Guard] ${result.reason}\n`);
    process.exit(2);
  }
  process.exit(0);
}

/**
 * Stop 钩子：温和提醒（不阻断）。
 * 有未关闭的人工门控或当前阶段门控未过时，注入 systemMessage 提示继续推进。
 * stop_hook_active 时直接退出，避免防续跑循环。
 */
function cmdStop(payload) {
  if (payload && (payload.stop_hook_active === true || payload.stop_hook_active === 'true')) {
    process.exit(0);
  }
  try {
    const devflowDir = devflowDirOf(process.cwd());
    if (!fs.existsSync(path.join(devflowDir, 'state.json'))) process.exit(0);
    // 走引擎校验（只读：nextPhase 才写状态），模式裁剪/skip 豁免逻辑保持单一来源
    const { PhaseEngine } = require(path.join(__dirname, '..', '..', 'lib', 'phase-engine'));
    const engine = new PhaseEngine(process.cwd());
    const check = engine._verifyCurrentGate();
    if (!check.passed) {
      const msg = `DevFlow: ${check.reason} — 完成产物后 devflow phase --output / --gate <ID> --note "<用户确认>" 关门，再 devflow phase --next。`;
      process.stdout.write(JSON.stringify({ systemMessage: msg }));
    }
  } catch { /* fail-open */ }
  process.exit(0);
}

function main() {
  const mode = process.argv[2] || 'pretooluse';
  let raw = '';
  process.stdin.setEncoding('utf8');
  const timer = setTimeout(() => { /* 超时兜底：fail-open */ process.exit(0); }, 5000);
  process.stdin.on('data', c => { if (raw.length < MAX_STDIN) raw += c; });
  process.stdin.on('end', () => {
    clearTimeout(timer);
    let payload = {};
    try { payload = JSON.parse(raw || '{}'); } catch { /* 空/坏 payload 按空处理 */ }
    try {
      if (mode === 'stop') cmdStop(payload);
      else cmdPreToolUse(payload);
    } catch (e) {
      process.stderr.write(`[DevFlow Guard] 守卫异常（fail-open）: ${e.message}\n`);
      process.exit(0);
    }
  });
}

main();
