---
name: wip-checkpoint
preamble-tier: 2
version: 1.0.0
layer: L2-ENGINE
gate: internal
requires: [wave-executor, token-monitor]
provides: [auto-checkpoint, checkpoint-restore, breakpoint-tracking]
description: |
  WIP 自动保存 — Phase 4 长时间执行中自动保存进度。
  触发条件: 每 3 个 Task 完成 / Token 使用率 > 60% / Phase 转换时。
  会话中断后可从断点恢复。
  参考: gstack Checkpoint 模式。
source: CHANGELOG v1.3.0 — gstack Checkpoint
dependencies:
  - wave-executor (Task 完成通知)
  - token-monitor (Token 阈值触发)
triggers:
  - 每 3 个 Task 完成
  - Token 使用率 > 60%
  - Phase 转换
  - 手动: /checkpoint save
---

# WIP Checkpoint — 工作进度自动保存

> **核心问题**: Phase 4 长时间执行中，会话可能中断，丢失未保存的进度。
> **解决方案**: 自动 WIP Checkpoint 保存当前进度，会话中断后可从断点恢复。

---

## 1. 触发条件

| 触发条件 | 检查频率 | 说明 |
|---------|---------|------|
| 每 3 个 Task 完成 | 每次 Task 结束 | 累计计数器 |
| Token 使用率 > 60% | 每次 post_tool_use | 与 token-monitor 联动 |
| Phase 转换时 | Phase 开始/结束 | 确保转换点有 checkpoint |
| 手动触发 | 用户主动 | `/checkpoint save` |

---

## 2. Checkpoint 内容

### 2.1 保存操作

```bash
# WIP Checkpoint 保存
git add -A
git commit -m "wip(forgeos): phase-4 wave-${WAVE_NUM} checkpoint

Checkpoint automatically created by ForgeOS WIP Checkpoint.

Progress:
- Wave: ${WAVE_NUM}/${TOTAL_WAVES}
- Tasks completed: ${TASKS_DONE}/${TOTAL_TASKS}
- Token usage: ${TOKEN_PERCENT}%
- Next task: ${NEXT_TASK_ID}"
```

### 2.2 STATE.md 断点记录

```markdown
## Checkpoint Record

| 时间 | Wave | Task 进度 | Token | Commit SHA |
|------|------|----------|-------|-----------|
| 2026-05-30 10:30 | Wave 2 | 5/12 tasks | 58% | abc1234 |
| 2026-05-30 11:15 | Wave 3 | 8/12 tasks | 72% | def5678 |
```

---

## 3. 恢复机制

### 3.1 会话中断恢复

```
会话重新启动:
  │
  ├─→ 1. 读取 .forgeos/STATE.md
  │   └─ 找到最后 checkpoint 记录
  │
  ├─→ 2. 读取 git log 最近 wip commit
  │   └─ git log --oneline --grep="wip(forgeos)" -1
  │
  ├─→ 3. 确认恢复点
  │   ├─ 最后 checkpoint 的 Wave + Task
  │   └─ 未完成的 Task 列表
  │
  └─→ 4. 从断点继续
      ├─ 加载 Phase 4 上下文
      ├─ 从未完成的 Task 开始
      └─ 输出: "从 Wave {N} Task {T} 恢复执行"
```

### 3.2 恢复提示

```markdown
🔄 检测到上次未完成的执行

**断点信息**:
- Wave: 2/4
- Task 进度: 5/12
- Token 使用率: 72%
- 最后 Checkpoint: abc1234 (2026-05-30 11:15)

**恢复选项**:
[1] 从断点恢复 — 继续 Wave 2 剩余 Tasks
[2] 从 Wave 开始 — 重新开始 Wave 2
[3] 完全重新开始 — 忽略所有进度
```

---

## 4. Checkpoint 清理

### 4.1 清理规则

| 场景 | 清理动作 |
|------|---------|
| Phase 4 完成 | 压缩 WIP commits 为一个 `feat(phase-4): complete` |
| Phase 8 归档 | 保留最终 checkpoint，清理中间 WIP commits |
| 用户要求 | `git rebase -i` 合并 WIP commits |

### 4.2 清理命令

```bash
# 压缩 WIP commits
git rebase -i HEAD~${WIP_COUNT}
# 将 wip commits 的 pick 改为 fixup

# 或使用 soft reset + 重新 commit
git reset --soft ${FIRST_REAL_COMMIT}
git commit -m "feat(phase-4): implement ${feature-name}"
```

---

## 5. 配置

```json
{
  "wip_checkpoint": {
    "enabled": true,
    "task_interval": 3,
    "token_threshold": 0.6,
    "phase_transition_save": true,
    "cleanup_on_phase_complete": true,
    "commit_prefix": "wip(forgeos):"
  }
}
```

---

## 6. 与其他模块协作

| 模块 | 协作方式 |
|------|---------|
| token-monitor | Token > 60% 触发 checkpoint |
| wave-executor | Task 完成计数 + Wave 完成触发 |
| STATE.md | 断点记录写入 |
| Phase 4 Build | 集成 checkpoint 触发步骤 |
