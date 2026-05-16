# 验证基线

本文件用于记录团队认为可信的验证命令和证据标准。

## 条目模板

```md
### 验证规则：<简短标题>
- id: verification-YYYY-MM-DD-<标识>
- type: verification_rule
- status: active
- confidence: verified
- last_updated: YYYY-MM-DD
- source:
- owner:
- review_after:

命令或方法：

验证内容：

不验证的内容：

期望的证据：
```

## 说明

- 优先使用可重现且团队已成功使用的命令。
- 记录已知的盲点，避免未来会话过度自信。
- 持久化条目应始终包含 `id`、`status`、`confidence`、`source`、`last_updated` 和 `review_after`。
- 如果规则标记为 `verified`，`source` 应指向成功的命令、日志、测试或文档化证据。
