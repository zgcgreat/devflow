---
name: code-intelligence
version: 3.0.0
layer: L3-ARCHITECTURE
deprecated: true
replaced-by: gitnexus-bridge
description: >-
  [DEPRECATED] 此模块已被 gitnexus-bridge 替代。gitnexus-bridge 提供相同的代码理解能力，
  并增加了 tree-sitter + graphDB 自动降级机制。请使用 layers/L3-ARCHITECTURE/gitnexus-bridge/_SKILL.md。
  保留此文件仅供参考，不再维护。
source: GitNexus Tree-sitter + Knowledge Graph + MCP Server
dependencies:
  - dag-router
  - agent-isolation
triggers:
  - code analysis
  - impact analysis
  - blast radius
  - dependency graph
  - call chain
allowed-tools:
  - Read, Bash, WebSearch, WebFetch
---

# ⚠️ DEPRECATED — Code Intelligence — 代码理解引擎

> **此模块已被 `gitnexus-bridge` 替代。**
> - 替代模块: `layers/L3-ARCHITECTURE/gitnexus-bridge/_SKILL.md`
> - 迁移指南: gitnexus-bridge 提供相同的 MCP Server 接口 + withFallback 自动降级
> - 本文件仅保留供参考，不再维护

## 核心定位

将 GitNexus 的代码理解能力从 `optional/` 提升为 L3-ARCHITECTURE 标准模块，为 Phase 2 Design、Phase 4 Build、Phase 6 Review 提供代码上下文支撑。

## 能力矩阵

| 能力 | 说明 | 消费者 |
|------|------|--------|
| **AST 解析** | Tree-sitter 多语言解析 | Phase 2, Phase 4 |
| **调用链追踪** | 函数/方法调用关系图 | Phase 4, Phase 6 |
| **依赖图构建** | 模块/包依赖关系 | Phase 2, Phase 6 |
| **影响分析 (Blast Radius)** | 变更前自动评估影响范围 | Phase 2, Phase 6 |
| **代码导航** | 定义跳转、引用查找 | Phase 4 |
| **知识图谱** | 代码实体关系图 | Phase 2, Phase 8 |

## 支持的语言

| 语言 | Tree-sitter Grammar | AST 解析 | 调用链 | 依赖图 |
|------|---------------------|---------|--------|--------|
| TypeScript/TSX | tree-sitter-typescript | ✅ | ✅ | ✅ |
| JavaScript | tree-sitter-javascript | ✅ | ✅ | ✅ |
| Python | tree-sitter-python | ✅ | ✅ | ✅ |
| Go | tree-sitter-go | ✅ | ✅ | ✅ |
| Rust | tree-sitter-rust | ✅ | ⚠️ | ✅ |
| Java | tree-sitter-java | ✅ | ✅ | ✅ |
| C/C++ | tree-sitter-c/cpp | ✅ | ⚠️ | ⚠️ |

## MCP Server 接口

Code Intelligence 通过 MCP Server 暴露能力，供任何 MCP 客户端调用。

### 工具定义

```json
{
  "tools": [
    {
      "name": "analyze_file",
      "description": "Parse a file's AST and extract code structure (functions, classes, imports, exports)",
      "inputSchema": {
        "type": "object",
        "properties": {
          "file_path": { "type": "string", "description": "Absolute path to the file" },
          "language": { "type": "string", "description": "Programming language (auto-detected if omitted)" }
        },
        "required": ["file_path"]
      }
    },
    {
      "name": "trace_call_chain",
      "description": "Trace the call chain from a given function/method",
      "inputSchema": {
        "type": "object",
        "properties": {
          "file_path": { "type": "string" },
          "symbol_name": { "type": "string", "description": "Function or method name to trace" },
          "direction": { "type": "string", "enum": ["callers", "callees", "both"], "default": "both" },
          "depth": { "type": "number", "default": 3, "description": "Max trace depth" }
        },
        "required": ["file_path", "symbol_name"]
      }
    },
    {
      "name": "blast_radius",
      "description": "Analyze the impact radius of proposed changes to specific files or functions",
      "inputSchema": {
        "type": "object",
        "properties": {
          "changed_files": { 
            "type": "array", 
            "items": { "type": "string" },
            "description": "List of file paths that will be changed"
          },
          "changed_symbols": {
            "type": "array",
            "items": { "type": "string" },
            "description": "List of symbol names that will be changed"
          }
        },
        "required": ["changed_files"]
      }
    },
    {
      "name": "dependency_graph",
      "description": "Build a dependency graph for the project or a subset of files",
      "inputSchema": {
        "type": "object",
        "properties": {
          "scope": { "type": "string", "enum": ["project", "directory", "file"], "default": "project" },
          "path": { "type": "string", "description": "Path for directory/file scope" },
          "format": { "type": "string", "enum": ["dot", "mermaid", "json"], "default": "json" }
        },
        "required": []
      }
    },
    {
      "name": "find_references",
      "description": "Find all references to a symbol across the codebase",
      "inputSchema": {
        "type": "object",
        "properties": {
          "file_path": { "type": "string" },
          "symbol_name": { "type": "string" }
        },
        "required": ["file_path", "symbol_name"]
      }
    }
  ]
}
```

