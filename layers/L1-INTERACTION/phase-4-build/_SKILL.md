# Phase 4: 实施 (Wave 并行执行)

> **Layer**: L1-INTERACTION (SuperCorp 交互层) → Layer 2 SEP Engine 介入
> **前置产物**: `03-tasks.md` (Phase 3 通过 G4)
> **后置产物**: `.ultimate-workflow/<req-id>/WAVE-N-SUMMARY.md` (每个 Wave 一个)
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
- `WAVE-N-SUMMARY.md` — 每个 Wave 的完成摘要
- `[checkpoint][wave:N][task:TXX]` Heartbeat 检查点

## 执行流程

### Step 1: Wave N 初始化

1. 读取 `03-tasks.md`，提取 Wave N 的所有 Task
2. 为无依赖的 Task 启动并行 Execution Agent（~200K fresh context）
3. 记录心跳：`[checkpoint][wave:N][start]`

### Step 2: Wave N Task 执行

每个 Task 按以下流程执行：

```
1. Heartbeat: [checkpoint][wave:N][task:TXX] START
2. 加载 Read Files（按需渐进式披露）
3. 编写/修改代码
4. 运行 Verify 命令
5. 提交原子 commit: `<type>(<req-id>): <task-id> <subject>`
6. Heartbeat: [checkpoint][wave:N][task:TXX] DONE
```

**并行执行**: Wave N 内互不依赖的 Task 同时启动 Execution Agent

### Step 3: Wave N 完成总结

1. 确认所有 Task Verify 通过
2. 生成 `WAVE-N-SUMMARY.md`:
   - Tasks completed / failed
   - Files changed
   - Commit hashes
   - Lessons learned（提名到 LESSONS.md）
3. Heartbeat: `[checkpoint][wave:N][complete]`

### Step 4: LearningWorkflow 触发

Phase 完成后（所有 Wave 结束前），触发 LearningWorkflow：
1. 扫描 Phase 中失败的 Task → 写入 LESSONS.md（L-NNN 格式）
2. 高频重复经验（≥ 3 次）→ 提名 Domain Skills Promotion
3. Wave N+1 启动时，读取相关 LESSON 注入 Execution Agent context

### Step 5: PartyMode 共识（复杂决策时触发）

当 Phase 4 遇到需要跨 Agent 共识的决策：
1. 识别决策点（技术选型冲突、架构权衡）
2. 激活 PartyMode 多 Agent 讨论
3. 投票达成共识（>70% 一致或加权平均分 ≥ 75%）
4. 记录决策到 DECISIONS.md

### Step 6: Wave N+1 推进

- 读取 SUMMARY-WAVE-N → 注入 Wave N+1 context（R15）
- 重复 Step 1-5 直到所有 Wave 完成

## G5 门控检查（Phase 4→5）

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| Commit 原子性 | 每个 commit 对应单个 Task | 合并/拆分 commit |
| Verify 通过率 | Wave 内所有 Task verify 100% 通过 | 回滚未通过 Task 的 commit |
| Heartbeat 完整性 | 每个 Task 有 START+DONE 心跳 | 补跑缺失 Task |
| LESSON 提名 | Phase 失败任务已提名到 LESSONS.md | 自动创建 L-NNN 条目 |

## Provider 路由

- Phase 4 → **高代码能力模型**（Execution Agent）
- Wave N SUMMARY 聚合 → Orchestrator ~50K context

---

> **关联规则**: R8 (Wave并行), R16 (原子提交), R17 (Heartbeat), R9/15 (LearningWorkflow)
> **参考文件**: `references/RULES-v3.md` R1-R20, `references/prompts/4-dev.md`, `layers/L2-ENGINE/wave-executor/SKILL.md`
