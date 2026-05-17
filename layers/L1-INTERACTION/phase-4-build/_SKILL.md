# Phase 4: 实施 (Wave 并行执行)

> **Layer**: L1-INTERACTION (SuperCorp 交互层) → Layer 2 SEP Engine 介入
> **前置产物**: `03-tasks.md` (Phase 3 通过 G4)
> **前置产物(消费)**: `.specs/waves/wave-{N}/SUMMARY.md` (Wave Executor L2-ENGINE 写入,Phase 4 直接消费)
> **后置产物**: Phase 4 自身不写 summary,仅编排和消费;最终汇总在 Phase 8 archive
> **门控**: G5 — Integration Gate（Phase 6/7/8 前置）

## Skill元信息

```yaml
name: phase-4-build
version: 3.0-draft
layer: L1-INTERACTION (协调), L2-ENGINE (执行)
source: SuperCorp Phase 4 + SEP Wave Executor
dependencies:
  - subagent-driven-development
v3_upgrade:
  wave_executor: true (Kahn DAG → parallel waves)
  learning_workflow: true (Phase complete → LESSONS)
  party_mode: true (complex decisions → multi-agent consensus)
```

## 输入

- `03-tasks.md` — 任务拆分 + Wave 分组建议
- `.ultimate-workflow/STATE.md` — 当前执行状态
- LESSONS.md — 过往实施经验
- Phase 1-3 生成的所有前置产物（按需加载）

## 输出

- 按 Wave 分组执行的代码变更
- **消费** `.specs/waves/wave-{N}/SUMMARY.md` — Wave Executor 写入的标准路径(不再产生自己的 WAVE-N-SUMMARY.md)
- `[phase:orchestrator][wave:N][delegated-to:wave-executor]` — Phase 4 编排心跳

## ⚠️ 职责边界说明

**Phase 4 Build (L1-INTERACTION)** = 编排层: 决定"做什么、按什么顺序做",不直接写代码。
**Wave Executor (L2-ENGINE)** = 执行层: 负责"怎么做完",包含 Kahn 拓扑排序、心跳、summary 写入。

> **修复 (2024-05-17)**: Phase 4 已退化为纯编排器,所有实际执行逻辑委托给 Wave Executor。Phase 4 不再写自己的 summary(消除双重写入),直接消费 `.specs/waves/wave-{N}/SUMMARY.md`。

## 执行流程

### Step 1: 编排 Wave N (委托给 Wave Executor)

1. 读取 `03-tasks.md`,提取 Wave N 的所有 Task,构建任务图
2. **调用** Wave Executor (`layers/L2-ENGINE/wave-executor/_SKILL.md`),传入:
   - Task 列表 + 依赖关系
   - Verify 命令
   - Commit 格式要求
3. Phase 4 记录: `[phase:orchestrator][wave:N][delegated-to:wave-executor]`

### Step 2: 消费 Wave Executor 结果

1. 读取 `.specs/waves/wave-{N}/SUMMARY.md`(Wave Executor 写入)
2. 确认 Verify 通过率、Commit hashes、Lessons learned
3. 如果 G5 gate PASS → 编排 Wave N+1
4. 如果 G5 gate FAIL → 创建修复 Task,退回对应 Wave

### Step 3: LearningWorkflow 聚合 (Phase 完成后)

所有 Wave 执行完毕后,**统一触发** LearningWorkflow(仅一次):
1. 扫描 `.specs/waves/wave-{N}/SUMMARY.md` 中所有 LESSONS Nomination
2. 聚合到全局 LESSONS.md(L-NNN 格式)
3. 高频重复经验（≥ 3 次）→ 提名 Domain Skills Promotion

> **修复 (2024-05-17)**: Phase 4 不再每 Wave 都触发 LearningWorkflow(避免与 Phase 8 archive 冲突),由 Orchestrator 统一聚合。

### Step 4: PartyMode 共识（复杂决策时触发）

当 Phase 4 遇到需要跨 Agent 共识的决策：
1. 识别决策点（技术选型冲突、架构权衡）
2. 激活 PartyMode 多 Agent 讨论
3. 投票达成共识（>70% 一致或加权平均分 ≥ 75%）
4. 记录决策到 DECISIONS.md

## G5 门控检查（Phase 4→5）

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| Commit 原子性 | 每个 commit 对应单个 Task | 合并/拆分 commit |
| Verify 通过率 | Wave 内所有 Task verify 100% 通过 | 回滚未通过 Task 的 commit |
| Heartbeat 完整性 | 每个 Task 有 START+DONE 心跳 | 补跑缺失 Task |
| LESSON 提名 | Phase 失败任务已提名到 LESSONS.md | 自动创建 L-NNN 条目 |

---

## Error Taxonomy (Phase 4 Build 专属)

| Level | Name | Symptom | Recovery Action | Wave Impact |
|-------|------|---------|-----------------|-------------|
| P0 | VERIFY_FAIL_CRITICAL | Task verify command exits non-zero after retries | Rollback commit → fix → re-run verify | Blocks this task; dependent tasks in same wave blocked too |
| P1 | TASK_TIMEOUT | Heartbeat exceeds threshold (no START/DONE pair) | Cancel execution, kill subprocess, restart with fresh context | Retry once; if still fails → P0 |
| P2 | VERIFY_WARNING | Lint/type errors but runtime passes | Document warning, proceed, fix before Wave complete | Continue; blocked only if >5 warnings |
| P3 | CONTEXT_PRESSURE | Agent approaching 180K token limit (of ~200K) | Auto-trim CODE-BASE section, compress LESSONS to <5K tokens | No impact on execution |

## Boundary Conditions (Phase 4 Build)

### Thresholds
- **Per-Task Timeout**: ≤30 min per task (Wave N total ≤60 min)
- **Verify Retry Chain**: attempt_1: 5s → attempt_2: 10s → attempt_3: 20s + jitter(0-3s), then P0 rollback
- **Max Concurrent Tasks**: 7 recommended / 10 hard limit per wave (HIGH parallelism)
- **Commit Atomicity**: Single commit per task, `<type>(<req-id>): <task-id> <subject>` format

### Circuit Breaker
- 3 consecutive P0 failures on same file → OPEN circuit, route to Phase 6 Specialist review
- Wave total failure rate >50% → recommend re-split tasks in Phase 3

### Input Schema Validation
- [ ] `03-tasks.md` exists and has G4 passed
- [ ] All tasks have verify command + done criterion defined
- [ ] Worktree assignments match parallelism level (HIGH→per-task, LOW→shared)
- [ ] No circular dependencies in DAG (Kahn algorithm completed)

## Provider 路由

- Phase 4 → **高代码能力模型**（Execution Agent）
- Wave N SUMMARY 聚合 → Orchestrator ~50K context

---

> **关联规则**: R8 (Wave并行), R16 (原子提交), R17 (Heartbeat), R9/15 (LearningWorkflow)
> **参考文件**: `references/RULES-v3.md` R1-R20, `references/prompts/4-dev.md`, `layers/L2-ENGINE/wave-executor/SKILL.md`
