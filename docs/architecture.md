# 架构设计 — DevFlow-Evo v3.2.3

DevFlow-Evo 采用 **L1/L2/L3 三层架构**，每一层有明确的职责边界和协作协议。

> **v3.2.3 审计修复**: 健康度 88/100，requires 0 断裂，ET/BC L1+L2 100% 覆盖，Gate 依赖链 G0→G8 完全自洽

## 架构图

```
┌─────────────────────────────────────────────┐
│              L3: ARCHITECTURE               │
│         决策层 — DAG / Provider / Agent     │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │DAG-Router│ │Provider  │ │Agent     │    │
│  │          │ │Gateway   │ │Isolation │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Parallel  │ │GitNexus  │ │Delta     │    │
│  │Engine    │ │Bridge    │ │Specs     │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│              L2: ENGINE                     │
│         执行层 — LearningWorkflow / Waves   │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Learning  │ │Wave      │ │PartyMode │    │
│  │Workflow  │ │Executor  │ │          │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Caveman   │ │CodeGraph │ │Hooks     │    │
│  │Shrink    │ │Bridge    │ │System    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  ┌──────────┐                              │
│  │Surface   │                              │
│  │Switch    │                              │
│  └──────────┘                              │
├─────────────────────────────────────────────┤
│              L1: INTERACTION                │
│         交互层 — Phase Skills               │
│                                             │
│  Phase 0 → Phase 1 → Phase 1b → Phase 2    │
│  Phase 3 → Phase 4 → Phase 5 → Phase 6     │
│  Phase 7 → Phase 8                          │
└─────────────────────────────────────────────┘
```

### 质量指标 (v3.2.3 审计修复后)

| 指标 | 数值 | 说明 |
|------|------|------|
| frontmatter 覆盖率 | 100% (72/72) | 所有 _SKILL.md 均有 YAML frontmatter |
| Error Taxonomy 覆盖率 | 100% (L1+L2) | L1 19/19 + L2 23/23 |
| Boundary Conditions 覆盖率 | 100% (L1+L2) | L1 19/19 + L2 23/23 |
| requires 断裂数 | 0 | 所有 requires 均有对应 provides |
| 孤立 provides | 99 | 已甄别：pipeline(28) + on-demand(52) + terminal(8) + redundant(11) |
| Gate 依赖链 | G0→G8 自洽 | 无断裂，无循环 |
| 健康度评分 | 88/100 | 较审计前 +16 |

## 文件命名约定

| 位置 | 命名格式 | 原因 |
|------|---------|------|
| `layers/` 内（L1/L2/L3） | `_SKILL.md`（下划线前缀） | 防止 WorkBuddy 扫描引擎将其识别为独立 skill 并自动加载 |
| `skills/` 目录 | `SKILL.md`（无前缀） | WorkBuddy 扫描格式，需要被识别为可安装 skill |
| `agent-skills/` 目录 | `SKILL.md`（无前缀） | 同上，WorkBuddy 扫描格式 |

> **设计意图**: `layers/` 内的技能是架构内部组件，不应被 WorkBuddy 独立加载；`skills/` 和 `agent-skills/` 是面向用户的可安装技能，需要被扫描发现。

### skills/ vs agent-skills/ 定位区分

