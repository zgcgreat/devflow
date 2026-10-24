#!/usr/bin/env node
/**
 * DevFlow ZCode Hooks — ~/.zcode/cli/config.json 托管段合并
 *
 * ZCode hook 契约（依据 zcode-configuration-guide / diagnosing-hooks 官方技能）：
 *   - 配置位置：用户级 ~/.zcode/cli/config.json → hooks.events.<Event>
 *   - 配置文件 hook 必须显式 hooks.enabled: true 才会运行（默认禁用）
 *   - PreToolUse 的 exit 2 = deny（与我们的守卫同款契约，开箱即用）
 *   - type: "process"（command + args，无 shell）是最跨平台的选择
 *   - matcher 是大小写敏感正则，对工具名匹配；Write/Edit 覆盖 ApplyPatch 别名
 *   - Stop 事件输出走严格 JSON schema（多余键判失败）——故 ZCode 只注册
 *     PreToolUse 拦截，不注册 Stop 提醒
 *
 * 托管识别：args 含 phase-write-guard.js 的条目视为 DevFlow 托管；
 * 幂等（重装不叠加）、写前备份 config.json.devflow-bak、卸载只删托管条目。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { GUARD_MARKER } = require('./write-guard');

const CONFIG_REL = path.join('.zcode', 'cli', 'config.json');

function guardScriptArgs(devflowRoot, mode) {
  return [path.join(devflowRoot, 'hooks', 'scripts', 'phase-write-guard.js'), mode];
}

const isManaged = (entry) =>
  Array.isArray(entry && entry.hooks) &&
  entry.hooks.some(h =>
    (Array.isArray(h.args) && h.args.join(' ').includes(GUARD_MARKER)) ||
    String(h.command || '').includes(GUARD_MARKER));

/** DevFlow 要注册的 hooks 配置块（ZCode config.json 形状） */
function buildZcodeHookEntries(devflowRoot) {
  return {
    enabled: true,
    events: {
      PreToolUse: [
        {
          matcher: 'Write|Edit|MultiEdit|NotebookEdit|Bash',
          hooks: [
            {
              type: 'process',
              command: 'node',
              args: guardScriptArgs(devflowRoot, 'pretooluse'),
              timeoutMs: 10000,
            },
          ],
        },
      ],
    },
  };
}

/** 把 DevFlow 托管条目合并进 config 对象（纯函数）。@returns {{config, changed, enabledFlipped}} */
function mergeZcodeHooks(config, devflowRoot) {
  const next = JSON.parse(JSON.stringify(config || {}));
  const prevEnabled = next.hooks && next.hooks.enabled === true;
  const ours = buildZcodeHookEntries(devflowRoot);
  next.hooks = next.hooks && typeof next.hooks === 'object' ? next.hooks : {};
  next.hooks.enabled = true; // 配置文件 hook 默认禁用，必须显式开启
  next.hooks.events = next.hooks.events && typeof next.hooks.events === 'object' ? next.hooks.events : {};

  let changed = !prevEnabled; // enabled 翻转也算变更
  for (const [event, entries] of Object.entries(ours.events)) {
    const existing = Array.isArray(next.hooks.events[event]) ? next.hooks.events[event] : [];
    const kept = existing.filter(e => !isManaged(e));
    const hadOurs = kept.length !== existing.length;
    const oursEntry = entries[0];
    const alreadyCurrent = hadOurs &&
      existing.filter(isManaged).some(e => JSON.stringify(e) === JSON.stringify(oursEntry));
    if (!alreadyCurrent) {
      next.hooks.events[event] = [...kept, ...entries];
      changed = true;
    } else {
      next.hooks.events[event] = existing;
    }
  }
  return { config: next, changed, enabledFlipped: !prevEnabled };
}

/** 移除全部 DevFlow 托管条目（纯函数；不动 enabled 与用户事件）。 */
function removeZcodeHooks(config) {
  const next = JSON.parse(JSON.stringify(config || {}));
  let changed = false;
  if (next.hooks && next.hooks.events && typeof next.hooks.events === 'object') {
    for (const event of Object.keys(next.hooks.events)) {
      const arr = next.hooks.events[event];
      if (!Array.isArray(arr)) continue;
      const kept = arr.filter(e => !isManaged(e));
      if (kept.length !== arr.length) {
        next.hooks.events[event] = kept;
        changed = true;
      }
      if (kept.length === 0) delete next.hooks.events[event];
    }
    if (Object.keys(next.hooks.events).length === 0) delete next.hooks.events;
  }
  return { config: next, changed };
}

/**
 * 应用/移除 ZCode 托管 hook 到 <homeDir>/.zcode/cli/config.json。
 * @returns {{changed:boolean, configPath:string, backupPath?:string, enabledFlipped?:boolean, summary:string}}
 */
function applyZcodeHooks({ homeDir, devflowRoot, remove = false, dryRun = false }) {
  const configPath = path.join(homeDir, CONFIG_REL);
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      throw new Error(`现有 ZCode config.json 无法解析，拒绝修改（请手工处理后重试）: ${configPath}\n${e.message}`);
    }
  }

  const result = remove ? removeZcodeHooks(config) : mergeZcodeHooks(config, devflowRoot);
  if (!result.changed) {
    return { changed: false, configPath, summary: remove ? '托管 hook 本就不存在' : '托管 hook 已是最新，无需改动' };
  }
  if (dryRun) {
    return { changed: true, configPath, summary: remove ? '[dry-run] 将移除托管 hook' : '[dry-run] 将写入托管 hook' };
  }

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const backupPath = `${configPath}.devflow-bak`;
  if (fs.existsSync(configPath)) fs.copyFileSync(configPath, backupPath);
  fs.writeFileSync(configPath, JSON.stringify(result.config, null, 2) + '\n');

  return {
    changed: true,
    configPath,
    backupPath,
    enabledFlipped: result.enabledFlipped,
    summary: remove
      ? `已移除 ZCode 托管 hook（备份: ${path.basename(backupPath)}）`
      : `已注册写入守卫到 ZCode（PreToolUse exit 2 真实拦截${result.enabledFlipped ? '；hooks.enabled 已开启' : ''}，备份: ${path.basename(backupPath)}）`,
  };
}

/** 检查 ZCode 守卫注册状态（doctor 用）。 */
function checkZcodeHooks(homeDir) {
  const configPath = path.join(homeDir, CONFIG_REL);
  let registered = false;
  let runnerEnabled = false;
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    runnerEnabled = !!(config.hooks && config.hooks.enabled === true);
    for (const event of Object.keys((config.hooks && config.hooks.events) || {})) {
      if ((config.hooks.events[event] || []).some(isManaged)) registered = true;
    }
  } catch { /* 无配置 → 未注册 */ }
  const scriptExists = fs.existsSync(path.join(__dirname, '..', 'hooks', 'scripts', 'phase-write-guard.js'));
  return { registered, runnerEnabled, scriptExists };
}

module.exports = {
  CONFIG_REL, buildZcodeHookEntries, mergeZcodeHooks, removeZcodeHooks, applyZcodeHooks, checkZcodeHooks,
};
