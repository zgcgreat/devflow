# 交互层 Ultimate 模板库

整合自 get-shit-done 项目，共 **55 个模板**。

> **⚠️ 目录定位**: 本目录为 `gsd-workflows/` 遗留模板库，仅被 `layers/L1-INTERACTION/gsd-workflows/` 下的文件引用。
> devflow 核心流程模板位于 `references/templates/`（25 个 Phase 产物模板），Phase _SKILL.md 统一引用 `references/templates/`。
> 两个目录**不合并**，避免破坏 gsd-workflows 引用链。

---

## Phase 与模板映射

### Phase 0: 入场 & 初始化

| 模板 | 用途 |
|------|------|
| `project.md` | 项目启动信息收集 |
| `user-setup.md` | 用户环境配置 |
| `user-profile.md` | 用户偏好档案 |
| `context.md` | 初始上下文记录 |

### Phase 1: 需求 & 研究

| 模板 | 用途 |
|------|------|
| `requirements.md` | 需求文档 |
| `research.md` | 研究报告 |
| `discovery.md` | 发现总结 |
| `research-project/` | 完整研究项目结构 |

### Phase 2: 架构 & 设计

| 模板 | 用途 |
|------|------|
| `spec.md` | 技术规格说明书 |
| `AI-SPEC.md` | AI功能规格 |
| `UI-SPEC.md` | UI设计规格 |
| `roadmap.md` | 技术路线图 |

### Phase 3-4: 开发 & 测试

| 模板 | 用途 |
|------|------|
| `codebase/` | 代码库结构模板 |
| `DEBUG.md` | 调试报告模板 |
| `debug-subagent-prompt.md` | 调试子代理提示 |
| `planner-subagent-prompt.md` | 规划子代理提示 |
| `UAT.md` | 用户验收测试 |
| `VALIDATION.md` | 验证报告 |

### Phase 5: 质量 & 安全

| 模板 | 用途 |
|------|------|
| `SECURITY.md` | 安全审计报告 |
| `verification-report.md` | 验证报告 |
| `milestone.md` | 里程碑记录 |

### Phase 6-7: 部署 & 上线

| 模板 | 用途 |
|------|------|
| `dev-preferences.md` | 开发偏好配置 |
| `copilot-instructions.md` | Copilot指令 |

### Phase 8: 复盘 & 知识沉淀

| 模板 | 用途 |
|------|------|
| `retrospective.md` | 复盘会议记录 |
| `milestone-archive.md` | 里程碑归档 |
| `discussion-log.md` | 讨论日志 |
| `continue-here.md` | 继续指引 |

---

## 模板详解

### 核心模板

#### `spec.md` - 技术规格说明书
**Phase 2 使用**
```markdown
# 技术规格说明书

## 概述
[项目名称、目标、范围]

## 技术架构
[系统架构设计]

## API设计
[REST/GraphQL API规格]

## 数据模型
[数据库schema]

## 依赖
[外部依赖列表]
```

#### `AI-SPEC.md` - AI功能规格
**Phase 2 使用**
```markdown
# AI功能规格

## AI能力概述
[LLM能力的描述]

## 提示词设计
[系统提示、用户提示]

## 上下文管理
[记忆、状态管理]

## 限制与边界
[Token限制、速率限制]
```

#### `UI-SPEC.md` - UI设计规格
**Phase 2 使用**
```markdown
# UI设计规格

## 设计语言
[颜色、字体、间距]

## 组件库
[UI组件定义]

## 布局
[页面布局]

## 响应式
[断点设计]
```

#### `SECURITY.md` - 安全审计报告
**Phase 5 使用**
```markdown
# 安全审计报告

## 审计范围
[本次审计覆盖的内容]

## 发现的问题
[P0-P3安全问题列表]

## 建议修复
[修复方案]

## 验证结果
[修复后的验证]
```

---

## 剪裁规则

### 小型项目（<1周）
- 必选：`project.md`, `spec.md`, `requirements.md`
- 可选：`summary-minimal.md`, `DEBUG.md`
- 跳过：`UAT.md`, `SECURITY.md`, `retrospective.md`

### 中型项目（1-4周）
- 必选：所有 Phase 0-4 模板
- 可选：`milestone.md`, `verification-report.md`
- 跳过：`research-project/`（如不需要深度研究）

### 大型项目（>1月）
- 全量使用
- 建议：每两周一次 `retrospective.md`
- 建议：为每个里程碑创建 `milestone-archive.md`

---

## 模板使用流程

1. **入场（Phase 0）** → `project.md`, `user-setup.md`
2. **需求（Phase 1）** → `requirements.md`, `research.md`
3. **架构（Phase 2）** → `spec.md`, `AI-SPEC.md`, `UI-SPEC.md`
4. **开发（Phase 3-4）** → `codebase/`, `DEBUG.md`, `UAT.md`
5. **质量（Phase 5）** → `SECURITY.md`, `VALIDATION.md`
6. **部署（Phase 6-7）** → `dev-preferences.md`
7. **复盘（Phase 8）** → `retrospective.md`, `milestone-archive.md`

---

## 自定义模板

如需自定义模板：
1. 在对应 Phase 目录创建
2. 使用 `[TEMPLATE:filename.md]` 标记引用
3. 更新本 README 的映射表

---

## 来源

本模板库整合自 [get-shit-done](https://github.com/therobbrennan/get-shit-done) 项目。
