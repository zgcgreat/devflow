# L3-Provider Gateway — 模型/Provider 智能路由与降级

> **Layer**: L3-ARCHITECTURE (全局协调层)  
> **前置**: Wave 任务已生成, 每个任务标注了类型标签  
> **后置产物**: Provider assignment table (任务 → Model + fallback chain)  
> **门控**: R10 — Provider Selection Rule

## Skill元信息

```yaml
name: provider-gateway
version: 3.0
layer: L3-ARCHITECTURE
source: Multi-provider routing from v3 provider gateway concept, cost awareness from flow-kit
dependencies:
  - WAVE-PLAN.md (input: wave tasks with type labels)
v3_upgrade:
  multi_provider_routing: true (Claude/Codex/Gemini/GPT-4o)
  fallback_chain: true (with exponential backoff)
  cost_awareness: true (auto-downgrade logic)
  performance_logging: true
```

## 输入

- WAVE-PLAN.md (每波的任务列表 + 类型标签)
- 可用 Providers (通过 `Model` Skill 查询)
- Token budget constraints (来自 token-budget.md)

## 输出

- Provider Assignment Table — 每个任务分配的主 Provider + fallback chain
- Cost Report — 预估 token 花费 per provider tier

---

## Provider Selection Matrix

| Task Type | Primary Provider | Fallback 1 | Fallback 2 | Reasoning |
|-----------|-----------------|------------|------------|-----------|
| **Coding** (Phase 4) | Claude Opus / Sonnet | Codex | Gemini Ultra | 代码生成需要强逻辑推理能力 |
| **Design** (Phase 2/2a) | GPT-4o (vision) | Claude Sonnet | — | UI设计需要视觉理解能力 |
| **Review** (Phase 6) | Claude Opus + Codex (dual) | Claude Sonnet | Gemini Opus | 双模型交叉验证发现更多bug |
| **Research** (Phase 1) | GPT-4o | Claude Sonnet | — | 信息检索需要广博知识覆盖面 |
| **Spec Writing** (Phase 2) | Claude Opus | Claude Sonnet | — | 规范撰写需要长上下文一致性 |
| **Quick Fix** (quick bundle) | Claude Haiku | GPT-4o-mini | — | 简单任务用快速低价模型 |
| **Testing** (Phase 5) | Codex | Claude Sonnet | — | 测试生成偏向代码执行能力 |

---

## Fallback Chain with Exponential Backoff

```python
import time

async def execute_with_fallback(task, provider_chain):
    """
    Execute task with provider fallback chain.
    Each fallback waits with exponential backoff before retry.
    """
    for attempt_idx, provider in enumerate(provider_chain):
        try:
            result = await provider.call(task)
            
            # Validate response quality
            if validate_response(result, task):
                log_provider_performance(provider, success=True, latency=result.latency)
                return result
            
            # Response validation failed — trigger fallback
            log_provider_performance(provider, success=False, reason="validation_failed")
            
        except ProviderTimeoutError as e:
            log_provider_performance(provider, success=False, reason="timeout")
            if attempt_idx < len(provider_chain) - 1:
                wait_time = 2 ** attempt_idx * 5  # 5s, 10s, 20s...
                print(f"[provider-gateway] {provider} timeout, retry in {wait_time}s")
                time.sleep(wait_time)
            continue
            
        except ProviderQuotaError as e:
            log_provider_performance(provider, success=False, reason="quota_exceeded")
            if attempt_idx < len(provider_chain) - 1:
                print(f"[provider-gateway] {provider} quota exceeded, switching to next provider")
                continue
            raise
        
        except ProviderRateLimitError as e:
            log_provider_performance(provider, success=False, reason="rate_limited")
            if attempt_idx < len(provider_chain) - 1:
                retry_after = e.retry_after or (2 ** attempt_idx * 10)
                print(f"[provider-gateway] {provider} rate limited, waiting {retry_after}s")
                time.sleep(retry_after)
            continue
    
    raise AllProvidersExhaustedError(
        f"No provider succeeded for task: {task.id}. "
        f"Tried: {[p.name for p in provider_chain]}"
    )


def validate_response(result, task):
    """
    Basic response validation before accepting as successful.
    """
    checks = [
        result.content and len(result.content) > 0,          # Non-empty
        result.error is None,                                  # No execution error
        result.exit_code == 0 if hasattr(result, 'exit_code') else True,
        not result.is_hallucination(task.requirements),       # Anti-hallucination (R6)
    ]
    return all(checks)


def log_provider_performance(provider, success, reason=None, latency=None):
    """
    Log provider performance metrics for cost/performance optimization.
    This feeds into the "cost awareness" loop.
    """
    log_entry = {
        "timestamp": now_iso(),
        "provider": provider.name,
        "success": success,
        "reason": reason,
        "latency_ms": latency,
        "tokens_used": result.tokens if hasattr(result, 'tokens') else 0,
    }
    APPEND("logs/provider-performance.jsonl", log_entry)


# Cost downgrade logic
def should_downgrade(provider, task):
    """
    Decide whether to use a cheaper model for the same task.
    
    Criteria:
    - Task is quick fix (< 500 words equivalent)
    - Provider's last 10 attempts all succeeded (high reliability)
    - Task type allows lower-tier models (e.g., quick fix, not design)
    """
    if task.complexity == "quick" and provider.reliability_score >= 0.95:
        return provider.downgrade_to_cost_saver()
    
    if task.type in ["simple_fix", "documentation_update", "config_change"]:
        return provider.get_lowest_tier()
    
    return None  # Stay on current provider
```

