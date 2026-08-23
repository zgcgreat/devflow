---
name: conductor-revert
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: []
provides: [logical-unit-revert, git-aware-rollback, checkpoint-sync]
dependencies:
  - phase-6 (module dependency)
  - hooks-system (module dependency)
  - codegraph-bridge (module dependency)
description: Conductor-inspired four-phase logical unit rollback — tracks, phases, tasks → git history reconciliation → execution → verification
source: Conductor revert.toml (4-phase protocol: Interactive Selection → Git Reconciliation → Execution Plan → Execution & Verification)
external-inputs: [project-context]
---

# Conductor Revert — 逻辑单元回滚

## 核心能力

借鉴 Conductor 的 `revert.toml`,实现基于**逻辑单元**(Track/Phase/Task)而非 commit hash 的 git-aware 回滚。
**回滚的不是代码,是意图。**

## 设计理念

传统 git revert 只认 commit hash,但 Conductor/ForgeOS 的工作单元是:
- **Track** (功能/缺陷追踪)
- **Phase** (Phase 级别的工作单元)
- **Task** (具体任务)

Conductor Revert 实现**四阶段协议**:

```
Phase 1: 交互式目标选择 → 用户确认回滚目标
Phase 2: Git 对账校验 → 找到逻辑单元对应的真实 commit
Phase 3: 执行计划确认 → 呈现回滚方案
Phase 4: 执行与验证 → git revert + plan.md 同步
```

## 四阶段协议

### Phase 1: 交互式目标选择

```
1. 检查目标是否随命令提供 (/forgeos:revert task <id>)
   ├── 是 → 直接进入 Path A (直接确认)
   └── 否 → Path B (引导菜单)

2. Path A: 直接确认
   ├── 在 tracks.md / plan.md 中找到目标
   ├── ask_user: "确认回滚 [Track/Phase/Task]: '[描述]'"
   └── yes → target_intent 已建立 → 进入 Phase 2
       no → ask_user: "请描述要回滚的单元"

3. Path B: 引导菜单
   ├── 扫描 tracks.md + 所有 plan.md
   ├── 优先列出 [~] 进行中的项目 (最多3个)
   ├── 无进行中项目 → 列出最近完成的 [x] 项目 (最多3个)
   ├── ask_user: "选择要回滚的项目" (最多4个选项)
   ├── 用户选择 → target_intent → 进入 Phase 2
   └── 用户选择 "Other" → 对话确认 → Path A
```

### Phase 2: Git 对账校验

```
对账逻辑:

1. 识别实现层 Commit (Implementation Commits)
   ├── 从目标 plan.md 中提取已完成的 task commit SHA
   ├── 处理"幽灵"commit (重写历史):
   │   ├── SHA 不存在于 git log → 用 git log --all --grep 模糊匹配
   │   ├── 找到相似消息 → ask_user 确认替换
   │   └── 无匹配 → 报告缺失, halt
   ├── 对每个验证过的 SHA,查找对应的 plan-update commit
   │   └── git log 搜索修改了 plan.md 的 commit (时间在上一个实现 commit 之后)

2. Track 回滚专用: Track Creation Commit
   ├── git log -- <tracks.md> 搜索首次引入该 track 的行
   ├── 匹配模式: `- [ ] Track: <描述>` 或 `## [ ] Track: <描述>`
   ├── 添加 Track Creation SHA 到回滚列表

3. 编译最终回滚列表
   ├── 按时间倒序排列 (从最新到最旧)
   ├── 对每个 commit 检查:
   │   ├── merge commit → 警告 cherry-pick 重复风险
   │   ├── 父子 commit 关系 → 合并为单次 revert
   │   └── 冲突检测 → 预判潜在冲突文件
   └── 输出回滚分析摘要
```

### Phase 3: 执行计划确认

```
1. 呈现回滚计划:

   "已分析您的请求。回滚计划如下:

   **目标:** 回滚 Task '[任务描述]'
   **回滚 Commits:** 2
     - <sha> ('feat: 实现用户模型')
     - <sha> ('conductor(plan): 标记任务完成')
   **执行方式:** 按时间倒序 git revert --no-edit
   **预计影响:** src/models/user.py, tests/test_user.py, plan.md"

2. 最终确认:
   ├── ask_user: "是否执行上述回滚计划?"
   │   ├── 选项: ["Approve", "Revise"]
   │   ├── Approve → Phase 4
   │   └── Revise → ask_user: "请描述回滚计划的修改"
```

### Phase 4: 执行与验证

```
1. 执行回滚
   ├── for sha in reversed(commit_list):
   │   ├── git revert --no-edit <sha>
   │   └── 冲突处理:
   │       ├── git diff --name-only --diff-filter=U 获取冲突文件
   │       ├── ask_user: "存在冲突,选择处理方式:"
   │       │   ├── 选项: ["手动解决", "使用 theirs", "使用 ours", "取消"]
   │       └── 用户选择 "手动解决" → halt, 提供详细冲突信息

2. 验证 Plan 状态
   ├── 重新读取目标 plan.md
   ├── 确认回滚的项目状态已重置
   │   ├── [x] → [ ] (已完成 → 未完成)
   │   ├── [checkpoint: abc1234] → 移除 checkpoint SHA
   │   └── 如果状态未正确重置 → 手动修正 → commit
   ├── commit 修正: "conductor(revert): Sync plan.md after reverting <target>"

3. 同步 CodeGraph 索引
   ├── codegraph affected <影响范围> → 识别额外受影响文件
   ├── 通知用户潜在未检测到的影响

