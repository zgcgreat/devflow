# Token 预算管理 (Surface Budget)

> **状态**: Draft
> **版本**: v3.0.0
> **创建日期**: 2026-05-20

## 概述

devflow-evo v3.0 提供精细化的 Token 预算管理，确保 AI 在长流程执行中不会因上下文溢出而丢失关键信息。

## 预算预设

| 预设级别 | 总预算 | Orchestrator | Agent | 压缩策略 |
|---------|--------|-------------|-------|---------|
| Small | 128K | ~30K | ~80K | Phase 3 起强制压缩 |
| Medium | 300K | ~50K | ~200K | Phase 5 起自动压缩 |
| Large | 500K | ~80K | ~350K | Phase 7 起建议压缩 |
| Enterprise | 1M | ~100K | ~800K | 按需压缩 |

## 命令

```bash
/devflow-evo budget set 300K              # 设定300K预算
/devflow-evo budget preset medium         # 使用预设（small/medium/large/enterprise）
/devflow-evo budget status                # 查看当前预算使用情况
```

## 预算分配规则

### R7 Token 预算分配

- **R7.1** Orchestrator 上下文 ~50K tokens（承载路由声明 + 阶段状态）
- **R7.2** Research/Execution Agent 各自 ~200K fresh context，会话隔离不共享记忆
- **R7.4** 换角色必须清窗或重置上下文

### 自动压缩触发

| Token 使用率 | 动作 |
|-------------|------|
| < 50% | 不压缩，正常加载 |
| 50-70% | 提示：建议使用 `lite` 压缩 |
| 70-85% | 强制：自动切换到 `full` 压缩 |
| 85-90% | 警告：切换到 `ultra` 压缩 |
| > 90% | 暂停：强制 `extreme` 压缩，等待人工确认 |

### 压缩策略

| 级别 | 方法 | 压缩率 |
|------|------|--------|
| lite | 删除注释和空行 | ~30% |
| full | Delta Specs + 摘要 | ~60% |
| ultra | Caveman 压缩 + 结构保留 | ~80% |
| extreme | 仅保留 Gate 产物 + 关键决策 | ~90% |

## 与 Phase 流程的集成

- Phase 切换时自动评估当前 Token 使用率
- 超过阈值时自动触发压缩，优先保留 Gate 产物和当前 Phase 上下文
- Wave 执行中每个 task 完成后检查预算，必要时提前终止 Wave
