---
name: ultimate-workflow
description: |
  Ultimate AI programming workflow system - integrates spec-driven development,
  staged workflow, engineering discipline, change management, and code understanding.
  
  Use when: (1) Starting any development task, 
  (2) Need structured workflow with automatic spec generation,
  (3) Need cross-session memory for long projects,
  (4) User says "Use ultimate-workflow"
  
  Architecture: Skill lives in E:\LLM\skills\ultimate-workflow,
  project only contains .ultimate-workflow/ directory with artifacts.
dependencies:
  - brainstorming
  - writing-plans
  - systematic-debugging
  - verification-before-completion
  - test-driven-development
  - subagent-driven-development
---

# Ultimate Workflow - 终极AI编程工作流系统

> **架构说明**: Skill 位于 `E:\LLM\skills\ultimate-workflow`，项目内只生成 `.ultimate-workflow/` 产物目录

## 🚀 快速开始

### 使用方式

在你的AI编程工具中说：

```
Use ultimate-workflow.

我要做一个用户登录功能，支持邮箱密码和JWT认证
```

AI会自动：
1. 读取 `E:\LLM\skills\ultimate-workflow\GO.md` 路由器
2. 入场检测（brownfield/greenfield）
3. 判定模式（Fast/Standard/Strict）
4. 启动阶段流程：需求澄清 → 分析 → 设计 → 开发 → 测试 → 审查
5. 所有产物保存到 `.ultimate-workflow/<req-id>/`
6. 更新记忆系统

**就这么简单！**

---

## ✨ 核心特性

### 1. 智能流程编排（来自 devflow-kit）
- **三档模式**: Fast(小改动) / Standard(常规功能) / Strict(高风险)
- **风险评估矩阵**: 自动根据技术复杂度、业务影响、数据敏感性评分
- **Stage Skill架构**: 15个阶段技能，按需加载，依赖管理
- **前置产物全量读取**: 智能降级策略，容错性强

### 2. 工程纪律保障（来自 superpowers）
- **Brainstorming**: 苏格拉底式需求澄清，避免盲目编码
- **TDD硬约束**: RED-GREEN-REFACTOR循环，先写失败测试
- **Subagent驱动**: 并行子代理执行，两阶段审查(spec合规+代码质量)
- **系统化调试**: 四阶段根因追溯，防御性编程

### 3. 跨会话记忆（来自 team-skills）
**自动记忆**:
- ✅ 会话开始时自动读取项目背景
- ✅ 需求完成后自动更新记忆
- ✅ AI自动记录重要决策和失败模式

**持久化上下文**: `.ultimate-workflow/memory/` 存储项目知识
- **决策追踪**: ADR风格记录重要技术决策
- **失败模式库**: 避免重复踩坑
- **会话日志**: 形成完整工作历史轨迹

### 4. Token优化（来自 caveman）
多级通信压缩：
```
/caveman lite      # 专业但简洁
/caveman full      # 经典 caveman（默认）
/caveman ultra     # 极致压缩
/caveman extreme   # 只保留关键词+代码片段
```

---

## 📦 架构说明

### Skill 位置 vs 项目产物

**Skill 本身**（位于 `E:\LLM\skills\ultimate-workflow`）:
- `GO.md` - 统一路由器
- `SKILL.md` - 主 skill 定义
- `skills/stage-skills/` - 15个阶段技能
- `references/` - 规则/模板/提示词
- `memory/` - 记忆系统模板

**项目产物**（位于 `<project>/.ultimate-workflow/`）:
- `STATE.md` - 跨会话状态追踪
- `memory/` - 项目记忆（PROJECT_CONTEXT.md, DECISIONS.md等）
- `<req-id>/` - 需求产物（00-requirements.md, 01-analysis.md等）

> **关键原则**: AI 从 `E:\LLM\skills\ultimate-workflow` 读取 skill 逻辑，
> 在项目中只生成 `.ultimate-workflow/` 产物目录，不复制 skill 本身。

---

## 🎯 使用场景

### 场景1: 开发新功能

```
Use ultimate-workflow.

在账号设置页增加已保存支付方式管理，支持信用卡和PayPal
```

AI会走完整流程: 需求澄清 → 分析 → 设计 → TDD开发 → 测试 → 审查

### 场景2: 快速修复Bug

```
Use ultimate-workflow. Fast模式: 修复settings页面按钮文案typo
```

AI跳过复杂流程，直接窄验证修复。

### 场景3: 架构重构

```
Use ultimate-workflow.

把单体应用拆分成微服务，先做用户模块
```

AI走 architect 流程: 架构分析 → 拆分方案 → 实施计划 → 逐步迁移。

---

## 📖 详细文档

- [快速上手指南](docs/quickstart.md)
- [Stage Skills 详解](docs/stage-skills.md)
- [记忆系统使用](docs/memory-system.md)
- [故障排查](docs/troubleshooting.md)

---

## 🌟 为什么选择 Ultimate Workflow？

| 特性 | Ultimate | devflow-kit | superpowers |
|------|----------|-------------|-------------|
| 阶段流程 | ✅ | ✅ | ❌ |
| 工程纪律 | ✅ | ❌ | ✅ |
| 记忆系统 | ✅ | ✅ | ❌ |
| Token优化 | ✅ | ❌ | ❌ |

**Ultimate Workflow = devflow-kit + superpowers + 增强版**

---

## 版本

v1.0 - 融合版
- 整合 devflow-kit 阶段流程 + superpowers 工程纪律
- 统一入口 GO.md 自动路由
- 跨会话记忆系统
- 7阶段流程 + 横向命令
- Token 优化支持
