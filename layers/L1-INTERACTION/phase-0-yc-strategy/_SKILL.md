---
name: phase-0-yc-strategy
version: 3.4.0
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

1. **六问评估** — 用户是谁 / 他们的核心问题 / 现有方案为什么不够好 / 我们的方案为什么更好 / 商业模式 / 为什么是现在 (5分制)
2. **G0 Gate 决策** — ≥4 question scores ≥3/5 则 PASS
3. **战略文档生成** — 输出 `00-strategy.md`

## 产物

- `.devflow/<req-id>/00-strategy.md` — YC 六问评估结果 (含评分、Gate 决策、弱点区域)
- `follow-up-queue` — Phase 1 跟进项

## 执行流程

详见 `docs/phases/phase-0-strategy.md`

> **G0 Gate**: ≥4 questions ≥3/5 → PASS; 弱点项 → Phase 1 follow-up

## Error Taxonomy

| Priority | Condition | Recovery |
|----------|-----------|----------|
| P0 | Q1<2 AND Q6 无明确瓶颈 | 重新界定问题域（目标用户/场景）后重跑六问；需求层追问移交 Phase 1 5Whys |
| P1 | Q1≥3 but CAC>$300 or payback>24mo | 战略层动作：补充获客/变现假设的用户访谈证据后重评；需求细节移交 Phase 1 |
| P2 | ≥2 questions <3 with no evidence | 六问 FAIL：补齐证据后重跑；弱点项写入 follow-up-queue 由 Phase 1 深挖 |
| P3 | CONFIDENCE=LOW | 标记 UNSUBSTANTIATED，继续 |

## Boundary Conditions

| Parameter | Value |
|-----------|-------|
| YC questions | 6/6 mandatory, ≥4 substantive for G0 pass |
| Evidence coverage | ≥4 of 6 data-backed |
| Confidence | HIGH→skip Phase 1; MEDIUM→optional; LOW→require Phase 1 |
| Skip when | Internal tooling / Bug fix <1 week / Regulatory requirement |

## 产物模板

> **完整权威模板见 `domains/specification/templates/00-strategy.md`**，以下为速览骨架，六问措辞以权威模板为准。

```markdown
# 战略评估：[一句话标题]

## YC 六问
| # | 问题 | 评分 | 回答 |
|---|------|------|------|
| 1 | 用户是谁？ | {score}/5 | {answer} |
| 2 | 他们的核心问题？ | {score}/5 | {answer} |
| 3 | 现有方案为什么不够好？ | {score}/5 | {answer} |
| 4 | 我们的方案为什么更好？ | {score}/5 | {answer} |
| 5 | 商业模式？ | {score}/5 | {answer} |
| 6 | 为什么是现在？ | {score}/5 | {answer} |

## 影响范围
- **涉及文件**: {files} | **涉及模块**: {modules}
- **影响人数**: {users/devs} | **风险等级**: {低/中/高}

## G0 Gate Result
**Passing**: {count}/6 (threshold: ≥4) | **Result**: [PASS/FAIL]
**Weak Areas**: Q{N} → Phase 1 follow-up

## 决策记录
- **CEO Office Hours 结论**: {如加载 expertise 域}
- **Party Mode 决策**: {如加载 Party Mode}
```

## DevFlow 增强

**Persona**: planner (always) + market-researcher (on-demand for Q2/Q4)
**Hook**: phase-transition (L0), strategy-validation (L0+L1)
