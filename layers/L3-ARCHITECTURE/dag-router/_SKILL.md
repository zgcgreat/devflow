# DAG Router — Task Dependency Analysis → Wave Grouping

Analyze task dependencies using Kahn's topological sort algorithm to group tasks into dependency-aware waves. Maximize parallelism while preventing conflicts through resource overlap detection.

**Core philosophy**: Parallel where safe, serial where required. Never execute tasks out of order. Detect cycles early. Minimize rework through correct dependency routing.

---

## Preamble

### Key Principles

1. **Topological Ordering**: Tasks execute only after all dependencies complete — Kahn's algorithm guarantees valid execution order
2. **Resource-Aware Parallelism**: Classify waves by shared resource overlap (HIGH/MEDIUM/LOW/NONE) — prevent file conflicts and race conditions
3. **Cycle Detection**: Reject invalid DAGs immediately — circular dependencies indicate planning errors requiring Phase 3 revision
4. **Worktree Isolation**: Assign separate worktrees per wave based on parallelism level — prevent merge conflicts during concurrent execution

### When to Activate

**Automatic triggers** (Phase 3 completion):
- Task list generated with dependency annotations
- User requests implementation plan
- Complex feature with >5 tasks requiring coordination

**Manual trigger**:
```
/dag route --tasks .ultimate-workflow/<req-id>/03-tasks.md
```

**When NOT to use**:
- Single task (no dependencies to resolve)
- All tasks independent (trivial single wave)
- Circular dependencies detected (requires manual fix first)

---

## Step-by-step Workflow

### Step 0: Load Task List with Dependencies

**Read Phase 3 output**:

```bash
# Load task list
cat .ultimate-workflow/<req-id>/03-tasks.md

# Or parse JSON format if available
jq '.tasks[] | {id, name, deps: .depends_on}' .ultimate-workflow/<req-id>/tasks.json
```

**Expected input format**:

```yaml
tasks:
  - id: auth-model
    name: "Create User authentication model"
    depends_on: []
    shared_resources: ["src/models/"]
    
  - id: auth-service
    name: "Implement authentication service"
    depends_on: [auth-model, constants]
    shared_resources: ["src/services/", "api/auth/"]
    
  - id: constants
    name: "Define application constants"
    depends_on: []
    shared_resources: ["src/constants/"]
    
  - id: api-routes
    name: "Setup API routes for auth"
    depends_on: [auth-service]
    shared_resources: ["api/auth/"]
```

**Validate input integrity**:

```bash
#!/bin/bash
# validate-task-list.sh

TASK_FILE=$1

# Check all dependency IDs exist
for dep in $(grep "depends_on:" $TASK_FILE | grep -oP '\[.*?\]' | tr -d '[]' | tr ',' '\n'); do
  if ! grep -q "id: $dep" $TASK_FILE; then
    echo "❌ Dependency '$dep' not found in task list"
    exit 1
  fi
done

echo "✅ All dependencies valid"
exit 0
```

**Output format**:
```markdown
## Task List Loaded

**Total Tasks**: {count}  
**Tasks with Dependencies**: {count}  
**Independent Tasks**: {count}  

**Dependency Graph**:
- auth-model → (none)
- constants → (none)
- auth-service → [auth-model, constants]
- api-routes → [auth-service]

Ready for DAG analysis.
```

---

### Step 1: Kahn's Topological Sort Algorithm

**Execute Kahn's algorithm to detect cycles and assign waves**.

#### Algorithm Implementation

