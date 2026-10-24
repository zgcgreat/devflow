---
name: phase-1b-discuss
preamble-tier: 2
version: 3.4.0
layer: L1-INTERACTION
phase: 1b
gate: G2.5
requires: [g1-gate-decision, strategy-document, analysis-md]
provides: [context-md, decision-coverage, g2.5-gate-decision]
description: |
  Decision capture engine — identifies implementation ambiguities from Phase 1,
  conducts interactive Q&A, generates 01b-context.md as constraints for Phase 2.
source: get-shit-done /gsd-discuss-phase
dependencies:
  - context-engineering
triggers:
  - discuss phase 1
  - capture decisions
  - clarify requirements
  - decision gate
  - G2.5
token_budget: "~200K per execution agent"
---

# Phase 1b: 决策捕获（Discuss）

> **前置产物**: `01-analysis.md` (Phase 1 通过 G2)
> **后置产物**: `.devflow/<req-id>/01b-context.md`
> **门控**: G2.5 — Discussion Gate

## 核心定位

1. **歧义检测** — 扫描 Phase 1 输出中的技术选型模糊点
2. **交互式问答** — 选项+利弊，用户做决定
3. **01b-context.md 生成** — 决策写入结构化上下文，作为 Phase 2 约束

## 产物

- `.devflow/<req-id>/01b-context.md` — 实现决策上下文 (API/Data/Error/UI/Auth/Security)
- 决策捕获报告 — 已确认/未决项表格

## 执行流程

详见 `docs/phases/phase-1-analysis.md` (Phase 1b 决策捕获章节)

> **4大原则**: 歧义检测优先 / 选项式问答 / 01b-context.md 是契约 / 70% Rule
> **交互协议**: 决策覆盖率 → 未决项合理性 → 是否进入 Phase 2

## G2.5 门控规则

> 下表为 G2.5 门控的**内部子检查项**（编号仅为 Phase 1b 内部清单），不是引擎级门控（引擎门控只有 G1-G12 全局编号）。

| 检查项 | Condition | Threshold |
|------|-----------|-----------|
| 检查项 1: Decision Coverage | ≥70% key decisions confirmed | PASS if met |
| 检查项 2: Unresolved Items | All marked [NEEDS CLARIFICATION] | Block Phase 2 otherwise |
| 检查项 3: 01b-context.md Integrity | File exists + valid format | Required for Phase 2 |
| 检查项 4: User Confirmation | Explicitly confirmed | Required |
| 检查项 5: PartyMode Integration | All decisions consumed | If fail → [NEEDS CLARIFICATION] |

## Error Taxonomy

| Level | Name | Recovery |
|-------|------|----------|
| P0 | BLOCKING (user disagrees critical decision) | Rollback decisions, re-run for area |
| P1 | RECOVERABLE ("whatever you think" ≥2 times) | Provide recommendation, mark [RECOMMENDED] |
| P2 | WARNING (low architectural impact) | Best practice default + [DEFAULT: ...] |
| P3 | INFO (non-standard response) | Re-phrase once; still ambiguous → P2 |

## Boundary Conditions

| Parameter | Limit |
|-----------|-------|
| Max decisions per session | 15 items |
| Max options per question | 3 (A/B/C) |
| Decision coverage threshold | ≥70% key decisions |
| Critical area coverage | 100% (API, data storage, auth) |

## 产物模板: 01b-context.md

> 完整模板见 `references/templates/01b-context.md`（决策捕获九段模板）。骨架如下：

```markdown
# Implementation Context (Phase 1b Decisions)
> Generated: {datetime} | Source: Phase 1b | Req-ID: <req-id>
## API Design — Style / Versioning / Auth / Error Format
## Data Storage — Client + Server (DB / Cache / File Storage)
## Error Handling — User-Facing / Network / Background retry
## UI Layout — Login / Dashboard / Grid
## Authentication — Method / Storage / Rotation
## Performance Targets — LCP / FCP / CLS / TTI
## Security Constraints — CORS / Rate Limiting / XSS
## Open Questions (NEEDS CLARIFICATION)
## Decision Rationale
```

## DevFlow 增强

**Persona**: planner (always) + architect (always)
**Hook**: phase-transition (L0), context-monitor (L0+L1)
