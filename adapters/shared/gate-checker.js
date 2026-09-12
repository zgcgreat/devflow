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
  const { GATES: AUTHORITATIVE, PHASES } = require('../../lib/phase-engine');
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
