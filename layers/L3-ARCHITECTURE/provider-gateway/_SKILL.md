---
name: provider-gateway
preamble-tier: 2
version: 3.0-draft
description: |
  Intelligent model routing engine that selects optimal AI providers based on task type,
  complexity, and cost constraints with fallback chains (exponential backoff).
  Use when: "route to provider", "select model", "provider fallback", "cost-aware routing". (ultimate-workflow)
layer: L3-ARCHITECTURE
source: SEP Provider Gateway + Cost-Aware Model Router
dependencies:
  - dag-router (input: task types from WAVE-PLAN.md)
  - agent-isolation (output: provider-assigned tasks run in isolated context)
triggers:
  - route to provider
  - select model
  - provider fallback
  - cost-aware routing
allowed-tools:
  - Read
  - Bash
---

# Provider Gateway — Intelligent Model Routing & Fallback

Route tasks to optimal AI providers based on task type, complexity, and cost constraints. Implement fallback chains with exponential backoff for reliability. Track performance metrics for continuous optimization.

**Core philosophy**: Right tool for the right job. Never waste premium models on trivial tasks. Always have a backup plan. Measure everything.

---

## Preamble

### What I Am / What I'm Not

**I am**: The intelligent model routing engine that selects optimal AI providers based on task type (coding/design/review), complexity, and cost constraints. I implement fallback chains with exponential backoff to ensure reliability even when primary providers fail.

