# Spec-Driven Development (SDD) 集成指南

> **来源**: spec-kit  
> **集成位置**: Phase 1.5（可选增强）  
> **触发条件**: 用户需求模糊/复杂/涉及架构变更/用户明确要求"/spec"模式

---

## 🎯 SDD核心价值

**规格即代码**: PRD不是指导文档，而是生成代码的源头。

### 传统开发 vs SDD

| 维度 | 传统开发 | SDD |
|------|---------|-----|
| 需求表达 | 口头/文档 | 结构化规格文档 |
| 决策时机 | 编码时决定 | 规格阶段明确 |
| 偏差风险 | 高（AI猜测） | 低（用户确认） |
| 迭代速度 | 慢（需重写代码） | 快（修改规格再生成） |
| 可追溯性 | 弱 | 强（规格→计划→任务→代码） |

---

## 📋 SDD工作流程

```
SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT
   │          │        │          │
   ▼          ▼        ▼          ▼
 Human      Human    Human      Human
 reviews    reviews  reviews    reviews
```

### Phase 1: Specify（规格定义）

**目标**: 将模糊需求转化为结构化规格文档

**执行步骤**:
1. 与用户对话，澄清需求细节
2. 列出所有假设（ASSUMPTIONS）
3. 编写6个核心部分：
   - **Objective**: 构建什么？为什么？成功标准？
   - **Commands**: 完整可执行命令（build/test/lint/dev）
   - **Project Structure**: 目录布局
   - **Code Style**: 代码风格示例
   - **Testing Strategy**: 测试框架、覆盖率要求
   - **Boundaries**: Always/Ask First/Never规则

**输出**: `specs/XXX/spec.md`

**示例**:
```markdown
# Spec: 实时聊天系统

## Objective
构建WebSocket实时消息系统，支持历史查询和用户在线状态

**用户故事**:
- 作为用户，我可以发送和接收实时消息
- 作为用户，我可以查看历史消息记录
- 作为用户，我可以看到其他用户的在线状态

**成功标准**:
- 消息延迟 < 100ms
- 支持1000并发连接
- 99.9%可用性

## Commands
npm run dev           # 启动开发服务器
npm run build         # 生产构建
npm test              # 运行测试套件
npm run lint --fix    # 代码格式化

## Project Structure
src/
├── components/       # React组件
│   ├── ChatWindow.tsx
│   ├── MessageList.tsx
│   └── UserPresence.tsx
├── hooks/            # 自定义Hooks
│   ├── useWebSocket.ts
│   └── useMessages.ts
├── services/         # API服务
│   └── chatService.ts
├── types/            # TypeScript类型
│   └── chat.ts
└── utils/            # 工具函数
    └── formatters.ts

tests/                # 测试文件
e2e/                  # E2E测试
docs/                 # 文档

## Code Style
**命名约定**:
- 组件: PascalCase (ChatWindow)
- 函数: camelCase (sendMessage)
- 常量: UPPER_SNAKE_CASE (MAX_RETRIES)

**示例代码**:
```typescript
// ✅ Good: 清晰的错误处理
async function sendMessage(message: string): Promise<void> {
  try {
    await socket.emit('message', message);
  } catch (error) {
    logger.error('Failed to send message', error);
    throw new ChatError('MESSAGE_SEND_FAILED');
  }
}

// ❌ Bad: 吞掉错误
async function sendMessage(message: string) {
  socket.emit('message', message); // No error handling
}
```

## Testing Strategy
**框架**: Jest + React Testing Library
**覆盖率要求**: 
- 单元测试: ≥80%
- 集成测试: 关键路径100%
- E2E测试: 核心用户流程

**测试层级**:
- Unit: 纯函数、Hooks
- Integration: API调用、WebSocket连接
- E2E: 完整用户旅程（登录→发送消息→登出）

## Boundaries
**Always**:
- WebSocket连接超时重试≤3次
- 所有用户输入必须验证
- 敏感数据不记录到日志

**Ask First**:
- 修改消息存储Schema
- 添加新的第三方依赖
- 更改CI/CD配置

**Never**:
- 明文存储用户密码
- 在前端暴露API密钥
- 删除失败的测试用例而不修复
```

