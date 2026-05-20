---
name: phase-8-memory-keeper
preamble-tier: 2
version: 3.0-draft
layer: L1-INTERACTION
phase: 8
parent: phase-8-archive
gate: G8
requires: [g7.5-gate-decision, wave-summaries]
provides: [lessons-md, domain-skills-updated, archive-complete]
description: |
  Knowledge distillation and archival specialist for Phase 8 Archive.
  Systematically captures, organizes, and preserves project knowledge for cross-session reuse. (devflow-evo)
---

# Memory Keeper — Knowledge Distillation & Archival

Systematically capture, organize, and preserve project knowledge for cross-session reuse. Transform raw execution data into structured lessons, domain skills, and decision records.

**Core philosophy**: Every project teaches something. Capture it before it's lost. Make knowledge searchable, actionable, and evolving.

---

## Preamble

### Key Principles

1. **Immutable History**: Never delete or modify existing entries — only append new insights (append-only log)
2. **Structured Extraction**: Convert unstructured dev-logs and reviews into standardized formats (L-XXX numbering, categories, applicability)
3. **Progressive Refinement**: Raw observations → Lessons → Domain Skills → Best Practices (evolution pipeline)
4. **Searchability First**: All entries must be retrievable via keyword search — no orphaned knowledge

### When to Activate

**Automatic triggers** (Phase 8):
- Wave completion with failures or unexpected issues
- Phase 6 Review identifies recurring patterns
- Project milestone reached (MVP launch, major refactor complete)
- User explicitly requests "archive" or "/memory"

**Manual trigger**:
```
/memory extract --from <dev-log|review|discussion>
```

**When NOT to use**:
- Trivial changes (<5 LOC, no architectural impact)
- Purely cosmetic updates (text, styling)
- Already documented decisions with no new learnings

---

## Step-by-step Workflow

### Step 0: Initialize Memory System

**Verify memory directory structure**:

```bash
# Check if .specs/memory/ exists
test -d .specs/memory || mkdir -p .specs/memory/{lessons,domain-skills,decisions}

# Verify required files exist
for file in LESSONS.md DECISIONS.md KNOWN_FAILURES.md; do
  test -f .specs/memory/$file || touch .specs/memory/$file
done

# Check numbering sequence (find highest L-XXX)
grep -oP 'L-\d+' .specs/memory/LESSONS.md | sort -t'-' -k2 -n | tail -1
```

**Output format**:
```markdown
## Memory System Initialized

**Directory**: `.specs/memory/`  
**Files**:
- ✅ LESSONS.md (current max: L-042)
- ✅ DECISIONS.md (12 entries)
- ✅ KNOWN_FAILURES.md (7 entries)
- ✅ domain-skills/ (3 skills)

Ready to extract and archive knowledge. Please specify source material.
```

---

### Step 1: Extract Lessons from Execution Data

**Source materials** (in priority order):
1. **dev-log.md** — Developer's real-time notes during implementation
2. **review-findings.md** — Phase 6 review results (Blind Hunter, Edge Case Hunter, Acceptance Auditor)
3. **wave-summary.md** — Per-wave execution results and issues
4. **party-mode-transcripts.md** — Decision discussions with dissenting opinions

**Extraction protocol**:

For each source file:

```bash
# Extract failure patterns
grep -A3 "FAIL\|ERROR\|BUG" dev-log.md | head -40

# Extract success patterns
grep -A3 "SUCCESS\|WORKED\|SOLVED" dev-log.md | head -40

# Extract insights
grep -A2 "NOTE\|INSIGHT\|LEARNED" dev-log.md | head -40
```

**Classification framework**:

| Category | Trigger | Example |
|----------|---------|---------|
| **FAILURE** | Bug, crash, incorrect behavior | "State update caused infinite re-render" |
| **SUCCESS** | Effective solution, best practice | "Zustand simplified state management vs Redux" |
| **INSIGHT** | New understanding, counterintuitive finding | "Smaller components harder to debug than monolithic" |
| **PATTERN** | Reusable approach, template | "Use custom hooks for API calls with caching" |

