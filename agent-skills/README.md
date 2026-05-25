# Agent Skills

通用工程能力技能集合，源自 [Addy Osmani 的 Agent Skills](https://github.com/addyosmani/agent-skills) 项目，经 devflow 适配。

## 定位

| 维度 | 说明 |
|------|------|
| **与 `skills/` 的区别** | `skills/` 是 devflow **流程操作技能**（brainstorming、writing-plans 等）；本目录是**通用工程能力技能**（代码审查、安全加固、API 设计等） |
| **使用方式** | WorkBuddy 自动扫描 `SKILL.md` 格式文件，按 skill name 匹配触发 |
| **引用方式** | 路径格式：`agent-skills/skills/<skill-name>/SKILL.md` |

## 技能列表（24 个）

| 技能 | 类别 | 说明 |
|------|------|------|
| `api-and-interface-design` | 设计 | API 与接口设计 |
| `browser-testing-with-devtools` | 测试 | 浏览器 DevTools 测试 |
| `ci-cd-and-automation` | 运维 | CI/CD 与自动化 |
| `code-review-and-quality` | 质量 | 代码审查与质量 |
| `code-simplification` | 重构 | 代码简化 |
| `context-engineering` | 工程 | 上下文工程 |
| `debugging-and-error-recovery` | 调试 | 调试与错误恢复 |
| `deprecation-and-migration` | 运维 | 弃用与迁移 |
| `documentation-and-adrs` | 文档 | 文档与架构决策记录 |
| `doubt-driven-development` | 质量 | 怀疑驱动开发 |
| `frontend-ui-engineering` | 前端 | 前端 UI 工程 |
| `git-workflow-and-versioning` | 工程 | Git 工作流 |
| `idea-refine` | 设计 | 创意精炼 |
| `incremental-implementation` | 工程 | 增量实现 |
| `interview-me` | 需求 | 需求访谈 |
| `performance-optimization` | 性能 | 性能优化 |
| `planning-and-task-breakdown` | 规划 | 规划与任务分解 |
| `security-and-hardening` | 安全 | 安全加固 |
| `shipping-and-launch` | 运维 | 发布与上线 |
| `source-driven-development` | 工程 | 源码驱动开发 |
| `spec-driven-development` | 工程 | 规格驱动开发 |
| `specialist-pool` | 质量 | 专家角色池 |
| `test-driven-development` | 测试 | 测试驱动开发（完整版） |
| `using-agent-skills` | 元技能 | 技能发现与调用 |

## 与 prompts/ 的关系

`references/prompts/` 中各阶段 prompt 通过 `agent-skills/skills/<name>/SKILL.md` 引用本目录的技能作为前置加载项。
