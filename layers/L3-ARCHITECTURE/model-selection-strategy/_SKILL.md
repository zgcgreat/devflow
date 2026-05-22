---
name: model-selection-strategy
version: 3.0.0
layer: L3-ARCHITECTURE
gate: internal
requires: [domain-complexity-mapping]
provides: [model-assignment, fallback-chain]
description: Intelligent model selection strategy mapping task types to optimal AI models with fallback chains
source: devflow-evo Provider-Gateway + superpowers model routing
dependencies:
  - provider-gateway
triggers:
  - task assignment
  - wave execution
  - runtime detection
runtime-inputs: [task-type]
---

# Model Selection Strategy — 模型选择策略

## 核心原则

不同任务需要不同模型能力。用 GPT-4o 写 CRUD 是浪费，用 Haiku 做架构设计是冒险。

## 任务-模型映射

| 任务类型 | 首选模型 | 降级链 | 理由 |
|---------|---------|--------|------|
| **架构设计** | Claude Opus / GPT-4o | Sonnet → Haiku | 需要深度推理 |
| **代码实现** | Claude Sonnet / GPT-4o-mini | Haiku → Opus | 平衡速度和质量 |
| **代码审查** | Claude Opus / GPT-4o | Sonnet → Haiku | 需要发现细微问题 |
| **测试编写** | Claude Sonnet / GPT-4o-mini | Haiku → Sonnet | 模式化任务 |
| **文档撰写** | Claude Haiku / GPT-4o-mini | Sonnet → Opus | 创意任务，中等推理 |
| **Bug 调试** | Claude Opus / GPT-4o | Sonnet → Haiku | 需要推理链 |
| **重构** | Claude Sonnet / GPT-4o | Opus → Haiku | 需要理解代码上下文 |
| **简单查询** | Claude Haiku / GPT-4o-mini | Sonnet | 快速响应 |

## Provider Gateway 集成

```yaml
# .devflow-evo/providers.yaml
providers:
  anthropic:
    models:
      - id: claude-opus-4
        tier: premium
        rpm: 1000
        context: 200000
      - id: claude-sonnet-4
        tier: standard
        rpm: 4000
        context: 200000
      - id: claude-haiku
        tier: economy
        rpm: 8000
        context: 200000

  openai:
    models:
      - id: gpt-4o
        tier: premium
        rpm: 500
        context: 128000
      - id: gpt-4o-mini
        tier: economy
        rpm: 10000
        context: 128000

routing:
  architecture: [claude-opus-4, gpt-4o, claude-sonnet-4]
  implementation: [claude-sonnet-4, gpt-4o-mini, claude-haiku]
  review: [claude-opus-4, gpt-4o, claude-sonnet-4]
  testing: [claude-sonnet-4, gpt-4o-mini, claude-haiku]
  documentation: [claude-haiku, gpt-4o-mini, claude-sonnet-4]
  debugging: [claude-opus-4, gpt-4o, claude-sonnet-4]
  refactoring: [claude-sonnet-4, gpt-4o, claude-opus-4]
  simple_query: [claude-haiku, gpt-4o-mini, claude-sonnet-4]
```

## 降级策略

```
1. 首选模型不可用 (rate limit / outage)
   → 降级链中下一个模型
   → 指数退避: 5s → 10s → 20s → 40s
   
2. 所有同 tier 模型不可用
   → 升级到更高 tier (如果预算允许)
   → 或降级到更低 tier (标注风险)
   
3. 所有模型不可用
   → 暂停执行
   → 通知用户
   → 等待恢复后自动重试
```

## Phase 集成

### Phase 3 (Task Plan)
为每个任务标注推荐模型和降级链。

### Phase 4 (Build)
Wave 执行器根据任务类型选择模型，自动降级。

### Phase 6 (Review)
审查使用高端模型，确保质量。

## Error Taxonomy (Model Selection Strategy 专属)

| Level | Name | Action | Impact |
|-------|------|--------|--------|
| P0 | ALL_PROVIDERS_DOWN | 所有模型不可用 → 暂停执行 + 通知用户 | 完全阻塞，无法继续 |
| P1 | FALLBACK_CHAIN_EXHAUSTED | 降级链耗尽 → 升级 tier（预算允许）或暂停 + 标注风险 | 当前任务降级或暂停 |
| P2 | TIER_MISMATCH | 低 tier 模型执行高复杂度任务 → 检测并建议升级 | 质量风险，非阻塞 |
| P3 | ROUTING_STALE | providers.yaml 配置过时（模型已下线）→ 自动探测并标记 | 降级链无效，首次调用时才发现 |

## Boundary Conditions (Model Selection Strategy)

| Condition | Action | Rationale |
|-----------|--------|-----------|
| 首选模型 rate limit | 指数退避 5s→10s→20s→40s，尝试降级链下一个 | 避免立即失败，给 provider 恢复时间 |
| 同 tier 所有模型不可用 | 升级 tier（premium）或降级 tier（标注风险） | 不应卡在同一 tier 反复重试 |
| premium tier 预算耗尽 | 降级到 standard tier + 用户通知 | 成本控制优先于质量最优 |
| 任务类型未在映射表中 | 默认使用 standard tier（Claude Sonnet / GPT-4o-mini） | 安全默认值，平衡速度和质量 |
| 指数退避累计 > 5 分钟 | 放弃当前 provider，切换到降级链下一个 | 避免无限等待 |
