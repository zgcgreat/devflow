# DevFlow 核心产物模板库

本目录包含 DevFlow Phase 0-8 的 **26 个核心产物模板**，被 L1-INTERACTION 层所有 Phase _SKILL.md 引用。

> **目录定位**: 这是 DevFlow **主模板目录**。Phase _SKILL.md 中的模板引用统一指向 `references/templates/`。
> 早期曾从 `sources/gsd-workflows/` 抽取遗留模板，该外部副本目录已移除；本目录为唯一主模板来源。

## Phase 与模板映射

| Phase | 模板文件 | 产物用途 |
|-------|---------|---------|
| Phase 0 | `00-requirements.md` | YC 六问战略评估 |
| Phase 1 | `01-analysis.md` / `01-analysis-delta.md` | 需求分析 + AC / Delta 格式 |
| Phase 1b | `CONTEXT.md` | 项目上下文与技术决策 |
| Phase 2 | `02-design.md` / `02-design-delta.md` | 方案设计 / Delta 格式 |
| Phase 2a | `02a-ui-design.md` | UI 设计变体 |
| Phase 3 | `03-tasks.md` / `03a-implementation-plan.md` | 任务拆分 + 实施计划 |
| Phase 4 | `04-dev-log.md` / `dev-log.md` | 开发日志 |
| Phase 5 | `05-test-report.md` | 测试结果报告 |
| Phase 6 | `06-code-review.md` | 代码审查记录 |
| Phase 7 | `07-release-checklist.md` | 发布检查清单 |
| Phase 8 | `lessons-learned.md` | 经验沉淀 |
| 通用 | `STATE.md` / `constitution-template.md` / `spec-constitution-template.md` / `spec-sdd-template.md` | 状态追踪 + 宪法 + SDD 模板 |
| 通用 | `architecture-evolution.md` / `system-architecture.md` / `design-baseline.md` / `requirements-baseline.md` / `dev-snapshot.md` / `health-check.md` | 架构演进 + 系统 + 设计基线 + 需求基线 + 开发快照 + 健康检查 |

## 使用规则

1. Phase _SKILL.md 引用模板时使用路径 `references/templates/<filename>.md`
2. Delta 模板（带 `-delta` 后缀）仅用于 Brownfield 场景的差量规范
3. 模板内容可按项目规模裁剪（Fast 模式使用简化版本）