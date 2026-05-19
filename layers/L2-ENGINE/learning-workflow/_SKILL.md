---
name: learning-workflow
preamble-tier: 2
version: 3.0-draft
description: |
  Automatic evolution engine that extracts lessons from execution data, promotes high-frequency
  patterns (≥3 occurrences) to domain skills, and injects relevant knowledge into future waves.
  Use when: "extract lessons", "learn from wave", "domain skill promotion", "knowledge consolidation". (ultimate-workflow)
layer: L2-ENGINE
source: SEP LearningWorkflow + Mega-Workflow Memory Manager
dependencies:
  - phase-8-archive (post-archive: LESSONS update + domain skill graduation)
triggers:
  - extract lessons
  - learn from wave
  - domain skill promotion
  - knowledge consolidation
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# LearningWorkflow — Automatic Evolution Engine

Extract lessons from execution data, promote high-frequency patterns to domain skills, and inject relevant experience into future waves. Makes the system progressively smarter with each use.

**Core philosophy**: Every failure teaches something. Every success reveals a pattern. Capture it before it's lost. Make knowledge searchable, actionable, and evolving.

---

## Preamble

### What I Am / What I'm Not

**I am**: The automatic evolution engine that turns execution data (Wave failures, task successes, review findings) into durable domain skills and cross-wave injected knowledge. I make the system progressively smarter with each requirement processed.

**I'm not**: A test runner (I don't execute tests, I learn from their results), a report generator (I extract patterns, not summaries), or a Git commit tool. My sole purpose is closed-loop learning: Lessons → Domain Skills → Wave Injection.

### Pre-Requisite Gate Checklist

Before starting learning workflow, verify ALL of the following:

- [ ] At least one Wave SUMMARY.md exists (`/specs/waves/wave-{N}/SUMMARY.md`) with task results
- [ ] Phase 6 review report available (`06-review.md`) — for edge case extraction
- [ ] memory/ directory exists and is writable (or create it)

**Gate Result**: `[PASS / FAIL]` — If any item FAILS, address before starting. This gate MUST pass for every learning extraction cycle.

### Key Principles

1. **Durable vs Temporary Classification**: All learning outputs must be classified as durable facts (cross-session reusable), temporary notes (session-specific), or session state (request-tracked) — never mix categories
2. **Auto-Evolution Pipeline**: Lessons → Domain Skills → Cross-Wave Injection creates closed-loop learning (system gets stronger with each wave)
3. **Frequency-Based Promotion**: Patterns appearing ≥3 times across different waves automatically promoted to domain skills
4. **Graduation Clustering**: Phase transitions trigger similarity-based clustering to identify project-level patterns (Jaccard threshold=0.25)

### When to Activate

**Automatic triggers** (Phase 4 post-wave hook):
- Wave completion with execution logs available
- Task result: success / failure / partial_success
- User explicitly requests "/learn extract"

**Manual trigger**:
```
/learn extract --from <dev-log|wave-summary|review> --scope <wave|phase|project>
```

**Phase 4 Post-Wave Trigger** (MANDATORY):
- After **every** Wave completes in Phase 4, LearningWorkflow MUST be triggered automatically
- Trigger point: Phase 4 Step N+1 (Learning Extraction), immediately after Wave execution log is finalized
- If Phase 4 has no Waves (e.g., planning-only Phase 4), skip to Phase 8 for final extraction
- Phase 8 Archive Orchestrator also triggers LearningWorkflow for final LESSONS aggregation

**When NOT to use**:
- Trivial changes (<5 LOC, no architectural impact)
- Pure documentation updates (no code logic)
- First wave of new project (insufficient data for patterns)

---

## Step-by-step Workflow

### Step 0: Data Classification — Durable vs Temporary

**⚠️ MANDATORY**: Classify all learning outputs before writing. Mixing categories causes knowledge management chaos.

#### Three Data Categories

| Category | Purpose | Lifecycle | Storage Location |
|----------|---------|-----------|------------------|
| **Durable Facts** | Domain knowledge reusable across sessions | Permanent (until superseded by newer evidence) | `memory/domain-skills/{domain}/SKILL.md` |
| **Temporary Notes** | Session-specific observations, not reusable | Current session / cleared at Phase 8 Archive | `memory/TEMPORARY.md` |
| **Session State** | Request-level workflow tracking | Per req-id, never cross-request reuse | `.ultimate-workflow/<req-id>/STATE.md` |

#### Classification Decision Tree

```yaml
is_learning_output: true → classify

if is_domain_knowledge(learning_output):
    # Reusable across ≥2 different req/workflows
    if frequency_in_lessons >= 3:
        action: create/update domain-skill/{domain}/SKILL.md
        category: DURABLE
    else:
        action: append to LESSONS.md (as NEW/UPDATE)
        category: TEMPORARY → may become durable later
        
elif is_session_tracking(learning_output):
    # Reflects current req-id state changes only
    action: update STATE.md [req-id]
    category: SESSION_STATE
    
else:
    # Session-specific observation, not reusable
    action: append to TEMPORARY.md (with expiry marker)
    category: TEMPORARY
```

**Detection heuristics**:

```bash
# Is domain knowledge? (reusable pattern)
if grep -q "best practice\|pattern\|anti-pattern\|pitfall" learning_output; then
  IS_DOMAIN_KNOWLEDGE=true
fi

# Is session tracking? (state change)
if grep -q "Wave.*completed\|Task.*started\|Status.*changed" learning_output; then
  IS_SESSION_TRACKING=true
fi

# Check frequency in existing lessons
FREQUENCY=$(grep -c "{keyword}" .specs/memory/LESSONS.md || echo 0)
```

