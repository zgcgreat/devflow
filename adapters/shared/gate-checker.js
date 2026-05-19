#!/usr/bin/env node
/**
 * Gate Checker — 门禁检查模块
 * 从 gate-check.sh 升级为 Node.js 实现，支持多运行时调用。
 */

const fs = require('fs');
const path = require('path');
const { readState } = require('./core-bridge');

const ARTIFACTS_DIR = '.devflow';

/**
 * 阶段依赖与必需产物定义
 */
const GATE_REQUIREMENTS = {
  '0': { requires: [], artifacts: [] },
  '1': { requires: ['0'], artifacts: ['00-requirements.md'] },
  '1-5whys': { requires: ['0'], artifacts: ['00-requirements.md'] },
  '1b': { requires: ['0'], artifacts: ['00-requirements.md'] },
  '2': { requires: ['1'], artifacts: ['01-analysis.md'] },
  '2a': { requires: ['2'], artifacts: ['02-design.md'] },
  '3': { requires: ['2'], artifacts: ['02-design.md', '03-tasks.md'] },
  '4': { requires: ['3'], artifacts: ['03-tasks.md'] },
  '5': { requires: ['4'], artifacts: ['04-dev-log.md'] },
  '6': { requires: ['5'], artifacts: ['05-test-report.md'] },
  '7': { requires: ['6'], artifacts: ['06-code-review.md'] },
  '8': { requires: ['7'], artifacts: ['07-release-checklist.md'] }
};

/**
 * 执行门禁检查
 * @param {string} projectDir - 项目根目录
 * @param {string} targetPhase - 目标阶段 (e.g. '3', '4')
 * @returns {{ passed: boolean, missingArtifacts: string[], missingPhases: string[], reason: string|null }}
 */
function checkGate(projectDir, targetPhase) {
  const state = readState(projectDir);

  if (!state.phase) {
    return { passed: false, missingArtifacts: [], missingPhases: [], reason: '项目未初始化，请先运行 phase-0' };
  }

  const targetKey = targetPhase.split('-')[0];
  const req = GATE_REQUIREMENTS[targetKey];

  if (!req) {
    return { passed: true, missingArtifacts: [], missingPhases: [], reason: null };
  }

  // 检查前置阶段
  const currentPhaseNum = parseInt((state.phase || '0').split('-')[0], 10) || 0;
  const targetPhaseNum = parseInt(targetKey, 10) || 0;
  const missingPhases = [];

  if (targetPhaseNum > currentPhaseNum + 1) {
    for (let i = currentPhaseNum + 1; i < targetPhaseNum; i++) {
      missingPhases.push(String(i));
    }
    return {
      passed: false,
      missingArtifacts: req.artifacts,
      missingPhases,
      reason: `阶段跳跃：当前 Phase ${state.phase}，目标 Phase ${targetPhase}，需先完成 Phase ${missingPhases.join(', ')}`
    };
  }

  // 检查产物文件
  const missingArtifacts = [];
  const reqId = state.reqId || 'default';

  for (const artifact of req.artifacts) {
    const artifactPath = path.join(projectDir, ARTIFACTS_DIR, reqId, artifact);
    if (!fs.existsSync(artifactPath)) {
      missingArtifacts.push(artifact);
    }
  }

  if (missingArtifacts.length > 0) {
    return {
      passed: false,
      missingArtifacts,
      missingPhases: [],
      reason: `缺少必需产物: ${missingArtifacts.join(', ')}`
    };
  }

  return { passed: true, missingArtifacts: [], missingPhases: [], reason: null };
}

/**
 * 获取阶段的所有门禁要求
 */
function getGateRequirements(phase) {
  const key = phase.split('-')[0];
  return GATE_REQUIREMENTS[key] || { requires: [], artifacts: [] };
}

module.exports = { checkGate, getGateRequirements, GATE_REQUIREMENTS };
