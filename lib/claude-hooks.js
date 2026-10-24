#!/usr/bin/env node
/**
 * DevFlow Claude Hooks — ~/.claude/settings.json 托管段合并
 *
 * 借鉴 AI-DLC 的 managed-block 思想：向用户的 Claude Code 配置里注册
 * DevFlow 守卫 hook，但绝不覆盖用户已有配置 ——
 *   - 识别标识：command 含 phase-write-guard.js 的条目视为 DevFlow 托管；
 *   - 幂等：重复安装先移除旧托管条目再写入最新，不会产生重复；
 *   - 安全：写前备份 settings.json.devflow-bak（保留最近一份）；
 *     配置不可解析时直接失败，绝不 clobber。
 *
 * 纯函数（merge/remove）与 I/O（apply）分离，便于测试。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { GUARD_MARKER } = require('./write-guard');

const HOOK_SCRIPT_REL = path.join('hooks', 'scripts', 'phase-write-guard.js');

/** 生成 hook command（正斜杠路径，Windows/POSIX 的 node 都接受） */
function hookCommand(devflowRoot, mode) {
  const script = path.join(devflowRoot, HOOK_SCRIPT_REL).replace(/\\/g, '/');
  return `node "${script}" ${mode}`;
}

/** DevFlow 要注册的 hook 条目（Claude Code settings hooks 形状） */
function buildHookEntries(devflowRoot) {
  return {
    PreToolUse: [
      {
        matcher: 'Write|Edit|MultiEdit|NotebookEdit|Bash',
        hooks: [{ type: 'command', command: hookCommand(devflowRoot, 'pretooluse'), timeout: 10 }],
      },
    ],
    Stop: [
      {
        matcher: '',
        hooks: [{ type: 'command', command: hookCommand(devflowRoot, 'stop'), timeout: 10 }],
      },
    ],
  };
}

const isManaged = (entry) =>
  Array.isArray(entry && entry.hooks) &&
  entry.hooks.some(h => typeof h.command === 'string' && h.command.includes(GUARD_MARKER));

/**
 * 把 DevFlow 托管条目合并进 settings 对象（纯函数）。
 * @returns {{settings: object, changed: boolean}}
 */
function mergeManagedHooks(settings, devflowRoot) {
  const next = JSON.parse(JSON.stringify(settings || {}));
  next.hooks = next.hooks && typeof next.hooks === 'object' ? next.hooks : {};
  const entries = buildHookEntries(devflowRoot);
  let changed = false;

  for (const [event, ours] of Object.entries(entries)) {
    const existing = Array.isArray(next.hooks[event]) ? next.hooks[event] : [];
    const kept = existing.filter(e => !isManaged(e));
    const hadOurs = kept.length !== existing.length;
    const oursEntry = ours[0];
    const alreadyCurrent = hadOurs &&
      existing.filter(isManaged).some(e => JSON.stringify(e) === JSON.stringify(oursEntry));
    if (!alreadyCurrent) {
      next.hooks[event] = [...kept, ...ours];
      changed = true;
    } else {
      next.hooks[event] = existing;
    }
  }
  return { settings: next, changed };
}

/** 移除全部 DevFlow 托管条目（纯函数）。@returns {{settings, changed}} */
function removeManagedHooks(settings) {
  const next = JSON.parse(JSON.stringify(settings || {}));
  let changed = false;
  if (next.hooks && typeof next.hooks === 'object') {
    for (const event of Object.keys(next.hooks)) {
      if (!Array.isArray(next.hooks[event])) continue;
      const kept = next.hooks[event].filter(e => !isManaged(e));
      if (kept.length !== next.hooks[event].length) {
        next.hooks[event] = kept;
        changed = true;
      }
      if (kept.length === 0) delete next.hooks[event];
    }
    if (Object.keys(next.hooks).length === 0) delete next.hooks;
  }
  return { settings: next, changed };
}

/**
 * 应用/移除托管 hook 到 <homeDir>/.claude/settings.json。
 * @param {object} opts
 * @param {string} opts.homeDir 用户主目录（测试可传临时目录）
 * @param {string} opts.devflowRoot DevFlow 仓库根（hook 脚本绝对路径的来源）
 * @param {boolean} [opts.remove=false] true = 只移除托管条目
 * @param {boolean} [opts.dryRun=false] 只计算不写盘
 * @returns {{changed:boolean, settingsPath:string, backupPath?:string, summary:string}}
 */
function applyClaudeHooks({ homeDir, devflowRoot, remove = false, dryRun = false }) {
  const claudeDir = path.join(homeDir, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch (e) {
      throw new Error(`现有 settings.json 无法解析，拒绝修改（请手工处理后重试）: ${settingsPath}\n${e.message}`);
    }
  }

  const result = remove ? removeManagedHooks(settings) : mergeManagedHooks(settings, devflowRoot);
  if (!result.changed) {
    return { changed: false, settingsPath, summary: remove ? '托管 hook 本就不存在' : '托管 hook 已是最新，无需改动' };
  }
  if (dryRun) {
    return { changed: true, settingsPath, summary: remove ? '[dry-run] 将移除托管 hook' : '[dry-run] 将写入托管 hook' };
  }

  fs.mkdirSync(claudeDir, { recursive: true });
  const backupPath = `${settingsPath}.devflow-bak`;
  if (fs.existsSync(settingsPath)) fs.copyFileSync(settingsPath, backupPath);
  fs.writeFileSync(settingsPath, JSON.stringify(result.settings, null, 2) + '\n');

  return {
    changed: true,
    settingsPath,
    backupPath,
    summary: remove
      ? `已移除托管 hook（备份: ${path.basename(backupPath)}）`
      : `已注册写入守卫 hook 到 Claude Code（备份: ${path.basename(backupPath)}）`,
  };
}

/** 检查托管 hook 是否已注册（doctor 用）。@returns {{registered:boolean, scriptExists:boolean}} */
function checkClaudeHooks(homeDir) {
  const settingsPath = path.join(homeDir, '.claude', 'settings.json');
  let registered = false;
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    for (const event of Object.keys(settings.hooks || {})) {
      if ((settings.hooks[event] || []).some(isManaged)) registered = true;
    }
  } catch { /* 无配置/不可解析 → 未注册 */ }
  const scriptExists = fs.existsSync(path.join(__dirname, HOOK_SCRIPT_REL));
  return { registered, scriptExists };
}

module.exports = {
  HOOK_SCRIPT_REL, GUARD_MARKER, hookCommand, buildHookEntries,
  mergeManagedHooks, removeManagedHooks, applyClaudeHooks, checkClaudeHooks,
};
