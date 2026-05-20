# 多项目管理

> **状态**: Draft
> **版本**: v3.0-draft
> **创建日期**: 2026-05-20

## 概述

devflow-evo v3.0 支持同时管理多个项目，实现快速切换、状态同步和知识共享。

## 核心能力

| 能力 | 说明 |
|------|------|
| 项目列表 | 列出工作区内所有已注册项目 |
| 项目创建 | 新建项目并初始化 `.devflow-evo/` 目录结构 |
| 项目切换 | 在多个项目间快速切换，自动恢复 STATE.md |
| 项目详情 | 查看项目当前 Phase、Wave 状态、LESSONS 摘要 |
| 工作区统计 | 汇总所有项目的进度和资源使用情况 |

## 命令

```bash
/devflow-evo projects list              # 列出所有项目
/devflow-evo projects new "名称"        # 创建新项目
/devflow-evo projects switch <id>       # 切换项目
/devflow-evo projects info <id>         # 查看项目详情
/devflow-evo workspace stats            # 工作区统计
```

## 项目间知识共享

- **LESSONS 跨项目**: 同工作区内项目共享 `memory/LESSONS.md` 中标记为 `cross-project` 的教训
- **Domain Skills 复用**: `memory/domain-skills/` 下的领域技能对同工作区所有项目可见
- **模板复用**: `templates/` 目录的模板对同工作区所有项目可用

## 多项目状态管理

每个项目的独立状态存储在 `<project>/.devflow-evo/STATE.md` 中，包含：

- 当前 Phase 和 Wave
- 最近一次 GATE 决策
- 暂停/恢复上下文

切换项目时：
1. 保存当前项目的 STATE.md
2. 加载目标项目的 STATE.md
3. 根据 STATE.md 恢复 Phase 上下文