**Output format**:
```markdown
## Data Classification Result

**Input Source**: {dev-log.md|wave-summary.md|review-findings.md}  
**Total Entries**: {count}  

**Classification**:
- DURABLE: {count} → domain-skills/
- TEMPORARY: {count} → LESSONS.md / TEMPORARY.md
- SESSION_STATE: {count} → STATE.md

Ready to proceed with extraction.
```

---

### Step 1: Wave Log Scanning → Lesson Extraction

**⚠️ MANDATORY**: Scan all task execution logs in this wave, classify by decision tree.

#### Execution Log Analysis

For each task in wave:

```bash
# Load task execution log
cat .specs/waves/wave-{N}/task-{task-id}/execution.log

# Extract key events
grep -E "FAIL|ERROR|SUCCESS|WARNING|EXCEPTION" execution.log
```

#### Lesson Extraction Decision Tree

```yaml
learning_scan:
  task_result: success | failure | partial_success
  
  # Success branch — extract best practices
  if success:
    extract_patterns: [
      "Which best practice was used? (e.g., retry pattern, memoization)",
      "Which common pitfall was avoided? (e.g., race condition, N+1 query)",
      "What reusable component/pattern emerged? (e.g., auth interceptor)"
    ]
    lesson_type: SUCCESS
    confidence: HIGH (proven working solution)
  
  # Failure branch — root cause analysis
  if failure:
    root_cause_analysis: [
      "Technical root cause? (code bug / config error / env issue)",
      "Fix applied? (specific code change + verification method)",
      "Prevention strategy? (linter rule / pre-commit hook / review checklist)"
    ]
    lesson_type: FAILURE
    confidence: HIGH (verified fix exists)
  
  # Partial success branch — document gaps
  if partial_success:
    document_gap: [
      "Under what conditions did it partially fail?",
      "What tests/validations needed to cover gap? (e.g., edge case test)",
      "Downstream impact scope? (which other modules might break)"
    ]
    lesson_type: INSIGHT
    confidence: MEDIUM (partial evidence)
```

**Extraction examples**:

```markdown
### Example 1: Failure Lesson

**Source**: Wave 3, Task: user-auth-service  
**Result**: FAILURE (TypeScript compile error TS2307)  

**Root Cause**: Missing type import in auth.ts  
**Symptom**: `Cannot find module './types/auth'`  
**Fix**: Add `import { AuthConfig } from '../types/auth'`  
**Prevention**: Enable TypeScript strict mode + IDE auto-import  

**Lesson Type**: FAILURE  
**Confidence**: HIGH (fix verified, tests passing)  
**Reusability**: ⭐⭐⭐⭐ (common in TypeScript projects)

### Example 2: Success Pattern

**Source**: Wave 2, Task: api-rate-limiter  
**Result**: SUCCESS (all tests passing, 95% coverage)  

**Best Practice Used**: Token bucket algorithm with Redis backend  
**Pitfall Avoided**: Race condition in concurrent request handling  
**Reusable Pattern**: Rate limiter middleware with configurable limits  

**Lesson Type**: SUCCESS  
**Confidence**: HIGH (production-tested)  
**Reusability**: ⭐⭐⭐⭐⭐ (applicable to all API endpoints)
```

**Verification checklist**:
- [ ] All tasks in wave scanned
- [ ] Each lesson has clear root cause (not just symptom)
- [ ] Fix/prevention strategy provided
- [ ] Confidence level assigned (HIGH/MEDIUM/LOW)
- [ ] Reusability rated (1-5 stars)

---

### Step 2: LESSONS.md Write Protocol

**⚠️ MANDATORY**: New lessons must be deduplicated against existing entries. Existing lessons must be updated with new evidence.

#### Lesson Template

```markdown
# Lessons Learned

---

## L-XXX [FAILURE/SUCCESS/INSIGHT/PATTERN] {Short Title}

> {1-2 sentence description}

**Context**: {when/where this occurred (wave, task, scenario)}  
**Root Cause**: {underlying technical reason, not surface symptom}  
**Impact**: {what broke or what improved}  
**Solution**: {specific fix code or steps}  

**Applicability**: {who else might encounter this}  
**Severity**: {LOW|MEDIUM|HIGH|CRITICAL}  
**Confidence**: {HIGH|MEDIUM|LOW}  
**Extracted From**: {source file, wave N, task ID}  
**Date**: {YYYY-MM-DD}  

**Prevention**:
- {prevention_step_1}
- {prevention_step_2}

**Related Lessons**:
- L-YYY [CATEGORY] Related topic
- L-ZZZ [CATEGORY] Another related topic

**References**:
- [Link to dev-log entry](link)
- [Link to GitHub issue](link)
```

#### Deduplication Protocol

```typescript
// Pseudo-code: lesson deduplication logic
function deduplicate(newLesson, existingLessons) {
  for (const existing of existingLessons) {
    if (isSameRootCause(newLesson, existing)) {
      return existing.updateWith(newLesson); // UPDATE mode
    }
  }
  return newLesson.createIn(LESSONS.md); // NEW mode
}

function isSameRootCause(a, b) {
  // Normalize root cause for comparison
  const normalizedA = normalize(a.rootCause + a.affectedModule + a.triggerCondition);
  const normalizedB = normalize(b.rootCause + b.affectedModule + b.triggerCondition);
  return normalizedA === normalizedB;
}

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}
```

