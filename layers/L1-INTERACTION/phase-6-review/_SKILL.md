---
name: phase-6-review
preamble-tier: 2
version: 3.4.0
description: |
  Two-stage adversarial review: Stage A (spec compliance) + Stage B (code quality).
  Detects PRD gaps, edge cases, acceptance failures, and blind spots.
layer: L1-INTERACTION
phase: 6
requires: [g6-gate-decision, test-report, coverage-metrics]
provides: [review-report, fix-recommendations, g7-gate-decision, review-context]
source: 交互层 Three-Layer Adversarial Review + Two-Stage Spec Compliance
dependencies:
  - code-review-and-quality
  - spec-driven-development
gate: G7
triggers:
  - review phase
  - two-stage review
  - spec compliance check
  - adversarial review
allowed-tools:
  - Read
  - Bash
  - Edit
---

# Phase 6: 双阶段审查 (Two-Stage Adversarial Review)

> **前置**: Phase 5 测试通过, Phase 4 Wave 执行完成
> **后置产物**: `.devflow/<req-id>/06-review.md`
> **门控**: G7 — Review Quality Gate

## 核心定位

双阶段分离审查：Spec compliance (Stage A) 和 code quality (Stage B) 是正交 concern，分开审查避免优先级混乱和 context 污染。

## 输入

- Phase 4 实施代码
- Phase 5 测试报告 (`05-test-report.md`)
- Phase 3 任务计划 (`03-tasks.md`)
- PRD/需求文档

## 输出

- `06-review.md` — 双阶段审查报告 + G7 门控结果

## 执行流程

详见 `docs/phases/phase-6-review.md`

**架构概览**:
```
Phase 6: 双阶段审查
    ├─→ Stage A: Spec Compliance (Acceptance Auditor)
    │   └─ Gate: NOT_PASS → 不进 Stage B；实现类缺陷退回对应 Wave 修复（Phase 4 重入），任务拆分结构性问题才退回 Phase 3 重拆
    └─→ Stage B: Code Review (Blind Hunter + Edge Case Hunter 并行)
        └─ Gate: G7 → PASS/FAIL
```

> **退回原则（统一口径）**：实现类缺陷退回对应 Wave 修复（Phase 4 重入）；任务拆分结构性问题才退回 Phase 3 重拆。
>
> **与 `reviewer/_SKILL.md` 的关系**：`reviewer/_SKILL.md` 是 Blind Hunter → Edge Case Hunter → Acceptance Auditor 三条审查线的执行剧本；本文件的 Stage A/B 是编排分流视角（Stage A 收编 Acceptance Auditor 的验收审计，Stage B 收编 Blind/Edge 两条线）。Acceptance Auditor 在两处出现属同一环节，不是两次审查。

**Step 0**: 触发式参考加载 — 前端项目加载 `ui-anti-patterns.md` (8类反模式)
**Stage A**: PRD→实现覆盖矩阵 — 逐条对照 AC + Delta Spec 确认 + 回归影响
**Stage B**: Blind Hunter (静默失败/竞态/状态不一致/资源泄漏) + Edge Case Hunter (空值/极端输入/并发/时区)
**Step D0-D3**: Review Specialists (v3.2新增) — 按领域触发专家子 agent

## Specialist 触发规则

| 条件 | 触发 Specialist |
|------|----------------|
| Always | maintainability, testing |
| SCOPE_SECURITY / diff>200 lines | security |
| DB model changes | data-migration |
| Backend/Frontend scope | performance |
| API contract changes | api-contract |
| diff>200 + critical path | red-team + security + testing |
| target=production | red-team always |

## G7 门控

### Step 1: Hook 自动检查 (推荐, L1+)

| Hook | 类型 | 检查内容 |
|------|------|---------|
| format-typecheck | stop | 最终格式化 + 类型检查 |
| security-scan | stop | OWASP 安全扫描 |
| context-monitor | advisory | 上下文预算状态 |

> L0 环境: 参照 `hooks/checklist-fallback.md` 手动检查

### Step 2: 人工决策 (最终)

| 检查项 | 通过条件 |
|--------|---------|
| Stage A PRD 覆盖 | 100% AC 有对应实现 |
| Stage B High severity | 所有 HIGH 必须修复 |
| Specialist CRITICAL | CRITICAL → 阻塞 |
| Cross-Model Review | CRITICAL tasks → 多模型对比（出处：`references/RULES-v3.md` R13 · 双阶段审查） |

> Hook FAIL ≠ Gate FAIL。Hook 仅推荐，最终决策权在人工确认。

**Specialist Severity → Gate Action**:
| Severity | Gate Action | Time-to-Fix |
|----------|------------|-------------|
| CRITICAL | G7 FAIL, blocking deploy | ≤2h (hotfix) |
| HIGH | Conditional pass with plan | ≤1 sprint |
| MEDIUM | Accept with ticket | Next release |
| LOW | Accept silently | Tech debt queue |

## Error Taxonomy

| Level | Name | Recovery | Impact |
|-------|------|----------|--------|
| P0 | BLOCKING_HIGH (Stage B high / Specialist CRITICAL) | G7 FAIL → 退回 Wave 修复 | Blocks Phase 7 |
| P1 | CONDITIONAL_PASS (Medium findings) | Conditional pass + sprint backlog | Continue with time-bound fix |
| P2 | ACCEPT_WITH_NOTE (Low/style) | Defer to tech-debt queue | No deployment impact |
| P3 | INFO_NO_FINDING | Document as clean pass | No impact |

## Boundary Conditions

| Threshold | Value |
|-----------|-------|
| Stage A timeout | ≤10 min |
| Stage B timeout | ≤15 min |
| Specialist timeout | ≤20 min per specialist (parallel) |
| Skip Phase 6 when | 单文件修<50行 / Hotfix <2h SLA / AC 已由自动化覆盖 |

## 安全审查 (DevFlow增强)

- 代码变更安全影响评估
- 新增代码路径安全边界检查
- 密钥/凭证泄露扫描
- OWASP Top 10 覆盖

## DevFlow 增强

**Persona**: code-reviewer (always) + refactor-cleaner (always) + security-reviewer (always) + performance-optimizer (on-demand)
**Cavecrew**: Reviewer — Diff 审查, one-line severity findings
**Hook**: phase-transition (L0), context-monitor (L0+L1), format-typecheck (L0+L1), security-scan (L0+L1)
