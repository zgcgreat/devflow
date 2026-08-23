---
name: token-monitor
preamble-tier: 2
version: 1.0.0
layer: L2-ENGINE
gate: internal
requires: []
provides: [token-budget-status, compression-trigger, pause-trigger]
description: |
  Token 预算运行时监控 — 基于 post_tool_use Hook 实现。
  >50% ADVISORY 提醒，>70% 自动切换 lite 压缩模式，>90% 暂停等待用户确认。
  来源: INTEGRATION-PLAN P1-4 — caveman caveman-stats + Ruflo context-monitor。
source: INTEGRATION-PLAN P1-4
dependencies:
  - surface-switch (70% 阈值触发自动压缩)
  - hooks-system (Hook 注册和执行)
triggers:
  - 每次工具调用后自动触发 (post_tool_use)
  - 手动检查 Token 预算
---

# Token Monitor — Token 预算运行时监控

> **核心问题**: R6 定义了 Token 压缩策略（>70% 自动压缩，>90% 暂停），但缺乏运行时监控和自动触发机制。
> **解决方案**: token-monitor.js Hook 在每次工具调用后检查 Token 使用率，自动触发压缩或暂停。

---

## 阈值与自动动作

| 阈值 | 级别 | 自动动作 | 说明 |
|------|------|---------|------|
| >50% | ADVISORY | 无（仅提醒） | 建议关注消耗趋势，避免加载不必要文件 |
| >70% | WARNING | surface-switch lite | 自动切换到 lite 压缩模式，减少加载 |
| >90% | CRITICAL | 暂停等待确认 | 暂停执行，建议 compact 或结束 Phase |

## Statusline 集成

```
ForgeOS Token: ████████░░ 78% | Mode: lite | Saved: 12.3K
```

## 与 R6 的映射

| R6 规则 | Token Monitor 实现 |
|---------|-------------------|
| R6.1 Full 压缩（默认） | <70% 时使用标准加载 |
| R6.2 Ultra 压缩（>100K tokens） | 70% 阈值触发 surface-switch lite |
| R6.3 Extreme 压缩（>180K tokens） | 90% 阈值触发暂停 + compact 建议 |
| R6.4 可逆性校验 | 压缩后验证关键决策点保留 |

## 降级策略

| 场景 | 降级行为 |
|------|---------|
| Token 信息不可用 | 跳过检查，输出 OK |
| surface-switch 不可用 | 仅输出 WARNING，不自动压缩 |
| Hook 执行超时 | 跳过检查（3000ms 超时） |

## 配置

默认配置（可通过 hooks.json 覆盖）:

```json
{
  "budget_model": "claude-sonnet-4-6",
  "total_budget": 200000,
  "thresholds": {
    "advisory": 0.5,
    "compress": 0.7,
    "pause": 0.9
  }
}
```

## 交互协议

### 70% 阈值触发时

```markdown
📊 Token 使用率 78%，已超过 70% 阈值。自动切换到 lite 压缩模式。

自动执行: /forgeos:surface lite
- 减少加载的 reference 文件
- 压缩 LESSONS 到 <5K tokens
- 仅保留当前 Phase 必需内容

继续执行...
```

### 90% 阈值触发时

```markdown
⚠️ Token 使用率 92%，已超过 90% 阈值。

建议操作:
1. 运行 /compact 压缩上下文
2. 完成当前 Phase 的最小产出后停止
3. 等待用户确认是否继续

是否继续？
[1] 继续执行（压缩上下文后）
[2] 暂停，保存当前进度
[3] 结束当前 Phase
```
