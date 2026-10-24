---
name: phase-0-strategy
preamble-tier: 2
version: 3.4.0
layer: L1-INTERACTION
phase: 0
description: |
  Strategy and ideation phase — capture forward-looking ideas as structured seeds,
  define project scope, and establish initial context before formal Phase 1 analysis.
requires: []
provides: [strategy-seeds, project-scope]
dependencies:
  - writing-plans
gate: G0
triggers:
  - strategy phase
  - seed capture
  - project kickoff
  - ideation
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
external-inputs: [project-context]
---

# Phase 0: 战略与种子 (Strategy & Seed Capture)

> **前置**: 无 (项目启动阶段)
> **后置产物**: `.planning/seeds/SEED-*.md`, 项目初始上下文
> **门控**: 本技能是 Phase 0 的前置子步骤（种子捕获），不直接过 G0 — Strategy Gate；
> 种子孵化后进入 `phase-0-yc-strategy`，由 YC 六问评分（≥4 题达 3/5）通过 G0 并产出 `00-strategy.md`

## 核心定位

1. **种子捕获** — 将前瞻性想法结构化为种子文件
2. **项目初始化** — 建立项目上下文和初始范围
3. **战略对齐** — 确保想法与项目目标一致

## 产物

- `.planning/seeds/SEED-{NNN}-{slug}.md` — 种子文件 (trigger_when, scope, status)
- 项目初始上下文文档

## 执行流程

种子捕获流程以本文件为准（捕获 → 结构化 → 孵化）。

> **交互协议**: 种子完整性 → 风险级别（"是否进入 Phase 1"由 `phase-0-yc-strategy` 的 G0 决策负责，不属本子步骤）

## 交接

1. 种子孵化完成 → 进入子步骤 `phase-0-yc-strategy`（YC 六问可行性验证）
2. 六问评分通过 → 产出 `.devflow/<req-id>/00-strategy.md` → 关闭 G0（Strategy Gate）
3. G0 PASS 后才进入 Phase 1（5 Whys 需求澄清）

> YC 六问流程详见 `docs/phases/phase-0-strategy.md`——该文档主体是六问评估流程，属 `phase-0-yc-strategy`；种子流程以本文件为准。

## Error Taxonomy

| Level | Name | Recovery |
|-------|------|----------|
| P0 | NO_SEEDS | 执行种子捕获流程 |
| P1 | INCOMPLETE_SEED | 使用 --enrich 补充 |
| P2 | STALE_SEED | 审查触发条件，调整或归档 |

## Boundary Conditions

| Condition | Action |
|-----------|--------|
| 无 project-context 且用户沉默 >3 轮 | 中止并请求项目背景 |
| 已有 strategy-seeds 且无变更 | 跳过重复捕获，直接进入 `phase-0-yc-strategy`（G0 由六问评分判定，非本子步骤判定） |

## DevFlow 增强

**Persona**: planner (always) + 技术栈Persona (项目识别)
**Hook**: prompt-guard (L0), phase-transition (L0)

### 双维度检测 (Scale × TechStack)

Phase 0 启动时自动执行双维度检测:

1. **Scale检测**: 扫描项目模块数、领域信号 → Lite/Standard/Enhanced/Advanced
2. **TechStack检测**: 扫描文件后缀 + 配置文件 → Python/Go/Rust/Java/Kotlin/...
3. **联合决策**: Scale增幅% + TechStack增幅% → Token预算 + Persona加载 + Hook级别

**双维度检测报告模板** (Phase 0 启动时输出, 非 G0 判定):
```
检测到: Scale={level}, TechStack={stacks}
将加载: {N}核心Persona + {M}扩展Persona + {K}安全规则
预计Token: 基线+{X}%
Hook级别: {markdown|markdown+js|全量}
```

> 详见 `docs/TOKEN-BUDGET.md` 和 `layers/L2-ENGINE/scale-domain-adaptive/_SKILL.md`
