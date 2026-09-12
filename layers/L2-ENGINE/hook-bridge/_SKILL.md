---
name: hook-bridge
description: |
  DevFlow 统一 Hook 桥接层 — 双实现 Hook 体系，将 DevFlow Markdown 指令式 Hook (L0 基线)
  与 ECC JS 脚本 Hook (L1 运行时增强) 桥接，同一 Hook 双实现 + 自动降级。9个Hook完整覆盖。
layer: L2-ENGINE
version: 1.0.0
requires: [hooks-system]
provides: [dual-layer-hooks, hook-mapping, degradation-protocol]
---

# Hook Bridge: 统一 Hook 抽象层

> DevFlow 核心创新: 同一 Hook 双实现，零运行时基线 + 运行时增强，自动降级。

## 三层 Hook 架构

### Layer 0: Markdown Hook（基线，零运行时）

- 定义: `hooks/markdown-hooks.yaml`
- 执行: AI 按 Markdown 指令执行
- 覆盖: context-monitor, prompt-guard, phase-transition, tool-execution, compact-suggest
- 降级: 无（零运行时完整能力）

### Layer 1: JS Script Hook（运行时增强）

- 定义: `hooks/hooks.json`（Claude Code 专用）
- 执行: Node.js 脚本实际执行
- 覆盖: format-typecheck, console-log-check, security-scan, cost-tracker, compact-suggest, context-monitor
- 依赖: Node.js 可用时自动启用

### Layer 2: Chain-Trigger（链式触发）

- 定义: `hooks/markdown-hooks.yaml chains 段`
- 跨 Layer 联动: Layer0→Layer1 触发链
- 运行时增强: 当 Layer1 可用时，自动升级执行

## 降级协议

```
node --version 可执行?
  Yes → Layer0+Layer1+Layer2 全量启用
  No  → Layer0+Layer2 仅 Markdown 模式
```

## Hook 映射表

| # | Hook名称 | Markdown(L0) | JS脚本(L1) | 映射Gate | 降级方案 |
|---|---------|-------------|-----------|---------|---------|
| 1 | context-monitor | DevFlow hooks-system定义 | ecc-context-monitor.js | Phase切换 | AI按阈值自检+手动压缩 |
| 2 | format-typecheck | AI按清单检查 | stop-format-typecheck.js | G5(P4后), G7(P6后) | AI手动格式化+类型检查 |
| 3 | console-log-check | AI自查清单 | check-console-log.js | G5(P4后) | AI自查console.log |
| 4 | security-scan | AI按安全清单审查 | insaits-security-wrapper | G6(P5后), G7(P6后) | AI按OWASP清单审查 |
| 5 | prompt-guard | DevFlow hooks-system定义 | (ECC内置于session-start) | Phase切换 | AI自行检查输入 |
| 6 | cost-tracker | AI估算+记录 | cost-tracker.js | SessionEnd | 人工记录成本 |
| 7 | compact-suggest | DevFlow hooks-system定义 | suggest-compact.js | Phase切换 | 人工判断compact |
| 8 | phase-transition | DevFlow hooks-system定义 | (ECC无对应) | Phase切换 | AI按清单保存检查点 |
| 9 | tool-execution | DevFlow hooks-system定义 | (ECC内置于tool-call) | 工具调用 | AI按审计清单检查 |

## Gate-Hook 协同模型

AI完成Phase任务后:
- 运行时可用? → No: 执行Markdown Hook清单 → 展示结果 → 人工确认
- 运行时可用? → Yes: 执行映射的Hook脚本 + Markdown Hook
  - ALL PASS → 展示综合报告 → 人工确认
  - HOOK FAIL → 展示FAIL原因+推荐 → **人工决策(可覆盖)** ← 关键修订
  - HOOK ERROR → 降级WARNING → 展示Markdown清单 → 人工确认

关键: Hook FAIL ≠ Gate 自动FAIL. Hook FAIL = Gate输入信号 + 推荐FAIL + 原因. 最终决策权在人工确认(宪法第8条).
