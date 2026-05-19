#!/usr/bin/env node
/**
 * Merge Engine — Delta Specs 动态合并引擎
 * 
 * 将 Delta Specs (ADDED/MODIFIED/REMOVED) 合并到主规格文档中。
 * 纯文件系统操作，零外部依赖。
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// Delta Spec 解析
// ============================================================

/**
 * 解析 Delta Spec 文件
 * @param {string} content - Delta Spec 文件内容
 * @returns {{ added: string[], modified: {target: string, content: string}[], removed: string[] }}
 */
function parseDeltaSpec(content) {
  const result = { added: [], modified: [], removed: [] };
  let currentSection = null;
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (/^##\s+ADDED/i.test(trimmed)) { currentSection = 'added'; continue; }
    if (/^##\s+MODIFIED/i.test(trimmed)) { currentSection = 'modified'; continue; }
    if (/^##\s+REMOVED/i.test(trimmed)) { currentSection = 'removed'; continue; }
    if (!currentSection) continue;
    
    if (currentSection === 'added' && trimmed.startsWith('- ')) {
      result.added.push(trimmed.slice(2));
    } else if (currentSection === 'modified' && trimmed.startsWith('- **') && trimmed.includes('**:')) {
      const match = trimmed.match(/^- \*\*(.+?)\*\*:\s*(.*)$/);
      if (match) result.modified.push({ target: match[1], content: match[2] });
    } else if (currentSection === 'removed' && trimmed.startsWith('- ')) {
      result.removed.push(trimmed.slice(2));
    }
  }
  return result;
}

// ============================================================
// 主规格解析
// ============================================================

function parseMainSpec(content) {
  const sections = [];
  let currentSection = null;
  
  for (const line of content.split('\n')) {
    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: headerMatch[2].trim(), content: line + '\n', level: headerMatch[1].length };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }
  if (currentSection) sections.push(currentSection);
  return sections;
}

// ============================================================
// 合并逻辑
// ============================================================

function merge(mainContent, deltaContent) {
  const delta = parseDeltaSpec(deltaContent);
  const sections = parseMainSpec(mainContent);
  const conflicts = [];
  
  // REMOVED
  const removedTitles = new Set(delta.removed.map(r => r.toLowerCase()));
  const filtered = sections.filter(s => {
    const t = s.title.toLowerCase();
    for (const r of removedTitles) { if (t.includes(r) || r.includes(t)) return false; }
    return true;
  });
  
  // MODIFIED
  for (const mod of delta.modified) {
    let found = false;
    for (const section of filtered) {
      if (section.title.toLowerCase().includes(mod.target.toLowerCase()) ||
          mod.target.toLowerCase().includes(section.title.toLowerCase())) {
        section.content = section.content.trimEnd() + '\n\n> **[MODIFIED]** ' + mod.content + '\n';
        found = true; break;
      }
    }
    if (!found) conflicts.push('MODIFIED target not found: "' + mod.target + '"');
  }
  
  // ADDED
  let addedContent = '';
  if (delta.added.length > 0) {
    addedContent += '\n## Added Requirements\n\n';
    for (const item of delta.added) addedContent += '- ' + item + '\n';
  }
  
  let result = '';
  for (const section of filtered) result += section.content + '\n';
  result += addedContent;
  
  return { content: result.trim() + '\n', conflicts };
}

module.exports = { parseDeltaSpec, parseMainSpec, merge };
