# Pipeline 模式 — 串行依赖链通信

> **适用场景**: 任务间存在严格的串行依赖关系，A 的输出是 B 的输入
> **来源**: Ruflo Pipeline Pattern + ForgeOS Wave 串行执行

---

## 模式定义

Pipeline 模式适用于 Wave 内 Agent 间存在严格串行依赖的场景。Agent A 完成后，其产出通过消息板传递给 Agent B，B 基于 A 的产出继续执行。

```
Agent A → [notifications.md] → Agent B → [notifications.md] → Agent C
   │                              │                              │
   ├─ 完成任务 A                    ├─ 读取 A 的产出                 ├─ 读取 B 的产出
   ├─ 写入产出到 notifications     ├─ 执行任务 B                    ├─ 执行任务 C
   └─ 更新 agent-state             └─ 写入产出到 notifications     └─ 写入产出到 notifications
```

---

## 使用场景

| 场景 | Agent A | Agent B | Agent C | 通信内容 |
|------|---------|---------|---------|---------|
| 认证模块 | schema-agent | repo-agent | service-agent | 数据模型定义 → 仓储接口 → 服务实现 |
| API 端点 | types-agent | handler-agent | test-agent | 类型定义 → 路由实现 → 测试用例 |
| 数据库迁移 | migration-agent | model-agent | seed-agent | 迁移脚本 → ORM 模型 → 种子数据 |

---

## 执行协议

### Step 1: Pipeline 头 Agent 执行

```markdown
1. Agent A 启动
2. 读取前置 Wave 消息（如果有）
3. 执行任务 A
4. 完成后写入 notifications.md:
   - 产出描述
   - 接口/类型定义
   - 文件变更列表
5. 更新 agent-state (状态: COMPLETED)
```

### Step 2: Pipeline 中间 Agent 执行

```markdown
1. Agent B 启动
2. 读取 notifications.md 中 Agent A 的产出
3. 如果需要确认 → 写入 requests.md
4. 等待 response 或直接使用 A 的产出
5. 执行任务 B
6. 完成后写入 notifications.md
7. 更新 agent-state (状态: COMPLETED)
```

### Step 3: Pipeline 尾 Agent 执行

```markdown
1. Agent C 启动
2. 读取 notifications.md 中 Agent B 的产出
3. 执行任务 C
4. 完成后写入 notifications.md
5. 更新 agent-state (状态: COMPLETED)
```

---

## 消息示例

### Pipeline 头 → 中间

```markdown
### [MSG-001] auth-schema-complete

- **From**: auth-schema-agent
- **To**: auth-repo-agent
- **Type**: notify
- **Phase**: P4
- **Wave**: 2
- **Priority**: high
- **Timestamp**: 2026-05-29T10:30:00Z

**Body**:
Auth schema implementation complete. Key interfaces:

```typescript
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
```

Files created:
- `src/types/auth.ts` — Type definitions
- `src/schemas/auth.schema.ts` — Validation schemas

**Impact**: [auth-repo-agent, auth-service-agent]

---
```

### Pipeline 中间 → 尾

```markdown
### [MSG-004] auth-repo-complete

- **From**: auth-repo-agent
- **To**: auth-service-agent
- **Type**: notify
- **Phase**: P4
- **Wave**: 2
- **Priority**: high
- **Timestamp**: 2026-05-29T10:45:00Z

**Body**:
Auth repository implementation complete. Key methods:

```typescript
class UserRepository {
  async findById(id: string): Promise<User | null>
  async findByEmail(email: string): Promise<User | null>
  async create(data: CreateUserDTO): Promise<User>
  async updateEmailVerified(id: string, verified: boolean): Promise<void>
}
```

Note: findById returns null on not-found (does NOT throw).

Files created:
- `src/repositories/UserRepository.ts`
- `src/repositories/__tests__/UserRepository.test.ts`

**Impact**: [auth-service-agent]

---
```

---

## 与 Wave Executor 的协作

Pipeline 模式下，Wave Executor 的职责：

1. **按序启动**: 确保依赖链中的 Agent 按顺序启动
2. **超时监控**: 如果 Pipeline 中某个 Agent 超时，通知后续 Agent
3. **错误传播**: 如果某个 Agent 失败，通知依赖方
4. **汇总**: Pipeline 结束后，汇总所有 Agent 的产出

---

## 降级策略

| 场景 | 降级行为 |
|------|---------|
| 消息板不可用 | 回退到 Orchestrator 中转 Pipeline 数据 |
| 前置 Agent 超时 | 后续 Agent 从 Wave SUMMARY 读取摘要 |
| 消息格式损坏 | Orchestrator 手动传递关键信息 |