**Update vs Create decision**:

| Scenario | Action | Example |
|----------|--------|---------|
| Same root cause, new evidence | UPDATE existing lesson | "L-042 updated with Wave 5 findings" |
| Different root cause | CREATE new lesson | "L-043 created for new issue" |
| Contradictory evidence | CREATE new lesson, flag conflict | "L-044 conflicts with L-020, needs review" |

**Numbering rules**:
- Format: `L-XXX` (3-digit zero-padded)
- Incremental only (never reuse numbers)
- Find current max: `grep -oP 'L-\d+' LESSONS.md | sort -t'-' -k2 -n | tail -1`
- Next number = max + 1

**Output format**:
```markdown
## LESSONS.md Update Summary

**New Lessons Created**: {count}
- L-043 [FAILURE] React useEffect Infinite Loop
- L-044 [SUCCESS] Token Bucket Rate Limiter Pattern

**Existing Lessons Updated**: {count}
- L-021 [PATTERN] Custom Hook for Data Fetching (added Wave 3 evidence)

**Total Lessons**: {total_count} (cap: 100, oldest deprecated if exceeded)
```

---

### Step 2.5: LESSONS Nomination → Injection Log Mapping

**⚠️ MANDATORY**: Before promoting to Domain Skills, map LESSONS nominations to Cross-Wave Injection Log entries. This creates the audit trail from Nomination → Injection → Feedback.

**Purpose**: The injection log tracks which lessons were actually injected into which waves and their measured impact. Without this mapping, lessons exist in isolation — we can't prove the learning loop closes.

#### Nomination → Injection Mapping

```markdown
## Nomination → Injection Log ({YYYY-MM-DD})

| nomination_id | lesson_title | source_wave | injected_to_waves | injection_status | feedback_score |
|--------------|-------------|-------------|-------------------|------------------|----------------|
| L-101 | React useEffect Infinite Loop | Wave 3 | Wave 4, Wave 5 | Injected | 4 (significant quality improvement) |
| L-102 | Token Bucket Rate Limiter | Wave 2 | Wave 3 | Injected | 3 (clear efficiency gain) |
| L-103 | JWT Single-Flight Refresh | Wave 1 | Wave 2 | Injected | 5 (blocked major race condition) |
| L-104 | File Upload Order Preservation | Wave 4 | Wave 5 | Pending | — |
```

**Mapping Rules**:

1. **Nomination ID**: Use the L-XXX identifier from the LESSONS nomination
2. **Source Wave**: Which wave produced this nomination (from LESSONS metadata)
3. **Injected To Waves**: Which subsequent waves loaded this skill (tracked by Cross-Wave Injection step)
4. **Injection Status**: `Injected` (loaded) / `Pending` (not yet loaded) / `Expired` (no matching waves in 30 days)
5. **Feedback Score**: 1-5 rating from the receiving wave's execution agent

#### Injection Feedback Collection

After each wave that receives an injection:

```markdown
## Wave {N+1} Injection Feedback

**Received Injections**:
1. L-101 (React useEffect) → applied: Yes → impact: 4/5 → note: Prevented 2 race conditions
2. L-102 (Token Bucket) → applied: Yes → impact: 3/5 → note: Reduced API errors but needed tuning

**Unapplied Injections**:
1. L-103 (JWT Single-Flight) → reason: No auth tasks in this wave → will carry to next wave with auth tasks

**Injection Log Update**:
- L-101: Wave 4 → update injection log with feedback 4
- L-102: Wave 3 → update injection log with feedback 3
- L-103: mark as `Expired` (no auth tasks in waves 4-5)
```

#### Conversion Checklist

Before proceeding to Step 3 (Domain Skills Promotion):

- [ ] All `[NEW]` nominations have corresponding Injection Log entries
- [ ] All `[UPDATE]` nominations merged into existing Injection Log entries
- [ ] Expired nominations (no injection in 30 days) marked `Expired`
- [ ] Low-scoring injections (avg < 3 over ≥3 waves) flagged for review in Phase 8
- [ ] Injection Log written to `.specs/memory/injection-log.md`

**Injection Log Format**:

```markdown
# Cross-Wave Injection Log

> Maps LESSONS nominations to actual wave injections with feedback scores.
> Updated by Step 2.5 during learning workflow and reviewed in Phase 8.

## Active Injections

| ID | Title | Source Wave | Injected Waves | Avg Score | Status |
|----|-------|-------------|----------------|-----------|--------|
| L-101 | React useEffect Infinite Loop | Wave 3 | [4, 5] | 4.0 | Active |
| L-102 | Token Bucket Rate Limiter | Wave 2 | [3] | 3.0 | Active |

## Expired Injections

| ID | Title | Source Wave | Injected Waves | Last Used | Status |
|----|-------|-------------|----------------|-----------|--------|
| L-099 | Old Pattern | Wave 1 | [2] | 2024-01-15 | Expired (30+ days) |

## Pending Injections

| ID | Title | Source Wave | Expected Wave | Status |
|----|-------|-------------|---------------|--------|
| L-104 | File Upload Order | Wave 4 | ≥5 | Pending |
```

---

### Step 3: Domain Skills Promotion

**⚠️ MANDATORY**: Same pattern appearing ≥3 times across different waves → create/update domain skill.

#### Frequency Detection

