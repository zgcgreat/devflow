#!/usr/bin/env node
/**
 * Devflow MCP Server — stdio transport
 * 
 * 暴露 devflow 核心能力为 MCP 工具
 * 用法: node server.js --stdio
 */

const readline = require('readline');
const { GITNEXUS_TOOLS: ciTools, handlers: ciHandlers } = require('../layers/L3-ARCHITECTURE/gitnexus-bridge/mcp-server');
const { readState, checkGate, loadMemory, detectRuntime } = require('../adapters/shared/core-bridge');
const { loadCompressed } = require('../adapters/shared/memory-loader');
const { createChange, applyChange, verifyChange, archiveChange, listChanges } = require('../layers/L2-ENGINE/change-manager/change-lifecycle');

// ============================================================
// Devflow Tool Definitions
// ============================================================

const { compress: compressMemory } = require('../layers/L2-ENGINE/token-compression-v2/compressor');

const devflowTools = [
  { name: 'devflow_status', description: 'Get current project state', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' } }, required: ['projectDir'] } },
  { name: 'devflow_advance', description: 'Advance to next phase', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, targetPhase: { type: 'string' }, confirmation: { type: 'boolean' } }, required: ['projectDir', 'targetPhase'] } },
  { name: 'devflow_gate_check', description: 'Check gate requirements', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, targetPhase: { type: 'string' } }, required: ['projectDir', 'targetPhase'] } },
  { name: 'devflow_set_mode', description: 'Set workflow mode', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, mode: { type: 'string', enum: ['strict','standard','fast'] } }, required: ['projectDir', 'mode'] } },
  { name: 'devflow_load_memory', description: 'Load memory files', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, keys: { type: 'array', items: { type: 'string' } }, compress: { type: 'boolean' } }, required: ['projectDir'] } },
  { name: 'devflow_compress', description: 'Compress memory files', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, level: { type: 'string', enum: ['lite','ultra','extreme'] } }, required: ['projectDir', 'level'] } },
  { name: 'devflow_save_decision', description: 'Save a decision record', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, decision: { type: 'string' }, context: { type: 'string' } }, required: ['projectDir', 'decision'] } },
  { name: 'devflow_save_lesson', description: 'Save a lesson learned', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, lesson: { type: 'string' }, category: { type: 'string' } }, required: ['projectDir', 'lesson'] } },
  { name: 'devflow_change_create', description: 'Create a new change', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, name: { type: 'string' }, goal: { type: 'string' } }, required: ['projectDir', 'name', 'goal'] } },
  { name: 'devflow_change_list', description: 'List active changes', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' } }, required: ['projectDir'] } },
  { name: 'devflow_change_verify', description: 'Verify a change', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, changeName: { type: 'string' } }, required: ['projectDir', 'changeName'] } },
  { name: 'devflow_change_apply', description: 'Apply a change', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, changeName: { type: 'string' }, mainSpecPath: { type: 'string' } }, required: ['projectDir', 'changeName', 'mainSpecPath'] } },
  { name: 'devflow_change_archive', description: 'Archive a change', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, changeName: { type: 'string' } }, required: ['projectDir', 'changeName'] } },
  ...ciTools
];

// ============================================================
// Handler Mapping
// ============================================================

