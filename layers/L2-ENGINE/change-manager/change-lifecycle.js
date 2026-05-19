#!/usr/bin/env node
/**
 * Change Lifecycle — 变更生命周期管理
 * proposal → apply → verify → archive
 */

const fs = require('fs');
const path = require('path');
const { merge } = require('./merge-engine');

const CHANGES_DIR = '.devflow/changes';
const ARCHIVE_DIR = '.devflow/changes/archive';

function createChange(projectDir, name, goal) {
  const changeDir = path.join(projectDir, CHANGES_DIR, name);
  if (fs.existsSync(changeDir)) throw new Error('Change "' + name + '" already exists');
  fs.mkdirSync(changeDir, { recursive: true });
  fs.mkdirSync(path.join(changeDir, 'specs'), { recursive: true });
  const today = new Date().toISOString().split('T')[0];
  fs.writeFileSync(path.join(changeDir, 'proposal.md'),
    '# Proposal: ' + name + '\n\n## Goal\n' + goal + '\n\n## Why\n\n## What\n\n');
  fs.writeFileSync(path.join(changeDir, '.devflow-change.yaml'),
    'name: ' + name + '\nschema: spec-driven\ncreated: ' + today +
    '\ngoal: "' + goal + '"\naffected_areas: []\nstatus: proposal\nartifacts:\n' +
    '  proposal: { completed: true, updated: ' + today + ' }\n' +
    '  specs: { completed: false }\n  design: { completed: false }\n  tasks: { completed: false }\n');
  return changeDir;
}

function detectCompleted(changeDir) {
  const a = { proposal: false, design: false, tasks: false, specs: false };
  if (fs.existsSync(path.join(changeDir, 'proposal.md'))) a.proposal = true;
  if (fs.existsSync(path.join(changeDir, 'design.md'))) a.design = true;
  if (fs.existsSync(path.join(changeDir, 'tasks.md'))) a.tasks = true;
  const specsDir = path.join(changeDir, 'specs');
  if (fs.existsSync(specsDir)) a.specs = findFiles(specsDir, '.md').length > 0;
  return a;
}

function getNextArtifacts(completed) {
  const deps = { proposal: [], specs: ['proposal'], design: ['proposal'], tasks: ['specs', 'design'] };
  const ready = [];
  for (const [k, req] of Object.entries(deps)) {
    if (completed[k]) continue;
    if (req.every(d => completed[d])) ready.push(k);
  }
  return ready;
}

function updateStatus(changeDir, status) {
  const p = path.join(changeDir, '.devflow-change.yaml');
  if (!fs.existsSync(p)) return;
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/status:\s*\w+/, 'status: ' + status));
}

function applyChange(changeDir, mainSpecPath) {
  if (!fs.existsSync(mainSpecPath)) return { success: false, error: 'Main spec not found' };
  const specsDir = path.join(changeDir, 'specs');
  if (!fs.existsSync(specsDir)) { updateStatus(changeDir, 'applying'); return { success: true, mergedFiles: [], conflicts: [] }; }
  const deltaFiles = findFiles(specsDir, '.md');
  if (deltaFiles.length === 0) { updateStatus(changeDir, 'applying'); return { success: true, mergedFiles: [], conflicts: [] }; }
  let current = fs.readFileSync(mainSpecPath, 'utf8');
  const conflicts = [], mergedFiles = [];
  for (const f of deltaFiles) {
    const r = merge(current, fs.readFileSync(f, 'utf8'));
    current = r.content; conflicts.push(...r.conflicts);
    mergedFiles.push(path.relative(changeDir, f));
  }
  fs.writeFileSync(mainSpecPath, current);
  updateStatus(changeDir, 'applying');
  return { success: true, mergedFiles, conflicts };
}

function verifyChange(changeDir) {
  const completed = detectCompleted(changeDir);
  let completeness = { status: 'passed', details: {} };
  const tasksPath = path.join(changeDir, 'tasks.md');
  if (fs.existsSync(tasksPath)) {
    const t = fs.readFileSync(tasksPath, 'utf8');
    const total = (t.match(/- \[[ x]\]/g) || []).length;
    const checked = (t.match(/- \[x\]/gi) || []).length;
    completeness.details = { total, checked };
    if (total > 0 && checked < total) completeness.status = 'failed';
  }
  const coherence = { status: 'passed', issues: [] };
  if (!completed.design && completed.tasks) { coherence.issues.push('Tasks without design'); coherence.status = 'warning'; }
  return {
    completeness,
    correctness: { status: 'pending', note: 'Requires test results' },
    coherence,
    overall: completeness.status === 'passed' && coherence.status !== 'failed' ? 'passed' : 'failed'
  };
}

function archiveChange(projectDir, changeName) {
  const src = path.join(projectDir, CHANGES_DIR, changeName);
  const archiveDir = path.join(projectDir, ARCHIVE_DIR);
  if (!fs.existsSync(src)) throw new Error('Change not found: ' + changeName);
  fs.mkdirSync(archiveDir, { recursive: true });
  const dest = path.join(archiveDir, new Date().toISOString().split('T')[0] + '-' + changeName);
  fs.renameSync(src, dest);
  updateStatus(dest, 'archived');
  return dest;
}

function listChanges(projectDir) {
  const d = path.join(projectDir, CHANGES_DIR);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== 'archive')
    .map(e => {
      const mp = path.join(d, e.name, '.devflow-change.yaml');
      let status = 'unknown';
      if (fs.existsSync(mp)) { const m = fs.readFileSync(mp, 'utf8').match(/status:\s*(\w+)/); if (m) status = m[1]; }
      return { name: e.name, status };
    });
}

function findFiles(dir, ext) {
  const r = [];
  if (!fs.existsSync(dir)) return r;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...findFiles(p, ext));
    else if (e.name.endsWith(ext)) r.push(p);
  }
  return r;
}

module.exports = { createChange, detectCompleted, getNextArtifacts, updateStatus, applyChange, verifyChange, archiveChange, listChanges };