```bash
# Count lesson occurrences by keyword
for keyword in "microservices" "rate-limiting" "auth-jwt"; do
  count=$(grep -ci "$keyword" .specs/memory/LESSONS.md || echo 0)
  wave_count=$(grep -l "$keyword" .specs/waves/*/SUMMARY.md | wc -l)
  
  if [ $count -ge 3 ] && [ $wave_count -ge 2 ]; then
    echo "✅ Promote '$keyword' to domain skill (freq=$count, waves=$wave_count)"
    PROMOTE_CANDIDATES+=($keyword)
  fi
done
```

#### Domain Skill Template

```markdown
# Domain Skill: {Skill Name}

**Frequency**: {N} projects / {M} waves  
**First Seen**: {YYYY-MM-DD}  
**Last Updated**: {YYYY-MM-DD}  
**Maturity**: {Emerging|Established|Deprecated}  

## Overview
{2-3 sentence summary of what this skill covers}

## When to Use
- {condition_1}
- {condition_2}
- {condition_3}

## When NOT to Use
- {anti-condition_1}
- {anti-condition_2}

## Best Practices

### 1. {Practice Title}
{description with rationale}

**Example**:
```{language}
{code_example_or_configuration}
```

### 2. {Another Practice Title}
...

## Common Pitfalls

### Pitfall 1: {Pitfall Name}
**Symptom**: {what goes wrong}  
**Cause**: {why it happens}  
**Mitigation**: {how to avoid or fix}  

## Recommended Agents for Discussion
- **{Agent_Name}** ({mandatory|recommended}): {reason}
- **{Agent_Name}** ({mandatory|recommended}): {reason}

## Reference Implementations
- Project A ({date}): {brief description, outcome}
- Project B ({date}): {brief description, outcome}

## Related Lessons
- L-XXX [CATEGORY] {lesson_title}
- L-YYY [CATEGORY] {lesson_title}

## Evolution History
- v1.0 ({date}): Initial skill created from {project} experience
- v1.1 ({date}): Added {improvement} based on {project} feedback
- v2.0 ({date}): Major revision after {event}
```

#### Promotion Decision Tree

```yaml
promotion_rules:
  # Auto-create domain skill
  if pattern_frequency >= 3 AND wave_count >= 2:
    action: create domain-skill/{domain}.md
    maturity: Emerging
  
  # Upgrade maturity level
  if pattern_frequency >= 5 AND wave_count >= 3:
    action: update maturity to Established
  
  # Update existing domain skill
  if new_observation in existing_skill.scenarios:
    action: update with new evidence
    increment version
  
  # Deprecate (rare)
  if old_skill.success_rate < 50% across latest_5_waves:
    action: mark deprecated with reason
    move to domain-skills/deprecated/
```

**Output format**:
```markdown
## Domain Skills Promotion Report

**Promoted to Emerging**:
- microservices-adoption.md (frequency: 4 waves, first seen: 2024-01-10)

**Upgraded to Established**:
- rate-limiting.md (frequency: 7 waves, upgraded from Emerging)

**Updated with New Evidence**:
- auth-jwt.md (added Wave 5 single-flight refresh pattern)

**Total Domain Skills**: {count} (Emerging: {n}, Established: {m}, Deprecated: {k})
```

---

### Step 4: Cross-Wave Injection

**⚠️ MANDATORY**: Wave N+1 Execution Agent initialization automatically loads matching domain skills.

#### Injection Flow

```
Wave N+1 Execution Agent Initialization
    │
    ├─→ Read all domain-skills/ metadata (.yaml frontmatter only)
    │   (avoid loading full content unless matched)
    │
    ├─→ Match current task keywords → trigger_patterns
    │   (max ≤5 skills, max ~200K tokens total)
    │
    ├─→ Build Execution Agent context:
    │   - Wave N+1 task list + dependency graph
    │   - Wave N SUMMARY (previous wave results)
    │   - Matched domain-skill full content
    │   - LearningFlow nomination summary
    │
    └─→ Output: "LearningFlow injected: {skill-name} → {reason}"
```

#### Matching Algorithm

```bash
# Extract task keywords
TASK_KEYWORDS=$(grep -oP '\b(auth|rate-limit|jwt|microservice)\b' task-spec.md | sort -u)

# Match against domain skill trigger patterns
for skill in .specs/memory/domain-skills/*.md; do
  TRIGGER_PATTERN=$(grep "^trigger_pattern:" $skill | cut -d':' -f2-)
  
  if echo "$TASK_KEYWORDS" | grep -qiE "$TRIGGER_PATTERN"; then
    echo "✅ Match: $(basename $skill) → trigger matched"
    MATCHED_SKILLS+=($skill)
  fi
done

# Limit to top 5 by relevance score
MATCHED_SKILLS=$(echo "${MATCHED_SKILLS[@]}" | tr ' ' '\n' | head -5)
```

#### Injection Output Example

```markdown
🧠 LearningFlow Injected (Wave 3):

**Matched Skills**:
1. auth.md/JWT-Single-Flight-Refresh → trigger matched: "auth-service task"
   - Relevance: 95% (exact keyword match)
   - Content: 2.1K tokens
   
2. file-upload.md/Multi-File-Order-Preservation → trigger matched: "bulk-upload task"
   - Relevance: 87% (partial keyword match)
   - Content: 1.8K tokens

**Total Injected**: 2 skills, ~3.9K tokens  
**Context Budget**: 200K tokens (1.95% used)  

**Next Steps**: Execution Agent will apply these patterns during implementation.
```

