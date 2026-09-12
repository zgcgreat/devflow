---
name: phase-2-design
description: Phase 2 设计阶段 — 架构设计、技术选型、API 定义与设计文档输出
preamble-tier: 2
version: 3.0.0
layer: L1-INTERACTION
phase: 2
requires: [g2.5-gate-decision, context-md, analysis-md]
provides: [design-document, adr-records, g3-gate-decision, architecture-design]
source: 交互层 Phase 2 + 架构层 DAG Routing
dependencies:
  - writing-plans
gate: G3
triggers:
  - "设计方案"
  - "技术选型"
  - "架构设计"
  - "design phase"
token_budget: ~100K tokens
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
---

# Phase 2: 方案设计

> **前置产物**: `01-analysis.md` + `.devflow/CONTEXT.md`
> **后置产物**: `.devflow/<req-id>/02-design.md`
> **门控**: G3 — Design Quality Gate

## 输入

- `01-analysis.md` — 需求分析 + AC
- `.devflow/CONTEXT.md` — 项目上下文
- LESSONS.md — 过往架构决策经验

## 输出

- `02-design.md` — 技术栈选型 + 系统架构图 + API 定义 + 数据模型 + ADR 记录

## 执行流程

详见 `docs/phases/phase-2-design.md`

## Error Taxonomy

| Level | Name | Recovery | Impact |
|-------|------|----------|--------|
| P0 | BLOCKING (设计无法闭环所有 AC) | 回退 Step 1，补充需求澄清 | Blocks Phase 2a/3 |
| P1 | RECOVERABLE (方案风险不均衡 / ADR<3) | 补充分析维度 | No cross-wave |
| P2 | WARNING (Brownfield 标注不完整) | 追加 [TODO: Verify Compatibility] | Continue |
| P3 | INFO (简单任务跳过 Phase 2a) | 记录为 skip | No impact |

## Boundary Conditions

| Threshold | Value |
|-----------|-------|
| Simple Task Skip | ≤3 文件且 <50 行改动 → 跳过 Phase 2a |
| ADR Minimum | ≥3 个关键设计决策 |
| Design Phase Timeout | ≤15 min |

## DevFlow 增强

**Persona**: architect (always) + code-explorer (always) + database-reviewer/network-architect (on-demand)
**Cavecrew**: Investigator — 探索代码库依赖，输出压缩 60%
**Hook**: phase-transition (L0), context-monitor (L0+L1), prompt-guard (L0)