const devflowHandlers = {
  devflow_status: (p) => readState(p.projectDir),
  devflow_advance: (p) => {
    const gate = checkGate(p.projectDir, p.targetPhase);
    if (!gate.passed && !p.confirmation) return { advanced: false, gate, message: 'Gate not passed. Set confirmation=true to override.' };
    return { advanced: true, targetPhase: p.targetPhase, gate };
  },
  devflow_gate_check: (p) => checkGate(p.projectDir, p.targetPhase),
  devflow_set_mode: (p) => ({ mode: p.mode, note: 'Mode set. Update .devflow/config.yaml to persist.' }),
  devflow_load_memory: (p) => p.compress ? loadCompressed(p.projectDir) : loadMemory(p.projectDir),
  devflow_compress: (p) => compressMemory(p.projectDir, p.level),
  devflow_save_decision: (p) => {
    const fs = require('fs'); const path = require('path');
    const decisionsPath = path.join(p.projectDir, '.devflow/memory/DECISIONS.md');
    const entry = '\n## Decision: ' + p.decision + '\n' + (p.context ? 'Context: ' + p.context + '\n' : '') + 'Date: ' + new Date().toISOString().split('T')[0] + '\n';
    if (fs.existsSync(decisionsPath)) fs.appendFileSync(decisionsPath, entry);
    else fs.mkdirSync(path.dirname(decisionsPath), { recursive: true }), fs.writeFileSync(decisionsPath, '# Decisions\n' + entry);
    return { saved: true, decision: p.decision };
  },
  devflow_save_lesson: (p) => {
    const fs = require('fs'); const path = require('path');
    const lessonsPath = path.join(p.projectDir, '.devflow/memory/LESSONS.md');
    const cat = p.category || 'general';
    const entry = '\n## [' + cat + '] ' + p.lesson + '\nDate: ' + new Date().toISOString().split('T')[0] + '\n';
    if (fs.existsSync(lessonsPath)) fs.appendFileSync(lessonsPath, entry);
    else fs.mkdirSync(path.dirname(lessonsPath), { recursive: true }), fs.writeFileSync(lessonsPath, '# Lessons\n' + entry);
    return { saved: true, lesson: p.lesson };
  },
  devflow_change_create: (p) => { const dir = createChange(p.projectDir, p.name, p.goal); return { created: true, path: dir }; },
  devflow_change_list: (p) => ({ changes: listChanges(p.projectDir) }),
  devflow_change_verify: (p) => verifyChange(require('path').join(p.projectDir, '.devflow/changes', p.changeName)),
  devflow_change_apply: (p) => applyChange(require('path').join(p.projectDir, '.devflow/changes', p.changeName), p.mainSpecPath),
  devflow_change_archive: (p) => { const dir = archiveChange(p.projectDir, p.changeName); return { archived: true, path: dir }; },
  devflow_analyze: ciHandlers.devflow_analyze,
  devflow_trace_chain: ciHandlers.devflow_trace_chain,
  devflow_blast_radius: ciHandlers.devflow_blast_radius,
  devflow_dep_graph: ciHandlers.devflow_dep_graph,
  devflow_find_references: ciHandlers.devflow_find_references,
  devflow_detect_changes: ciHandlers.devflow_detect_changes,
  devflow_route_map: ciHandlers.devflow_route_map
};

// ============================================================
// MCP Protocol (simplified stdio)
// ============================================================

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(msg + '\n');
}

function sendError(id, code, message) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
  process.stdout.write(msg + '\n');
}

async function handleMessage(msg) {
  const { id, method, params } = msg;

  // Validate id for request-response (notifications have no id)
  if (id === undefined || id === null) {
    if (method && !method.startsWith('notifications/')) {
      sendError(null, -32600, 'Invalid Request: missing id');
    }
    return;
  }

  if (method === 'initialize') {
    sendResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: { listChanged: false }, resources: {} },
      serverInfo: { name: 'devflow-mcp', version: '3.0.0' }
    });
    return;
  }

  if (method === 'tools/list') {
    sendResponse(id, { tools: devflowTools });
    return;
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const toolParams = params?.arguments || {};
    const handler = devflowHandlers[toolName];
    if (!handler) { sendError(id, -32601, 'Tool not found: ' + toolName); return; }
    try {
      const result = await handler(toolParams);
      sendResponse(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
    } catch (e) {
      sendError(id, -32000, e.message);
    }
    return;
  }

  if (method === 'notifications/initialized') return;
  sendError(id, -32601, 'Method not found: ' + method);
}

// ============================================================
// Main Loop
// ============================================================

if (require.main === module) {
  const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB buffer limit
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  let buffer = '';
  rl.on('line', (line) => {
    buffer += line;
    if (buffer.length > MAX_BUFFER_SIZE) {
      sendError(null, -32700, 'Message too large (exceeded 10MB)');
      buffer = '';
      return;
    }
    try {
      const msg = JSON.parse(buffer);
      buffer = '';
      handleMessage(msg);
    } catch (e) { buffer += '\n'; }
  });
}

module.exports = { devflowTools, devflowHandlers };
