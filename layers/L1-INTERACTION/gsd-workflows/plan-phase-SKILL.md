---
name: gsd-plan-phase
description: Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification. Orchestrates researcher, planner, and plan-checker agents with revision loop
---

# Plan Phase Workflow

Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification. Default flow: Research (if needed) -> Plan -> Verify -> Done. Orchestrates `gsd-phase-researcher`, `gsd-planner`, and `gsd-plan-checker` agents with a revision loop (max 3 iterations).

**Core principle:** Good plans lead to fast execution. Bad plans cause rework. Invest in planning.

## When to Use

- Starting a new phase from the roadmap
- After discuss-phase completes to turn discussion outputs into actionable plans
- When replanning an executed or needs-review phase (--reviews mode)
- Cross-phase research without replanning (--research-phase mode)

## Available Agent Types

- `gsd-phase-researcher` — Researches technical approaches for a phase
- `gsd-pattern-mapper` — Analyzes codebase for existing patterns, produces PATTERNS.md
- `gsd-planner` — Creates detailed plans from phase scope
- `gsd-plan-checker` — Reviews plan quality before execution

## The Process

### 0. Git Branch Invariant

Do not create, rename, or switch git branches during plan-phase. Branch identity is established at discuss-phase and owned by the user's git workflow. A phase rename in ROADMAP.md does not mutate git branch names.

### 1. Initialize

Load all context in one call via SDK:
```bash
INIT=$(gsd-sdk query init.plan-phase "$PHASE")
```

Parse config for researcher_model, planner_model, checker_model, research_enabled, plan_checker_enabled, commit_docs, text_mode, phase info. When `response_language` is set, include it in all spawned subagent prompts. Handle closed-phase gate (--force override).

### 1.5. Closed-Phase Gate

If phase status is "Complete" and no --reviews flag: hard-stop unless --force override provided. Prevents silently rewriting plan docs that no longer match shipped code. Executed and Needs Review states are not gated — replanning is legitimate.

### 2. Parse Arguments

Extract phase number, flags (--research, --skip-research, --gaps, --skip-verify, --prd, --ingest, --reviews, --bounce, --chunked, --mvp, --force). MVP_MODE resolution: CLI flag -> ROADMAP Mode -> workflow.mvp_mode config -> false. Walking Skeleton mode for Phase 1 of new projects with MVP enabled.

### 2.5. Validate --reviews Prerequisite

No --reviews and --gaps together (conflicting modes). No reviews flag without REVIEWS.md in phase dir.

### 3. Validate Phase

Validate phase exists in ROADMAP. Create directory if needed using expected_phase_dir from init. Handle CHUNKED_MODE, PRD express path (--prd), ingest mode (--ingest).

### 4. Research (if needed)

If research enabled and --research flag: check existing RESEARCH.md. If --research force flag: re-research without prompting. If VIEW_ONLY (--view): print existing RESEARCH.md to stdout without spawning agent.

Otherwise: spawn `gsd-phase-researcher` with phase context, ROADMAP goal, requirements, and prior phase context. Research writes to RESEARCH.md. Display summary if research produced findings.

### 5. Pattern Mapping (Optional)

If has existing codebase, optionally run pattern mapping to identify existing patterns the plan should leverage. Produces PATTERNS.md with architecture conventions, UI conventions, testing conventions, API conventions.

### 6. Create Plan

Spawn `gsd-planner` agent with:
- Phase goal from ROADMAP.md
- Requirements mapped to this phase
- Research findings (if any)
- Pattern map (if any)
- CONTEXT.md files from prior phases (context_window >= 500K models get more context)
- TDD instructions (if TDD_MODE enabled)

Planner creates PLAN.md with objectives, tasks, success criteria. Walk skeleton mode produces SKELETON.md alongside PLAN.md for new projects.

### 7. Plan Checker Revision Loop

If plan_checker_enabled: spawn `gsd-plan-checker` to review plan quality. Reviewer reports pass or issues. If issues found: loop back to planner with revision context (max 3 iterations). Each iteration improves plan quality.

### 8. Verification Setup

If not --skip-verify: create VERIFICATION.md template based on plan's must_haves and success criteria. Pre-populate verification gates for task completion checks. Add phase-level goal achievement section.

### 9. Gaps Detection (Optional)

If --gaps flag: compare executed plans' SUMMARY.md files against current phase requirements. Find orphaned code, leftover artifacts from prior phases not covered by any requirement. Report as gaps in VERIFICATION.md.

### 10. Commit and Report

Commit PLAN.md, RESEARCH.md, VERIFICATION.md (if created), PATTERNS.md (if any). Present completion summary with plan objectives, task count, success criteria, next step (`/gsd:execute-phase N` or `/gsd:verify-phase N`).

## Modes Comparison

| Mode | Behavior |
|------|----------|
| Default | Research (if enabled) -> Plan -> Verify -> Done |
| --research | Force re-research before planning |
| --skip-research | Skip research, plan directly |
| --reviews | Review REVIEWS.md findings, revise plans |
| --gaps | Find orphaned code between plans and requirements |
| --research-phase N | Research only mode (no planning) |
| --prd FILE | Express path from PRD file |
| --mvp | MVP mode with Walking Skeleton on Phase 1 |

## Anti-Patterns

- Planning without research when domain is complex
- Skipping plan checker revision loop
- Creating tasks that aren't individually completable
- Not mapping requirements to success criteria
- Planning on top of closed phase without --force
- Modifying git branches during planning

## Success Criteria

- [ ] Phase validated and exists in ROADMAP.md
- [ ] Research completed if enabled (--skip-research overrides)
- [ ] RESEARCH.md created/updated with findings
- [ ] PLAN.md created with tasks mapped to requirements
- [ ] Plan checker approved or revision loop resolved issues (max 3 iterations)
- [ ] VERIFICATION.md template populated with must_haves and success criteria
- [ ] All planning artifacts committed
- [ ] User informed of next step: `/gsd:execute-phase N`
