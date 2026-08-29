---
name: gsd-code-review
description: Review source files changed during a phase for bugs, security issues, and code quality problems at configurable depth (quick/standard/deep)
---

# Code Review Workflow

Review source files changed during a phase for bugs, security issues, and code quality problems. Computes file scope from `--files` override, SUMMARY.md extraction, or git diff fallback. Spawns `gsd-code-reviewer` agent, commits REVIEW.md, and presents results to user.

**Core principle:** Automated review catches bugs faster than manual reading. Configurable depth (quick/standard/deep) lets you balance speed vs thoroughness.

## When to Use

- After any phase with source code changes
- Before verifying phase completion
- When introducing new dependencies or patterns
- Periodically on large refactors

**Config gate:** `workflow.code_review` (default: enabled). Set to false to skip.

## The Process

### 1. Initialize Context

Parse `$ARGUMENTS` for phase number and optional flags (`--depth`, `--files`). Load project state via `gsd-sdk query init.phase-op`. Validate phase exists before checking config.

```bash
PHASE_ARG="${1}"
INIT=$(gsd-sdk query init.phase-op "${PHASE_ARG}")
```

### 2. Check Config Gate

Check `workflow.code_review` config. Default is enabled — only skip on explicit false.

### 3. Determine Review Depth

Priority: `--depth` flag > config value > default "standard". Valid values: quick, standard, deep. Invalid values fall back to standard.

### 4. Compute File Scope (Three-Tier)

**Tier 1 — `--files` override:** Highest precedence. Validates paths are within repository (path traversal guard). Filters non-existent files.

**Tier 2 — SUMMARY.md extraction:** Parse `key_files.created` and `key_files.modified` from plan summaries. Falls back gracefully if no SUMMARY.md found.

**Tier 3 — Git diff fallback:** Compute diff base from phase commits. Exclude planning artifacts, lock files, and summary documents. Fail closed if no reliable diff base.

Post-processing: Apply exclusions (`.planning/`, ROADMAP.md, STATE.md, etc.), filter deleted files, deduplicate, sort alphabetically for reproducibility.

### 5. Structural Pre-Pass (Optional)

If `code_quality.fallow.enabled` is true, run fallow structural audit before agent review. Configurable scope (phase or repo) and profile. Timeout bounded at 120s.

### 6. Spawn Reviewer Agent

Spawn `gsd-code-reviewer` subagent with explicit file list, depth setting, review path, and diff base context. Agent writes findings to phase-specific REVIEW.md file.

**Agent failure handling:** If agent fails (error, timeout, exception), exit without creating partial REVIEW.md. Suggest retry.

### 7. Commit Review Report

Verify REVIEW.md was created with valid frontmatter (contains status field). Commit if `commit_docs` is enabled. Display inline summary with finding counts (critical, warning, info, total) and list top issues if any found.

## File Scope Precedence

```
--files override > SUMMARY.md extraction > git diff fallback
```

Each tier falls to the next only if the previous yields no files. Empty scope results in skip (no agent spawn).

## Anti-Patterns

- Reviewing before config gate check
- Using invalid depth values
- Skipping file path validation (security)
- Creating partial REVIEW.md on agent failure
- Not filtering planning artifacts from scope

## Success Criteria

- [ ] Phase validated before config gate check
- [ ] Config gate checked (`workflow.code_review`)
- [ ] Depth resolved with validation (quick|standard|deep)
- [ ] File scope computed with three tiers: `--files` > SUMMARY.md > git diff
- [ ] Malformed/missing SUMMARY.md handled gracefully with fallback
- [ ] Deleted files filtered from scope
- [ ] Files deduplicated and sorted
- [ ] Empty scope results in skip (no agent spawn)
- [ ] Agent spawned with explicit file list, depth, review_path, diff_base
- [ ] Agent failure handled without partial commits
- [ ] REVIEW.md committed if created
- [ ] Results presented inline with next step suggestion
