---
name: executor
preamble-tier: 2
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: [wave-plan, single-task-definition]
provides: [implemented-code, test-results, commit-hash]
description: |
  TDD implementation engine operating within Wave-based parallel execution framework.
  Implements tasks with Red→Green→Refactor cycle, R6 anti-hallucination checks,
  and atomic commits. Use when: "implement feature", "TDD development", "execute wave tasks",
  "run tests first". (devflow-evo)
source: 引擎层 Executor + Wave Engine + TDD Workflow
dependencies:
  - dag-router (input: wave-plan.yaml with task dependencies)
  - parallel-engine (dispatches executor per wave in dependency order)
  - wave-executor (coordinates Wave lifecycle; executor is the implementation engine invoked by parallel-engine during each wave)
triggers:
  - implement feature
  - TDD development
  - execute wave tasks
  - run tests first
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Executor — TDD Implementation & Wave Parallel Execution

> **DEPRECATION NOTE**: `dev-log.md` is deprecated. All heartbeat checkpoints now use the canonical location `.specs/waves/wave-${WAVE_NUM}/heartbeat.log` (unified with wave-executor). Old `dev-log.md` references are retained in comments for backwards compatibility only.

Implement features using Test-Driven Development (TDD) within Wave-based parallel execution framework. Write failing tests first, then minimal code to pass, then refactor. Execute tasks in dependency-aware parallel waves for maximum throughput.

**Core philosophy**: Red → Green → Refactor. Never skip tests. Parallelize where safe, serialize where required. Commit atomically with meaningful messages.

---

## Preamble

### What I Am / What I'm Not

**I am**: The TDD implementation engine that executes Phase 3 task plans using test-driven development within Wave-based parallel execution. I write failing tests first (Red), minimal code to pass (Green), then refactor — all within dependency-aware parallel waves.

**I'm not**: A design tool (Phase 2a produces the spec), a documentation writer, a configuration manager, or a UI painter. My sole purpose is TDD-based code implementation with strict adherence to R6 anti-hallucination rules.

### Pre-Requisite Gate Checklist

Before starting executor, verify ALL of the following:

- [ ] Phase 3 DAG Router complete — wave-plan.yaml exists at `.devflow-evo/wave-plan.yaml`
- [ ] Wave plan validated — no cycles detected (DAG validation exits 0)
- [ ] All task IDs unique — no duplicates in wave plan
- [ ] Task priorities assigned (P0/P1/P2) — no unassigned tasks
- [ ] Previous Wave SUMMARY is PASS (or this is Wave 1 with no dependency)

**Gate Result**: `[PASS / FAIL]` — If any item FAILS, fix identified issue before starting. This gate MUST pass for every new wave.

### Key Principles

1. **TDD Mandatory**: Always write failing test first (Red), then minimal implementation (Green), then improve code quality (Refactor) — never reverse this order
2. **R6 Anti-Hallucination Checks**: Six rules preventing scope creep, unauthorized changes, and placeholder code — violation requires immediate rollback
3. **Wave-Level Isolation**: Each Wave runs in fresh ~200K token context, preventing context rot from previous Waves
4. **Atomic Commits**: Every task ends with clean commit following caveman-commit format (`type(scope): description`)

### When to Activate

**Automatic triggers** (Phase 4):
- Phase 3 DAG topology sort complete, Wave plan generated
- User requests implementation: "build the auth module"
- Previous Wave SUMMARY marked PASS, ready for next Wave

**Manual trigger**:
```
/execute wave:N --tasks <task-list>
```

**When NOT to use**:
- Pure documentation updates (no code changes)
- Configuration-only changes (no logic)
- Emergency hotfixes requiring immediate deployment (skip TDD, add tests after)

---

## Step-by-step Workflow

### Step 0: Load Wave Plan & Verify Dependencies

**Load Phase 3 output**:

```bash
# Read Wave allocation plan
cat .devflow-evo/wave-plan.yaml

# Example structure:
# wave_plan:
#   - wave_number: 1
#     tasks:
#       - id: auth-model
#         deps: []
#         priority: P0
#       - id: constants
#         deps: []
#         priority: P0
#   - wave_number: 2
#     tasks:
#       - id: api-service
#         deps: [auth-model]
#         priority: P1
```

**Verify prerequisite Waves**:

