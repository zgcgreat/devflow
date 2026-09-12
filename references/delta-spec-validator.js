#!/usr/bin/env node

/**
 * Delta Spec Validator
 * Validates Delta Spec files for correct format, markers, and merge conflicts.
 * Part of DevFlow v1.3.0 (Phase 4 - Delta Specs Enhancement)
 */

const fs = require('fs');
const path = require('path');

// Delta marker patterns
const MARKERS = ['[ADDED]', '[MODIFIED]', '[REMOVED]', '[RENAMED]', '[MOVED]', '[DEPRECATED]'];
const SECTION_HEADER = /^##?\s/;
const MARKER_RE = /^##\s*\[(ADDED|MODIFIED|REMOVED|RENAMED|MOVED|DEPRECATED)\]/;

function validateDeltaSpec(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const errors = [];
  const warnings = [];

  // 1. Check for at least one delta marker
  const markerCount = lines.filter(line =>
    MARKERS.some(m => line.includes(m))).length;
  if (markerCount === 0) {
    errors.push('No delta markers found. A delta spec must contain at least one [ADDED], [MODIFIED], [REMOVED], [RENAMED], [MOVED], or [DEPRECATED] marker.');
  }

  // 2. Each marker must have content after it
  let lastLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (MARKERS.some(m => line.includes(m))) {
      // Check there's content after the marker
      if (i + 1 >= lines.length || lines[i + 1]?.trim() === '') {
        errors.push(`Line ${i + 1}: Delta marker ${line.trim()} has no content following it.`);
      }
    }
  }

  // 3. Check for required frontmatter
  const hasBaseVersion = content.includes('base-version:');
  const hasAuthor = content.includes('author:');

  if (!hasBaseVersion) warnings.push('No base-version field found');
  if (!hasAuthor) warnings.push('No author metadata found');

  // 4. No merge conflict markers
  const hasConflicts = lines.some(line => line.startsWith('<<<<<<<') || line.startsWith('>>>>>>>'));
  if (hasConflicts) {
    errors.push('Unresolved merge conflict markers found');
  }

  // 5. ADDED sections must have a unique name
  const addedNames = [];
  lines.forEach((line, i) => {
    if (line.includes('[ADDED]')) {
      const name = line.replace(/\[ADDED\]/, '').trim();
      if (addedNames.includes(name)) {
        errors.push(`Duplicate [ADDED] name: "${name}"`);
      }
      addedNames.push(name);
    }
  });

  // 6. MODIFIED sections must include "from" and "to" content
  const modifiedLines = lines.filter(l => l.includes('[MODIFIED]'));
  for (const line of modifiedLines) {
    // Check that there's "from/to" or "old/new" content
    // Simple heuristic: expect a --- separator or "From:" / "To:" blocks
    const idx = lines.indexOf(line);
    let hasFromTo = false;
    for (let j = idx; j < Math.min(idx + 20, lines.length); j++) {
      if (lines[j].includes('---') || lines[j].includes('from:') || lines[j].includes('old:') || lines[j].includes('previous:')) {
        hasFromTo = true;
        break;
      }
    }
    if (!hasFromTo) {
      warnings.push(`Line ${idx + 1}: MODIFIED section missing from/to comparison`);
    }
  }

  return { errors, warnings };
}

// CLI
if (require.main === module) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node delta-spec-validator.js <path-to-delta-spec>');
    process.exit(1);
  }
  const filePath = path.resolve(target);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  const result = validateDeltaSpec(filePath);
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { validateDeltaSpec };