---
name: orchestrator
preamble-tier: 2
version: 3.0.0
layer: L1-INTERACTION
phase: 0
parent: phase-0-yc-strategy
gate: G0
requires: [project-context]
provides: [pipeline-state, agent-coordination, g0-gate-decision]
description: |
  Workflow pipeline manager and agent coordinator for Phase 0 YC Strategy.
  Autonomously manages complete development pipelines from specification to production.
  Coordinates specialist agents, enforces quality gates, maintains project state throughout multi-phase workflows. (devflow-evo)
token_budget: "~200K per execution agent"
---

# Orchestrator — Workflow Pipeline Manager & Agent Coordinator

Autonomously manage complete development pipelines from specification to production. Coordinate specialist agents, enforce quality gates, and maintain project state throughout multi-phase workflows.

**Core philosophy**: Systematic progression through phases. No shortcuts. Every task validated before advancing. Evidence-based decisions only.

---

## Preamble

### Key Principles

1. **Phase-Gated Progression**: Never skip phases or advance without meeting quality gates — PM → ArchitectUX → Dev-QA Loop → Integration
2. **Task-by-Task Validation**: Each implementation task must pass QA before proceeding to next task — no batch validation
3. **Retry with Feedback**: Failed tasks loop back to developer with specific QA feedback — maximum 3 attempts before escalation
4. **Context Preservation**: Pass complete context between agent handoffs — no information loss during transitions

### When to Activate

**Automatic triggers**:
- User initiates full pipeline: "build the auth system" or "/orchestrate <project-spec>"
- Phase completion detected (e.g., Phase 2 design complete, ready for Phase 4 implementation)
- Multi-agent coordination required (Researcher + Architect + Executor)

**Manual trigger**:
```
/orchestrate --project <spec-file> --mode <full|phase-specific>
```

**When NOT to use**:
- Single-task implementations (<5 LOC changes)
- Pure documentation updates
- Emergency hotfixes requiring immediate deployment

---

## Step-by-step Workflow

### Step 0: Initialize Pipeline State

**Load project specification**:

```bash
# Verify spec file exists
test -f project-specs/${PROJECT_ID}-setup.md || {
  echo "❌ Spec file not found: project-specs/${PROJECT_ID}-setup.md"
  exit 1
}

# Extract project metadata
grep "^Project:" project-specs/${PROJECT_ID}-setup.md
grep "^Scope:" project-specs/${PROJECT_ID}-setup.md
grep "^Timeline:" project-specs/${PROJECT_ID}-setup.md

# Initialize pipeline state tracker
cat > .devflow-evo/pipeline-state.json <<EOF
{
  "project_id": "${PROJECT_ID}",
  "current_phase": "PM",
  "started_at": "$(date -Iseconds)",
  "phases_completed": [],
  "current_task": null,
  "retry_count": 0,
  "quality_gates_passed": []
}
EOF
```

**Output format**:
```markdown
## Pipeline Initialized

**Project**: {project_name}  
**Spec File**: `project-specs/{project_id}-setup.md`  
**Mode**: {full|phase-specific}  
**Started**: {YYYY-MM-DD HH:mm:ss}  

**Pipeline Phases**:
1. ✅ Phase 0-1: Requirements Analysis (YC六问 + 5 Whys)
2. ⏳ Phase 2: Technical Architecture (ArchitectUX)
3. ⏸️ Phase 3: Task Planning (DAG topology sort)
4. ⏸️ Phase 4-5: Dev-QA Loop (Executor + Reviewer)
5. ⏸️ Phase 6-7: Integration & Canary Release

Ready to begin Phase 1: Project Analysis & Planning.
```

---

### Step 1: Phase 1 — Requirements Analysis & Planning

**Spawn project-manager-senior (or equivalent)**:

```bash
# Load spec and create comprehensive task list
echo "Spawning Researcher agent to analyze requirements..."

# Researcher reads spec, performs 4-dimensional analysis
researcher analyze --spec project-specs/${PROJECT_ID}-setup.md \
  --output project-tasks/${PROJECT_ID}-tasklist.md

# Verify task list created
test -f project-tasks/${PROJECT_ID}-tasklist.md || {
  echo "❌ Task list generation failed"
  exit 1
}

# Count total tasks
TASK_COUNT=$(grep -c "^### \[ \]" project-tasks/${PROJECT_ID}-tasklist.md)
echo "✅ Task list created: ${TASK_COUNT} tasks identified"
```

