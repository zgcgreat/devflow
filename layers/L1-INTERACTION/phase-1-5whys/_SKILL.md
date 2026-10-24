---
name: phase-1-5whys
version: 3.4.0
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
>
> **G1/G2 分工**: G1 = 5 Whys 分析完成（自动门控，满足条件即过）；G2 = 需求范围用户确认（人工门控，AskUserQuestion 交互确认后关闭）

## 核心定位

1. **根因分析** — 迭代追问找出真实问题，非表面需求解决方案
2. **用户故事与 AC 生成** — Given/When/Then 验收标准的可测试用户故事
3. **范围定义** — In Scope / Out of Scope，防止需求蔓延

## 产物

- `.devflow/<req-id>/01-analysis.md` — 6 必填段：用户故事 / 验收准则（AC）/ 范围切分 / 非功能性需求 / 依赖与假设 / 需求完整性检查（另含 5 Whys 链与术语表）
- **User Stories**: `US-{NNN}: [Role] can [Action] so that [Benefit]` (P0/P1/P2)
- **Acceptance Criteria**: `### AC-{NNN} · <短标题>` 独立标题段 + Given/When/Then 列表（G6 覆盖率按 `### AC-N` 标题行解析，AC 必须写成独立段落，不可行内内联）
- **Glossary**: ≥3 术语定义
- **Scope Boundaries**: 范围切分 v1（本次必做）/ v2（下一轮）/ out（永远不做）

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

> **完整模板与 6 必填段（用户故事/验收准则（AC）/范围切分/非功能性需求/依赖与假设/需求完整性检查）见 `references/templates/01-analysis.md`**，以下为速览骨架。注意：AC 必须是 `### AC-N · 短标题` 独立标题段（`lib/ac-coverage.js` 据此解析 G6 覆盖率），禁止写成行内 `**AC**: AC-N: ...`。

```markdown
# Phase 1: Requirements Analysis — [Project Name]
## 5 Whys Root Cause Analysis
**Starting Point**: "{original request}" | **Root Cause**: "{underlying problem}"
## 用户故事
### US-NNN: [Role] can [Action] so that [Benefit]
**Priority**: P0/P1/P2
## 验收准则（AC）
### AC-1 · <短标题>
- **Given** <初始状态>
- **When** <用户动作>
- **Then** <可观察结果>
- **验证方式**: `<命令或手动 UAT 编号>`
## 范围切分
### v1（本次必做）/ v2（下一轮考虑）/ out（永远不做）
## 非功能性需求
- 性能 / 可访问性 / 安全 / 兼容性 / 可观测性（如无写"无"）
## 依赖与假设
- 依赖的外部服务、库、内部模块；已假设的前提条件
## 术语表 (≥3 terms)
| Term | Definition | Example |
## 需求完整性检查（SDD 强制）
- [ ] 无 [NEEDS CLARIFICATION] 残留 / 可测试 / 范围边界清晰 ...
## G2 Gate: AC Testability / Scope Clarity / Glossary / Risk Balance / Phase 0 Consistency
```

## DevFlow 增强

**Persona**: planner (always) + architect (on-demand)
**Hook**: phase-transition (L0), context-monitor (L0+L1)