```bash
# Check if Wave N-1 SUMMARY exists and PASSED
if [ $WAVE_NUM -gt 1 ]; then
  PREV_WAVE=$((WAVE_NUM - 1))
  if grep -q "Status: FAIL" .specs/waves/wave-${PREV_WAVE}/SUMMARY.md; then
    echo "❌ Wave ${PREV_WAVE} failed. Fix before proceeding."
    exit 1
  fi
fi

# Confirm all task dependencies met
for task in $(yq '.wave_plan[] | select(.wave_number == '$WAVE_NUM') | .tasks[].id' wave-plan.yaml); do
  deps=$(yq '.wave_plan[].tasks[] | select(.id == "'$task'") | .deps[]' wave-plan.yaml)
  for dep in $deps; do
    if ! grep -q "\[checkpoint\].*\[task:${dep}\].*✓" .specs/waves/wave-${WAVE_NUM}/heartbeat.log; then
      echo "❌ Task $task depends on $dep, which is not complete."
      exit 1
    fi
  done
done
```

**Initialize Execution Agent context** (~200K fresh tokens):

```yaml
execution_agent_context:
  max_tokens: 200000 # ~200K tokens
  freshness_guarantee: "cleared at each wave start"
  injected_content:
    - "Wave {N} task list + dependency graph"
    - "Wave {N-1} SUMMARY (results only, not details)"
    - "Domain skills matching current tasks (max 2)"
    - "LearningFlow nominations from previous waves"
  excluded_content:
    - "Phase 1-2 conversation history"
    - "Previous wave implementation details (beyond summary)"
    - "PartyMode discussion transcripts"
```

**Output format**:
```markdown
## Wave {N} Initialized

**Tasks**: {count} tasks  
**Dependencies**: All met ✓  
**Context**: ~200K fresh tokens loaded  
**Domain Skills**: {skill_1}, {skill_2}  

Ready to execute. Starting Task 1: {first_task_id}
```

---

### Step 1: TDD Red-Green-Refactor Cycle (Per Task)

Execute **Story-level 10-step implementation** for each task:

#### Step 1.1: Read Story + Acceptance Criteria

```bash
# Load task specification
cat .specs/tasks/{task-id}.md

# Extract acceptance criteria
grep "^AC[0-9]" .specs/tasks/{task-id}.md
```

**Example AC**:
```markdown
**AC1**: User can login with email/password  
**AC2**: Invalid credentials show error message  
**AC3**: Successful login redirects to dashboard  
**AC4**: Session persists across page refresh  
```

#### Step 1.2: Confirm File List

Identify files to be created/modified:

```bash
# Based on task type, determine affected files
case $TASK_TYPE in
  "model")
    FILES=("src/models/User.ts" "src/models/__tests__/User.test.ts")
    ;;
  "api")
    FILES=("src/api/auth.ts" "src/api/__tests__/auth.test.ts" "src/types/auth.ts")
    ;;
  "component")
    FILES=("src/components/LoginForm.tsx" "src/components/__tests__/LoginForm.test.tsx")
    ;;
esac

echo "Files to modify/create:"
printf '%s\n' "${FILES[@]}"
```

**R6.2 Check**: Do NOT introduce files not listed in TASK.md.

#### Step 1.3: Write Interface/Type Definitions First

Contract-first approach — define types before implementation:

```typescript
// src/types/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'NETWORK_ERROR';
  message: string;
}
```

**Rationale**: Types serve as contract between frontend/backend. Catch mismatches early.

#### Step 1.4: Write Failing Test (RED)

Write test that exercises AC but fails initially:

```typescript
// src/models/__tests__/User.test.ts
import { User } from '../User';

describe('User Model', () => {
  it('should create user with valid email', () => {
    const user = new User({ email: 'test@example.com' });
    expect(user.email).toBe('test@example.com');
  });

  it('should reject invalid email', () => {
    expect(() => new User({ email: 'invalid' })).toThrow('Invalid email');
  });

  it('should hash password before saving', async () => {
    const user = new User({ email: 'test@example.com', password: 'secret123' });
    await user.save();
    expect(user.password).not.toBe('secret123'); // Should be hashed
    expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt format
  });
});
```

**Run test to confirm failure**:
```bash
npm test -- User.test.ts

# Expected output:
# FAIL  src/models/__tests__/User.test.ts
#   ● User Model › should create user with valid email
#     TypeError: User is not a constructor
```

**Verification**: Test MUST fail. If it passes → test is wrong (testing nothing).

#### Step 1.5: Write Minimal Implementation (GREEN)

Write just enough code to make test pass — no extra features:

```typescript
// src/models/User.ts
import bcrypt from 'bcrypt';
import validator from 'validator';

export class User {
  email: string;
  password?: string;

  constructor(data: { email: string; password?: string }) {
    if (!validator.isEmail(data.email)) {
      throw new Error('Invalid email');
    }
    this.email = data.email;
    this.password = data.password;
  }

  async save(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    // TODO: persist to database
  }
}
```

