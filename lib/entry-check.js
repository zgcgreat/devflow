#!/usr/bin/env node
/**
 * DevFlow Entry Check — 入场检测机器判定
 *
 * 实现 references/entry-check.md 的 A-G 决策树，原则与写入守卫一致：
 * 确定性归引擎（查表级判定，绝不做项目扫描），判断归人（D/E 停等用户，
 * intel-scan 是用户显式选择后的独立重操作，约 15-30k tokens，不在本步内）。
 *
 * 模式适配（与规格一致）：
 *   fast     → 跳过（1~2 文件改动无需项目上下文）
 *   lean     → 复用优先、不停等（workbuddy → CLAUDE/cursor → CONTEXT.md → 提示直行）
 *   standard/strict → 完整决策树，D/E 停等
 *
 * 用法: node lib/entry-check.js [--mode standard] [--json]
 *       bin 层入口: devflow entry-check（同参数 + --set-doc/--record-scan）
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CONTEXT_STALE_DAYS = 90;
const DAY_MS = 86400000;

/** greenfield 判定：项目根不存在以下任何清单文件（与规格一致） */
const GREENFIELD_MARKERS = [
  'package.json', 'pyproject.toml', 'requirements.txt', 'go.mod', 'Cargo.toml',
  'pom.xml', 'build.gradle', 'composer.json', 'Gemfile',
];

/** 其他 AI 上下文文档（情况 D 候选；存在即视为 brownfield 已有约定） */
const AI_CONTEXT_DOCS = [
  'AGENTS.md', 'CLAUDE.md', path.join('.claude', 'CLAUDE.md'),
  '.cursor/rules', '.windsurf/rules', path.join('.github', 'copilot-instructions.md'), '.clinerules',
];

/** 外部工作记忆（情况 G 候选；比 intel-scan 产物更鲜活，直接复用） */
const EXTERNAL_CONTEXT = ['.workbuddy/memory/MEMORY.md', 'CLAUDE.md', '.cursor/rules'];

/** B/C 判定的上下文文件候选：canonical CONTEXT.md 优先，init 骨架 PROJECT_CONTEXT.md 等价 */
const CONTEXT_CANDIDATES = [
  path.join('.devflow', 'memory', 'CONTEXT.md'),
  path.join('.devflow', 'memory', 'PROJECT_CONTEXT.md'),
];

function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

/** 列出存在的候选（目录型候选用非空目录判定），返回 [{rel, kind, size}] */
function findExisting(root, candidates) {
  const found = [];
  for (const rel of candidates) {
    const abs = path.join(root, rel);
    try {
      const st = fs.statSync(abs);
      if (st.isDirectory()) {
        const nonEmpty = fs.readdirSync(abs).length > 0;
        if (nonEmpty) found.push({ rel, kind: 'dir', size: null });
      } else if (st.isFile()) {
        found.push({ rel, kind: 'file', size: st.size });
      }
    } catch { /* 不存在 */ }
  }
  return found;
}

