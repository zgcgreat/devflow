---
name: gsd-cleanup
description: Archive completed milestone phase directories to milestones archive folder
---

# Cleanup Workflow

Archive accumulated phase directories from completed milestones into `.planning/milestones/v{X.Y}-phases/`. Identifies which phases belong to each completed milestone, shows a dry-run summary, and moves directories on confirmation.

**Core principle:** Clean up after yourself. Archived phases free mental space and disk space without losing history.

## The Process

### 1. Identify Completed Milestones

Read `.planning/MILESTONES.md` to identify completed milestones and their versions. Check which milestone archive directories already exist under `.planning/milestones/`. Filter to milestones that do NOT already have a `-phases` archive directory.

If all milestones already have phase archives: "All completed milestones already have phase directories archived. Nothing to clean up."

### 2. Determine Phase Membership

For each completed milestone without an archive, read the archived ROADMAP snapshot (`.planning/milestones/v{X.Y}-ROADMAP.md`) to determine which phases belong to it. Match phase directories that still exist in `.planning/phases/` to milestone membership.

### 3. Show Dry-Run Summary

Present a summary of what will be archived per milestone:

```
## Cleanup Summary

### v{X.Y} — {Milestone Name}
These phase directories will be archived:
- 01-foundation/
- 02-auth/

Destination: .planning/milestones/v{X.Y}-phases/
```

Ask user: "Proceed with archiving?" with options "Yes — archive listed phases" | "Cancel".

### 4. Archive Phases

For each milestone, create the destination directory and move phase directories:

```bash
mkdir -p .planning/milestones/v{X.Y}-phases
mv .planning/phases/{dir} .planning/milestones/v{X.Y}-phases/
```

### 5. Commit and Report

Commit changes with message "chore: archive phase directories from completed milestones". Report the archived phases and paths.

## Anti-Patterns

- Don't archive incomplete milestones
- Only move phase directories that still exist in `.planning/phases/`
- Don't skip user confirmation (unless already confirmed)

## Success Criteria

- [ ] All completed milestones without existing phase archives identified
- [ ] Phase membership determined from archived ROADMAP snapshots
- [ ] Dry-run summary shown and user confirmed
- [ ] Phase directories moved to `.planning/milestones/v{X.Y}-phases/`
- [ ] Changes committed