**Run test to confirm pass**:
```bash
npm test -- User.test.ts

# Expected output:
# PASS  src/models/__tests__/User.test.ts
#   User Model
#     ✓ should create user with valid email (5ms)
#     ✓ should reject invalid email (12ms)
#     ✓ should hash password before saving (85ms)
```

**Verification**: All tests MUST pass. If any fail → fix implementation, don't modify test.

#### Step 1.6: Refactor

Improve code quality without changing behavior:

**Refactoring checklist**:
- [ ] Eliminate code duplication (DRY principle)
- [ ] Improve variable/function names (clarity over cleverness)
- [ ] Extract helper functions (>20 LOC functions)
- [ ] Add JSDoc comments for public APIs
- [ ] Remove console.log statements
- [ ] Ensure consistent formatting (Prettier)

**Example refactoring**:

Before:
```typescript
async save(): Promise<void> {
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
  }
  // Save to DB
  await db.collection('users').insertOne({
    email: this.email,
    password: this.password
  });
}
```

After:
```typescript
/**
 * Hashes password and persists user to database.
 * @throws {Error} If database operation fails
 */
async save(): Promise<void> {
  await this.hashPassword();
  await this.persistToDatabase();
}

private async hashPassword(): Promise<void> {
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
}

private async persistToDatabase(): Promise<void> {
  await db.collection('users').insertOne({
    email: this.email,
    password: this.password
  });
}
```

**Run tests again to verify no regression**:
```bash
npm test -- User.test.ts
# Should still PASS
```

**Karpathy Principle**: "Simple > Clever". Prefer readable code over optimized code until profiling proves bottleneck.

#### Step 1.7: Run Full Test Suite

Ensure new code doesn't break existing tests:

```bash
npm test

# Expected: All tests pass (including new ones)
# If failures: Identify if caused by new code or pre-existing issue
```

**R6.5 Check**: Do NOT modify existing tests to make them pass. Fix implementation instead.

#### Step 1.8: R6 Anti-Hallucination Self-Check

Validate against 6 rules:

```markdown
## R6 Self-Check

- [ ] **R6.1**: Did NOT auto-fix other files without explicit request
- [ ] **R6.2**: Did NOT introduce files not in TASK.md
- [ ] **R6.3**: Did NOT add dependencies not in package.json
- [ ] **R6.4**: Did NOT generate placeholder/"TODO" code
- [ ] **R6.5**: Did NOT modify tests to pass (fixed implementation instead)
- [ ] **R6.6**: All AC covered by tests

Result: {PASS / FAIL}
```

**If any rule violated → Rollback immediately**:
```bash
git reset --hard HEAD~1
echo "❌ R6 violation detected. Changes rolled back. Please review requirements."
exit 1
```

#### Step 1.9: Write Dev-Log Entry

Document implementation decisions and issues:

```markdown
## [2024-03-15 14:30] Wave 1, Task: auth-model

**Duration**: 25 minutes  
**Files Modified**: 
- `src/models/User.ts` (created)
- `src/models/__tests__/User.test.ts` (created)
- `src/types/auth.ts` (created)

**Implementation Notes**:
- Used bcrypt for password hashing (industry standard)
- Validator library for email validation (avoids regex errors)
- Extracted hashPassword() method for clarity

**Tests**: 3/3 passing  
**Coverage**: 85% (lines), 100% (branches)  

**Issues Encountered**:
- Initial test failed due to missing bcrypt dependency → Added to package.json
- Email validation edge case: "user@localhost" rejected → Acceptable (require valid domain)

**LESSONS Nomination**:
- **L-103 [SUCCESS]** bcrypt default salt rounds (10) sufficient for most apps → Wave {N}, Task: auth-model
  - Root cause: Verified via testing, no issues found
  - Fix: Confirmed best practice
  - Reusability: ⭐⭐⭐
- **L-104 [INSIGHT]** Type-first development catches interface mismatches early → Wave {N}, Task: auth-model
  - Root cause: Catched TS2307 errors before runtime
  - Fix: Define types/contracts first, implementation second
  - Reusability: ⭐⭐⭐⭐

> Note: L-XXX numbers are temporary placeholders assigned during wave execution. The learning-workflow Step 2 assigns the final canonical L-XXX number during LESSONS.md consolidation (see learning-workflow/_SKILL.md §Step 2 Numbering rules).
```

#### Step 1.10: Atomic Commit (caveman-commit)

