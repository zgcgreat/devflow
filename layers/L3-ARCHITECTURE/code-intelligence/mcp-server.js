#!/usr/bin/env node
/**
 * Code Intelligence MCP Server
 * 通过 MCP 协议暴露代码理解能力
 */

const { extractStructure, findCallers, findCallees, findReferences, detectLang, findProjectRoot, findSourceFiles } = require('./code-analyzer');
const { buildDependencyGraph, computeBlastRadius } = require('./blast-radius');
const fs = require('fs');
const path = require('path');

// ============================================================
// Tool Registry
// ============================================================

const TOOL_DEFS = [
  {
    name: 'analyze_file',
    description: 'Parse a file and extract code structure (functions, classes, imports, exports)',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Absolute path to the file' },
        language: { type: 'string', description: 'Programming language (auto-detected if omitted)' }
      },
      required: ['file_path']
    }
  },
  {
    name: 'trace_call_chain',
    description: 'Trace the call chain from a given function/method',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        symbol_name: { type: 'string', description: 'Function or method name to trace' },
        direction: { type: 'string', enum: ['callers','callees','both'], default: 'both' },
        depth: { type: 'number', default: 3 }
      },
      required: ['file_path', 'symbol_name']
    }
  },
  {
    name: 'blast_radius',
    description: 'Analyze the impact radius of proposed changes',
    inputSchema: {
      type: 'object',
      properties: {
        changed_files: { type: 'array', items: { type: 'string' }, description: 'List of file paths that will be changed' },
        changed_symbols: { type: 'array', items: { type: 'string' }, description: 'List of symbol names that will be changed' }
      },
      required: ['changed_files']
    }
  },
  {
    name: 'dependency_graph',
    description: 'Build a dependency graph for the project or a subset of files',
    inputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'string', enum: ['project','directory','file'], default: 'project' },
        path: { type: 'string', description: 'Path for directory/file scope' },
        format: { type: 'string', enum: ['dot','mermaid','json'], default: 'json' }
      },
      required: []
    }
  },
  {
    name: 'find_references',
    description: 'Find all references to a symbol across the codebase',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        symbol_name: { type: 'string' }
      },
      required: ['file_path', 'symbol_name']
    }
  }
];

// ============================================================
// Tool Handlers
// ============================================================

const handlers = {
  analyze_file: (params) => {
    const { file_path, language } = params;
    if (!fs.existsSync(file_path)) return { error: 'File not found: ' + file_path };
    const content = fs.readFileSync(file_path, 'utf8');
    const lang = language || detectLang(file_path);
    return { file: file_path, language: lang, size: content.length, lines: content.split('\n').length, structure: extractStructure(content, lang) };
  },

  trace_call_chain: (params) => {
    const { file_path, symbol_name, direction = 'both' } = params;
    const projectDir = findProjectRoot(file_path);
    const callers = direction !== 'callees' ? findCallers(projectDir, symbol_name) : [];
    const callees = direction !== 'callers' ? findCallees(file_path, symbol_name) : [];
    return { symbol: symbol_name, source_file: file_path, callers, callees, confidence: 'grep-based' };
  },

  blast_radius: (params) => {
    const { changed_files, changed_symbols = [] } = params;
    const projectDir = findProjectRoot(changed_files[0] || process.cwd());
    const graph = buildDependencyGraph(projectDir);
    return computeBlastRadius(graph, changed_files, changed_symbols);
  },

  dependency_graph: (params) => {
    const { scope = 'project', path: scopePath, format = 'json' } = params;
    const projectDir = scopePath || process.cwd();
    const graph = buildDependencyGraph(projectDir, { scope, path: projectDir });
    if (format === 'mermaid') return graphToMermaid(graph);
    if (format === 'dot') return graphToDot(graph);
    return graph;
  },

  find_references: (params) => {
    const { file_path, symbol_name } = params;
    const projectDir = findProjectRoot(file_path);
    return findReferences(projectDir, symbol_name);
  }
};

// ============================================================
// Graph Formatters
// ============================================================

function graphToMermaid(graph) {
  let out = 'graph TD\n';
  for (const [node] of Object.entries(graph.nodes)) {
    const id = node.replace(/[^a-zA-Z0-9]/g, '_');
    out += '  ' + id + '["' + node + '"]\n';
  }
  for (const edge of graph.edges) {
    const from = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
    const to = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
    out += '  ' + from + ' --> ' + to + '\n';
  }
  return out;
}

function graphToDot(graph) {
  let out = 'digraph dependencies {\n  rankdir=LR;\n';
  for (const edge of graph.edges) {
    out += '  "' + edge.from + '" -> "' + edge.to + '";\n';
  }
  out += '}\n';
  return out;
}

// ============================================================
// CLI Entry
// ============================================================

if (require.main === module) {
  const [,, toolName, ...args] = process.argv;

  if (toolName === 'list-tools') {
    console.log(JSON.stringify(TOOL_DEFS, null, 2));
    return;
  }

  if (toolName === 'call') {
    const tool = args[0];
    const params = JSON.parse(args[1] || '{}');
    const handler = handlers[tool];
    if (!handler) { console.error('Unknown tool:', tool); process.exit(1); }
    console.log(JSON.stringify(handler(params), null, 2));
    return;
  }

  console.error('Usage: mcp-server.js list-tools | call <tool> <json-params>');
  process.exit(1);
}

module.exports = { TOOL_DEFS, handlers };