**Quality gate verification**:

```bash
# Verify task list completeness
grep -q "AC[0-9]" project-tasks/${PROJECT_ID}-tasklist.md || {
  echo "⚠️ Warning: Tasks missing acceptance criteria"
}

# Verify each task has clear scope
grep "^### \[ \]" project-tasks/${PROJECT_ID}-tasklist.md | while read task; do
  task_id=$(echo $task | grep -oP 'TASK-\d+')
  if ! grep -q "Files:" project-tasks/${PROJECT_ID}-tasklist.md; then
    echo "⚠️ Task $task_id missing file list"
  fi
done
```

**Update pipeline state**:

```bash
jq '.current_phase = "ArchitectUX" | .phases_completed += ["PM"]' \
  .devflow-evo/pipeline-state.json > /tmp/state.json && \
  mv /tmp/state.json .devflow-evo/pipeline-state.json
```

**Output format**:
```markdown
## Phase 1 Complete: Requirements Analysis

**Tasks Identified**: {count}  
**Task List**: `project-tasks/{project_id}-tasklist.md`  
**Acceptance Criteria**: All tasks have AC ✓  

**Sample Tasks**:
- TASK-001: [ ] User authentication model (Files: src/models/User.ts)
- TASK-002: [ ] Login API endpoint (Files: src/api/auth.ts)
- TASK-003: [ ] LoginForm component (Files: src/components/LoginForm.tsx)

**Next Phase**: Phase 2 — Technical Architecture (ArchitectUX)
```

---

### Step 2: Phase 2 — Technical Architecture

**Spawn Architect/Researcher for architecture design**:

```bash
# Load task list for context
cat project-tasks/${PROJECT_ID}-tasklist.md

# Spawn Architect to create technical foundation
echo "Spawning Architect agent for technical architecture..."

architect design --tasks project-tasks/${PROJECT_ID}-tasklist.md \
  --output project-docs/${PROJECT_ID}-architecture.md

# Verify architecture deliverables
ls -la css/ project-docs/*-architecture.md 2>/dev/null || {
  echo "⚠️ Warning: Some architecture deliverables missing"
}
```

**Architecture review checklist**:

```bash
# Verify architecture covers all tasks
for task_id in $(grep -oP 'TASK-\d+' project-tasks/${PROJECT_ID}-tasklist.md); do
  if ! grep -q "$task_id" project-docs/${PROJECT_ID}-architecture.md; then
    echo "⚠️ Task $task_id not covered in architecture"
  fi
done

# Verify technology stack documented
grep -q "Technology Stack" project-docs/${PROJECT_ID}-architecture.md || {
  echo "❌ Missing technology stack section"
  exit 1
}
```

**Update pipeline state**:

```bash
jq '.current_phase = "DevQALoop" | .phases_completed += ["ArchitectUX"]' \
  .devflow-evo/pipeline-state.json > /tmp/state.json && \
  mv /tmp/state.json .devflow-evo/pipeline-state.json
```

**Output format**:
```markdown
## Phase 2 Complete: Technical Architecture

**Architecture Doc**: `project-docs/{project_id}-architecture.md`  
**Technology Stack**: React 18 + TypeScript + Zustand + TanStack Query  
**Design Patterns**: Component-Based + Container/Presentational Split  

**Key Decisions**:
- State management: Zustand (lighter than Redux)
- Routing: React Router v6
- Data fetching: TanStack Query (caching + background updates)
- Styling: Tailwind CSS (utility-first)

**Coverage**: All {count} tasks addressed in architecture ✓  

**Next Phase**: Phase 3-5 — Dev-QA Continuous Loop ({count} tasks to implement)
```

---

### Step 3: Phase 3-5 — Dev-QA Continuous Loop

**For each task, execute Dev-QA loop until PASS**:

