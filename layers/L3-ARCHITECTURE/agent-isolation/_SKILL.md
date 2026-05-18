# L3-Agent Isolation — Agent 上下文隔离 (~200K/Agent)

> **Layer**: L3-ARCHITECTURE (全局协调层)  
> **前置**: Wave Plan 已生成, Provider Assignment 已完成  
> **后置产物**: Per-agent isolated context packages + communication channels  
> **门控**: R7 — Context Isolation Rule

## Skill元信息

```yaml
name: agent-isolation
version: 3.0
layer: L3-ARCHITECTURE
source: Agent isolation from v3 architecture, R7 rule enforcement
dependencies:
  - WAVE-PLAN.md (input: per-agent task assignments)
  - provider-gateway (input: provider chains)
token_budget: "inherited from parent execution (~200K per child agent)"
v3_upgrade:
  token_budget_per_agent: ~200K tokens enforced
  context_rotation_at_wave_boundary: true
  six_module_loading_order: true
  cross_agent_communication_channels: true
```

> **Note**: This is a documentation-only index file describing the agent-isolation policy. Actual enforcement happens in `executor/_SKILL.md` and `wave-executor/_SKILL.md` (~200K/Agent context window budget). This file's budget is inherited from parent workflow execution.

## 输入

- WAVE-PLAN.md (每波的任务分配 + 并行度)
- Provider Assignment Table
- Global workspace state (STATE.md, LESSONS.md)

## 输出

- Per-agent context package (~200K tokens max)
- Agent isolation guarantees (no cross-agent data leak)
- Communication channel definitions between agents

---

## Token Budget Breakdown per Agent

| Agent Type | Context Budget | Loading Strategy | Module Allocation |
|-----------|---------------|-----------------|-------------------|
| **Orchestrator** | ~50K tokens | All phases | Router state + Wave progress + Error reports |
| **Research Agent** | ~200K tokens | Phase 1-2 | Full L1+L2 context, fresh at each query |
| **Execution Agent** | ~200K tokens | Phase 4 per wave | WAVE-PLAN.md + Provider chain + Task-specific context |
| **Review Agent (Blind Hunter)** | ~200K tokens | Phase 6 Stage B | Code diff only, NO PRD context |
| **Review Agent (Edge Case Hunter)** | ~200K tokens | Phase 6 Stage B | Code diff + domain error patterns |
| **Specialist Agents** | Varies per role | Phase-specific | Role-specific context subset only |

### Budget Allocation Detail (Execution Agent)

```
Per-Wave Execution Agent Context (~200K tokens):

1. Module Loading Order (6 modules):
   a. CORE_CONTEXT (~10K tokens)
      - RULES-v3.md (all R1-R21 rules)
      - Current wave summary from predecessor waves
   
   b. WAVE_PLAN (~5K tokens)
      - Current wave task list
      - Dependencies + parallelism level
      - Worktree assignments
   
   c. TASK_CONTEXT (~50K tokens)
      - Full PRD/requirements for current wave
      - Design specs (02-design.md or delta-specs.md)
      - API contracts if applicable
   
   d. PREVIOUS_WAVE_SUMMARY (~10K tokens)
      - SUMMARY-WAVE-{N-1}.md
      - LESSONS learned from predecessor waves
   
   e. DOMAIN_SKILLS (~50K tokens max)
      - Active domain skills (≤5, per R15)
      - Promoted from LESSONS ≥3 citations
   
   f. FRESH_CODE_CONTEXT (~75K tokens)
      - Current codebase state at wave start
      - Files to be modified + their context
      - Git diff of previous waves' changes

Total: ~200K tokens (budget enforced per agent instance)
```

---

## Context Rotation Protocol

### Wave Boundary Rotation

```
Wave N completed → Wave N+1 preparation:

1. Execution Agent for Wave N+1 receives FRESH context (not reused from Wave N)
2. Only SUMMARY-WAVE-{N}.md is injected (compressed, ≤10K tokens)
3. LESSONS.md filtered by predicates matching current wave's domain
4. Domain skills promoted after Wave N are available to Wave N+1 agent

Before rotation:
  - Agent writes completion signal + error report
  - Agent commits any worktree changes
  - Agent triggers heartbeat checkpoint

After rotation:
  - New agent instance with fresh ~200K budget
  - Predecessor summary injected (≤10K tokens)
  - Domain skill updates applied (from R15 promotion)
```

### Agent Context Isolation Guarantees

| Guarantee | Enforcement | Token Impact |
|-----------|-------------|-------------|
| No cross-agent data leak | Each agent gets fresh context snapshot | ~200K/agent max |
| Wave boundary fresh context | Predecessor summary only (≤10K tokens) | +10K overhead/wave |
| Domain skill promotion controlled | ≤5 active skills per agent | ~50K max/skill pool |
| Memory append isolated | Each agent appends to daily log independently | Negligible |

---

## Cross-Agent Communication Channels

### Defined Channel Types

```typescript
type AgentMessage =
  | HeartbeatCheck      // [checkpoint][wave:N][task:X] — keep alive
  | TaskCompletionSignal  // {taskId, success, artifacts[], errors[]}
  | ErrorReport          // {taskId, error: string, traceback?, retry?}
  | HandoffRequest       // {fromTaskId, toTaskId, sharedState?}
  | ContextSnapshot      // {wave:N, summary: compressed text ≤5K tokens}

// Communication routing rules:
// - Heartbeat: Agent → Orchestrator (every 60s during execution)
// - Completion: Agent → Orchestrator (end of task)
// - ErrorReport: Agent → Orchestrator + affected dependent agents
// - Handoff: Agent → Orchestrator → Agent (mediated by orchestrator)
// - ContextSnapshot: Agent → MEMORY (appended to STATE.md per req-id)
```