---

## Cost Awareness & Downgrade Logic

| Provider Tier | Model Examples | Relative Cost | Use When |
|---------------|---------------|--------------|----------|
| **Tier 1 (Premium)** | Claude Opus, GPT-4o | 10x base | Design, Review, Spec Writing |
| **Tier 2 (Standard)** | Claude Sonnet, Codex | 3x base | Coding, Testing, Research |
| **Tier 3 (Economy)** | Claude Haiku, GPT-4o-mini | 1x base | Quick fix, Documentation, Config |

### Downgrade Rules (自动降级)

```yaml
if task.complexity == "quick" AND provider.reliability >= 95%:
    action: downgrade_to_economy
    
elif task.type IN ["config_change", "docs_update", "typo_fix"]:
    action: force_tier_3
    
elif primary_provider.rate_limited:
    action: fallback_to_next_tier
    
elif primary_provider.quota_exhausted:
    action: switch_to_second_priority_provider
```

---

## Performance Logging Format

每笔 Provider 调用后记录：

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 |
| `provider` | Provider name + model |
| `task_id` | Wave task ID |
| `success` | true/false |
| `reason` | success / timeout / quota / rate_limit / validation_failed |
| `latency_ms` | Response time |
| `tokens_used` | Input + output tokens |
| `fallback_chain_position` | Which attempt (1/2/3...) |

---

## Token Budget Profile

| Step | Context Size | Tokens Est. | Notes |
|------|-------------|-------------|-------|
| Provider Selection | Provider table (~5K) | ~200 | Read once per wave |
| Fallback Chain | Per-attempt response | Varies | Logged for optimization |
| Performance Log | JSONL append-only | ~50/entry | Low cost, high value |

> Provider Gateway 的路由决策 token 成本极低 (~200 tokens)，但其优化效果体现在整体 token 节省——正确选择 Economy tier 可降低成本 60-90%。

---

## Phase Integration

| Phase | Usage |
|-------|-------|
| **Phase 4 (Build)** | Per-task provider assignment from WAVE-PLAN.md type labels |
| **Phase 6 (Review)** | Dual-model routing (Claude + Codex) for [CRITICAL] tasks |
| **All Phases** | Cost logging → monthly optimization review |

---

## 向后兼容

| v1.0 产物 | Provider Gateway 处理 |
|-----------|---------------------|
| No provider specified | Default to: Claude Sonnet (balanced) |
| Single model preference | Use as primary, auto-fallback chain |
| `--no-fallback` flag | Use only primary provider, fail on first error |