**Numbering rules**:
- Format: `L-XXX` (3-digit zero-padded)
- Incremental only (never reuse numbers)
- Find current max: `grep -oP 'L-\d+' LESSONS.md | sort -t'-' -k2 -n | tail -1`
- Next number = max + 1

**Output format** (per lesson):
```markdown
### L-043 [FAILURE] React useEffect Infinite Loop

> Missing dependency in useEffect causes stale closure and infinite re-renders.

**Context**: UserProfile component fetching user data on mount  
**Root Cause**: `useEffect(() => { fetchUser(userId); }, [])` — userId not in dependency array  
**Impact**: Browser freeze, CPU spike to 100%, app unresponsive  
**Fix**: Add userId to deps: `useEffect(() => { fetchUser(userId); }, [userId])`  

**Applicability**: Any React component using useEffect with external variables  
**Severity**: HIGH (app-breaking bug)  
**Extracted From**: dev-log.md (Wave 3, Task: user-profile-component)  
**Date**: 2024-03-15  

**Prevention**:
- Enable eslint-plugin-react-hooks (auto-detects missing deps)
- Code review checklist: "All useEffect deps listed?"
- Unit test: Verify effect runs correct number of times

**Related Lessons**:
- L-021 [PATTERN] Custom Hook for Data Fetching
- L-035 [INSIGHT] Dependency Array Mental Model
```

**Verification checklist**:
- [ ] Lesson has clear title with category tag
- [ ] Description is 1-2 sentences (concise)
- [ ] Context explains when/where issue occurred
- [ ] Root cause identified (not just symptom)
- [ ] Fix or mitigation provided
- [ ] Applicability defined (who else might encounter this)
- [ ] Severity rated (LOW/MEDIUM/HIGH/CRITICAL)
- [ ] Source traced (which wave/task/dev-log entry)
- [ ] Related lessons linked (if any)

---

### Step 2: Update Decision Records

**Extract decisions from**:
- Phase 1b Discuss output (technical选型确认)
- PartyMode consensus results (multi-agent debates)
- Architect's final call (when escalated)

**Decision record template**:

```markdown
## [2024-03-15] Microservices Adoption Strategy

**Category**: Technical Architecture  
**Participants**: Architect, Security-Auditor, Performance-Auditor  
**Outcome**: Phased adoption (auth + payments first)  
**Confidence**: 7.8/10  

### Context
Monolith hitting scaling limits at 10K concurrent users. Need horizontal scaling for hot paths while managing team capacity.

### Decision Rationale
- Phased approach reduces risk
- Focus on highest-impact services first
- Allows team to learn gradually

### Alternatives Considered
1. **Full microservices now**: Rejected due to team inexperience and operational complexity
2. **Stay monolith**: Rejected due to scaling constraints and single point of failure
3. **Serverless functions**: Rejected due to cold start latency and vendor lock-in concerns

### Dissenting Opinions
**Security-Auditor** (conditional support):
- Concern: Service-to-service auth adds attack surface
- Requirement: Implement mTLS before deployment
- Mitigation: Use Istio service mesh with automatic mutual TLS

### Implementation Plan
- Week 1-2: Evaluate service mesh options (Istio vs Linkerd)
- Week 3-4: Prototype auth service in isolation
- Week 5-6: Migrate payment service
- Week 7-8: Team training on distributed tracing

### Success Metrics
- P99 latency <200ms for auth service
- Zero downtime during migration
- Team confidence score >7/10 post-training

### Review Date
Revisit in 3 months (2024-06-15) or when user base reaches 20K

### Related Decisions
- [2024-01-15] API Gateway Selection (Linkerd chosen)
- [2024-02-01] Observability Stack (Prometheus + Grafana)

### Status
✅ Implemented (as of 2024-04-01)  
⚠️ Monitoring: Service mesh CPU overhead higher than expected (15% vs 10% estimated)
```

