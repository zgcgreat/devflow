# Wave Executor — 依赖感知并行执行引擎

> **Layer**: L2-ENGINE (SEP Engine Layer)  
> **前置**: Phase 3 DAG拓扑排序完成，Wave分配计划输出  
> **后置产物**: Per-Wave SUMMARY.md + heartbeat checkpoints  
> **版本**: v3.0-draft

## Skill元信息

```yaml
name: wave-executor
version: 3.0-draft
layer: L2-ENGINE
source: SEP Wave Engine + Mega-Workflow DAG Router + Kahn Algorithm
dependencies:
  - dag-router (Phase 3输出)
v3_upgrade:
  parallel_execution: true (wave-level + task-level dual parallel)
  heartbeat_protocol: "[checkpoint][wave:N][task:X]"
  learning_workflow_hook: true (post-wave lesson extraction)
```

## ⭐ Wave Executor 核心设计

Wave Executor 是 v3.0 并行加速的核心引擎，实现两级并行：

1. **Wave-level**: 独立Wave之间无依赖 → 可并行调度（如果资源允许）
2. **Task-level**: Wave内无依赖任务 → 真正并行执行

### Kahn拓扑排序 → Wave分配算法

```typescript
interface Task {
  id: string;
  deps: string[]; // task ids this task depends on
  priority: number; // P0 (critical) / P1 (high) / P2 (normal)
}

interface Wave {
  waveNumber: number;
  tasks: Task[]; // all tasks in this wave (parallel within)
  dependencies: string[]; // wave-level dependency on previous waves
}

function kahnToWaveAssignment(tasks: Task[]): Wave[] {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, Set<string>>(); // task → tasks that depend on it
  
  // Build graph
  for (const task of tasks) {
    inDegree.set(task.id, task.deps.length);
    for (const dep of task.deps) {
      if (!adjList.has(dep)) adjList.set(dep, new Set());
      adjList.get(dep).add(task.id);
    }
  }

  const waves: Wave[] = [];
  const remaining = new Set(tasks.map(t => t.id));
  
  while (remaining.size > 0) {
    // Find all nodes with in-degree 0 (no unresolved deps)
    const ready = tasks.filter(
      t => remaining.has(t.id) && inDegree.get(t.id) === 0
    );

    if (ready.length === 0) {
      throw new Error("DAG contains cycle: " + Array.from(remaining).join(", "));
    }

    // Sort by priority within wave (P0 first)
    ready.sort((a, b) => a.priority - b.priority);

    waves.push({
      waveNumber: waves.length + 1,
      tasks: ready,
      dependencies: [] // set when processing next wave
    });

    // Remove ready tasks and update in-degrees
    for (const task of ready) {
      remaining.delete(task.id);
      const dependents = adjList.get(task.id) || new Set();
      for (const depId of dependents) {
        inDegree.set(depId, inDegree.get(depId) - 1);
      }
    }
  }

  return waves;
}
```

## 执行流程

### Step 0: Wave Plan 加载

从 Phase 3 DAG Router 输出加载Wave分配计划：

```yaml
# Phase 3 output (loaded here)
wave_plan:
  - wave_number: 1
    tasks:
      - id: auth-model
        deps: []
        priority: P0
      - id: constants
        deps: []
        priority: P0
    parallelism: true (no inter-task deps)
```

### Step 1: Wave 执行协议

**⚠️ 强制规则**: 每Wave开始前验证依赖Wave的SUMMARY是否PASS。

```markdown
## Wave {N} Execution

### Pre-flight Check
- Wave {N-1} SUMMARY: [PASS] (if N > 1)
- Task dependencies met: YES/NO
- Execution Agent context: ~200K tokens fresh ✓

### Task Execution (parallel within wave)
[wave:N][task:auth-model] START
→ Linting → Unit Tests → Code Review → Commit
[wave:N][task:auth-model] END ✓ (time: 3min)

[wave:N][task:constants] START  
→ Linting → Unit Tests → Commit
[wave:N][task:constants] END ✓ (time: 1min)

### Post-Wave Actions
- [checkpoint][wave:{N}][task:all-done] ✓
- LearningWorkflow.run() ← post-wave hook
- Wave {N} SUMMARY.md generated
```