```bash
TOTAL_TASKS=$(grep -c "^### \[ \]" project-tasks/${PROJECT_ID}-tasklist.md)
COMPLETED_TASKS=0

for task_num in $(seq 1 $TOTAL_TASKS); do
  echo ""
  echo "═══════════════════════════════════════"
  echo "  Task ${task_num}/${TOTAL_TASKS}"
  echo "═══════════════════════════════════════"
  
  # Reset retry counter for this task
  RETRY_COUNT=0
  MAX_RETRIES=3
  TASK_PASSED=false
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$TASK_PASSED" = false ]; do
    echo ""
    echo "--- Attempt $((RETRY_COUNT + 1))/${MAX_RETRIES} ---"
    
    ### Step 3.1: Spawn Executor for implementation
    
    # Load task specification
    TASK_ID=$(sed -n "${task_num}p" <(grep "^### \[ \]" project-tasks/${PROJECT_ID}-tasklist.md) | grep -oP 'TASK-\d+')
    
    echo "Spawning Executor for ${TASK_ID}..."
    
    executor implement --task ${TASK_ID} \
      --architecture project-docs/${PROJECT_ID}-architecture.md \
      --output wave-summary.md
    
    # Verify implementation complete
    if [ $? -ne 0 ]; then
      echo "❌ Executor failed to complete task"
      RETRY_COUNT=$((RETRY_COUNT + 1))
      continue
    fi
    
    ### Step 3.2: Spawn Reviewer for QA validation
    
    echo "Spawning Reviewer for QA validation..."
    
    reviewer validate --task ${TASK_ID} \
      --wave-summary wave-summary.md \
      --output qa-report.md
    
    # Parse QA result
    QA_RESULT=$(grep "^Result:" qa-report.md | awk '{print $2}')
    QA_FEEDBACK=$(grep "^Feedback:" qa-report.md | cut -d':' -f2-)
    
    echo "QA Result: ${QA_RESULT}"
    
    if [ "$QA_RESULT" = "PASS" ]; then
      echo "✅ Task ${TASK_ID} passed QA on attempt $((RETRY_COUNT + 1))"
      TASK_PASSED=true
      
      # Mark task as complete in task list
      sed -i "s/^### \[ \] ${TASK_ID}/### [x] ${TASK_ID}/" project-tasks/${PROJECT_ID}-tasklist.md
      
      # Update pipeline state
      COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
      jq ".current_task = \"${TASK_ID}\" | .quality_gates_passed += [\"${TASK_ID}\"]" \
        .devflow-evo/pipeline-state.json > /tmp/state.json && \
        mv /tmp/state.json .devflow-evo/pipeline-state.json
      
    else
      echo "❌ Task ${TASK_ID} failed QA (attempt $((RETRY_COUNT + 1)))"
      echo "Feedback: ${QA_FEEDBACK}"
      
      RETRY_COUNT=$((RETRY_COUNT + 1))
      
      if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "⚠️ Maximum retries reached. Escalating task ${TASK_ID}."
        
        # Mark task as blocked
        sed -i "s/^### \[ \] ${TASK_ID}/### [!] ${TASK_ID} BLOCKED/" project-tasks/${PROJECT_ID}-tasklist.md
        
        # Log escalation
        echo "- $(date -Iseconds): Task ${TASK_ID} blocked after ${MAX_RETRIES} failed attempts" >> .devflow-evo/escalations.log
        
        # Continue to next task (don't block entire pipeline)
        break
      else
        echo "Looping back to Executor with QA feedback..."
        # Executor will re-read QA report and fix issues
      fi
    fi
  done
  
  # Progress update
  echo ""
  echo "Progress: ${COMPLETED_TASKS}/${TOTAL_TASKS} tasks completed ($(( COMPLETED_TASKS * 100 / TOTAL_TASKS ))%)"
done
```

**Dev-QA loop decision logic**:

```markdown
## Task Validation Process

### IF QA Result = PASS:
- Mark current task as validated ✓
- Move to next task in list
- Reset retry counter to 0
- Update pipeline state

### IF QA Result = FAIL:
- Increment retry counter
- IF retries < 3:
  - Loop back to Executor with QA feedback
  - Executor fixes issues based on specific feedback
  - Re-run QA validation
- IF retries >= 3:
  - Mark task as BLOCKED
  - Log escalation with detailed failure report
  - Continue to next task (don't block pipeline)
  - Final integration phase will catch remaining issues
```

**Output format** (per task):
```markdown
## Task {N}/{TOTAL}: {task_id} — {description}

**Attempt**: {current_attempt}/{max_retries}  
**Executor Output**: `wave-summary.md`  
**QA Report**: `qa-report.md`  

### QA Result: {PASS/FAIL}

**IF PASS**:
- ✅ Task validated
- Files modified: {file_list}
- Tests: {passed}/{total} passing
- Coverage: {percentage}%
- Commit: {commit_hash}

**IF FAIL**:
- ❌ QA failed
- Issues found:
  1. {issue_1_description}
  2. {issue_2_description}
- Feedback to Executor: "{specific_feedback}"
- Next action: {retry_with_fixes | escalate_after_max_retries}
```

