---
name: gsd-pr-branch
description: Create a clean branch for pull requests by filtering out transient .planning/ commits, preserving only code changes and structural planning state (STATE.md, ROADMAP.md, MILESTONES.md, PROJECT.md, REQUIREMENTS.md, milestones/)
---

## Overview

Creates a PR branch from the current feature branch using `git cherry-pick` with path filtering. The PR branch contains only code changes and structural planning artifacts — transient GSD planning files (PLAN.md, SUMMARY.md, CONTEXT.md, RESEARCH.md, etc.) are excluded so reviewers see clean history.

## When to Use

- Before creating a pull request
- After completing phase execution
- When you want a clean diff that excludes GSD internal state

## Available Subagents

- `gsd-executor` — If PR branch work needs executor-style task completion
- `gsd-code-review` — To review the PR branch before pushing

## Processing Flow

### Step 1: Detect State

Parse arguments (target branch, default `main`) and check preconditions:
- Must be on a feature branch (not main/master)
- Must have commits ahead of target

```bash
CURRENT_BRANCH=$(git branch --show-current)
TARGET=${1:-main}
AHEAD=$(git rev-list --count "$TARGET".."$CURRENT_BRANCH" 2>/dev/null)
```

If `AHEAD = "0"`, exit with message "No commits ahead — nothing to filter."

### Step 2: Analyze Commits

Classify all commits ahead of target:

**Structural planning files (always preserved):**
- `.planning/STATE.md`, `ROADMAP.md`, `MILESTONES.md`, `PROJECT.md`, `REQUIREMENTS.md`
- `.planning/milestones/**`

**Transient planning files (excluded from PR branch):**
- `.planning/phases/**`, `quick/**`, `research/**`, `threads/**`, `todos/**`
- `.planning/debug/**`, `seeds/**`, `codebase/**`, `ui-reviews/**`

Classification rules:
- **Code commits**: Touch non-.planning/ files → INCLUDE
- **Structural planning commits**: Touch only structural .planning/ files → INCLUDE
- **Transient planning commits**: Touch only transient .planning/ files → EXCLUDE
- **Mixed commits**: Touch code + any planning files → INCLUDE

### Step 3: Create PR Branch

```bash
PR_BRANCH="${CURRENT_BRANCH}-pr"
git checkout -b "$PR_BRANCH" "$TARGET"
```

Cherry-pick included commits (code + structural planning) in order:
- Use `git cherry-pick --no-commit`
- After each cherry-pick, remove transient `.planning/` subdirectories that came along in mixed commits
- Keep structural files intact

Return to original branch.

### Step 4: Verify

```bash
PLANNING_FILES=$(git diff --name-only "$TARGET".."$PR_BRANCH" | grep "^\.planning/" | wc -l)
```

Verify no transient `.planning/` files appear in PR branch diff (structural files allowed).

## Success Criteria

- [ ] PR branch created from target, not current branch
- [ ] Planning-only commits excluded from cherry-picks
- [ ] No transient `.planning/` files in PR branch diff
- [ ] Commit messages preserved from originals
- [ ] User shown next steps (push + create PR via `gh pr create`)

## Anti-Patterns

- Creating PR branch from main/master instead of feature branch
- Filtering out structural planning files (STATE.md, ROADMAP.md should be visible)
- Cherry-picking without removing transient directories from mixed commits

## Next Steps

After PR branch is created:
1. `git push origin {PR_BRANCH}`
2. `gh pr create --base {TARGET} --head {PR_BRANCH}`
3. Or use `/gsd:ship` to create the PR automatically
