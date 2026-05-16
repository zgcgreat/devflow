# 技术决策

本文件用于记录重要的项目或工作流决策，跨会话保持可见。

## 条目模板

```md
### 决策：<简短标题>
- id: decision-YYYY-MM-DD-<标识>
- type: decision
- status: active
- confidence: verified
- last_updated: YYYY-MM-DD
- source:
- owner:
- review_after:

理由：

考虑的替代方案：

影响：
```

## 说明

- 只记录对未来会话仍然重要的决策。
- 过时的决策标记为 `status: superseded`，而不是盲目删除历史。
- 尽可能引用代码、文档、测试或会话笔记。
- 持久化条目应始终包含 `id`、`status`、`confidence`、`source`、`last_updated` 和 `review_after`。
- 除非 `source` 指向真实证据，否则不要将条目标记为 `confidence: verified`。
