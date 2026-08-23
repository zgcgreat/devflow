#!/usr/bin/env node
/**
 * ForgeOS gate-check — 门控自动化验证器
 *
 * ⚠️ 门控定义完全派生自 lib/phase-engine.js 的权威 GATES + PHASES，
 * 不再维护独立副本，从根源消除双源漂移（历史 bug: G7.5/G8 产物名错误、
 * G1/G3/G5 auto/manual 类型冲突、缺 G2）。
 *
 * 用法: node gate-check.js --phase 2 --dir .forgeos
 *       node gate-check.js --gate G3.5 --dir .forgeos
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
  opts.dir = opts.dir || path.join(process.cwd(), '.forgeos');
  return opts;
}

function checkGate(gate, dir) {
  console.log(`\n🔍 ${gate.name} (${gate.artifacts.join(', ')}) [${gate.type}]`);
  console.log(`   目录: ${dir}/`);

  const missing = gate.artifacts.filter(a => !fs.existsSync(path.join(dir, a)));

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
    console.log('📋 ForgeOS 门控全量检查 (派生自 phase-engine.js 权威定义)\n');
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

main();
