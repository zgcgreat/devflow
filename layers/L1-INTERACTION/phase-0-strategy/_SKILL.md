---
name: phase-0-strategy
preamble-tier: 2
version: 3.0.0
layer: L1-INTERACTION
phase: 0
description: |
  Strategy and ideation phase — capture forward-looking ideas as structured seeds,
  define project scope, and establish initial context before formal Phase 1 analysis.
  Use when: "strategy phase", "seed capture", "project kickoff", "ideation".
requires: []
provides: [g0-gate-decision, strategy-seeds, project-scope]
dependencies:
  - writing-plans
gate: G0
triggers:
  - strategy phase
  - seed capture
  - project kickoff
  - ideation
  - /gsd:capture --seed
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
external-inputs: [project-context]
---

# Phase 0: 战略与种子 (Strategy & Seed Capture)

> **Layer**: L1-INTERACTION (交互层)
> **前置**: 无 (项目启动阶段)
> **后置产物**: `.planning/seeds/SEED-*.md`, 项目初始上下文
> **门控**: G0 — Seed Quality Gate

## 核心定位

Phase 0 是 devflow 工作流的起点，负责：
1. **种子捕获** — 将前瞻性想法结构化为种子文件，定义触发条件
2. **项目初始化** — 建立项目上下文和初始范围
3. **战略对齐** — 确保想法与项目目标一致

## 执行流程

### Step 1: 种子捕获

使用 `workflows/plant-seed.md` 工作流捕获想法：

1. 解析用户输入的想法摘要
2. 创建 `.planning/seeds/` 目录
3. 生成种子文件 `SEED-{NNN}-{slug}.md`，包含：
   - `trigger_when`: 触发条件（默认 "when relevant"）
   - `scope`: 范围估计（默认 "unknown"）
   - `status`: dormant
4. 收集面包屑（代码库中相关引用）
5. 提交种子文件

### Step 2: 种子丰富（可选）

使用 `--enrich` 标志为种子添加：
- 触发条件（何时浮现）
- 重要性原因（为什么重要）
- 范围估计（工作量大小）

### Step 3: G0 门控检查

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| 种子文件存在 | `.planning/seeds/` 中有至少一个种子 | 执行种子捕获 |
| Frontmatter 完整 | id, status, trigger_when 字段存在 | 补充缺失字段 |
| 面包屑收集 | 至少检查了代码库引用 | 执行面包屑搜索 |

### Step 4: 用户确认

**交互协议**: 先展示完整确认清单，再逐项逐个确认（避免并列提问）。

```markdown
📍 当前阶段: Phase 0 · Strategy — Seed Capture & Ideation
🎯 本步目标: 确认种子捕获和项目范围

---
## 📋 确认清单 (共 3 项)

请按顺序逐项确认以下问题。回答选项编号 [1]/[2]/[3] 或输入自定义内容：

### ❓ 问题 1/3：种子捕获是否完整？

[1] ✅ 完整，继续 ← 推荐
[2] 需要添加更多种子
[3] 查看种子详情

→ 回答: _← 请先确认此题后再看下一题_

---
*(确认后显示)*
### ❓ 问题 2/3：项目风险级别评估？

[1] 🟢 低风险 — 纯新项目，无历史约束 ← 推荐(新项目)
[2] 🟡 中风险 — 有既有系统，需要兼容
[3] 🔴 高风险 — 关键业务系统，严格变更控制

→ 回答: _← 请先确认此题后再看下一题_

---
*(确认后显示)*
### ❓ 问题 3/3：是否同意进入 Phase 1 分析？

[1] ✅ 同意，开始 Phase 1 ← 推荐
[2] 需要修改种子
[3] 暂停，稍后继续

→ 回答: _← 确认所有问题后流程继续_
```

## 与后续 Phase 的关系

- Phase 0 种子 → Phase 1 分析时自动浮现
- `trigger_when` 匹配新里程碑范围时，种子自动呈现
- Phase 0 不产生正式设计文档，仅建立初始上下文

## Error Taxonomy (Phase 0 Strategy)

| Level | Name | Symptom | Recovery Action |
|-------|------|---------|-----------------|
| P0 | NO_SEEDS | 无种子文件，项目无方向 | 执行种子捕获流程 |
| P1 | INCOMPLETE_SEED | 种子缺少 trigger_when 或 scope | 使用 --enrich 补充 |
| P2 | STALE_SEED | 种子长期 dormant 未被触发 | 审查触发条件，调整或归档 |

## Boundary Conditions (Phase 0 Strategy)

| Condition | Action | Rationale |
|-----------|--------|-----------|
| **Escalate**: 无 project-context 且用户沉默 >3 轮 | 中止并请求用户提供项目背景 | Phase 0 需要项目上下文才能产出有意义种子 |
| **Skip**: 已有 strategy-seeds 且无变更需求 | 直接 PASS G0，进入 Phase 1 | 避免重复捕获已稳定的战略 |

> **⚠️ 防盲飞验证 (P3-4)**: 声称 Skip 时必须执行:
> 1. `Read(".devflow/00-strategy.md")` 读取战略文档
> 2. 展示目标+范围+风险级别内容（≥3行）
> 3. 向用户确认: "战略文档已存在，是否确认跳过 Phase 0？"
> Fast/Lean 模式下可直接跳过，无需验证。
| **Degradation**: 项目上下文不足 | 输出 CONDITIONAL PASS + 标记 `[TODO: enrich context]` | 低上下文仍可产出种子，但需后续补充 |

## Provider 路由

- Phase 0 → **通用模型**（创意捕获，不需要高分析能力）