### Step 2: Wave 依赖验证

**⚠️ 强制规则**: Wave N+1执行前必须验证Wave N的SUMMARY。

```markdown
## Wave Dependency Verification

### Wave {N} → Wave {N+1} Transition Check

[ ] Wave {N} all tasks PASSED validation
[ ] No BREAKING changes in Wave {N}
[ ] LearningFlow post-wave hook completed
[ ] Domain skills promoted (if applicable)

Result: [PASS / FAIL]

If PASS: Proceed to Wave {N+1}
If FAIL: Identify failing task → fix → re-run Wave {N} only
```

### Step 3: Wave SUMMARY 生成

**⚠️ 强制规则**: 每个Wave完成后必须生成SUMMARY。

```markdown
# Wave {N} Summary — [req-id]

## 基本信息
- Wave Number: {N}
- Tasks Executed: {count}
- Success Rate: {x}/{y} ({z}%)
- Total Time: {duration}
- Commit Hashes: [{hash1}, {hash2}]

## Task Details
| Task | Status | Time | Tests | Issues |
|------|--------|------|-------|--------|
| auth-model | ✅ PASS | 3min | 5/5 ✓ | — |
| constants | ✅ PASS | 1min | 2/2 ✓ | — |

## LESSONS Nomination
- {lesson_name} → [NEW/UPDATE] (reason)

## Breaking Changes
- None / {list of breaking changes}

## Next Wave Dependencies
- Wave {N+1} depends on: {task names from Wave N}
```

### Step 4: Heartbeat Checkpoint 协议

**⚠️ 强制规则**: 使用统一格式 `[checkpoint][wave:N][task:X]`。

```yaml
heartbeat_format:
  success: "[checkpoint][wave:{N}][task:{id}] ✓ ({duration})"
  failed: "[checkpoint][wave:{N}][task:{id}] ✗ ({error})"
  wave_done: "[checkpoint][wave:{N}][all-done] ✓"
  wave_fail: "[checkpoint][wave:{N}][all-done] ✗ → fix required"
  
# Examples:
- [checkpoint][wave:1][task:auth-model] ✓ (3min)
- [checkpoint][wave:2][task:api-service] ✗ (TypeScript compile error: TS2307)
- [checkpoint][wave:2][all-done] ✗ → fix required
```

## 并行执行优化

### Task-Level 并行策略

| 场景 | 并行度 | 说明 |
|------|--------|------|
| 无共享资源 (纯前端组件) | HIGH | 所有任务真正并行 |
| 共享数据库Schema | MEDIUM | 串行DDL，并行DML |
| 共享API契约 | LOW | 先改接口定义(串行)，再实现(并行) |

### Context Isolation (Agent隔离)

**⚠️ 强制规则**: Wave Executor 在 Execution Agent ~200K fresh context 中运行。

```yaml
execution_agent_context:
  max_tokens: 200000 # ~200K tokens
  freshness_guarantee: "cleared at each wave start"
  injected_content: [
    "Wave {N} task list + dependency graph",
    "Wave {N-1} SUMMARY (results)",
    "Domain skills matching current tasks",
    "LearningFlow nominations from previous waves"
  ]
  excluded_content: [
    "Phase 1-2 conversation context",
    "Previous wave execution details (beyond summary)"
  ]
```

## 降级策略

| 场景 | 降级方案 |
|------|---------|
| DAG中有环(Cycle) | 报错 + 提示Phase 3重新拆分任务 |
| Wave依赖Wave N-1但N-1未执行 | 回退到串行单Wave执行 |
| Execution Agent context满 | 减少domain-skills加载数量(≤2) |
| 资源不足(无法并行) | 自动降级为串行Wave执行，输出说明 |
