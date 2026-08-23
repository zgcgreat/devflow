---
name: agent-comms
preamble-tier: 2
version: 1.0.0
layer: L2-ENGINE
gate: internal
requires: [wave-plan, task-list]
provides: [message-board, agent-state, inter-agent-notifications]
description: |
  Agent 间通信模块 — 基于 Markdown 消息板实现 Wave 内 Agent 协作通信。
  支持 Pipeline/Fan-out/Supervisor 三种通信模式，替代 Orchestrator 中转延迟。
  来源: Ruflo SendMessage 协议 + Agent Teams 架构。
source: Ruflo SendMessage + Agent Teams
dependencies:
  - wave-executor (消息板在 Wave 生命周期内初始化和汇总)
  - executor (Agent 执行时读写消息板)
triggers:
  - Wave 并行任务需要 Agent 间通信
  - 一个 Agent 的发现需要通知同 Wave 其他 Agent
  - Phase 4 实施中 schema/API 变更需要广播
  - 错误需要跨 Agent 传播
---

# Agent Comms — Agent 间通信模块

> **核心问题**: 当前 Wave 并行执行中，Agent 之间无法直接通信，所有消息通过 Orchestrator 中转，导致发现传播延迟和通信瓶颈。
> **解决方案**: 基于 Markdown 消息板实现 Agent 间直接通信，支持 Pipeline/Fan-out/Supervisor 三种模式。

---

## Preamble

### What I Am / What I'm Not

**I am**: L2 引擎层的 Agent 通信基础设施，为 Wave 内并行 Agent 提供消息板读写能力。我定义通信协议、消息格式和消息板文件结构。

**I'm not**: 消息队列服务、IPC 框架或网络通信层。我不处理网络传输、序列化或进程间通信。

### Key Principles

1. **Markdown-First**: 所有消息以 Markdown 文件存储，人类可读，AI 可写
2. **Orchestrator-Aware**: Orchestrator 仍是仲裁者，消息板是辅助通信通道
3. **Best-Effort Delivery**: notify 消息尽力投递，request/response 保证至少一次
4. **Wave-Scoped**: 消息板生命周期与 Wave 绑定，Wave 结束后归档

---

## 通信模式

| 模式 | 适用场景 | 数据流 | 示例 |
|------|---------|--------|------|
| **Pipeline** | 串行依赖任务 | A → B → C | auth-schema → auth-repo → auth-service |
| **Fan-out** | 广播通知 | A → [B, C, D] | schema 变更通知所有依赖方 |
| **Supervisor** | 需要协调的并行任务 | A ↔ [B, C] (双向) | 主 Agent 协调多个子 Agent |

详见:
- [Pipeline 模式](pipeline-pattern.md) — 串行依赖链
- [Fan-out 模式](fanout-pattern.md) — 一对多广播
- [Supervisor 模式](supervisor-pattern.md) — 双向协调

---

## 消息板文件结构

```
.forgeos/<req-id>/comms/
├── message-board.md          # 主消息板（所有 Agent 读写）
├── wave-<N>/                 # 按 Wave 分组
│   ├── notifications.md      # 通知消息（单向，不需要回复）
│   ├── requests.md           # 请求消息（需要回复）
│   ├── responses.md          # 响应消息（对 request 的回复）
│   └── errors.md             # 错误消息（保证投递）
└── agent-state/              # Agent 状态
    ├── <agent-name>-state.md # Agent 当前状态摘要
    └── ...
```

### 消息板初始化

Wave N 开始时，Orchestrator 执行：

```markdown
## Wave N 消息板初始化

1. 创建目录: .forgeos/<req-id>/comms/wave-<N>/
2. 创建文件:
   - notifications.md (含 Wave 头信息)
   - requests.md (含 Wave 头信息)
   - responses.md (含 Wave 头信息)
   - errors.md (含 Wave 头信息)
3. 每个 Agent 启动时:
   a. 读取 message-board.md 中与本 Wave 相关的消息
   b. 读取前置 Wave 的 notifications.md
   c. 写入 agent-state/<agent-name>-state.md (状态: STARTED)
```

### 消息板清理

Wave N 完成后，Orchestrator 执行：

```markdown
## Wave N 消息板归档

1. 汇总所有消息到 message-board.md
2. 提取关键通知和错误到 Wave SUMMARY
3. 保留 agent-state/ 供下一 Wave 读取
4. wave-<N>/ 目录保留，不删除（审计用）
```

---

## 消息格式

### 通用消息格式

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

### 各类型消息规范

#### notify (单向通知)

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

#### request (需要回复)

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

#### response (对 request 的回复)

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

#### error (错误报告)

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

## 投递保证

