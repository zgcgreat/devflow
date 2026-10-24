---
name: phase-8-archive
preamble-tier: 2
version: 3.4.0
layer: L1-INTERACTION
phase: 8
requires: [g7.5-gate-decision, canary-report]
provides: [lessons-md, domain-skills-updated, archive-complete, g8-gate-decision]
description: |
  Knowledge archival engine — aggregates Wave SUMMARYs, promotes lessons learned
  to LESSONS.md, creates/updates domain skills from high-frequency patterns (≥3).
source: 交互层 Phase 8 + 引擎层 LearningWorkflow + 架构层 Memory Manager
dependencies:
  - wave-executor (input: per-wave SUMMARY.md files)
  - learning-workflow (post-archive: LESSONS update + domain skill graduation)
gate: G8
token_budget: ~80K tokens
triggers:
  - archive phase
  - knowledge consolidation
  - LESSONS nomination
  - domain skill promotion
  - G8 gate
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Phase 8: 知识归档 (Knowledge Archival)

> **前置**: G7.5 Canary 通过
> **后置产物**: `.devflow/<req-id>/08-archive.md`（归档报告：产物盘点/LESSONS 提名结果/domain-skills 晋升/TEMPORARY 清理/状态归档）；`.devflow/memory/LESSONS.md` 与 `.devflow/memory/domain-skills/` 是沉淀目标而非门控产物
> **门控**: G8 — Archive Quality Gate

## 核心定位

1. **LESSONS 提名** — 每个失败任务提名到 LESSONS.md，去重合并
2. **Domain Skills Promotion** — 同模式 ≥3 次 → 创建/更新 domain-skill 文件
3. **TEMPORARY 清理** — 清除会话临时笔记，保留跨会话价值信息
4. **STATE 归档** — 记录 total_waves, tasks_succeeded/failed, lessons_nominated

## 输入

- 所有 Phase 产物 (`.devflow/<req-id>/`)
- Wave SUMMARY.md 文件 — `.devflow/waves/wave-{N}/SUMMARY.md`
- Phase 6/7 审查及 Canary 报告
- `.devflow/state.json`（引擎状态文件，JSON）

## 输出

- `.devflow/<req-id>/08-archive.md` — 归档报告（主产物：产物盘点/LESSONS 提名结果/domain-skills 晋升/TEMPORARY 清理/状态归档）
- `.devflow/memory/LESSONS.md` — Lessons Learned 更新（沉淀目标）
- `.devflow/memory/domain-skills/*.md` — Domain Skills Promotion（沉淀目标）
- `.devflow/state.json` — 归档完成状态标记（引擎状态文件，JSON）

## 执行流程

详见 `docs/phases/phase-7-canary-archive.md` (Phase 8 归档部分)

**步骤**: Wave SUMMARY 聚合 → LESSONS 提名+去重 → Domain Skills Promotion → TEMPORARY 清理 → STATE 归档+G8 门控

## Error Taxonomy

| Level | Name | Recovery | Impact |
|-------|------|----------|--------|
| P0 | BLOCKING (LESSONS.md write fails) | Retry; output archive report to `.devflow/<req-id>/08-archive.md` | Knowledge not persisted |
| P1 | RECOVERABLE (Wave SUMMARY missing) | Skip missing wave, document skipped | Partial knowledge loss |
| P2 | WARNING (pattern 2-3 times, below ≥3 threshold) | Mark `[NEEDS MORE DATA]` | Graduation deferred |
| P3 | INFO (TEMPORARY.md empty) | Log info, no action | No impact |

## Boundary Conditions

| Parameter | Threshold |
|-----------|-----------|
| Wave SUMMARY scan | 100% of completed waves |
| LESSONS nominations | ≥1 per P1/P0 task failure |
| Domain skill graduation | ≥3 occurrences across waves/requirements |
| TEMPORARY pruning | Entries >7 days → archive to `.bak.md` |

## DevFlow 增强

**统一进化引擎**: Phase 8 归档时执行 LearningWorkflow 提取 LESSONS + evaluate-session 评估交叉验证，输出统一进化报告。

## 参考文件

- `layers/L2-ENGINE/learning-workflow/_SKILL.md`
- `layers/L2-ENGINE/wave-executor/_SKILL.md`
