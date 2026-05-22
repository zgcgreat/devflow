# DevFlow-Evo 文档中心

DevFlow-Evo v3.2.3 的完整技术文档集合。本目录包含架构设计、API参考、使用指南和最佳实践。

> **v3.2.3**: Audit Sprint 完成 — P0-P2 全量修复，健康度 88/100

## 📚 文档索引

| 文档 | 说明 | 目标读者 |
|------|------|---------|
| [快速开始](getting-started.md) | 5分钟上手 DevFlow-Evo | 新用户 |
| [架构设计](architecture.md) | L1/L2/L3 三层架构详解 | 架构师/高级开发者 |
| [模式判定](modes.md) | Fast/Lean/Standard/Strict 四档模式详解 | 所有用户 |
| [Phase Skills 参考](stage-skills.md) | L1 阶段技能完整参考（原 stage-skills 已移除） | 深度用户 |
| [门控规则](gates-reference.md) | G0-G8 阶段门验证规则 | 质量负责人 |
| [Token 预算管理](token-budget.md) | Surface Budget 策略 | 成本优化者 |
| [集成指南](integration.md) | 与 spec-kit / OpenSpec / GitNexus 集成 | 集成开发者 |
| [进阶主题](advanced.md) | LearningWorkflow、Hooks、DAG路由等 | 高级用户 |
| [审查报告](AUDIT-REPORT-v3.md) | 8维度21项全面深度审查 | 维护者/质量负责人 |
| [测试验证](TEST-VERIFICATION.md) | 审计修复验证结果 | QA/维护者 |
| [变更日志](changelog.md) | v1.0 → v3.2.3 完整变更记录 | 维护者 |

## 🎯 按场景导航

### 「我想快速上手」
→ 阅读 [快速开始](getting-started.md)，然后直接使用 `Use devflow-evo`

### 「我需要理解架构」
→ 阅读 [架构设计](architecture.md) + [进阶主题](advanced.md)

### 「我的项目该用哪个模式？」
→ 阅读 [模式判定](modes.md)，特别是「模式决策树」章节

### 「我想自定义流程」
→ 阅读 [Phase Skills 参考](stage-skills.md) + [进阶主题](advanced.md)中的 Hooks 系统

### 「Token 花费太高」
→ 阅读 [Token 预算管理](token-budget.md) + [modes.md]中的 Lean/Fast 模式

### 「我想集成 GitNexus / OpenSpec」
→ 阅读 [集成指南](integration.md)

## 📖 快速链接

- **GO.md** — 统一路由入口（根目录）
- **SKILL.md** — 主 Skill 定义（根目录）
- **references/RULES-v3.md** — R1-R20 规则集
- **layers/L1-INTERACTION/** — Phase 技能文件
- **layers/L2-ENGINE/** — 引擎层实现
- **layers/L3-ARCHITECTURE/** — 架构层设计

## ⚠️ 文档维护说明

所有文档必须与代码同步更新。修改任何功能行为时，对应的文档必须在同一个 commit 中更新。
