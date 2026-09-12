# Supervisor 模式 — 双向协调通信

> **适用场景**: 主 Agent 需要协调多个子 Agent 的并行执行
> **来源**: Ruflo Supervisor Pattern + DevFlow 多 Agent 协调

---

## 模式定义

Supervisor 模式适用于需要双向协调的并行任务场景。主 Agent（Supervisor）分配子任务给子 Agent，并监控其执行状态，子 Agent 向主 Agent 汇报进度和问题。

```
                    Supervisor Agent
                    ├── request ──→ Sub-Agent A
                    │   ← response ──|
                    ├── request ──→ Sub-Agent B
                    │   ← response ──|
                    └── request ──→ Sub-Agent C
                        ← response ──|
```

---

## 使用场景

| 场景 | Supervisor | Sub-Agents | 协调内容 |
|------|-----------|------------|---------|
| 多模块集成 | integration-agent | auth-agent, user-agent, api-agent | 接口对齐、集成顺序 |
| 复杂重构 | refactor-lead | file-mover, import-updater, test-fixer | 变更顺序、依赖处理 |
| 全栈功能 | fullstack-lead | frontend-agent, backend-agent, db-agent | API 契约、数据流 |
| Bug 修复 | fix-coordinator | root-cause-agent, patch-agent, test-agent | 修复策略、验证顺序 |

---

## 执行协议

### Step 1: Supervisor 分配任务

```markdown
1. Supervisor Agent 启动
2. 读取 Wave 计划和任务列表
3. 将任务分解为子任务
4. 对每个子任务写入 requests.md:
   - 子任务描述
   - 预期产出
   - 约束条件
   - 截止时间（Wave 内相对时间）
5. 更新 agent-state (状态: COORDINATING)
```

### Step 2: Sub-Agent 执行

```markdown
1. Sub-Agent 启动
2. 读取 requests.md 中分配给自己的任务
3. 执行子任务
4. 定期写入 notifications.md (进度更新)
5. 完成后写入 responses.md (产出报告)
6. 如遇问题 → 写入 errors.md
7. 更新 agent-state (状态: COMPLETED / FAILED)
```

### Step 3: Supervisor 监控和协调

```markdown
1. Supervisor 定期读取:
   - agent-state/ (各 Sub-Agent 状态)
   - notifications.md (进度更新)
   - errors.md (问题报告)
2. 根据情况调整:
   - Sub-Agent 超时 → 写入 requests.md (调整截止时间)
   - Sub-Agent 失败 → 写入 requests.md (重试或重新分配)
   - Sub-Agent 间冲突 → 仲裁并写入 notifications.md (决策)
3. 所有 Sub-Agent 完成后 → 汇总产出 → 写入 notifications.md
4. 更新 agent-state (状态: COMPLETED)
```

---

## 消息示例

### Supervisor 分配任务

```markdown
### [MSG-010] assign-auth-module

- **From**: integration-supervisor
- **To**: auth-agent
- **Type**: request
- **Phase**: P4
- **Wave**: 2
- **Priority**: high
- **Timestamp**: 2026-05-29T10:30:00Z

**Body**:
Please implement the auth module with the following requirements:

1. User model: id, email, passwordHash, emailVerified
2. Login API: POST /api/v1/auth/login → { accessToken, refreshToken }
3. Register API: POST /api/v1/auth/register → { user, accessToken }
4. Password hashing: bcrypt with salt rounds 10

Constraints:
- Use the shared types from src/types/auth.ts
- Follow the repository pattern (see UserRepository)
- Tests required: unit + integration

Deadline: Wave 2 completion

**Impact**: [auth-agent]

---
```

### Sub-Agent 进度更新

