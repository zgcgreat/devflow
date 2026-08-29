---
name: gsd-ship
description: Create a PR for completed work and auto-fill the description with phase summaries, requirements coverage, and artifact traceability
---

# Ship Workflow

Create a PR for completed work and auto-fill the description with phase summaries, requirements coverage, and artifact traceability. Handles the gap between "phase is done" and "code is in main".

**Core principle:** Every merged feature should have a clear PR that explains what was built, why, and how it satisfies requirements. Automated descriptions save time and improve consistency.

## When to Use

- Phase execution complete with verified SUMMARY.md files
- Need to create a PR for code review before merging to main/master
- Want automated PR description from phase artifacts

## The Process

### 1. Initialize Context

Parse `$ARGUMENTS` for phase number. Load init context:
```bash
INIT=$(gsd-sdk query init.phase-op "${PHASE_ARG}")
```

Parse phase_dir, phase_number, phase_name, padded_phase, commit_docs from JSON. Validate phase exists.

### 2. Discover Completed Plans

List SUMMARY.md files in the phase directory to identify completed plans:
```bash
ls "$phase_dir"/*-SUMMARY.md 2>/dev/null
```

Extract from each summary: plan objective, tasks completed, files modified, key decisions, testing approach. Report what will be included in the PR.

### 3. Compute Diff for PR Body

Compute git diff to determine exactly what changed:
```bash
DIFF_BASE=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD origin/master 2>/dev/null || echo "")
if [ -n "$DIFF_BASE" ]; then
  git diff --stat "$DIFF_BASE"..HEAD
fi
```

### 4. Generate PR Description

Build PR description from gathered data:

```markdown
## Summary
[2-3 sentences describing what this work accomplishes]

## Phases Included
| Phase | Name | Objectives Met | Files Changed |
|-------|------|---------------|---------------|
| 01 | ... | X/ Y tasks completed | N files |

## Requirements Coverage
| REQ-ID | Description | Status |
|--------|-------------|--------|
| AUTH-01 | User login | SATISFIED |

## Artifacts Produced
- PLAN.md: Phase planning documents
- SUMMARY.md: Completion summaries per plan
- VERIFICATION.md: Verification results (if available)

## Test Plan
- [ ] Run test suite: `npm test` / `pytest` / etc.
- [ ] Manual verification of feature X
- [ ] Check integration points Y and Z
```

### 5. Create PR

Push branch if needed and create PR via gh CLI:
```bash
gh pr create \
  --title "feat(phase N): {phase_name}" \
  --body "{PR_DESCRIPTION}"
```

If branch not pushed yet: `git push -u origin {branch_name}` first.

### 6. Report

Display PR URL and next steps. Suggest running tests and requesting code review.

## Anti-Patterns

- Shipping phases without SUMMARY.md files (incomplete plans)
- Creating PRs for empty commits
- Not including test plan in PR description
- Merging without CI passing
- Shipping from main branch instead of feature branch

## Success Criteria

- [ ] Phase validated and exists
- [ ] SUMMARY.md files discovered and included in PR body
- [ ] Requirements coverage mapped from REQUIREMENTS.md to completed work
- [ ] PR description auto-filled with summary, phases, requirements, artifacts, test plan
- [ ] Branch pushed (if not already)
- [ ] PR created via gh CLI
- [ ] User informed of PR URL and next steps
