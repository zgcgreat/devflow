# 快速开始 — DevFlow-Evo v3.2

本文档带你从零开始使用 DevFlow-Evo，只需 **5 分钟**。

## 前置条件

- AI 编程工具（支持 `/use` 或 `Use` 命令加载 skill）
- 一个 Git 仓库（greenfield 或 brownfield 均可）

## 第一步：安装

在你项目的 AI 编程工具中打开 DevFlow-Evo：

```
Use devflow-evo.
```

或者使用安装 Skill：

```
Use install-devflow-evo.
```

**就这么简单！** 无需安装任何依赖、无需运行脚本、无需配置。

## 第二步：开始你的第一个任务

在 AI 工具中发送：

```
Use devflow-evo.

我想做一个用户登录功能，支持邮箱密码和 JWT 认证
```

AI 会自动执行以下流程：

### 1. 路由判定
读取 `GO.md` 统一路由器，根据需求自动判定模式。

### 2. 模式确认（4档可选）

| 模式 | 适用场景 |
|------|---------|
| **Fast** | ≤2 文件、<50 行、低风险（如修复 typo） |
| **Lean** | ≤5 文件、<300 行、brownfield 明确需求 |
| **Standard** | 常规功能开发，完整 Phase 流程 |
| **Strict** | 高风险/架构变更/数据模型变更 |

> AI 会推荐一个模式并给出理由，确认后即可继续。

### 3. 入场检测
自动检测项目类型（greenfield / brownfield），加载已有上下文。

### 4. 完整 Phase 流程（Standard 模式为例）

```
Phase 0: YC六问战略评估     → 明确需求价值
Phase 1: 5 Whys 追问         → 澄清模糊需求
Phase 1b: 技术决策捕获       → 确认技术方案
Phase 2: 方案设计            → DAG 路由 + Provider 选择
Phase 3: 任务拆分 (DAG)      → Wave 编排
Phase 4: 实施               → Wave 并行执行
Phase 5: 测试验证           → QA 三层覆盖
Phase 6: 三层对抗审查        → Blind Hunter / Edge Case / Auditor
Phase 7: Canary 灰度发布     → 分批上线
Phase 8: 知识归档            → LESSONS + Domain Skills
```

### 5. 产物输出

所有产物保存到 `.devflow-evo/<req-id>/` 目录下：

```
.devflow-evo/
├── <req-id>/
│   ├── 00-strategy.md      # YC六问回答
│   ├── 01-analysis.md      # 需求分析
│   ├── CONTEXT.md          # 技术决策记录
│   ├── 02-design.md        # 设计方案
│   ├── 03-plan.md          # Wave 任务计划
│   ├── 04-implementation.md # 实施日志
│   └── summary.md          # 完成总结
├── STATE.md                # 全局项目状态
└── memory/
    ├── PROJECT_CONTEXT.md  # 项目背景
    ├── DECISIONS.md        # 历史决策
    ├── LESSONS.md          # 经验教训
    └── domain-skills/      # 领域技能沉淀
```

## 第三步：常见使用场景

### 场景1: 快速修复 Bug

```
Use devflow-evo. Fast模式: 修复 settings 页面按钮文案 typo
```

→ 直接跳到 Phase 4，完成即归档到 LESSONS。

### 场景2: Brownfield 小功能

```
Use devflow-evo. Lean模式: 在已有关账单页面增加筛选功能
```

→ Phase 2（轻量方案设计）→ Phase 4 → Phase 5 → Phase 8。

### 场景3: 探索代码结构

```
Use devflow-evo.

哪些函数调用了 auth.verify()？修改它会影响到什么？
```

→ GitNexus 检测 → 调用链分析 → 影响追踪。

### 场景4: 架构重构

```
Use devflow-evo. Strict模式: 把单体应用拆分成微服务，先做用户模块
```

→ 完整 Phase 流程，包含设计枪战、DAG 并行任务拆分、Canary 发布。

## 可选命令

| 命令 | 说明 |
|------|------|
| `/dfevo:surface [mode]` | 运行时技能簇切换（lite/standard/strict） |
| `/dfevo:compress [level]` | 手动触发通信压缩（lite/full/ultra） |
| `/dfevo:budget [action]` | Token 预算管理 |
| `architect` | 架构梳理 |
| `扫描代码` | 入场 intel-scan |

## 下一步

- 📖 [架构设计](architecture.md) — 深入理解三层架构
- 🎯 [模式判定](modes.md) — 详细了解四档模式选择
- 🔧 [进阶主题](advanced.md) — LearningWorkflow、Hooks、DAG 路由等
