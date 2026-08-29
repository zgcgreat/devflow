---
name: gsd-insert-phase
description: Insert a decimal phase between existing integer phases for urgent work discovered mid-milestone
---

# Insert Phase Workflow

Insert a decimal phase for urgent work discovered mid-milestone between existing integer phases. Uses decimal numbering (72.1, 72.2, etc.) to preserve the logical sequence of planned phases while accommodating urgent insertions without renumbering the entire roadmap.

**Core principle:** Urgent work gets inserted without disrupting planned phase numbering. Decimal insertion markers clearly identify urgent work.

## When to Use

- Critical bug discovered mid-milestone
- Urgent fix needed between planned phases
- Emergency patch that must ship before next milestone

**Don't use for:** Planned work at end of milestone (use `/gsd:add-phase` instead)

## The Process

### 1. Parse Arguments

Parse the command: first argument is integer phase number to insert after, remaining arguments are description.

```
/gsd-insert-phase 72 Fix critical auth bug
-> after = 72
-> description = "Fix critical auth bug"
```

If arguments missing: "ERROR: Both phase number and description required. Usage: /gsd-insert-phase <after> <description>"

### 2. Load Context

Load phase operation context via `gsd-sdk query init.phase-op "${after_phase}"`. Check roadmap exists.

### 3. Insert Phase

Delegate to SDK for the actual insertion:

```bash
RESULT=$(gsd-sdk query phase.insert "${after_phase}" "${description}")
```

The CLI handles:
- Verifying target phase exists in ROADMAP.md
- Calculating next decimal phase number (checking existing decimals on disk)
- Generating slug from description
- Creating the phase directory (`.planning/phases/{N.M}-{slug}/`)
- Inserting the phase entry into ROADMAP.md after the target phase with (INSERTED) marker

### 4. Update Project State

Update STATE.md via SDK handlers (never raw Edit/Write — projects may ship a `protect-files.sh` PreToolUse hook):

```bash
gsd-sdk query state.patch '{"Current Phase":"{decimal_phase}","Next recommended run":"/gsd:plan-phase {decimal_phase}"}'
gsd-sdk query state.add-roadmap-evolution \
  --phase {decimal_phase} \
  --action inserted \
  --after {after_phase} \
  --note "{description}" \
  --urgent
```

### 5. Report Completion

Present completion summary with phase number, description, directory path, status (Not planned yet), marker ((INSERTED)), roadmap and STATE.md update confirmation, and next steps (`/gsd:plan-phase {decimal_phase}`).

## Anti-Patterns

- Don't use for planned work at end of milestone (use /gsd-add-phase)
- Don't insert before Phase 1 (decimal 0.1 makes no sense)
- Don't renumber existing phases
- Don't modify the target phase content
- Don't create plans yet (that's `/gsd:plan-phase`)
- Don't commit changes (user decides when to commit)

## Success Criteria

- [ ] `gsd-sdk query phase.insert` executed successfully
- [ ] Phase directory created
- [ ] Roadmap updated with new phase entry (includes "(INSERTED)" marker)
- [ ] `state.add-roadmap-evolution` returned `{ added: true }` or duplicate confirmation
- [ ] `state.patch` matched next-phase pointer field(s)
- [ ] User informed of next steps and dependency implications
