#!/usr/bin/env node
/**
 * Devflow MCP Server — stdio transport
 * 
 * 暴露 devflow 核心能力为 MCP 工具
 * 用法: node server.js --stdio
 */

const readline = require('readline');
const { TOOL_DEFS: ciTools, handlers: ciHandlers } = require('../layers/L3-ARCHITECTURE/code-intelligence/mcp-server');
const { readState, checkGate, loadMemory, detectRuntime } = require('../adapters/shared/core-bridge');
const { loadCompressed } = require('../adapters/shared/memory-loader');
const { createChange, applyChange, verifyChange, archiveChange, listChanges } = require('../layers/L2-ENGINE/change-manager/change-lifecycle');

// ============================================================
// Devflow Tool Definitions
// ============================================================

const devflowTools = [
  { name: 'devflow_status', description: 'Get current project state', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' } }, required: ['projectDir'] } },
  { name: 'devflow_advance', description: 'Advance to next phase', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, targetPhase: { type: 'string' }, confirmation: { type: 'boolean' } }, required: ['projectDir', 'targetPhase'] } },
  { name: 'devflow_gate_check', description: 'Check gate requirements', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, targetPhase: { type: 'string' } }, required: ['projectDir', 'targetPhase'] } },
  { name: 'devflow_load_memory', description: 'Load memory files', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, keys: { type: 'array', items: { type: 'string' } }, compress: { type: 'boolean' } }, required: ['projectDir'] } },
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
  devflow_load_memory: (p) => p.compress ? loadCompressed(p.projectDir) : loadMemory(p.projectDir),
  devflow_change_create: (p) => { const dir = createChange(p.projectDir, p.name, p.goal); return { created: true, path: dir }; },
  devflow_change_list: (p) => ({ changes: listChanges(p.projectDir) }),
  devflow_change_verify: (p) => verifyChange(require('path').join(p.projectDir, '.devflow/changes', p.changeName)),
  devflow_change_apply: (p) => applyChange(require('path').join(p.projectDir, '.devflow/changes', p.changeName), p.mainSpecPath),
  devflow_change_archive: (p) => { const dir = archiveChange(p.projectDir, p.changeName); return { archived: true, path: dir }; },
  analyze_file: ciHandlers.analyze_file,
  trace_call_chain: ciHandlers.trace_call_chain,
  blast_radius: ciHandlers.blast_radius,
  dependency_graph: ciHandlers.dependency_graph,
  find_references: ciHandlers.find_references
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
      const result = handler(toolParams);
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
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  let buffer = '';
  rl.on('line', (line) => {
    buffer += line;
    try {
      const msg = JSON.parse(buffer);
      buffer = '';
      handleMessage(msg);
    } catch (e) { buffer += '\n'; }
  });
}

module.exports = { devflowTools, devflowHandlers };
