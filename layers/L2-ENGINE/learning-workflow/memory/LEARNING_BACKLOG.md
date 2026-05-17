# 学习待办

本文件用于跟踪可复用的经验教训，这些经验可能值得在未来创建工作流、技能、检查清单或项目规则。

## 候选格式

```md
### 候选：<简短名称>
- candidate_id: learn-YYYY-MM-DD-<标识>
- type: learning_candidate
- status: proposed
- confidence: inferred
- last_updated: YYYY-MM-DD
- source:
- owner:
- review_after:
- trigger:
- repeated_pattern:
- impact:
- evidence_count:
- repeated_times:
- suggested_artifact:
- promote_decision:
- linked_entries:
```

## 提升指导

- 将候选保持在 `proposed` 状态，直到它显示出重复模式或明确的跨会话价值。
- 当它有足够证据和明确的目标产物时，将其移动到 `ready_for_promotion`。
- 当经验不再相关或已转化为持久化产物时，使用 `superseded`。
- 准备提升的候选通常应有 `evidence_count >= 2`、`repeated_times >= 2`、`source`、`review_after` 和链接的证据。

## 说明

- 将持久的项目事实放在 `PROJECT_CONTEXT.md` 中，而不是这里。
- 将当前任务状态放在 `CURRENT_STATE.md` 中，而不是这里。
- 将一次性会话摘要放在 `session-journal/` 中，而不是这里。
- 仅将看起来可在未来会话中复用的经验放在本文件中。