## Blast Radius 影响分析

### 分析流程

```
1. 输入: 变更文件列表 + 变更符号列表
2. 构建依赖图: 解析所有直接和间接依赖
3. 标记影响面: 
   - Direct: 直接引用变更符号的代码
   - Indirect: 间接依赖的代码
   - Test: 受影响的测试文件
4. 输出: 影响报告 + 风险评级
```

### 影响评级

| 级别 | 影响范围 | 建议操作 |
|------|---------|---------|
| 🔴 Critical | >10 文件 + 核心模块 | 必须完整测试 + 代码审查 |
| 🟡 High | 5-10 文件 + 多模块 | 需要集成测试 |
| 🔵 Medium | 2-5 文件 + 单模块 | 需要单元测试 |
| 🟢 Low | 1-2 文件 + 无外部依赖 | 快速验证即可 |

### 输出格式

```yaml
blast_radius:
  changed_files: [src/theme/colors.ts, src/components/Header.tsx]
  changed_symbols: [ThemeColors, Header.props]
  impact:
    direct:
      - file: src/components/Sidebar.tsx
        reason: "Imports ThemeColors"
        risk: medium
      - file: src/App.tsx
        reason: "Renders Header component"
        risk: low
    indirect:
      - file: src/pages/Dashboard.tsx
        reason: "Uses Sidebar which depends on ThemeColors"
        risk: low
    test:
      - file: tests/theme/colors.test.ts
        reason: "Tests ThemeColors"
        risk: high
      - file: tests/components/Header.test.tsx
        reason: "Tests Header component"
        risk: high
  overall_risk: medium
  recommended_tests: [integration, unit]
  recommended_reviewers: [frontend-lead, theme-owner]
```

## Phase 集成点

### Phase 2 Design — 变更前影响分析

在开始设计前，自动调用 `blast_radius` 评估变更范围，帮助确定三档模式：

```
blast_radius.risk = critical → Strict 模式
blast_radius.risk = medium   → Standard 模式
blast_radius.risk = low      → Fast 模式
```

### Phase 4 Build — 代码上下文获取

在实现每个 task 时，自动调用 `trace_call_chain` 和 `find_references` 获取代码上下文，减少 agent 的盲目搜索。

### Phase 6 Review — 影响面验证

在代码审查时，自动调用 `blast_radius` 验证变更影响面是否与预期一致，检测遗漏的修改点。

### Phase 8 Archive — 知识图谱更新

归档时，将代码变更信息更新到知识图谱，为后续项目提供参考。

## 降级策略

当 Tree-sitter 不可用或解析失败时：

1. **降级到 grep 模式**: 使用正则表达式搜索引用和依赖
2. **降级到文件模式**: 基于文件路径推测依赖关系
3. **标记为低置信度**: 在输出中标注置信度级别

## 与 GitNexus 的关系

- Code Intelligence 是 GitNexus 核心能力的 devflow 集成版本
- GitNexus 作为可选的增强后端（当检测到 GitNexus 已安装时优先使用）
- 无 GitNexus 时使用内置 Tree-sitter 解析器