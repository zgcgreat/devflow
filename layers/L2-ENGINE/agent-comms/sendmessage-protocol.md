# SendMessage 协议规范

> **版本**: 1.0.0 | **来源**: Ruflo SendMessage + Agent Teams
> **适用范围**: ForgeOS Wave 内 Agent 间通信

---

## 概述

SendMessage 协议定义了 ForgeOS Wave 内 Agent 间的通信标准。由于 ForgeOS 运行在 AI Agent 宿主（Claude Code / Cursor）中，Agent 间通信不能使用传统 IPC，因此采用 **Markdown 消息板** 模式。

---

## 消息格式

### 通用格式

```markdown
### [MSG-<id>] <subject>

- **From**: <agent-name>
- **To**: <agent-name> | * (广播)
- **Type**: notify | request | response | error
- **Phase**: P4
- **Wave**: <N>
- **Priority**: low | medium | high | critical
- **Timestamp**: <ISO 8601>

**Body**:
<message content>

**Impact**: [<affected-agent-1>, <affected-agent-2>]

---
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| MSG-\<id\> | 是 | 消息唯一标识，格式 `MSG-<3位数字>`，Wave 内递增 |
| subject | 是 | 消息主题，kebab-case，简洁描述 |
| From | 是 | 发送方 Agent 标识（与 wave-plan.yaml 中的 task-id 对应） |
| To | 是 | 接收方 Agent 标识，`*` 表示广播 |
| Type | 是 | 消息类型（见下方详细说明） |
| Phase | 是 | 当前 Phase 编号 |
| Wave | 是 | 当前 Wave 编号 |
| Priority | 是 | 优先级：low/medium/high/critical |
| Timestamp | 是 | ISO 8601 格式时间戳 |
| Body | 是 | 消息正文，Markdown 格式 |
| Impact | 否 | 受影响的 Agent 列表 |
| Ref | 否 | 引用的原始消息 ID（response 类型必填） |

---

## 消息类型

### notify — 单向通知

**语义**: 单向信息传递，不需要回复。

**投递保证**: best-effort（尽力投递，不保证）

**使用场景**:
- Schema 变更通知
- API 接口变更通知
- 新增文件/模块通知
- 配置变更通知

**写入文件**: `notifications.md`

**示例**:

```markdown
### [MSG-003] schema-changed-users-table

- **From**: auth-schema-agent
- **To**: *
- **Type**: notify
- **Phase**: P4
- **Wave**: 2
- **Priority**: high
- **Timestamp**: 2026-05-29T10:30:00Z

**Body**:
users table added 'email_verified' column (BOOLEAN, default false).

Migration: `ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;`

**Impact**: [auth-repo-agent, auth-service-agent]

---
```

### request — 需要回复的请求

**语义**: 需要接收方确认或提供信息的请求。

**投递保证**: at-least-once（至少一次，需确认）

**使用场景**:
- 请求确认 API 契约
- 请求依赖方的接口定义
- 请求对某个决策的同意
- 请求代码审查

**写入文件**: `requests.md`

**超时**: 5 分钟无 response → 标记 [TIMEOUT]

**示例**:

```markdown
### [MSG-005] confirm-api-contract

- **From**: auth-service-agent
- **To**: auth-repo-agent
- **Type**: request
- **Phase**: P4
- **Wave**: 2
- **Priority**: medium
- **Timestamp**: 2026-05-29T10:35:00Z

**Body**:
Need confirmation on the UserRepo interface:
- Does findById return null or throw on not-found?
- Is emailVerified included in the return type?

**Impact**: [auth-service-agent]

---
```

### response — 对 request 的回复

**语义**: 对 request 消息的回复，必须包含 Ref 字段。

**投递保证**: at-least-once（至少一次，与 request 配对）

**使用场景**:
- 回复 API 契约确认
- 回复接口定义
- 回复决策同意/拒绝

**写入文件**: `responses.md`

**规则**: 必须在 Ref 字段中引用原始 request 的 MSG-id

**示例**:

```markdown
### [MSG-006] re-confirm-api-contract

- **From**: auth-repo-agent
- **To**: auth-service-agent
- **Type**: response
- **Ref**: MSG-005
- **Phase**: P4
- **Wave**: 2
- **Priority**: medium
- **Timestamp**: 2026-05-29T10:36:00Z

