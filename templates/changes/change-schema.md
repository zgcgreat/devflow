# .devflow-evo-change.yaml Schema

变更元数据文件，位于每个变更目录的根目录。

## 字段定义

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| name | string | 是 | 变更名称 (kebab-case) |
| schema | string | 否 | 使用的 ArtifactGraph Schema，默认 spec-driven |
| created | date | 是 | 创建日期 (YYYY-MM-DD) |
| goal | string | 是 | 变更目标描述 |
| affected_areas | string[] | 否 | 影响的区域标签 |
| status | enum | 是 | 变更状态 |
| artifacts | object | 否 | 各制品的完成状态 |

## Status 枚举

| 状态 | 说明 |
|------|------|
| proposal | 提案阶段 |
| design | 设计阶段 |
| tasks | 任务规划阶段 |
| applying | 正在实施 |
| verifying | 正在验证 |
| archived | 已归档 |

## 示例

```yaml
name: add-dark-mode
schema: spec-driven
created: 2026-05-19
goal: "Add dark mode support with system preference detection"
affected_areas: [ui, theming, accessibility]
status: proposal
artifacts:
  proposal: { completed: true, updated: 2026-05-19 }
  specs: { completed: false }
  design: { completed: false }
  tasks: { completed: false }
```

## 自定义 Schema 示例

```yaml
name: api-refactor
schema: custom-api-schema
created: 2026-05-20
goal: "Refactor REST API to GraphQL"
affected_areas: [api, backend, frontend]
status: proposal
artifacts:
  proposal: { completed: true }
  api-design: { completed: false }
  migration-plan: { completed: false }
  rollback-plan: { completed: false }
```
