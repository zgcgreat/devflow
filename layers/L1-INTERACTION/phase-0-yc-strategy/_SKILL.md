---
name: phase-0-yc-strategy
version: 3.0.0
layer: L1-INTERACTION
phase: 0
description: Apply Y Combinator's due diligence framework to validate project viability before implementation
requires: []
provides: [g0-gate-decision, strategy-document, follow-up-queue]
dependencies:
  - phase-0-strategy
gate: G0
triggers:
  - YC strategy validation
  - six questions assessment
  - g0-gate
  - strategy phase
allowed-tools:
  - Read
  - Write
  - Bash
  - Edit
  - AskUserQuestion
  - WebSearch
  - WebFetch
token_budget: "~200K per execution agent"
external-inputs: [project-context]
---

# Phase 0 (子步骤 2/2): YC Six Questions — Strategic Assessment

> **⚠️ 定位说明**：本技能与 `phase-0-strategy` 同属**唯一的 Phase 0**，是串联的两个子步骤，
> 不是两个独立 Phase（`phase-engine.js` 中只有一个 Phase 0，name: `YC六问战略评估`）。
> 执行顺序：`phase-0-strategy`（创意捕获 / 种子 / 范围）→ 本技能（YC 六问可行性验证）。
>
> **前置**: `phase-0-strategy` 的种子与范围界定输出
> **后置产物**: `.devflow/<req-id>/00-strategy.md`
> **门控**: G0 — YC Assessment Gate（两个子步骤均完成后判定）

## 核心定位

1. **六问评估** — Pain Point / Competition / Advantage / Acquisition / Monetization / 2x Speed (5分制)
2. **G1 Gate 决策** — ≥4 question scores ≥3/5 则 PASS
3. **战略文档生成** — 输出 `00-strategy.md`

## 产物

- `.devflow/<req-id>/00-strategy.md` — YC 六问评估结果 (含评分、Gate 决策、弱点区域)
- `follow-up-queue` — Phase 1 跟进项

## 执行流程

详见 `docs/phases/phase-0-strategy.md`

> **G1 Gate**: ≥4 questions ≥3/5 → PASS; 弱点项 → Phase 1 follow-up

## Error Taxonomy

| Priority | Condition | Recovery |
|----------|-----------|----------|
| P0 | Q1<2 AND Q6 无明确瓶颈 | 返回 Phase 1: 探索相邻市场 |
| P1 | Q1≥3 but CAC>$300 or payback>24mo | 返回 Phase 1: 深度用户访谈 |
| P2 | ≥2 questions <3 with no evidence | 强制执行 Phase 1 |
| P3 | CONFIDENCE=LOW | 标记 UNSUBSTANTIATED，继续 |

## Boundary Conditions

| Parameter | Value |
|-----------|-------|
| YC questions | 6/6 mandatory, ≥4 substantive for G1 pass |
| Evidence coverage | ≥4 of 6 data-backed |
| Confidence | HIGH→skip Phase 1; MEDIUM→optional; LOW→require Phase 1 |
| Skip when | Internal tooling / Bug fix <1 week / Regulatory requirement |

## 产物模板

```markdown
# Phase 0: YC Six Questions — [Project Name]
## YC Six Questions
- Q1 Pain: {score}/5 — {answer}
- Q2 Competition: {score}/5 — {answer}
- Q3 Advantage: {score}/5 — {answer}
- Q4 Acquisition: {score}/5 — {answer}
- Q5 Monetization: {score}/5 — {answer}
- Q6 2x Speed: {score}/5 — {answer}
## G1 Gate Result
**Passing**: {count}/6 (threshold: ≥4) | **Result**: [PASS/FAIL]
**Weak Areas**: Q{N} → Phase 1 follow-up
```

## DevFlow 增强

**Persona**: planner (always) + market-researcher (on-demand for Q2/Q4)
**Hook**: phase-transition (L0), strategy-validation (L0+L1)
