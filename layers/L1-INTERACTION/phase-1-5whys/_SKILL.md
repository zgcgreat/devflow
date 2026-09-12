---
name: phase-1-5whys
version: 3.0.0
layer: L1-INTERACTION
phase: 1
description: Apply the "5 Whys" root cause analysis technique to uncover true user needs beneath surface-level requests
requires: [g0-gate-decision, strategy-document]
provides: [user-stories, acceptance-criteria, glossary, scope-boundaries, g1-gate-decision, analysis-md]
dependencies:
  - phase-0-strategy
gate: G1
triggers:
  - requirements clarification
  - root cause analysis
  - user stories
  - g1-gate
  - phase 1
allowed-tools:
  - Read
  - Write
  - Bash
  - Edit
  - AskUserQuestion
  - WebSearch
  - Skill
token_budget: "~200K per execution agent"
---

# Phase 1: 5 Whys Deep Dive — Requirements Clarification

> **前置产物**: Phase 0 通过 G0
> **后置产物**: `.devflow/<req-id>/01-analysis.md`
> **门控**: G1 — Requirements Quality Gate

## 核心定位

1. **根因分析** — 迭代追问找出真实问题，非表面需求解决方案
2. **用户故事与 AC 生成** — Given/When/Then 验收标准的可测试用户故事
3. **范围定义** — In Scope / Out of Scope，防止需求蔓延

## 产物

- `.devflow/<req-id>/01-analysis.md` — 5 Whys 链 + 用户故事 + AC + 术语表 + 范围边界 + G2 Gate
- **User Stories**: `US-{NNN}: [Role] can [Action] so that [Benefit]` (P0/P1/P2)
- **Acceptance Criteria**: `AC-{NNN}` with Given/When/Then
- **Glossary**: ≥3 术语定义
- **Scope Boundaries**: In Scope (✅) / Out of Scope (❌)

## 执行流程

详见 `docs/phases/phase-1-analysis.md`

> **交互协议**: G2 Gate 决策 → 根因充分性 → 是否进入 Phase 2

## Error Taxonomy

| Priority | Condition | Recovery |
|----------|-----------|----------|
| P0 | Root cause above requirements layer (infra issue) | Redirect to Phase 2, flag as infra refactor |
| P1 | 5 whys not converging (≥3 distinct root causes) | Split into parallel requirement branches |
| P2 | Ambiguous "why" answer (contains "or"/"maybe") | Ask follow-up before proceeding |
| P3 | Closed/defunct branch treated as open | Cross-reference CONTEXT.md, close early |

## Boundary Conditions

| Parameter | Value |
|-----------|-------|
| Whys depth limit | Max 5 layers |
| Convergence | Single root cause OR ≥2 parallel branches labeled |
| Stakeholder alignment | Agree on ≥4 of 5 whys answers |
| Skip when | Requirements already documented / Small enhancement <2 stories / Bug fix with clear steps |

## 产物模板

```markdown
# Phase 1: Requirements Analysis — [Project Name]
## 5 Whys Root Cause Analysis
**Starting Point**: "{original request}" | **Root Cause**: "{underlying problem}"
## User Stories
### US-NNN: [Role] can [Action] so that [Benefit]
**Priority**: P0/P1/P2 | **AC**: AC-N: Given/When/Then
## Glossary (≥3 terms) | Term | Definition | Example |
## Scope: In Scope ✅ / Out of Scope ❌
## G2 Gate: AC Testability / Scope Clarity / Glossary / Risk Balance / Phase 0 Consistency
```

## DevFlow 增强

**Persona**: planner (always) + architect (on-demand)
**Hook**: phase-transition (L0), context-monitor (L0+L1)