#### Feedback Tracking (Cross-Wave Injection Loop Closure)

After injecting skills into subsequent waves, log usage outcomes to create a measurable feedback loop:

```markdown
## Cross-Wave Injection Log ({YYYY-MM-DD})

| injected_skill | wave_from | wave_to | success:bool | impact_score:1-5 | notes |
|----------------|-----------|---------|--------------|-------------------|-------|
| auth.md/JWT-Single-Flight-Refresh | Wave 2 | Wave 3 | true | 5 | Reduced refresh race conditions to zero |
| file-upload.md/Multi-File-Order | Wave 1 | Wave 3 | false | 2 | Order preserved but batch size limit hit |
```

**Scoring rubric**: impact_score maps directly to business outcome:
- 1-2: Minor improvement, mostly cosmetic
- 3: Clear efficiency gain, no regression
- 4: Significant quality or velocity improvement
- 5: Blocker prevented or major bug avoided

**Review cadence**: Every Phase 8 Archive cycle, scan injection logs to identify skills with avg impact < 3 and demote to [NEEDS REVISION].

**Token budget enforcement**:
- Max 5 skills per wave
- Max 200K tokens total (including task specs)
- If overflow → inject metadata only (skill name + link), load full content on-demand

---

### Step 5: Phase Transition Graduation

**⚠️ MANDATORY**: Phase transitions (Phase N → Phase N+1) trigger graduation clustering scan. This is not optional — it's the final loop of LearningWorkflow.

#### Graduation Process

```
Phase N Complete → graduation_scan() [post-phase hook]
    │
    ├─→ Collect LEARNINGS.md from last 3 phases (N = 3 fixed; graduated patterns scanned only after completing at least 3 waves)
    │
    ├─→ Jaccard Similarity Clustering (threshold=0.25)
    │     Note: Jaccard threshold = 0.25 chosen to allow partial overlap between skills
    │     (e.g., 'error handling in auth' and 'error handling in API' share 25% term overlap).
    │     Lower thresholds (0.1) cause over-clustering; higher (0.5) causes under-merging
    │     of related patterns.
    │   - Group similar lessons by semantic similarity
    │   - Identify cross-phase patterns
    │
    ├─→ Filter: distinct phases ≥ graduation_threshold (default: 2)
    │
    ├─→ HITL Confirmation: P/D/X/A interaction
    │   - P (Promote): Elevate to PROJECT.md / PATTERNS.md
    │   - D (Defer): Keep in STATE.md backlog for re-evaluation
    │   - X (Dismiss): Permanently skip (not valuable)
    │   - A (Ask): Request clarification from user
    │
    └─→ Results:
        ├── Promoted → PROJECT.md / PATTERNS.md (Durable Fact)
        ├── Deferred → STATE.md graduation_backlog (Temporary)
        └── Dismissed → STATE.md graduation_backlog (permanent skip)
```

#### Integration with Step 0 Classification

| Graduation Output | Step 0 Category | Storage Location |
|-------------------|----------------|------------------|
| Promoted to PROJECT.md/PATTERNS.md | DURABLE | Project-level persistent knowledge |
| Deferred in STATE.md backlog | TEMPORARY | Re-evaluated next scan |
| Dismissed | TEMPORARY | Permanently skipped |

**Clustering example**:

```bash
# Calculate Jaccard similarity between lessons
python3 scripts/cluster-lessons.py \
  --input .specs/memory/LESSONS.md \
  --threshold 0.25 \
  --output /tmp/clusters.json

# Output:
# Cluster 1: ["L-042", "L-038", "L-029"] — microservices pattern (similarity: 0.67)
# Cluster 2: ["L-043", "L-021"] — React hooks pattern (similarity: 0.42)
```

**HITL Interaction**:

```markdown
## Graduation Candidates

**Cluster 1: Microservices Adoption Pattern**
- Lessons: L-042, L-038, L-029
- Distinct Phases: 3 (Phase 2, 4, 6)
- Similarity Score: 0.67

**Action Required**:
[P] Promote to PROJECT.md (becomes durable project pattern)
[D] Defer to backlog (re-evaluate next phase)
[X] Dismiss (not valuable enough)
[A] Ask for clarification

Your choice: _
```

### Domain Skill Compilation Token Cost Budget Check

Before promoting lessons to domain skills in Steps 5-6, estimate compilation token cost:

1. **Input size estimation**: Count total tokens from all candidate lessons (roughly: word_count / 0.75 for English, or character_count / 1.5 for Chinese)
2. **Clustering cost**: Jaccard similarity calculation on N lessons ≈ N * avg_lesson_tokens tokens
3. **Total budget limit**: ≤50K tokens per graduation scan (10% of ~200K agent budget)

**Budget enforcement logic**:
```bash
# Budget check before graduation processing
TOTAL_CANDIDATE_TOKENS=$(wc -c .specs/memory/LESSONS.md 2>/dev/null | awk '{print $1}' || echo 0)
MAX_ALLOWED=$((50 * 1024))  # 50K tokens ≈ 50K * ~1.3 chars per token

if [ "$TOTAL_CANDIDATE_TOKENS" -gt "$MAX_ALLOWED" ]; then
    echo "⚠️ Lesson corpus too large ($TOTAL_CANDIDATE_TOKENS bytes), processing max 50K tokens worth"
    # Take only most recent lessons to stay within budget
    tail -c $MAX_ALLOWED .specs/memory/LESSONS.md > /tmp/lessons-truncated.md
fi

# After clustering, check output size
DOMAIN_SKILL_SIZE=$(wc -c domain-skills/{domain}/_SKILL.md 2>/dev/null | awk '{print $1}' || echo 0)
if [ "$DOMAIN_SKILL_SIZE" -gt 30720 ]; then  # 30K tokens ~ 30K * ~1.3 bytes
    echo "⚠️ Generated domain skill exceeds 30K token budget, truncating to core patterns only"
    # Keep only bullet points and actionable items, remove verbose examples
fi
```

