#!/usr/bin/env node
/**
 * DevFlow Gate Checker — 运行时无关的门禁检查器
 *
 * 从 gate-check.js 和 gate-rules.md 提取公共逻辑。
 * 各运行时适配器通过 core-bridge.checkGate() 调用此模块。
 *
 * 支持: auto 类型门控自动检查产物, manual 类型需要用户确认
 */

const fs = require('fs');
const path = require('path');
const { findProjectDir, DEVFLOW_DIR } = require('./core-bridge');

// ─── 门控定义 ───────────────────────────────────────────
//
// 单一权威源: lib/phase-engine.js
// 历史上此处维护独立硬编码副本，与权威定义漂移（G7.5/G8 产物名错误）。
// 现与 domains/hooks/gate-check.js 一致，改为派生。

function buildGates() {
  let AUTHORITATIVE, PHASES;
  try {
    ({ GATES: AUTHORITATIVE, PHASES } = require('../../lib/phase-engine'));
  } catch (e) {
    // lib/phase-engine.js 不可达（adapters/ 目录被单独拷贝时）→ 回退内置静态门控表，
    // 与 core-bridge.js loadGateRules 的静态兜底表保持一致（phase 与产物名对齐权威定义）。
    return {
      G0:     { phase: 0,   artifacts: ['00-strategy.md'],    label: 'Strategy Gate',     type: 'auto' },
      G1:     { phase: 1,   artifacts: ['01-analysis.md'],    label: 'Analysis Gate (5Whys)', type: 'auto' },
      G2:     { phase: 1,   artifacts: ['01-analysis.md'],    label: 'Architecture Gate', type: 'manual' },
      'G2.5': { phase: 1.5, artifacts: ['01b-context.md'],    label: 'Discussion Gate (Phase 1b)', type: 'manual' },
      G3:     { phase: 2,   artifacts: ['02-design.md'],      label: 'Design Gate',       type: 'manual' },
      'G3.5': { phase: 2.5, artifacts: ['02a-variants.md'],   label: 'Shotgun Gate (Phase 2a)', type: 'manual' },
      G4:     { phase: 3,   artifacts: ['03-tasks.md'],       label: 'Task Plan Gate',    type: 'auto' },
      G5:     { phase: 4,   artifacts: ['04-wave-logs.md'],   label: 'Build Gate',        type: 'manual' },
      G6:     { phase: 5,   artifacts: ['05-test-report.md'], label: 'Test Gate',         type: 'auto' },
      G7:     { phase: 6,   artifacts: ['06-review.md'],      label: 'Review Gate',       type: 'manual' },
      'G7.5': { phase: 7,   artifacts: ['07-canary.md'],      label: 'Canary Gate',       type: 'manual' },
      G8:     { phase: 8,   artifacts: ['08-archive.md'],     label: 'Archive Gate',      type: 'auto' },
    };
  }
  const map = {};
  for (const g of AUTHORITATIVE) {
    map[g.id] = { phase: g.phaseAfter, artifacts: [], label: g.name, type: g.type };
  }
  for (const phase of PHASES) {
    for (const gid of [phase.gate, ...(phase.extraGates || [])]) {
      if (map[gid] && !map[gid].artifacts.includes(phase.output)) {
        map[gid].artifacts.push(phase.output);
      }
    }
  }
  return map;
}

const GATES = buildGates();

// ─── 检查逻辑 ───────────────────────────────────────────

/**
 * 递归收集 .devflow/ 下的候选路径。
 * GO.md 协议: 产物保存到 .devflow/<req-id>/ 下；wave 类产物可达
 * .devflow/<req-id>/waves/wave-{N}/ 三层，故需递归而非只扫一层。
 */
function collectDevflowDirs(dir, depth = 0, out = []) {
  if (depth > 3) return out;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch { return out; }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    out.push(full);
    collectDevflowDirs(full, depth + 1, out);
  }
  return out;
}

function resolveArtifactPath(projectDir, artifact) {
  const devflowDir = path.join(projectDir, DEVFLOW_DIR);

  // 优先级: .devflow/ 根 → <req-id>/ → 更深子目录 → 项目根
  const candidates = [path.join(devflowDir, artifact)];
  for (const sub of collectDevflowDirs(devflowDir)) {
    candidates.push(path.join(sub, artifact));
  }
  candidates.push(path.join(projectDir, artifact));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function checkGate(projectDir, gateId) {
  const gate = GATES[gateId];
  if (!gate) return { gate: gateId, passed: false, reason: `Unknown gate: ${gateId}` };

  // auto 类型门控: 检查产物
  if (gate.type === 'auto' || gate.artifacts.length > 0) {
    const missing = gate.artifacts.filter(a => !resolveArtifactPath(projectDir, a));

    if (missing.length > 0) {
      return {
        gate: gateId,
        passed: false,
        label: gate.label,
        type: gate.type,
        missingArtifacts: missing,
        reason: `Missing artifacts: ${missing.join(', ')}`,
      };
    }
  }

  // manual 类型门控: 需要用户确认 (返回需要确认状态)
  return {
    gate: gateId,
    passed: gate.type === 'auto',
    label: gate.label,
    type: gate.type,
    needsUserConfirmation: gate.type === 'manual',
    missingArtifacts: [],
    reason: gate.type === 'manual'
      ? `Manual gate: requires user confirmation for ${gate.label}`
      : `All artifacts present for ${gate.label}`,
  };
}

function checkAllGates(projectDir) {
  const results = {};
  for (const gateId of Object.keys(GATES)) {
    results[gateId] = checkGate(projectDir, gateId);
  }
  return results;
}

function getNextGate(projectDir) {
  const state = require('./core-bridge').readState(projectDir);
  const currentPhase = state.phase;

  // 找到下一个门控
  for (const [gateId, gate] of Object.entries(GATES)) {
    if (gate.phase >= currentPhase) {
      return { gateId, ...gate };
    }
  }
  return null;
}

// ─── CLI 入口 ───────────────────────────────────────────

if (require.main === module) {
  const command = process.argv[2];
  const projectDir = findProjectDir() || process.cwd();

  switch (command) {
    case 'check': {
      const gateId = process.argv[3];
      if (!gateId) {
        console.error('Usage: gate-checker.js check <GATE_ID>');
        process.exit(1);
      }
      const result = checkGate(projectDir, gateId);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    }
    case 'all': {
      const results = checkAllGates(projectDir);
      console.log(JSON.stringify(results, null, 2));
      break;
    }
    case 'next': {
      const next = getNextGate(projectDir);
      console.log(JSON.stringify(next, null, 2));
      break;
    }
    default:
      console.log('DevFlow Gate Checker');
      console.log('Commands: check <GATE_ID> | all | next');
  }
}

module.exports = { GATES, checkGate, checkAllGates, getNextGate, resolveArtifactPath };
