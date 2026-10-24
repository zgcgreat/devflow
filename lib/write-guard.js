#!/usr/bin/env node
/**
 * DevFlow Write Guard — 阶段感知的写入守卫（纯逻辑，无副作用）
 *
 * 借鉴 AI-DLC 的核心思想：门控不该只靠"AI 自愿调用引擎校验"，
 * 而应在工具调用层被真实拦截（宿主 PreToolUse hook exit 2 = 拒绝本次调用）。
 * 本模块把守卫规则做成纯函数，便于测试；I/O（读 state、查 git 分支）
 * 由 hook 入口（hooks/scripts/phase-write-guard.js）完成后注入。
 *
 * 规则（按序评估，命中即返回）：
 *   R0 项目未初始化 devflow（无 .devflow/）→ 全部放行（不治安非 devflow 项目）
 *   R1 任何工具对 .devflow/state.json / state-events.jsonl 的直接写 → 拦截
 *      （流程状态只能经 devflow CLI/引擎变更，防 AI 手改状态绕过门控）
 *   R2 .devflow/ 内其他文件（产物/记忆/审计）→ 放行
 *   R3 源代码文件（Write/Edit/MultiEdit/NotebookEdit）且当前 Phase < 4 → 拦截
 *      （实施是 Phase 4 的事；设计阶段产出的是 md 产物。fast 模式起点即 4，
 *       因此天然放行——与"改动规模决定模式"的语义一致）
 *   R4 devflow/<req-id> 分支上的 git commit 不符合
 *      `devflow(<req-id>): <说明>` 格式 → 拦截（引导用 devflow git checkpoint）
 *   其余 → 放行。守卫自身出错一律 fail-open（放行 + 说明），绝不卡死用户。
 */

'use strict';

const path = require('path');

/** 视为"源代码"的扩展名（保守清单：只拦明确的实现语言，不拦配置/文档） */
const SOURCE_EXTS = new Set([
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts',
  '.py', '.pyw', '.go', '.java', '.kt', '.kts', '.rs', '.swift',
  '.c', '.h', '.cpp', '.hpp', '.cc', '.cs', '.m', '.mm',
  '.rb', '.php', '.vue', '.svelte', '.scala', '.dart',
  '.sql', '.sh', '.bash', '.ps1', '.psm1', '.ipynb',
]);

/** 受引擎独占保护的流程状态文件名 */
const ENGINE_OWNED_STATE_FILES = new Set(['state.json', 'state-events.jsonl']);

const GUARD_MARKER = 'phase-write-guard.js';

function isSourceFile(p) {
  return SOURCE_EXTS.has(path.extname(String(p || '')).toLowerCase());
}

/** 是否为引擎独占的流程状态文件（.devflow/ 下的 state.json / state-events.jsonl） */
function isEngineOwnedState(p) {
  const norm = path.normalize(String(p || ''));
  const parts = norm.split(path.sep);
  const base = path.basename(norm);
  if (!ENGINE_OWNED_STATE_FILES.has(base)) return false;
  // 必须位于 .devflow 目录内（任意层级的项目，防误伤用户自己的 state.json）
  return parts.includes('.devflow');
}

/**
 * 评估一次 PreToolUse 调用。
 * @param {object} input
 * @param {string} input.tool 工具名（Write/Edit/MultiEdit/NotebookEdit/Bash/...）
 * @param {object} input.toolInput 工具入参（file_path / command 等）
 * @param {object|null} input.state devflow 状态对象（.devflow/state.json 解析结果，null=不存在/损坏）
 * @param {boolean} input.devflowInitialized 项目是否有 .devflow 目录
 * @param {string|null} [input.currentBranch] 当前 git 分支（hook 入口探测后注入；null=未知）
 * @returns {{action:'allow'|'block', reason:string, rule?:string}}
 */
