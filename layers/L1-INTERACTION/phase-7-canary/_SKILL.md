---
name: phase-7-canary
preamble-tier: 2
version: 3.4.0
layer: L1-INTERACTION
phase: 7
description: Deploy changes in staged batches (10% → 50% → 100%) with automatic health checks and rollback on threshold breach
requires: [g7-gate-decision, all-tests-passed]
provides: [canary-report, rollback-report, g7.5-gate-decision]
dependencies:
  - phase-6-review
gate: G7.5
triggers:
  - canary deployment
  - gradual rollout
  - zero-downtime deploy
  - canary phase
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
  - Skill
---

# Phase 7: Canary Gradual Rollout

> **前置**: Phase 6 G7 PASS
> **后置产物**: `.devflow/<req-id>/07-canary.md`
> **门控**: G7.5 — Canary Quality Gate

## 核心定位

三阶段渐进发布：Canary-1 (10%, 5min) → Canary-2 (50%, 10min) → Production (100%, continuous)。每阶段自动健康检查，超阈值自动回滚。

**核心原则**: Never deploy blindly. Every batch has a safety net. Auto-rollback before users notice.

## 执行流程

详见 `docs/phases/phase-7-canary-archive.md`

**步骤摘要**:
1. **Step 1**: Pre-flight Validation — 验证 G7 PASS + Phase 5 ALL PASSED
2. **Step 2**: Canary-1 (10%, 5min) — error_rate≤1.0%, latency_p99<200ms
3. **Step 3**: Canary-2 (50%, 10min) — error_rate≤0.5%, +DB连接/缓存检查
4. **Step 4**: Production (100%, continuous) — error_rate≤0.1%
5. **Step 5**: Auto Rollback Protocol — 超阈值自动回滚 + 生成 rollback report

> 脚本生命周期由 `canary-wrapper/_SKILL.md` 管理。

## 健康检查阈值

> 表中 200ms 等为**示例默认值**，实际阈值来自 `01-analysis.md` 的非功能性需求（NFR），逐 req 填写。

| Stage | Traffic | Duration | error_rate | latency_p99 | CPU | Memory |
|-------|---------|----------|------------|-------------|-----|--------|
| Canary-1 | 10% | 5min | ≤1.0% | <200ms | <60% | <70% |
| Canary-2 | 50% | 10min | ≤0.5% | <200ms | <60% | <70% |
| Production | 100% | continuous | ≤0.1% | <200ms | <60% | <70% |

## Error Taxonomy

| Priority | Condition | Recovery |
|----------|-----------|----------|
| P0 | error_rate ≥ stage threshold | Auto rollback + root cause report |
| P1 | error_rate approaching threshold | Escalate on-call, increase check frequency |
| P2 | Feature flag config inconsistency | Sync flags, re-validate |
| P3 | Rollback report has unresolved warnings | Log, schedule follow-up |

## Boundary Conditions

| Parameter | Value |
|-----------|-------|
| Auto-rollback trigger | ≥3 consecutive threshold breaches |
| Skip canary when | Emergency P0 / 纯前端静态 / A-B test / Dev 环境 |
| Escalate immediately when | Rollback fails 2x / Data corruption / Security vuln / >10% user impact |
| DB Migrations | Run BEFORE canary, backward-compatible only |

## 产物模板

> **完整权威模板见 `references/templates/07-canary.md`**（5 必填段：灰度方案/阈值表/各阶段健康指标实测/回滚与异常事件记录/升级判定与全量发布结论）。以下为速览，**以权威模板为准**。

```markdown
# Canary Deployment Report — [req-id]
## 灰度方案
- 各阶段流量比例 / 观察时长 / 进入条件
## 阈值表
- error_rate / latency_p99 / CPU / Memory（来源：01-analysis.md NFR）
## 各阶段健康指标实测
| Stage | Traffic | Duration | error_rate | latency_p99 | Status |
## 回滚/异常事件记录
- 回滚次数 / 事件明细（无异常写"无"）
## 升级判定与全量发布结论
**Final Result**: [PASS / FAIL / PASS WITH NOTES]
```

## DevFlow 增强

**Persona**: security-reviewer (on-demand, 部署安全检查)
**Hook**: context-monitor (L0+L1), phase-transition (L0), cost-tracker (L0+L1)
**Cavecrew**: 无