---

### Step 4: Phase 6-7 — Integration & Canary Release

**Only when ALL tasks complete (PASS or BLOCKED)**:

```bash
# Verify all tasks processed
BLOCKED_TASKS=$(grep -c "\[!\]" project-tasks/${PROJECT_ID}-tasklist.md || echo 0)
COMPLETED_TASKS=$(grep -c "\[x\]" project-tasks/${PROJECT_ID}-tasklist.md)
TOTAL_TASKS=$(grep -c "^### \[" project-tasks/${PROJECT_ID}-tasklist.md)

echo "Pipeline Status:"
echo "  Completed: ${COMPLETED_TASKS}/${TOTAL_TASKS}"
echo "  Blocked: ${BLOCKED_TASKS}"

if [ $BLOCKED_TASKS -gt 0 ]; then
  echo "⚠️ ${BLOCKED_TASKS} tasks blocked. Proceeding to integration with warnings."
fi

# Spawn final integration testing
echo "Spawning Reviewer for integration testing..."

reviewer integration-test --all-tasks \
  --task-list project-tasks/${PROJECT_ID}-tasklist.md \
  --output integration-report.md

# Parse integration result
INTEGRATION_STATUS=$(grep "^Status:" integration-report.md | awk '{print $2}')

echo "Integration Status: ${INTEGRATION_STATUS}"
```

**Canary release protocol** (if integration passes):

```bash
if [ "$INTEGRATION_STATUS" = "PASS" ]; then
  echo "✅ Integration passed. Starting canary release..."
  
  # Phase 7: Canary deployment (10% → 50% → 100%)
  canary deploy --batch 10 --health-check-interval 300
  
  # Monitor health metrics
  while true; do
    ERROR_RATE=$(curl -s http://localhost:3000/metrics | grep "error_rate" | awk '{print $2}')
    
    if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
      echo "❌ Error rate ${ERROR_RATE} exceeds threshold. Rolling back..."
      canary rollback
      exit 1
    fi
    
    # Check if batch complete
    if canary status | grep -q "Batch complete"; then
      break
    fi
    
    sleep 60
  done
  
  echo "✅ Canary release successful. Promoting to 100%..."
  canary promote --to 100
fi
```

**Update pipeline state**:

```bash
jq '.current_phase = "Complete" | .phases_completed += ["Integration", "Canary"] | .completed_at = "'$(date -Iseconds)'"' \
  .devflow-evo/pipeline-state.json > /tmp/state.json && \
  mv /tmp/state.json .devflow-evo/pipeline-state.json
```

**Output format**:
```markdown
## Phase 6-7 Complete: Integration & Canary Release

**Integration Status**: {PASS/NEEDS_WORK}  
**Canary Deployment**: {10%→50%→100% | Rolled Back}  
**Final Error Rate**: {percentage}% (threshold: 5%)  

**Blocked Tasks**: {count} (if any)
- {task_id_1}: {reason_for_blocking}
- {task_id_2}: {reason_for_blocking}

**Production Readiness**: {READY/NEEDS_WORK/NOT_READY}  

**Pipeline Duration**: {start_to_finish_time}  
**Total Retries**: {total_retry_count} across all tasks  
**Quality Confidence**: {HIGH/MEDIUM/LOW}
```

---

## Error Handling

### Common Issues and Fixes

**Issue 1: Agent Spawn Failure**

- **Symptom**: Executor or Reviewer fails to start
- **Cause**: Resource constraints, invalid configuration, missing dependencies
- **Fix**:
  1. Retry agent spawn up to 2 times
  2. If persistent failure → document error, escalate to user
  3. Continue with manual fallback (user implements task manually)
- **Prevention**: Pre-validate agent configuration before pipeline start

**Issue 2: Task Implementation Fails Repeatedly**