---

### Phase 2: Plan（技术方案）

**目标**: 将规格转化为技术实现计划

**执行步骤**:
1. 识别主要组件及其依赖关系
2. 确定实施顺序（什么必须先构建）
3. 标注风险和缓解策略
4. 区分可并行vs必须串行的任务
5. 定义各阶段之间的验证检查点

**输出**: `specs/XXX/plan.md`

**示例**:
```markdown
# Implementation Plan: 实时聊天系统

## Architecture Overview
```
┌─────────────┐     WebSocket     ┌──────────────┐
│   Client    │ ◄──────────────► │   Server     │
│  (React)    │                   │ (Node.js)    │
└─────────────┘                   └──────┬───────┘
                                         │
                                  ┌──────▼───────┐
                                  │  PostgreSQL  │
                                  │  (Messages)  │
                                  └──────────────┘
```

## Component Breakdown

### 1. WebSocket Service (P0)
**职责**: 管理WebSocket连接、重连、心跳
**依赖**: 无
**风险**: 连接稳定性
**缓解**: 指数退避重连策略

### 2. Message Store (P0)
**职责**: 消息CRUD、历史查询、分页
**依赖**: PostgreSQL Schema
**风险**: 大数据量性能
**缓解**: 索引优化 + 分页

### 3. User Presence (P1)
**职责**: 在线状态追踪、最后活动时间
**依赖**: WebSocket Service
**风险**: 状态不一致
**缓解**: 定期同步 + 超时检测

### 4. Chat UI Components (P1)
**职责**: 消息列表、输入框、用户列表
**依赖**: Message Store, User Presence
**风险**: 渲染性能
**缓解**: 虚拟滚动 + 懒加载

## Implementation Order
1. **Wave 1**: WebSocket Service + Message Store (基础层)
2. **Wave 2**: User Presence (业务层)
3. **Wave 3**: Chat UI Components (展示层)

## Risk Assessment
| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| WebSocket断连 | 中 | 高 | 自动重连 + 离线队列 |
| 消息丢失 | 低 | 高 | ACK机制 + 持久化 |
| 性能瓶颈 | 中 | 中 | 压力测试 + 优化 |

## Verification Checkpoints
- **After Wave 1**: WebSocket连接稳定，消息可收发
- **After Wave 2**: 在线状态准确，实时更新
- **After Wave 3**: UI流畅，无卡顿
```

---

### Phase 3: Tasks（任务拆解）

**目标**: 将计划拆解为可执行的离散任务

**执行步骤**:
1. 每个任务可在单次专注会话中完成
2. 每个任务有明确的验收标准
3. 每个任务包含验证步骤（测试/构建/手动检查）
4. 任务按依赖排序，而非按重要性
5. 单个任务不超过5个文件

**输出**: `specs/XXX/tasks.md`

**示例**:
```markdown
# Task List: 实时聊天系统

## Wave 1: 基础层

- [ ] Task 1.1: 初始化项目结构
  - Acceptance: 目录结构符合spec，package.json配置正确
  - Verify: `npm install` 成功，`npm run build` 通过
  - Files: package.json, tsconfig.json, vite.config.ts

- [ ] Task 1.2: 实现WebSocket连接管理
  - Acceptance: 可连接/断开/重连，心跳正常
  - Verify: 单元测试覆盖重连逻辑
  - Files: src/services/websocket.ts, tests/websocket.test.ts

- [ ] Task 1.3: 设计数据库Schema
  - Acceptance: messages表包含所有必要字段，索引正确
  - Verify: Prisma migrate成功，种子数据插入
  - Files: prisma/schema.prisma, prisma/seed.ts

- [ ] Task 1.4: 实现消息CRUD API
  - Acceptance: GET/POST/DELETE接口工作正常
  - Verify: 集成测试通过，Postman集合可用
  - Files: src/api/messages.ts, tests/messages.integration.test.ts

## Wave 2: 业务层

- [ ] Task 2.1: 实现在线状态追踪
  - Acceptance: 用户上线/下线事件正确触发
  - Verify: 多客户端测试，状态同步准确
  - Files: src/services/presence.ts

- [ ] Task 2.2: 实现消息ACK机制
  - Acceptance: 发送方收到ACK，失败消息重试
  - Verify: 模拟网络中断，验证重试逻辑
  - Files: src/hooks/useMessageAck.ts

## Wave 3: 展示层

- [ ] Task 3.1: 实现ChatWindow组件
  - Acceptance: 消息列表显示正确，输入框可用
  - Verify: Storybook预览，视觉回归测试
  - Files: src/components/ChatWindow.tsx, ChatWindow.stories.tsx

- [ ] Task 3.2: 实现虚拟滚动优化
  - Acceptance: 1000条消息流畅滚动，FPS > 50
  - Verify: 性能测试，Lighthouse评分
  - Files: src/components/VirtualMessageList.tsx
```