**Update protocol**:

```bash
# Append new decision
cat >> .specs/memory/DECISIONS.md <<EOF
## [$(date +%Y-%m-%d)] {decision_title}
...
EOF

# Cross-reference related decisions
grep -n "{related_topic}" .specs/memory/DECISIONS.md

# Update STATUS field if decision implemented/reviewed
sed -i 's/Status: Planned/Status: ✅ Implemented/' .specs/memory/DECISIONS.md
```

**Verification checklist**:
- [ ] Decision has clear date stamp
- [ ] Participants listed (who was involved)
- [ ] Outcome stated unambiguously
- [ ] Rationale explained (why this choice)
- [ ] Alternatives documented (what was rejected and why)
- [ ] Dissenting opinions captured verbatim
- [ ] Implementation plan with timeline
- [ ] Success metrics defined (how we'll know it worked)
- [ ] Review date set (when to reassess)
- [ ] Related decisions linked
- [ ] Status tracked (Planned → In Progress → Implemented → Reviewed)

---

### Step 3: Promote Domain Skills

**Trigger condition**: Same pattern appears ≥3 times across projects or waves.

**Detection process**:

```bash
# Count lesson occurrences by keyword
grep -c "microservices\|service mesh" .specs/memory/LESSONS.md
grep -c "React.*useEffect\|dependency array" .specs/memory/LESSONS.md
grep -c "TDD\|test-first" .specs/memory/LESSONS.md

# If count >= 3 → promote to domain skill
```

**Domain skill template**:

```markdown
# Domain Skill: Microservices Adoption

**Frequency**: Used in 4 projects  
**First Seen**: 2023-11-10  
**Last Updated**: 2024-03-15  
**Maturity**: Established (≥3 successful implementations)  

## Overview
Phased approach to migrating monolith to microservices, focusing on hot paths first while managing team learning curve.

## When to Use
- Monolith hitting scaling limits (>10K concurrent users)
- Team has basic distributed systems knowledge
- Budget allows for infrastructure investment (service mesh, observability)
- Timeline permits 2-3 month migration

## When NOT to Use
- Small team (<3 developers) without DevOps support
- Project in early MVP phase (premature optimization)
- Tight deadline (<1 month to launch)
- No clear service boundaries identified

## Best Practices

### 1. Start with Hot Paths Only
Identify highest-traffic services (auth, payments, notifications) and migrate those first. Leave low-traffic features in monolith initially.

**Rationale**: Maximum impact with minimum complexity. Team learns on critical path but risk contained.

### 2. Implement Service Mesh Before First Service Goes Live
Deploy Istio or Linkerd before extracting any service. Don't retrofit later.

**Rationale**: Service-to-service communication needs mTLS, observability, circuit breakers from Day 1. Retrofitting is painful.

### 3. Allocate 20% Budget for Team Training
Distributed systems require new mental models (eventual consistency, distributed tracing, circuit breakers).

**Rationale**: Under-trained teams make costly mistakes (data inconsistency, cascading failures).

### 4. Plan 2-Week POC for Infrastructure Evaluation
Test service mesh, observability stack, deployment pipeline in isolation before committing.

**Rationale**: Infrastructure choices are hard to reverse. POC prevents costly mid-migration pivots.

## Common Pitfalls

### Pitfall 1: Underestimating Operational Complexity
**Symptom**: Deployment time increases from 5min to 45min, debugging becomes nightmare  
**Cause**: Distributed tracing not set up, logs scattered across services  
**Mitigation**: Centralized logging (ELK stack), distributed tracing (Jaeger), health dashboards (Grafana)  

### Pitfall 2: Skipping Security Review Until Too Late
**Symptom**: Service-to-service auth added as afterthought, requires massive refactor  
**Cause**: Security-Auditor not involved in architecture phase  
**Mitigation**: Include Security-Auditor in Phase 1b Discuss, implement mTLS from start  

### Pitfall 3: Not Budgeting for Observability Tooling
**Symptom**: Can't debug production issues, blind to performance bottlenecks  
**Cause**: Assumed "we'll add monitoring later"  
**Mitigation**: Observability is mandatory, not optional. Budget for Prometheus + Grafana + Jaeger upfront.  

## Recommended Agents for Discussion
- **Architect** (mandatory): Service boundary definition, technology selection
- **Security-Auditor** (mandatory): Threat modeling, mTLS requirements
- **Performance-Auditor** (recommended): Latency impact, resource usage
- **SRE** (if available): Operational readiness, incident response planning

## Reference Implementations
- Project A (2023-11): E-commerce platform, 3 services migrated, P99 latency <150ms
- Project B (2024-01): SaaS analytics, 5 services migrated, zero downtime
- Project C (2024-03): Payment gateway, 2 services migrated, ongoing

## Related Lessons
- L-042 [FAILURE] Service Mesh CPU Overhead (15% vs 10% estimated)
- L-038 [SUCCESS] Canary Deployment for Service Migration
- L-029 [INSIGHT] Team Learning Curve Steeper Than Expected

## Evolution History
- v1.0 (2023-11): Initial skill created from Project A experience
- v1.1 (2024-01): Added budget guidance (20% training) from Project B
- v2.0 (2024-03): Updated pitfalls based on Project C security issues
```

**Promotion workflow**:

```bash
# Create new domain skill file
cat > .specs/memory/domain-skills/microservices-adoption.md <<EOF
# Domain Skill: Microservices Adoption
...
EOF

# Update LESSONS.md to reference domain skill
sed -i 's/L-042 \[FAILURE\]/L-042 [FAILURE] (see Domain Skill: Microservices Adoption)/' .specs/memory/LESSONS.md

# Log promotion event
echo "- $(date +%Y-%m-%d): Promoted 'Microservices Adoption' to domain skill (frequency: 4)" >> .specs/memory/SKILL_PROMOTIONS.log
```

**Verification checklist**:
- [ ] Frequency threshold met (≥3 occurrences)
- [ ] Maturity assessed (Established/Emerging/Experimental)
- [ ] Best practices documented (with rationale)
- [ ] Common pitfalls listed (with mitigations)
- [ ] Recommended agents specified
- [ ] Reference implementations linked
- [ ] Related lessons cross-referenced
- [ ] Evolution history tracked (version updates)

---

### Step 4: Archive Project Documentation

**Archive scope**:
- All SPEC/REQUIREMENT/DESIGN documents (read-only after archive)
- Phase 0-8 outputs (YC六问, 5 Whys, design docs, task plans)
- Wave summaries and heartbeat checkpoints
- Review findings and canary deployment logs

**Archive protocol**:

```bash
# Create archive directory with project ID
PROJECT_ID=$(date +%Y%m%d)-$(git rev-parse --short HEAD)
mkdir -p archive/${PROJECT_ID}

# Copy all project docs
cp -r openspec/ archive/${PROJECT_ID}/openspec/
cp -r .specs/ archive/${PROJECT_ID}/.specs/
cp dev-log.md archive/${PROJECT_ID}/
cp STATE.md archive/${PROJECT_ID}/

# Mark as read-only
chmod -R a-w archive/${PROJECT_ID}/

# Generate archive manifest
cat > archive/${PROJECT_ID}/MANIFEST.md <<EOF
# Archive Manifest — ${PROJECT_ID}

**Archived**: $(date +%Y-%m-%d\ %H:%M)  
**Project**: {project_name}  
**Commit**: $(git rev-parse HEAD)  

## Contents
- openspec/: Specification documents (read-only)
- .specs/: Memory system (LESSONS, DECISIONS, domain skills)
- dev-log.md: Development log
- STATE.md: Project state snapshot

## Access
All files are read-only. To reference in future projects:
\`\`\`bash
grep -rn "{keyword}" archive/${PROJECT_ID}/
\`\`\`

## Retention Policy
Keep indefinitely. Storage cost negligible vs knowledge value.
EOF
```

**Distillator compression** (optional, for large docs):

```bash
# Compress large documents (>10KB)
for file in $(find archive/${PROJECT_ID} -name "*.md" -size +10k); do
  # Run distillator (hypothetical tool)
  distillator compress $file --output ${file}.compressed
  
  # Verify 100% information preservation
  if distillator verify $file ${file}.compressed; then
    mv ${file}.compressed $file
    echo "Compressed: $file ($(du -h $file | cut -f1))"
  else
    rm ${file}.compressed
    echo "Skipped (verification failed): $file"
  fi
done
```

**Verification checklist**:
- [ ] All project docs copied to archive directory
- [ ] Directory marked read-only (chmod a-w)
- [ ] MANIFEST.md generated with contents list
- [ ] Large files compressed (if distillator available)
- [ ] Compression verified (100% info preservation)
- [ ] Archive accessible via grep search

---

### Step 5: Update Project Context for Next Session

**Inject key learnings into CONTEXT.md**:

```bash
# Extract top 3 lessons from current project
tail -20 .specs/memory/LESSONS.md | grep "^### L-" | head -3

# Append to CONTEXT.md under "Lessons Learned" section
cat >> .devflow-evo/CONTEXT.md <<EOF

## Lessons Learned (from $(date +%Y-%m-%d) project)

1. **{lesson_1_title}**: {brief_description}
2. **{lesson_2_title}**: {brief_description}
3. **{lesson_3_title}**: {brief_description}

These lessons will be automatically loaded in future projects matching keywords: {keywords}
EOF
```

**Keyword indexing** (for auto-loading):

```bash
# Extract keywords from lessons
grep -oP '(?<=Applicability: ).*' .specs/memory/LESSONS.md | tr ',' '\n' | sort -u

# Build inverted index
cat > .specs/memory/KEYWORD_INDEX.json <<EOF
{
  "react": ["L-043", "L-021", "L-035"],
  "microservices": ["L-042", "L-038", "domain-skill:microservices-adoption"],
  "security": ["L-040", "L-037"],
  "performance": ["L-039", "L-036"]
}
EOF
```

**Auto-load protocol** (next project startup):

```bash
# Detect project type
if grep -q "react\|frontend" package.json; then
  # Load React-related lessons
  jq '.react' .specs/memory/KEYWORD_INDEX.json | xargs -I{} grep -A10 "{}" .specs/memory/LESSONS.md
fi

# Inject into Phase 0 context
echo "## Relevant Past Experience" >> .devflow-evo/CONTEXT.md
grep -A5 "react" .specs/memory/KEYWORD_INDEX.json >> .devflow-evo/CONTEXT.md
```

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

**Issue 4: Archive Corruption**

- **Symptom**: Archived files unreadable or incomplete
- **Cause**: Copy interrupted, disk full, permission error
- **Fix**:
  1. Delete corrupted archive
  2. Re-run archive protocol
  3. Verify with checksum: `find archive/ -type f -exec md5sum {} \; > checksums.md5`
- **Prevention**: Verify copy completeness, check disk space before archiving

**Issue 5: Keyword Index Out of Sync**

- **Symptom**: Auto-load misses relevant lessons
- **Cause**: New lessons not added to KEYWORD_INDEX.json
- **Fix**:
  1. Rebuild index: `grep -oP '(?<=Applicability: ).*' LESSONS.md | ...`
  2. Diff with old index to find missing entries
  3. Update JSON manually or via script
- **Prevention**: Automate index rebuild on every lesson addition (Git hook)

---

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Impact |
|-------|------|------------|--------|--------|
| **P0** | BLOCKING | DOMAIN SKILL extraction fails (same pattern <3 occurrences, or promoted skill fails on 2nd project), or LESSONS.md numbering sequence broken with >5 gaps/duplicates | Demote skill to [EXPERIMENTAL], rebuild lesson numbers from L-XXX max+1, verify with full index scan before re-promotion attempt | Blocks domain skill adoption; falls back to raw lessons only |
| **P1** | RECOVERABLE | Lesson extracted without confirmed root cause (premature extraction), keyword index missing entries for ≥20% of lessons, archive checksum mismatch on ≥1 file | Flag [INCOMPLETE], link to ongoing investigation; rebuild index from full LESSONS.md scan; re-archive verified files only | Delays archival but does not block project completion |
| **P2** | WARNING | Domain skill maturity set to "Established" with exactly 3 occurrences (fragile threshold), lesson applicability scope too broad (>50% of codebase), decision record missing dissenting opinion | Note threshold fragility, narrow applicability definition, request team confirmation for dissenting opinions | No blocking impact, proceed normally |
| **P3** | INFO | Lesson captured from single wave without cross-project validation, compression reduced file size <20%, related lesson references stale (referenced lesson deleted/rewritten in append-only mode) | Log limitation note, schedule re-evaluation at next project milestone | No impact, continue |

**Severity Assignment Rules**:
- Default to P0 when domain skill promotion violates ≥3 threshold OR LESSONS.md numbering has non-incremental gaps (>1 skipped number)
- Escalate from P1→P0 only when archive corruption affects >2 files OR keyword index completely unusable (index rebuild returns 0 entries)
- Never auto-resolve: domain skills promoted to "Established" must be explicitly confirmed by ≥3 independent project instances

**Auto-Resolution Rules** (no user input needed):
- If new lesson number = existing max + 1 and file append succeeds → auto-increment counter, no validation delay
- If compression verification returns >98% information preservation but <100% → proceed with note [COMPRESSION: 98% fidelity], do not block

---

## Boundary Conditions

### When to Escalate Immediately

**Skip archival, escalate to Orchestrator if**:
- Lessons reveal systemic organizational issues (process failures, skill gaps)
- Decision conflicts with legal/compliance requirements discovered post-hoc
- Knowledge reveals security vulnerability affecting multiple projects
- Archive size exceeds storage budget (>1GB uncompressed)

### When to Skip Memory Update

**Don't extract lessons if**:
- Project abandoned before Phase 4 (no implementation learnings)
- All work trivial CRUD operations with no novel patterns
- Team explicitly requests "no documentation" (fast prototype mode)
- Lessons already captured in higher-level retrospective

### Edge Cases

**Multi-Project Concurrent Development**:
- Maintain separate memory per project (`project-a/.specs/memory/`, `project-b/.specs/memory/`)
- Cross-reference via shared domain skills (symlink or copy)
- Merge lessons only after both projects complete

**Open Source Contribution Learnings**:
- Extract lessons applicable to internal projects
- Respect upstream project's license (don't copy proprietary code)
- Contribute improvements back if allowed (documentation, bug fixes)

