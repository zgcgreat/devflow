# L3-DAG Router — 任务依赖分析 → Wave 分组

> **Layer**: L3-ARCHITECTURE (全局协调层)  
> **前置**: Phase 1/2 需求确认完成, Phase 3 Task List 已生成  
> **后置产物**: `WAVE-PLAN.md` (每波的任务列表 + 并行度标记)  
> **门控**: G4 — DAG Validation Gate

## Skill元信息

```yaml
name: dag-router
version: 3.0
layer: L3-ARCHITECTURE
source: Kahn topological sort algorithm from L2 wave-executor, provider routing from R10
dependencies:
  - phase-3-task-plan (input: task list with dependencies)
v3_upgrade:
  dag_routing: true (Kahn algorithm TypeScript impl in L2, this file is the protocol spec)
  parallelism_matrix: true (HIGH/MEDIUM/LOW/NONE per wave)
  g4_gate_control: true (validates wave plan before BUILD phase)
```

## 输入

- Phase 3 Task List (`03-tasks.md` 或 `tasks.json`)
- 任务依赖关系图 (每个任务的 `depends_on` 字段)
- 资源约束 (可选: shared databases, APIs, file patterns)

## 输出

- `WAVE-PLAN.md` — 每波的任务分组、并行度标记、合并策略

---

## 核心算法: Kahn Topological Sort

```python
# Kahn's Algorithm — DAG → Wave Assignment
def kahn_topological_sort(tasks):
    """
    Input: List[Task{id, name, deps[], shared_resources[]}]
    Output: List[Wave{number, tasks[], parallelism_level}]
    """
    # Step 1: Build in-degree map
    in_degree = {}
    adjacency = {}
    for task in tasks:
        in_degree[task.id] = len(task.deps)
        adjacency[task.id] = []
    
    for task in tasks:
        for dep_id in task.deps:
            adjacency[dep_id].append(task.id)
    
    # Step 2: Kahn's BFS
    waves = []
    remaining = set(tasks)
    
    while remaining:
        # Find all tasks with no unmet dependencies
        ready = [t for t in remaining if in_degree[t.id] == 0]
        
        if not ready:
            raise DAGCycleError(f"DAG contains cycle among {remaining}")
        
        # Step 3: Classify parallelism for this wave
        wave_tasks = classify_wave(ready)
        waves.append(wave_tasks)
        
        # Step 4: Update in-degrees
        remaining -= set(ready)
        for task_id in remaining:
            if any(r.id in adjacency[task_id] for r in ready):
                in_degree[task_id] -= 1
    
    return waves


def classify_wave(ready_tasks):
    """
    Classify parallelism level for a wave of ready tasks.
    
    HIGH: No shared resources — can run in completely separate worktrees
    MEDIUM: Some shared files — need coordinated merge strategy
    LOW: Shared database/API — need serialization or locking
    NONE: Single task only (shouldn't happen, but safety)
    """
    resource_map = {}  # resource_key → list of tasks
    
    for task in ready_tasks:
        for res in task.shared_resources:
            if res not in resource_map:
                resource_map[res] = []
            resource_map[res].append(task)
    
    high_conflicts = [res for res, tasks in resource_map.items() if len(tasks) > 1]
    
    if not high_conflicts:
        return "HIGH"  # No shared resources — full parallel
    elif all(len(tasks) <= 2 for tasks in resource_map.values()):
        return "MEDIUM"  # Pairwise conflicts — coordinated merge
    else:
        return "LOW"  # Multi-task conflicts — may need serialization


# Output format for WAVE-PLAN.md
def format_wave_plan(waves):
    """
    Output format (markdown table per wave):
    
    ### Wave N
    - **Parallelism**: HIGH | MEDIUM | LOW
    - **Strategy**: worktree-per-task / coordinated-merge / serialized
    
    | Task ID | Name | Depends On | Worktree | Shared Resources |
    |---------|------|------------|----------|-----------------|
    | task-1  | ...  | task-0     | wt/task-1| api/            |
    """
```

---

## Parallelism Matrix (Wave → Execution Strategy)

| 并行度 | 资源重叠 | Worktree 策略 | 合并策略 | Heartbeat |
|--------|---------|--------------|---------|-----------|
| **HIGH** | 无共享资源 | Per-task worktree | Atomic merge (no conflict) | Independent |
| **MEDIUM** | ≤2 tasks share resource | Shared worktree with lock | Coordinated commit | Coordinated |
| **LOW** | >2 tasks share resource | Serialized execution | Sequential commit | Dependent |
| **NONE** | Single task | N/A | Direct commit | N/A |

### Worktree 分配算法

```python
def assign_worktrees(wave_tasks, parallelism):
    """
    Assign worktrees based on parallelism level and shared resources.
    """
    if parallelism == "HIGH":
        # Each task gets its own worktree
        return {task.id: f"wt/{task.id}" for task in wave_tasks}
    
    elif parallelism == "MEDIUM":
        # Group by shared resource clusters
        clusters = find_resource_clusters(wave_tasks)
        result = {}
        cluster_id = 0
        for cluster in clusters:
            for task in cluster:
                result[task.id] = f"wt/cluster-{cluster_id}"
            cluster_id += 1
        return result
    
    elif parallelism == "LOW":
        # All tasks share one worktree (serialized)
        return {task.id: "wt/shared" for task in wave_tasks}
    
    else:
        # NONE — single task, no worktree needed
        return {}
```

---

## G4 Gate: DAG Validation

**前置条件**: 所有 `depends_on` 指向的任务 ID 在 Task List 中存在  
**验证步骤**:

1. **Cycle Detection**: Kahn 算法完成时 remaining 集合为空 → 无环
2. **Orphan Check**: 每个任务的 depends_on 都在 tasks 列表中
3. **Resource Conflict Warning**: MEDIUM/LOW 并行度 >50% 的任务 → 建议拆分 wave
4. **Depth Check**: DAG max depth ≤ task count / 2 (扁平化建议)

**Gate Result**:
- PASS: WAVE-PLAN.md 生成, 进入 Phase 4 BUILD
- FAIL: 返回 Phase 3 修正任务依赖关系

---

## Token Budget Profile

| Step | Context Size | Tokens Est. | Savings vs Raw |
|------|-------------|-------------|----------------|
| DAG Analysis | Task List (compressed) | ~2K | N/A |
| Wave Classification | Per-wave tasks | ~5K/wave | ~80% vs sequential |
| Worktree Assignment | Resource map | ~1K | N/A |
| **Total per feature** | | **~8-15K** | **N/A (routing cost)** |

> DAG Router 是轻量级路由层，token 成本远低于 Phase 4 Build。其价值在于避免后续 wave 执行时因依赖错乱导致的返工。

---

## Phase Integration

| Phase | Usage |
|-------|-------|
| **Phase 3 (Task Planning)** | Input: generated task list with dependency annotations |
| **Phase 4 (Build)** | Output: WAVE-PLAN.md consumed by wave-executor |
| **Phase 7 (Integration)** | Re-run DAG on integration conflicts to find fix priorities |

---

## 向后兼容

| v1.0 产物 | DAG Router 处理 |
|-----------|----------------|
| `03-tasks.md` (串行任务列表) | Auto-convert: all tasks in one wave, parallelism=NONE |
| `03-tasks.md` with `[P]` markers | [P] tasks → same wave, classified as HIGH parallelism |
| No dependency info provided | Single-wave fallback (all ready tasks in Wave 1) |
