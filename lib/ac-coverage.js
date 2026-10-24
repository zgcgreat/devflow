#!/usr/bin/env node
/**
 * DevFlow AC Coverage — G6 门控的真实覆盖率检查器
 *
 * G6 (Test Gate) 在 gate-rules.md 中声明为 "AC 覆盖率 ≥ 90%"，但历史上
 * gate-check.js 只验证 05-test-report.md 是否存在 —— 覆盖率从未被度量。
 * 本模块补齐度量：
 *   1. 从 01-analysis.md 解析 AC 清单（`### AC-N · 标题` 标题行）；
 *   2. 从 05-test-report.md 解析 AC → 用例映射（表格行中出现的 AC-N，
 *      覆盖 1.1 测试矩阵与「新增测试登记」两张表）；
 *   3. 覆盖率 = 有用例映射的 AC / 总 AC；状态列为 ❌ 的行记为「已覆盖但未通过」；
 *   4. 通过条件：覆盖率 ≥ 阈值(默认 90%) 且无 ❌ 用例行。
 *
 * Fast/Lean 模式没有 01-analysis.md（AC 来源不存在），检查返回 not-applicable
 * 并放行（与模式裁剪一致），仅 Standard/Strict 受此门约束。
 *
 * 用法: node lib/ac-coverage.js <目录>            # 目录 = .devflow 或 .devflow/<req-id>
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_THRESHOLD = 90;

/** 从 01-analysis.md 文本解析 AC 编号清单（`### AC-1 · xxx` / `#### AC-2` 标题行） */
function parseACs(analysisText) {
  const ids = new Set();
  const re = /^#{2,4}\s+AC-(\d+)\b/gm;
  let m;
  while ((m = re.exec(analysisText)) !== null) ids.add(`AC-${m[1]}`);
  return [...ids].sort((a, b) => parseInt(a.slice(3), 10) - parseInt(b.slice(3), 10));
}

/**
 * 从 05-test-report.md 文本解析 AC 映射与失败用例。
 * 只扫表格行（`|` 开头）：1.1 测试矩阵的首列、新增测试登记的「覆盖 AC」列
 * 都会被 `AC-\d+` 全量提取；行内出现 ❌ 视为该行所有 AC 命中失败用例。
 */
function parseReport(reportText) {
  const mapped = new Set();
  const failing = new Set();
  for (const line of reportText.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const ids = [...line.matchAll(/AC-(\d+)/g)].map(x => `AC-${x[1]}`);
    if (ids.length === 0) continue;
    ids.forEach(id => mapped.add(id));
    if (line.includes('❌')) ids.forEach(id => failing.add(id));
  }
  return { mapped: [...mapped], failing: [...failing] };
}

/** 递归定位文件（限深 3 层，与 gate-check.js findArtifact 同口径；只跳过 .git/node_modules） */
function locate(dir, name, depth = 0) {
  if (depth > 3) return null;
  const direct = path.join(dir, name);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name === '.git' || e.name === 'node_modules') continue;
      const found = locate(path.join(dir, e.name), name, depth + 1);
      if (found) return found;
    }
  } catch { /* 目录不可读 */ }
  return null;
}

/**
 * 检查 AC 覆盖率。
 * @param {string} dir .devflow 根目录或 .devflow/<req-id> 目录
 * @param {object} [opts]
 * @param {number} [opts.threshold=90] 覆盖率阈值（百分比）
 * @returns {{applicable:boolean, pass:boolean, reason:string, total?:number,
 *            covered?:string[], uncovered?:string[], failing?:string[],
 *            coveredPct?:number, threshold?:number, reportPath?:string, analysisPath?:string}}
 */
function checkACCoverage(dir, opts = {}) {
  const threshold = typeof opts.threshold === 'number' ? opts.threshold : DEFAULT_THRESHOLD;
  const reportPath = locate(dir, '05-test-report.md');
  if (!reportPath) {
    return { applicable: false, pass: false, reason: '未找到 05-test-report.md（测试产物缺失，G6 产物检查会先失败）' };
  }
  // AC 来源与测试报告应在同一 req 目录（或 .devflow 根，历史布局）。
  // 只做两级直查，绝不递归进兄弟 req 目录 —— 防止拿到别的需求的 AC 清单。
  const reqDir = path.dirname(reportPath);
  const candidates = [
    path.join(reqDir, '01-analysis.md'),
    path.join(path.dirname(reqDir), '01-analysis.md'),
  ];
  const analysisPath = candidates.find(p => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!analysisPath) {
    return {
      applicable: false, pass: true, reportPath,
      reason: '无 01-analysis.md（Fast/Lean 模式无 AC 来源）→ AC 覆盖检查不适用，仅检查产物存在',
    };
  }

  const acs = parseACs(fs.readFileSync(analysisPath, 'utf-8'));
  const { mapped, failing } = parseReport(fs.readFileSync(reportPath, 'utf-8'));
  if (acs.length === 0) {
    return {
      applicable: false, pass: true, reportPath, analysisPath,
      reason: '01-analysis.md 未定义任何 AC（`### AC-N` 标题）→ 覆盖检查不适用',
    };
  }

  const covered = acs.filter(id => mapped.includes(id));
  const uncovered = acs.filter(id => !mapped.includes(id));
  const failingHit = failing.filter(id => acs.includes(id));
  const coveredPct = Math.round((covered.length / acs.length) * 100);

  let pass = coveredPct >= threshold && failingHit.length === 0;
  let reason;
  if (failingHit.length > 0) {
    reason = `存在失败用例覆盖的 AC: ${failingHit.join(', ')}（状态 ❌）`;
  } else if (coveredPct < threshold) {
    reason = `AC 覆盖率 ${coveredPct}% < 阈值 ${threshold}%，未覆盖: ${uncovered.join(', ') || '无'}`;
  } else {
    reason = `AC 覆盖率 ${coveredPct}% ≥ ${threshold}%（${covered.length}/${acs.length}），无失败用例`;
  }

  return {
    applicable: true, pass, reason, threshold,
    total: acs.length, covered, uncovered, failing: failingHit, coveredPct,
    reportPath, analysisPath,
  };
}

function formatReport(r) {
  if (!r.applicable) return `ℹ️ ${r.reason}`;
  const lines = [
    `AC 覆盖率: ${r.coveredPct}% (${r.covered.length}/${r.total})，阈值 ${r.threshold}%`,
    `   来源: ${r.analysisPath}`,
    `   报告: ${r.reportPath}`,
    r.uncovered.length > 0 ? `   ⚠️ 未覆盖: ${r.uncovered.join(', ')}` : `   ✅ 全部 AC 已有用例映射`,
  ];
  if (r.failing.length > 0) lines.push(`   ❌ 失败用例覆盖的 AC: ${r.failing.join(', ')}`);
  lines.push(r.pass ? '   ✅ PASS' : '   ❌ FAIL');
  return lines.join('\n');
}

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.log(`DevFlow AC Coverage — G6 门控覆盖率检查\n\n用法: node lib/ac-coverage.js <目录>\n  目录 = .devflow 或 .devflow/<req-id>`);
    process.exit(0);
  }
  const r = checkACCoverage(path.resolve(dir));
  console.log(formatReport(r));
  process.exit(r.pass ? 0 : 1);
}

if (require.main === module) main();
module.exports = { checkACCoverage, parseACs, parseReport, DEFAULT_THRESHOLD };
