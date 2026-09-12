#!/usr/bin/env node
/**
 * DevFlow gate-check — 门控自动化验证器
 *
 * ⚠️ 门控定义完全派生自 lib/phase-engine.js 的权威 GATES + PHASES，
 * 不再维护独立副本，从根源消除双源漂移（历史 bug: G7.5/G8 产物名错误、
 * G1/G3/G5 auto/manual 类型冲突、缺 G2）。
 *
 * 用法: node gate-check.js --phase 2 --dir .devflow
 *       node gate-check.js --gate G3.5 --dir .devflow
 *       node gate-check.js --all
 *
 * 返回: exit code 0=全部通过, 1=存在未通过 (打印失败原因)
 */

const fs = require('fs');
const path = require('path');

// 单一权威源：lib/phase-engine.js
const { GATES, PHASES } = require('../../lib/phase-engine');

/**
 * 由权威定义派生每个 gate 的前置产物：
 * 若某 Phase 的 gate 或 extraGates 命中 gate.id，则收集该 Phase 的 output。
 */
function buildGateMap() {
  const map = {};
  for (const g of GATES) {
    map[g.id] = { id: g.id, name: g.name, type: g.type, phaseAfter: g.phaseAfter, artifacts: [] };
  }
  for (const phase of PHASES) {
    const related = [phase.gate, ...(phase.extraGates || [])];
    for (const gid of related) {
      const entry = map[gid];
      if (entry && !entry.artifacts.includes(phase.output)) entry.artifacts.push(phase.output);
    }
  }
  return map;
}

const GATE_MAP = buildGateMap();

function findGate(opts) {
  if (opts.phase !== undefined && opts.phase !== null) {
    const gate = GATES.find(g => g.phaseAfter === opts.phase);
    return gate ? GATE_MAP[gate.id] : null;
  }
  if (opts.gate) return GATE_MAP[opts.gate];
  return null;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase') opts.phase = parseFloat(args[++i]);
    else if (args[i] === '--gate') opts.gate = args[++i];
    else if (args[i] === '--dir') opts.dir = args[++i];
    else if (args[i] === '--all') opts.all = true;
  }
  opts.dir = opts.dir || path.join(process.cwd(), '.devflow');
  return opts;
}

/**
 * 递归定位产物文件（限深 3 层）。
 * GO.md 协议要求产物保存到 .devflow/<req-id>/ 下；wave 类产物可达
 * .devflow/<req-id>/waves/wave-{N}/ 三层，故需递归而非只扫一层。
 * .devflow/ 根目录的历史布局同样视为有效。
 */
function findArtifact(dir, name, depth = 0) {
  if (depth > 3) return null;
  const direct = path.join(dir, name);
  if (fs.existsSync(direct)) return direct;
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const found = findArtifact(path.join(dir, e.name), name, depth + 1);
      if (found) return found;
    }
  } catch { /* dir 不可读时仅返回 null */ }
  return null;
}

function checkGate(gate, dir) {
  console.log(`\n🔍 ${gate.name} (${gate.artifacts.join(', ')}) [${gate.type}]`);
  console.log(`   目录: ${dir}/ (支持根目录与 <req-id>/ 子目录)`);

  const missing = gate.artifacts.filter(a => !findArtifact(dir, a));

  if (missing.length === 0) {
    console.log(`   ✅ PASS — 所有产物存在`);
    return true;
  } else {
    console.log(`   ❌ FAIL — 缺少: ${missing.join(', ')}`);
    return false;
  }
}

function main() {
  const opts = parseArgs();
  let allPass = true;

  if (opts.all) {
    console.log('📋 DevFlow 门控全量检查 (派生自 phase-engine.js 权威定义)\n');
    // 保持 GATES 声明顺序
    GATES.forEach(g => {
      if (!checkGate(GATE_MAP[g.id], opts.dir)) allPass = false;
    });
  } else {
    const gate = findGate(opts);
    if (!gate) {
      console.error('用法: node gate-check.js --phase <0-8> 或 --gate <G0-G8>');
      console.error('      node gate-check.js --all');
      process.exit(1);
    }
    if (!checkGate(gate, opts.dir)) allPass = false;
  }

  console.log(allPass ? '\n✅ 所有门控通过\n' : '\n❌ 部分门控未通过\n');
  process.exit(allPass ? 0 : 1);
}

if (require.main === module) main();

// 作为库被 adapters/shared/core-bridge.js require 时：绝不运行 CLI、绝不 process.exit，
// 仅导出派生后的门控映射（修正历史 bug：require 时误触 CLI exit(1) 且未导出）。
module.exports = { GATES, PHASES, GATE_MAP, findGate, checkGate, buildGateMap, findArtifact };
