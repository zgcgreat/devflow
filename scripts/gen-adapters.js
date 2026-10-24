#!/usr/bin/env node
/**
 * DevFlow Adapter Generator — 适配器产物表的单一来源生成器
 *
 * 病根：adapters/ 下的产物清单是手写文档，曾两次系统性漂移（旧产物名
 * 00-requirements.md / 06-code-review.md 等），每次都要人工审计修复。
 * 借鉴 AI-DLC 的 manifest 投影思想：产物清单从 lib/phase-engine.js 的
 * 权威 PHASES 定义生成，各 adapter 文档只保留标记块：
 *
 *   <!-- devflow:generated:artifacts START --> ... END   (markdown 文件)
 *   # devflow:generated:artifacts START ... END          (YAML 文件)
 *
 * 本脚本重写标记块之间的内容；`--check` 只比对不写入（测试与 CI 用，
 * 有漂移即 exit 1）—— 此类漂移从此在机器层被拦住。
 *
 * 同时整文件生成 adapters/claude-code/hooks.json（其内容完全由
 * DevFlow 拥有，无用户内容，事件映射表在本文件内维护）。
 *
 * 用法: node scripts/gen-adapters.js            重写全部生成块
 *       node scripts/gen-adapters.js --check    只检测漂移（exit 1 = 有漂移）
 *       node scripts/gen-adapters.js --list     列出生成目标
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { PHASES } = require(path.join(ROOT, 'lib', 'phase-engine'));

// ─── 权威数据派生 ────────────────────────────────────────

/** 由 PHASES 派生每行 "Phase N: 产物 (门控)" 的门控后缀 */
function gateSuffix(phase) {
  const manualExtras = (phase.extraGates || []).map(g => `plus manual gate ${g}`);
  let suffix = phase.gate;
  if (manualExtras.length > 0) suffix += `; ${manualExtras.join(', ')}`;
  // 仅 strict 必跑的 Phase（如 03-tasks.md）
  if (phase.skip.includes('standard')) suffix += ', strict mode only';
  return suffix;
}

function artifactRows() {
  return [...PHASES]
    .sort((a, b) => a.id - b.id)
    .map(p => ({ id: p.id, output: p.output, suffix: gateSuffix(p) }));
}

const MODE_TRIMMING_LINE = 'Mode trimming: `fast` starts at 04-wave-logs.md; `lean` starts at 02-design.md; no 03-tasks.md unless `strict`.';

// ─── 渲染器 ─────────────────────────────────────────────

function renderMarkdownTable(header = 'Artifact (Gate)') {
  return [
    `| Phase | ${header} |`,
    `|-------|-----------------|`,
    ...artifactRows().map(r => `| Phase ${r.id} | ${r.output} (${r.suffix}) |`),
  ].join('\n');
}

function renderYamlList() {
  return artifactRows().map(r => `  - Phase ${r.id}: ${r.output} (${r.suffix})`).join('\n');
}

// ─── 生成目标 ────────────────────────────────────────────

const MARKER = 'devflow:generated:artifacts';

const TARGETS = [
  {
    file: 'adapters/codex/codex.yaml',
    commentStyle: 'yaml',
    render: () => [
      '  ## Phase Gates (artifacts under `.devflow/<req-id>/`)',
      renderYamlList(),
      '  - Mode trimming: fast starts at 04-wave-logs.md; lean starts at 02-design.md;',
      '    no 03-tasks.md unless strict',
    ].join('\n'),
  },
  {
    file: 'adapters/gemini-cli/GEMINI.md',
    commentStyle: 'html',
    render: () => `${renderMarkdownTable()}\n\n${MODE_TRIMMING_LINE}`,
  },
  {
    file: 'adapters/copilot/copilot-instructions.md',
    commentStyle: 'html',
    render: () => renderMarkdownTable('Exit Artifact (Gate)'),
  },
  {
    file: 'adapters/cursor/devflow.mdc',
    commentStyle: 'html',
    render: () => `${renderMarkdownTable()}\n\n${MODE_TRIMMING_LINE}`,
  },
];

// ─── claude-code/hooks.json 生成（事件映射表 = 单一来源）──

