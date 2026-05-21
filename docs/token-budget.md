# Token 预算管理 — DevFlow-Evo v3.2

本文档介绍如何在 DevFlow-Evo 中进行 Token 预算管理和优化策略。

## Surface Budget 概念

**Surface Budget** 是对单个需求（req）的 Token 花费设置上限，避免长时间运行的任务消耗过多 Token。

## 预设档位

| 档位 | Token 预算 | 适用场景 |
|------|-----------|---------|
| small | 200K | Bug修复、typo修正 |
| medium | 500K | 常规功能开发（默认） |
| large | 1M | 中等复杂度项目 |
| enterprise | 3M+ | 大型重构 / 架构变更 |

## 命令用法

### 设置预算

```
/devflow-evo budget set 300K              # 设定300K预算
/devflow-evo budget preset medium         # 使用预设（small/medium/large/enterprise）
```

### 查看预算状态

```
/devflow-evo budget status                # 查看当前预算使用情况
```

### 预算管理策略

| 场景 | 策略 |
|------|------|
| Token 快用完 | 自动进入 `ultra` 压缩级别 |
| Wave N 完成时检查 | 预估剩余需求 > 剩余预算 → 继续；否则 → 建议切到 Fast 模式 |
| LESSON 记录成本 | 每条 LESSON 标注其 Token 开销，供后续评估参考 |

## Lean/Fast 模式的 Token 优化

Lean 和 Fast 模式是 Token 敏感场景的首选：

### Fast 模式（最低 Token）
- 跳过 Phase 0/1/1b/2/3，直接进入 Phase 4
- 跳过入场检测 + GitNexus
- 仅保留最简 Phase 5/6

### Lean 模式（低 Token）
- 从 Phase 2 开始（轻量方案设计）
- 简化入场检测（复用已有上下文）
- Phase 0/1 条件跳过（brownfield 明确需求）

## Caveman-Shrink 压缩集成

DevFlow-Evo v3.2+ 内置通信压缩引擎，可进一步降低 Token：

| 级别 | 额外节省 | 建议场景 |
|------|---------|---------|
| lite | ~30% | 简单任务辅助 |
| full | ~60% | 常规任务 + Fast/Lean |
| ultra | ~75% | Token 极度敏感 |
| extreme | ~90% | 极致压缩（损失部分细节） |

## Delta-Specs 差量规范

Brownfield 场景下，Delta-Specs 可节约 **76-87%** 的 Token：

```
传统方式: 重新生成全部 spec（包含未变动的旧模块）
Delta方式: 仅生成变更部分的 spec，旧模块引用已有 spec
节省: git-diff → symbol影响分析 → 差量spec生成
```

## 实践建议

1. **新项目**: 使用 `preset medium`，后续根据实际调整
2. **Brownfield 小改动**: `Fast 模式 + full 压缩`
3. **大型重构**: `preset enterprise + DAG 并行 + Delta-Specs`
4. **Token 监控**: 每个 Phase 完成时检查剩余预算