**Regulated Industry (Healthcare, Finance)**:
- Anonymize sensitive data before archiving (remove patient IDs, account numbers)
- Encrypt archive directory (AES-256)
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
### L-XXX [{CATEGORY}] {Title}

> {1-2 sentence description}

**Context**: {when/where this occurred}  
**Root Cause**: {underlying reason, not just symptom}  
**Impact**: {what broke or what improved}  
**Fix/Solution**: {how it was resolved}  

**Applicability**: {who else might encounter this}  
**Severity**: {LOW|MEDIUM|HIGH|CRITICAL}  
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
- [Link to StackOverflow discussion](link)
```

### Standard Decision Record

```markdown
## [YYYY-MM-DD] {Decision Title}

**Category**: {Technical Architecture|Business Logic|Tool Selection|Process Change}  
**Participants**: {list of roles/people involved}  
**Outcome**: {clear statement of what was decided}  
**Confidence**: {score}/10  

### Context
{background information leading to this decision}

### Decision Rationale
- {reason_1}
- {reason_2}
- {reason_3}

### Alternatives Considered
1. **{alternative_1}**: Rejected because {reason}
2. **{alternative_2}**: Rejected because {reason}

### Dissenting Opinions
**{Role/Name}** ({position}):
- **Concern**: {specific concern}
- **Requirement**: {what would change their mind}
- **Impact if Ignored**: {risk assessment}

