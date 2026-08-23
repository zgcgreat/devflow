#!/usr/bin/env node
/**
 * ForgeOS Gate Checker — 运行时无关的门禁检查器
 *
 * 从 gate-check.js 和 gate-rules.md 提取公共逻辑。
 * 各运行时适配器通过 core-bridge.checkGate() 调用此模块。
 *
 * 支持: auto 类型门控自动检查产物, manual 类型需要用户确认
 */

const fs = require('fs');
const path = require('path');
const { findProjectDir, FORGEOS_DIR } = require('./core-bridge');

// ─── 门控定义 ───────────────────────────────────────────

const GATES = {
  G0:   { phase: 0,   artifacts: ['00-strategy.md'],               label: 'Strategy',     type: 'auto' },
  G1:   { phase: 1,   artifacts: ['01-analysis.md'],               label: 'Analysis',     type: 'auto' },
  G2:   { phase: 1,   artifacts: ['01-analysis.md'],               label: 'Architecture', type: 'manual' },
  'G2.5': { phase: 1.5, artifacts: ['01b-context.md'],            label: 'Discuss',      type: 'manual' },
  G3:   { phase: 2,   artifacts: ['02-design.md'],                 label: 'Design',       type: 'manual' },
  'G3.5': { phase: 2.5, artifacts: ['02a-variants.md'],           label: 'Shotgun',      type: 'manual' },
  G4:   { phase: 3,   artifacts: ['03-tasks.md'],                  label: 'TaskPlan',     type: 'auto' },
  G5:   { phase: 4,   artifacts: ['04-wave-logs.md'],              label: 'Build',        type: 'manual' },
  G6:   { phase: 5,   artifacts: ['05-test-report.md'],            label: 'Test',         type: 'auto' },
  G7:   { phase: 6,   artifacts: ['06-review.md'],                 label: 'Review',       type: 'manual' },
  'G7.5': { phase: 7,   artifacts: ['07-canary.md'],              label: 'Canary',       type: 'manual' },
  G8:   { phase: 8,   artifacts: ['08-archive.md'],                label: 'Archive',      type: 'auto' },
};

// ─── 检查逻辑 ───────────────────────────────────────────

function resolveArtifactPath(projectDir, artifact) {
  // 在 .forgeos/<req-id>/ 和项目根目录下查找
  const candidates = [
    path.join(projectDir, FORGEOS_DIR, artifact),
    path.join(projectDir, artifact),
  ];

  // 检查 .forgeos/ 下的子目录
  const forgeosDir = path.join(projectDir, FORGEOS_DIR);
  if (fs.existsSync(forgeosDir)) {
    try {
      const entries = fs.readdirSync(forgeosDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          candidates.push(path.join(forgeosDir, entry.name, artifact));
        }
      }
    } catch (e) { /* ignore */ }
  }

  // 检查 .specs/ 和 .specs/test/ 下
  candidates.push(path.join(projectDir, '.specs', artifact));
  candidates.push(path.join(projectDir, '.specs', 'test', artifact));
  candidates.push(path.join(projectDir, '.specs', 'reviews', artifact));
  candidates.push(path.join(projectDir, '.specs', 'waves', artifact));

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
      console.log('ForgeOS Gate Checker');
      console.log('Commands: check <GATE_ID> | all | next');
  }
}

module.exports = { GATES, checkGate, checkAllGates, getNextGate, resolveArtifactPath };
