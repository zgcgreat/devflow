# ForgeOS 集成计划与实施方案

> **版本**: 1.0 | **日期**: 2026-05-29
> **依据**: `docs/CROSS-PROJECT-ANALYSIS.md` 跨项目深度分析报告
> **目标**: 将 12 个项目的优秀特性系统性集成到 ForgeOS，分四阶段实施
> **总工期**: 6-11 周

---

## 目录

- [一、集成总览](#一集成总览)
- [二、架构变更方案](#二架构变更方案)
- [三、Phase 1 — 基础补强（1-2 周）](#三phase-1--基础补强1-2-周)
- [四、Phase 2 — 质量提升（2-3 周）](#四phase-2--质量提升2-3-周)
- [五、Phase 3 — 体验优化（1-2 周）](#五phase-3--体验优化1-2-周)
- [六、Phase 4 — 深度集成（2-4 周）](#六phase-4--深度集成2-4-周)
- [七、实施里程碑与验收标准](#七实施里程碑与验收标准)
- [八、风险评估与回退策略](#八风险评估与回退策略)
- [九、资源与依赖](#九资源与依赖)

---

## 一、集成总览

### 1.1 集成目标

| 目标 | 量化指标 | 当前基线 |
|------|---------|---------|
| Wave 执行效率 | +50% | Agent 间无直接通信，Orchestrator 中转延迟高 |
| 经验检索准确率 | +300% | LESSONS.md 纯文本全文匹配 |
| 新用户上手成本 | -80% | 手动复制文件 + 配置 hooks.json |
| Phase 6 返工率 | -60% | 审查集中在 Phase 6，问题累积 |
| UI Bug 检出率 | +200% | 仅代码级测试，无浏览器 QA |
| MCP Token 消耗 | -70% | 无 MCP 工具瘦身机制 |
| Token 溢出事故 | -90% | 无运行时 Token 监控 |
| 安全覆盖系统性 | +100% | 安全审查依赖 Agent 知识，无结构化框架 |

### 1.2 集成来源矩阵

| 来源项目 | 集成特性数 | 最高优先级 | 核心贡献 |
|---------|-----------|-----------|---------|
| Ruflo | 6 | P0 | Agent 通信、向量记忆、Hooks |
| BMAD-METHOD | 4 | P0 | 模块化安装、Party Mode |
| gstack | 7 | P2 | 浏览器 QA、推回机制、品味记忆、Checkpoint |
| Spec-Kit | 3 | P0 | 项目宪法、Preset 系统 |
| Superpowers | 5 | P1 | 实时审查、TDD、头脑风暴 |
| Karpathy Skills | 3 | P2 | 假设声明、变更边界、Simplicity First |
| Task Master | 4 | P1 | MCP 三级加载、PRD 解析、Fallback 模型 |
| Caveman | 3 | P1 | MCP 瘦身、记忆压缩、三级工具加载 |
| GitNexus | 3 | - | 知识图谱、Blast Radius、Auto Skills |
| OpenSpec | 3 | P2 | 快速模式、Delta Specs、Per-change 目录 |
| Agent-Skills | 2 | P1 | 自我合理化检测、Red Flags |
| Conductor | 3 | P0 | Track 抽象、Smart Revert、Setup 引导 |

### 1.3 优先级分布

```
P0 (必须修复) ████████████ 4 项 — Agent通信、项目宪法、安装器、Token监控
P1 (应该修复) ████████████████████ 6 项 — 向量记忆、实时审查、浏览器QA、安全审计、MCP瘦身、品味记忆
P2 (建议修复) ████████████████████████ 6 项 — 推回机制、边界检查、假设声明、WIP保存、Preset、Delta Specs
深度集成      ████████████████ 5 项 — GitNexus、PRD解析、Party Mode、轨迹学习、Delta Specs完善
```

---

## 二、架构变更方案

### 2.1 当前架构

```
┌─────────────────────────────────────────┐
│  L1-INTERACTION  交互层                  │
│  Phase 0-8 Skills + 变体                 │
│  (用户交互、Gate确认、增强能力注入)        │
├─────────────────────────────────────────┤
│  L2-ENGINE  引擎层                       │
│  Wave Executor + LearningWorkflow        │
│  + Gate-Hook Bridge                      │
├─────────────────────────────────────────┤
│  L3-ARCHITECTURE  架构层                  │
│  DAG Router + Provider Gateway           │
│  + Agent Isolation + Parallel Engine     │
└─────────────────────────────────────────┘
```

### 2.2 目标架构

```
┌──────────────────────────────────────────────────────────┐
│  L1-INTERACTION  交互层                                    │
│  Phase 0-8 Skills + 变体 + Red Flags + Rationalizations   │
│  + PROJECT_CONSTITUTION.md (项目宪法)                       │
│  + /forgeos:setup (一次性引导)                            │
│  + /forgeos:help (元技能)                                 │
│  + Quick Mode (propose→apply→archive)                      │
├──────────┬───────────────────────────────────────────────┤
│  L2-ENGINE  引擎层                                         │
│  Wave Executor + LearningWorkflow + Gate-Hook Bridge       │
│  + Agent Comms (SendMessage/Pipeline/Fan-out/Supervisor)   │ ← 新增
│  + Token Monitor Hook (运行时预算控制)                       │ ← 新增
│  + MCP Shrink Middleware (工具描述压缩)                      │ ← 新增
│  + Real-time Review (Wave 完成后轻量审查)                    │ ← 新增
│  + Browser QA Runner (Playwright 集成)                      │ ← 新增
│  + WIP Checkpoint (自动保存)                                │ ← 新增
│  + Assumption Declaration (假设声明步骤)                     │ ← 新增
│  + Change Boundary Guard (变更边界检查)                      │ ← 新增
├──────────┴───────────────────────────────────────────────┤
│  L3-ARCHITECTURE  架构层                                    │
│  DAG Router + Provider Gateway + Fallback Model            │ ← 增强
│  + Agent Isolation + Parallel Engine                       │
│  + Vector Memory (HNSW 向量检索)                            │ ← 新增
│  + Track Metadata (metadata.json 追踪)                     │ ← 新增
│  + Blast Radius Engine (变更影响分析)                       │ ← 新增
│  + Preset System (用户定制 Phase 模板)                      │ ← 新增
└──────────────────────────────────────────────────────────┘
```

### 2.3 核心变更清单

| 变更项 | 层级 | 类型 | 影响范围 | 依赖 |
|--------|------|------|---------|------|
| Agent Comms 模块 | L2 | 新增模块 | Wave Executor, Phase 4 | 无 |
| Vector Memory 模块 | L3 | 新增模块 | LearningWorkflow, Phase 8 | SQLite/HNSW |
| PROJECT_CONSTITUTION.md | L1 | 新增文件 | 所有 Phase | 无 |
| forgeos CLI | 独立 | 新增工具 | 安装/配置 | Node.js |
| Token Monitor Hook | L2 | 新增 Hook | hooks.json, 所有 Phase | 无 |
| MCP Shrink Middleware | L2 | 新增模块 | caveman-shrink, Provider Gateway | 无 |
| Real-time Review | L2 | 新增流程 | Phase 4, Phase 6 | Agent Comms |
| Browser QA | L2 | 新增模块 | Phase 5 | Playwright |
| OWASP/STRIDE 审计 | L1 | 增强文件 | Phase 6 security-reviewer | 无 |
| Fallback Model | L3 | 增强模块 | Provider Gateway | 无 |
| Track Metadata | L3 | 新增格式 | .forgeos/<req-id>/ | 无 |
| Preset System | L3 | 新增模块 | Phase 模板加载 | 无 |

### 2.4 文件结构变更

```
forgeos/
├── SKILL.md                              # 更新：新增快速模式、/forgeos:help
├── GO.md                                 # 更新：路由增加 setup/help 命令
├── cli/                                  # ★ 新增：npx forgeos 命令行工具
│   ├── package.json
│   ├── bin/
│   │   └── forgeos.js                  # CLI 入口
│   ├── commands/
│   │   ├── init.js                       # npx forgeos init
│   │   ├── setup.js                      # npx forgeos setup
│   │   ├── help.js                       # npx forgeos help
│   │   └── upgrade.js                    # npx forgeos upgrade
│   └── templates/
│       ├── PROJECT_CONSTITUTION.md       # 项目宪法模板
│       └── metadata.json                 # Track 元数据模板
│
├── layers/
│   ├── L1-INTERACTION/
│   │   ├── CONSTITUTION.md               # 不变：流程宪法
│   │   ├── PROJECT_CONSTITUTION.md       # ★ 新增：项目宪法模板
│   │   ├── phase-0-strategy/
│   │   │   └── _SKILL.md                 # 更新：增加推回轮次
│   │   ├── phase-2a-shotgun/
│   │   │   └── _SKILL.md                 # 更新：增加品味记忆写入
│   │   ├── phase-4-build/
│   │   │   └── _SKILL.md                 # 更新：增加假设声明、变更边界检查
│   │   ├── phase-5-test/
│   │   │   └── _SKILL.md                 # 更新：增加浏览器 QA 子阶段
│   │   ├── phase-6-review/
│   │   │   ├── _SKILL.md                 # 更新：增加 OWASP/STRIDE 模板
│   │   │   └── specialists/
│   │   │       └── owasp-stride.md       # ★ 新增：结构化安全审计
│   │   └── quick-mode/
│   │       └── _SKILL.md                 # ★ 新增：propose→apply→archive 快速模式
│   │
│   ├── L2-ENGINE/
│   │   ├── agent-comms/                  # ★ 新增：Agent 间通信模块
│   │   │   ├── _SKILL.md
│   │   │   ├── sendmessage-protocol.md   # SendMessage 协议定义
│   │   │   ├── pipeline-pattern.md       # Pipeline 模式
│   │   │   ├── fanout-pattern.md         # Fan-out 模式
│   │   │   └── supervisor-pattern.md     # Supervisor 模式
│   │   ├── real-time-review/             # ★ 新增：Wave 实时审查
│   │   │   └── _SKILL.md
│   │   ├── browser-qa/                   # ★ 新增：浏览器 QA
│   │   │   ├── _SKILL.md
│   │   │   └── playwright-runner.md      # Playwright 集成
│   │   ├── token-monitor/                # ★ 新增：Token 运行时监控
│   │   │   └── _SKILL.md
│   │   ├── mcp-shrink/                   # ★ 新增：MCP 工具瘦身中间件
│   │   │   └── _SKILL.md
│   │   ├── wip-checkpoint/               # ★ 新增：WIP 自动保存
│   │   │   └── _SKILL.md
│   │   ├── assumption-declaration/       # ★ 新增：假设声明步骤
│   │   │   └── _SKILL.md
│   │   ├── change-boundary-guard/        # ★ 新增：变更边界检查
│   │   │   └── _SKILL.md
│   │   ├── anti-rationalization/         # 已有：增强 Red Flags
│   │   │   └── _SKILL.md                 # 更新：增加每个 Phase 的 Red Flags
│   │   └── ... (现有模块不变)
│   │
│   └── L3-ARCHITECTURE/
│       ├── vector-memory/                # ★ 新增：向量记忆系统
│       │   ├── _SKILL.md
│       │   ├── hnsw-adapter.md           # HNSW 索引适配器
│       │   └── migration-guide.md        # LESSONS.md → 向量记忆迁移指南
│       ├── track-metadata/               # ★ 新增：Track 元数据管理
│       │   └── _SKILL.md
│       ├── blast-radius/                 # ★ 新增：变更影响分析
│       │   └── _SKILL.md
│       ├── preset-system/                # ★ 新增：Preset 扩展系统
│       │   ├── _SKILL.md
│       │   └── default-presets/          # 默认预设
│       │       ├── minimal.yaml
│       │       ├── standard.yaml
│       │       └── enterprise.yaml
│       ├── fallback-model/               # ★ 新增：Fallback 模型配置
│       │   └── _SKILL.md
│       └── ... (现有模块不变)
│
├── hooks/
│   ├── hooks.json                        # 更新：增加 token-monitor、prompt-guard
│   └── scripts/
│       ├── token-monitor.js              # ★ 新增：Token 运行时监控 Hook
│       ├── prompt-guard.js               # ★ 新增：Prompt 注入防御 Hook
│       └── ... (现有脚本不变)
│
├── memory/
│   ├── DESIGN_PREFERENCES.md             # ★ 新增：设计品味记忆
│   └── USER_PREFERENCES.md              # ★ 新增：用户偏好记忆
│
├── references/
│   ├── owasp-top10-checklist.md          # ★ 新增：OWASP Top 10 检查清单
│   ├── stride-threat-model.md            # ★ 新增：STRIDE 威胁建模模板
│   └── ... (现有参考文件不变)
│
└── docs/
    ├── CROSS-PROJECT-ANALYSIS.md         # 已有：分析报告
    └── INTEGRATION-PLAN.md               # ★ 本文件
```

---

## 三、Phase 1 — 基础补强（1-2 周）

> **目标**: 解决 4 个 P0 级问题，建立集成基础
> **前置条件**: 无
> **验收标准**: 4 个 P0 特性全部可用，现有功能无回归

### 3.1 P0-1: Agent 间 SendMessage 通信

#### 3.1.1 问题分析

当前 ForgeOS 的 Wave 并行执行中，Agent 之间无法直接通信：

```
当前模式（Orchestrator 中转）:
  Orchestrator ←→ Agent-A
  Orchestrator ←→ Agent-B
  Agent-A 无法直接通知 Agent-B

问题:
  1. Wave 内 Agent 无法实时同步发现
  2. 一个 Agent 的发现无法及时通知同 Wave 的其他 Agent
  3. Phase 4 中的错误传播延迟
  4. Orchestrator 成为通信瓶颈
```

#### 3.1.2 设计方案

**来源**: Ruflo 的 SendMessage 协议 + Agent Teams 架构

**通信模式**:

| 模式 | 适用场景 | 数据流 | 示例 |
|------|---------|--------|------|
| **Pipeline** | 串行依赖任务 | A → B → C | auth-schema → auth-repo → auth-service |
| **Fan-out** | 广播通知 | A → [B, C, D] | schema 变更通知所有依赖方 |
| **Supervisor** | 需要协调的并行任务 | A ↔ [B, C] (双向) | 主 Agent 协调多个子 Agent |

**协议定义**:

```markdown
# SendMessage 协议

## 消息格式
{
  "from": "agent-name",        // 发送方 Agent 标识
  "to": "agent-name|*",        // 接收方 (* = 广播)
  "type": "notify|request|response|error",
  "phase": "P4",
  "wave": 2,
  "payload": {
    "subject": "schema-changed",
    "body": "users table added 'email_verified' column",
    "impact": ["auth-repo", "auth-service"],
    "priority": "high"
  },
  "timestamp": "2026-05-29T10:30:00Z"
}

## 消息类型
- notify: 单向通知，不需要回复（如 schema 变更通知）
- request: 需要回复的请求（如 请求依赖方确认接口）
- response: 对 request 的回复
- error: 错误报告（如 发现 API 契约冲突）

## 投递保证
- notify: best-effort（尽力投递，不保证）
- request/response: at-least-once（至少一次，需确认）
- error: guaranteed（保证投递，Orchestrator 必须处理）
```

**实现策略**:

由于 ForgeOS 运行在 AI Agent 宿主（Claude Code / Cursor）中，Agent 间通信不能使用传统 IPC。采用 **Markdown 消息板** 模式：

```
.forgeos/<req-id>/comms/
├── message-board.md          # 消息板（所有 Agent 读写）
├── wave-2/                   # 按 Wave 分组
│   ├── notifications.md      # 通知消息
│   ├── requests.md           # 请求消息
│   └── errors.md             # 错误消息
└── agent-state/              # Agent 状态
    ├── agent-a-state.md      # Agent A 当前状态
    └── agent-b-state.md      # Agent B 当前状态
```

**Wave 执行流程变更**:

```
Phase 4 Wave N 执行（变更后）:

1. Orchestrator 分配任务给 Agent
2. 每个 Agent 启动时:
   a. 读取 message-board.md 中与本 Wave 相关的消息
   b. 读取前置 Wave 的 notifications.md
   c. 开始执行任务
3. 执行过程中:
   a. 发现影响其他 Agent 的变更 → 写入 notifications.md
   b. 需要其他 Agent 确认 → 写入 requests.md
   c. 遇到错误 → 写入 errors.md
4. Wave 完成时:
   a. 写入 agent-state.md（当前状态摘要）
   b. Orchestrator 汇总所有消息
   c. 通知下一 Wave 的 Agent
```

#### 3.1.3 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `layers/L2-ENGINE/agent-comms/_SKILL.md` | 新增 | Agent 通信技能定义 |
| `layers/L2-ENGINE/agent-comms/sendmessage-protocol.md` | 新增 | SendMessage 协议规范 |
| `layers/L2-ENGINE/agent-comms/pipeline-pattern.md` | 新增 | Pipeline 模式说明 |
| `layers/L2-ENGINE/agent-comms/fanout-pattern.md` | 新增 | Fan-out 模式说明 |
| `layers/L2-ENGINE/agent-comms/supervisor-pattern.md` | 新增 | Supervisor 模式说明 |
| `layers/L1-INTERACTION/phase-4-build/_SKILL.md` | 修改 | Wave 执行增加消息板读写步骤 |
| `layers/L2-ENGINE/README.md` | 修改 | 增加 agent-comms 模块说明 |
| `layers/L2-ENGINE/executor/_SKILL.md` | 修改 | Wave 执行器集成消息板 |
| `references/RULES-v3.md` | 修改 | 增加 R25: Agent 间通信规则 |

#### 3.1.4 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 定义 SendMessage 协议规范 | 2h | `sendmessage-protocol.md` |
| 2. 设计消息板文件格式 | 2h | 消息板模板 |
| 3. 编写 agent-comms SKILL.md | 3h | `_SKILL.md` + 3 个模式文档 |
| 4. 修改 Phase 4 Build SKILL | 3h | 集成消息板读写步骤 |
| 5. 修改 Wave Executor | 2h | 消息板初始化和汇总 |
| 6. 更新 RULES-v3.md | 1h | R25 规则 |
| 7. 测试：双 Agent 通信场景 | 3h | 验证 Pipeline/Fan-out/Supervisor |
| **合计** | **16h** | |

#### 3.1.5 验收标准

- [ ] Wave 内两个并行 Agent 能通过消息板互相通知变更
- [ ] Fan-out 模式：一个 Agent 的 schema 变更能通知所有依赖方
- [ ] Pipeline 模式：串行 Agent 能读取前置 Agent 的输出
- [ ] Supervisor 模式：主 Agent 能协调子 Agent
- [ ] 错误消息能被 Orchestrator 捕获并处理
- [ ] 现有 Wave 执行流程无回归

---

### 3.2 P0-3: 项目宪法分离

#### 3.2.1 问题分析

当前 `CONSTITUTION.md` 是"流程宪法"（规定 Phase 必须遵守的规则），而非"项目宪法"（定义项目的技术原则、代码质量标准、测试要求）。用户无法在一个地方声明项目级约束。

```
当前:
  CONSTITUTION.md = 流程宪法（Phase 规则、门控规则、提交规则）
  ❌ 无处声明: "本项目使用 React + TypeScript，测试覆盖率 ≥ 80%"
  ❌ 无处声明: "本项目禁止使用 moment.js，使用 dayjs"
  ❌ 无处声明: "本项目 API 必须遵循 RESTful 规范"
```

#### 3.2.2 设计方案

**来源**: Spec-Kit 的 constitution 文件 + gstack 的 setup 流程

**分离方案**:

| 文件 | 位置 | 性质 | 编写者 | 内容 |
|------|------|------|--------|------|
| `CONSTITUTION.md` | `layers/L1-INTERACTION/` | 流程宪法 | ForgeOS 团队 | Phase 规则、门控规则、提交规则（不变） |
| `PROJECT_CONSTITUTION.md` | `.forgeos/` | 项目宪法 | 用户 | 技术栈、代码质量标准、测试要求、禁止项 |

**PROJECT_CONSTITUTION.md 模板**:

```markdown
# 项目宪法

> 本文件定义项目级技术约束和原则，所有 Phase 执行必须遵守。
> 由项目团队编写和维护，ForgeOS 在每个 Phase 开始时自动加载。

## 技术栈

### 前端
- 框架: React 18+
- 语言: TypeScript 5+ (strict mode)
- 状态管理: Zustand
- 样式: Tailwind CSS

### 后端
- 框架: Node.js + Express / Fastify
- 语言: TypeScript 5+
- 数据库: PostgreSQL 15+
- ORM: Prisma

### 基础设施
- 容器: Docker + Docker Compose
- CI/CD: GitHub Actions
- 监控: Prometheus + Grafana

## 代码质量标准

- TypeScript strict mode: 必须开启
- ESLint: 必须配置，零 warning
- 测试覆盖率: ≥ 80% (行覆盖率)
- 函数最大长度: ≤ 50 行
- 文件最大长度: ≤ 300 行
- 圈复杂度: ≤ 10

## 测试要求

- 单元测试: 所有纯函数和工具类
- 集成测试: API 端点
- E2E 测试: 核心用户流程
- 测试框架: Vitest (单元/集成) + Playwright (E2E)

## 禁止项

- ❌ moment.js → 使用 dayjs
- ❌ any 类型 → 使用 unknown + 类型守卫
- ❌ console.log 生产代码 → 使用 logger
- ❌ 直接 DOM 操作 → 使用 React 状态驱动
- ❌ 同步文件操作 → 使用异步 API

## API 规范

- 风格: RESTful
- 版本: URL 版本 (/api/v1/)
- 认证: JWT Bearer Token
- 错误格式: { error: string, code: string, details?: any }

## 命名规范

- 文件: kebab-case (user-profile.tsx)
- 组件: PascalCase (UserProfile)
- 函数: camelCase (getUserProfile)
- 常量: SCREAMING_SNAKE_CASE (MAX_RETRY_COUNT)
- 数据库: snake_case (user_profile)
```

**加载机制**:

```
每个 Phase 开始时:
1. 检测 .forgeos/PROJECT_CONSTITUTION.md 是否存在
2. 存在 → 加载到 Agent 上下文
3. 不存在 → 提示用户运行 /forgeos:setup 生成
4. Phase 执行中检查是否违反项目宪法
5. 违反 → 标记为 P1 错误，要求修正
```

#### 3.2.3 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `cli/templates/PROJECT_CONSTITUTION.md` | 新增 | 项目宪法模板 |
| `layers/L1-INTERACTION/phase-0-strategy/_SKILL.md` | 修改 | Phase 0 检测项目宪法 |
| `SKILL.md` | 修改 | AI 行为约束增加"遵守项目宪法" |
| `references/RULES-v3.md` | 修改 | 增加 R26: 项目宪法规则 |
| `layers/L2-ENGINE/learning-workflow/memory-templates/` | 修改 | 增加 PROJECT_CONSTITUTION.md 模板 |

#### 3.2.4 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计 PROJECT_CONSTITUTION.md 模板 | 2h | 模板文件 |
| 2. 修改 Phase 0 增加项目宪法检测 | 2h | Phase 0 SKILL 更新 |
| 3. 修改 SKILL.md 增加宪法约束 | 1h | AI 行为约束更新 |
| 4. 增加 R26 规则 | 1h | RULES-v3 更新 |
| 5. 测试：项目宪法加载和违反检测 | 2h | 验证场景 |
| **合计** | **8h** | |

#### 3.2.5 验收标准

- [ ] `.forgeos/PROJECT_CONSTITUTION.md` 存在时自动加载
- [ ] 不存在时提示用户运行 setup
- [ ] Phase 执行中违反项目宪法被标记为 P1 错误
- [ ] 流程宪法和项目宪法互不干扰
- [ ] 项目宪法可由用户自由定制

---

### 3.3 P0-4: npx forgeos init 安装器

#### 3.3.1 问题分析

当前安装流程：
1. 手动复制 forgeos 目录到项目
2. 手动配置 hooks.json
3. 手动创建 .forgeos/ 目录结构
4. 手动配置 CLAUDE.md 引用

用户反馈：上手成本高，容易出错。

#### 3.3.2 设计方案

**来源**: BMAD-METHOD 的 `npx bmad-method install` + caveman 的安装脚本

**CLI 命令设计**:

```bash
# 初始化 ForgeOS（一键安装）
npx forgeos init

# 交互式项目设置（生成项目宪法等）
npx forgeos setup

# 查看帮助
npx forgeos help

# 升级到最新版本
npx forgeos upgrade
```

**`npx forgeos init` 执行流程**:

```
1. 检测宿主环境
   ├─ Claude Code → 安装 claude-code 适配器
   ├─ Cursor → 安装 cursor 适配器
   ├─ Copilot → 安装 copilot 适配器
   └─ Gemini CLI → 安装 gemini-cli 适配器

2. 创建目录结构
   .forgeos/
   ├── STATE.md
   ├── PROJECT_CONSTITUTION.md
   ├── memory/
   │   ├── PROJECT_CONTEXT.md
   │   ├── DECISIONS.md
   │   └── LESSONS.md
   └── comms/              # Agent 通信消息板
       └── message-board.md

3. 配置宿主
   - Claude Code: 写入 CLAUDE.md 引用 + 配置 .claude/settings.json
   - Cursor: 写入 .cursorrules + 配置 hooks
   - Copilot: 写入 .github/copilot-instructions.md
   - Gemini CLI: 写入 GEMINI.md

4. 检测技术栈
   - 读取 package.json / go.mod / requirements.txt / Cargo.toml
   - 自动生成 PROJECT_CONSTITUTION.md 草稿

5. 输出安装报告
   ✅ ForgeOS v1.0 安装完成
   📁 目录: .forgeos/
   🔧 宿主: Claude Code
   📦 技术栈: React + TypeScript + Node.js
   📋 下一步: 编辑 .forgeos/PROJECT_CONSTITUTION.md 定制项目约束
```

**`npx forgeos setup` 执行流程**:

```
1. 交互式问答
   ? 项目名称: (从 package.json 读取)
   ? 项目描述:
   ? 技术栈: (自动检测，可修改)
   ? 代码质量标准: (提供预设选项)
   ? 测试要求: (提供预设选项)
   ? 禁止项: (提供常见选项)

2. 生成文件
   - .forgeos/PROJECT_CONSTITUTION.md
   - .forgeos/memory/PROJECT_CONTEXT.md

3. 可选: 连接 GitNexus
   ? 是否启用代码知识图谱? (需要 SQLite)
   → 是 → 初始化 GitNexus 索引
```

**CLI 项目结构**:

```
cli/
├── package.json
│   ├── name: "forgeos-cli"
│   ├── bin: { "forgeos": "./bin/forgeos.js" }
│   └── dependencies: ["inquirer", "chalk", "fs-extra", "detect-package-manager"]
├── bin/
│   └── forgeos.js          # 入口
├── commands/
│   ├── init.js               # init 命令
│   ├── setup.js              # setup 命令
│   ├── help.js               # help 命令
│   └── upgrade.js            # upgrade 命令
├── lib/
│   ├── detector.js           # 宿主环境检测
│   ├── tech-stack.js         # 技术栈检测
│   ├── file-generator.js     # 文件生成
│   └── adapter-installer.js  # 适配器安装
└── templates/
    ├── STATE.md
    ├── PROJECT_CONSTITUTION.md
    ├── PROJECT_CONTEXT.md
    ├── DECISIONS.md
    ├── LESSONS.md
    ├── CLAUDE.md              # Claude Code 宿主模板
    ├── .cursorrules           # Cursor 宿主模板
    └── metadata.json
```

#### 3.3.3 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 初始化 CLI 项目 (package.json + 入口) | 2h | CLI 骨架 |
| 2. 实现宿主环境检测器 | 3h | detector.js |
| 3. 实现技术栈检测器 | 3h | tech-stack.js |
| 4. 实现 init 命令 | 4h | init.js + 文件生成 |
| 5. 实现 setup 命令 | 3h | setup.js + 交互问答 |
| 6. 实现 help 命令 | 1h | help.js |
| 7. 编写安装模板 | 2h | templates/ 目录 |
| 8. 测试：各宿主环境安装 | 4h | 验证 Claude Code/Cursor/Copilot |
| **合计** | **22h** | |

#### 3.3.4 验收标准

- [ ] `npx forgeos init` 一键完成安装
- [ ] 自动检测宿主环境并安装对应适配器
- [ ] 自动检测技术栈并生成 PROJECT_CONSTITUTION.md 草稿
- [ ] `npx forgeos setup` 交互式生成项目配置
- [ ] 支持 Claude Code / Cursor / Copilot / Gemini CLI 四种宿主
- [ ] 安装后 ForgeOS 可立即使用

---

### 3.4 P1-4: Token 监控 Hook

#### 3.4.1 问题分析

R6 定义了 Token 压缩策略（>70% 自动压缩，>90% 暂停），但缺乏运行时监控和自动触发机制。当前 `context-monitor.js` 仅做范围蔓延预警，不做 Token 预算控制。

#### 3.4.2 设计方案

**来源**: caveman 的 caveman-stats + Ruflo 的 context-monitor Hook

**Token 监控 Hook 设计**:

```json
{
  "token-monitor": {
    "script": "scripts/token-monitor.js",
    "type": "post_tool_use",
    "description": "Token 预算运行时监控（自动压缩/暂停/实时显示）",
    "gates": [],
    "timeout_ms": 3000,
    "fail_action": "advisory",
    "scope": "advisory",
    "config": {
      "budget_model": "claude-sonnet-4-6",
      "total_budget": 200000,
      "thresholds": {
        "advisory": 0.5,
        "compress": 0.7,
        "pause": 0.9
      },
      "auto_actions": {
        "compress": "surface-switch lite",
        "pause": "等待用户确认继续"
      }
    }
  }
}
```

**监控逻辑**:

```javascript
// token-monitor.js 核心逻辑
function checkTokenBudget(context) {
  const used = context.tokens_used;
  const total = context.tokens_budget;
  const ratio = used / total;

  if (ratio >= 0.9) {
    return {
      level: 'CRITICAL',
      action: 'PAUSE',
      message: `⚠️ Token 使用率 ${Math.round(ratio*100)}%，已超过 90% 阈值。建议：1) compact 压缩上下文 2) 结束当前 Phase 3) 用户确认继续`,
      auto_trigger: 'pause'
    };
  }

  if (ratio >= 0.7) {
    return {
      level: 'WARNING',
      action: 'COMPRESS',
      message: `📊 Token 使用率 ${Math.round(ratio*100)}%，已超过 70% 阈值。自动切换到 lite 压缩模式。`,
      auto_trigger: 'surface-switch lite'
    };
  }

  if (ratio >= 0.5) {
    return {
      level: 'ADVISORY',
      action: 'MONITOR',
      message: `📈 Token 使用率 ${Math.round(ratio*100)}%，建议关注消耗趋势。`,
      auto_trigger: null
    };
  }

  return { level: 'OK', action: 'NONE' };
}
```

**Statusline 集成**:

```
ForgeOS Token: ████████░░ 78% | Mode: lite | Saved: 12.3K
```

#### 3.4.3 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 编写 token-monitor.js Hook 脚本 | 3h | Hook 脚本 |
| 2. 更新 hooks.json 注册 Token 监控 | 1h | 配置更新 |
| 3. 集成 surface-switch 自动压缩 | 2h | 自动触发逻辑 |
| 4. 增加 Statusline 显示 | 2h | Token 消耗可视化 |
| 5. 测试：各阈值触发场景 | 2h | 验证 50%/70%/90% |
| **合计** | **10h** | |

#### 3.4.4 验收标准

- [ ] Token 使用率 >50% 显示 ADVISORY 提醒
- [ ] Token 使用率 >70% 自动切换 lite 压缩模式
- [ ] Token 使用率 >90% 暂停执行等待用户确认
- [ ] Statusline 实时显示 Token 消耗
- [ ] 不影响现有 context-monitor.js 功能

---

### Phase 1 总工时与里程碑

| 周次 | 工作内容 | 工时 |
|------|---------|------|
| 第 1 周 (Day 1-3) | P0-1 Agent 通信 | 16h |
| 第 1 周 (Day 4-5) | P0-3 项目宪法 | 8h |
| 第 2 周 (Day 1-4) | P0-4 安装器 | 22h |
| 第 2 周 (Day 5) | P1-4 Token 监控 | 10h |
| **合计** | | **56h (~1.5 周)** |

---

## 四、Phase 2 — 质量提升（2-3 周）

> **目标**: 解决 5 个 P1 级质量问题
> **前置条件**: Phase 1 完成（Agent 通信是实时审查的前置依赖）
> **验收标准**: 5 个 P1 特性全部可用

### 4.1 P0-2: 向量记忆系统

#### 4.1.1 问题分析

当前 LESSONS.md 是纯文本，缺乏：
- 语义搜索能力（只能全文匹配）
- 向量化表示（无法做相似性匹配）
- 自动去重和聚类
- 跨项目的经验迁移

#### 4.1.2 设计方案

**来源**: Ruflo 的 AgentDB + HNSW 向量检索

**架构设计**:

```
向量记忆系统架构:

┌─────────────────────────────────────────┐
│  Vector Memory Manager                   │
│                                          │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ Markdown    │  │ Vector Index     │  │
│  │ Interface   │  │ (HNSW)           │  │
│  │ (兼容层)    │  │                  │  │
│  └──────┬──────┘  └────────┬─────────┘  │
│         │                  │             │
│  ┌──────┴──────────────────┴─────────┐  │
│  │  Storage Layer                     │  │
│  │  ┌──────────┐  ┌───────────────┐  │  │
│  │  │ LESSONS  │  │ embeddings.db │  │  │
│  │  │ .md      │  │ (SQLite+vec)  │  │  │
│  │  └──────────┘  └───────────────┘  │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**关键设计决策**:

1. **Markdown 兼容接口**: 保留 LESSONS.md 作为人类可读的接口，向量索引作为机器检索的加速层
2. **嵌入方式**: 使用本地嵌入模型（如 `all-MiniLM-L6-v2` via ONNX Runtime）或 API 嵌入
3. **索引存储**: SQLite + vec 扩展（轻量级，无需额外服务）
4. **检索模式**: 混合检索（BM25 全文 + HNSW 向量 + RRF 融合）

**数据模型**:

```sql
-- embeddings.db
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,           -- lesson slug (e.g., "token-refresh-retry")
  content TEXT NOT NULL,         -- 完整 Markdown 内容
  summary TEXT,                  -- 一句话摘要（用于嵌入）
  category TEXT,                 -- 分类: pattern/pitfall/best-practice
  tags TEXT,                     -- JSON 数组标签
  frequency INTEGER DEFAULT 1,   -- 出现频率
  created_at TEXT,
  updated_at TEXT
);

CREATE VIRTUAL TABLE lessons_vec USING vec0(
  id TEXT,
  embedding float[384]           -- all-MiniLM-L6-v2 维度
);
```

**检索 API**:

```markdown
# 向量记忆检索

## 搜索接口
search_lessons(query: string, top_k: int = 5, threshold: float = 0.7) → List[Lesson]

## 使用场景
- Phase 4 Wave 开始: 搜索与当前任务相关的历史经验
- Phase 6 审查: 搜索与审查发现相关的历史教训
- Phase 8 归档: 去重检查，避免重复记录

## 降级策略
- 无 SQLite → 退化为 LESSONS.md 全文搜索
- 无嵌入模型 → 退化为 BM25 关键词搜索
- 完全无运行时 → 退化为 Markdown 人工搜索
```

**迁移策略**:

```
LESSONS.md → 向量记忆迁移:

1. 读取现有 LESSONS.md
2. 解析每个条目（按 ## 标题分割）
3. 为每个条目生成摘要
4. 计算嵌入向量
5. 写入 embeddings.db
6. 保留 LESSONS.md 作为备份
7. 后续写入同时更新 LESSONS.md 和 embeddings.db
```

#### 4.1.3 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计向量记忆数据模型 | 3h | SQL schema + 接口定义 |
| 2. 实现 Vector Memory Manager | 8h | 核心管理器（CRUD + 搜索） |
| 3. 实现嵌入生成（本地/API 双模式） | 6h | 嵌入服务 |
| 4. 实现 HNSW 索引构建 | 4h | 索引构建器 |
| 5. 实现混合检索（BM25 + HNSW + RRF） | 6h | 检索引擎 |
| 6. 实现 LESSONS.md 迁移工具 | 4h | 迁移脚本 |
| 7. 修改 LearningWorkflow 集成向量记忆 | 4h | L2 集成 |
| 8. 修改 Phase 4/6/8 使用向量检索 | 4h | L1 集成 |
| 9. 编写 _SKILL.md 和迁移指南 | 3h | 文档 |
| 10. 测试：检索准确率 + 降级场景 | 4h | 验证 |
| **合计** | **46h** | |

#### 4.1.4 验收标准

- [ ] 语义搜索准确率比全文匹配提升 3x+
- [ ] 混合检索（BM25 + 向量）比单一检索更准确
- [ ] LESSONS.md 现有数据可平滑迁移
- [ ] 无 SQLite 时自动降级为全文搜索
- [ ] 写入同时更新 Markdown 和向量索引
- [ ] 检索延迟 < 100ms（本地模式）

---

### 4.2 P1-1: Wave 实时审查

#### 4.2.1 设计方案

**来源**: Superpowers 的 Subagent-Driven Development 两阶段审查

**当前问题**: 审查全部集中在 Phase 6，Phase 4 实施阶段没有中间审查点。

**解决方案**: Phase 4 每个 Wave 完成后增加轻量级实时审查。

**实时审查流程**:

```
Phase 4 Wave N 完成
  │
  ├─ Step 1: Spec Compliance Check (规格合规检查)
  │   ├─ 比对实现 vs 设计文档
  │   ├─ 检查是否遗漏需求
  │   └─ 输出: compliance_report.md
  │
  ├─ Step 2: Code Quality Quick Scan (代码质量快速扫描)
  │   ├─ 检查 console.log 残留
  │   ├─ 检查 any 类型
  │   ├─ 检查未处理的错误
  │   └─ 输出: quality_scan.md
  │
  ├─ Step 3: Change Boundary Check (变更边界检查) ← P2-2 提前集成
  │   ├─ 比对修改文件列表 vs 任务声明的文件范围
  │   ├─ 标记越界修改
  │   └─ 输出: boundary_report.md
  │
  └─ Step 4: Decision (审查决策)
      ├─ PASS → 继续下一 Wave
      ├─ WARN → 通知用户，继续（标记 Phase 6 重点审查）
      └─ FAIL → 暂停，修复后重试
```

**审查级别**:

| Wave 类型 | 审查级别 | 耗时 |
|-----------|---------|------|
| Wave 1 (基础层) | Light — 仅 Step 1 | ~30s |
| Wave 2-N (依赖层) | Standard — Step 1+2 | ~1min |
| 最后一个 Wave | Full — Step 1+2+3 | ~2min |

#### 4.2.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计实时审查流程和模板 | 2h | 审查模板 |
| 2. 编写 real-time-review _SKILL.md | 3h | 技能定义 |
| 3. 修改 Phase 4 Build SKILL 集成审查 | 3h | Phase 4 更新 |
| 4. 实现合规检查逻辑 | 4h | spec-compliance checker |
| 5. 实现质量快速扫描 | 3h | quality-scanner |
| 6. 测试：各审查级别场景 | 2h | 验证 |
| **合计** | **17h** | |

#### 4.2.3 验收标准

- [ ] 每个 Wave 完成后自动触发实时审查
- [ ] 规格合规检查能发现遗漏需求
- [ ] 质量扫描能检测 console.log/any 类型
- [ ] 审查结果写入 .forgeos/<req-id>/reviews/
- [ ] FAIL 级别问题能暂停 Wave 执行
- [ ] Phase 6 审查能参考实时审查结果

---

### 4.3 P1-2: 浏览器 QA

#### 4.3.1 设计方案

**来源**: gstack 的 `/qa` 真实浏览器测试 + Playwright

**Phase 5 浏览器 QA 子阶段**:

```
Phase 5 测试验证
  │
  ├─ Step 1: 代码级测试 (现有)
  │   ├─ 单元测试
  │   ├─ 集成测试
  │   └─ G6 Gate
  │
  └─ Step 2: 浏览器 QA (新增) ← 仅前端/UI 项目
      ├─ 2.1 自动生成 Playwright 测试
      │   ├─ 基于设计文档生成测试用例
      │   ├─ 基于用户流程生成 E2E 场景
      │   └─ 输出: e2e/<feature>.spec.ts
      │
      ├─ 2.2 执行浏览器测试
      │   ├─ 启动 Playwright
      │   ├─ 执行测试用例
      │   ├─ 截图对比
      │   └─ 输出: test-results/
      │
      ├─ 2.3 Bug 报告
      │   ├─ 自动生成 Bug 报告（含截图）
      │   ├─ 分级: P0(崩溃)/P1(功能异常)/P2(UI瑕疵)
      │   └─ 输出: .forgeos/<req-id>/browser-qa-report.md
      │
      └─ 2.4 G6.5 Gate (浏览器 QA 门控)
          ├─ P0 Bug → Gate FAIL
          ├─ P1 Bug → Gate WARN (用户确认)
          └─ P2 Bug → Gate PASS (记录)
```

**Playwright 测试生成模板**:

```typescript
// e2e/<feature>.spec.ts — 由 ForgeOS 自动生成
import { test, expect } from '@playwright/test';

test.describe('<Feature Name>', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/<route>');
  });

  test('should <behavior>', async ({ page }) => {
    // Arrange
    await page.locator('<selector>').fill('<value>');

    // Act
    await page.locator('<button-selector>').click();

    // Assert
    await expect(page.locator('<result-selector>')).toBeVisible();
    await expect(page).toHaveScreenshot('<feature>-<state>.png');
  });
});
```

**降级策略**:

| 环境 | 浏览器 QA 能力 |
|------|--------------|
| Node.js + Playwright 安装 | 完整浏览器 QA |
| Node.js 无 Playwright | 提示安装 `npx playwright install` |
| 无 Node.js | 跳过浏览器 QA，仅代码级测试 |
| 非前端项目 | 自动跳过浏览器 QA |

#### 4.3.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计浏览器 QA 流程和模板 | 2h | 流程文档 |
| 2. 编写 browser-qa _SKILL.md | 3h | 技能定义 |
| 3. 编写 Playwright 测试生成模板 | 3h | 测试模板 |
| 4. 修改 Phase 5 Test SKILL 增加浏览器 QA | 3h | Phase 5 更新 |
| 5. 增加 G6.5 Gate 定义 | 1h | Gate 规则 |
| 6. 测试：Playwright E2E 场景 | 4h | 验证 |
| **合计** | **16h** | |

#### 4.3.3 验收标准

- [ ] 前端项目 Phase 5 自动生成 Playwright 测试
- [ ] 测试执行后自动截图和对比
- [ ] Bug 报告含截图和分级
- [ ] G6.5 Gate 正确阻断/放行
- [ ] 非前端项目自动跳过
- [ ] 无 Playwright 时优雅降级

---

### 4.4 P1-3: OWASP/STRIDE 结构化安全审计

#### 4.4.1 设计方案

**来源**: gstack 的 `/cso` (OWASP Top 10 + STRIDE 威胁建模)

**Phase 6 安全审查增强**:

```
Phase 6 三层对抗审查
  │
  ├─ Layer 1: 代码质量审查 (现有)
  │
  ├─ Layer 2: 安全审查 (增强)
  │   ├─ 2.1 OWASP Top 10 逐项检查 ← 新增
  │   │   ├─ A01: Broken Access Control
  │   │   ├─ A02: Cryptographic Failures
  │   │   ├─ A03: Injection
  │   │   ├─ A04: Insecure Design
  │   │   ├─ A05: Security Misconfiguration
  │   │   ├─ A06: Vulnerable Components
  │   │   ├─ A07: Auth Failures
  │   │   ├─ A08: Data Integrity Failures
  │   │   ├─ A09: Logging Failures
  │   │   └─ A10: SSRF
  │   │
  │   └─ 2.2 STRIDE 威胁建模 ← 新增
  │       ├─ Spoofing (欺骗)
  │       ├─ Tampering (篡改)
  │       ├─ Repudiation (抵赖)
  │       ├─ Information Disclosure (信息泄露)
  │       ├─ Denial of Service (拒绝服务)
  │       └─ Elevation of Privilege (权限提升)
  │
  └─ Layer 3: 架构审查 (现有)
```

**OWASP Top 10 检查清单模板**:

```markdown
# OWASP Top 10 安全检查清单

## A01: Broken Access Control
- [ ] 所有 API 端点有权限检查
- [ ] 用户只能访问自己的资源
- [ ] 管理功能有额外权限验证
- [ ] CORS 配置正确
- 发现: <自动填充>

## A02: Cryptographic Failures
- [ ] 敏感数据传输使用 HTTPS
- [ ] 密码使用 bcrypt/argon2 哈希
- [ ] JWT 密钥强度足够
- [ ] 敏感数据加密存储
- 发现: <自动填充>

... (A03-A10 类似)
```

**STRIDE 威胁建模模板**:

```markdown
# STRIDE 威胁建模

## 数据流图
<自动从设计文档提取>

## 威胁分析

| 组件 | 威胁类型 | 威胁描述 | 影响 | 缓解措施 | 状态 |
|------|---------|---------|------|---------|------|
| Login API | Spoofing | 攻击者伪造身份 | 高 | JWT 签名验证 | ✅ |
| User DB | Tampering | SQL 注入修改数据 | 高 | 参数化查询 | ✅ |
| Payment | Repudiation | 否认交易 | 中 | 审计日志 | ❌ |
| Profile API | Info Disclosure | 用户信息泄露 | 高 | 字段过滤 | ✅ |
| Search | DoS | 恶意查询耗尽资源 | 中 | 速率限制 | ⚠️ |
| Admin API | EoP | 普通用户获取管理员权限 | 高 | RBAC | ✅ |
```

#### 4.4.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 编写 OWASP Top 10 检查清单 | 3h | `references/owasp-top10-checklist.md` |
| 2. 编写 STRIDE 威胁建模模板 | 3h | `references/stride-threat-model.md` |
| 3. 编写 owasp-stride 专家 SKILL | 3h | `phase-6-review/specialists/owasp-stride.md` |
| 4. 修改 Phase 6 Review SKILL 集成 | 2h | Phase 6 更新 |
| 5. 修改 security-reviewer Agent | 2h | Agent 定义更新 |
| 6. 测试：安全审计场景 | 2h | 验证 |
| **合计** | **15h** | |

#### 4.4.3 验收标准

- [ ] Phase 6 安全审查自动执行 OWASP Top 10 逐项检查
- [ ] STRIDE 威胁建模覆盖所有数据流组件
- [ ] 检查结果结构化输出（非自由文本）
- [ ] 发现的安全问题按严重程度分级
- [ ] 安全审查结果可被 Phase 6 Gate 引用

---

### 4.5 P1-5: MCP 工具瘦身

#### 4.5.1 设计方案

**来源**: caveman-shrink MCP 中间件 + Task Master 的三级工具加载

**三级工具加载策略**:

| 级别 | 工具数 | 加载条件 | Token 占用 |
|------|--------|---------|-----------|
| **Core** | 7 | 始终加载 | ~2K |
| **Standard** | 15 | Phase 匹配时加载 | ~5K |
| **All** | 36+ | 用户显式请求 | ~12K |

**MCP 工具描述压缩**:

```
原始描述 (~200 tokens):
  "Searches the codebase for patterns using ripgrep. Supports full regex syntax.
   Filter with glob patterns or file types. Returns matching lines with context.
   Use -A/-B for surrounding lines. Use output_mode for different formats..."

压缩描述 (~50 tokens, 75% 节省):
  "rg search: regex pattern, glob filter, output_mode=content|files|count, -A/-B context"
```

**实现方式**:

```json
// mcp-shrink-config.json
{
  "tools": {
    "task-master": {
      "core": ["parse-prd", "add-task", "list-tasks", "set-status", "update-task", "next-task", "complexity-report"],
      "standard": ["expand-task", "analyze-project", "add-subtask", "move-task", "remove-task", ...],
      "all": ["research", "validate-dependencies", ...]
    }
  },
  "compression": {
    "mode": "aggressive",
    "max_description_tokens": 50,
    "preserve": ["required_params", "return_type"]
  }
}
```

#### 4.5.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计三级工具加载配置格式 | 2h | mcp-shrink-config.json schema |
| 2. 增强 caveman-shrink 支持三级加载 | 4h | caveman-shrink 更新 |
| 3. 编写 mcp-shrink _SKILL.md | 2h | 技能定义 |
| 4. 修改 surface-switch 集成 MCP 瘦身 | 2h | surface-switch 更新 |
| 5. 测试：各级别工具加载 | 2h | 验证 Token 节省 |
| **合计** | **12h** | |

#### 4.5.3 验收标准

- [ ] Core 级别工具始终加载，Token 占用 ≤ 2K
- [ ] Standard 级别按 Phase 匹配加载
- [ ] 工具描述压缩率 ≥ 70%
- [ ] surface-switch 可动态切换工具级别
- [ ] 现有 MCP 工具功能无损失

---

### Phase 2 总工时与里程碑

| 周次 | 工作内容 | 工时 |
|------|---------|------|
| 第 3-4 周 | P0-2 向量记忆系统 | 46h |
| 第 4 周 (后半) | P1-1 Wave 实时审查 | 17h |
| 第 5 周 (前半) | P1-2 浏览器 QA | 16h |
| 第 5 周 (后半) | P1-3 OWASP/STRIDE | 15h |
| 第 5 周 (末) | P1-5 MCP 瘦身 | 12h |
| **合计** | | **106h (~2.7 周)** |

---

## 五、Phase 3 — 体验优化（1-2 周）

> **目标**: 6 个 P2 级体验优化
> **前置条件**: Phase 1 完成
> **验收标准**: 6 个 P2 特性全部可用

### 5.1 P1-6: Design 品味记忆

#### 5.1.1 设计方案

**来源**: gstack 的 gstack-taste-update 品味学习

Phase 2a 设计枪战选择结果写入 `.forgeos/memory/DESIGN_PREFERENCES.md`：

```markdown
# 设计品味记忆

> 本文件记录用户的设计偏好，由 Phase 2a 自动更新。

## UI 风格偏好
- 布局: 简洁、留白多、信息密度低
- 配色: 深色主题、低饱和度
- 字体: 无衬线、大字号
- 动画: 最少化、功能性动画

## 组件偏好
- 表单: 单列布局、内联验证
- 导航: 侧边栏 > 顶部导航
- 数据展示: 表格 > 卡片
- 反馈: Toast > Modal

## 历史选择记录
| 日期 | 项目 | 选择 | 理由 |
|------|------|------|------|
| 2026-05-29 | Dashboard | 变体 B (深色) | 用户偏好深色主题 |
| 2026-05-28 | Login Page | 变体 A (极简) | 用户偏好简洁布局 |
```

**加载机制**: Phase 2a 开始时读取 DESIGN_PREFERENCES.md，AI 优先推荐符合用户品味的设计变体。

#### 5.1.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计 DESIGN_PREFERENCES.md 模板 | 1h | 模板 |
| 2. 修改 Phase 2a Shotgun SKILL | 2h | 品味记忆读写 |
| 3. 测试：跨会话品味记忆 | 1h | 验证 |
| **合计** | **4h** | |

---

### 5.2 P2-1: Phase 0 推回机制

#### 5.2.1 设计方案

**来源**: gstack 的 Office Hours "push back" 模式

Phase 0 YC 六问收集后增加"推回轮次"：

```
Phase 0 YC 六问
  │
  ├─ Step 1: 收集六问回答 (现有)
  │
  └─ Step 2: 推回轮次 (新增) ← Standard/Strict 模式
      ├─ AI 分析回答中的前提假设
      ├─ 选择最值得挑战的 1-2 个前提
      ├─ 构造推回论点
      └─ 用户回应推回 → 更新需求理解
```

**推回模板**:

```markdown
## 🤔 推回挑战

我注意到你的回答中有一个关键前提值得讨论：

**前提**: "用户需要实时协作功能"
**挑战**: 实时协作增加了 80% 的技术复杂度（WebSocket、冲突解决、状态同步），
         但你的目标用户是个人开发者。是否真的需要实时，还是异步通知就足够？

[1] 维持原需求 — 实时协作是核心卖点
[2] 降级为异步通知 — 降低复杂度，MVP 更快
[3] 延迟到 v2 — 先做核心功能，v2 加实时
```

#### 5.2.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计推回机制流程 | 1h | 流程文档 |
| 2. 修改 Phase 0 Strategy SKILL | 2h | 增加推回轮次 |
| 3. 测试：推回场景 | 1h | 验证 |
| **合计** | **4h** | |

---

### 5.3 P2-2: 变更边界检查

#### 5.3.1 设计方案

**来源**: Karpathy Skills 的 Surgical Changes

Phase 4 每个 Task 开始前声明变更范围，提交前比对：

```
Task 开始:
  声明变更范围: ["src/auth/login.ts", "src/auth/types.ts"]

Task 完成:
  实际修改文件: ["src/auth/login.ts", "src/auth/types.ts", "src/utils/helpers.ts"]
                                                    ↑ 越界修改！

检查结果:
  ✅ src/auth/login.ts — 在范围内
  ✅ src/auth/types.ts — 在范围内
  ⚠️ src/utils/helpers.ts — 越界修改！请确认是否必要
```

#### 5.3.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 编写 change-boundary-guard _SKILL.md | 2h | 技能定义 |
| 2. 修改 Phase 4 Build SKILL | 2h | 集成边界检查 |
| 3. 测试：越界检测场景 | 1h | 验证 |
| **合计** | **5h** | |

---

### 5.4 P2-3: 假设声明步骤

#### 5.4.1 设计方案

**来源**: Karpathy Skills 的 Think Before Coding

Phase 4 每个 Task 开始前增加"假设声明"步骤：

```markdown
## Task: auth-service-login

### 假设声明 (开始前必填)
- [假设1] JWT token 有效期 24 小时 → 需确认: 是否需要 refresh token?
- [假设2] 密码使用 bcrypt 哈希 → 需确认: 是否需要 argon2?
- [假设3] 登录失败返回通用错误消息 → 需确认: 是否需要区分"用户不存在"和"密码错误"?

### 不确定项
- refresh token 策略 → 需要用户确认
- 密码哈希算法 → 使用项目宪法中的规定

### 执行计划
1. 实现 login 函数 (基于已确认假设)
2. 实现 token 生成
3. 实现错误处理
```

#### 5.4.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 编写 assumption-declaration _SKILL.md | 2h | 技能定义 |
| 2. 修改 Phase 4 Build SKILL | 2h | 集成假设声明 |
| 3. 测试：假设声明场景 | 1h | 验证 |
| **合计** | **5h** | |

---

### 5.5 P2-5: Preset 扩展系统

#### 5.5.1 设计方案

**来源**: Spec-Kit 的 Extension/Preset 系统

**Preset 文件格式**:

```yaml
# .forgeos/presets/my-team.yaml
name: my-team-preset
description: 我团队的定制预设

overrides:
  phase-0:
    skip: true                    # 跳过 Phase 0
  phase-2a:
    variants: 3                   # 减少设计变体数量 (默认 4-6)
  phase-4:
    assumption_declaration: true   # 启用假设声明
    change_boundary_check: true    # 启用变更边界检查
    wip_checkpoint: true           # 启用 WIP 自动保存
  phase-5:
    browser_qa: true               # 启用浏览器 QA
  phase-6:
    owasp_stride: true             # 启用 OWASP/STRIDE 审计
    red_flags: true                # 启用 Red Flags 检查

rules:
  additional:
    - "所有 API 必须有 OpenAPI 文档"
    - "数据库迁移必须有 rollback 脚本"

agents:
  additional:
    - name: db-migration-reviewer
      phase: P6
      description: "数据库迁移审查专家"
```

**默认预设**:

| 预设 | 适用场景 | 特点 |
|------|---------|------|
| `minimal` | 个人项目/原型 | 跳过 P0/P1/P2a/P3/P7/P8，Fast 模式为主 |
| `standard` | 团队项目 | 默认配置，Standard 模式 |
| `enterprise` | 企业项目 | 全量 Phase + OWASP/STRIDE + 浏览器 QA |

#### 5.5.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计 Preset YAML schema | 2h | schema 定义 |
| 2. 编写 preset-system _SKILL.md | 2h | 技能定义 |
| 3. 编写 3 个默认预设 | 2h | minimal/standard/enterprise |
| 4. 修改 SKILL.md 增加 Preset 加载 | 2h | 主文件更新 |
| 5. 修改 CLI 增加 preset 选项 | 2h | CLI 更新 |
| 6. 测试：预设加载和覆盖 | 2h | 验证 |
| **合计** | **12h** | |

---

### 5.6 P2-4: WIP 自动保存

#### 5.6.1 设计方案

**来源**: gstack 的 Checkpoint 模式

Phase 4 长时间执行中自动保存 WIP（Work In Progress）：

```
WIP Checkpoint 机制:

触发条件:
  - 每 3 个 Task 完成
  - Token 使用率 > 60%
  - Phase 转换时

保存内容:
  git add -A
  git commit -m "wip(forgeos): phase-4 wave-N checkpoint"

恢复机制:
  会话中断 → 读取 STATE.md → 找到最后 checkpoint → 从断点继续
```

#### 5.6.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 编写 wip-checkpoint _SKILL.md | 2h | 技能定义 |
| 2. 修改 Phase 4 Build SKILL | 2h | 集成 checkpoint |
| 3. 修改 STATE.md 增加断点记录 | 1h | STATE.md 更新 |
| 4. 测试：中断恢复场景 | 2h | 验证 |
| **合计** | **7h** | |

---

### Phase 3 总工时与里程碑

| 工作内容 | 工时 |
|---------|------|
| P1-6 Design 品味记忆 | 4h |
| P2-1 Phase 0 推回机制 | 4h |
| P2-2 变更边界检查 | 5h |
| P2-3 假设声明步骤 | 5h |
| P2-5 Preset 扩展系统 | 12h |
| P2-4 WIP 自动保存 | 7h |
| **合计** | **37h (~1 周)** |

---

## 六、Phase 4 — 深度集成（2-4 周）

> **目标**: 5 个深度集成特性，需要较大架构变更
> **前置条件**: Phase 1-3 完成
> **验收标准**: 5 个深度集成特性全部可用

### 6.1 GitNexus 深度集成

#### 6.1.1 设计方案

**来源**: GitNexus 的知识图谱 + AST 解析 + Blast Radius Analysis

**集成点**:

| Phase | GitNexus 工具 | 用途 |
|-------|-------------|------|
| Phase 0 | `context` | Brownfield 入场检测，自动理解代码结构 |
| Phase 2 | `impact` | 设计方案的影响分析 |
| Phase 4 | `context` + `search` | 编码时的代码搜索和理解 |
| Phase 5 | `impact` | 测试范围确定（Blast Radius） |
| Phase 6 | `impact` | 审查时的影响分析 |

**Blast Radius Analysis 集成**:

```
Phase 5 测试范围确定:
  1. 调用 GitNexus impact 分析变更影响
  2. 按深度和置信度分组:
     - 高置信度直接影响 → 必须测试
     - 中置信度间接影响 → 推荐测试
     - 低置信度可能影响 → 可选测试
  3. 自动生成测试计划
```

**Auto-generated Repo Skills**:

```
Phase 0 入场检测:
  1. 调用 GitNexus 分析代码库结构
  2. 识别功能区域 (auth, payment, search, ...)
  3. 为每个区域生成专属技能描述
  4. 写入 .forgeos/memory/domain-skills/
```

#### 6.1.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计 GitNexus 深度集成接口 | 3h | 接口定义 |
| 2. 编写 blast-radius _SKILL.md | 3h | 技能定义 |
| 3. 修改 Phase 0/2/4/5/6 集成 GitNexus | 6h | Phase 更新 |
| 4. 实现 Auto-generated Repo Skills | 4h | 自动技能生成 |
| 5. 测试：Brownfield 项目场景 | 4h | 验证 |
| **合计** | **20h** | |

---

### 6.2 PRD 自动解析

#### 6.2.1 设计方案

**来源**: Task Master 的 `task-master parse-prd`

Phase 3 集成 PRD 自动解析能力：

```
Phase 3 任务拆分 (增强):
  │
  ├─ Step 1: PRD 解析 (新增)
  │   ├─ 读取 PRD/需求文档
  │   ├─ 提取功能点
  │   ├─ 识别依赖关系
  │   └─ 输出: task-candidates.json
  │
  ├─ Step 2: 任务 DAG 构建 (现有，增强)
  │   ├─ 基于 task-candidates.json 构建 DAG
  │   ├─ 自动识别依赖
  │   └─ 输出: Wave 计划
  │
  └─ Step 3: 用户确认 (现有)
```

#### 6.2.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计 PRD 解析模板 | 2h | 解析模板 |
| 2. 修改 Phase 3 Task Plan SKILL | 3h | 集成 PRD 解析 |
| 3. 测试：PRD 解析场景 | 2h | 验证 |
| **合计** | **7h** | |

---

### 6.3 Party Mode 多角色辩论

#### 6.3.1 设计方案

**来源**: BMAD-METHOD 的 Party Mode

Phase 1b 决策捕获引入多角色辩论模式：

```
Phase 1b Discuss (增强):
  │
  ├─ 模式 A: 单人讨论 (现有)
  │
  └─ 模式 B: Party Mode 多角色辩论 (新增) ← Strict 模式
      ├─ 角色: architect + reviewer + planner
      ├─ 议题: 技术选型/架构决策
      ├─ 流程:
      │   1. architect 提出方案
      │   2. reviewer 挑战方案
      │   3. planner 评估可行性
      │   4. 综合讨论 → 决策
      └─ 输出: decision-record.md (含各方论点)
```

#### 6.3.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 增强 party-mode _SKILL.md | 2h | 技能更新 |
| 2. 修改 Phase 1b Discuss SKILL | 2h | 集成 Party Mode |
| 3. 测试：多角色辩论场景 | 2h | 验证 |
| **合计** | **6h** | |

---

### 6.4 执行轨迹学习

#### 6.4.1 设计方案

**来源**: Ruflo 的 SONA 自学习 + ReasoningBank

增强 LearningWorkflow，增加执行轨迹记录：

```
LearningWorkflow (增强):
  │
  ├─ 通道 A: 流程沉淀 (现有)
  │   └─ LESSONS.md → Domain Skills
  │
  ├─ 通道 B: 模式提取 (现有)
  │   └─ Agent-Eval → Learned Skills
  │
  └─ 通道 C: 轨迹学习 (新增)
      ├─ 记录每个 Task 的执行轨迹
      │   ├─ 输入: 任务描述 + 上下文
      │   ├─ 过程: 关键决策点 + 选择的理由
      │   └─ 输出: 结果 + 验证状态
      ├─ 轨迹聚类: 相似轨迹归组
      ├─ 模式提取: 从成功轨迹提取最佳实践
      └─ 失败轨迹: 记录失败路径，避免重复
```

#### 6.4.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计轨迹记录格式 | 2h | 轨迹 schema |
| 2. 修改 LearningWorkflow 增加轨迹通道 | 4h | L2 更新 |
| 3. 修改 Phase 4 记录执行轨迹 | 3h | Phase 4 更新 |
| 4. 实现轨迹聚类和模式提取 | 4h | 聚类算法 |
| 5. 测试：轨迹学习场景 | 2h | 验证 |
| **合计** | **15h** | |

---

### 6.5 Delta Specs 完善

#### 6.5.1 设计方案

**来源**: OpenSpec 的 opsx 流程

完善 R11 Delta Specs 的模板、校验和合并策略：

```
Delta Specs (完善):
  │
  ├─ 模板 (新增)
  │   └─ delta-spec-template.md
  │       ├─ base: 基线版本引用
  │       ├─ additions: 新增内容
  │       ├─ modifications: 修改内容
  │       └─ deletions: 删除内容
  │
  ├─ 校验 (新增)
  │   └─ delta-spec-validator.js
  │       ├─ 检查 base 引用是否存在
  │       ├─ 检查 additions/modifications/deletions 格式
  │       └─ 检查冲突标记
  │
  └─ 合并策略 (新增)
      ├─ auto-merge: 无冲突自动合并
      ├─ manual-merge: 有冲突标记，人工解决
      └─ three-way: 三方合并（base + delta + current）
```

#### 6.5.2 实施步骤

| 步骤 | 工时 | 产出 |
|------|------|------|
| 1. 设计 Delta Spec 模板 | 2h | 模板 |
| 2. 实现 delta-spec-validator.js | 3h | 校验脚本 |
| 3. 实现合并策略 | 4h | 合并逻辑 |
| 4. 修改 Phase 2 Design SKILL 集成 | 2h | Phase 2 更新 |
| 5. 测试：Delta Spec 场景 | 2h | 验证 |
| **合计** | **13h** | |

---

### Phase 4 总工时与里程碑

| 工作内容 | 工时 |
|---------|------|
| GitNexus 深度集成 | 20h |
| PRD 自动解析 | 7h |
| Party Mode 多角色辩论 | 6h |
| 执行轨迹学习 | 15h |
| Delta Specs 完善 | 13h |
| **合计** | **61h (~1.5 周)** |

---

## 七、实施里程碑与验收标准

### 7.1 里程碑时间线

```
Week 1-2: Phase 1 基础补强
  ├─ M1.1: Agent 通信协议定义 + 消息板实现        (Day 3)
  ├─ M1.2: 项目宪法分离 + 模板                     (Day 5)
  ├─ M1.3: forgeos CLI init/setup 命令           (Day 8)
  └─ M1.4: Token 监控 Hook 上线                    (Day 10)

Week 3-5: Phase 2 质量提升
  ├─ M2.1: 向量记忆系统核心 + 迁移工具              (Day 15)
  ├─ M2.2: Wave 实时审查上线                        (Day 18)
  ├─ M2.3: 浏览器 QA (Playwright) 上线              (Day 21)
  ├─ M2.4: OWASP/STRIDE 安全审计上线                (Day 23)
  └─ M2.5: MCP 工具瘦身上线                         (Day 25)

Week 5-6: Phase 3 体验优化
  ├─ M3.1: Design 品味记忆 + Phase 0 推回           (Day 27)
  ├─ M3.2: 变更边界检查 + 假设声明                   (Day 29)
  └─ M3.3: Preset 系统 + WIP 自动保存               (Day 32)

Week 7-10: Phase 4 深度集成
  ├─ M4.1: GitNexus 深度集成 + Blast Radius         (Day 37)
  ├─ M4.2: PRD 自动解析 + Party Mode                (Day 40)
  └─ M4.3: 执行轨迹学习 + Delta Specs 完善          (Day 45)
```

### 7.2 各阶段验收标准

| 阶段 | 验收标准 | 回归测试 |
|------|---------|---------|
| Phase 1 | 4 个 P0 特性全部可用；现有 Phase 0-8 流程无回归 | 全流程 E2E 测试 |
| Phase 2 | 5 个 P1 特性全部可用；向量记忆检索准确率 ≥ 3x 基线 | 安全审计 + 浏览器 QA 场景 |
| Phase 3 | 6 个 P2 特性全部可用；Preset 加载正确 | Preset 覆盖测试 |
| Phase 4 | 5 个深度集成特性全部可用；GitNexus 集成无冲突 | Brownfield 项目全流程 |

### 7.3 质量门控

每个 Phase 集成阶段完成后，必须通过以下质量门控：

```markdown
## 集成阶段 N 完成检查

- [ ] 所有计划特性已实现并测试通过
- [ ] 现有功能无回归（全流程 E2E 测试通过）
- [ ] 新增文件符合 ForgeOS 文件命名规范
- [ ] 新增 _SKILL.md 包含完整的触发条件、执行步骤、降级策略
- [ ] 新增 Hook 已注册到 hooks.json
- [ ] 文档已更新（README.md、ARCHITECTURE.md、RULES-v3.md）
- [ ] Token 消耗增幅 ≤ 15%（新特性加载后）
```

---

## 八、风险评估与回退策略

### 8.1 风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| **向量记忆嵌入模型不可用** | 中 | 高 | 双模式设计（本地 ONNX + API），降级为 BM25 |
| **Playwright 安装失败** | 中 | 中 | 优雅降级，跳过浏览器 QA |
| **Agent 通信消息板竞争写入** | 低 | 高 | Orchestrator 仲裁，消息序列化 |
| **CLI 安装器跨平台兼容性** | 中 | 中 | 支持 npm/yarn/pnpm，Windows/macOS/Linux 测试 |
| **Token 监控 Hook 性能开销** | 低 | 中 | 轻量级检查，< 3ms 延迟 |
| **Preset 系统与现有规则冲突** | 中 | 中 | Preset 仅覆盖，不删除；冲突时项目宪法优先 |
| **GitNexus SQLite 锁冲突** | 低 | 中 | WAL 模式，读写分离 |
| **集成后 Token 消耗激增** | 中 | 高 | 渐进式加载，新特性默认关闭 |

### 8.2 回退策略

| 场景 | 回退方案 |
|------|---------|
| 向量记忆系统故障 | 自动降级为 LESSONS.md 全文搜索，不影响流程 |
| 浏览器 QA 不可用 | 跳过浏览器 QA 子阶段，仅执行代码级测试 |
| Agent 通信失败 | 回退到 Orchestrator 中转模式（当前模式） |
| CLI 安装失败 | 提供手动安装指南作为备选 |
| Token 监控误报 | 用户可配置阈值或禁用 Hook |
| Preset 加载错误 | 忽略 Preset，使用默认配置 |
| GitNexus 不可用 | 降级为 Level 1 运行时（无 CodeGraph） |

### 8.3 渐进式发布策略

```
每个特性的发布流程:

1. 开发完成 → 内部测试
2. 标记为 experimental → 默认关闭，用户显式启用
3. 收集反馈 → 修复问题
4. 标记为 beta → 默认启用，可关闭
5. 收集反馈 → 最终调整
6. 标记为 stable → 默认启用，不可关闭
```

---

## 九、资源与依赖

### 9.1 技术依赖

| 依赖 | 用途 | 版本要求 | 安装方式 |
|------|------|---------|---------|
| Node.js | CLI + Hook 运行时 | ≥ 18 | 用户环境 |
| SQLite | 向量记忆存储 | ≥ 3.39 (vec 扩展) | npm: better-sqlite3 |
| ONNX Runtime | 本地嵌入模型 | ≥ 1.16 | npm: onnxruntime-node |
| Playwright | 浏览器 QA | ≥ 1.40 | npm: playwright |
| GitNexus | 代码知识图谱 | 最新 | MCP Server |
| HNSWlib | 向量索引 | ≥ 0.1.0 | npm: hnswlib-node |

### 9.2 可选依赖

| 依赖 | 用途 | 缺失时降级 |
|------|------|-----------|
| Python 3 | security-scan 完整模式 | 降级为 Node.js 模式 |
| all-MiniLM-L6-v2 | 本地嵌入生成 | 降级为 API 嵌入 |
| Docker | Canary 灰度发布 | 跳过 Phase 7 |

### 9.3 工时汇总

| 阶段 | 工时 | 日历时间 |
|------|------|---------|
| Phase 1 基础补强 | 56h | 1.5 周 |
| Phase 2 质量提升 | 106h | 2.7 周 |
| Phase 3 体验优化 | 37h | 1 周 |
| Phase 4 深度集成 | 61h | 1.5 周 |
| **缓冲 (20%)** | **52h** | **1.3 周** |
| **总计** | **312h** | **~8 周** |

### 9.4 建议实施顺序调整

如果资源有限，建议按以下最小可行集实施：

**MVP（2 周）**: P0-4 安装器 + P0-3 项目宪法 + P1-4 Token 监控
**V1（4 周）**: MVP + P0-1 Agent 通信 + P1-1 实时审查 + P1-5 MCP 瘦身
**V2（6 周）**: V1 + P0-2 向量记忆 + P1-2 浏览器 QA + P1-3 安全审计
**V3（8 周）**: V2 + Phase 3 全部 + Phase 4 全部

---

## 附录 A: 新增规则清单

| 规则 | 内容 | 来源 |
|------|------|------|
| R25 | **Agent 间通信**: Wave 内 Agent 必须通过消息板通信，重要发现写入 notifications.md | Ruflo |
| R26 | **项目宪法**: 所有 Phase 执行必须遵守 PROJECT_CONSTITUTION.md 中的项目约束 | Spec-Kit |
| R27 | **假设声明**: Phase 4 每个 Task 开始前必须声明假设，不确定项必须确认 | Karpathy |
| R28 | **变更边界**: Phase 4 提交前必须比对修改文件与声明范围，越界修改需确认 | Karpathy |
| R29 | **推回机制**: Phase 0 Standard/Strict 模式必须执行推回轮次，挑战至少一个前提 | gstack |
| R30 | **品味记忆**: Phase 2a 选择结果必须写入 DESIGN_PREFERENCES.md | gstack |
| R31 | **WIP Checkpoint**: Phase 4 每 3 个 Task 或 Token > 60% 自动 checkpoint | gstack |
| R32 | **快速模式**: 小功能可使用 propose→apply→archive 三步快速流程 | OpenSpec |

## 附录 B: 新增 Agent 清单

| Agent | 映射 Phase | 职责 | 来源 |
|-------|-----------|------|------|
| owasp-auditor | P6 | OWASP Top 10 逐项检查 | gstack |
| stride-modeler | P6 | STRIDE 威胁建模 | gstack |
| spec-compliance-checker | P4 (实时审查) | 规格合规检查 | Superpowers |
| quality-scanner | P4 (实时审查) | 代码质量快速扫描 | Superpowers |
| playwright-runner | P5 | 浏览器 QA 执行 | gstack |
| boundary-guard | P4 | 变更边界检查 | Karpathy |

## 附录 C: 新增 Gate 清单

| Gate | 位置 | 检查内容 | 来源 |
|------|------|---------|------|
| G5.5 | Phase 4 Wave 间 | 实时审查结果（spec compliance + quality scan） | Superpowers |
| G6.5 | Phase 5 浏览器 QA | 浏览器测试结果（P0 Bug 阻断） | gstack |
| G0.5 | Phase 0 推回后 | 推回轮次完成，需求理解更新 | gstack |

---

## 附录 D: agentmemory 深度分析与集成建议

> **版本**: 1.1 | **更新日期**: 2026-05-29
> **项目**: agentmemory v0.9.24 — AI 编码 Agent 持久化记忆系统

### D.1 项目概览

| 指标 | 数值 |
|------|------|
| MCP 工具 | 53（core 8 + extended 45） |
| REST 端点 | 125 |
| 自动化 Hook | 12（SessionStart/PreToolUse/PostToolUse/Stop 等） |
| Skills | 8（remember/recall/recap/handoff/forget/commit-context/commit-history/session-history） |
| 测试 | 950+ |
| 检索准确率 | R@5 = 95.2%（LongMemEval-S） |
| Token 节省 | 86%（vs 全文加载） |
| 运行时 | iii-engine（SQLite + WebSocket） |
| 适配 Agent | 17+（Claude Code/Cursor/Codex/Gemini CLI/Copilot 等） |
| 嵌入模型 | 6 种（local/Gemini/OpenAI/Voyage/Cohere/OpenRouter） |
| 外部依赖 | 0（无需 Postgres/Redis/Qdrant） |

### D.2 核心架构：记忆管线

```
PostToolUse Hook 触发
  → SHA-256 去重（5min 窗口）
  → 隐私过滤（剥离 API Key/Secrets）
  → 存储原始观察
  → LLM 压缩 → 结构化事实 + 概念 + 叙事
  → 向量嵌入（6 种 Provider + 本地）
  → 索引到 BM25 + Vector

Stop / SessionEnd Hook 触发
  → 会话摘要
  → 知识图谱提取
  → Slot 反射

SessionStart Hook 触发
  → 加载项目 Profile（概念/文件/模式）
  → 混合检索（BM25 + Vector + Graph）
  → Token 预算控制（默认 2000 tokens）
  → 注入到会话上下文
```

### D.3 关键特性深度分析

#### D.3.1 4 层记忆整合（极高集成价值）

**agentmemory 实现**:

| 层级 | 名称 | 类比 | 存储内容 | 生命周期 |
|------|------|------|---------|---------|
| L1 | Working | 短期记忆 | 原始工具调用观察 | 5min 去重窗口，会话结束前 |
| L2 | Episodic | "发生了什么" | 压缩的会话摘要 | 跨会话保留，Ebbinghaus 衰减 |
| L3 | Semantic | "我知道什么" | 提取的事实和模式 | 长期保留，高频率记忆强化 |
| L4 | Procedural | "怎么做" | 工作流和决策模式（Crystallize 晶体） | 长期保留，可被未来会话复用 |

**ForgeOS 对比**:

```
ForgeOS 当前:
  LESSONS.md (单层，纯文本)
  Domain Skills (手动晋升，≥3 频率)

agentmemory:
  Working → Episodic → Semantic → Procedural (4层，自动整合)
  Crystallize (自动压缩多步操作为可复用晶体)

差距:
  ForgeOS 缺少 L1 Working 层（原始观察自动采集）
  ForgeOS 缺少 L2 Episodic 层（会话级摘要）
  ForgeOS 的 LESSONS 对应 L3 Semantic 但无衰减
  ForgeOS 的 Domain Skills 对应 L4 Procedural 但无自动提取
```

**集成建议**: 将 ForgeOS 的 LearningWorkflow 升级为 4 层架构：

```
ForgeOS 4 层记忆 (建议):

L1-Working: Phase 4 Wave 执行中的 Hook 自动采集
  → PostToolUse Hook → 原始观察（tool_name, input, output）
  → SHA-256 去重 + 隐私过滤
  → 写入 .forgeos/<req-id>/observations/
  
L2-Episodic: Wave 完成后自动生成摘要
  → Wave Summary → 压缩为结构化事实
  → 写入 LESSONS.md [EPISODIC] 段
  
L3-Semantic: Phase 8 归档时提取
  → 跨会话模式提取 → 事实 + 概念
  → 矛盾检测 + 版本替代
  → 写入 LESSONS.md [SEMANTIC] 段
  
L4-Procedural: 晋升为 Domain Skills / 晶体
  → 频繁出现的操作序列 → Crystallize
  → 写入 domain-skills/ 目录
  → 未来 Wave 可直接复用
```

#### D.3.2 三流混合检索 BM25+Vector+Graph（极高集成价值）

**agentmemory 实现**:

| 检索流 | 机制 | 触发条件 |
|--------|------|---------|
| BM25 | 词干关键词匹配 + 同义词扩展 | 始终开启 |
| Vector | 余弦相似度（all-MiniLM-L6-v2） | 嵌入 Provider 配置后 |
| Graph | 知识图谱遍历（实体匹配 + BFS） | 查询中包含实体时 |

融合策略: Reciprocal Rank Fusion (RRF, k=60) + 会话多样性（每会话最多 3 结果）

**对 ForgeOS P0-2（向量记忆系统）的影响**:

原计划自建 HNSW 向量索引，但 agentmemory 已提供生产级的三流混合检索：

| 对比 | ForgeOS 原计划 | agentmemory 方案 |
|------|-----------------|------------------|
| 检索 | BM25 + HNSW 向量 | BM25 + Vector + Graph（三流 RRF） |
| 准确率 | 预期 R@5 ~80% | 实测 R@5 = 95.2% |
| 延迟 | 目标 < 100ms | 实测 14ms |
| 图谱 | 无 | 实体提取 + BFS 遍历 |
| Token | 未优化 | 86% 节省（2000 token 预算） |
| 开发量 | 46h 自建 | 集成 MCP ~8h 或参考实现 ~30h |

**集成建议**: 两个方案可选：

- **方案 A（推荐）**: 集成 agentmemory 作为 MCP Server，通过 `memory_smart_search` 等工具直接使用其检索能力。开发量 ~8h
- **方案 B**: 参考 agentmemory 的检索架构，在 ForgeOS 内部自建。开发量 ~30h（比原计划 46h 少，因为已有参考实现）

#### D.3.3 记忆生命周期管理（高集成价值）

**agentmemory 实现**:

- **Ebbinghaus 衰减曲线**: 记忆随时间自然衰减
- **重要性驱逐**: 低重要性记忆在空间不足时自动驱逐
- **矛盾检测**: 新记忆与旧记忆矛盾时，自动标记并建议替代
- **自动遗忘**: TTL 过期 + `memory_governance_delete`（带审计追踪）
- **版本替代**: Jaccard 相似度检测，新版本自动替代旧版本

**ForgeOS 对比**:

```
ForgeOS LESSONS.md:
  ✗ 只增不减，无限膨胀
  ✗ 无衰减机制
  ✗ 无矛盾检测
  ✗ 无自动遗忘
  ✗ 无版本替代

→ 长期使用后信息过载，检索质量下降
```

**集成建议**: LESSONS.md 增加生命周期管理：

```markdown
## [EPISODIC] jwt-refresh-retry (2026-05-17) ⏳ 7d remaining
**衰减**: Ebbinghaus, 半衰期 30d
**重要性**: ⭐⭐⭐⭐ (4/5)
**访问计数**: 12
**状态**: active → 将于 2026-06-16 衰减为 inactive

## [SEMANTIC] file-upload-size-limit (2026-05-01) 🔄 superseded
**替代**: file-upload-dual-validation (2026-05-17)
**原因**: 从"手动验证"升级为"前端+后端双重校验"
```

#### D.3.4 Commit-Context 追溯（高集成价值）

**agentmemory 实现**: `memory_commit_lookup` 通过 Git SHA 追溯到产生该 Commit 的会话。

**ForgeOS 应用场景**:

```
Phase 6 审查时:
  "这段代码为什么这样写？" 
  → git blame → 获取 SHA
  → memory_commit_lookup → 获取原始会话
  → 查看决策上下文、假设声明、讨论记录

Phase 5 测试时:
  "这个测试覆盖了什么？"
  → git log -- test/ → 获取 SHA
  → memory_commit_lookup → 获取测试编写时的意图
```

**集成建议**: 在 conductor-revert 和 Phase 6 中增加 Commit→Session 追溯能力。

#### D.3.5 记忆隐私过滤（高集成价值）

**agentmemory 实现**: 自动剥离 API Key、Secrets、`<private>` 标签内容。

**ForgeOS 现状**: LESSONS.md 可能无意中记录敏感信息（数据库连接字符串、JWT 密钥等）。

**集成建议**: Phase 4 PostToolUse Hook 增加隐私过滤，在写入观察前剥离敏感内容。

#### D.3.6 12 自动化 Hook（极高集成价值）

**agentmemory 实现**:

| Hook | 时机 | 捕获内容 |
|------|------|---------|
| SessionStart | 会话开始 | 项目路径、会话 ID、自动注入上下文 |
| UserPromptSubmit | 用户提交提示 | 用户提示（隐私过滤后） |
| PreToolUse | 工具调用前 | 文件访问模式 + 丰富上下文 |
| PostToolUse | 工具调用后 | 工具名、输入、输出 |
| PostToolUseFailure | 工具调用失败 | 错误上下文 |
| PreCompact | 上下文压缩前 | 重新注入记忆（防压缩丢失） |
| SubagentStart/Stop | 子 Agent 生命周期 | 子 Agent 启停事件 |
| Stop | 会话停止 | 端点会话摘要 |
| SessionEnd | 会话结束 | 会话完成标记 |
| Notification | 通知 | 通知事件 |
| TaskCompleted | 任务完成 | 任务完成事件 |

**ForgeOS 对比**: 当前 6 个 Hook，以 Gate 检查为主，无自动记忆采集。

**集成建议**: ForgeOS 应增加以下 Hook：

1. **PostToolUse Hook** → 自动采集 Phase 4 的工具调用观察
2. **PreCompact Hook** → 压缩前重新注入关键记忆（防 Token 压缩丢失 LESSONS）
3. **SessionStart Hook** → 自动注入项目上下文和最近经验
4. **SessionEnd Hook** → 自动归档会话摘要

#### D.3.7 Crystallize 动作链压缩（高集成价值）

**agentmemory 实现**: 将多步操作序列压缩为可复用的"晶体"（Procedural Memory）。

```
例如: "添加新 API 端点" 的操作序列
  1. 在 routes/ 下添加路由
  2. 在 controllers/ 下添加控制器
  3. 在 models/ 下添加模型
  4. 在 tests/ 下添加测试
  5. 更新 API 文档

→ Crystallize 为: "api-endpoint-template"
  触发条件: "添加 API", "新增端点", "REST API"
  操作步骤: [上述 5 步]
  注意事项: 需确认 HTTP 方法、认证要求、请求体格式
```

**ForgeOS 对比**: Domain Skills Promotion 需 ≥3 频率才手动晋升，无自动压缩。

**集成建议**: ForgeOS LearningWorkflow 增加 Crystallize 通道：

```
LearningWorkflow (增强):
  通道 A: LESSONS 沉淀 (现有)
  通道 B: Domain Skills 晋升 (现有, ≥3 频率)
  通道 C: Crystallize 动作链压缩 (新增)
    → 从 Phase 4 执行轨迹中检测重复操作序列
    → 自动压缩为可复用晶体
    → 写入 domain-skills/crystals/
    → 未来 Phase 4 可直接调用晶体
```

### D.4 集成优先级评估

| 特性 | 集成价值 | 对应已有计划 | 建议调整 |
|------|---------|-------------|---------|
| 4 层记忆整合 | **极高** | P0-2 向量记忆（仅2层） | 升级为 4 层，agentmemory 为主要参考 |
| 三流混合检索 | **极高** | P0-2 HNSW 自建 | 考虑集成 agentmemory MCP 或参考其架构 |
| 12 自动化 Hook | **极高** | 无对应计划 | **新增 P1-7**: 自动记忆采集 Hook |
| 记忆生命周期 | **高** | 无对应计划 | **新增 P2-7**: LESSONS 衰减+遗忘 |
| Commit-Context | **高** | conductor-revert 部分 | 增强为完整追溯 |
| 隐私过滤 | **高** | 无对应计划 | **新增 P2-8**: Hook 隐私过滤 |
| Crystallize | **高** | Domain Skills 部分 | 增强 LearningWorkflow |
| 多 Agent 隔离 | **高** | P0-1 Agent 通信 | 集成 AGENT_ID 隔离 |
| Slot 反射 | 中 | STATE.md + DECISIONS.md | 评估后决定 |
| Real-time Viewer | 中 | 无 | 低优先级，调试辅助 |
| Session Replay | 中 | 轨迹学习 | 参考实现 |
| iii-engine 扩展 | 低 | 无 | 不集成 |

### D.5 对集成计划的影响

agentmemory 的加入对原计划产生以下影响：

1. **P0-2 向量记忆系统应重新评估**：原计划 46h 自建，现在有两个更优选项：
   - 集成 agentmemory MCP（8h，即时获得 95.2% 准确率）
   - 参考实现自建（30h，获得更深层定制）

2. **新增 3 个特性**：
   - **P1-7**: 自动记忆采集 Hook（PostToolUse/PreCompact/SessionStart/SessionEnd）
   - **P2-7**: LESSONS 衰减+遗忘+矛盾检测
   - **P2-8**: Hook 隐私过滤

3. **P0-1 Agent 通信应集成 AGENT_ID 隔离**：不仅是通信，还需支持记忆命名空间

4. **LearningWorkflow 应升级为 4 层架构**：参考 agentmemory 的 Working→Episodic→Semantic→Procedural

5. **Phase 4 深度集成的"执行轨迹学习"可参考 agentmemory Session Replay**

---

> **文档维护**: 本计划随实施进展持续更新。每个里程碑完成后更新实际工时和验收结果。
> **下次审查**: Phase 1 完成后（预计 Week 2 末）
> **v1.1 更新**: 新增附录 D — agentmemory 深度分析
