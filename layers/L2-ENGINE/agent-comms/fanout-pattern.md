# Fan-out 模式 — 一对多广播通信

> **适用场景**: 一个 Agent 的发现需要通知多个依赖方
> **来源**: Ruflo Fan-out Pattern + ForgeOS Schema 变更广播

---

## 模式定义

Fan-out 模式适用于一个 Agent 的变更需要广播给多个依赖方的场景。发送方不需要等待回复，接收方自行决定如何处理。

```
Agent A ──→ [notifications.md]
              │
              ├─→ Agent B (读取并响应)
              ├─→ Agent C (读取并响应)
              └─→ Agent D (读取并响应)
```

---

## 使用场景

| 场景 | 广播方 | 接收方 | 通信内容 |
|------|--------|--------|---------|
| Schema 变更 | schema-agent | repo-agent, service-agent, test-agent | 数据模型变更通知 |
| API 契约变更 | api-design-agent | frontend-agent, backend-agent, doc-agent | 接口定义变更 |
| 配置变更 | config-agent | all-agents | 环境变量/配置更新 |
| 共享类型变更 | types-agent | 所有使用该类型的 Agent | 类型定义更新 |

---

## 执行协议

### Step 1: 广播方写入通知

```markdown
1. Agent A 完成变更
2. 识别受影响的 Agent 列表
3. 写入 notifications.md（To: *，Impact 列出所有受影响方）
4. 更新 agent-state (状态: COMPLETED)
```

### Step 2: 接收方读取并响应

```markdown
1. Agent B/C/D 启动或定期检查 notifications.md
2. 读取与自身相关的通知（To: * 或 To 包含自己）
3. 评估影响:
   a. 无影响 → 忽略
   b. 需要适配 → 调整自己的实现
   c. 冲突 → 写入 errors.md
4. 如果需要确认 → 写入 responses.md
5. 继续执行自己的任务
```

### Step 3: 广播方处理反馈

```markdown
1. Agent A 检查 responses.md
2. 如果有冲突 → 评估并决定:
   a. 修改自己的变更（兼容性调整）
   b. 请求接收方适配（写入 requests.md）
   c. 升级到 Orchestrator 仲裁
```

---

## 消息示例

### 广播 Schema 变更

```markdown
### [MSG-002] users-table-schema-changed

- **From**: auth-schema-agent
- **To**: *
- **Type**: notify
- **Phase**: P4
- **Wave**: 2
- **Priority**: high
- **Timestamp**: 2026-05-29T10:30:00Z

**Body**:
BREAKING CHANGE: users table schema modified.

Changes:
1. Added `email_verified` column (BOOLEAN, DEFAULT false)
2. Changed `password` column to `password_hash` (VARCHAR(255))
3. Added index on `email` column

Migration required:
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE users RENAME COLUMN password TO password_hash;
CREATE INDEX idx_users_email ON users(email);
```

Action required:
- Update User model to include emailVerified field
- Update password field reference to passwordHash
- Update login query to use email index

**Impact**: [auth-repo-agent, auth-service-agent, auth-test-agent]

---
```

### 接收方确认

```markdown
### [MSG-007] re-users-table-schema-changed

- **From**: auth-repo-agent
- **To**: auth-schema-agent
- **Type**: response
- **Ref**: MSG-002
- **Phase**: P4
- **Wave**: 2
- **Priority**: medium
- **Timestamp**: 2026-05-29T10:35:00Z

**Body**:
Acknowledged schema change. Adapting UserRepository:
- emailVerified field added to User interface
- password → passwordHash renaming in progress
- No conflicts detected

**Impact**: []

---
```

---

## Fan-out 优先级矩阵

| 变更类型 | 优先级 | 接收方处理 |
|---------|--------|-----------|
| Breaking Change（接口签名变更） | critical | 必须立即响应 |
| 新增字段/列 | high | 在当前 Wave 内适配 |
| 新增索引/约束 | medium | 可在下一个 Wave 处理 |
| 重命名 | high | 必须在当前 Wave 内适配 |
| 文档/注释变更 | low | 可忽略 |

---

## 与 Wave Executor 的协作

Fan-out 模式下，Wave Executor 的职责：

1. **广播分发**: 确保所有目标 Agent 能读取到通知
2. **响应收集**: 收集所有 response，汇总给广播方
3. **冲突检测**: 如果多个接收方报告冲突，升级到 Orchestrator
4. **超时监控**: 如果接收方未在规定时间内响应，标记 TIMEOUT

---

## 降级策略

| 场景 | 降级行为 |
|------|---------|
| 接收方未读取通知 | Orchestrator 在 Wave SUMMARY 中标记，Phase 6 重点审查 |
| 广播方未收到任何响应 | 降低优先级，记录到 Wave SUMMARY |
| 接收方报告冲突 | Orchestrator 仲裁，可能暂停 Wave |