| 目录 | 技能数 | 定位 | 来源 | 典型技能 |
|------|--------|------|------|---------|
| `skills/` | 17 | **流程操作技能** — devflow-evo 工作流各阶段的操作技能 | devflow-evo 自研 | brainstorming, writing-plans, systematic-debugging |
| `agent-skills/skills/` | 24 | **通用工程能力技能** — 跨项目的工程实践能力 | [Addy Osmani Agent Skills](https://github.com/addyosmani/agent-skills) | code-review-and-quality, security-and-hardening, TDD |

> **关键区分**: `skills/` 是"怎么走流程"，`agent-skills/skills/` 是"怎么做好工程"。两者互补，不应合并。

## L3: ARCHITECTURE（架构层）

### DAG-Router — 有向无环图路由引擎

**职责**: 将任务拆分为原子子任务，构建依赖关系 DAG，输出拓扑排序后的 Wave 计划。

**核心算法**: Kahn 拓扑排序算法，确保无环执行序列。

**关键设计**:
- **并行度分级**: 4级并行（无依赖/波内/跨波/全量）
- **资源感知**: 根据任务预估耗时自动平衡 Waves
- **降级策略**: DAG构建失败时回退到线性序列

**入口文件**: `layers/L3-ARCHITECTURE/dag-router/_SKILL.md`

### Provider-Gateway — 智能模型路由网关

**职责**: 根据任务类型动态选择最合适的 AI 模型/Provider。

**6任务类型选择矩阵**:

| Phase | 任务类型 | 推荐能力 |
|-------|---------|---------|
| 0-1 | 理解+分析 | 高检索能力 |
| 2-2a | 创意设计 | 高创造力 |
| 3 | 逻辑编排 | 强推理 |
| 4 | 代码生成 | 高代码能力 |
| 5 | 测试编写 | 细心严谨 |
| 6 | 对抗审查 | 批判型分析 |

**指数退避降级链**: 5s → 10s → 20s，确保高可用性。

**入口文件**: `layers/L3-ARCHITECTURE/provider-gateway/_SKILL.md`

### Agent-Isolation — 智能体上下文隔离

**职责**: 为每个 Agent 分配独立的 Token 预算和 Wave 边界。

**设计原则**:
- **Token 预算**: ~200K/Agent，超限自动裁剪历史轮次
- **Wave 边界**: 不同 Wave 的 Agent 不共享中间状态
- **上下文缓存**: 跨 Wave 复用决策记录（DECISIONS.md）

**入口文件**: `layers/L3-ARCHITECTURE/agent-isolation/_SKILL.md`

### Parallel-Engine — 并行执行引擎

**职责**: 根据 DAG 拓扑排序结果，在独立 Agent 中并行执行无依赖任务。

**关键特性**:
- Kahn 算法输出的层级自动映射为 Wave
- 同 Wave 内独立 Agent 并行运行
- 跨 Wave 按序传递上下文（Wave SUMMARY）

**入口文件**: `layers/L3-ARCHITECTURE/parallel-engine/_SKILL.md`

### GitNexus-Bridge — 代码知识图谱桥接

**职责**: 集成 GitNexus MCP，提供 tree-sitter 解析、调用链分析、影响追踪。

**能力等级**:
1. **GitNexus 就绪**: 完整的 symbol 级分析 + graphDB 查询
2. **grep Fallback**: 文件搜索✅ / 调用链分析⚠️ / 依赖追踪🟡
3. **关闭**: 纯文本匹配，无代码理解

**入口文件**: `layers/L2-ENGINE/codegraph-bridge/_SKILL.md`（原 L3）

### Delta-Specs — 差量规范引擎

**职责**: Brownfield 场景下仅追踪变更影响范围，节约 76-87% Token。

**核心逻辑**:
1. `git diff` → symbol 级影响分析
2. 生成差量 spec（仅描述变化部分）
3. 旧代码引用已有 spec，不重复生成

**入口文件**: `references/delta-specs.md`

## L2: ENGINE（引擎层）

### LearningWorkflow — 自进化学习工作流

**职责**: 从每个项目周期中自动提取经验教训并沉淀为可复用技能。

**三阶段流程**:
1. **LESSONS 沉淀**: Phase 4-8 过程中自动识别可复用模式
2. **Domain Skills 生成**: LESSON 条目达到 ≥3 频率时触发合并 → 生成 Domain Skill
3. **跨波注入**: Wave N+1 开始前从 LESSONS/Domain Skills 注入相关经验

**关键规则**:
- LESSON 必须标注价值等级（⚡高价值 / 💡技术选型 / ⚠️风险提醒）
- Domain Skills 有去重机制，同名技能合并最佳实践
- 频率计数器：同一主题 ≥3 条不同 LESSON → 触发 Domain Skill 生成

**入口文件**: `layers/L2-ENGINE/learning-workflow/_SKILL.md`

### Wave-Executor — Wave 并行执行器

**职责**: 接收 DAG Router 输出的 Wave 计划，依次调度各 Wave。

**核心协议**:
- **Heartbeat 检查点**: `[checkpoint][wave:N][task:X]` 每 Wave 完成自动输出
- **上下文传递**: Wave N SUMMARY → predicates → LESSONS → 注入 N+1
- **失败重试**: 单任务失败触发重试，3次失败标记为阻塞

**入口文件**: `layers/L2-ENGINE/wave-executor/_SKILL.md`

### PartyMode — 多 Agent 协同模式

**职责**: Phase 4（实施）中启动多个独立 Agent 并行处理同一 Wave 的不同任务。

**关键特性**:
- 每个 Agent 有独立的 Token 预算和上下文窗口
- Wave 完成后自动聚合结果
- 冲突检测：文件写入冲突时标记为 RESOLVING

**入口文件**: `layers/L2-ENGINE/party-mode/_SKILL.md`

### Caveman-Shrink — 通信压缩引擎

**职责**: 按需求级别压缩 AI ↔ Agent 之间的通信量，降低 Token 消耗。

**5级压缩策略**:

| 级别 | 压缩率 | 适用场景 |
|------|--------|---------|
| lite | ~30% | 简单任务 |
| full | ~60% | 常规任务 |
| ultra | ~75% | Token 敏感场景 |
| extreme | ~90% | 极致压缩 |
| wenyan | ~95% | 文言文模式（趣味） |

**MCP 工具组压缩**: `TASK_MASTER_TOOLS` 三级加载模式（core/standard/all），节省 70-76% context。

**入口文件**: `layers/L2-ENGINE/caveman-shrink/_SKILL.md`

### Hooks-System — 运行时钩子系统

**职责**: 在关键事件发生时触发预定义的回调函数，实现自动化联动。

**内置钩子**:
- `context-monitor`: Token 阈值自动压缩通信
- `prompt-guard`: 输出脱敏 / 注入检测
- `phase-transition`: Phase 切换时 checkpoint
- `tool-execution`: 工具调用审计/重试

**链式触发 (Chain-Trigger)**: One-to-Many / Many-to-Many 级联执行，支持 parallel/serial 模式。

**入口文件**: `layers/L2-ENGINE/hooks-system/_SKILL.md`

### Surface-Switch — 运行时技能簇切换

**职责**: 动态切换工具集和压缩级别，不丢失上下文平滑过渡。

**5种表面模式**:
- `lite`: 最精简工具集 + lite 压缩（成本敏感）
- `standard`: 完整工具集 + full 压缩（默认）
- `strict`: 严格模式 + ultra 压缩（质量敏感）
- `audit`: 审计模式（含审查工具组）
- `extreme`: 极致模式 + extreme 压缩

**入口文件**: `layers/L2-ENGINE/surface-switch/_SKILL.md`

## L1: INTERACTION（交互层）

### Phase Skills — 11个阶段技能

L1 层是用户直接看到的 **Phase 技能集合**，每个 Phase 是一个独立的 _SKILL.md 指令文件。

```
Phase 0: YC六问战略评估 (phase-0/_SKILL.md)
Phase 1: 5 Whys需求追问 (phase-1-five-whys/_SKILL.md)
Phase 1b: 决策捕获     (phase-1b-discuss/_SKILL.md)
Phase 2: 方案设计      (phase-2-design/_SKILL.md)
Phase 3: 任务拆分      (phase-3-task-plan/_SKILL.md)
Phase 4: 实施         (phase-4-build/_SKILL.md)
Phase 5: 测试验证      (phase-5-test/_SKILL.md)
Phase 6: 三层对抗审查   (phase-6-review/_SKILL.md)
Phase 7: Canary灰度发布 (phase-7-canary/_SKILL.md)
Phase 8: 知识归档      (phase-8-archive/_SKILL.md)
```

**交互模式（v3.2）**: 「批量展示 + 逐个选择」
- 禁止一次性抛给用户大量问题
- 提供预设选项（A/B/C/D），选字母即可
- 自定义输入始终可用

## 协作协议

### L1 ↔ L3 协作流程

```
用户请求 → L1 Phase Skill → 需要DAG拆分? → L3 DAG-Router
                                            → 需要Provider选择? → L3 Provider-Gateway
→ Phase结果返回 L1 → 输出给用户 ← L3 Parallel-Engine ← Agent并行执行
```

### L2 ↔ L3 协作协议

| L3 组件 | L2 交互 | 说明 |
|---------|---------|------|
| DAG-Router | Wave-Executor | DAG → Wave 计划传递 |
| Provider-Gateway | 每个 Phase | 按任务类型选模型 |
| Agent-Isolation | PartyMode | 为每 Agent 分配预算 |
| Parallel-Engine | Wave-Executor | 并行执行无依赖任务 |

### L2 ↔ L1 协作协议

| L2 组件 | L1 交互 | 说明 |
|---------|---------|------|
| LearningWorkflow | Phase 4-8 | LESSON 提取 + Domain Skill 注入 |
| Caveman-Shrink | 所有 Phase | 通信压缩 |
| Hooks-System | Phase切换时 | 链式回调 |
| Surface-Switch | 运行时 | 动态切换技能簇 |

## 数据流图

```
需求输入 → [GO.md路由] → 模式判定 → 入场检测
    ↓
[Phase 0/1/1b] ←→ L1 Phase Skills ←→ 用户确认
    ↓
[Phase 2-3] ←→ L3 DAG/Provider ←→ L2 Wave-Executor
    ↓
[Phase 4] ←→ L3 Agent-Isolation ←→ L2 PartyMode + LearningWorkflow
    ↓
[Phase 5-8] ←→ L1 Phase Skills ←→ [记忆系统: LESSONS + Domain Skills]
```

## 版本演进

| 版本 | 架构变更 |
|------|---------|
| v3.0 | 三层架构首次引入（L1/L2/L3） |
| v3.1 | Lean 模式 → L1 裁剪规则 |
| v3.2 | Caveman-Shrink / CodeGraph-Bridge / Hooks / Surface-Switch 新增 |
| v3.2.1 | Runtime Intelligence Sprint（4个新 L2 模块） |
| v3.2.2 | Scale-Domain-Adaptive / Conductor Revert / Chain-Trigger |
| v3.2.3 | Audit Sprint: P0-P2 全量修复，健康度 72→88/100 |
