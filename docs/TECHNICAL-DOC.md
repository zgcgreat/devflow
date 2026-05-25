# devflow 技术文档

## 1. 项目概述与背景

**devflow** 是一款开箱即用的 AI 编程工作流系统，整合规格驱动、结构化流程、工程纪律、变更管理、代码理解五大核心能力。"evo"代表 evolution（进化）。

项目名称：装好就用的AI编程工作流系统。

通过说"Use devflow."即可触发完整流程，自动完成从需求到交付的全过程。

## 2. 架构与模块设计

### 整合的六个开源项目

| 项目 | 贡献 |
|------|------|
| spec-kit | 规格驱动开发（PRD/Plan/Tasks） |
| devflow-kit | 智能流程编排（8阶段/3模式） |
| superpowers | 工程纪律保障（TDD/苏格拉底式澄清） |
| OpenSpec | 变更管理系统 |
| GitNexus | 代码理解（知识图谱/MCP） |
| agent-skills | 工程技能库 |
| caveman | Token 压缩 |

### 触发流程

"Use devflow." -> GO.md 路由器 -> 入场检测 -> spec-kit 生成规格 -> 判定模式 -> 7阶段流程 -> 产物归档 -> 更新记忆

### 三档模式

- **Fast**：快速模式，适合简单任务
- **Standard**：标准模式，适合常规开发
- **Strict**：严格模式，适合复杂系统

## 3. 核心功能说明

### 规格驱动开发

PRD -> Plan -> Tasks 自动化生成，模板约束 LLM 防止过早实现细节。

### 智能流程编排

7阶段流程 + 风险评估矩阵，Stage Skill 架构（15个阶段技能）。

### 工程纪律保障

- Brainstorming：苏格拉底式需求澄清
- TDD 硬约束：RED-GREEN-REFACTOR 循环
- Subagent 驱动：两阶段审查

### 跨会话记忆

- PROJECT_CONTEXT.md
- DECISIONS.md
- KNOWN_FAILURES.md

自动记录重要决策和失败模式。

## 4. 技术选型与决策

- **入口**：说"Use devflow."即可触发
- **产物存储**：.devflow/<req-id>/
- **变更管理**：归档到 OpenSpec 变更管理系统
- **安装方式**：Skill 形式安装到 AI 编程工具
- **许可证**：MIT License

## 5. 文件结构

```
devflow/
├── .devflow/        # 运行时产物目录
├── GO.md                # 路由器（核心入口）
├── ARCHITECTURE-DIAGRAM.html # 架构图
├── SKILL.md            # Skill 定义
├── TEST-CASES.md       # 测试用例
├── V3-ARCHITECTURE.md  # 架构文档
├── USER-MIGRATION-GUIDE.md # 用户迁移指南
├── README.md
└── LICENSE
```


## 6. 优势与不足

### 优势

**整合 6 大开源项目最全面，触发简单（说 Use devflow. 即可），三档模式适应不同场景，跨会话记忆机制完善**

### 不足

**整合项目多意味着学习成本高**；**触发依赖 AI 理解可能不稳定**；**模块众多可能导致冲突或版本不兼容**
