---
name: phase-3-task-plan
description: Phase 3 任务规划 — ADR 映射、Task 拆分、DAG 依赖分析与 Wave 分组
preamble-tier: 2
version: 3.4.0
layer: L1-INTERACTION
phase: 3
requires: [g3-gate-decision, g3.5-gate-decision, design-document]
provides: [task-list, dag-dependencies, wave-plan, g4-gate-decision, dependency-annotations]
source: 交互层 Phase 3 (Task Plan & DAG)
dependencies:
  - writing-plans
gate: G4
triggers:
  - "拆分任务"
  - "任务规划"
  - "DAG"
  - "task planning"
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
---

# Phase 3: 任务拆分 (DAG + 拓扑排序)

> **前置产物**: `02-design.md` + `.devflow/memory/CONTEXT.md`
> **后置产物**: `.devflow/<req-id>/03-tasks.md`
> **门控**: G4 — Task Plan Gate

## 输入

- `02-design.md` — 技术方案设计文档
- `02a-ui-design.md` — UI 设计方案（如有）
- `.devflow/memory/CONTEXT.md` — 项目上下文
- LESSONS.md — 过往任务拆分经验

## 输出

- `03-tasks.md` — DAG + 任务列表 (Task-ID, Write/Read Files, Verify) + Wave 分组

## 执行流程

详见 `docs/phases/phase-3-tasks.md`

## 机器校验

任务清单建议同时保存 JSON 副本（`.devflow/<req-id>/03-tasks.json`，格式 `{"tasks":[{"id","name","deps"}]}`），用已有 CLI 自动校验：

```bash
devflow task --file .devflow/<req-id>/03-tasks.json
# 或直接调用库并输出 mermaid DAG 图
node lib/task-planner.js --file .devflow/<req-id>/03-tasks.json --visualize
```

- **依赖完整性**：引用不存在的任务 → 报错（对应 Error Taxonomy 的 UNRESOLVED_DEP）
- **环检测**：Kahn 拓扑排序无法收敛 → 报错（对应 CYCLE_DETECTED）
- **Wave 重算**：缺失或非法的 wave 字段会被拓扑排序自动纠正

## Error Taxonomy

| Level | Name | Recovery | Impact |
|-------|------|----------|--------|
| P0 | UNRESOLVED_DEP (dangling dependency) | Add missing task or remove dep | Blocks Phase 4 |
| P1 | CYCLE_DETECTED (Kahn finds no zero-in-degree) | Log cycle → return Phase 2 | Blocks all downstream |
| P2 | NON_ATOMIC_TASK (>10 files or >500 lines) | Split into sub-tasks | No cross-wave |
| P3 | WARN_VERIFY_ABSENT (missing verify command) | Auto-generate default, flag review | Continue |

## Boundary Conditions

| Threshold | Value |
|-----------|-------|
| Atomic Task Limit | ≤10 files, ≤500 line changes |
| Max DAG Depth | ≤ task count / 2 |
| Wave Parallelism Ratio | Independent tasks ≥60% (warn if <60%) |
| Task Plan Timeout | ≤10 min |

> **核验方式说明**：上表中 NON_ATOMIC_TASK、DAG 深度、Wave 并行度、WARN_VERIFY_ABSENT 四项**暂无机器实现**——执行主体：AI 人工核验，结果写入 `03-tasks.md` 自检记录，不要误以为是机器检查（机器仅覆盖"机器校验"小节列出的依赖完整性/环检测/Wave 重算）。

## DevFlow 增强

**Persona**: planner (always) + 技术栈Persona (on-demand)
**Hook**: phase-transition, context-monitor