**Overflow behavior**:
- If total cost >50K tokens: process only most recent N lessons that fit within budget, skip older ones with note "[SKIPPED — token budget limit]"
- If individual domain skill >30K tokens: truncate to core patterns only, add comment "Truncated from X tokens (budget: 30K)"
- Log compilation cost in heartbeat.log: `graduation_cost_tokens: {estimated}`

**Why this matters**: Without budget tracking, a large project with 100+ waves and hundreds of lessons could spend 200K+ tokens just on graduation, leaving nothing for actual execution agents. Budget caps ensure LearningWorkflow remains fraction of total workflow cost.

---

## Error Handling

### Common Issues and Fixes

**Issue 1: Duplicate Lesson Numbers**

- **Symptom**: Two lessons with same L-XXX number
- **Cause**: Concurrent extraction or manual editing error
- **Fix**:
  1. Find max number: `grep -oP 'L-\d+' LESSONS.md | sort -t'-' -k2 -n | tail -1`
  2. Renumber duplicates sequentially from max+1
  3. Update all cross-references (grep for old number)
- **Prevention**: Use atomic append operation, never edit manually

**Issue 2: Lesson Without Clear Root Cause**

- **Symptom**: Lesson describes symptom but not underlying cause
- **Cause**: Extracted too early, before debugging complete
- **Fix**:
  1. Flag as [INCOMPLETE] in title
  2. Link to investigation ticket
  3. Revisit after root cause analysis (RCA) complete
- **Prevention**: Wait until fix confirmed before extracting lesson

**Issue 3: Domain Skill Premature Promotion**

- **Symptom**: Skill promoted after 2 occurrences, fails on 3rd project
- **Cause**: Pattern not yet proven generalizable
- **Fix**:
  1. Demote back to lessons
  2. Add "[EXPERIMENTAL]" tag
  3. Require 5 occurrences before re-promotion
- **Prevention**: Enforce strict ≥3 threshold, prefer conservative promotion

**Issue 4: Cross-Wave Injection Token Overflow**

- **Symptom**: Execution Agent context exceeds 200K tokens
- **Cause**: Too many domain skills matched (>5) or skills too large
- **Fix**:
  1. Reduce matched skills from 5 to 3
  2. Inject metadata only (skill name + link), load full content on-demand
  3. Compress skill content using distillator if available
- **Prevention**: Monitor token count, enforce hard limit at 180K (90% of budget)

**Issue 5: Graduation Clustering False Positives**

- **Symptom**: Unrelated lessons clustered together due to keyword overlap
- **Cause**: Jaccard similarity too sensitive to common words
- **Fix**:
  1. Increase threshold from 0.25 to 0.35
  2. Use TF-IDF weighting instead of raw word counts
  3. Manual review before promoting clusters
- **Prevention**: Pre-filter common stopwords, use semantic embeddings if available

---

### Graduation Write-Fail Recovery Protocol

When domain-skill directory write fails during Step 5-6 graduation:

1. **First attempt**: Retry with 1s backoff — `mkdir -p domains/ && cp /tmp/{id}.md domains/{id}/_SKILL.md`
2. **Second attempt**: If first fails, retry with 2s backoff (filesystem may be syncing)
3. **Third attempt**: If second fails, retry with 4s backoff (disk I/O contention)
4. **Fallback**: If all 3 retries fail, write to `/tmp/learning-workflow-{timestamp}.md` and emit warning: "⚠️ Domain skill graduation failed after 3 retries — output to temp dir for manual copy"
5. **Notification**: Update `.specs/waves/current/heartbeat.log` with graduation-fail entry including retry count and fallback path

**Root Cause Analysis**: After write-fail, determine why:
- Permission denied → `chmod` directory ownership fix
- Disk full → cleanup old domain skills or request storage increase
- File in use → wait 1s and retry (file handle held by another process)

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Workflow Impact |
|-------|------|------------|--------|-----------------|
| **P0** | BLOCKING | Domain skill promotion creates contradictory best practice (conflicts with existing domain skill ≥2yrs old) | Halt graduation, flag for manual review by Orchestrator with side-by-side comparison | Learning pipeline blocked until conflict resolved |
| **P1** | RECOVERABLE | LESSONS.md write fails OR domain-skill directory permission denied | See Graduation Write-Fail Recovery Protocol below (3 retries with 1s→2s→4s backoff) | Knowledge not persisted — cross-session learning loss |
| **P2** | WARNING | Pattern appears 2-3 times (below ≥3 graduation threshold) | Mark as `[NEEDS MORE DATA]` in domain-skill draft, don't promote to full domain-skill yet | Graduation deferred until pattern frequency confirmed ≥3 times |
| **P2** | DOMAIN_WRITE_FAIL | Domain skill directory write fail during graduation Step 5-6 | 1s→2s→4s backoff, max 3 retries | Write to /tmp/{timestamp}.md + heartbeat.log notification |
| **P3** | INFO | Temporary note written but no cross-session value | Log info message, no action needed — normal for first-time requirements | No impact on learning completeness |

