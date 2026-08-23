---
name: gsd-remove-phase
description: Remove an unstarted future phase and renumber remaining phases to maintain numbering continuity
---

# Remove Phase Workflow

Remove an unstarted future phase and renumber remaining phases to maintain numbering continuity. Only removes phases that have not been started (no files modified, no commits for that plan).

**Core principle:** Don't let stale planned phases accumulate. Remove work no longer needed.

## When to Use

- A planned phase is no longer relevant
- Features scoped to a phase were removed from requirements
- Phase direction changed during discussion

**Don't use when:**
- Phase has already started (files modified or committed)
- Phase is actively being executed
- Phase artifacts exist on disk (requires confirmation)

## The Process

### 1. Parse Arguments

First positional argument is the phase number to remove. Remaining arguments become reason for removal:

```
/gsd-remove-phase 03 Feature became redundant because X
-> phase = 03
-> reason = "Feature became redundant because X"
```

### 2. Initialize Context

Load phase operation context via `gsd-sdk query init.phase-op "${PHASE}"`. Validate phase exists and is in the roadmap.

### 3. Check Phase Readiness

Check if the target phase has started:
- Are there files on disk? (`ls .planning/phases/{padded}/`)
- Has this plan committed any code? (`git log --oneline --all --grep="plan {phase_number}" | head -5`)

If files exist or commits found:
```
Phase 03 has started. Files and/or commits detected.
Are you sure you want to remove it?
Options: Yes, remove it | No, keep it
```

### 4. Remove Phase from Roadmap

Update ROADMAP.md to remove the phase entry. Adjust numbering of subsequent phases if needed:

```bash
RESULT=$(gsd-sdk query phase.remove "${PHASE}")
```

### 5. Delete Phase Directory (if empty)

If no files were modified in this phase, delete the phase directory:

```bash
rmdir .planning/phases/{padded-phase}-{slug} 2>/dev/null || true
```

### 6. Report Completion

Present removal summary:
```
Phase {number} ({name}) removed.

Reason: {reason}
Remaining phases renumbered: yes/no
Artifact files deleted: yes/no
```

Update ROADMAP.md with the changes.

## Anti-Patterns

- Removing a phase that has active commits without confirmation
- Not adjusting numbering of subsequent phases
- Leaving empty phase directories on disk
- Removing a phase without recording the reason

## Success Criteria

- [ ] Phase validated as unstarted (no commits, no modified files) or user confirmed removal despite artifacts
- [ ] Roadmap updated with phase entry removed
- [ ] Subsequent phases renumbered if applicable
- [ ] Phase directory deleted if empty (no artifacts)
- [ ] Removal reason recorded
- [ ] User informed of next step: "/gsd:plan-phase {first-remaining-phase}"
