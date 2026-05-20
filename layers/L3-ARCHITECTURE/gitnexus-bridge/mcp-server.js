/**
 * GitNexus MCP 工具代理
 *
 * 将 devflow 的代码智能工具映射到 GitNexus CLI 调用。
 * 当 GitNexus 不可用时，自动降级到旧的 regex 分析器。
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const { checkInstallation, checkIndex } = require('./gitnexus-check');

// 旧的 regex 分析器作为 fallback
let fallbackHandlers = null;
let fallbackDefs = null;
try {
  const ci = require('../code-intelligence/mcp-server');
  fallbackHandlers = ci.handlers;
  fallbackDefs = ci.TOOL_DEFS;
} catch { /* code-intelligence 可能不存在 */ }

// ─── GitNexus CLI 调用封装 ───

function gitnexusExec(command, args, projectDir) {
  const fullArgs = [command, ...args, '--json'];
  const result = execSync(`gitnexus ${fullArgs.join(' ')}`, {
    cwd: projectDir,
    encoding: 'utf8',
    timeout: 30000,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  try { return JSON.parse(result); } catch { return { raw: result }; }
}

// ─── 工具定义（与 devflow MCP server 接口对齐）───

const GITNEXUS_TOOLS = [
  { name: 'devflow_analyze', description: 'Parse a file and extract code structure (via GitNexus)', inputSchema: { type: 'object', properties: { file_path: { type: 'string' }, language: { type: 'string' } }, required: ['file_path'] } },
  { name: 'devflow_trace_chain', description: 'Trace call chain from a symbol (via GitNexus)', inputSchema: { type: 'object', properties: { file_path: { type: 'string' }, symbol_name: { type: 'string' }, direction: { type: 'string', enum: ['callers', 'callees', 'both'], default: 'both' } }, required: ['file_path', 'symbol_name'] } },
  { name: 'devflow_blast_radius', description: 'Analyze impact radius of changes with confidence scoring (via GitNexus)', inputSchema: { type: 'object', properties: { changed_files: { type: 'array', items: { type: 'string' } }, changed_symbols: { type: 'array', items: { type: 'string' } } }, required: ['changed_files'] } },
  { name: 'devflow_dep_graph', description: 'Build dependency graph (via GitNexus)', inputSchema: { type: 'object', properties: { scope: { type: 'string', enum: ['project', 'directory', 'file'], default: 'project' }, path: { type: 'string' }, format: { type: 'string', enum: ['dot', 'mermaid', 'json'], default: 'json' } }, required: [] } },
  { name: 'devflow_find_references', description: 'Find all references to a symbol (via GitNexus)', inputSchema: { type: 'object', properties: { file_path: { type: 'string' }, symbol_name: { type: 'string' } }, required: ['file_path', 'symbol_name'] } },
  { name: 'devflow_detect_changes', description: 'Map git diff to affected symbols and execution flows (GitNexus)', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' }, base: { type: 'string', description: 'Git base ref (e.g. main, HEAD~1)' } }, required: ['projectDir'] } },
  { name: 'devflow_route_map', description: 'API route to handler to consumer mapping (GitNexus)', inputSchema: { type: 'object', properties: { projectDir: { type: 'string' } }, required: ['projectDir'] } }
];

// ─── 工具处理器（GitNexus 优先，regex 降级）───

function withFallback(toolName, gitnexusFn, fallbackFn) {
  return (params) => {
    const status = checkInstallation();
    if (status.installed && status.meetsMinimum) {
      try {
        const result = gitnexusFn(params);
        return { ...result, _source: 'gitnexus', _version: status.version };
      } catch (e) {
        // GitNexus 调用失败，降级
        console.error(`[gitnexus-bridge] ${toolName} failed, falling back to regex: ${e.message}`);
        if (fallbackFn) {
          return { ...fallbackFn(params), _source: 'regex-fallback', _error: e.message };
        }
        return { error: e.message, _source: 'gitnexus-error' };
      }
    }
    // GitNexus 不可用，使用 fallback
    if (fallbackFn) {
      return { ...fallbackFn(params), _source: 'regex-fallback' };
    }
    return {
      error: 'GitNexus not installed and no regex fallback available',
      _source: 'unavailable',
      _installGuide: 'Run: npm install -g gitnexus'
    };
  };
}

const handlers = {
  devflow_analyze: withFallback('analyze',
    (p) => gitnexusExec('context', [p.file_path], path.dirname(p.file_path)),
    fallbackHandlers?.analyze_file
  ),

  devflow_trace_chain: withFallback('trace_chain',
    (p) => {
      const dir = path.dirname(p.file_path);
      return gitnexusExec('context', [`--direction=${p.direction || 'both'}`, p.symbol_name], dir);
    },
    fallbackHandlers?.trace_call_chain
  ),

  devflow_blast_radius: withFallback('blast_radius',
    (p) => gitnexusExec('impact', [...(p.changed_files || []), ...(p.changed_symbols || [])], process.cwd()),
    fallbackHandlers?.blast_radius
  ),

  devflow_dep_graph: withFallback('dep_graph',
    (p) => gitnexusExec('query', ['dependencies', `--scope=${p.scope || 'project'}`], p.path || process.cwd()),
    fallbackHandlers?.dependency_graph
  ),

  devflow_find_references: withFallback('find_references',
    (p) => gitnexusExec('context', ['--refs', p.symbol_name], path.dirname(p.file_path)),
    fallbackHandlers?.find_references
  ),

  // 新增工具 — 仅 GitNexus 支持，无 fallback
  devflow_detect_changes: withFallback('detect_changes',
    (p) => gitnexusExec('detect-changes', [p.base ? `--base=${p.base}` : ''], p.projectDir),
    null // 无 regex fallback
  ),

  devflow_route_map: withFallback('route_map',
    (p) => gitnexusExec('query', ['routes'], p.projectDir),
    null // 无 regex fallback
  )
};

// 兼容旧的 TOOL_DEFS / handlers 导出格式
const TOOL_DEFS = GITNEXUS_TOOLS;

module.exports = { TOOL_DEFS, handlers, GITNEXUS_TOOLS };