**Severity Assignment Rules**:
- Default to P1 for any file write failure (LESSONS.md or domain-skill)
- Escalate from P2→P0 only when new domain skill directly contradicts existing ≥3yr-old practice
- Never demote: once P0 assigned, requires manual Orchestrator override to resume graduation

**Retry Chain (RECOVERABLE failures)**: For LESSONS.md write fails, use 1s→2s→4s backoff chain per Graduation Write-Fail Recovery Protocol above. For other recoverable failures: exponential backoff starting at 3s, second at 7s (with 2s jitter), max 3 retries. If all retries exhausted and skill still not recovered, escalate to P0 and create incident ticket.

**Deduplication Protocol**: When extracting lessons across waves, merge entries with same root cause into single `[UPDATE]` entry with list of wave sources (e.g., "[UPDATED by Wave 1 + Wave 3]").

### Domain Skill Graduation Criteria

| Criterion | Requirement | Verification |
|-----------|-------------|--------------|
| Pattern frequency | ≥3 occurrences across different waves/requirements | Count entries in LESSONS.md matching domain trigger_patterns |
| Cross-project relevance | Applicable to ≥2 different requirements/projects | Manual review or semantic similarity check (cosine similarity >0.7) |
| Stability over time | No contradicting examples in 60 days | Check reverse_matches in lessons, reject if contradiction_rate >10% |
| Implementation completeness | Contains trigger_patterns + best_practices + implementation example | Schema validation against domain-skill SKILL.md template |

**Graduation Failure Handling**: If any criterion fails:
- Freq <3 → `[NEEDS MORE DATA]` draft, wait for more occurrences
- Cross-project <2 → Keep as temporary note in TEMPORARY.md only
- Stability <60 days → Add to domain-skill with `[RECENT: verify after 60 days]` marker
- Incomplete → Create draft with placeholder sections, prompt user to fill gaps

---

## Boundary Conditions

### When to Escalate Immediately

**Skip learning extraction, escalate to Orchestrator if**:
- Lessons reveal systemic organizational issues (process failures, skill gaps)
- >50% of lessons are FAILURE type (indicates fundamental planning problem)
- Domain skill conflicts detected (contradictory best practices)
- Graduation clustering identifies security vulnerability affecting multiple projects

### When to Skip LearningWorkflow

**Don't extract lessons if**:
- Wave has no execution logs (pure planning phase)
- All tasks trivial CRUD operations with no novel patterns
- Team explicitly requests "no documentation" (fast prototype mode)
- First wave of new project (insufficient data for meaningful patterns)

### Edge Cases

**Multi-Project Concurrent Development**:

- Maintain separate memory per project (`project-a/.specs/memory/`, `project-b/.specs/memory/`)
- Cross-reference via shared domain skills (symlink or copy)
- Merge lessons only after both projects complete

**Legacy Code Integration**:

- Extract lessons applicable to internal projects
- Respect upstream project's license (don't copy proprietary code)
- Contribute improvements back if allowed (documentation, bug fixes)

**Regulated Industry (Healthcare, Finance)**:

- Anonymize sensitive data before archiving (remove patient IDs, account numbers)
- Encrypt domain skills directory (AES-256)
- Restrict access via role-based permissions
- Audit trail: Log who accessed which lessons when

**Team Turnover**:

- Export critical domain skills to portable format (PDF, printed handbook)
- Conduct knowledge transfer sessions before member departure
- Record video walkthroughs of complex architectures
- Update onboarding docs with latest lessons

---

## Output Template

### Standard Lesson Entry

```markdown
## L-XXX [{CATEGORY}] {Title}

> {1-2 sentence description}

**Context**: {when/where this occurred}  
**Root Cause**: {underlying reason, not just symptom}  
**Impact**: {what broke or what improved}  
**Solution**: {how it was resolved}  

**Applicability**: {who else might encounter this}  
**Severity**: {LOW|MEDIUM|HIGH|CRITICAL}  
**Confidence**: {HIGH|MEDIUM|LOW}  
**Extracted From**: {source file, wave, task}  
**Date**: {YYYY-MM-DD}  

**Prevention**:
- {prevention_step_1}
- {prevention_step_2}

**Related Lessons**:
- L-YYY [CATEGORY] Related topic
- L-ZZZ [CATEGORY] Another related topic

**References**:
- [Link to dev-log entry](link)
- [Link to GitHub issue](link)
```

### Standard Domain Skill

```markdown
# Domain Skill: {Skill Name}

**Frequency**: {N} projects / {M} waves  
**First Seen**: {YYYY-MM-DD}  
**Last Updated**: {YYYY-MM-DD}  
**Maturity**: {Emerging|Established|Deprecated}  

## Overview
{2-3 sentence summary}

## When to Use
- {condition_1}
- {condition_2}

## When NOT to Use
- {anti-condition_1}
- {anti-condition_2}

## Best Practices

### 1. {Practice Title}
{description}

**Example**:
```{language}
{code_example}
```

## Common Pitfalls

### Pitfall 1: {Name}
**Symptom**: {what goes wrong}  
**Cause**: {why}  
**Mitigation**: {how to fix}  

## Related Lessons
- L-XXX [CATEGORY] {title}

## Evolution History
- v1.0 ({date}): Initial creation
- v1.1 ({date}): Updated with {improvement}
```

