# 已知失败模式

本文件用于记录重复的失败模式、环境陷阱、流程陷阱和反复出现的误判。

## 条目模板

```md
### 失败模式：<简短标题>
- id: failure-YYYY-MM-DD-<标识>
- type: failure_pattern
- status: active
- confidence: verified
- last_updated: YYYY-MM-DD
- source:
- owner:
- review_after:

触发条件：

症状：

可能原因：

如何检测：

缓解措施：
```

## 说明

- 优先记录重复或高影响的失败，而非一次性错误。
- 如果失败已完全过时，标记为 `superseded` 并解释原因。
- 尽可能链接到验证证据。
- 持久化条目应始终包含 `id`、`status`、`confidence`、`source`、`last_updated` 和 `review_after`。
- 使用 `review_after` 强制定期检查对环境敏感的失败模式。
