# DevFlow 核心产物模板库

本目录包含 DevFlow Phase 0-8 的 **32 个核心产物模板**，被 L1-INTERACTION 层所有 Phase _SKILL.md 引用。

> **目录定位**: 这是 DevFlow **主模板目录**。Phase _SKILL.md 中的模板引用统一指向 `references/templates/`。
> 早期曾从 `sources/gsd-workflows/` 抽取遗留模板，该外部副本目录已移除；本目录为唯一主模板来源。

## Phase 与模板映射

| Phase | 模板文件 | 产物用途 |
|-------|---------|---------|
| Phase 0 | `00-strategy.md` / `00-requirements.md` | YC 六问战略评估（引擎产物）/ 需求确认 |
| Phase 1 | `01-analysis.md` / `01-analysis-delta.md` | 需求分析 + AC / Delta 格式 |
| Phase 1b | `01b-context.md` | 决策捕获上下文（Phase 1b 产物；`CONTEXT.md` 为项目级共享上下文模板，非 Phase 1b 产物） |
| Phase 2 | `02-design.md` / `02-design-delta.md` | 方案设计 / Delta 格式 |
| Phase 2a | `02a-variants.md` / `02a-ui-design.md` | 设计变体对比与选择 / UI 设计变体 |
| Phase 3 | `03-tasks.md` / `03a-implementation-plan.md` | 任务拆分 + 实施计划 |
| Phase 4 | `04-wave-logs.md`（`dev-log.md` 为任务级记录） | Wave 执行日志汇总（`04-dev-log.md` 已弃用，保留供历史 req 参考） |
| Phase 5 | `05-test-report.md` | 测试结果报告 |
| Phase 6 | `06-review.md` | 三层对抗审查报告（`06-code-review.md` 已弃用，保留供历史 req 参考） |
| Phase 7 | `07-canary.md` | 灰度发布报告（`07-release-checklist.md` 已弃用，保留供历史 req 参考） |
| Phase 8 | `08-archive.md` / `lessons-learned.md` | 归档报告（主产物）/ 经验沉淀 |
| 通用 | `STATE.md` / `constitution-template.md` / `spec-constitution-template.md` / `spec-sdd-template.md` | 状态追踪 + 宪法 + SDD 模板 |
| 通用 | `architecture-evolution.md` / `system-architecture.md` / `design-baseline.md` / `requirements-baseline.md` / `dev-snapshot.md` / `health-check.md` | 架构演进 + 系统 + 设计基线 + 需求基线 + 开发快照 + 健康检查 |

## 使用规则

1. Phase _SKILL.md 引用模板时使用路径 `references/templates/<filename>.md`
2. Delta 模板（带 `-delta` 后缀）仅用于 Brownfield 场景的差量规范
3. 模板内容可按项目规模裁剪（Fast 模式使用简化版本）