4. 报告完成
   ├── "回滚完成。已回滚 N 个 commit,修改 N 个文件。
   │  详细变更: [文件列表]
   │  Plan.md 已同步。"
```

## 回滚粒度

| 粒度 | 回滚范围 | 适用场景 |
|------|---------|---------|
| **Task** | 单个任务的所有 commit | 修复特定功能的 bug |
| **Phase** | 某 Phase 的所有任务 commit | Phase 实施错误,需要重来 |
| **Track** | Track 创建 commit + 所有任务 commit | 整个功能废弃 |

## Hooks 集成

| Hooks 钩子 | Revert 联动 |
|-----------|-----------|
| **Phase-Transition** | Revert 后自动触发 Phase 4→5 的 checkpoint 保存 |
| **Tool-Execution** | 审计 git revert 命令,记录慢调用 |
| **Context-Monitor** | Advanced Scale 下 revert 前自动保存快照 |
| **codegraph-bridge** | revert 后自动检测影响链 |

```yaml
# .forgeos/revert.yaml (可选配置)
revert:
  auto_sync_plan: true       # 回滚后自动同步 plan.md
  auto_update_codegraph: true  # revert 后自动更新 CodeGraph 索引
  conflict_resolution:
    strategy: ask_user         # ask_user | use_theirs | use_ours | halt
    max_retries: 2             # 自动重试次数 (仅 use_theirs/ours)
  safety:
    warn_merge_commits: true   # 回滚 merge commit 前警告
    warn_cherry_picks: true    # 回滚 cherry-pick commit 前警告
    require_checkpoint_before_revert: true  # 回滚前必须有 checkpoint
```

## 用户命令

```bash
# 交互式回滚 (引导菜单)
/forgeos:revert

# 直接回滚指定 Track/Phase/Task
/forgeos:revert track <id>
/forgeos:revert phase <phase_number>
/forgeos:revert task <task_id>

# 回滚前预览 (Phase 1+2 但不执行)
/forgeos:revert --dry-run <target>

# 查看最近的回滚历史
/forgeos:revert --history

# 撤销回滚 (反向操作)
/forgeos:revert --undo <revert_sha>
```

## 与 Conductor Revert 对比

| 特性 | Conductor | ForgeOS |
|------|---------|-----------|
| **协议阶段** | 4 阶段 (Selection → Reconciliation → Plan → Execution) | 4 阶段 (完全对齐) |
| **目标类型** | Track/Phase/Task | Track/Phase/Task (完全对齐) |
| **幽灵 commit** | git log --grep 模糊匹配 | 完全对齐 |
| **plan.md 同步** | 回滚后手动修正 | 自动同步 + checkpoint SHA 清理 |
| **CodeGraph 联动** | 无 | revert 后自动影响分析 |
| **冲突处理** | halt + 提示用户 | 3 种策略 + 可配置 |
| **dry-run** | 无 | `/forgeos:revert --dry-run` |
| **undo revert** | 无 | `/forgeos:revert --undo` |
| **零脚本** | Gemini CLI extension (JS/TOML) | 纯指令式,零脚本 |

## Phase 集成

### Phase 4 (实施) — Checkpoint 保存
- 每个 Wave 结束自动保存 checkpoint
- checkpoint 包含: 文件快照 + CodeGraph index + plan.md 状态
- 回滚时可直接恢复到最近 checkpoint

### Phase 6 (审查) — 回滚触发点
- Phase 6 审查发现严重问题 → `/forgeos:revert phase <N>`
- Phase 6→7 之间回滚 → 自动重新触发 Phase 6

### Phase 8 (归档) — 回滚保护
- Phase 8 归档后,Track 标记为 IMMUTABLE
- 回滚归档 Track → 触发 LESSONS 重新沉淀
- 回滚 Domain-Skills → 标记为 DEPRECATED + 保留引用

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Execution Impact |
|-------|------|------------|--------|------------------|
| **P0** | BLOCKING | Git revert conflicts that cannot be auto-resolved on critical files | Halt revert, present conflict diff, ask user to resolve | Revert blocked; no state change |
| **P1** | RECOVERABLE | Ghost commit — SHA in plan.md not found in git log | Fuzzy match via git log --all --grep; ask user confirmation | Revert delayed; may proceed with confirmed replacement |
| **P2** | WARNING | Merge commit in revert list — cherry-pick duplication risk | Warn user, offer skip or include option | Proceed with caution; document in SUMMARY |
| **P3** | DEGRADATION | Plan.md state not cleanly reset (stale checkpoint SHA) | Manual fix + commit; non-blocking | Proceed; log for Phase 8 cleanup |

**Severity Assignment Rules**:
- Default to P1 for any SHA mismatch
- Escalate to P0 if revert affects files also modified in current wave
- Never demote: once P0, only manual override clears

## Boundary Conditions

### When to Escalate Immediately
- Revert target includes merge commits → warn and require explicit confirmation
- Revert would affect >10 files → present impact analysis, require approval
- No checkpoint exists before revert → refuse revert, force checkpoint first

### When to Refuse Revert
- Target Track is IMMUTABLE (Phase 8 archived) → refuse, suggest new Track
- Revert chain would break git history (rebase detected) → refuse, suggest manual approach
- Active wave execution in progress → queue revert, execute after wave completes

### Degradation Path
1. Auto-resolve conflicts → 2. Ask user for conflict strategy → 3. Halt and report
