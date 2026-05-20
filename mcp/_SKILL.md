---
name: mcp-protocol
version: 3.0-draft
layer: L3-ARCHITECTURE
description: MCP (Model Context Protocol) integration layer exposing devflow-evo capabilities as MCP tools for any MCP-compatible runtime
source: GitNexus MCP Server + GSD Sync Bridge
dependencies:
  - code-intelligence
  - dag-router
triggers:
  - mcp tool call
  - mcp server startup
  - runtime registration
---

# MCP Protocol — 模型上下文协议集成层

## 核心定位

将 devflow-evo 的核心能力通过 MCP 协议暴露，使任何 MCP 兼容运行时（Claude Code、Cursor、Copilot 等）无需本地配置即可调用 devflow-evo 功能。

## 架构

```
MCP Client (Runtime)
    │
    ▼ MCP Protocol (stdio/SSE)
┌───────────────────────────┐
│     devflow-evo MCP Server    │
├───────────────────────────┤
│  Tool Registry            │  ← 统一注册所有 devflow-evo 工具
│  ├─ Phase Tools           │  ← 阶段路由/门禁/推进
│  ├─ Memory Tools          │  ← 记忆读写/压缩
│  ├─ Change Tools          │  ← 变更生命周期
│  └─ Code Intel Tools      │  ← 代码理解/影响分析
├───────────────────────────┤
│  Resource Providers       │  ← MCP Resources
│  ├─ STATE.md              │  ← 项目状态
│  ├─ memory/*              │  ← 记忆文件
│  └─ changes/*             │  ← 变更文件
├───────────────────────────┤
│  Prompt Templates         │  ← MCP Prompts
│  ├─ phase-advance         │  ← 阶段推进提示
│  ├─ gate-check            │  ← 门禁检查提示
│  └─ change-verify         │  ← 变更验证提示
└───────────────────────────┘
```

## 工具注册表

### Phase Tools

| 工具名 | 说明 | 参数 |
|--------|------|------|
| `devflow_status` | 获取当前项目状态 | `{ projectDir }` |
| `devflow_advance` | 推进到下一阶段 | `{ projectDir, targetPhase, confirmation }` |
| `devflow_gate_check` | 检查门禁条件 | `{ projectDir, targetPhase }` |
| `devflow_set_mode` | 设置工作模式 | `{ projectDir, mode: 'strict'|'standard'|'fast' }` |

### Memory Tools

| 工具名 | 说明 | 参数 |
|--------|------|------|
| `devflow_load_memory` | 加载记忆文件 | `{ projectDir, keys?, compress? }` |
| `devflow_save_decision` | 保存决策记录 | `{ projectDir, decision, context }` |
| `devflow_save_lesson` | 保存经验教训 | `{ projectDir, lesson, category }` |
| `devflow_compress` | 压缩记忆文件 | `{ projectDir, level }` |

### Change Tools

| 工具名 | 说明 | 参数 |
|--------|------|------|
| `devflow_change_create` | 创建变更 | `{ projectDir, name, goal }` |
| `devflow_change_apply` | 应用变更 | `{ projectDir, changeName, mainSpecPath }` |
| `devflow_change_verify` | 验证变更 | `{ projectDir, changeName }` |
| `devflow_change_archive` | 归档变更 | `{ projectDir, changeName }` |
| `devflow_change_list` | 列出变更 | `{ projectDir }` |

### Code Intel Tools (代理到 code-intelligence)

| 工具名 | 说明 | 参数 |
|--------|------|------|
| `devflow_analyze` | 分析文件结构 | `{ filePath, language? }` |
| `devflow_blast_radius` | 影响分析 | `{ changedFiles, changedSymbols? }` |
| `devflow_trace_calls` | 调用链追踪 | `{ filePath, symbolName, direction? }` |
| `devflow_dep_graph` | 依赖图 | `{ scope, path?, format? }` |
| `devflow_find_refs` | 查找引用 | `{ filePath, symbolName }` |

## Resource Providers

MCP Resources 允许客户端订阅文件变更：

| URI | 说明 | 更新触发 |
|-----|------|---------|
| `devflow-evo://state` | 项目状态 | Phase 变更时 |
| `devflow-evo://memory/{key}` | 记忆文件 | 写入时 |
| `devflow-evo://changes` | 活跃变更列表 | 变更创建/归档时 |
| `devflow-evo://changes/{name}/status` | 变更状态 | 状态变更时 |

## Prompt Templates

### phase-advance
```
You are advancing from Phase {currentPhase} to Phase {targetPhase}.
Gate check result: {gateResult}
Memory context: {memorySummary}
Please confirm the advance and update STATE.md accordingly.
```

### gate-check
```
Check gate requirements for Phase {targetPhase}:
- Required artifacts: {requiredArtifacts}
- Current status: {currentState}
- Missing: {missingItems}
```

### change-verify
```
Verify change "{changeName}" across three dimensions:
1. Completeness: All tasks completed? All requirements covered?
2. Correctness: Implementation matches spec intent?
3. Coherence: Design decisions reflected in code?
```

## 安装配置

### Claude Code

```json
// .claude/mcp.json
{
  "mcpServers": {
    "devflow-evo": {
      "command": "node",
      "args": ["path/to/devflow-evo/mcp/server.js"],
      "env": {
        "DEVFLOW_EVO_HOME": "path/to/devflow-evo"
      }
    }
  }
}
```

### Cursor

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "devflow-evo": {
      "command": "node",
      "args": ["path/to/devflow-evo/mcp/server.js"]
    }
  }
}
```

### 通用 stdio 模式

```bash
node path/to/devflow-evo/mcp/server.js --stdio
```

## 降级策略

当 MCP 不可用时：
1. 降级到 adapters/ 本地配置模式
2. 降级到直接文件读写模式
3. 在输出中标注降级状态