```python
from collections import defaultdict, deque
from typing import List, Dict, Set

class Task:
    def __init__(self, id: str, name: str, deps: List[str], shared_resources: List[str]):
        self.id = id
        self.name = name
        self.deps = deps
        self.shared_resources = shared_resources

class Wave:
    def __init__(self, number: int, tasks: List[Task], parallelism: str):
        self.number = number
        self.tasks = tasks
        self.parallelism = parallelism  # HIGH/MEDIUM/LOW/NONE

def kahn_topological_sort(tasks: List[Task]) -> List[Wave]:
    """
    Kahn's Algorithm — DAG → Wave Assignment
    
    Time Complexity: O(V + E) where V=tasks, E=dependencies
    Space Complexity: O(V + E)
    """
    # Step 1: Build in-degree map and adjacency list
    in_degree: Dict[str, int] = {}
    adjacency: Dict[str, List[str]] = defaultdict(list)
    task_map: Dict[str, Task] = {t.id: t for t in tasks}
    
    for task in tasks:
        in_degree[task.id] = len(task.deps)
        for dep_id in task.deps:
            adjacency[dep_id].append(task.id)
    
    # Step 2: Initialize queue with tasks having no dependencies
    queue = deque([t.id for t in tasks if in_degree[t.id] == 0])
    
    waves: List[Wave] = []
    processed: Set[str] = set()
    
    # Step 3: BFS level-by-level (each level = one wave)
    while queue:
        wave_tasks = []
        next_queue = deque()
        
        # Process all tasks at current level
        while queue:
            task_id = queue.popleft()
            wave_tasks.append(task_map[task_id])
            processed.add(task_id)
            
            # Update in-degrees for dependent tasks
            for dependent_id in adjacency[task_id]:
                in_degree[dependent_id] -= 1
                if in_degree[dependent_id] == 0:
                    next_queue.append(dependent_id)
        
        if not wave_tasks:
            break
        
        # Step 4: Classify parallelism for this wave
        parallelism = classify_wave_parallelism(wave_tasks)
        
        waves.append(Wave(
            number=len(waves) + 1,
            tasks=wave_tasks,
            parallelism=parallelism
        ))
        
        queue = next_queue
    
    # Step 5: Cycle detection
    if len(processed) != len(tasks):
        remaining = set(t.id for t in tasks) - processed
        raise DAGCycleError(f"DAG contains cycle among tasks: {remaining}")
    
    return waves


def classify_wave_parallelism(wave_tasks: List[Task]) -> str:
    """
    Classify parallelism level based on shared resource overlap.
    
    HIGH: No shared resources — can run in completely separate worktrees
    MEDIUM: ≤2 tasks share same resource — need coordinated merge
    LOW: >2 tasks share same resource — may need serialization
    NONE: Single task only
    """
    if len(wave_tasks) == 1:
        return "NONE"
    
    # Build resource → tasks mapping
    resource_map: Dict[str, List[Task]] = defaultdict(list)
    for task in wave_tasks:
        for res in task.shared_resources:
            resource_map[res].append(task)
    
    # Find maximum contention
    max_contention = max(len(tasks) for tasks in resource_map.values()) if resource_map else 0
    
    if max_contention == 0:
        return "HIGH"  # No shared resources
    elif max_contention <= 2:
        return "MEDIUM"  # Pairwise conflicts
    else:
        return "LOW"  # Multi-task conflicts
```

**Cycle Detection Example**:

```python
# If cycle exists:
try:
    waves = kahn_topological_sort(tasks)
except DAGCycleError as e:
    print(f"❌ {e}")
    print("Action: Return to Phase 3 to fix circular dependencies")
    exit(1)
```

**Output format** (per wave):
```markdown
## Wave {N} — Topological Level {N}

**Parallelism**: {HIGH|MEDIUM|LOW|NONE}  
**Tasks**: {count}  

**Task List**:
1. {task_id}: {task_name} (deps: {dependencies})
2. {task_id}: {task_name} (deps: {dependencies})

**Shared Resources**:
- {resource_path}: used by [{task_ids}]
```

---

### Step 2: Worktree Assignment Strategy

**Assign worktrees based on parallelism level to prevent merge conflicts**.

#### Worktree Allocation Algorithm

```python
def assign_worktrees(wave: Wave) -> Dict[str, str]:
    """
    Assign worktrees based on parallelism level and shared resources.
    
    Returns: Dict[task_id, worktree_path]
    """
    if wave.parallelism == "HIGH":
        # Each task gets its own isolated worktree
        return {task.id: f"wt/{task.id}" for task in wave.tasks}
    
    elif wave.parallelism == "MEDIUM":
        # Group by shared resource clusters
        clusters = find_resource_clusters(wave.tasks)
        result = {}
        for cluster_id, cluster_tasks in enumerate(clusters):
            worktree = f"wt/cluster-{cluster_id}"
            for task in cluster_tasks:
                result[task.id] = worktree
        return result
    
    elif wave.parallelism == "LOW":
        # All tasks share one worktree (serialized execution)
        return {task.id: "wt/shared" for task in wave.tasks}
    
    else:  # NONE
        # Single task, no worktree needed
        return {}


def find_resource_clusters(tasks: List[Task]) -> List[List[Task]]:
    """
    Group tasks by shared resource overlap using union-find.
    """
    parent = {task.id: task.id for task in tasks}
    
    def find(x):
        if parent[x] != x:
            parent[x] = find(parent[x])
        return parent[x]
    
    def union(x, y):
        parent[find(x)] = find(y)
    
    # Union tasks sharing resources
    resource_to_tasks = defaultdict(list)
    for task in tasks:
        for res in task.shared_resources:
            resource_to_tasks[res].append(task.id)
    
    for res, task_ids in resource_to_tasks.items():
        for i in range(len(task_ids) - 1):
            union(task_ids[i], task_ids[i + 1])
    
    # Group by root
    clusters = defaultdict(list)
    for task in tasks:
        clusters[find(task.id)].append(task)
    
    return list(clusters.values())
```