function evaluatePreToolUse(input) {
  const { tool, toolInput = {}, state, devflowInitialized, currentBranch } = input;

  // R0：非 devflow 项目不治安
  if (!devflowInitialized) {
    return { action: 'allow', reason: 'devflow 未初始化（无 .devflow/），守卫不介入' };
  }

  // 守卫只关心这几类工具，其余直接放行
  const fileTools = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
  if (tool === 'Bash') return evaluateBash(toolInput, currentBranch);
  if (!fileTools.has(tool)) {
    return { action: 'allow', reason: `工具 ${tool} 不在守卫范围` };
  }

  const target = String(toolInput.file_path || toolInput.notebook_path || '');

  // R1：状态文件引擎独占（无条件，与 Phase 无关）
  if (isEngineOwnedState(target)) {
    return {
      action: 'block',
      rule: 'R1-state-owned',
      reason: '⛔ .devflow/state.json / state-events.jsonl 由 DevFlow 引擎独占，禁止直接手写。' +
        '请使用 devflow CLI 变更状态（devflow phase --next / --gate / --output）。' +
        '直接改状态文件会绕过全部门控与审计。',
    };
  }

  // R2：.devflow/ 内其他文件放行（产物/记忆/审计日志）
  const inDevflowDir = path.normalize(target).split(path.sep).includes('.devflow');
  if (inDevflowDir) {
    return { action: 'allow', reason: '.devflow/ 内的流程产物写入放行' };
  }

  // R3：源代码写入需要进入实施阶段（Phase >= 4）
  if (isSourceFile(target)) {
    const phase = state && Number.isFinite(Number(state.currentPhase)) ? Number(state.currentPhase) : null;
    if (phase === null) {
      // 状态损坏/不可读 → fail-open，但不装作没事
      return { action: 'allow', reason: 'state.json 不可读，守卫 fail-open 放行（建议运行 devflow doctor）' };
    }
    if (phase < 4) {
      const mode = (state && state.mode) || 'standard';
      return {
        action: 'block',
        rule: 'R3-phase-guard',
        reason: `⛔ 当前 ${mode} 模式 Phase ${phase}（设计与规划阶段），尚未进入实施（Phase 4），禁止写入源代码: ${target}\n` +
          `正确路径：完成当前 Phase 的产物（.devflow/<req-id>/ 下 md）→ devflow phase --output 记录 → devflow phase --next 推进。Phase 4 起即可正常写代码。\n` +
          `若经用户确认确需跳过前期阶段：devflow phase --set 4 --force（会记录审计）。`,
      };
    }
    return { action: 'allow', reason: `Phase ${phase} ≥ 4（实施阶段），源代码写入放行` };
  }

  return { action: 'allow', reason: '非源代码文件，放行' };
}

function evaluateBash(toolInput, currentBranch) {
  const command = String(toolInput.command || '');

  // R4：devflow 分支上的提交格式守卫
  if (/\bgit\b/.test(command) && /\bcommit\b/.test(command)) {
    const branch = String(currentBranch || '');
    if (branch.startsWith('devflow/')) {
      const hasFormat = /devflow\([^)]+\)\s*:/.test(command);
      const hasMessage = /-m\b|--message=/.test(command);
      if (!hasFormat || !hasMessage) {
        return {
          action: 'block',
          rule: 'R4-commit-format',
          reason: `⛔ devflow/<req-id> 分支上的提交必须使用格式: devflow(${branch.slice('devflow/'.length)}): <说明>\n` +
            `推荐直接用 devflow git checkpoint "<说明>"（只提交 .devflow/ 流程产物，自动带格式）。`,
        };
      }
    }
    return { action: 'allow', reason: 'git 提交格式符合约定（或非 devflow 分支）' };
  }

  return { action: 'allow', reason: '非 git commit 命令，放行' };
}

module.exports = { evaluatePreToolUse, isSourceFile, isEngineOwnedState, SOURCE_EXTS, ENGINE_OWNED_STATE_FILES, GUARD_MARKER };