### Channel Priority & Timeout

| Channel | Priority | Timeout | Retry Policy |
|---------|----------|---------|-------------|
| HeartbeatCheck | LOW | 60s | Auto-retry ×3, then warn |
| TaskCompletionSignal | HIGH | N/A (critical) | Mandatory before wave end |
| ErrorReport | HIGH | Immediate | Auto-retry if retry: true in report |
| HandoffRequest | MEDIUM | 120s | Orchestrator resolves conflicts |
| ContextSnapshot | LOW | Batched | Flush every 300s or on completion |

---

## Module Loading Order (6 Modules)

```
Phase 4 Execution Agent — Load Order:

1. RULES-CORE      → R1-R21 (compressed, ~5K tokens via compressor)
2. WAVE-PLAN       → Current wave tasks + dependencies (~5K tokens)
3. PRD-CONTEXT     → Requirements/Spec for current wave (~40K tokens)
4. LESSONS-PREVIOUS→ Compressed summary of predecessor waves (~10K tokens)
5. DOMAIN-SKILLS   → Active skills (≤5, ~50K tokens max)
6. CODE-BASE       → Files to modify + surrounding context (~75K tokens)
                           │
                  ┌──────┼─────────┐
                  ▼      ▼         ▼
              Phase 4  Verify   Commit
              Build    Lint/Type Atomic
```

### Token Budget Guard

```python
def enforce_budget(agent_context):
    """
    Ensure agent's context does not exceed ~200K tokens.
    If overflow occurs, compress or truncate modules in reverse order.
    """
    total_tokens = calculate_total(agent_context)
    
    if total_tokens <= 200_000:
        return agent_context  # OK
    
    # Overflow — compress in priority order (lowest priority first)
    overflow = total_tokens - 200_000
    
    # Step 1: Compress LESSONS-PREVIOUS (already compressed, try harder)
    if agent_context.lessons_compressed_ratio < 95%:
        agent_context.lessons = aggressive_compress(agent_context.lessons)
        overflow -= saved_tokens
    
    # Step 2: Truncate CODE-BASE (keep only required files)
    if overflow > 0:
        agent_context.code_base = keep_only_required_files(agent_context.code_base, overflow)
    
    # Step 3: Reduce DOMAIN-SKILLS count
    if overflow > 0:
        agent_context.domain_skills = agent_context.domain_skills[:3]  # Limit to 3
    
    return agent_context
```

---

---

## Error Taxonomy (Agent Isolation 专属)

| Level | Name | Symptom | Recovery Action | Wave Impact |
|-------|------|---------|-----------------|-------------|
| P0 | CONTEXT_LEAK | Cross-agent data visible in new wave's fresh context | Flush agent memory, enforce boundary rotation, re-validate isolation | Blocks Wave N+1 until isolated context verified |
| P1 | TOKEN_OVERFLOW | Agent context exceeds ~200K token budget after module load | Compress LESSONS→CODE-BASE→DOMAIN-SKILLS in priority order | Continue with truncated modules |
| P2 | COMM_TIMEOUT | Heartbeat/Channel message exceeds timeout without response | Retry ×3 per channel policy → escalate to Orchestrator | No execution impact, logging only |
| P3 | DOMAIN_SKILL_LIMIT | Active domain skills >5 (R15 violation) | Truncate to lowest-frequency 5, archive rest to LESSONS | No blocking |

## Boundary Conditions (Agent Isolation)

### Thresholds
- **Token Budget**: ~200K tokens per agent (hard limit), orchestrator ~50K
- **Context Rotation**: New wave = fresh context only (≤10K token summary injection)
- **Domain Skills**: ≤5 active skills per agent (~50K max/skill pool)
- **Channel Timeout**: Heartbeat 60s / Handoff 120s / ContextSnapshot batched 300s

### Circuit Breaker
- 3 consecutive token overflows → reduce DOMAIN-SKILLS to ≤3, trim CODE-BASE to required files only
- Agent failure rate >30% in single wave → recommend new agent instance (context corruption)

### Input Schema Validation
- [ ] WAVE-PLAN.md exists with valid task assignments
- [ ] Provider Assignment Table generated
- [ ] Per-agent context budget ≤200K tokens calculated
- [ ] Cross-agent communication channels defined per task dependency

## Phase Integration

| Phase | Usage |
|-------|-------|
| **Phase 4 (Build)** | Per-wave execution agents get ~200K fresh context, module loading order enforced |
| **Phase 5 (Test)** | Test agent gets separate ~200K context focused on test files only |
| **Phase 6 (Review)** | Stage B agents (Blind/Edge Case) get code-only context (~200K), NO PRD context |
| **Phase 8 (Archive)** | Context snapshots flushed to memory per req-id |

---

## 向后兼容

| v1.0 产物 | Agent Isolation 处理 |
|-----------|---------------------|
| Subagent execution | Subagent gets fresh ~200K context, parent keeps ~50K |
| No explicit agent definition | Auto-detect: coding → Execution Agent, testing → Test Agent |
| Single-agent sessions | Full 200K budget for single agent |