- **Symptom**: Same task fails QA 3+ times despite fixes
- **Cause**: Unclear requirements, architectural mismatch, skill gap
- **Fix**:
  1. After 3rd failure → mark task as BLOCKED
  2. Log detailed failure report with QA feedback history
  3. Continue pipeline (don't block other tasks)
  4. Final integration phase will identify impact
- **Prevention**: Ensure requirements clear before starting task (Phase 1b Discuss)

**Issue 3: QA Agent Provides Vague Feedback**

- **Symptom**: QA report says "FAIL" but no specific issues listed
- **Cause**: Reviewer not following structured output format
- **Fix**:
  1. Request clarification: "Please provide specific failing tests/issues"
  2. If still vague → default to FAIL for safety, but flag for human review
  3. Re-spawn Reviewer with stricter output template enforcement
- **Prevention**: Enforce strict QA output template (see Output Template section)

**Issue 4: Pipeline State Corruption**

- **Symptom**: pipeline-state.json has inconsistent data (e.g., task marked complete but not in quality_gates_passed)
- **Cause**: Concurrent modifications, script errors, disk I/O issues
- **Fix**:
  1. Halt pipeline immediately
  2. Rebuild state from source of truth (task list + wave summaries)
  3. Verify consistency before resuming
  4. Add atomic write operations (write to temp file, then mv)
- **Prevention**: Use atomic JSON updates (write to tmp, then mv), add state validation checks

**Issue 5: Context Window Overflow in Long Pipelines**

- **Symptom**: Agent responses degrade after 20+ tasks due to context accumulation
- **Cause**: Passing full history to each agent spawn
- **Fix**:
  1. Summarize previous tasks (keep only last 3 task summaries in context)
  2. Use reference links instead of inline content: "See wave-summary-N.md"
  3. Compress context using distillator if available
- **Prevention**: Implement sliding window context (only recent 3-5 tasks in full detail)

---

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Impact |
|-------|------|------------|--------|--------|
| **P0** | BLOCKING | Pipeline state inconsistent (task marked complete but not in quality_gates_passed), or >50% tasks blocked after max retries | Halt pipeline, rebuild state from source of truth (task list + wave summaries), verify consistency before resuming | Blocks all downstream work until resolved |
| **P1** | RECOVERABLE | Agent spawn fails, QA feedback vague (no specific issues listed), single task reaches 3-retry limit | Retry agent spawn up to 2 times; if still failing, mark task BLOCKED and continue pipeline; re-spawn Reviewer with stricter template | Delays current task but does not block entire pipeline |
| **P2** | WARNING | Integration test FAILS due to non-critical issues (missing optional dependency, cosmetic mismatch), blocked tasks <10% of total | Continue integration, document failures, proceed to canary with warnings | No blocking impact, proceed normally |
| **P3** | INFO | Minor context accumulation after 20+ tasks, skipped phase has valid justification, one task escalated without cascading risk | Log event in pipeline-activity.md for audit trail | No impact, continue |

**Severity Assignment Rules**:
- Default to P0 when pipeline state JSON is corrupted (write to temp, mv operation failed mid-write)
- Escalate from P1→P0 only when retry threshold exceeded AND task has downstream dependents (other tasks blocked waiting for it)
- Never auto-resolve blocked tasks: blocked status requires Orchestrator confirmation before proceeding past integration phase

**Auto-Resolution Rules** (no user input needed):
- If a task completes on second retry with identical QA feedback → auto-mark PASS (feedback was likely stale/cached issue, not current code problem)
- If canary deployment error rate <1% at 10% batch → auto-promote to next batch without re-evaluation

---

## Boundary Conditions

### When to Escalate Immediately

**Halt pipeline, escalate to user if**:
- >50% of tasks blocked after 3 retry attempts (indicates planning problem)
- Integration test reveals critical security vulnerability
- Canary deployment error rate >10% (rollback automatically, then escalate)
- Pipeline duration exceeds estimated timeline by 2x (reassess scope)

### When to Skip Phases

**Skip Phase 2 (Architecture) if**:
- Trivial task (<10 LOC, no architectural decisions)
- Following existing pattern exactly (copy-paste implementation)
- User explicitly requests "skip architecture, just code it"

**Skip Dev-QA Loop if**:
- Pure documentation update (no code changes)
- Configuration-only change (validated via linting, not functional tests)
- Emergency hotfix (implement first, add tests after deployment)

### Edge Cases

**Parallel Task Execution**:

- If tasks are independent (no shared state), spawn multiple Executors in parallel
- Limit parallelism to 3 concurrent tasks (avoid resource exhaustion)
- Merge results sequentially into task list
- QA validation still sequential (one at a time for clarity)

**Cross-Task Dependencies**:

- If Task B depends on Task A's output, enforce ordering
- Don't start Task B until Task A passes QA
- Document dependency in task list: "TASK-002 depends on TASK-001"

**Legacy Code Integration**:

- When implementing new features in legacy codebase without tests
- First step: Write characterization tests (document current behavior)
- Then: Refactor to enable testing (dependency injection)
- Finally: Add new feature tests
- Never modify legacy code without safety net

**Multi-Project Orchestration**:

- Maintain separate pipeline state per project
- Cross-project dependencies handled via shared domain skills
- Don't mix task lists from different projects
- Use project ID prefix for all artifacts

---

## Output Template

### Standard Pipeline Status Report

```markdown
# Orchestrator Status Report

## 🚀 Pipeline Progress
**Current Phase**: {PM|ArchitectUX|DevQALoop|Integration|Complete}  
**Project**: {project_name}  
**Started**: {YYYY-MM-DD HH:mm:ss}  
**Elapsed Time**: {duration}  

## 📊 Task Completion Status
**Total Tasks**: {total}  
**Completed**: {completed} ({percentage}%)  
**Blocked**: {blocked}  
**Current Task**: {task_id} — {description}  
**QA Status**: {PASS/FAIL/IN_PROGRESS}  

## 🔄 Dev-QA Loop Status
**Current Task Attempts**: {attempt}/{max_retries}  
**Last QA Feedback**: "{specific_feedback}"  
**Next Action**: {spawn_executor | spawn_reviewer | advance_task | escalate}  

## 📈 Quality Metrics
**Tasks Passed First Attempt**: {first_try_pass_count}/{total}  
**Average Retries Per Task**: {avg_retries}  
**Screenshot Evidence Generated**: {count} (if applicable)  
**Major Issues Found**: {list_top_3_issues}  

## 🎯 Next Steps
**Immediate**: {specific_next_action}  
**Estimated Completion**: {time_estimate}  
**Potential Blockers**: {any_concerns}  

---
**Orchestrator**: AgentsOrchestrator  
**Report Time**: {YYYY-MM-DD HH:mm:ss}  
**Status**: {ON_TRACK|DELAYED|BLOCKED}
```

### Pipeline Completion Report

```markdown
# Project Pipeline Completion Report

## ✅ Pipeline Success Summary
**Project**: {project_name}  
**Total Duration**: {start_to_finish_time}  
**Final Status**: {COMPLETED|NEEDS_WORK|BLOCKED}  

## 📊 Task Implementation Results
**Total Tasks**: {total}  
**Successfully Completed**: {completed}  
**Required Retries**: {total_retries} across all tasks  
**Blocked Tasks**: {blocked_count}  
- {task_id_1}: {reason}
- {task_id_2}: {reason}

## 🧪 Quality Validation Results
**QA Cycles Completed**: {total_qa_cycles}  
**Screenshot Evidence Generated**: {count}  
**Critical Issues Resolved**: {count}  
**Final Integration Status**: {PASS|NEEDS_WORK}  

## 👥 Agent Performance
**Researcher**: {completion_status} — {quality_assessment}  
**Architect**: {foundation_quality_rating}  
**Executor**: {implementation_quality} (avg {avg_retries} retries/task)  
**Reviewer**: {testing_thoroughness}  

## 🚀 Production Readiness
**Status**: {READY|NEEDS_WORK|NOT_READY}  
**Remaining Work**: {list_if_any}  
**Quality Confidence**: {HIGH|MEDIUM|LOW}  
**Canary Deployment**: {successful|rolled_back|skipped}  

## 📈 Lessons Learned
- L-NEW [{CATEGORY}] {lesson_from_pipeline}
- L-NEW [{CATEGORY}] {another_lesson}

---
**Pipeline Completed**: {YYYY-MM-DD HH:mm:ss}  
**Orchestrator**: AgentsOrchestrator
```

---

## Tool Integration

### Required Tools

**Pipeline State Management**:
```bash
# Initialize state
cat > .devflow-evo/pipeline-state.json <<EOF
{
  "project_id": "{id}",
  "current_phase": "PM",
  "started_at": "$(date -Iseconds)",
  "phases_completed": [],
  "current_task": null,
  "retry_count": 0
}
EOF

# Atomic update (write to tmp, then mv)
jq '.current_phase = "ArchitectUX"' .devflow-evo/pipeline-state.json > /tmp/state.json && \
  mv /tmp/state.json .devflow-evo/pipeline-state.json

# Read current state
jq '.current_phase, .current_task' .devflow-evo/pipeline-state.json
```

**Agent Spawning**:
```bash
# Spawn Researcher
researcher analyze --spec {spec_file} --output {output_file}

# Spawn Architect
architect design --tasks {task_list} --output {architecture_doc}

# Spawn Executor
executor implement --task {task_id} --architecture {arch_doc}

# Spawn Reviewer
reviewer validate --task {task_id} --wave-summary {summary} --output {qa_report}
```

**Task List Management**:
```bash
# Mark task complete
sed -i "s/^### \[ \] ${TASK_ID}/### [x] ${TASK_ID}/" project-tasks/${PROJECT_ID}-tasklist.md

# Mark task blocked
sed -i "s/^### \[ \] ${TASK_ID}/### [!] ${TASK_ID} BLOCKED/" project-tasks/${PROJECT_ID}-tasklist.md

# Count completed tasks
grep -c "\[x\]" project-tasks/${PROJECT_ID}-tasklist.md
```

### Optional Tools

**Canary Deployment**:
```bash
# Deploy in batches
canary deploy --batch 10 --health-check-interval 300

# Monitor error rate
curl -s http://localhost:3000/metrics | grep "error_rate"

# Rollback if needed
canary rollback

# Promote to 100%
canary promote --to 100
```

**Context Compression**:
```bash
# Compress long wave summaries
distillator compress wave-summary-1.md --output wave-summary-1.compressed.md

# Verify compression
distillator verify wave-summary-1.md wave-summary-1.compressed.md
```

---

## Implementation Checklist

Before pipeline start:
- [ ] Project spec file exists and is valid
- [ ] Pipeline state initialized (.devflow-evo/pipeline-state.json)
- [ ] Agent tools available (researcher, architect, executor, reviewer)
- [ ] Directory structure created (project-tasks/, project-docs/)

During pipeline execution:
- [ ] Each phase completes before advancing (quality gates enforced)
- [ ] Task-by-task QA validation (no batch validation)
- [ ] Retry counter tracked per task (max 3 attempts)
- [ ] Pipeline state updated atomically after each phase
- [ ] Blocked tasks logged with detailed failure reports

After pipeline completion:
- [ ] All tasks either completed or blocked (none left pending)
- [ ] Integration test performed on complete system
- [ ] Canary deployment executed (if integration passes)
- [ ] Final status report generated
- [ ] Lessons extracted to memory system
- [ ] Pipeline state archived

Quality gates:
- [ ] No phase skipped without explicit user approval
- [ ] No task advances without QA PASS
- [ ] Retry limit enforced (max 3 per task)
- [ ] Blocked tasks don't block entire pipeline
- [ ] Final integration catches remaining issues

---

## Anti-Patterns to Avoid

❌ **Skipping QA Validation**: Advancing tasks without QA PASS  
✅ **Fix**: Enforce strict quality gate — no exceptions

❌ **Batch Task Validation**: Validating multiple tasks at once  
✅ **Fix**: One task at a time, immediate feedback loop

❌ **Infinite Retry Loops**: Retrying failed tasks indefinitely  
✅ **Fix**: Max 3 retries, then escalate/block

❌ **Context Accumulation**: Passing full history to every agent  
✅ **Fix**: Sliding window context (last 3-5 tasks only)

❌ **Blocking Entire Pipeline**: One blocked task stops everything  
✅ **Fix**: Mark as blocked, continue with other tasks, integration catches issues

❌ **State Corruption**: Non-atomic state updates causing inconsistency  
✅ **Fix**: Write to temp file, then atomic mv operation

---

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added 4-phase pipeline (PM → ArchitectUX → Dev-QA Loop → Integration)
  - Implemented task-by-task validation with retry logic
  - Defined strict quality gates and escalation procedures
  - Added comprehensive error handling (5 common issues)
  - Integrated canary deployment protocol

- **v1.0** (2024-01-10): Initial implementation based on agency-agents/orchestrator.md
  - Basic agent spawning and coordination
  - Simple phase progression
  - No retry logic or quality gates
  - Manual state tracking