**Worktree Creation Commands**:

```bash
# HIGH parallelism: Create per-task worktrees
for task_id in auth-model constants; do
  git worktree add wt/$task_id main
done

# MEDIUM parallelism: Create cluster worktrees
git worktree add wt/cluster-0 main

# LOW parallelism: Single shared worktree
git worktree add wt/shared main
```

**Output format**:
```markdown
## Worktree Assignment — Wave {N}

**Parallelism Level**: {HIGH|MEDIUM|LOW|NONE}  
**Strategy**: {per-task|clustered|shared|none}  

**Assignments**:
| Task ID | Worktree Path | Rationale |
|---------|--------------|-----------|
| auth-model | wt/auth-model | No shared resources |
| constants | wt/constants | No shared resources |
| auth-service | wt/cluster-0 | Shares src/services/ with api-routes |
| api-routes | wt/cluster-0 | Shares api/auth/ with auth-service |

**Merge Strategy**:
- HIGH: Atomic merge (no conflicts expected)
- MEDIUM: Coordinated commit (resolve conflicts before merge)
- LOW: Sequential commit (serialize execution)
```

---

### Step 3: Generate WAVE-PLAN.md

**Compile wave assignments into deployment plan**.

#### WAVE-PLAN.md Template

```markdown
# Wave Execution Plan — [req-id]

## Overview
- **Total Waves**: {count}
- **Total Tasks**: {count}
- **Estimated Duration**: {minutes} (with parallelism) vs {serial_minutes} (without)
- **Speedup Factor**: {x}x

## Wave Details

### Wave 1
- **Parallelism**: HIGH
- **Tasks**: 2 (auth-model, constants)
- **Strategy**: Per-task worktrees
- **Estimated Time**: 3min

| Task ID | Name | Depends On | Worktree | Shared Resources |
|---------|------|------------|----------|------------------|
| auth-model | Create User auth model | — | wt/auth-model | src/models/ |
| constants | Define app constants | — | wt/constants | src/constants/ |

### Wave 2
- **Parallelism**: MEDIUM
- **Tasks**: 2 (auth-service, api-routes)
- **Strategy**: Clustered worktrees (shared resources)
- **Estimated Time**: 8min

| Task ID | Name | Depends On | Worktree | Shared Resources |
|---------|------|------------|----------|------------------|
| auth-service | Implement auth service | auth-model, constants | wt/cluster-0 | src/services/, api/auth/ |
| api-routes | Setup API routes | auth-service | wt/cluster-0 | api/auth/ |

## Resource Conflict Analysis

**HIGH Contention Resources**:
- None

**MEDIUM Contention Resources**:
- api/auth/: used by auth-service, api-routes (2 tasks)

**LOW Contention Resources**:
- None

## Execution Order

1. Wave 1 (parallel) → Wait for both tasks complete
2. Wave 2 (coordinated) → Resolve conflicts before merge
3. Continue to Phase 4 BUILD

## G4 Gate Validation

- [ ] All dependencies resolved
- [ ] No cycles detected
- [ ] Worktree assignments valid
- [ ] Resource conflicts documented

**G4 Result**: [PASS / FAIL]
```

**Write to disk**:

```bash
# Generate WAVE-PLAN.md
cat > .ultimate-workflow/<req-id>/WAVE-PLAN.md << 'EOF'
{wave plan content}
EOF

echo "✅ WAVE-PLAN.md generated"
```

---

### Step 4: G4 Gate Validation

**Validate DAG integrity before proceeding to Phase 4**.

#### Validation Checklist

```markdown
## G4 Gate: DAG Validation

**Validation Steps**:

1. **Cycle Detection**: ✅ PASS
   - Kahn's algorithm completed successfully
   - All {count} tasks processed
   - No remaining unprocessed tasks

2. **Orphan Check**: ✅ PASS
   - All dependency IDs exist in task list
   - No dangling references

3. **Resource Conflict Warning**: ⚠️ WARNING
   - 1 resource with MEDIUM contention (api/auth/)
   - Recommendation: Monitor for merge conflicts during Wave 2

4. **Depth Check**: ✅ PASS
   - Max DAG depth: 2 levels
   - Acceptable (≤ task_count / 2 = 2)

**Gate Result**: ✅ PASS → Proceed to Phase 4 BUILD

If FAIL:
- Return to Phase 3
- Fix circular dependencies or missing task IDs
- Re-run DAG Router
```