function findWorkbuddyLogs(root) {
  const dir = path.join(root, '.workbuddy', 'memory');
  try {
    return fs.readdirSync(dir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .map(f => path.join('.workbuddy', 'memory', f));
  } catch { return []; }
}

/**
 * 入场检测判定（决策树，命中即停）。
 * @param {object} opts
 * @param {string} opts.workspaceDir 项目根
 * @param {object|null} opts.state .devflow/state.json 解析结果（可 null）
 * @param {string} [opts.mode] fast | lean | standard | strict（未设置按 standard）
 * @returns {{situation:string, action:'use'|'ask'|'skip'|'proceed', projectType:string,
 *            contextDocs:string[], entryScanStatus:string, note:string, question?:string}}
 */
function detectEntry({ workspaceDir, state = null, mode } = {}) {
  const root = workspaceDir;
  const m = (mode || (state && state.mode) || 'standard').toLowerCase();
  const hasDevflow = exists(path.join(root, '.devflow'));
  const st = state || {};

  if (m === 'fast') {
    return { situation: 'SKIP', action: 'skip', projectType: '—', contextDocs: [],
      entryScanStatus: '已跳过（Fast 模式）', note: 'Fast: 1~2 文件改动无需项目上下文，直接看目标代码' };
  }

  // 1) 用户/外部已指定上下文文档 → 情况 A
  if (st.aiContextDoc && st.aiContextDoc !== 'none') {
    const docs = Array.isArray(st.aiContextDoc) ? st.aiContextDoc : [st.aiContextDoc];
    return { situation: 'A', action: 'use', projectType: 'brownfield', contextDocs: docs,
      entryScanStatus: '已完成', note: '用户指定现有文档' };
  }

  // 2) 已有 CONTEXT.md（canonical 或 init 骨架等价候选）→ B/C（90 天新鲜度）
  const ctx = CONTEXT_CANDIDATES.map(rel => ({ rel, abs: path.join(root, rel) })).find(c => exists(c.abs));
  if (ctx) {
    const ageDays = st.lastIntelScan ? (Date.now() - new Date(st.lastIntelScan).getTime()) / DAY_MS : null;
    if (ageDays === null || ageDays <= CONTEXT_STALE_DAYS) {
      return buildResult(m, 'B', ctx.rel, `已完成（上次扫描 ${ageDays === null ? '时间未知，视为新鲜' : `<${CONTEXT_STALE_DAYS} 天>`})`,
        '检测到已有 CONTEXT.md。1.使用现有直接继续（推荐） 2.重新运行 intel-scan 3.指定其他文档');
    }
    return buildResult(m, 'C', ctx.rel, `已完成（上次扫描 >${CONTEXT_STALE_DAYS} 天，强烈建议重扫）`,
      `上次扫描已超过 ${CONTEXT_STALE_DAYS} 天。1.重新运行 intel-scan（强烈推荐） 2.使用现有继续 3.指定其他文档`);
  }

  // 3) 其他 AI 上下文文档 → D（standard/strict 停等）
  const aiDocs = findExisting(root, AI_CONTEXT_DOCS);
  // 4) 外部工作记忆 → G（复用不重扫）
  const wbLogs = findWorkbuddyLogs(root);
  const external = findExisting(root, ['.workbuddy/memory/MEMORY.md'])
    .concat(wbLogs.length > 0 ? [{ rel: '.workbuddy/memory/<YYYY-MM-DD>.md', kind: 'file', size: null }] : []);

  if (m === 'lean') {
    // Lean 复用优先、不停等：workbuddy → CLAUDE/.cursor → 都没有则直行
    if (external.length > 0) return leanUse(external, '.workbuddy 工作记忆');
    const leanReuse = findExisting(root, ['CLAUDE.md', '.cursor/rules']);
    if (leanReuse.length > 0) return leanUse(leanReuse, '已有 AI 上下文文档');
    if (aiDocs.length > 0) return leanUse(aiDocs, '已有 AI 上下文文档');
    return { situation: 'NONE', action: 'proceed', projectType: greenfieldType(root), contextDocs: [],
      entryScanStatus: '无项目上下文', note: 'Lean 模式：无项目上下文，直接看代码' };
  }

  if (aiDocs.length > 0) {
    return buildResult(m, 'D', aiDocs.map(d => d.rel).join('、'), '待用户确认',
      `发现 ${aiDocs.length} 个候选上下文文档。1.跑 intel-scan 综合生成 CONTEXT.md（推荐） 2.以现有文档为准 3.跳过直接进需求阶段（AI 会盲飞）`);
  }

  if (external.length > 0) {
    return { situation: 'G', action: 'use', projectType: 'brownfield',
      contextDocs: external.map(d => d.rel), entryScanStatus: '已跳过（复用外部上下文）',
      note: '外部上下文比 intel-scan 产物更鲜活（随日常开发持续更新）' };
  }

  // 5) greenfield → F 跳过；brownfield 无任何上下文 → E 停等
  const isGreenfield = findExisting(root, GREENFIELD_MARKERS).length === 0;
  if (isGreenfield) {
    return { situation: 'F', action: 'skip', projectType: 'greenfield', contextDocs: [],
      entryScanStatus: '已跳过', note: 'greenfield 项目，CONTEXT.md 会在后续阶段逐步沉淀' };
  }
  return buildResult(m, 'E', '无', '待用户确认',
    '未发现任何 AI 上下文文档。1.现在跑入场扫描生成 CONTEXT.md（~15-30k tokens · 推荐） 2.手动指定文档路径 3.跳过（AI 会盲飞）');
}

function greenfieldType(root) {
  return findExisting(root, GREENFIELD_MARKERS).length === 0 ? 'greenfield' : 'brownfield';
}

function leanUse(docs, source) {
  return { situation: 'G', action: 'use', projectType: 'brownfield',
    contextDocs: docs.map(d => d.rel), entryScanStatus: '已跳过（复用外部上下文）',
    note: `Lean 模式复用${source}，不停等` };
}

function buildResult(m, situation, contextDocs, entryScanStatus, question) {
  return { situation, action: 'ask', projectType: 'brownfield',
    contextDocs: Array.isArray(contextDocs) ? contextDocs : [contextDocs],
    entryScanStatus, note: `${m} 模式：需停等用户选择`, question };
}

/** 渲染规格同款检测结果框 + 反问块 */
function formatResult(r) {
  const lines = [
    '┌─────────────────────────────────────────────────────────────┐',
    '│  🔍 入场检测                                                  │',
    '├─────────────────────────────────────────────────────────────┤',
    `│  检测结果：情况 ${r.situation}`,
    `│  项目类型：${r.projectType}`,
    `│  上下文文档：${r.contextDocs.join('、') || '无'}`,
    `│  入场扫描状态：${r.entryScanStatus}`,
    '└─────────────────────────────────────────────────────────────┘',
  ];
  if (r.note) lines.push(`\n备注: ${r.note}`);
  if (r.question) lines.push(`\n🔍 ${r.question}\n\n请选择（停等用户回复）。`);
  return lines.join('\n');
}

module.exports = { detectEntry, formatResult, CONTEXT_STALE_DAYS, GREENFIELD_MARKERS, AI_CONTEXT_DOCS, CONTEXT_CANDIDATES };
