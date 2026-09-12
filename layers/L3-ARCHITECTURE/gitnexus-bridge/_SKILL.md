---
name: gitnexus-bridge
layer: L3-ARCHITECTURE
category: code-intelligence
implementation: spec-only
version: 3.0.0
gate: internal
requires: []
provides: [ast-results, call-chains, impact-analysis, dependency-graph]
description: GitNexus 深度代码分析引擎桥接层，为 ForgeOS 提供知识图谱驱动的代码智能能力
dependencies:
  - gitnexus (>=1.6.0)
triggers:
  - code analysis needed
  - impact analysis requested
  - git-diff change detection
external-inputs: [code-analysis-request]
---

# GitNexus Bridge — 深度代码分析引擎

## 概述

将 ForgeOS 的代码智能需求桥接到 GitNexus，替代旧的 regex 分析器，获得以下升级：

| 能力 | 旧 (regex) | 新 (GitNexus) |
|------|-----------|---------------|
| 依赖图 | import/require 正则 | 44 node types, 21 edge types 知识图谱 |
| Blast Radius | 固定深度遍历 | 置信度评分(0-1) + 深度分组 |
| 变更影响 | 无 git 感知 | `detect_changes` 自动关联 git diff |
| 语义搜索 | 关键词匹配 | BM25 + vector + RRF 混合检索 |
| 社区检测 | 无 | Leiden algorithm 自动聚类 |
| 跨仓库 | 无 | Groups + contracts |

## MCP 工具映射

| ForgeOS 工具 | GitNexus 命令 | 说明 |
|---|---|---|
| `ForgeOS_analyze` | `gitnexus context` | 解析文件结构 |
| `ForgeOS_trace_chain` | `gitnexus context --direction` | 调用链追踪 |
| `ForgeOS_blast_radius` | `gitnexus impact` | 影响分析 + 置信度 |
| `ForgeOS_dep_graph` | `gitnexus query dependencies` | 依赖图 |
| `ForgeOS_find_references` | `gitnexus context --refs` | 引用查找 |
| `ForgeOS_detect_changes` | `gitnexus detect-changes` | **新增** git-diff → 受影响符号 |
| `ForgeOS_route_map` | `gitnexus query routes` | **新增** API 路由映射 |

## 降级策略

当 GitNexus 不可用时，降级为 AI 手动分析（正则/文本搜索）：
- 在审查报告中标注数据来源：`_source: gitnexus` 或 `_source: manual-analysis`
- `detect_changes` 和 `route_map` 无手动替代，需人工阅读 git diff
- 降级时 AI 应执行：`grep -rn` / `git diff --stat` / `git log --oneline` 替代

## Phase 集成

| Phase | 使用方式 |
|-------|---------|
| Phase 3 Task Plan | `ForgeOS_dep_graph` 拆分任务依赖 |
| Phase 4 Build | `ForgeOS_blast_radius` 评估修改安全性 |
| Phase 5 Test | `ForgeOS_detect_changes` 确定测试范围 |
| Phase 6 Review | `ForgeOS_trace_chain` + `ForgeOS_route_map` 跨文件审查 |

## 索引管理

- 首次使用：`cd <project> && gitnexus analyze`
- 索引位置：`<project>/.gitnexus/`
- 自动刷新：wave-executor 完成后触发 `gitnexus analyze .`
- 手动刷新：`gitnexus analyze . --force`

## Error Taxonomy (GitNexus Bridge 专属)

| 级别 | 错误 | 处理 |
|------|------|------|
| P0 | GitNexus 索引损坏 | `gitnexus analyze . --force` 重建 |
| P1 | GitNexus 版本过低 | 升级：`npm update -g gitnexus` |
| P2 | 项目未索引 | 自动触发 `gitnexus analyze` |
| P3 | GitNexus 不可用，fallback 到 regex | 静默降级，日志标记 |

## Boundary Conditions (GitNexus Bridge)

- 项目文件数 > 50,000 时，首次索引可能需要 > 5 分钟
- LadybugDB WAL 文件可能增长过大，需定期 `gitnexus analyze --compact`
- Node.js < 22 时无法运行 GitNexus，强制 fallback