Commit with standardized format:

```bash
# Stage changes
git add src/models/User.ts src/models/__tests__/User.test.ts src/types/auth.ts

# Commit with caveman format
git commit -m "feat(auth): add User model with password hashing

- Create User class with email validation
- Implement bcrypt password hashing (salt rounds: 10)
- Add unit tests for creation, validation, hashing
- Extract hashPassword() for clarity

Tests: 3/3 passing, 85% coverage"

# Verify commit
git log -1 --stat
```

**Commit format rules**:
- Subject line: ≤50 characters, imperative mood ("add" not "added")
- Type: feat / fix / refactor / test / docs / chore
- Scope: Module name in parentheses (optional)
- Body: Explain WHAT and WHY (not HOW — code shows that)
- Footer: Reference tickets/issues (optional)

**Heartbeat checkpoint**:
```bash
echo "[checkpoint][wave:${WAVE_NUM}][task:${TASK_ID}] ✓ (25min)" >> .specs/waves/wave-${WAVE_NUM}/heartbeat.log
```

---

### Step 2: Wave-Level Parallel Execution

**Determine parallelism strategy**:

| Scenario | Parallelism Level | Strategy |
|----------|------------------|----------|
| No shared resources (pure UI components) | HIGH | All tasks truly parallel |
| Shared database schema | MEDIUM | Serial DDL migrations, parallel DML operations |
| Shared API contract | LOW | Serial interface definitions, parallel implementations |

**Execute Wave tasks**:

```bash
# For each task in Wave (parallel if possible)
for task in $(yq '.wave_plan[] | select(.wave_number == '$WAVE_NUM') | .tasks[].id' wave-plan.yaml); do
  # Launch task in background (parallel)
  execute_task $task &
  TASK_PIDS+=($!)
done

# Wait for all tasks to complete
for pid in "${TASK_PIDS[@]}"; do
  wait $pid
  if [ $? -ne 0 ]; then
    echo "❌ Task failed. See .specs/waves/wave-${WAVE_NUM}/heartbeat.log for details."
    FAILED_TASKS+=($task)
  fi
done

# If any failures → stop Wave, don't proceed to next
if [ ${#FAILED_TASKS[@]} -gt 0 ]; then
  echo "[checkpoint][wave:${WAVE_NUM}][all-done] ✗ → fix required" >> .specs/waves/wave-${WAVE_NUM}/heartbeat.log
  exit 1
fi

echo "[checkpoint][wave:${WAVE_NUM}][all-done] ✓" >> .specs/waves/wave-${WAVE_NUM}/heartbeat.log
```

**Context isolation enforcement**:

Each task runs in isolated Execution Agent context (~200K tokens):
- ✅ Fresh context (no contamination from previous tasks)
- ✅ Only Wave N task list + Wave N-1 SUMMARY injected
- ❌ No Phase 1-2 conversation history
- ❌ No PartyMode transcripts

**Benefit**: Prevents context rot, maintains high-quality outputs throughout long projects.

---

### Step 3: Post-Wave Actions

#### Generate Wave SUMMARY

