---
name: parallel-engine
preamble-tier: 2
version: 3.0-draft
layer: L3-ARCHITECTURE
gate: internal
requires: [wave-plan, provider-chains]
provides: [parallel-execution-plan, dispatch-coordination]
description: |
  Dependency-aware wave scheduling engine for parallel task orchestration.
  Takes wave-plan.yaml from dag-router and dispatches agents to execute tasks
  concurrently within waves, with coordination points and error recovery.
  Use when: "schedule parallel tasks", "execute wave plan", "dispatch agents". (devflow-evo)
source: DAG-based wave scheduling from L2 wave-executor + L3 dag-router, inherited from 引擎层 Wave Engine
dependencies:
  - dag-router (input: wave-plan.yaml with parallelism classifications per wave)
  - provider-gateway (input: per-task provider chains)
  - wave-executor (downstream consumer — receives Parallel Execution Plan)
triggers:
  - schedule parallel tasks
  - execute wave plan
  - dispatch agents for wave
  - parallel orchestration
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Edit
---

# L3-Parallel Engine — Wave N 并行编排引擎

> **Layer**: L3-ARCHITECTURE (全局协调层)  
> **前置**: wave-plan.yaml 已生成 (由 dag-router 输出), Provider Assignment 已完成  
> **后置产物**: Parallel Execution Plan per wave, Error Recovery Report on partial failure  
> **门控**: R11 — Wave Dependency Verification Gate

## Skill元信息

```yaml
name: parallel-engine
version: 3.0
layer: L3-ARCHITECTURE
source: DAG-based wave scheduling from L2 wave-executor + L3 dag-router, error recovery from GSD
dependencies:
  - dag-router (input: wave-plan.yaml with parallelism classifications)
  - provider-gateway (input: per-task provider assignments)
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Edit
v3_upgrade:
  target_acceleration: ~5x vs sequential execution
  partial_failure_handling: true (proceed with next wave, log failures)
  resource_contention_resolution: true (automatic retry + isolation)
```

---

## Preamble

### What I Am / What I'm Not

**I am**: The L3 parallel orchestration engine that takes wave-plan.yaml from dag-router and dispatches agents to execute tasks concurrently within waves, with coordination points, resource contention resolution, and partial failure handling.

