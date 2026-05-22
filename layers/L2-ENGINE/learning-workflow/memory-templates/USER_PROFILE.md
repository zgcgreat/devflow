# 用户画像

本文件用于记录持久的面向用户的偏好，这些偏好在跨会话中有帮助，但不是项目事实。

## 条目模板

```md
### 用户偏好：<简短标题>
- id: user-YYYY-MM-DD-<标识>
- type: user_preference
- status: active
- confidence: verified
- last_updated: YYYY-MM-DD
- source:
- owner:
- review_after:

偏好内容：

重要性：

如何应用：
```

## 说明

- 与 `PROJECT_CONTEXT.md` 分开保存，避免用户偏好污染项目事实。
- 优先记录持久的交互偏好，而非一次性请求。
- 如果偏好发生变化，更新条目或标记为 `superseded`。
