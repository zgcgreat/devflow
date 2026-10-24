---
name: phase-4-build
description: Phase 4 构建阶段 — Wave 执行、原子 Task 编码、Verify 验证与 Commit
preamble-tier: 2
version: 3.4.0
layer: L1-INTERACTION
phase: 4
requires: [g4-gate-decision, task-list, wave-plan]
provides: [wave-summaries, code-commits, g5-gate-decision]
source: 交互层 Phase 4 + 引擎层 Wave Executor
dependencies:
  - subagent-driven-development
gate: G5
triggers:
  - "开始开发"
  - "执行任务"
  - "build phase"
  - "写代码"
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
---

# Phase 4: 实施 (Wave 并行执行)

> **Layer**: L1-INTERACTION (交互层) → Layer 2 引擎层 Engine 介入
> **前置产物**: `03-tasks.md` (Phase 3 通过 G4)
> **后置产物**: `.devflow/<req-id>/04-wave-logs.md`（Wave 执行日志汇总：各 wave 的任务/文件/结果/心跳/失败重试/偏差记录）
> **门控**: G5 — Build Gate

## 核心定位

Phase 4 Build = **编排层**：决定"做什么、按什么顺序做"，不直接写代码。
Wave Executor (L2-ENGINE) = **执行层**：负责"怎么做完"，含 Kahn 拓扑排序、心跳、summary 写入。

## 输入

- `03-tasks.md` — 任务拆分 + Wave 分组建议
- `.devflow/STATE.md` — 当前执行状态
- LESSONS.md — 过往实施经验

## 输出

- `.devflow/<req-id>/04-wave-logs.md` — Wave 执行日志汇总（各 wave 的任务/文件/结果/心跳/失败重试/偏差记录）
- 按 Wave 分组执行的代码变更
- 消费 `.devflow/waves/wave-{N}/SUMMARY.md` — Wave Executor 写入的 wave 目录内过程记录，最终汇总进 `04-wave-logs.md`

## 执行流程

详见 `docs/phases/phase-4-build.md`

**核心步骤摘要**:
1. **Step 0**: 触发式参考加载 — 前端项目加载 `references/frontend-engineer-rules.md` + `references/ui-anti-patterns.md`
2. **Step 1**: Brownfield Detection + Phase 3→Wave Plan Converter (XML/Markdown 双格式解析)
3. **Step 1.5**: Agent Comms 消息板初始化 (≥2 并行 Agent 时)
4. **Step 2**: 编排 Wave N (委托给 Wave Executor) — 含假设声明 + 变更边界声明
5. **Step 2.5**: 变更边界检查 (Fast 模式跳过)
6. **Step 2.7**: WIP 自动保存 (每3 Task / Token>60% / Stage 转变时)
7. **Step 3**: 消费 Wave Executor 结果
8. **Step 3.5**: Wave 实时审查 (light/standard/full 三级)
9. **Step 4**: LearningWorkflow 聚合 (Phase 完成后统一触发一次)
10. **Step 5**: 用户确认
11. **Step 6**: PartyMode 共识 (复杂决策时触发)

> **交互协议**: 先展示完整确认清单，再逐项逐个确认。

## G5 — Build Gate 门控检查 (Phase 4→5)

### Step 1: Hook 自动检查 (推荐, L1+)

| Hook | 类型 | 检查内容 |
|------|------|---------|
| format-typecheck | stop | 格式化 + TypeScript 类型检查 |
| console-log-check | stop | 残留 console.log 检查 |
| context-monitor | advisory | 上下文预算状态 |

> L0 环境: 参照 `hooks/checklist-fallback.md` 手动检查

### Step 2: 人工决策 (最终)

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| Commit 原子性 | 每个 commit 对应单个 Task | 合并/拆分 commit |
| Verify 通过率 | Wave 内所有 Task verify 100% 通过 | 回滚未通过 Task 的 commit |
| Heartbeat 完整性 | 每个 Task 有 START+DONE 心跳 | 补跑缺失 Task |
| LESSON 提名 | Phase 失败任务已提名到 LESSONS.md | 自动创建 L-NNN 条目 |

> Hook FAIL ≠ Gate FAIL。Hook 仅推荐，最终决策权在人工确认。

## Error Taxonomy

| Level | Name | Recovery | Impact |
|-------|------|----------|--------|
| P0 | VERIFY_FAIL_CRITICAL | Rollback commit → fix → re-run verify | Blocks task + dependents |
| P1 | TASK_TIMEOUT | Cancel, kill subprocess, restart fresh | Retry once; then P0 |
| P2 | VERIFY_WARNING | Document warning, proceed | Continue; block if >5 warnings |
| P3 | CONTEXT_PRESSURE | Auto-trim CODE-BASE, compress LESSONS | No impact |

## Boundary Conditions

| Threshold | Value |
|-----------|-------|
| Per-Task Timeout | ≤30 min (Wave total ≤60 min) |
| Verify Retry | 5s → 10s → 20s+jitter, then P0 rollback |
| Max Concurrent Tasks | 7 rec / 10 hard limit |
| Commit Format | `<type>(<req-id>): <task-id> <subject>` |
| Circuit Breaker | 3 consecutive P0 → OPEN circuit; >50% wave fail → re-split Phase 3 |

## 安全前置提醒

- 不引入硬编码密钥/密码/Token (使用环境变量)
- 不引入 SQL 拼接/命令注入 (参数化查询)
- 不引入 XSS/SSRF 路径 (验证净化输入)
- 所有新 API 端点必须含认证检查

## DevFlow 增强

**Persona**: build-error-resolver (always) + 技术栈build-resolver (on-demand)
**Cavecrew**: Builder — 1-2 文件精确编辑，输出压缩 60%
**Hook**: phase-transition (L0), context-monitor (L0+L1), format-typecheck (L0+L1), console-log-check (L0+L1)
