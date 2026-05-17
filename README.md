# Ultimate Workflow

> **装好就用的最强AI编程工作流系统** - 整合规格驱动、结构化流程、工程纪律、变更管理、代码理解

## 🚀 5分钟快速上手

### 使用方式

在你的AI编程工具中说：

```
Use ultimate-workflow.

我要做一个用户登录功能，支持邮箱密码和JWT认证
```

AI会自动：
1. 读取 `GO.md` 路由器
2. 入场检测（brownfield/greenfield）
3. 调用 spec-kit 生成规格（PRD → Plan → Tasks）
4. 判定模式（Fast/Standard/Strict）
5. 启动 7阶段流程
6. 所有产物保存到 `.ultimate-workflow/<req-id>/`
7. 归档到 OpenSpec 变更管理系统
8. 更新记忆系统

**就这么简单！**

---

## ✨ 核心特性

### 1. 规格驱动开发（来自 spec-kit）
- PRD → Plan → Tasks 自动化生成
- 模板约束 LLM 防止过早实现细节

### 2. 智能流程编排（来自 devflow-kit）
- 三档模式: Fast / Standard / Strict
- 7阶段流程 + 风险评估矩阵
- Stage Skill架构（15个阶段技能）

### 3. 工程纪律保障（来自 superpowers）
- Brainstorming: 苏格拉底式需求澄清
- TDD硬约束: RED-GREEN-REFACTOR循环
- Subagent驱动: 两阶段审查

### 4. 跨会话记忆
- PROJECT_CONTEXT.md / DECISIONS.md / KNOWN_FAILURES.md
- 自动记录重要决策和失败模式

### 5. 变更管理（来自 OpenSpec）
- proposal → apply → archive 完整流程
- 企业级变更追踪

### 6. 代码理解（来自 GitNexus）
- Tree-sitter 解析 → 知识图谱
- MCP 协议集成
- 影响分析（blast radius）

### 7. 专业能力（来自 agent-skills）
- 23个专业领域 skill 按需加载

### 8. Token优化（来自 caveman）
- 多级通信压缩（lite/full/ultra/extreme）

---

## 📦 包内有什么

```
ultimate-workflow/
├── GO.md                      # 统一路由器
├── SKILL.md                   # 主 skill 定义
├── README.md                  # 本文档
├── skills/
│   └── stage-skills/          # 15个阶段技能
├── agent-skills/
│   └── skills/                # 23个专业技能
├── references/
│   ├── RULES.md               # 全局规则
│   ├── mode-rules.md          # 模式判定
│   ├── gate-rules.md          # 阶段门验证
│   ├── entry-check.md         # 入场检测
│   └── templates/             # 产物模板
├── memory/                    # 记忆系统模板
└── adapters/                  # 工具适配器（可选）
```

---

## 🎯 使用场景

### 场景1: 开发新功能
```
Use ultimate-workflow.

在账号设置页增加已保存支付方式管理，支持信用卡和PayPal
```

### 场景2: 快速修复Bug
```
Use ultimate-workflow. Fast模式: 修复settings页面按钮文案typo
```

### 场景3: 探索代码结构
```
Use ultimate-workflow.

哪些函数调用了 auth.verify()？修改它会影响到什么？
```

### 场景4: 架构重构
```
Use ultimate-workflow.

把单体应用拆分成微服务，先做用户模块
```

---

## 🔧 安装方式

### 方式1: AI自动安装（推荐）

```
Use install-ultimate-workflow.
```

### 方式2: 手动安装

```bash
# 复制整个文件夹到项目根目录
cp -r ultimate-workflow/ your-project/
```

---

## 📖 详细文档

- [快速上手指南](SKILL.md「🚀 三步启动」)
- [Stage Skills 详解](layers/L1-INTERACTION/README.md)
- [记忆系统使用](memory/)
- [OpenSpec 集成](../OpenSpec/)
- [GitNexus 配置](optional/gitnexus-detector.md)

---

## 🌟 为什么选择 Ultimate Workflow？

| 特性 | Ultimate | spec-kit | devflow-kit | superpowers |
|------|----------|----------|-------------|-------------|
| 规格生成 | ✅ | ✅ | ❌ | ❌ |
| 阶段流程 | ✅ | ❌ | ✅ | ❌ |
| 工程纪律 | ✅ | ❌ | ❌ | ✅ |
| 记忆系统 | ✅ | ❌ | ✅ | ❌ |
| 变更管理 | ✅ | ❌ | ❌ | ❌ |
| 代码理解 | ✅ | ❌ | ❌ | ❌ |
| 专业能力 | ✅ (23个) | ❌ | ❌ | ✅ (14个) |
| Token优化 | ✅ | ❌ | ❌ | ❌ |

**Ultimate Workflow = 所有最佳实践的集大成者**

---

## 版本

v1.0 - 终极融合版
- 整合 6 大开源项目核心能力
- 统一入口 GO.md 自动路由
- 跨会话记忆系统
- 7阶段流程 + 横向命令
- 企业级变更管理
- 代码知识图谱集成
