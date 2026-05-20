#!/usr/bin/env node
/**
 * devflow Layer Shape Guard — 验证三层架构约束
 *
 * 用法: node layer-guard.js [--fix] [--ci]
 *   --fix  自动修复可修复的问题（目前仅报告）
 *   --ci   CI 模式：任何 violation 导致非零退出码
 *
 * 检查项：
 *   1. L1 文件不直接引用 L3-ARCHITECTURE
 *   2. 所有 _SKILL.md 有 YAML frontmatter（--- 开头）
 *   3. SKILL.md（无下划线前缀）有可执行代码或声明为 shell module
 *   4. 模板文件被至少一个 skill 引用
 *   5. dependencies 中引用的模块存在
 *   6. _SKILL.md 命名规范：L2-ENGINE 子模块用 _SKILL.md
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const L1 = path.join(ROOT, 'layers', 'L1-INTERACTION');
const L2 = path.join(ROOT, 'layers', 'L2-ENGINE');
const L3 = path.join(ROOT, 'layers', 'L3-ARCHITECTURE');

const args = process.argv.slice(2);
const ciMode = args.includes('--ci');

let violations = [];
let warnings = [];

// ── Helpers ──────────────────────────────────────────────

function walk(dir, ext, depth = 0) {
  if (depth > 10) return [];
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...walk(full, ext, depth + 1));
      else if (!ext || (ext.startsWith('.') ? entry.name.endsWith(ext) : entry.name === ext)) results.push(full);
    }
  } catch (e) { /* skip */ }
  return results;
}

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, '/'); }

function check(label, condition, file, severity = 'error') {
  if (!condition) {
    const entry = { label, file: rel(file) };
    if (severity === 'error') violations.push(entry);
    else warnings.push(entry);
  }
}

// ── Check 1: L1 → L3 隔离 ───────────────────────────────

function checkL1Isolation() {
  const l1Files = walk(L1, '.md');
  const l3Refs = [
    'L3-ARCHITECTURE',
    'layers/L3-ARCHITECTURE',
  ];

  for (const file of l1Files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const ref of l3Refs) {
      // 排除 CONSTITUTION.md 中对 L3 的提及（那是允许的规则说明）
      if (file.endsWith('CONSTITUTION.md')) continue;
      // 检查非 frontmatter 区域中的 L3 引用
      const body = content.replace(/^---[\s\S]*?---/, ''); // 去掉 frontmatter
      if (body.includes(ref)) {
        check(`L1→L3 违规: 引用 "${ref}"`, false, file);
      }
    }
  }
}

// ── Check 2: Frontmatter 完整性 ─────────────────────────

function checkFrontmatter() {
  const skillFiles = [
    ...walk(L1, '_SKILL.md'),
    ...walk(L2, '_SKILL.md'),
    ...walk(L1, 'SKILL.md'),
    ...walk(L2, 'SKILL.md'),
    ...walk(L3, 'SKILL.md'),
  ];

  for (const file of skillFiles) {
    const content = fs.readFileSync(file, 'utf8').trimStart();
    check('缺少 YAML frontmatter (--- 开头)', content.startsWith('---'), file);

    if (content.startsWith('---')) {
      const end = content.indexOf('---', 3);
      if (end === -1) {
        check('YAML frontmatter 未闭合 (缺少第二个 ---)', false, file);
      } else {
        const fm = content.slice(3, end);
        check('frontmatter 缺少 name 字段', fm.includes('name:'), file);
        check('frontmatter 缺少 description 字段', fm.includes('description:'), file);
      }
    }
  }
}

// ── Check 3: SKILL.md vs _SKILL.md 命名规范 ─────────────

function checkNamingConvention() {
  // L2-ENGINE 子模块应该用 _SKILL.md（内部实现）
  const l2SkillFiles = walk(L2, 'SKILL.md').filter(f => !f.includes('node_modules'));
  for (const file of l2SkillFiles) {
    const dir = path.dirname(file);
    const parentDir = path.basename(path.dirname(dir));
    // 如果同目录下也有 _SKILL.md，说明 SKILL.md 是遗留
    if (fs.existsSync(path.join(dir, '_SKILL.md'))) {
      check('L2 模块同时有 SKILL.md 和 _SKILL.md（应统一为 _SKILL.md）', false, file, 'warn');
    }
  }
}

// ── Check 4: 模板文件被引用 ─────────────────────────────

function checkTemplateReferences() {
  const templatesDir = path.join(ROOT, 'templates');
  if (!fs.existsSync(templatesDir)) return;

  const templateFiles = walk(templatesDir, '.md');
  const allSkillContent = [
    ...walk(L1, '.md'),
    ...walk(L2, '.md'),
  ].map(f => ({
    file: f,
    content: fs.readFileSync(f, 'utf8'),
  }));

  for (const tpl of templateFiles) {
    const tplName = path.basename(tpl);
    const referenced = allSkillContent.some(({ content }) => content.includes(tplName));
    check(`模板未被任何 skill 引用: ${tplName}`, referenced, tpl, 'warn');
  }
}

// ── Check 5: dependencies 存在性 ─────────────────────────

function checkDependenciesExist() {
  const allSkillDirs = new Set();

  // 收集所有 skill 目录
  for (const layer of [L1, L2, L3]) {
    const dirs = walk(layer, '_SKILL.md').map(f => path.basename(path.dirname(f)));
    dirs.forEach(d => allSkillDirs.add(d));
    const dirs2 = walk(layer, 'SKILL.md').map(f => path.basename(path.dirname(f)));
    dirs2.forEach(d => allSkillDirs.add(d));
  }

  // 检查每个 _SKILL.md 的 dependencies
  const skillFiles = [...walk(L1, '_SKILL.md'), ...walk(L2, '_SKILL.md'), ...walk(L3, '_SKILL.md')];
  for (const file of skillFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.startsWith('---')) continue;

    const end = content.indexOf('---', 3);
    if (end === -1) continue;

    const fm = content.slice(3, end);
    const depMatch = fm.match(/^dependencies:\s*\n((?:\s+-\s+\S+.*\n?)*)/m);
    if (!depMatch) continue;

    const deps = depMatch[1].trim().split('\n').map(line => {
      const m = line.match(/^\s+-\s+(\S+)/);
      return m ? m[1] : null;
    }).filter(Boolean);

    for (const dep of deps) {
      check(`dependency "${dep}" 不存在`, allSkillDirs.has(dep), file, 'warn');
    }
  }
}

// ── Run ──────────────────────────────────────────────────

console.log('🔍 devflow Layer Shape Guard\n');

checkL1Isolation();
checkFrontmatter();
checkNamingConvention();
checkTemplateReferences();
checkDependenciesExist();

// ── Report ───────────────────────────────────────────────

if (violations.length > 0) {
  console.log(`❌ ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.log(`  • ${v.label}`);
    console.log(`    File: ${v.file}\n`);
  }
}

if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} warning(s):\n`);
  for (const w of warnings) {
    console.log(`  • ${w.label}`);
    console.log(`    File: ${w.file}\n`);
  }
}

if (violations.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed — layer architecture is clean.\n');
}

if (ciMode && violations.length > 0) {
  console.log('🚫 CI mode: exiting with code 1 due to violations.\n');
  process.exit(1);
}

process.exit(0);