| 消息类型 | 投递保证 | 说明 |
|---------|---------|------|
| notify | best-effort | 尽力投递，不保证所有 Agent 都读到 |
| request | at-least-once | 至少一次，发送方等待 response 或超时 |
| response | at-least-once | 至少一次，与对应 request 配对 |
| error | guaranteed | 保证投递，Orchestrator 必须处理 |

### 超时处理

```markdown
## Request 超时

- request 发出后 5 分钟无 response → 标记 [TIMEOUT]
- Orchestrator 决定: 重试 / 升级 / 降级
- 连续 3 次 TIMEOUT → 升级为 error 类型
```

---

## Wave 执行流程变更

### Agent 启动时

```markdown
1. 读取 .forgeos/<req-id>/comms/wave-<N>/notifications.md
2. 读取前置 Wave 的 notifications.md（仅 high/critical 优先级）
3. 读取 agent-state/ 目录中与自身相关的状态
4. 写入自身 agent-state/<name>-state.md (状态: STARTED)
```

### Agent 执行中

```markdown
1. 发现影响其他 Agent 的变更 → 写入 notifications.md
2. 需要其他 Agent 确认 → 写入 requests.md
3. 收到 request → 写入 responses.md
4. 遇到错误 → 写入 errors.md
5. 每完成一个子任务 → 更新 agent-state/<name>-state.md
```

### Agent 完成时

```markdown
1. 写入 agent-state/<name>-state.md (状态: COMPLETED, 摘要)
2. 写入最终 notifications（如果有未发出的发现）
3. Orchestrator 汇总所有消息
4. 通知下一 Wave 的 Agent
```

---

## Agent State 格式

```markdown
# Agent State: <agent-name>

- **Status**: STARTED | IN_PROGRESS | WAITING | COMPLETED | FAILED
- **Wave**: <N>
- **Phase**: P4
- **Started At**: <ISO 8601>
- **Updated At**: <ISO 8601>

## Current Task
<task-id>: <brief description>

## Key Findings
- <finding 1>
- <finding 2>

## Pending Items
- <waiting for response on MSG-XXX>
- <need to verify YYY>

## Files Modified
- <file-path-1>
- <file-path-2>
```

---

## Error Taxonomy (P0 → P3)

| Level | Name | Condition | Action |
|-------|------|-----------|--------|
| P0 | BLOCKING | error 类型消息，影响 ≥2 个 Agent | Orchestrator 暂停 Wave，修复后继续 |
| P1 | RECOVERABLE | request 超时，但无依赖方阻塞 | 标记 TIMEOUT，Orchestrator 仲裁 |
| P2 | WARNING | notify 未被目标 Agent 读取 | 记录到 Wave SUMMARY，继续 |
| P3 | INFO | Agent 状态更新 | 记录，无需行动 |

---

## Boundary Conditions

### Thresholds

- **最大消息数/Wave**: 50 条（超过触发压缩）
- **消息板单文件最大**: 200 行（超过归档旧消息）
- **request 超时**: 5 分钟
- **error 处理超时**: 10 分钟

### Timeout

- Agent 状态更新间隔: ≤ 10 分钟
- Wave 间消息传递: ≤ 30 秒
- Orchestrator 仲裁: ≤ 5 分钟

### Input Schema Validation

- [ ] Wave 目录已创建
- [ ] Agent 名称与 wave-plan.yaml 中的 task 对应
- [ ] 消息格式符合通用消息格式规范
- [ ] Ref 引用的消息存在

---

## 降级策略

| 场景 | 降级行为 |
|------|---------|
| 消息板目录不存在 | 回退到 Orchestrator 中转模式（当前默认行为） |
| Agent 无法写入消息板 | 通过 Orchestrator 转发消息 |
| 消息板文件损坏 | 从最新 agent-state 恢复 + 重建消息板 |
| 磁盘空间不足 | 压缩旧消息 + 仅保留 error 和 critical |

---

## 与其他 L2 模块的协作

| 模块 | 协作点 |
|------|--------|
| wave-executor | Wave 生命周期内初始化/归档消息板 |
| executor | Agent 执行时读写消息板 |
| learning-workflow | Wave 完成后提取通信模式为 LESSONS |
| conductor-revert | 回滚时同步清理消息板 |
| surface-switch | lite 模式下禁用消息板（Orchestrator 中转） |

---

## 实现检查清单

- [ ] 消息板目录创建脚本
- [ ] notifications.md 模板
- [ ] requests.md 模板
- [ ] responses.md 模板
- [ ] errors.md 模板
- [ ] agent-state 模板
- [ ] Wave 初始化流程集成到 wave-executor
- [ ] Phase 4 Build SKILL 集成消息板读写步骤
- [ ] R25 规则添加到 RULES-v3.md