const CLAUDE_HOOKS = {
  $schema: 'https://devflow.dev/adapters/claude-code/hooks/v1',
  version: '1.1.0',
  description: 'DevFlow Claude Code Adapter — Hook 映射注册表（由 scripts/gen-adapters.js 生成，勿手改）',
  runtime: {
    required: 'node >= 18',
    adapter_home: '$DEVFLOW_HOME/adapters/claude-code',
    scripts_root: '$DEVFLOW_HOME/hooks/scripts',
  },
  hooks: {
    'phase-write-guard': {
      event: 'PreToolUse',
      script: 'scripts/phase-write-guard.js',
      description: 'Phase-aware write guard: block source-code writes before Phase 4 and direct state.json edits',
      gates: [],
      timeout_ms: 10000,
      fail_action: 'block',
      note: 'Auto-registered into ~/.claude/settings.json by `devflow install --target claude` (managed block)',
    },
    'session-startup': {
      event: 'SessionStart',
      script: 'scripts/context-monitor.js',
      args: ['--mode', 'startup'],
      description: 'Load DevFlow project state, memory, and token budget on session start',
      gates: [],
      timeout_ms: 10000,
      fail_action: 'advisory',
    },
    'phase-context-inject': {
      event: 'UserPromptSubmit',
      script: 'scripts/context-monitor.js',
      args: ['--mode', 'phase-context'],
      description: 'Inject current phase context and persona recommendations before prompt processing',
      gates: [],
      timeout_ms: 5000,
      fail_action: 'advisory',
    },
    'format-typecheck': {
      event: 'Stop',
      script: 'scripts/format-typecheck.js',
      description: 'Batch formatting + TypeScript type check before commit',
      gates: ['G5', 'G7'],
      timeout_ms: 270000,
      fail_action: 'gate_fail',
    },
    'console-log-check': {
      event: 'Stop',
      script: 'scripts/console-log-check.js',
      description: 'Detect residual console.log statements in production code',
      gates: ['G5'],
      timeout_ms: 30000,
      fail_action: 'gate_fail',
    },
    'security-scan': {
      event: 'Stop',
      script: 'scripts/security-scan.js',
      description: 'OWASP security scan (injection/SSRF/sensitive data exposure)',
      gates: ['G6', 'G7'],
      timeout_ms: 60000,
      fail_action: 'advisory',
      note: 'Disabled by default; force requires ECC_ENABLE_INSAITS=1 + Python 3.9+ (pip install insa-its)',
    },
    'compact-suggest': {
      event: 'PreCompact',
      script: 'scripts/compact-suggest.js',
      description: 'Suggest context compaction at logical breakpoints or when context expands',
      gates: [],
      timeout_ms: 5000,
      fail_action: 'advisory',
    },
    'cost-tracker': {
      event: 'Stop',
      script: 'scripts/cost-tracker.js',
      description: 'Track cumulative session cost (token count + USD estimate)',
      gates: [],
      timeout_ms: 15000,
      fail_action: 'advisory',
    },
    'gate-enforcement': {
      event: 'Stop',
      script: 'scripts/context-monitor.js',
      args: ['--mode', 'gate-check'],
      description: 'Run gate-mapped hooks and report pass/fail before phase transition',
      gates: ['G5', 'G6', 'G7'],
      timeout_ms: 300000,
      fail_action: 'gate_fail',
    },
  },
  gate_mapping: {
    G5: {
      phase: 'Phase 4 -> Phase 5',
      hooks: ['format-typecheck', 'console-log-check'],
      description: 'Build complete: check code format + type + debug residuals',
    },
    G6: {
      phase: 'Phase 5 -> Phase 6',
      hooks: ['security-scan'],
      description: 'Tests pass: check security compliance',
    },
    G7: {
      phase: 'Phase 6 -> Phase 7',
      hooks: ['format-typecheck', 'security-scan'],
      description: 'Review pass: final format + security check',
    },
  },
};

// ─── 标记块读写 ──────────────────────────────────────────

function markers(commentStyle) {
  if (commentStyle === 'yaml') {
    return { start: `# ${MARKER} START`, end: `# ${MARKER} END` };
  }
  return { start: `<!-- ${MARKER} START -->`, end: `<!-- ${MARKER} END -->` };
}

function applyBlock(content, target, generated) {
  const { start, end } = markers(target.commentStyle);
  if (!content.includes(start) || !content.includes(end)) {
    throw new Error(`${target.file}: 缺少生成标记（${start} ... ${end}）。请先插入标记块。`);
  }
  const startIdx = content.indexOf(start);
  const endIdx = content.indexOf(end);
  if (endIdx < startIdx) throw new Error(`${target.file}: 标记顺序错误`);
  return content.slice(0, startIdx) + start + '\n' + generated + '\n' + content.slice(endIdx);
}

// ─── 主流程 ──────────────────────────────────────────────

function generateAll({ check = false } = {}) {
  const results = [];
  let drift = 0;

  for (const target of TARGETS) {
    const abs = path.join(ROOT, target.file);
    const current = fs.readFileSync(abs, 'utf-8');
    const generated = applyBlock(current, target, target.render());
    const drifted = generated !== current;
    if (drifted) drift++;
    if (!check && drifted) fs.writeFileSync(abs, generated);
    results.push({ file: target.file, drifted, action: drifted ? (check ? 'DRIFT' : 'rewritten') : 'ok' });
  }

  // claude-code/hooks.json 整文件生成
  const claudeHooksPath = path.join(ROOT, 'adapters', 'claude-code', 'hooks.json');
  const generatedJson = JSON.stringify(CLAUDE_HOOKS, null, 2) + '\n';
  const currentJson = fs.readFileSync(claudeHooksPath, 'utf-8');
  const jsonDrift = currentJson !== generatedJson;
  if (jsonDrift) drift++;
  if (!check && jsonDrift) fs.writeFileSync(claudeHooksPath, generatedJson);
  results.push({ file: 'adapters/claude-code/hooks.json', drifted: jsonDrift, action: jsonDrift ? (check ? 'DRIFT' : 'rewritten') : 'ok' });

  return { results, drift };
}

function main() {
  const check = process.argv.includes('--check');
  if (process.argv.includes('--list')) {
    console.log('生成目标:');
    TARGETS.forEach(t => console.log(`  ${t.file} (${t.commentStyle} 标记块)`));
    console.log('  adapters/claude-code/hooks.json (整文件)');
    return;
  }
  const { results, drift } = generateAll({ check });
  for (const r of results) {
    console.log(`${r.drifted ? (check ? '⚠️ ' : '🔁 ') : '✅'} ${r.file} — ${r.action}`);
  }
  if (check) {
    console.log(drift === 0 ? `\n✅ 无漂移（${results.length} 个生成目标全部与权威定义一致）` : `\n❌ ${drift} 个文件漂移 — 运行 node scripts/gen-adapters.js 重新生成`);
    process.exit(drift === 0 ? 0 : 1);
  } else {
    console.log(`\n完成（${results.length} 个目标）。再跑 --check 验证幂等。`);
  }
}

if (require.main === module) main();
module.exports = { generateAll, artifactRows, gateSuffix, MARKER };
