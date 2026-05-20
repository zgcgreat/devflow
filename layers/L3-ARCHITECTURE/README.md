# Layer 3: 架构层 (架构层) — Enterprise Orchestration

## DAG依赖路由 + Provider智能网关 + Agent上下文隔离 + 并行执行引擎

此目录封装 架构层 v2.0 的架构能力，为全生命周期提供企业级编排。

### 文件结构

```
L3-ARCHITECTURE/
├── README.md              ← 本文件
├── DAG-ROUTER.md          # DAG依赖路由 + Kahn拓扑排序决策树
├── PROVIDER-GATEWAY.md    # ⭐Provider智能网关 (多模型按需路由)
├── AGENT-ISOLATION.md     # ⭐Agent上下文隔离协议
├── PARALLEL-ENGINE.md     # 并行执行引擎 (~4.4x-5x加速)
├── MEMORY-MANAGER.md      # → 已迁移至 L2-ENGINE/learning-workflow
└── QA-CROSS-WAVE.md       # 交叉波测试策略矩阵
```

### ⭐ Provider智能网关 (v3新增)

#### 路由决策树

基于任务类型和模型特性自动选择：

```
Phase N 需求分析
  │
  ├─ 需要高创造力? (设计/文案/方案变体)
  │   └─ → Creative-Model (gpt-4o / claude-sonnet)
  │
  ├─ 需要高代码能力? (Phase 4实施)
  │   └─ → Code-Model (cursor / codex)
  │
  ├─ 需要高分析能力? (Phase 6审查)
  │   └─ → Analysis-Model (claude-opus)
  │
  ├─ 需要高检索能力? (Phase 1搜索/分析)
  │   └─ → Search-Model (with web-search)
  │
  └─ 通用任务?
      └─ → Standard-Model (默认)
```

#### Token预算优化

```
Provider Cost × Compression Level:

| Phase | Default Model | Compression | Est. Cost |
|-------|--------------|-------------|-----------|
| Phase 0-1 | Search-Model | full (50%) | $$ |
| Phase 2 | Creative-Model | ultra (75%) | $$$ |
| Phase 3 | Analysis-Model | full (50%) | $$ |
| Phase 4 | Code-Model | lite (30%) | $$$$ |
| Phase 5 | Standard-Model | full (50%) | $$ |
| Phase 6 | Analysis-Model | ultra (75%) | $$$ |
| Phase 7-8 | Standard-Model | lite (30%) | $ |
```

### ⭐ Agent上下文隔离协议 (v3新增)

#### 三层Agent模型

| Agent | Context窗口 | Fresh度保证 | 生命周期 |
|-------|------------|------------|---------|
| **Orchestrator** | ~50K tokens | 全局状态 | 整个会话 |
| **Research Agent** | ~200K tokens | Phase 1/2开始时清空重建 | Phase 1-2 |
| **Execution Agent** | ~200K tokens | 每个Wave开始时清空重建 | Phase 4 (per-Wave) |

#### Context注入协议

```
Research Agent初始化:
┌─────────────────────────────────────────────┐
│ Research Agent Session (fresh context)      │
│                                             │
│ Injected:                                  │
│ - PROJECT_CONTEXT.md (项目背景)             │
│ - DECISIONS.md (历史决策, 最近10条)          │
│ - Domain Skills (匹配当前task的领域经验)      │
│ - LESSONS.md (相关教训, <5条)               │
│                                             │
│ Total: ~200K tokens max                     │
│ Clean slate: No prior conversation context  │
└─────────────────────────────────────────────┘

Execution Agent初始化 (per-Wave):
┌─────────────────────────────────────────────┐
│ Execution Agent Wave-{N} Session (fresh)    │
│                                             │
│ Injected:                                  │
│ - Phase {N} 任务列表和依赖图                 │
│ - Wave N-1 SUMMARY (前置结果)               │
│ - Domain Skills (匹配当前Wave的领域经验)     │
│ - LearningFlow提名 (本Wave相关教训)          │
│                                             │
│ Total: ~200K tokens max                     │
│ Clean slate: No Phase 1-3 context rot       │
└─────────────────────────────────────────────┘
```

### DAG Router + 并行引擎

#### DAG构建规则

```
基于设计文档自动构建DAG:

1. 识别原子任务 (不可再分的代码变更)
2. 建立依赖关系 (import引用、API契约、数据库schema)
3. Kahn拓扑排序 → Wave分配
4. 输出可执行计划

示例 - 用户认证模块:

Wave 1 (无依赖):
├─ task: database-schema (users表)
├─ task: auth-model (User/Session类型定义)
└─ task: constants (auth相关的常量和错误码)

Wave 2 (依赖Wave 1):
├─ task: auth-repository (CRUD操作) ← depends on: database-schema
└─ task: auth-types (导出类型) ← depends on: auth-model

Wave 3 (依赖Wave 2):
├─ task: auth-service (核心认证逻辑) ← depends on: auth-repository, auth-types
└─ task: jwt-utils (JWT工具函数) ← depends on: constants
```

### Layer 3 ↔ Layer 1 协作协议

| L3组件 | L1对应Phase | 协作方式 |
|--------|------------|---------|
| DAG Router | Phase 2-3 | 设计文档 → DAG构建 → Wave分配 |
| Provider Gateway | 所有Phase | 运行时按需切换模型 |
| Agent Isolation | Phase 1/4 | Research/Execution Agent注入 |
| QA Cross-Wave | Phase 5 | Wave间测试策略矩阵 |

### Layer 3 ↔ Layer 2 协作协议

| L3组件 | L2对应能力 | 协作点 |
|--------|-----------|--------|
| DAG Router → Wave分配 | Wave Executor输入 | Kahn排序输出 → Wave执行计划 |
| Agent Isolation (~200K) | LearningWorkflow运行环境 | Learning提取在隔离context中安全执行 |
| Parallel Engine (~5x) | Wave并行引擎协同加速 | 两级并行: DAG-Wave间 + Wave内task级 |