**Body**:
- findById returns null on not-found (no throw)
- emailVerified IS included in the return type (added in this wave)

**Impact**: []

---
```

### error — 错误报告

**语义**: 严重错误或冲突，需要 Orchestrator 介入处理。

**投递保证**: guaranteed（保证投递，Orchestrator 必须处理）

**使用场景**:
- API 契约冲突
- 代码合并冲突
- 数据模型不一致
- 测试失败导致依赖方无法继续

**写入文件**: `errors.md`

**处理流程**:
1. Agent 写入 error 消息
2. Orchestrator 读取并评估
3. 决定: 仲裁/回滚/升级
4. 结果写入 responses.md 或 notifications.md

**示例**:

```markdown
### [MSG-008] api-contract-conflict

- **From**: auth-service-agent
- **To**: *
- **Type**: error
- **Phase**: P4
- **Wave**: 2
- **Priority**: critical
- **Timestamp**: 2026-05-29T10:40:00Z

**Body**:
CONFLICT: auth-repo-agent says findById returns null, but existing code in
auth-service expects it to throw NotFoundError. This will cause unhandled
exceptions at runtime.

**Impact**: [auth-repo-agent, auth-service-agent, orchestrator]

---
```

---

## 消息 ID 分配规则

- 格式: `MSG-<3位数字>`（如 MSG-001, MSG-002, ..., MSG-999）
- 每个 Wave 独立编号，从 001 开始
- 多个 Agent 并行写消息时，可能出现 ID 冲突
- **冲突解决**: Orchestrator 在 Wave 结束时重新编号（MSG-001~NNN）
- **写入建议**: Agent 使用 `<agent-name>-<sequence>` 作为临时 ID（如 `auth-repo-001`），Orchestrator 统一重编号

---

## 消息写入协议

### 写入前检查

```markdown
1. 确认消息类型正确（notify/request/response/error）
2. 确认目标文件存在（notifications.md / requests.md / responses.md / errors.md）
3. 确认消息格式符合通用格式规范
4. 追加到文件末尾（不修改已有消息）
```

### 写入顺序

```markdown
1. 构造消息内容
2. 读取当前文件末尾
3. 追加消息到文件末尾
4. 验证写入成功
```

### 并发写入

由于多个 Agent 可能同时写入同一文件，采用以下策略：

1. **乐观写入**: 直接追加到文件末尾
2. **Orchestrator 仲裁**: 如果出现格式问题，Orchestrator 修复
3. **消息去重**: Orchestrator 在 Wave 结束时检查并去重

---

## 消息消费协议

### 读取时机

| 场景 | 读取内容 |
|------|---------|
| Agent 启动时 | 前置 Wave notifications + 当前 Wave 所有消息 |
| Agent 每完成一个子任务 | 当前 Wave 新增消息 |
| Agent 完成时 | 确认所有 request 都有 response |
| Wave 结束时 | Orchestrator 汇总所有消息 |

### 读取策略

```markdown
1. 读取 To 字段包含自己名称或 * 的消息
2. 优先处理 error 类型消息
3. 其次处理 request 类型消息（需要回复）
4. 然后处理 notify 类型消息
5. 跳过与自己无关的消息
```

---

## 消息生命周期

```
创建 → 写入文件 → 被消费 → Wave 结束归档

创建:
  Agent 构造消息 → 写入对应类型文件

写入文件:
  notify → notifications.md
  request → requests.md
  response → responses.md
  error → errors.md

被消费:
  目标 Agent 读取消息 → 执行相应动作
  request → 必须回复 response
  error → Orchestrator 必须处理

Wave 结束归档:
  Orchestrator 汇总到 message-board.md
  关键消息提取到 Wave SUMMARY
  消息板目录保留，供审计
```

---

## 与 R25 规则的映射

| R25 子规则 | 协议对应 |
|-----------|---------|
| R25.1 Wave 内 Agent 必须通过消息板通信 | 所有消息写入 comms/ 目录 |
| R25.2 重要发现写入 notifications.md | notify 类型消息 |
| R25.3 需要确认的请求写入 requests.md | request 类型消息 |
| R25.4 错误必须写入 errors.md | error 类型消息，guaranteed 投递 |
| R25.5 Orchestrator 必须处理 error 消息 | error 消息的 Orchestrator 处理流程 |
| R25.6 消息板生命周期与 Wave 绑定 | Wave 初始化/归档流程 |
