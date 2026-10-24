#!/usr/bin/env node
/**
 * DevFlow Template Check — 内容级门控（R13 模板合规的机器校验）
 *
 * references/templates/ 的产物模板自带 R13.11 双载体清单
 * （`<!-- 必填段落清单 ... -->` HTML 注释 + 可见勾选框），但历史上
 * 只靠 AI 自觉遵守（早期版本的审计显示合规率一度仅 23%）。
 * 本模块把清单变成机器检查：
 *   1. 解析模板的 `<!-- 必填段落清单 -->` 注释，得到必填段落标题列表（单一来源，无副本）；
 *   2. 校验产物文件包含全部必填段落的标题行（`##`/`###` 级）；
 *   3. 校验产物无未替换的 CJK 占位符（如 `<角色>`、`<req-id>` —— 模板遗留的直接证据）。
 *
 * 模板自身没有清单注释 → 该产物不做内容检查（保持存在性检查口径）。
 *
 * 用法: node lib/template-check.js <产物文件>
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_TEMPLATES_DIR = path.join(__dirname, '..', 'references', 'templates');

/** 解析模板中的 `<!-- 必填段落清单 ... -->` 注释，返回必填段落标题列表 */
function getRequiredSections(templateText) {
  const m = templateText.match(/<!--\s*必填段落清单([\s\S]*?)-->/);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^\d+\.\s/.test(l))
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

/** 提取文本中的标题行（## 到 #### 级），返回去空白标题集合 */
function headingSet(text) {
  const set = new Set();
  for (const line of text.split('\n')) {
    const m = line.match(/^#{2,4}\s+(.+?)\s*$/);
    if (m) set.add(m[1].trim());
  }
  return set;
}

/**
 * 未替换占位符检测：尖括号内以 CJK 开头（`<角色>`、`<短标题>`）或
 * `<req-id>`/`<id>` 字面量。CJK 开头的尖括号在真实产物中几乎不合法，
 * 误报率远低于拉丁字母泛匹配（会命中 `Array<string>` 等）。
 */
function findLeftoverPlaceholders(text) {
  const hits = new Set();
  const patterns = [/<[\u4e00-\u9fa5][^>\n]{0,40}>/g, /<(req-id|id)>/g];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) hits.add(m[0]);
  }
  return [...hits];
}

/**
 * 校验产物文件是否符合其模板的内容要求。
 * @param {string} artifactPath 产物文件路径
 * @param {object} [opts]
 * @param {string} [opts.templatesDir] 模板目录（默认 references/templates/）
 * @returns {{hasTemplate:boolean, hasChecklist:boolean, pass:boolean, reason:string,
 *            required?:string[], missing?:string[], placeholders?:string[]}}
 */
function checkTemplate(artifactPath, opts = {}) {
  const templatesDir = opts.templatesDir || DEFAULT_TEMPLATES_DIR;
  const base = path.basename(artifactPath);
  const templatePath = path.join(templatesDir, base);
  if (!fs.existsSync(templatePath)) {
    return { hasTemplate: false, hasChecklist: false, pass: true, reason: `无同名模板 ${base}，仅做存在性检查` };
  }
  const required = getRequiredSections(fs.readFileSync(templatePath, 'utf-8'));
  if (required.length === 0) {
    return { hasTemplate: true, hasChecklist: false, pass: true, reason: `模板 ${base} 无必填段落清单，仅做存在性检查` };
  }

  const text = fs.readFileSync(artifactPath, 'utf-8');
  const headings = headingSet(text);
  const missing = required.filter(t => !headings.has(t));
  const placeholders = findLeftoverPlaceholders(text);

  let pass = missing.length === 0 && placeholders.length === 0;
  let reason;
  if (missing.length > 0) {
    reason = `缺少必填段落: ${missing.join('、')}（模板 ${base} 的 R13.11 清单）`;
  } else if (placeholders.length > 0) {
    reason = `存在未替换占位符: ${placeholders.slice(0, 5).join(' ')}${placeholders.length > 5 ? ' …' : ''}`;
  } else {
    reason = `${required.length} 个必填段落齐全，无未替换占位符`;
  }
  return { hasTemplate: true, hasChecklist: true, pass, reason, required, missing, placeholders };
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.log(`DevFlow Template Check — 内容级门控\n\n用法: node lib/template-check.js <产物文件>\n  校验产物是否包含模板必填段落清单声明的全部段落`);
    process.exit(0);
  }
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) {
    console.error(`❌ 文件不存在: ${abs}`);
    process.exit(1);
  }
  const r = checkTemplate(abs);
  console.log(`模板内容校验: ${path.basename(abs)}\n   ${r.reason}`);
  console.log(r.pass ? '   ✅ PASS' : '   ❌ FAIL');
  process.exit(r.pass ? 0 : 1);
}

if (require.main === module) main();
module.exports = { checkTemplate, getRequiredSections, headingSet, findLeftoverPlaceholders };