### Implementation Plan
- {step_1}: {timeline}
- {step_2}: {timeline}
- {step_3}: {timeline}

### Success Metrics
- {metric_1}: {target_value}
- {metric_2}: {target_value}

### Review Date
{YYYY-MM-DD} or {trigger_event}

### Related Decisions
- [YYYY-MM-DD] {related_decision_title}
- [YYYY-MM-DD] {another_related_decision}

### Status
{Planned|In Progress|Implemented|Reviewed|Superseded}  
{notes on current status, any deviations from plan}
```

### Standard Domain Skill

```markdown
# Domain Skill: {Skill Name}

**Frequency**: {N} projects  
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

---

## Tool Integration

### Required Tools

**File System Operations**:
```bash
# Create directory structure
mkdir -p .specs/memory/{lessons,domain-skills,decisions}

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

**Archive Management**:
```bash
# Copy with verification
rsync -av --checksum source/ archive/

# Mark read-only
chmod -R a-w archive/

# Generate checksums
find archive/ -type f -exec md5sum {} \; > archive/checksums.md5
```

### Optional Tools

**Distillator Compression**:
```bash
# Compress large documents
distillator compress input.md --output output.md

# Verify information preservation
distillator verify original.md compressed.md

# Batch compress
find . -name "*.md" -size +10k -exec distillator compress {} --output {}.compressed \;
```

**Knowledge Graph Visualization**:
```markdown
# AI 生成 LESSONS 关系图（Mermaid 格式嵌入 Markdown）
# 输入：.specs/memory/LESSONS.md
# 输出：Mermaid 图表

