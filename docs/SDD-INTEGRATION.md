# Spec-Driven Development (SDD) 集成

> **状态**: Draft
> **版本**: v3.0-draft
> **创建日期**: 2026-05-20

## 概述

devflow v3.0 集成 Spec-Driven Development 方法论，将规范优先的开发流程嵌入 Phase 1b-2 之间，自动生成结构化 Spec 文档作为 Phase 2 的输入。

## SDD 在 devflow 流程中的位置

```
Phase 0 (Strategy) → Phase 1 (5 Whys) → Phase 1b (Discuss)
                                                    ↓
                                          SDD 集成点（可选）
                                                    ↓
Phase 2 (Design) ← CONTEXT.md ← specs/
```

## 命令

```bash
/devflow spec define "需求描述"    # 生成 specs/XXX/spec.md
/devflow spec plan "技术描述"      # 生成 specs/XXX/plan.md
/devflow spec tasks                # 生成 specs/XXX/tasks.md
```

## SDD 流程

### Step 1: Spec 定义

从 Phase 1b 的 CONTEXT.md 中提取需求，生成结构化 spec.md：

```yaml
# specs/<feature>/spec.md
name: <feature-name>
status: draft
requires: [<from-CONTEXT.md>]
acceptance_criteria:
  - AC1: <具体验收标准>
  - AC2: <具体验收标准>
constraints:
  - <技术约束>
  - <业务约束>
```

### Step 2: Spec 计划

基于 spec.md 生成技术实现计划 plan.md：

```yaml
# specs/<feature>/plan.md
approach: <实现方案>
components:
  - <涉及的组件/模块>
risks:
  - <已识别风险>
```

### Step 3: Spec 任务

从 plan.md 自动生成任务列表 tasks.md，与 Phase 3 的 task-plan 对齐。

## 与 Delta Specs 的关系

- SDD 首次生成完整 spec（Greenfield）
- 后续迭代使用 Delta Specs（Brownfield），仅记录差量
- Delta Specs 节约 76-87% Token（R11 规则）

## 自动化集成

- SDD 完成后自动生成 CONTEXT.md
- CONTEXT.md 直接作为 Phase 2 的输入
- 如用户跳过 SDD，Phase 2 可从 Phase 1b 的决策记录直接开始