---

## 🔧 集成到Ultimate-Workflow

### 触发方式

**方式1: 自动触发**
```
检测到以下条件时自动进入SDD模式:
- 用户需求包含"复杂"、"架构"、"系统"等关键词
- Phase 1分析发现≥5个技术选型歧义
- 预估工作量 > 20小时
```

**方式2: 手动触发**
```bash
/spec define "实时聊天系统"
```

### 执行流程

```markdown
Phase 1 (需求分析) 完成
    ↓
检查是否触发SDD
    ↓
是 → 进入 Phase 1.5 (SDD)
    ├─ /spec define → specs/XXX/spec.md
    ├─ /spec plan → specs/XXX/plan.md
    ├─ /spec tasks → specs/XXX/tasks.md
    └─ 用户确认后 → 进入 Phase 2 (方案设计)
    
否 → 直接进入 Phase 2 (方案设计)
```

### CONTEXT.md生成

SDD完成后，自动生成CONTEXT.md：

```markdown
# Implementation Context (from SDD)

> **来源**: Spec-Driven Development  
> **规格文档**: `specs/XXX/spec.md`  
> **实施计划**: `specs/XXX/plan.md`  
> **任务列表**: `specs/XXX/tasks.md`

## Key Decisions

### Tech Stack
- Frontend: React 18 + TypeScript + Vite
- Backend: Node.js + Express + WebSocket
- Database: PostgreSQL + Prisma ORM
- State Management: React Context + useReducer

### Architecture Patterns
- Component-based UI
- Service layer for business logic
- Repository pattern for data access
- Event-driven for real-time features

### Performance Targets
- Message latency: < 100ms
- Concurrent connections: 1000+
- Uptime: 99.9%

## Constraints

### Must Follow
- WebSocket retry ≤ 3 times
- All user input validated
- No plaintext passwords

### Must Consult
- Schema changes
- New dependencies
- CI/CD config changes

### Never Do
- Store secrets in frontend
- Expose API keys
- Delete failing tests without fix
```

---

## 📊 SDD vs 直接开发对比

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 简单Bug修复 | 直接开发 | 规格成本高于收益 |
| 新功能开发 | SDD | 避免理解偏差 |
| 架构重构 | SDD | 需要系统性思考 |
| MVP原型 | 简化SDD | 快速验证想法 |
| 生产系统 | 完整SDD | 质量要求高 |

---

## ⚠️ 常见误区

| 误区 | 现实 |
|------|------|
| "SDD太慢" | 15分钟规格防止数小时返工 |
| "需求会变" | 规格是活文档，可随时更新 |
| "小项目不需要" | 小规格(2行)也有价值 |
| "用户知道要什么" | 即使清晰需求也有隐含假设 |

---

## 🎯 最佳实践

1. **先写规格再编码**: 规格的目的是在编码前强制清晰
2. **规格版本控制**: 规格与代码一起提交到Git
3. **PR引用规格**: 每个PR链接到对应的规格章节
4. **规格即文档**: 规格是系统的权威文档
5. **迭代更新**: 需求变化时先更新规格

---

## 📖 参考资源

- `agent-skills/skills/spec-driven-development/SKILL.md`
- `references/templates/spec-sdd-template.md`
- `references/templates/spec-constitution-template.md`