See canonical template in [wave-executor/_SKILL.md](../wave-executor/_SKILL.md#step-2-post-wave-actions) for the authoritative Wave SUMMARY format. The executor follows that same structure with these executor-specific notes:

- **Tasks Executed**: count of tasks completed within this wave
- **Success Rate**: {passed}/{total} ({percentage}%) based on TDD cycle pass/fail
- **LESSONS Nomination**: use `L-XXX` prefix format (see below)
- **Breaking Changes**: list any API/schema changes affecting downstream waves

```markdown
# Wave {N} Summary — [req-id]

## Basic Information
- **Wave Number**: {N}
- **Tasks Executed**: {count}
- **Success Rate**: {passed}/{total} ({percentage}%)
- **Total Time**: {duration}
- **Commit Hashes**: [{hash1}, {hash2}, ...]
- **Started At**: {YYYY-MM-DD HH:mm:ss}
- **Completed At**: {YYYY-MM-DD HH:mm:ss}

## Task Details

| Task ID | Status | Duration | Tests Passed | Issues |
|---------|--------|----------|--------------|--------|
| auth-model | ✅ PASS | 25min | 3/3 | — |
| api-service | ❌ FAIL | 15min | 1/3 | TypeScript compile error TS2307 |

## LESSONS Nomination
- **L-105 [SUCCESS]** bcrypt salt rounds 10 sufficient for most apps → Wave {N}, Task: auth-model
  - Root cause: Verified via testing, no issues found
  - Fix: Confirmed best practice
  - Reusability: ⭐⭐⭐

- **L-106 [FAILURE]** Missing type import causes TS2307 → Wave {N}, Task: api-service
  - Root cause: Import path incorrect or file not exported
  - Fix: `import { AuthConfig } from './types'`
  - Reusability: ⭐⭐

> Note: L-XXX numbers are temporary placeholders assigned during wave execution. The learning-workflow Step 2 assigns the final canonical L-XXX number during LESSONS.md consolidation (see learning-workflow/_SKILL.md §Step 2 Numbering rules).

## Breaking Changes

- None / {list of breaking API/schema changes}
- Migration required: YES/NO
- Rollback plan: {steps to revert if needed}

## Next Wave Dependencies

Wave {N+1} depends on:
- {task names from Wave N that provide interfaces/APIs}
- Ensure these are stable before proceeding

## Quality Gates

- [ ] All tasks PASSED or documented failures
- [ ] No BREAKING changes without migration plan
- [ ] LearningWorkflow hook executed
- [ ] SUMMARY.md written to `.specs/waves/wave-{N}/`

**Result**: [PASS / NEEDS WORK / BLOCKED]
```

#### LESSONS Nomination Format (executor-specific)

All lesson nominations in executor MUST use the `L-XXX` prefix format for cross-file consistency. Use sequential placeholder numbers (e.g., L-103, L-104); learning-workflow Step 2 assigns final canonical L-XXX during consolidation:

- **L-{ID} [NEW] {lesson_title} → Wave {N}, Task: {task_id}** — new lesson nominated from this wave
- **L-{ID} [UPDATE] {lesson_title} → Wave {N}, Task: {task_id}** — existing lesson updated with new observation
  - Root cause: {description}
  - Fix: {solution}
  - Reusability: ⭐{rating}

Categories: `[SUCCESS]`, `[FAILURE]`, `[INSIGHT]`, `[PERFORMANCE]`, `[ARCHITECTURE]`

#### LearningWorkflow Hook

Trigger post-wave lesson extraction:

```bash
# Extract lessons from heartbeat log entries in this Wave
grep "Wave ${WAVE_NUM}" .specs/waves/wave-${WAVE_NUM}/heartbeat.log | grep -E "LESSONS|ISSUES" > /tmp/wave-lessons.txt

# Feed to LearningWorkflow
learning-workflow extract --from /tmp/wave-lessons.txt --output .specs/memory/LESSONS.md

# Check for domain skill promotion candidates
# AI 按 LearningWorkflow 指令检查：频率 ≥3 的 LESSONS → 提升为 Domain Skill
```

#### Verify Wave Integrity

```bash
# All tests still passing?
npm test

# No linting errors?
npm run lint

# No TypeScript errors?
npm run build

# If any fail → Wave status = FAIL, must fix before next Wave
```

---

## Error Handling

### Common Issues and Fixes

**Issue 1: Test Passes Initially (Should Fail)**

- **Symptom**: RED phase skipped, test passes before implementation
- **Cause**: Test not actually exercising the code (mocking too much, testing trivialities)
- **Fix**:
  1. Remove mocks/stubs temporarily
  2. Verify test calls real implementation
  3. Assert on meaningful behavior (not just "function exists")
- **Prevention**: Run test BEFORE writing code — must fail

**Issue 2: Infinite Loop in useEffect/Reactive Code**

- **Symptom**: Browser freezes, CPU spikes to 100%
- **Cause**: Missing dependency in useEffect dependency array
- **Fix**:
  ```typescript
  // ❌ BAD: Missing userId
  useEffect(() => { fetchUser(userId); }, []);
  
  // ✅ GOOD: All dependencies listed
  useEffect(() => { fetchUser(userId); }, [userId]);
  ```
- **Prevention**: Enable eslint-plugin-react-hooks (auto-detects missing deps)

**Issue 3: TypeScript Compile Error TS2307 (Cannot Find Module)**

- **Symptom**: `Cannot find module './types' or its corresponding type declarations`
- **Cause**: Import path incorrect or file not exported
- **Fix**:
  1. Verify file exists: `ls src/types/`
  2. Check export: `grep "export" src/types/index.ts`
  3. Correct import path: `import { AuthConfig } from '../types/auth'`
- **Prevention**: Use IDE auto-import (never type imports manually)

**Issue 4: Wave Dependency Not Met**

- **Symptom**: Wave N+1 starts but Wave N task failed
- **Cause**: Skipped dependency verification
- **Fix**:
  1. Halt execution immediately
  2. Fix failing task in Wave N
  3. Re-run Wave N tests
  4. Update Wave N SUMMARY to PASS
  5. Then proceed to Wave N+1
- **Prevention**: Enforce pre-flight check script before each Wave

**Issue 5: Context Window Overflow**

- **Symptom**: Token usage >180K approaching 200K limit
- **Cause**: Too many domain skills loaded or verbose dev-log entries
- **Fix**:
  1. Reduce domain skills from 2 to 1
  2. Compress dev-log entries (remove verbose explanations)
  3. If still overflowing → split Wave into smaller sub-waves
- **Prevention**: Monitor token count every 3 tasks, warn at 150K

---

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Execution Impact |
|-------|------|------------|--------|------------------|
| **P0** | BLOCKING | Task fails TDD cycle and ≥1 dependent task in same wave depends on this task's output | Immediate rollback (git reset --hard), fix root cause, re-run failed task + all dependents | Blocks downstream tasks until resolved |
| **P1** | RECOVERABLE | Single task fails TDD but has no dependents in current wave | Retry 3x with exponential backoff (1s→2s→4s); if still fails → document in SUMMARY, mark NEEDS_WORK | No cross-task impact if no dependents blocked |
| **P2** | WARNING | Task passes TDD but with warnings (lint errors, deprecation notices, edge case uncovered) | Document in SUMMARY, do NOT block execution | Continue normally |
| **P3** | TASK_TIMEOUT | Task exceeds 30-minute total execution time (circuit breaker triggered) | Cancel all sub-tasks, mark PARTIAL_PASS if progress made, log to heartbeat | Cancels current task but allows next wave to proceed; escalate if circuit breaker stays OPEN across waves |

**Severity Assignment Rules**:
- Default to P1 for any TDD failure unless known dependency exists (then escalate to P0)
- Escalate from P1→P0 only if retry exhaustion OR dependent task in same wave has not started
- Never demote: once P0 assigned, only PASS or manual override by Wave Executor can clear

**R6 Violation Escalation**: If R6 anti-hallucination violation repeated 3+ times → escalate to P1 and halt execution for Architect review.

### Retry Chain (Exponential Backoff with Jitter)

For P1 recoverable errors, apply this retry chain:

```yaml
retry_chain:
  attempt_1:
    wait: 1s
    action: "Re-run entire task from start (stateless retry)"
    
  attempt_2:
    wait: 2s
    action: "Clear partial state, re-run from last checkpoint"
    
  attempt_3:
    wait: 4s
    action: "Isolated retry with fresh Executor context (~200K tokens cleared)"

max_retries: 3
timeout_per_attempt: "10min default (configurable per task complexity, max 30min)"
```

**Backoff Jitter Formula**: `jitter = random(0, min(backoff_wait * 0.5, max_jitter))` — prevents thundering herd when multiple tasks retry simultaneously.

### Task Timeout (Circuit Breaker)

Maximum **30 minutes per task** from first attempt to final retry exhaustion. This is the circuit breaker — prevents infinite retry loops from masking deeper issues in the build/test chain.

```bash
TASK_START=$(date +%s)
TOTAL_TIMEOUT=1800  # 30 minutes in seconds

# Before each retry attempt:
ELAPSED=$(( $(date +%s) - TASK_START ))
if [ $ELAPSED -gt $TOTAL_TIMEOUT ]; then
  echo "🔴 Task TIMEOUT after ${ELAPSED}s — circuit breaker OPEN"
  echo "Canceling all sub-task processes..."
  kill -- -$PROCESS_GROUP_ID 2>/dev/null || true
  echo "[checkpoint][wave:${WAVE_NUM}][task:${TASK_ID}] ✗ (CIRCUIT_BREAKER: 30min timeout)" >> .specs/waves/wave-${WAVE_NUM}/heartbeat.log
  # Mark as P1 RECOVERABLE with circuit breaker flag — escalate to Architect if repeated
  exit 1
fi

# Standard retry logic continues...
```

**Circuit Breaker Rules**:
- OPEN: Task exceeds 30min total → cancel sub-tasks, mark PARTIAL_PASS if some progress made
- HALF-OPEN: After circuit opens, next wave attempts task once — if passes → CLOSE, if fails → stay OPEN
- CLOSED: Normal retry operation

**Task Timeout Guard**: Maximum 30 minutes per task. If exceeded, cancel all sub-tasks and advance to next wave. This is the circuit breaker — prevents infinite retry loops from masking deeper issues.

### Partial Success Rules

When some tasks in a wave succeed and others fail:

| Scenario | Action | Wave Result |
|----------|--------|-------------|
| **No dependencies between failed/successful tasks** | Successful tasks commit, failed tasks documented in SUMMARY | NEEDS_WORK — proceed to next wave with partial results |
| **Failed task has dependents in same wave** | Wait for all dependents to finish (may also fail), then retry failed task + dependents together | BLOCKED until fix |
| **>50% tasks fail in single wave** | Flag as potential planning problem, escalate to Architect with analysis | P0 — may require re-split at Phase 3 |
| **Single task fails, all others PASS** | Continue normally, retry 3x before marking NEEDS_WORK | Proceed if retries exhausted and no dependents blocked |

---

## Boundary Conditions

### When to Escalate Immediately

**Skip TDD, escalate to Architect if**:
- Task requires architectural decision not yet made (e.g., "which database?")
- R6 violations repeated 3+ times (systematic misunderstanding of requirements)
- Test coverage <50% despite best efforts (complex legacy code)
- Wave failure rate >50% (indicates planning problem, not execution problem)

### When to Skip Wave Parallelism

**Execute serially if**:
- Tasks share mutable state (database migrations, file system operations)
- Team size = 1 developer (no benefit from parallelism)
- Debugging complex interaction bug (need sequential execution to trace)
- Resource constraints (CI/CD runners limited to 1 concurrent job)

### Edge Cases

**Legacy Code Without Tests**:

- Write characterization tests first (document current behavior)
- Refactor to enable testing (dependency injection, extract methods)
- THEN add new feature tests
- Never modify legacy code without safety net of tests

**Third-Party API Integration**:

- Mock API responses in tests (avoid network calls)
- Use contract testing (Pact) to verify mock matches real API
- Add integration tests separately (slower, run less frequently)
- Handle rate limiting, timeouts, retries in implementation

**Database Schema Changes**:

- Write migration scripts (up/down)
- Test migration on copy of production data
- Backward compatible changes first (add column, don't remove)
- Coordinate with team (schema lock during migration)

**Performance-Critical Code**:

- Write benchmarks alongside tests
- Profile before optimizing (don't guess bottlenecks)
- Document performance requirements in AC (e.g., "P99 <100ms")
- Optimize only after tests pass (correctness > speed)

---

## Output Template

### Standard Task Completion

```markdown
## Task Complete: {task-id}

**Wave**: {N}  
**Duration**: {minutes} minutes  
**Files Modified**: 
- `{file_path}` (created/modified/deleted)
- `{file_path}` (created/modified/deleted)

### Implementation Summary
{2-3 sentences describing what was built}

### Test Results
- **Unit Tests**: {passed}/{total} passing
- **Coverage**: {line_coverage}% (lines), {branch_coverage}% (branches)
- **Integration Tests**: {passed}/{total} passing (if applicable)

### R6 Self-Check
- [x] R6.1: No unauthorized file modifications
- [x] R6.2: No files outside TASK.md scope
- [x] R6.3: No unapproved dependencies
- [x] R6.4: No placeholder/TODO code
- [x] R6.5: Tests not modified to pass
- [x] R6.6: All AC covered

**Result**: ✅ PASS

### Commit
```
{commit_hash} - {commit_message_subject}
```

### LESSONS Nomination
- L-NEW [{CATEGORY}] {lesson_title}: {brief_description}

### Next Steps
- [ ] Proceed to next task in Wave {N}
- [ ] OR: Wave {N} complete, generate SUMMARY
```

### Standard Wave SUMMARY

See canonical template in [wave-executor/_SKILL.md](../wave-executor/_SKILL.md#step-2-post-wave-actions). This section retains executor-specific field notes:

- **Task Details table**: include Coverage column (executor-relevant metric)
- **LESSONS Nomination**: use `L-XXX` prefix format consistently
- **Quality Gates** section mandatory (includes SUMMARY.md write verification)

---

## Tool Integration

### Required Tools

**Test Execution**:
```bash
# Run specific test file
npm test -- {test-file-pattern}

# Run all tests with coverage
npm test -- --coverage

# Watch mode for TDD
npm test -- --watch
```

**Type Checking**:
```bash
# TypeScript compilation
npm run build

# Type check without emit
npx tsc --noEmit
```

**Linting**:
```bash
# ESLint
npm run lint

# Auto-fix fixable issues
npm run lint -- --fix
```

**Git Operations**:
```bash
# Atomic commit
git add {files} && git commit -m "{caveman-commit-message}"

# Verify commit
git log -1 --stat

# Heartbeat checkpoint
echo "[checkpoint][wave:{N}][task:{id}] ✓ ({time})" >> .specs/waves/wave-${N}/heartbeat.log
```

### Optional Tools

**Performance Profiling**:
```bash
# Node.js profiler
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Chrome DevTools (frontend)
# Open DevTools → Performance tab → Record
```

**Bundle Analysis**:
```bash
# Webpack bundle analyzer
npx webpack-bundle-analyzer dist/stats.json

# Source map explorer
npx source-map-explorer dist/*.js
```

**Mutation Testing** (advanced):
```bash
# Stryker mutation testing
npx stryker run

# Ensures tests catch bugs (not just code coverage)
```

---

## Implementation Checklist

Before Wave execution:
- [ ] Wave plan loaded from Phase 3 output
- [ ] Previous Wave SUMMARY verified as PASS
- [ ] All task dependencies confirmed complete
- [ ] Execution Agent context initialized (~200K fresh tokens)
- [ ] Domain skills loaded (max 2 relevant skills)

During task execution:
- [ ] TDD cycle followed (Red → Green → Refactor)
- [ ] Test fails initially (RED phase verified)
- [ ] Test passes after implementation (GREEN phase verified)
- [ ] Refactoring improves code without breaking tests
- [ ] R6 self-check passed (all 6 rules)
- [ ] Full test suite passes (no regressions)
- [ ] Dev-log entry written
- [ ] Atomic commit with caveman format
- [ ] Heartbeat checkpoint recorded

After Wave completion:
- [ ] Wave SUMMARY generated with all required fields
- [ ] LESSONS nominated from dev-log entries
- [ ] LearningWorkflow hook triggered
- [ ] Domain skills promoted if frequency ≥3
- [ ] Quality metrics meet targets (coverage ≥80%, lint=0, tsc=0)
- [ ] Next Wave dependencies documented

Quality gates:
- [ ] No R6 violations
- [ ] All tests passing (unit + integration)
- [ ] Test coverage ≥80% (or justified exception)
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Commits follow caveman format
- [ ] Heartbeat checkpoints recorded

---

## Anti-Patterns to Avoid

❌ **Skipping RED Phase**: Writing implementation before test  
✅ **Fix**: Force test-first discipline, run test before coding

❌ **Testing Implementation Details**: Testing private methods, internal state  
✅ **Fix**: Test public API only (behavior over implementation)

❌ **Over-Mocking**: Mocking everything, testing nothing real  
✅ **Fix**: Mock only external dependencies (APIs, databases), test real logic

❌ **Ignoring Coverage Gaps**: Low coverage but proceeding anyway  
✅ **Fix**: Block Wave completion if coverage <80% without explicit waiver

❌ **Modifying Tests to Pass**: Changing assertions instead of fixing code  
✅ **Fix**: R6.5 violation → rollback immediately

❌ **Premature Optimization**: Optimizing before profiling proves bottleneck  
✅ **Fix**: Follow Karpathy principle: "Simple > Clever", optimize only after measurements

---

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Integrated TDD workflow with Wave parallel execution
  - Implemented R6 anti-hallucination checks
  - Added Story-level 10-step implementation protocol
  - Defined strict heartbeat checkpoint format
  - Added comprehensive error handling (5 common issues)

- **v1.0** (2024-01-10): Initial implementation based on 交互层 developer.md + 引擎层 wave-executor
  - Basic TDD cycle (Red-Green-Refactor)
  - Simple Wave execution without dependency verification
  - No R6 checks
  - Manual commit messages (inconsistent format)

## Sprint 10 Audit: F-P2-3 Heartbeat Data Source 修复确认

**Issue**: executor 与 wave-executor heartbeat 数据源不一致
**Status**: ✅ RESOLVED — executor 已统一使用 `.specs/waves/wave-${WAVE_NUM}/heartbeat.log`

**修复内容**:
1. executor 第30行已有 deprecation note 说明旧 dev-log.md 路径已废弃
2. executor Step 1.10 (line 491) 使用 `.specs/waves/wave-${WAVE_NUM}/heartbeat.log`
3. executor Step 2 (line 527, 531) 使用 `.specs/waves/wave-${WAVE_NUM}/heartbeat.log`
4. executor Step 1 (line 127) 读取 `.specs/waves/wave-${WAVE_NUM}/heartbeat.log` 验证依赖
5. executor Step 1.8 (line 771) 使用 `.specs/waves/wave-${WAVE_NUM}/heartbeat.log`
6. executor Tool Integration (line 946) 使用 `.specs/waves/wave-${N}/heartbeat.log`
7. executor 与 wave-executor 已完全统一心跳日志路径