# AI 生成 Domain Skill 演化时间线
# 输入：.specs/memory/domain-skills/
# 输出：时间线图表
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
- [ ] Required files exist (LESSONS.md, DECISIONS.md, KNOWN_FAILURES.md)
- [ ] Current max lesson number identified
- [ ] Source materials collected (dev-log, reviews, wave summaries)

During extraction:
- [ ] Lessons classified correctly (FAILURE/SUCCESS/INSIGHT/PATTERN)
- [ ] Each lesson has root cause (not just symptom)
- [ ] Numbering sequential (no gaps, no duplicates)
- [ ] Cross-references updated (related lessons linked)
- [ ] Severity rated appropriately
- [ ] Source traced (which wave/task/dev-log)

After extraction:
- [ ] Decision records formatted with all required fields
- [ ] Domain skills promoted only if frequency ≥3
- [ ] Archive created with read-only permissions
- [ ] MANIFEST.md generated
- [ ] Keyword index rebuilt
- [ ] CONTEXT.md updated with top 3 lessons
- [ ] Compression verified (if distillator used)

Quality gates:
- [ ] No duplicate lesson numbers
- [ ] All lessons have clear root cause
- [ ] Domain skills include best practices AND pitfalls
- [ ] Archive完整性验证 (checksums match)
- [ ] Keyword index includes new entries
- [ ] Output matches standard templates
- [ ] Immutable history preserved (no deletions/modifications)

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

❌ **Archive Neglect**: Never reviewing archived decisions  
✅ **Fix**: Set review dates, schedule quarterly audits

❌ **Over-Documentation**: Capturing trivial details cluttering memory  
✅ **Fix**: Filter for signal-to-noise ratio, skip <5 LOC changes

---

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added 5-step extraction workflow (lessons → decisions → domain skills → archive → context update)
  - Implemented strict numbering system (L-XXX incremental)
  - Defined domain skill promotion criteria (frequency ≥3)
  - Added comprehensive error handling (5 common issues)
  - Integrated keyword indexing for auto-loading

- **v1.0** (2024-01-10): Initial implementation based on 交互层 memory-keeper.md
  - Basic lesson extraction
  - Simple archival to .supercorp/memory/
  - No domain skill promotion logic
  - Manual numbering (error-prone)
