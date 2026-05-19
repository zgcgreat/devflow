#!/usr/bin/env node
/**
 * Verify — 五层验证执行器
 * 
 * 用法: node verify.js <level> <projectDir> [--quick]
 * level: format | implement | test | review | deploy
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { verifyChange } = require('../change-manager/change-lifecycle');

// ============================================================
// L1: 格式验证
// ============================================================

function verifyFormat(projectDir) {
  const results = { level: 'format', status: 'passed', checks: [], failed: 0 };

  // 检查 .devflow 目录结构
  const requiredDirs = ['.devflow', '.devflow/memory', '.devflow/changes'];
  for (const dir of requiredDirs) {
    const exists = fs.existsSync(path.join(projectDir, dir));
    results.checks.push({ check: 'dir:' + dir, passed: exists });
    if (!exists) results.failed++;
  }

  // 检查 STATE.md 格式
  const statePath = path.join(projectDir, '.devflow/STATE.md');
  if (fs.existsSync(statePath)) {
    const content = fs.readFileSync(statePath, 'utf8');
    const hasPhase = /当前阶段/.test(content);
    results.checks.push({ check: 'STATE.md:phase', passed: hasPhase });
    if (!hasPhase) results.failed++;
  }

  // 检查 SKILL.md frontmatter
  const skillFiles = findFiles(path.join(projectDir, 'layers'), '_SKILL.md');
  for (const f of skillFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const hasFrontmatter = content.startsWith('---');
    results.checks.push({ check: 'frontmatter:' + path.relative(projectDir, f), passed: hasFrontmatter });
    if (!hasFrontmatter) results.failed++;
  }

  if (results.failed > 0) results.status = 'failed';
  return results;
}

// ============================================================
// L2: 实现验证
// ============================================================

function verifyImplement(projectDir, quick = false) {
  const results = { level: 'implement', status: 'passed', checks: [], failed: 0, tasks: 0, verified: 0 };

  // 检查 package.json 是否存在
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath) && !quick) {
    // TypeScript 类型检查
    try {
      execSync('npx tsc --noEmit', { cwd: projectDir, stdio: 'pipe', timeout: 30000 });
      results.checks.push({ check: 'tsc', passed: true });
      results.verified++;
    } catch (e) {
      results.checks.push({ check: 'tsc', passed: false, error: e.stderr?.toString().slice(0, 200) });
      results.failed++;
    }

    // ESLint
    try {
      execSync('npx eslint . --max-warnings 0', { cwd: projectDir, stdio: 'pipe', timeout: 30000 });
      results.checks.push({ check: 'eslint', passed: true });
    } catch (e) {
      results.checks.push({ check: 'eslint', passed: false, note: 'Has warnings/errors' });
    }

    results.tasks = 2; // tsc + eslint
    results.verified = results.checks.filter(c => c.passed).length;
  }

  if (results.failed > 0) results.status = 'failed';
  return results;
}

// ============================================================
// L3: 测试验证
// ============================================================

function verifyTest(projectDir) {
  const results = { level: 'test', status: 'pending', unit: 0, integration: 0, e2e: 0, coverage: 0 };

  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const output = execSync('npm test -- --reporter=json 2>/dev/null || npm test 2>&1', {
        cwd: projectDir, encoding: 'utf8', timeout: 120000
      });
      // 简单解析测试结果
      const passMatch = output.match(/(\d+) passing/);
      const failMatch = output.match(/(\d+) failing/);
      if (passMatch) results.unit = parseInt(passMatch[1]);
      if (failMatch && parseInt(failMatch[1]) > 0) results.status = 'failed';
      else results.status = 'passed';
    } catch (e) {
      results.status = 'error';
      results.error = e.message?.slice(0, 200);
    }
  }

  return results;
}

// ============================================================
// L4: 审查验证
// ============================================================

function verifyReview(projectDir) {
  const changesDir = path.join(projectDir, '.devflow/changes');
  if (!fs.existsSync(changesDir)) {
    return { level: 'review', status: 'skipped', note: 'No active changes' };
  }

  const changeNames = fs.readdirSync(changesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'archive')
    .map(d => d.name);

  if (changeNames.length === 0) {
    return { level: 'review', status: 'skipped', note: 'No active changes' };
  }

  const results = { level: 'review', status: 'passed', changes: [] };
  for (const name of changeNames) {
    const changeDir = path.join(changesDir, name);
    const v = verifyChange(changeDir);
    results.changes.push({ name, verification: v });
    if (v.overall === 'failed') results.status = 'failed';
  }

  return results;
}

// ============================================================
// L5: 部署验证
// ============================================================

function verifyDeploy(projectDir) {
  // 部署验证需要外部环境，这里只返回状态
  return {
    level: 'deploy',
    status: 'pending',
    note: 'Requires canary environment. Run health checks manually.',
    checks: [
      'error_rate < baseline * 1.5',
      'p99_latency < baseline * 1.2',
      'cpu_usage < threshold',
      'memory_usage < threshold'
    ]
  };
}

// ============================================================
// 工具函数
// ============================================================

function findFiles(dir, name) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) results.push(...findFiles(p, name));
      else if (e.name === name) results.push(p);
    }
  } catch (e) { /* skip */ }
  return results;
}

// ============================================================
// CLI 入口
// ============================================================

const levelMap = { format: verifyFormat, implement: verifyImplement, test: verifyTest, review: verifyReview, deploy: verifyDeploy };

if (require.main === module) {
  const [,, level, projectDir, ...flags] = process.argv;
  if (!level || !projectDir) {
    console.error('Usage: verify.js <format|implement|test|review|deploy> <projectDir> [--quick]');
    process.exit(1);
  }
  const fn = levelMap[level];
  if (!fn) { console.error('Unknown level:', level); process.exit(1); }
  const quick = flags.includes('--quick');
  const result = fn(path.resolve(projectDir), quick);
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'failed') process.exit(1);
}

module.exports = { verifyFormat, verifyImplement, verifyTest, verifyReview, verifyDeploy };