**I'm not**: A task splitter (that's DAG Router), a code executor (that's Executor), or a test runner. My sole purpose is provider selection + fallback management based on task characteristics and historical performance metrics.

### Pre-Requisite Gate Checklist

Before starting provider routing, verify ALL of the following:

- [ ] WAVE-PLAN.md exists with task type annotations (`type: coding|design|review|research`)
- [ ] At least one provider is available (API keys configured or local model detected)
- [ ] Provider performance logs accessible (`.ultimate-workflow/provider-metrics.json` or create empty)
- [ ] Task complexity estimates available (from DAG Router)

**Gate Result**: `[PASS / FAIL]` — If any item FAILS, fix identified issue before starting. This gate MUST pass for every wave execution cycle.

### Key Principles

1. **Task-Type Matching**: Different tasks require different model strengths (coding → logic, design → vision, review → analysis)
2. **Cost-Aware Downgrade**: Automatically use cheaper models for simple tasks when reliability proven (≥95% success rate)
3. **Fallback Chain with Backoff**: Every primary provider has 2 fallbacks with exponential backoff (5s → 10s → 20s)
4. **Performance Logging**: Log every provider call (success/failure, latency, tokens) for data-driven optimization

### When to Activate

**Automatic triggers** (Phase 2/4/6):
- Wave plan generated with task type labels
- User requests implementation requiring code generation
- Review phase needs dual-model validation

**Manual trigger**:
```
/provider route --task <task-id> --type <coding|design|review|research>
```

**When NOT to use**:
- Single-model projects (only one provider available)
- Trivial tasks (<10 LOC, no reasoning required)
- Offline mode (no API access)

---

## Step-by-step Workflow

### Step 0: Load Wave Plan & Task Types

**Read WAVE-PLAN.md**:

```bash
# Load wave plan with task type annotations
cat .ultimate-workflow/wave-plan.yaml

# Example structure:
# waves:
#   - wave_number: 1
#     tasks:
#       - id: auth-model
#         type: coding
#         complexity: standard
#         estimated_tokens: 5000
#       - id: ui-design
#         type: design
#         complexity: high
#         estimated_tokens: 8000
```

**Extract task metadata**:

```bash
# Parse task types
for task in $(yq '.waves[].tasks[].id' wave-plan.yaml); do
  TASK_TYPE=$(yq ".waves[].tasks[] | select(.id == \"$task\") | .type" wave-plan.yaml)
  COMPLEXITY=$(yq ".waves[].tasks[] | select(.id == \"$task\") | .complexity" wave-plan.yaml)
  
  echo "Task $task: type=$TASK_TYPE, complexity=$COMPLEXITY"
done
```

**Output format**:
```markdown
## Wave Plan Loaded

**Total Tasks**: {count}  
**Task Types**:
- Coding: {count} tasks
- Design: {count} tasks
- Review: {count} tasks
- Research: {count} tasks

**Estimated Total Tokens**: {total_tokens}  
**Budget Tier**: {Tier 1 Premium | Tier 2 Standard | Tier 3 Economy}

Ready to assign providers.
```

---

### Step 1: Provider Selection Matrix

**Apply selection rules based on task type**:

| Task Type | Primary Provider | Fallback 1 | Fallback 2 | Reasoning |
|-----------|-----------------|------------|------------|-----------|
| **Coding** (Phase 4) | Claude Opus / Sonnet | Codex | Gemini Ultra | Code generation needs strong logical reasoning |
| **Design** (Phase 2/2a) | GPT-4o (vision) | Claude Sonnet | — | UI design requires visual understanding |
| **Review** (Phase 6) | Claude Opus + Codex (dual) | Claude Sonnet | Gemini Opus | Dual-model cross-validation catches more bugs |
| **Research** (Phase 1) | GPT-4o | Claude Sonnet | — | Information retrieval needs broad knowledge coverage |
| **Spec Writing** (Phase 2) | Claude Opus | Claude Sonnet | — | Spec writing needs long-context consistency |
| **Quick Fix** (quick bundle) | Claude Haiku | GPT-4o-mini | — | Simple tasks use fast low-cost models |
| **Testing** (Phase 5) | Codex | Claude Sonnet | — | Test generation favors code execution capability |

**Selection algorithm**:

```python
def select_provider(task_type, complexity, budget_tier):
    """
    Select optimal provider based on task characteristics.
    """
    # Check if cost-aware downgrade applies
    if should_downgrade(task_type, complexity):
        return get_economy_provider(task_type)
    
    # Standard selection from matrix
    provider_matrix = {
        "coding": {"primary": "claude-opus", "fallbacks": ["codex", "gemini-ultra"]},
        "design": {"primary": "gpt-4o", "fallbacks": ["claude-sonnet"]},
        "review": {"primary": "claude-opus+codex", "fallbacks": ["claude-sonnet", "gemini-opus"]},
        "research": {"primary": "gpt-4o", "fallbacks": ["claude-sonnet"]},
        "spec_writing": {"primary": "claude-opus", "fallbacks": ["claude-sonnet"]},
        "quick_fix": {"primary": "claude-haiku", "fallbacks": ["gpt-4o-mini"]},
        "testing": {"primary": "codex", "fallbacks": ["claude-sonnet"]},
    }
    
    return provider_matrix.get(task_type, provider_matrix["coding"])
```

**Cost-aware downgrade logic**:

```python
def should_downgrade(task_type, complexity):
    """
    Decide whether to use cheaper model for same task.
    
    Criteria:
    - Task is quick fix (<500 words equivalent)
    - Provider's last 10 attempts all succeeded (high reliability)
    - Task type allows lower-tier models
    """
    if complexity == "quick" and get_provider_reliability() >= 0.95:
        return True
    
    if task_type in ["simple_fix", "documentation_update", "config_change"]:
        return True
    
    return False
```

**Provider tier classification**:

| Tier | Models | Relative Cost | Use When |
|------|--------|--------------|----------|
| **Tier 1 (Premium)** | Claude Opus, GPT-4o | 10x base | Design, Review, Spec Writing |
| **Tier 2 (Standard)** | Claude Sonnet, Codex | 3x base | Coding, Testing, Research |
| **Tier 3 (Economy)** | Claude Haiku, GPT-4o-mini | 1x base | Quick fix, Documentation, Config |

**Output format** (per task):
```markdown
## Provider Assignment: {task-id}

**Task Type**: {coding|design|review|...}  
**Complexity**: {quick|standard|high}  

**Selected Provider**:
- Primary: {provider_name} ({tier})
- Fallback 1: {fallback_1}
- Fallback 2: {fallback_2}

**Reasoning**: {why this provider chosen}  
**Estimated Cost**: ${cost} ({tokens} tokens × ${price_per_token})
```

---

### Step 2: Execute with Fallback Chain

**⚠️ MANDATORY**: Implement exponential backoff for each fallback attempt.

#### Fallback Execution Protocol

```python
import time
import asyncio

async def execute_with_fallback(task, provider_chain):
    """
    Execute task with provider fallback chain.
    Each fallback waits with exponential backoff before retry.
    """
    for attempt_idx, provider in enumerate(provider_chain):
        try:
            print(f"[provider-gateway] Attempt {attempt_idx + 1}: Calling {provider.name}")
            
            result = await provider.call(task)
            
            # Validate response quality
            if validate_response(result, task):
                log_provider_performance(
                    provider=provider,
                    success=True,
                    latency=result.latency,
                    tokens=result.tokens
                )
                print(f"[provider-gateway] ✅ Success with {provider.name} ({result.latency}ms)")
                return result
            
            # Response validation failed — trigger fallback
            print(f"[provider-gateway] ⚠️ Validation failed for {provider.name}")
            log_provider_performance(
                provider=provider,
                success=False,
                reason="validation_failed"
            )
            
        except ProviderTimeoutError as e:
            log_provider_performance(provider, success=False, reason="timeout")
            
            if attempt_idx < len(provider_chain) - 1:
                wait_time = 2 ** attempt_idx * 5  # 5s, 10s, 20s...
                print(f"[provider-gateway] ⏱️ {provider.name} timeout, retry in {wait_time}s")
                await asyncio.sleep(wait_time)
            continue
            
        except ProviderQuotaError as e:
            log_provider_performance(provider, success=False, reason="quota_exceeded")
            
            if attempt_idx < len(provider_chain) - 1:
                print(f"[provider-gateway] 🚫 {provider.name} quota exceeded, switching to next")
                continue
            raise
            
        except ProviderRateLimitError as e:
            log_provider_performance(provider, success=False, reason="rate_limited")
            
            if attempt_idx < len(provider_chain) - 1:
                retry_after = e.retry_after or (2 ** attempt_idx * 10)
                print(f"[provider-gateway] ⏳ {provider.name} rate limited, waiting {retry_after}s")
                await asyncio.sleep(retry_after)
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
        not is_hallucination(result.content, task.requirements),  # Anti-hallucination (R6)
    ]
    return all(checks)


def is_hallucination(content, requirements):
    """
    Check if response contains hallucinated information.
    Uses R6 anti-hallucination rules.
    """
    # Check for placeholder code
    if "TODO" in content or "FIXME" in content or "placeholder" in content.lower():
        return True
    
    # Check for unapproved dependencies
    if has_unapproved_imports(content, requirements):
        return True
    
    # Check for files outside scope
    if modifies_unauthorized_files(content, requirements):
        return True
    
    return False
```

**Exponential backoff schedule**:

| Attempt | Wait Time | Scenario |
|---------|-----------|----------|
| 1st fallback | 5 seconds | Timeout on primary |
| 2nd fallback | 10 seconds | Timeout on 1st fallback |
| 3rd fallback | 20 seconds | Timeout on 2nd fallback |

**Rate limit handling**:
- Respect `Retry-After` header if provided
- Otherwise use exponential backoff (10s → 20s → 40s)
- Log rate limit events for quota planning

**Output format** (execution log):
```markdown
## Provider Execution Log: {task-id}

**Attempt 1**: claude-opus
- Status: ❌ TIMEOUT (30s exceeded)
- Wait: 5s (exponential backoff)

**Attempt 2**: codex
- Status: ✅ SUCCESS
- Latency: 2.3s
- Tokens: 4,521 (input: 3,200 + output: 1,321)
- Cost: $0.045

**Final Result**: Success on attempt 2
```

---

### Step 3: Performance Logging

**⚠️ MANDATORY**: Log every provider call for optimization.

#### Log Entry Format

```json
{
  "timestamp": "2024-03-15T14:30:00Z",
  "provider": "claude-opus",
  "model": "claude-3-opus-20240229",
  "task_id": "auth-model",
  "wave_number": 1,
  "success": true,
  "reason": "success",
  "latency_ms": 2300,
  "tokens_used": 4521,
  "tokens_input": 3200,
  "tokens_output": 1321,
  "cost_usd": 0.045,
  "fallback_chain_position": 1,
  "task_type": "coding",
  "complexity": "standard"
}
```

**Logging implementation**:

```python
import json
from datetime import datetime

def log_provider_performance(provider, success, reason=None, latency=None, tokens=None):
    """
    Log provider performance metrics for cost/performance optimization.
    Appends to JSONL file for easy analysis.
    """
    log_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "provider": provider.name,
        "model": provider.model_version,
        "task_id": current_task.id,
        "wave_number": current_wave.number,
        "success": success,
        "reason": reason or ("success" if success else "unknown"),
        "latency_ms": latency,
        "tokens_used": tokens.total if tokens else 0,
        "tokens_input": tokens.input if tokens else 0,
        "tokens_output": tokens.output if tokens else 0,
        "cost_usd": calculate_cost(provider, tokens),
        "fallback_chain_position": current_attempt_index + 1,
        "task_type": current_task.type,
        "complexity": current_task.complexity,
    }
    
    # Append to JSONL file (one JSON object per line)
    with open("logs/provider-performance.jsonl", "a") as f:
        f.write(json.dumps(log_entry) + "\n")
```

**Cost calculation**:

```python
def calculate_cost(provider, tokens):
    """
    Calculate USD cost based on provider pricing.
    """
    pricing = {
        "claude-opus": {"input": 0.015, "output": 0.075},  # per 1K tokens
        "claude-sonnet": {"input": 0.003, "output": 0.015},
        "claude-haiku": {"input": 0.00025, "output": 0.00125},
        "gpt-4o": {"input": 0.005, "output": 0.015},
        "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
        "codex": {"input": 0.003, "output": 0.012},
        "gemini-ultra": {"input": 0.0025, "output": 0.0075},
    }
    
    rates = pricing.get(provider.name, pricing["claude-sonnet"])
    cost = (tokens.input / 1000 * rates["input"]) + (tokens.output / 1000 * rates["output"])
    return round(cost, 4)
```

**Output format** (performance summary):
```markdown
## Provider Performance Summary (Wave {N})

**Total Calls**: {count}  
**Success Rate**: {percentage}%  
**Average Latency**: {avg_ms}ms  
**Total Cost**: ${total_cost}  

**By Provider**:
- claude-opus: {count} calls, {success_rate}% success, avg {latency}ms
- codex: {count} calls, {success_rate}% success, avg {latency}ms
- gpt-4o: {count} calls, {success_rate}% success, avg {latency}ms

**Fallback Usage**:
- Primary succeeded: {count} ({percentage}%)
- Fallback 1 used: {count} ({percentage}%)
- Fallback 2 used: {count} ({percentage}%)
- All exhausted: {count} ({percentage}%)
```

---

### Step 4: Cost Optimization Analysis

**Analyze performance logs to optimize future routing**.

#### Weekly Optimization Report

```bash
# Generate weekly report
python3 scripts/analyze-provider-performance.py \
  --input logs/provider-performance.jsonl \
  --period week \
  --output reports/provider-optimization-weekly.md
```

**Analysis dimensions**:

1. **Success Rate by Provider**:
   - Identify unreliable providers (success rate <90%)
   - Consider removing from fallback chains

2. **Latency Distribution**:
   - P50, P90, P99 latency per provider
   - Flag slow providers (>10s P90)

3. **Cost Efficiency**:
   - Cost per successful task by provider
   - Identify overpriced providers

4. **Fallback Frequency**:
   - Which providers frequently need fallback?
   - Adjust primary selection accordingly

**Optimization recommendations**:

```markdown
## Provider Optimization Recommendations

**Based on last 7 days of data**:

### 1. Downgrade Candidates
- **claude-opus** for "quick_fix" tasks: 98% success rate, consider downgrading to claude-haiku
  - Potential savings: $12.50/week
  - Risk: Low (proven reliability)

### 2. Remove from Rotation
- **gemini-ultra**: Only 72% success rate, high latency (avg 15s)
  - Recommendation: Remove from fallback chains
  - Replace with: claude-sonnet (95% success, 3s avg)

### 3. Promote to Primary
- **codex** for "testing" tasks: 96% success, faster than current primary
  - Current primary: claude-sonnet (94% success, 5s avg)
  - Recommendation: Switch codex to primary for testing tasks

### 4. Quota Planning
- **claude-opus**: Approaching monthly quota (85% used)
  - Recommendation: Pre-emptively shift non-critical tasks to sonnet
  - Estimated remaining capacity: 3 days at current usage
```

**Automated optimization loop**:

```yaml
optimization_schedule:
  daily:
    - Update success rate metrics
    - Alert on quota thresholds (>80%)
  
  weekly:
    - Generate optimization report
    - Adjust provider matrix if needed
    - Review cost trends
  
  monthly:
    - Renegotiate provider contracts (if enterprise)
    - Evaluate new providers (market scan)
    - Archive old performance logs (>90 days)
```

---

## Error Handling

### Common Issues and Fixes

**Issue 1: All Providers Exhausted**

- **Symptom**: All 3 providers in fallback chain fail
- **Cause**: Network outage, API downtime, or invalid task
- **Fix**:
  1. Check network connectivity: `curl -I https://api.anthropic.com`
  2. Verify API keys valid: `echo $ANTHROPIC_API_KEY | wc -c`
  3. Validate task input (may be malformed)
  4. If all valid → escalate to user, mark task as BLOCKED
- **Prevention**: Monitor provider status pages, implement circuit breaker

**Issue 2: Response Validation Fails Repeatedly**

- **Symptom**: Provider returns content but validation fails (hallucination detected)
- **Cause**: Task requirements unclear or provider misunderstanding
- **Fix**:
  1. Clarify task requirements (add examples, constraints)
  2. Try different provider (may interpret differently)
  3. Split task into smaller sub-tasks
  4. If still failing → manual intervention required
- **Prevention**: Write clear task specs with explicit acceptance criteria

**Issue 3: Rate Limit Throttling**

- **Symptom**: Multiple tasks hitting rate limits simultaneously
- **Cause**: Too many concurrent requests to same provider
- **Fix**:
  1. Implement request queuing (max N concurrent per provider)
  2. Distribute load across providers (round-robin for same task type)
  3. Increase rate limit (contact provider support)
  4. Cache frequent responses (reduce duplicate calls)
- **Prevention**: Monitor rate limit headers, implement adaptive throttling

**Issue 4: Cost Overrun**

- **Symptom**: Weekly cost exceeds budget by >20%
- **Cause**: Premium models used for trivial tasks, or unexpected volume spike
- **Fix**:
  1. Enforce stricter downgrade rules (lower threshold from 95% to 90%)
  2. Set hard budget caps (stop using Tier 1 when budget hit)
  3. Review task type classifications (may be mislabeled)
  4. Negotiate volume discounts with providers
- **Prevention**: Daily cost alerts at 50%/80%/100% budget thresholds

**Issue 5: Token Budget Overflow**

- **Symptom**: Provider response exceeds token budget for task
- **Cause**: Task too complex for assigned model, or verbose output
- **Fix**:
  1. Upgrade to higher-tier model (larger context window)
  2. Split task into smaller chunks
  3. Add output length constraint: `max_tokens: 2000`
  4. Enable response compression (distillator)
- **Prevention**: Estimate token requirements upfront, add 20% buffer

---

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Routing Impact |
|-------|------|------------|--------|----------------|
| **P0** | BLOCKING | All providers exhausted for critical task (security/auth related with ≥2 fallback failures) | Escalate to user with provider outage report; use cached/local LLM as emergency | Task blocked until primary provider recovers or user provides alternative |
| **P1** | RECOVERABLE | Primary provider returns error (timeout, rate limit, auth failure) but fallbacks available | Auto-rotate to next fallback in chain with exponential backoff (5s→10s→20s); log failure reason | Routing continues with degraded provider; update success-rate metrics |
| **P2** | WARNING | Hallucination rate >30% for assigned provider on current task type | Flag output as `[SUSPECT: high hallucination]`, recommend manual verification before commit | Task completes but marked for review by Acceptance Auditor in Phase 6 |
| **P3** | INFO | Provider cost exceeds per-task budget estimate by <20% (within buffer zone) | Log cost variance, no action needed — normal fluctuation | No impact on routing or task execution |

**Severity Assignment Rules**:
- Default to P1 for any provider error with available fallback (auto-recoverable)
- Escalate from P1→P0 only when ≥2 fallbacks also fail OR critical path task blocked
- Never demote: once P0 assigned, requires manual user intervention to resume

### Provider Selection Matrix

| Task Type | Preferred Model Tier | Fallback Tier | Cost Threshold | Success Rate Requirement |
|-----------|---------------------|---------------|----------------|--------------------------|
| Coding (standard) | Standard ($0.01-0.03/token) | Budget (<$0.01/token) | <$0.50/task | ≥95% over last 50 attempts |
| Coding (complex/architectural) | Premium ($0.03-0.10/token) | Standard | $2.00/task | ≥90% over last 50 attempts |
| Design/Vision | Premium or Vision-capable | Standard + multi-modal | $1.00/task | ≥85% (vision harder to predict) |
| Review/Analysis | Standard | Budget | $0.75/task | ≥95% over last 50 attempts |
| Research/Synthesis | Premium (strong reasoning) | Standard | $1.50/task | ≥90% over last 50 attempts |

**Cost-Aware Downgrade Rule**: If provider's success rate for task type ≥95% over last 50 attempts → automatically downgrade one tier next time (e.g., Premium→Standard), log cost savings to metrics.

### Fallback Chain Configuration

| Primary Provider | Fallback 1 | Fallback 2 | Max Retry Attempts |
|-----------------|------------|------------|-------------------|
| Claude 3 Opus | GPT-4 Turbo | Gemini Pro | 2 (1st fallback + 2nd fallback) |
| GPT-4 Turbo | Claude 3 Haiku | Ollama local | 2 |
| Gemini Pro | Claude 3 Haiku | LM Studio local | 2 |
| Any cloud provider | Local LLM (Ollama/LM Studio) | Cached response (if available) | 1 (local only, no further fallback) |

**Fallback Failure Handling**: If all 2 fallbacks also fail → escalate to P0, output `[CRITICAL: All providers exhausted for {task-id}]` with timing and error details.

### Performance Metrics Logging Format

| Metric | Field Name | Purpose |
|--------|------------|---------|
| Provider name | `provider_id` | Track which provider was used |
| Task type | `task_type` | Correlate success rate by task category |
| Timestamp | `timestamp` (ISO 8601) | Calculate hourly/daily failure rates |
| Success/Failure | `status` (success/fallback/retry/max_exhausted) | Measure fallback chain effectiveness |
| Latency in ms | `latency_ms` | Identify slow providers for optimization |
| Tokens used | `tokens_used` | Monitor cost and budget adherence |
| Fallback chain index | `fallback_level` (0=primary, 1=fallback1, 2=fallback2) | Calculate average fallback distance |

**Metrics Update Command**: After each provider call, append to `.ultimate-workflow/provider-metrics.json`:
```json
{"provider_id": "claude-3-opus", "task_type": "coding", "timestamp": "2026-05-18T10:30:00Z", "status": "success", "latency_ms": 4500, "tokens_used": 12000, "fallback_level": 0}
```

---

## Boundary Conditions

### When to Escalate Immediately

**Skip provider routing, escalate to user if**:
- All providers exhausted for critical task (security/auth related)
- Cost overrun >50% in single day (possible abuse or bug)
- Provider API returning errors for >1 hour (service outage)
- Hallucination rate >30% across all providers (systemic issue)

### When to Skip Fallback Chain

**Use single provider (no fallback) if**:
- Task is trivial (<100 tokens, typo fix)
- Latency critical (<100ms requirement)
- Provider has 100% success rate for this task type (last 50 attempts)
- User explicitly requests specific provider

### Edge Cases

**Multi-Region Deployment**:

- Route to nearest provider region (latency optimization)
- Maintain separate fallback chains per region
- Handle region-specific rate limits independently

**Provider API Changes**:

- Monitor for breaking API changes (version deprecation)
- Test new API versions in staging before production rollout
- Maintain compatibility layer for gradual migration

**Offline Mode**:

- Cache recent provider responses for common tasks
- Use local LLM (Ollama, LM Studio) as emergency fallback
- Queue tasks for later execution when online

**Enterprise Contracts**:

- Honor committed spend minimums (don't under-utilize)
- Track usage against contract terms (overage fees)
- Negotiate custom rate limits based on volume

---

## Output Template

### Provider Assignment Table

```markdown
## Provider Assignment — Wave {N}

| Task ID | Type | Complexity | Primary | Fallback 1 | Fallback 2 | Est. Cost |
|---------|------|------------|---------|------------|------------|-----------|
| {task_1} | coding | standard | claude-opus | codex | gemini-ultra | $0.045 |
| {task_2} | design | high | gpt-4o | claude-sonnet | — | $0.082 |
| {task_3} | review | standard | claude-opus+codex | claude-sonnet | gemini-opus | $0.091 |

**Total Estimated Cost**: ${total_cost}  
**Budget Remaining**: ${remaining} / ${total_budget} ({percentage}%)
```

### Execution Log

```markdown
## Provider Execution Log: {task-id}

**Task Type**: {type}  
**Assigned Providers**: {primary} → {fallback_1} → {fallback_2}  

**Attempt 1**: {provider_1}
- Status: {✅ SUCCESS | ❌ TIMEOUT | ❌ QUOTA | ❌ RATE_LIMIT}
- Latency: {ms}
- Tokens: {total} (input: {in} + output: {out})
- Cost: ${cost}

**Attempt 2**: {provider_2} (if applicable)
...

**Final Result**: {Success on attempt N | All providers exhausted}
```

### Performance Summary

```markdown
## Provider Performance Summary (Wave {N})

**Total Calls**: {count}  
**Success Rate**: {percentage}%  
**Average Latency**: {avg_ms}ms  
**Total Cost**: ${total_cost}  

**By Provider**:
- {provider_1}: {count} calls, {success_rate}% success, avg {latency}ms
- {provider_2}: {count} calls, {success_rate}% success, avg {latency}ms

**Fallback Usage**:
- Primary succeeded: {count} ({percentage}%)
- Fallback 1 used: {count} ({percentage}%)
- Fallback 2 used: {count} ({percentage}%)
- All exhausted: {count} ({percentage}%)

**Cost Breakdown**:
- Tier 1 (Premium): ${cost} ({percentage}%)
- Tier 2 (Standard): ${cost} ({percentage}%)
- Tier 3 (Economy): ${cost} ({percentage}%)
```

---

## Tool Integration

### Required Tools

**API Clients**:
```bash
# Claude API
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model": "claude-3-opus-20240229", ...}'

# OpenAI API
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{"model": "gpt-4o", ...}'

# Google Gemini API
curl -X POST https://generativelanguage.googleapis.com/v1/models/gemini-ultra:generateContent \
  -H "Authorization: Bearer $GEMINI_API_KEY" \
  -d '{"contents": [...]}'
```

**Performance Logging**:
```bash
# Append to JSONL
echo '{"timestamp": "...", "provider": "..."}' >> logs/provider-performance.jsonl

# Query logs
jq 'select(.success == false)' logs/provider-performance.jsonl

# Aggregate metrics
python3 scripts/analyze-provider-performance.py --input logs/provider-performance.jsonl
```

### Optional Tools

**Circuit Breaker**:
```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60)
def call_provider(provider, task):
    return provider.execute(task)
```

**Response Caching**:
```bash
# Redis cache for frequent queries
redis-cli SET "cache:{task_hash}" "{response_json}" EX 3600
```

**Load Balancer**:
```python
# Round-robin distribution for same task type
provider_pool = {
    "coding": ["claude-opus", "codex", "gemini-ultra"],
}
current_index = hash(task_id) % len(provider_pool["coding"])
selected_provider = provider_pool["coding"][current_index]
```

---

## Implementation Checklist

Before routing:
- [ ] Wave plan loaded with task type labels
- [ ] Provider API keys configured and validated
- [ ] Budget thresholds set (daily/weekly limits)
- [ ] Fallback chains defined for each task type

During execution:
- [ ] Primary provider called first
- [ ] Exponential backoff applied on timeouts (5s → 10s → 20s)
- [ ] Response validated (non-empty, no hallucination, correct files)
- [ ] Performance logged (success/failure, latency, tokens, cost)
- [ ] Fallback triggered if validation fails

After execution:
- [ ] All tasks assigned to providers
- [ ] Performance summary generated
- [ ] Cost within budget (alert if >80%)
- [ ] Optimization recommendations documented (if weekly report)

Quality gates:
- [ ] No task left without provider assignment
- [ ] Fallback chains complete (min 2 providers per task)
- [ ] All API calls logged (no silent failures)
- [ ] Cost tracking accurate (within 5% of actual)
- [ ] Hallucination checks enforced (R6 compliance)

---

## Anti-Patterns to Avoid

❌ **Using Premium Models for Trivial Tasks**: Wasting Claude Opus on typo fixes  
✅ **Fix**: Enforce cost-aware downgrade rules (complexity=quick → Tier 3)

❌ **No Fallback Chain**: Single point of failure if primary provider down  
✅ **Fix**: Always define ≥2 fallbacks with exponential backoff

❌ **Ignoring Performance Data**: Not logging metrics, flying blind  
✅ **Fix**: Mandatory logging for every provider call

❌ **Hardcoding Provider Names**: Manual updates when providers change  
✅ **Fix**: Use configuration file, hot-reload on changes

❌ **No Budget Controls**: Surprise bills at end of month  
✅ **Fix**: Daily cost alerts, hard caps at budget thresholds

❌ **Skipping Validation**: Accepting any response without checks  
✅ **Fix**: Enforce R6 anti-hallucination rules, validate output structure

---

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added 4-step workflow (selection → execution → logging → optimization)
  - Implemented exponential backoff fallback chains
  - Defined strict performance logging format (JSONL)
  - Added comprehensive error handling (5 common issues)
  - Integrated cost-aware downgrade logic

- **v1.0** (2024-01-10): Initial implementation based on flow-kit provider concept
  - Basic provider selection matrix
  - Simple fallback (no backoff)
  - Manual cost tracking
  - No performance analytics