```markdown
### [MSG-015] auth-module-progress-update

- **From**: auth-agent
- **To**: integration-supervisor
- **Type**: notify
- **Phase**: P4
- **Wave**: 2
- **Priority**: medium
- **Timestamp**: 2026-05-29T10:45:00Z

**Body**:
Auth module progress: 60% complete

Completed:
- ✅ User model (src/models/User.ts)
- ✅ UserRepository (src/repositories/UserRepository.ts)
- ✅ Login API handler (src/api/auth/login.ts)

In progress:
- 🔄 Register API handler (src/api/auth/register.ts)

Remaining:
- ⏳ Integration tests
- ⏳ Error handling refinement

**Impact**: [integration-supervisor]

---
```

### Sub-Agent 完成报告

```markdown
### [MSG-020] re-assign-auth-module

- **From**: auth-agent
- **To**: integration-supervisor
- **Type**: response
- **Ref**: MSG-010
- **Phase**: P4
- **Wave**: 2
- **Priority**: high
- **Timestamp**: 2026-05-29T11:00:00Z

**Body**:
Auth module implementation complete.

Deliverables:
1. User model: src/models/User.ts (tests: 5/5 passing)
2. UserRepository: src/repositories/UserRepository.ts (tests: 8/8 passing)
3. Login API: src/api/auth/login.ts (tests: 4/4 passing)
4. Register API: src/api/auth/register.ts (tests: 6/6 passing)
5. Integration tests: tests/integration/auth.test.ts (tests: 3/3 passing)

Coverage: 87% (lines), 92% (branches)

Known issues:
- Token refresh not yet implemented (deferred to next wave)

**Impact**: [integration-supervisor, auth-service-agent]

---
```

### Supervisor 协调冲突

```markdown
### [MSG-025] api-contract-resolution

- **From**: integration-supervisor
- **To**: *
- **Type**: notify
- **Phase**: P4
- **Wave**: 2
- **Priority**: high
- **Timestamp**: 2026-05-29T11:05:00Z

**Body**:
DECISION: Resolving API contract conflict between auth-repo and auth-service.

Resolution:
- findById returns null on not-found (not throw)
- auth-service must handle null case explicitly
- All NotFoundError throws should be at the service layer, not repository layer

Action items:
- auth-service-agent: Update to handle null from findById
- auth-repo-agent: No change needed (already correct)

**Impact**: [auth-service-agent, auth-repo-agent]

---
```

---

## Supervisor 监控面板

Supervisor 可以在 agent-state 文件中维护监控面板：

```markdown
# Agent State: integration-supervisor

- **Status**: COORDINATING
- **Wave**: 2
- **Phase**: P4

## Sub-Agent Status

| Agent | Status | Progress | Last Update |
|-------|--------|----------|-------------|
| auth-agent | IN_PROGRESS | 60% | 10:45 |
| user-agent | COMPLETED | 100% | 10:40 |
| api-agent | WAITING | 0% | Pending auth-agent |

## Pending Issues
- [MSG-008] API contract conflict → Resolved (see MSG-025)

## Next Actions
- Wait for auth-agent completion
- Start api-agent after auth-agent completes
```

---

## 与 Wave Executor 的协作

Supervisor 模式下，Wave Executor 的职责：

1. **Supervisor 选举**: 在 Wave 中自动指定一个 Agent 为 Supervisor
2. **健康检查**: 定期检查 Supervisor 的 agent-state
3. **Supervisor 故障恢复**: 如果 Supervisor 失败，Orchestrator 接管协调
4. **结果汇总**: Supervisor 的产出作为 Wave 产出的关键部分

---

## 降级策略

| 场景 | 降级行为 |
|------|---------|
| Supervisor 失败 | Orchestrator 接管协调，Sub-Agent 继续执行 |
| Sub-Agent 无响应 | Supervisor 标记 TIMEOUT，Orchestrator 决定是否重试 |
| 消息板不可用 | 回退到 Orchestrator 逐个分派和收集结果 |
| 多个 Supervisor 冲突 | Orchestrator 仲裁，合并或选择其中一个 |