**Validation Script**:

```bash
#!/bin/bash
# g4-validation.sh

WAVE_PLAN=$1

# Check cycle detection
if grep -q "DAG contains cycle" $WAVE_PLAN; then
  echo "❌ G4 FAIL: Cycle detected"
  exit 1
fi

# Check all tasks assigned to waves
TOTAL_TASKS=$(grep "^  - id:" .ultimate-workflow/<req-id>/03-tasks.md | wc -l)
ASSIGNED_TASKS=$(grep "| [a-z]" $WAVE_PLAN | wc -l)

if [ $TOTAL_TASKS -ne $ASSIGNED_TASKS ]; then
  echo "❌ G4 FAIL: Not all tasks assigned to waves ($ASSIGNED_TASKS/$TOTAL_TASKS)"
  exit 1
fi

echo "✅ G4 PASS: DAG validation successful"
exit 0
```

---

## Error Handling

### Common Issues and Fixes

**Issue 1: Circular Dependency Detected**

- **Symptom**: Kahn's algorithm throws `DAGCycleError: DAG contains cycle among [task-a, task-b]`
- **Cause**: Task A depends on B, B depends on A (direct or indirect cycle)
- **Fix**:
  1. Identify cycle: `python3 scripts/find-cycle.py --tasks 03-tasks.md`
  2. Break cycle by removing one dependency edge
  3. Justify removal: "Task A doesn't actually need B at runtime"
  4. Re-run DAG Router
- **Prevention**: Phase 3 should validate dependencies before generating task list

**Issue 2: Missing Dependency Reference**

- **Symptom**: Task references dependency that doesn't exist in task list
- **Cause**: Typo in dependency ID or forgot to create dependency task
- **Fix**:
  1. Find missing reference: `grep "depends_on:" 03-tasks.md | grep -v "^\s*#" | grep -oP '\[.*?\]' | tr -d '[]' | tr ',' '\n' | sort -u`
  2. Cross-reference with task IDs: `grep "^  - id:" 03-tasks.md | awk '{print $3}' | sort -u`
  3. Add missing task or fix typo
  4. Re-run DAG Router
- **Prevention**: Automated validation in Phase 3 task generation

**Issue 3: Excessive Resource Contention**

- **Symptom**: >50% of waves classified as LOW parallelism (serialized)
- **Cause**: Too many tasks sharing same files/APIs/databases
- **Fix**:
  1. Identify bottleneck resources: `grep "LOW" WAVE-PLAN.md`
  2. Split tasks to reduce overlap (e.g., separate API routes into multiple files)
  3. Refactor shared code into reusable modules
  4. Re-run DAG Router
- **Prevention**: Design phase should minimize shared state

**Issue 4: Unbalanced Wave Sizes**

- **Symptom**: Wave 1 has 10 tasks, Wave 2 has 1 task (poor load balancing)
- **Cause**: Deep dependency chain creating bottleneck
- **Fix**:
  1. Flatten dependency graph where possible
  2. Extract independent sub-tasks from large wave
  3. Consider splitting into multiple features
  4. Re-run DAG Router
- **Prevention**: Aim for balanced waves (±2 tasks per wave)

**Issue 5: Worktree Creation Failure**

- **Symptom**: `git worktree add` fails with "path already exists"
- **Cause**: Previous deployment left stale worktrees
- **Fix**:
  1. Clean old worktrees: `git worktree prune`
  2. Remove stale directories: `rm -rf wt/*`
  3. Re-create worktrees
  4. Add cleanup step to deployment script
- **Prevention**: Automated worktree cleanup in CI/CD pipeline

---

## Boundary Conditions

### When to Escalate Immediately

**Skip DAG routing, escalate to user if**:
- Cycle involves >5 tasks (indicates fundamental architecture issue)
- All tasks have LOW parallelism (no benefit from DAG routing)
- Resource contention makes parallelism impossible (redesign needed)
- Task count >50 (too complex, split into multiple features)

### When to Skip Wave Grouping

**Use single wave (no grouping) if**:
- All tasks independent (no dependencies)
- Single task only
- Tasks must execute sequentially by design (e.g., database migrations)

### Edge Cases

**Empty Task List**:

- Skip DAG routing entirely
- Output: "No tasks to route"
- Proceed directly to Phase 4 with empty wave

**Single Wave with All Tasks**:

- Still generate WAVE-PLAN.md for consistency
- Mark parallelism based on resource overlap
- Execute normally