### Cross-Wave Injection Report

```markdown
🧠 LearningFlow Injected (Wave {N}):

**Matched Skills**:
1. {skill-name} → trigger matched: "{reason}"
   - Relevance: {percentage}%
   - Content: {tokens} tokens

**Total Injected**: {count} skills, ~{total_tokens}K tokens  
**Context Budget**: 200K tokens ({percentage}% used)
```

### Graduation Clustering Report

```markdown
## Graduation Clustering Results

**Clusters Identified**: {count}

### Cluster 1: {Pattern Name}
- Lessons: {L-XXX, L-YYY, L-ZZZ}
- Distinct Phases: {count}
- Similarity Score: {score}

**HITL Decision**: {P/D/X/A}  
**Outcome**: {promoted/deferred/dismissed}
```

---

## Tool Integration

### Required Tools

**File System Operations**:
```bash
# Create directory structure
mkdir -p .specs/memory/{lessons,domain-skills}

# Atomic append (prevent duplicates)
echo "{new_entry}" >> .specs/memory/LESSONS.md

# Find max lesson number
grep -oP 'L-\d+' .specs/memory/LESSONS.md | sort -t'-' -k2 -n | tail -1
```

**Text Processing**:
```bash
# Extract lessons by category
grep "^\[FAILURE\]" .specs/memory/LESSONS.md

# Count occurrences for domain skill promotion
grep -c "microservices" .specs/memory/LESSONS.md

# Build keyword index
grep -oP '(?<=Applicability: ).*' .specs/memory/LESSONS.md | tr ',' '\n' | sort -u
```

**Clustering** (optional):
```bash
# Jaccard similarity clustering
python3 scripts/cluster-lessons.py \
  --input .specs/memory/LESSONS.md \
  --threshold 0.25 \
  --output /tmp/clusters.json
```

### Optional Tools

**Distillator Compression**:
```bash
# Compress large domain skills
distillator compress domain-skill/large-skill.md --output compressed.md

# Verify information preservation
distillator verify original.md compressed.md
```

**Semantic Embeddings** (advanced):
```bash
# Generate embeddings for better clustering
python3 scripts/generate-embeddings.py \
  --input .specs/memory/LESSONS.md \
  --model all-MiniLM-L6-v2 \
  --output /tmp/embeddings.npy
```

**Automated Indexing**:
```bash
# Rebuild keyword index on Git commit (pre-commit hook)
#!/bin/bash
grep -oP '(?<=Applicability: ).*' .specs/memory/LESSONS.md | \
  tr ',' '\n' | sort -u | \
  jq -R -s 'split("\n") | map(select(length > 0)) | map({(.): []}) | add' > \
  .specs/memory/KEYWORD_INDEX.json
```

---

## Implementation Checklist

Before extraction:
- [ ] Memory directory structure verified (.specs/memory/)
- [ ] Required files exist (LESSONS.md, domain-skills/)
- [ ] Current max lesson number identified
- [ ] Source materials collected (dev-log, wave summaries, reviews)

During extraction:
- [ ] All tasks in wave scanned
- [ ] Lessons classified correctly (FAILURE/SUCCESS/INSIGHT/PATTERN)
- [ ] Each lesson has root cause (not just symptom)
- [ ] Numbering sequential (no gaps, no duplicates)
- [ ] Cross-references updated (related lessons linked)
- [ ] Confidence and severity rated appropriately

After extraction:
- [ ] Domain skills promoted only if frequency ≥3
- [ ] Cross-wave injection completed (matched skills loaded)
- [ ] Graduation clustering executed (if phase transition)
- [ ] Keyword index rebuilt
- [ ] Token budget enforced (<200K for Execution Agent)

Quality gates:
- [ ] No duplicate lesson numbers
- [ ] All lessons have clear root cause
- [ ] Domain skills include best practices AND pitfalls
- [ ] Cross-wave injection within token budget
- [ ] Graduation HITL decisions recorded
- [ ] Output matches standard templates

---

## Anti-Patterns to Avoid

❌ **Rewriting History**: Modifying past lessons to reflect new understanding  
✅ **Fix**: Append new lesson that supersedes old one, link both

❌ **Premature Promotion**: Creating domain skill after 1-2 occurrences  
✅ **Fix**: Enforce ≥3 threshold, label as [EXPERIMENTAL] if eager

❌ **Orphaned Knowledge**: Lessons not indexed or searchable  
✅ **Fix**: Mandatory keyword extraction, automated index rebuild

❌ **Information Loss**: Compression removes critical details  
✅ **Fix**: Verify 100% preservation, skip compression if verification fails

❌ **Over-Documentation**: Capturing trivial details cluttering memory  
✅ **Fix**: Filter for signal-to-noise ratio, skip <5 LOC changes

❌ **Ignoring Failures**: Only documenting successes  
✅ **Fix**: Failure lessons often more valuable — extract aggressively

---

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added 5-step extraction workflow (classification → extraction → lessons → domain skills → injection → graduation)
  - Implemented strict numbering system (L-XXX incremental)
  - Defined domain skill promotion criteria (frequency ≥3)
  - Added comprehensive error handling (5 common issues)
  - Integrated Jaccard similarity clustering for graduation

- **v1.0** (2024-01-10): Initial implementation based on SEP LearningWorkflow + SuperCorp ARCHIVE-PROMPT
  - Basic lesson extraction
  - Simple domain skill creation
  - No graduation clustering
  - Manual numbering (error-prone)
