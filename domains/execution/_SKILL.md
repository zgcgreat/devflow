---
name: devflow:execution
version: 1.0.0
---

# 执行域

**核心**: `layers/L1-INTERACTION/` (Phase 0-8) + `GO.md` (Step 1-12)
**扩展**: `lib/task-planner.js` (DAG 任务分解)

## 加载顺序

| 能力 | 位置 |
|------|------|
| Phase 0-8 门控管线 | `layers/L1-INTERACTION/phase-0-strategy/` ~ `phase-8-archive/` |
| Step 1-12 执行流程 | `GO.md` |
| 模式判定 + 门规 | `references/mode-rules.md`, `references/gate-rules.md` |
| 入场检测 | `references/entry-check.md` |
| 子Agent 实施 | `skills/workflow/subagent-driven-development/`（DevFlow 内置子 Agent 实施技能） |
| DAG 任务分解 | `lib/task-planner.js` (`devflow task --describe`) |

## 门控速查

| Phase | 门控 | 产出 |
|-------|------|------|
| 0 | G0 | `00-strategy.md` |
| 1 | G1 | `01-analysis.md` |
| 2 | G3 | `02-design.md` |
| 2a | G3.5 | `02a-variants.md` |
| 3 | G4 | `03-tasks.md` |
| 4 | G5 | `04-wave-logs.md` |
| 5 | G6 | `05-test-report.md` |
| 6 | G7 | `06-review.md` |