**Dynamic Dependencies** (runtime-determined):

- Use conservative estimation (assume worst-case dependencies)
- Document assumptions in WAVE-PLAN.md
- Allow runtime adjustment during Phase 4 execution

**Cross-Project Dependencies**:

- Treat external project tasks as "already completed"
- Document external dependencies in WAVE-PLAN.md
- Verify external artifacts exist before starting

---

## Output Template

### Standard WAVE-PLAN.md

```markdown
# Wave Execution Plan — [req-id]

## Overview
- **Total Waves**: {count}
- **Total Tasks**: {count}
- **Estimated Duration**: {minutes} (parallel) vs {serial_minutes} (serial)
- **Speedup Factor**: {x}x

## Wave Details

### Wave {N}
- **Parallelism**: {HIGH|MEDIUM|LOW|NONE}
- **Tasks**: {count}
- **Strategy**: {per-task|clustered|shared|none}
- **Estimated Time**: {minutes}

| Task ID | Name | Depends On | Worktree | Shared Resources |
|---------|------|------------|----------|------------------|
| {id} | {name} | {deps} | {worktree} | {resources} |

## Resource Conflict Analysis
- **HIGH**: {list or "None"}
- **MEDIUM**: {list}
- **LOW**: {list}

## G4 Gate Validation
- [ ] Cycle detection: PASS
- [ ] Orphan check: PASS
- [ ] Resource conflicts: {WARNING/PASS}
- [ ] Depth check: PASS

**G4 Result**: [PASS / FAIL]
```

---

## Tool Integration

### Required Tools

**Git Worktree Management**:
```bash
# Create worktree
git worktree add wt/task-id main

# List worktrees
git worktree list

# Remove worktree
git worktree remove wt/task-id

# Prune stale worktrees
git worktree prune
```

**Python DAG Processing**:
```python
# Run Kahn's algorithm
python3 scripts/kahn-sort.py \
  --input .ultimate-workflow/<req-id>/03-tasks.md \
  --output .ultimate-workflow/<req-id>/WAVE-PLAN.md
```

### Optional Tools

**Graph Visualization**:
```bash
# Generate DAG visualization
python3 scripts/visualize-dag.py \
  --tasks 03-tasks.md \
  --output dag-graph.png
```

**Automated Cleanup**:
```bash
#!/bin/bash
# cleanup-worktrees.sh
git worktree prune
rm -rf wt/*
echo "✅ Worktrees cleaned"
```

---

## Implementation Checklist

Before DAG routing:
- [ ] Task list generated with dependency annotations
- [ ] All dependency IDs validated (exist in task list)
- [ ] Shared resources identified for each task

During DAG routing:
- [ ] Kahn's algorithm executed successfully
- [ ] No cycles detected (or handled appropriately)
- [ ] Parallelism classified for each wave
- [ ] Worktrees assigned based on parallelism level

After DAG routing:
- [ ] WAVE-PLAN.md generated with all sections
- [ ] G4 gate validation passed
- [ ] Resource conflicts documented
- [ ] Execution order clearly defined

Quality gates:
- [ ] All tasks assigned to exactly one wave
- [ ] No task executes before its dependencies
- [ ] Worktree strategy matches parallelism level
- [ ] Estimated duration realistic (with buffer)

---

## Anti-Patterns to Avoid

❌ **Ignoring Cycles**: Attempting to execute cyclic DAG → infinite loop  
✅ **Fix**: Detect cycles early, return to Phase 3 for correction

❌ **Over-Parallelizing**: Running conflicting tasks in parallel → merge conflicts  
✅ **Fix**: Respect resource overlap classification (HIGH/MEDIUM/LOW)

❌ **Under-Parallelizing**: Serializing independent tasks → wasted time  
✅ **Fix**: Accurately identify truly independent tasks

❌ **Skipping G4 Gate**: Proceeding without validation → runtime failures  
✅ **Fix**: Mandatory G4 validation before Phase 4

❌ **Hardcoding Worktree Paths**: Manual path management → errors  
✅ **Fix**: Automated worktree assignment based on parallelism

---

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added 4-step workflow (load tasks → Kahn's sort → worktree assignment → G4 validation)
  - Implemented comprehensive parallelism classification (HIGH/MEDIUM/LOW/NONE)
  - Defined worktree allocation algorithm with resource clustering
  - Added detailed error handling (5 common issues)
  - Integrated G4 gate validation protocol

- **v1.0** (2024-01-10): Initial implementation based on Kahn's algorithm
  - Basic topological sort
  - Simple wave grouping
  - No parallelism classification
  - Manual worktree assignment
