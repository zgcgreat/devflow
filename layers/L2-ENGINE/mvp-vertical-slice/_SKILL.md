---
name: mvp-vertical-slice
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: [architecture-design]
provides: [sliced-features, delivery-order]
description: Vertical slicing strategy for MVP delivery — cut through all layers to deliver working end-to-end features incrementally
source: superpowers MVP strategy + GSD milestones + devflow Phase flow
dependencies:
  - executor
  - change-manager
triggers:
  - project initialization
  - milestone planning
  - feature scoping
external-inputs: [feature-list]
---

# MVP Vertical Slice — 垂直切片策略

## 核心原则

1. **切透全层** — 每个切片从 UI 到数据层完整贯通
2. **端到端可验证** — 每个切片独立可运行、可演示
3. **风险前置** — 最高风险的技术选型在第一个切片中验证
4. **渐进扩展** — 后续切片在已有切片基础上扩展

## 切片策略

### 切片维度选择

根据项目类型选择主切片维度：

| 项目类型 | 切片维度 | 示例 |
|---------|---------|------|
| Web 应用 | 用户操作流程 | 登录 → 查看列表 → 创建条目 |
| API 服务 | API 端点 | GET /items → POST /items → PUT /items/:id |
| CLI 工具 | 命令 | init → build → deploy |
| 数据管线 | 数据流 | extract → transform → load |
| 库/SDK | 核心功能 | 初始化 → 核心API → 序列化 |

### 切片大小控制

```
每个切片:
  - 实现时间: 1-3 天
  - 代码量: 200-500 行 (不含测试)
  - 测试: 至少 1 E2E + N 单元
  - 独立可部署: 是
  - 独立可回滚: 是
```

## 与 devflow Phase 集成

### Phase 0: 切片规划

在策略阶段确定切片顺序：

```yaml
# .devflow/slicing-plan.yaml
project: my-app
dimension: user-flow
slices:
  - name: auth
    description: User registration and login
    risk: high          # 验证认证架构
    layers: [ui, api, db, auth]
    estimated_days: 2
    priority: 1
    
  - name: core-crud
    description: Basic CRUD for main entity
    risk: medium        # 验证数据模型
    layers: [ui, api, db]
    depends_on: [auth]
    estimated_days: 3
    priority: 2
    
  - name: search
    description: Search and filter
    risk: low
    layers: [ui, api, search-index]
    depends_on: [core-crud]
    estimated_days: 1
    priority: 3
    
  - name: export
    description: Data export
    risk: low
    layers: [ui, api]
    depends_on: [core-crud]
    estimated_days: 1
    priority: 4
```

### Phase 2: 切片设计

每个切片独立设计，但共享架构决策：

```
共享决策 (在第一个切片中确立):
├── 技术栈: React + Express + PostgreSQL
├── 认证方案: JWT + Refresh Token
├── API 风格: REST + JSON
├── 错误处理: 统一错误码 + HTTP 状态码
└── 测试策略: Jest + Playwright

切片特有设计:
├── auth: 登录UI + 认证API + 用户表
├── crud: 列表UI + CRUD API + 实体表
├── search: 搜索UI + 搜索API + 索引
└── export: 导出UI + 导出API + 文件存储
```

### Phase 3: 切片任务

每个切片生成独立的任务列表：

```markdown
## Slice: auth (Priority 1, Risk: high)

### UI Layer
- [ ] Login page component
- [ ] Registration form
- [ ] Auth state management

### API Layer  
- [ ] POST /auth/register endpoint
- [ ] POST /auth/login endpoint
- [ ] JWT middleware

### Data Layer
- [ ] Users table migration
- [ ] User model + repository

### E2E
- [ ] Login flow test
- [ ] Registration flow test
```

### Phase 4-5: 切片构建与测试

每个切片在 Phase 4-5 中独立构建和测试。Wave 执行器按切片分配任务：

```
Wave 1: auth (最高风险，最先构建)
  ├── task: setup auth middleware
  ├── task: create user model
  ├── task: login API
  └── task: login UI

Wave 2: core-crud (依赖 auth)
  ├── task: create entity model
  ├── task: CRUD API
  └── task: list + detail UI
```

### Phase 7: 切片式 Canary

每个切片独立部署到 canary：

```
Canary 部署顺序:
  auth → core-crud → search → export
  ↑       ↑
  每个切片独立验证健康后才部署下一个
```

## 切片间依赖管理

```
切片依赖图 (DAG):
    auth
     │
  core-crud
   ╱     ╲
search  export

执行规则:
  - 无依赖的切片可并行 (search + export)
  - 有依赖的切片串行 (auth → core-crud)
  - 依赖失败时阻塞所有下游
```

## 切片与变更管理

每个切片对应一个 change-manager 变更：

```markdown
# 创建切片变更（AI 按指令执行）
- 切片 auth: "User authentication flow"
- 切片 core-crud: "Basic CRUD operations"
```

## 降级策略

当切片过大时：
1. 拆分为子切片 (sub-slice)
2. 保留端到端可验证性
3. 子切片可并行开发

当切片间耦合度高时：
1. 提取共享模块为独立切片
2. 共享切片优先构建
3. 后续切片依赖共享切片

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Execution Impact |
|-------|------|------------|--------|------------------|
| **P0** | BLOCKING | Core operation fails with unrecoverable state corruption | Halt, rollback to last checkpoint, escalate | Blocks dependent operations |
| **P1** | RECOVERABLE | Operation fails but state remains consistent | Retry 3x with exponential backoff (1s→2s→4s); if still fails → document, mark NEEDS_WORK | No cross-skill impact |
| **P2** | WARNING | Operation succeeds with quality degradation | Document in SUMMARY, do NOT block execution | Continue normally |
| **P3** | DEGRADATION | Operation timeout or resource exhaustion | Cancel current sub-operation, mark PARTIAL_PASS, log to heartbeat | Cancels current op; next cycle may proceed |

**Severity Assignment Rules**:
- Default to P1 for any operation failure
- Escalate to P0 if state corruption detected or dependent operations affected
- Never demote: once P0, only manual override can clear

## Boundary Conditions

### When to Escalate Immediately
- Operation produces corrupted output → halt and rollback
- Dependency unavailable and no fallback → halt, report missing dependency

### When to Skip Operation
- Input preconditions not met → skip, log reason, proceed to next step
- Already completed in current session → skip (idempotency)

### Degradation Path
1. Full operation → 2. Retry with backoff → 3. Fallback/skip → 4. Halt and report