**I'm not**: A task splitter (that's dag-router), a task executor (that's wave-executor/Phase 4), or a code linter. I schedule and coordinate parallelism — nothing more, nothing less.

### Pre-Requisite Gate Checklist

Before starting parallel execution, verify ALL of the following:

- [ ] wave-plan.yaml exists and has valid per-wave parallelism classifications (HIGH/MEDIUM/LOW/NONE)
- [ ] Provider Assignment Table is complete (every task has a provider chain)
- [ ] DAG validation passed — no cycles detected by dag-router
- [ ] All task IDs are unique across all waves
- [ ] Resource constraints defined for shared resources (DBs, APIs, file patterns)
- [ ] Max concurrent tasks limit is set (default: 7 per wave, hard cap: 10)
- [ ] Per-task timeout is configured (default: 10min, max: 30min)

**Gate Result**: `[PASS / FAIL]` — If any item FAILS, fix identified issue before dispatching agents. Do not auto-skip checks. This gate MUST pass for every wave.

### Key Principles

1. **Dependency-Aware Parallelism**: Only execute tasks in parallel when DAG confirms no inter-dependencies — correctness over speed
2. **Coordination Points Between Waves**: Never start Wave N+1 without verifying Wave N completion (barrier gate)
3. **Resource Contention First Detection**: Pre-scan for shared resource conflicts before dispatching — prevent merge storms
4. **Partial Failure Isolation**: Non-blocking failures do NOT stop downstream waves — log and fix post-wave

### When to Activate

**Automatic triggers**:
- dag-router outputs wave-plan.yaml with parallelism classifications
- Phase 4 begins execution cycle
- Complex feature requiring coordinated multi-agent changes

**When NOT to use**:
- Single task (no parallelism benefit)
- All tasks have dependencies within same wave (serialized fallback)
- Resource-constrained environment — downgrade to serial execution

---

## 输入

- wave-plan.yaml — per-wave task list with parallelism classification (HIGH/MEDIUM/LOW/NONE)
- Provider Assignment Table — per-task provider chains
- Resource constraints (optional): shared DBs, APIs, file patterns

## 输出

- Parallel Execution Plan — wave-by-wave execution schedule with coordination points
- Execution Logs — per-agent status, heartbeat timeline, error reports
- Wave Summary — per-wave completion status for cross-wave injection

---

## Core Scheduling Algorithm: Dependency-Aware Parallel Optimization

```python
# Input: wave-plan.yaml output from dag-router
# Output: Parallel Execution Plan with coordination points

def schedule_parallel_execution(wave_plan):
    """
    Schedule parallel execution across all waves.
    
    Returns:
        execution_plan: List[WaveExecutionPlan]
            Each wave contains:
                tasks: List[TaskExecutionSpec]
                    - task_id, provider_chain, worktree, shared_resources
                    - start_offset_ms (coordination point for MEDIUM/LOW parallelism)
                coordination_points: List[CoordinationPoint]
                    - barrier_before_next_wave
                    - merge_strategy for overlapping files
    """
    
    plan = []
    cumulative_start_time = 0
    
    for wave_idx, wave in enumerate(wave_plan.waves):
        if wave.parallelism == "HIGH":
            # Full parallel — all tasks start simultaneously
            spec = create_full_parallel_spec(wave)
        
        elif wave.parallelism == "MEDIUM":
            # Coordinated merge — stagger starts to avoid file contention
            spec = create_coordinated_merge_spec(wave)
        
        elif wave.parallelism == "LOW":
            # Serialized execution — sequential within wave
            spec = create_serialized_execution_spec(wave)
        
        else:  # NONE
            spec = create_single_task_spec(wave)
        
        # Add inter-wave coordination barriers
        if wave_idx < len(wave_plan.waves) - 1:
            spec.coordination_points.append({
                "type": "wave_barrier",
                "description": f"Wait for Wave {wave_idx + 1} before starting Wave {wave_idx + 2}",
                "validation": verify_wave_completion(wave),
            })
        
        plan.append(spec)
    
    return plan


def create_full_parallel_spec(wave):
    """
    HIGH parallelism: no shared resources.
    All tasks start at t=0, independent worktrees.
    """
    return {
        "wave_number": wave.number,
        "parallelism": "HIGH",
        "strategy": "full_parallel_independent_worktrees",
        "tasks": [
            {
                "id": task.id,
                "start_offset_ms": 0,
                "worktree": f"wt/{task.id}",
                "provider_chain": provider_chain_for(task),
                "shared_resources": [],
                "merge_strategy": "atomic_no_conflict",
            }
            for task in wave.tasks
        ],
    }


def create_coordinated_merge_spec(wave):
    """
    MEDIUM parallelism: pairwise resource conflicts.
    Stagger starts to minimize contention, use coordinated merge strategy.
    """
    resources = collect_shared_resources(wave.tasks)
    
    # Group tasks by shared resources (conflict clusters)
    conflict_clusters = group_by_resource(resources, wave.tasks)
    
    tasks = []
    for task in wave.tasks:
        start_offset = 0
        merge_strategy = "atomic_no_conflict"
        
        # Check if this task has conflicts with other tasks in same wave
        conflicting_tasks = [t for t in wave.tasks 
                            if any(r in collect_resources(t) for r in collect_resources(task))
                            and t.id != task.id]
        
        if conflicting_tasks:
            start_offset = len(conflicting_tasks) * 5000  # stagger by 5s per conflict
            merge_strategy = "coordinated_merge_with_lock"
        
        tasks.append({
            "id": task.id,
            "start_offset_ms": start_offset,
            "worktree": find_worktree_for(task),
            "provider_chain": provider_chain_for(task),
            "shared_resources": list(collect_resources(task)),
            "merge_strategy": merge_strategy,
        })
    
    return {
        "wave_number": wave.number,
        "parallelism": "MEDIUM",
        "strategy": f"coordinated_merge ({len(conflict_clusters)} clusters)",
        "tasks": tasks,
    }


def create_serialized_execution_spec(wave):
    """
    LOW parallelism: multiple tasks share same resources.
    Execute sequentially within wave to avoid conflicts.
    """
    tasks = []
    cumulative_offset = 0
    
    for task in sorted(wave.tasks, key=lambda t: len(t.shared_resources), reverse=True):
        tasks.append({
            "id": task.id,
            "start_offset_ms": cumulative_offset,
            "worktree": "wt/shared",
            "provider_chain": provider_chain_for(task),
            "shared_resources": list(collect_resources(task)),
            "merge_strategy": "sequential_commit",
        })
        # Estimate task duration (conservative: 2x expected)
        cumulative_offset += estimate_task_duration(task) * 2000
    
    return {
        "wave_number": wave.number,
        "parallelism": "LOW",
        "strategy": f"serialized ({len(wave.tasks)} tasks)",
        "tasks": tasks,
    }


# Error Recovery Protocol
def handle_partial_wave_failure(wave_plan, failed_tasks):
    """
    When some tasks in a wave fail:
    
    1. Log failures → SUMMARY-WAVE-{N}.md
    2. Check if failures block downstream waves
    3. If yes → retry with adjusted provider chain
    4. If no → proceed to next wave, mark failed tasks for post-wave fix
    
    Returns: (proceed_to_next_wave: bool, fix_plan: dict)
    """
    wave_number = wave_plan.current_wave.number
    
    # Categorize failures
    blocking_failures = []
    non_blocking_failures = []
    
    for failed_task in failed_tasks:
        downstream_tasks = get_dependent_tasks(failed_task.id, wave_plan.all_tasks)
        
        if not downstream_tasks:
            non_blocking_failures.append(failed_task)
        else:
            blocking_failures.append(failed_task)
    
    # Determine recovery strategy
    if blocking_failures:
        for task in blocking_failures:
            # Try alternate provider from chain
            if try_provider_fallback(task):
                log_retry_attempt(wave_number, task.id)
            else:
                return (False, {"retry": True, "failed_tasks": [t.id for t in blocking_failures]})
    
    # Log non-blocking failures for post-wave fix
    for task in non_blocking_failures:
        log_failure_for_post_wave_fix(wave_number, task.id)
    
    return (True, {
        "blocked_by": [t.id for t in blocking_failures],
        "post_wave_fixes": [t.id for t in non_blocking_failures],
    })


# Verification after wave completion
def verify_wave_completion(wave):
    """
    Verify all tasks in wave completed successfully.
    Used as coordination point before next wave starts.
    """
    results = {}
    
    for task in wave.tasks:
        status = check_task_completion(task.id)
        results[task.id] = status
        
        if status == "failed":
            log_error(f"Wave {wave.number}: Task {task.id} failed")
        
        if status == "artifact_missing":
            # Check what artifacts were expected
            expected_artifacts = get_expected_artifacts(task)
            missing = [a for a in expected_artifacts if not artifact_exists(a)]
            log_error(f"Wave {wave.number}: Task {task.id} — missing artifacts: {missing}")
    
    all_pass = all(r in ("success", "skipped") for r in results.values())
    return {"all_passed": all_pass, "results": results}
```

---

## Acceleration Ratio Target: ~5x vs Sequential Execution

### Calculation Methodology

```python
def calculate_parallel_acceleration(wave_plan):
    """
    Calculate theoretical acceleration ratio of parallel execution.
    
    Formula: Speedup = Sequential Time / Parallel Time
    
    Where:
        Sequential Time = sum(task_estimated_duration for all tasks)
        Parallel Time = sum(wave_duration for all waves)
            Wave duration = max(task_duration within wave) for HIGH parallelism
    
    Target: >= 4.0x (aiming for ~5x for large feature projects)
    """
    
    sequential_time = sum(
        estimate_task_duration(task) 
        for wave in wave_plan.waves 
        for task in wave.tasks
    )
    
    # Parallel time depends on parallelism level per wave
    parallel_time = 0
    for wave in wave_plan.waves:
        if wave.parallelism == "HIGH":
            # True parallel — wave duration = longest task
            parallel_time += max(
                estimate_task_duration(task) 
                for task in wave.tasks
            )
        
        elif wave.parallelism == "MEDIUM":
            # Coordinated — slight overhead for merge coordination
            base_duration = max(
                estimate_task_duration(task) 
                for task in wave.tasks
            )
            parallel_time += base_duration * 1.2  # 20% coordination overhead
        
        elif wave.parallelism == "LOW":
            # Serialized — sequential within wave
            parallel_time += sum(
                estimate_task_duration(task) 
                for task in wave.tasks
            )
    
    acceleration = sequential_time / parallel_time if parallel_time > 0 else 1.0
    
    return {
        "sequential_time_ms": sequential_time,
        "parallel_time_ms": parallel_time,
        "acceleration_ratio": round(acceleration, 2),
        "target_met": acceleration >= 4.0,
    }
```

### Expected Acceleration by Project Scale

| Tasks | Sequential Time (est.) | Parallel Time (est.) | Acceleration Ratio | Notes |
|-------|----------------------|---------------------|-------------------|-------|
| 5 (quick fix) | ~2 min | ~1.5 min | 1.3x | Small scope, limited parallelism |
| 15 (feature) | ~15 min | ~3-4 min | 3.8x | Medium parallelism, some coordination overhead |
| 30 (complex feature) | ~30 min | ~6-7 min | 4.5-5x | High parallelism in multiple waves |
| 50+ (large refactoring) | ~60 min | ~12-15 min | 4-5x | More waves, higher coordination overhead |

> ⚠️ Actual acceleration depends on DAG depth (flatter = more parallelism) and resource contention level.

---

## Execution Timeline with Coordination Points

```
Wave 1 (HIGH parallelism: tasks A, B, C start simultaneously)
    │
    ├── A ████████████████ (complete)
    ├── B ████████████████ (complete)  
    └── C ████████████████ (complete)
    │
    ▼ Coordination Point G11-A (verify Wave 1 completion)
    │
Wave 2 (MEDIUM parallelism: tasks D, E share db/ — coordinated merge)
    │
    ├── D ──(5s delay)──████████████ (complete)
    └── E ████████████████████ (complete, coordinated merge with D)
    │
    ▼ Coordination Point G11-B (verify Wave 2 completion)
    │
Wave 3 (LOW parallelism: tasks F, G, H serialized sequentially)
    │
    ├── F ───██████─┤
    ├── G ───────██████─┤
    └── H ──────────██████ (complete)
    │
    ▼ Coordination Point G11-C (verify Wave 3 completion)
    │
    Final Integration Gate → ARCHIVE phase
```

---

## Error Handling: Partial Wave Failure Strategy

| Scenario | Action | Gate Result |
|----------|--------|-------------|
| **All tasks succeed** | Proceed to next wave | PASS |
| **Some tasks fail, no downstream dependency blocked** | Proceed to next wave + log for post-wave fix | PASS (with notes) |
| **Blocking task fails, alternate provider available** | Retry with next provider in chain → re-verify | RE-WORK (auto-retry ≤2x) |
| **Blocking task fails, no alternate provider** | Pause execution, prompt user for decision | FAIL → User Gate |
| **All tasks fail** | Roll back worktree changes, return to Phase 4 planning | FAIL → Re-plan |

### Post-Wave Fix Protocol

When non-blocking tasks fail but downstream waves proceed:

```markdown
## Post-Wave Fixes Required (Wave N)

| Task ID | Failure Reason | Artifact Missing | Fix Priority | Estimated Fix Time |
|---------|---------------|-----------------|-------------|-------------------|
| task-7  | Timeout | `dist/output.js` | P1 (blocking) | ~2 min |
| task-12 | Validation failed | `src/utils.ts:export` | P2 (non-blocking) | ~3 min |

**Action**: Fix in Phase 4 post-wave, merge into next wave or create new Wave N+X
```

---

## Resource Contention Resolution

### Automatic Conflict Detection

| Shared Resource Type | Detection Method | Resolution Strategy |
|---------------------|-----------------|-------------------|
| **Same file edited** | Git diff conflict marker detection | Last-write-wins with coordinated commit |
| **Database schema change** | Migration file hash comparison | Serialized execution within wave |
| **API endpoint collision** | Route table merge validation | Rename + cross-reference update |
| **Export/Import conflict** | Symbol name deduplication at merge time | Auto-prefix + rename in affected imports |

### Contention Escalation Protocol

```python
def handle_contention(wave_number, resource_key, conflicts):
    """
    If automatic resolution fails → escalate to user.
    """
    if len(conflicts) > 2:  # More than 2 tasks fighting over same resource
        return escalate_to_user({
            "wave": wave_number,
            "resource": resource_key,
            "conflicting_tasks": [t.id for t in conflicts],
            "recommended_action": "serialized_execution",
        })
    
    return auto_resolve(conflicts)
```

---

## Token Budget Profile (Parallel Engine Overhead)

| Step | Context Size | Tokens Est. | Notes |
|------|-------------|-------------|-------|
| Wave Plan Analysis | wave-plan.yaml (compressed) | ~3K | Parse all waves + parallelism levels |
| Task Duration Estimation | Heuristic model | ~200 | Read-only estimation, no LLM call |
| Coordination Point Generation | Per-wave output | ~500/wave | Low overhead markdown generation |
| **Total per feature** | | **~4-8K** | **Negligible vs parallel speedup value** |

> Parallel Engine's token cost is minimal (~4-8K), but its value is measured in execution time saved: 3-5x wall-clock reduction for typical features.

---

## Phase Integration

| Phase | Usage |
|-------|-------|
| **Phase 4 (Build)** | Primary consumer — executes wave plan with parallel optimization |
| **Phase 7 (Integration)** | Post-wave conflict resolution + canary deployment coordination |
| **All Phases** | Execution timeline logged for performance benchmarking |

---

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Parallel-Specific Scenario | Action | Wave Impact |
|-------|------|------------|--------------------------|--------|-------------|
| **P0** | BLOCKING | Task failed and ≥1 dependent task in same wave or downstream wave is blocked | Blocking: Agent-A produces output file required by Agent-B; Agent-A timeout causes Agent-B idle wait | Stop entire wave, retry Agent-A with fallback provider, re-verify all dependents before resuming | Blocks all downstream waves until resolved. User gate if retry exhausted |
| **P1** | RECOVERABLE | Single agent fails but no other task in same wave depends on it | Recoverable: Agent-C file write timeout due to lock contention; no other task needs Agent-C's output | Auto-retry with exponential backoff (3 attempts). If exhausted → document in post-wave fix, proceed | No cross-wave impact. Document for Phase 4 post-wave repair |
| **P2** | WARNING | Agent succeeded but with warnings (merge conflict auto-resolved, lint errors, partial output) | Warning: Two agents edited same file boundaries → last-write-wins resolved; no semantic conflict | Log merge location in execution report, continue execution | Continue normally. Note in Wave Summary for awareness |
| **P3** | INFO | Agent heartbeat timeout or slow task (>50% of allocated timeout), but still running | Info: Agent-D working on large file >50% through timeout window; progress confirmed | Log warning with elapsed time, continue monitoring | No impact. May trigger parallelism downgrade if 2+ agents exceed 75% timeout |

**Severity Assignment Rules**:
- Default to P1 for any agent failure unless inter-agent dependency exists (then escalate to P0)
- Escalate from P1→P0 if retry exhaustion OR dependent agent in same wave has not started
- Auto-detect file contention: if git conflict markers found → promote to P2 minimum
- Never demote P0: once blocking, only PASS or manual override by Orchestrator

**Parallel-Specific Error Detection Logic**:

```python
def detect_parallel_errors(wave_results):
    """
    Analyze agent execution results for parallel-specific error patterns.
    
    Returns per-task severity level (P0-P3) and cross-task dependency analysis.
    """
    errors = []
    agent_output_map = {task.id: task.output for task in wave_results}
    
    for task in wave_results:
        if task.status == "success":
            # Check for merge conflicts auto-resolved
            if has_git_conflicts(task.commit):
                severity = P2  # Warning - auto-resolved
            else:
                continue  # No error
            
        elif task.status == "timeout":
            # Check if any other agent depends on this task's output
            dependents = get_dependent_agents(task.id, wave_results)
            if dependents:
                severity = P0  # Blocking
            else:
                severity = P1  # Recoverable
        
        elif task.status == "resource_contention":
            # Multiple agents fighting over same resource
            contention_count = count_conflicting_agents(task.id, wave_results)
            if contention_count > 2:
                severity = P0  # Escalate to user decision
            else:
                severity = P1  # Auto-retry with isolation
        
        elif task.status == "file_conflict":
            # Agent output has git merge conflict markers
            severity = P2  # Warning - last-write-wins
        
        errors.append({
            "task_id": task.id,
            "severity": severity,
            "description": f"{task.status}: {task.error_message}",
            "dependents": [d.id for d in dependents] if 'dependents' in locals() else [],
        })
    
    return errors
```

---

## Boundary Conditions

### Context Budget (Hard Limits)

| Resource | Limit | Threshold | Overbehavior |
|----------|-------|-----------|--------------|
| Parallel Engine context (wave-plan.yaml parsing) | ~150K tokens max | Warning at >120K (80%) | Compress wave plan to task IDs + parallelism tags only; drop verbose descriptions |
| Per-wave scheduling overhead | ~10K tokens per wave | No warning — always under budget | If exceeds → use minimal scheduler mode (task ID list only) |
| Total context for multi-wave planning | ~50K tokens (pre-scan all waves) | Hard cap at 30K before dispatching | Skip pre-scan; schedule waves incrementally one-by-one |

### Concurrent Limits

| Parameter | Limit | Rationale |
|-----------|-------|-----------|
| Max concurrent agents per wave | 7 (recommended) / 10 (hard cap) | Beyond 10 → merge conflict risk increases non-linearly; diminishing returns on parallelism |
| Max concurrent waves (inter-wave) | 2 (only when waves have zero shared resources) | Wave N+1 reads Wave N output — true inter-wave parallel only for independent wave groups |
| Max file handles per agent | OS-dependent (typically 1024+) | Rarely hit — individual agents typically modify <50 files |

**Degradation Trigger**: If any concurrent agent exceeds its timeout by >50%, reduce parallelism level for remaining agents in this wave (e.g., HIGH → MEDIUM → serial).

### Timeout Policy

| Scope | Default | Max | Behavior on Timeout |
|-------|---------|-----|---------------------|
| Per-agent (per task) | 10 minutes | 30 minutes (configurable at Phase 3 planning) | Kill agent → emit P1 heartbeat → retry with fallback provider chain → if exhausted, mark for post-wave fix |
| Per-wave total | Sum of all agent timeouts × 1.5 (parallel factor) | No hard cap | If wave exceeds: split into sub-waves or downgrade to serialized execution |
| Inter-wave coordination barrier | 2 minutes | — | If barrier check exceeds: log warning, proceed anyway (barrier is idempotent) |

**Circuit Breaker Pattern**:
```
If 3 consecutive waves have ≥50% agent failures → OPEN circuit → skip remaining waves, escalate to Orchestrator
If 1 wave completes fully → CLOSE circuit → resume normal execution
```

### Unified Parallelism Level Definitions

The following classification is **canonical** across the entire workflow system. All layers defer to this table for parallelism level semantics. See [wave-executor](../../L2-ENGINE/wave-executor/_SKILL.md) for concrete execution examples mapped to these levels.

| Level | Strategy | Description |
|-------|----------|-------------|
| **HIGH** | Independent worktrees | Each task in `wt/{task-id}`, no merge needed — true parallelism with zero shared resources |
| **MEDIUM** | Lock-based coordinated merge | Shared resources protected by file locks, last-write-wins or merge driver — pairwise resource conflicts within a wave |
| **LOW** | Sequential commit | Tasks run sequentially within a wave, simple merge at end — multiple tasks share same resources |
| **NONE** | Atomic single task | Single task only, no parallelism overhead |

### File Merge Strategy per Parallelism Level

| Parallelism | Merge Strategy | Conflict Resolution | Rollback Support |
|-------------|---------------|-------------------|-----------------|
| **HIGH** (independent worktrees) | Atomic commit — no conflicts possible | N/A (isolated worktrees: `wt/{task-id}`) | Full rollback per worktree via git reset |
| **MEDIUM** (coordinated merge) | Lock-based coordinated write | Last-write-wins with conflict marker logging; auto-prefix for symbol collisions | Partial rollback: revert conflicting file to pre-wave state |
| **LOW** (serialized) | Sequential commit — no conflicts | No merge needed (sequential execution) | Full rollback via git reset HEAD~N |
| **NONE** (single task) | Atomic commit | N/A | Full rollback via git reset |

### Wave Coordination Points

| Coordination Point | Trigger | Validation | Failure Behavior |
|-------------------|---------|-----------|-----------------|
| **Pre-wave dispatch** | wave-plan.yaml loaded + all gates PASS | Every task has provider chain, DAG valid, no cycles | Pause → fix identified issue → retry gate |
| **Intra-wave barrier** (MEDIUM/LOW) | First agent finishes | All agents in conflict cluster started within stagger window (5s × conflict count) | Wait up to 60s for lagging agents; if exceeded → mark P1, proceed |
| **Inter-wave barrier** | Wave N all tasks complete | Wave N Summary exists + Result = PASS + no missing artifacts | BLOCKED → re-run failed tasks → regenerate Summary → verify again |
| **Final integration gate** | All waves complete | All wave Summaries exist + no P0 unresolved errors | FAIL → report to Orchestrator with full error summary |

### Partial Failure Handling Matrix

| Scenario | Action | Gate Result | Next Step |
|----------|--------|-------------|-----------|
| **All agents succeed** | Proceed to next wave | PASS | Continue normally |
| **Some agents fail, no downstream dependency blocked** | Proceed + log for post-wave fix | PASS (with notes) | Continue; repair in Phase 4 |
| **Blocking agent fails, fallback provider available** | Auto-retry with next provider (≤2x) | RE-WORK | Retry → re-verify dependents |
| **Blocking agent fails, no fallback provider** | Pause, prompt user for decision | FAIL → User Gate | User chooses: retry manual / skip / abort |
| **All agents in wave fail** | Roll back worktree changes, return to planning | FAIL → Re-plan | Regenerate wave-plan.yaml |
| **>50% agents fail in single wave** | Flag as planning problem, escalate to Orchestrator | P0 | May require re-split at Phase 3 (dag-router) |

---

## 向后兼容

| v1.0 产物 | Parallel Engine 处理 |
|-----------|---------------------|
| `03-tasks.md` (串行任务列表) | Auto-convert: all tasks in single wave, parallelism=NONE |
| `[P]` markers (并行组) | [P] groups → separate waves with HIGH parallelism |
| No dependency info | Single-wave fallback with sequential execution |
