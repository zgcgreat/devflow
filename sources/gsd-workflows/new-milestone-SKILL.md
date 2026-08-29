---
name: gsd-new-milestone
description: Start a new milestone cycle for an existing project. Loads context, gathers goals, updates PROJECT.md and STATE.md, optionally runs parallel research, defines requirements with REQ-IDs, spawns roadmapper to create phased plan
---

# New Milestone Workflow

Start a new milestone cycle for an existing project. Loads project context, gathers milestone goals (from MILESTONE-CONTEXT.md or conversation), updates PROJECT.md and STATE.md, optionally runs parallel research, defines scoped requirements with REQ-IDs, spawns the roadmapper to create phased execution plan, and commits all artifacts. Brownfield equivalent of new-project.

**Core principle:** Deep questioning before planning means better plans, better execution, better outcomes. One workflow takes you from milestone goals to ready-for-planning.

## When to Use

- Starting a new development cycle after shipping the previous milestone
- After completing a major feature set and defining next priorities
- When requirements have evolved and need fresh roadmap

## Available Agent Types

- `gsd-project-researcher` — Researches project-level technical decisions
- `gsd-research-synthesizer` — Synthesizes findings from parallel research agents
- `gsd-roadmapper` — Creates phased execution roadmaps

## The Process

### 1. Load Context

Read PROJECT.md (existing project, validated requirements, decisions), MILESTONES.md (what shipped previously), STATE.md (pending todos, blockers). Check for MILESTONE-CONTEXT.md (from `/gsd-discuss-milestone`).

### 2. Gather Milestone Goals

If MILESTONE-CONTEXT.md exists: use features and scope from discuss-milestone. If not: present what shipped in last milestone and ask inline "What do you want to build next?" Wait for response, then probe specifics.

#### Scan Planted Seeds

Check `.planning/seeds/` for seed files matching milestone goals. Present matching seeds for inclusion (or auto-select in `--auto` mode). Selected seeds become additional context for requirement definition.

### 3. Determine Milestone Version

Parse last version from MILESTONES.md. Suggest next version (v1.0 -> v1.1, or v2.0 for major). Confirm with user.

### 3.5. Verify Milestone Understanding

Present a summary of gathered information and ask for confirmation:

```
GSD > MILESTONE SUMMARY
Milestone v[X.Y]: [Name]
Goal: [One sentence]
Target features: [List]
Key context: [Constraints, decisions, notes]
```

Options: "Looks good" (proceed) | "Adjust" (correct or add details). Loop until confirmed.

### 4. Update PROJECT.md

Add/update Current Milestone section with goal and target features. Update Active requirements section and Last updated footer. Ensure Evolution section exists.

### 5. Update STATE.md

Reset STATE.md atomically via SDK handler:
```bash
gsd-sdk query state.milestone-switch --milestone "v[X.Y]" --name "[Name]"
```

This writes the new milestone version into frontmatter, resets status to planning, zeroes progress counters, and rewrites Current Position section.

### 6. Cleanup and Commit

Delete MILESTONE-CONTEXT.md if exists (consumed). Clear leftover phase directories from previous milestone. Commit changes.

### 7. Load Context and Resolve Models

Initialize researcher, synthesizer, and roadmapper agents. Handle missing agents gracefully.

### 7.5 Reset-phase Safety (optional)

If `--reset-phase-numbers` flag: archive old phase directories before roadmapping so new 01-* / 02-* directories don't collide with stale milestone directories.

### 8. Research Decision

Check `research_enabled` from config. Ask user: "Research the domain ecosystem for new features before defining requirements?"

**If research selected:** Spawn 4 parallel `gsd-project-researcher` agents (Stack, Features, Architecture, Pitfalls dimensions) with milestone-aware prompts. After all complete, spawn synthesizer agent. Display key findings from SUMMARY.md.

### 9. Define Requirements

Read PROJECT.md and research output. Present features by category for scoping:

```
## [Category 1]
Table stakes: Feature A, Feature B
Differentiators: Feature C, Feature D
```

Scope each category via multi-select (select features for this milestone, defer table stakes to future, exclude differentiators). Generate REQUIREMENTS.md with REQ-IDs (`[CATEGORY]-[NUMBER]` format), continuing numbering from existing. Include Future Requirements, Out of Scope, and empty Traceability sections. Present full requirements list for confirmation. Commit requirements.

### 10. Create Roadmap

Spawn `gsd-roadmapper` agent with project context, requirements, research (if any), and phase numbering mode (continued from previous or reset to Phase 1). Roadmapper writes ROADMAP.md, STATE.md, and updates REQUIREMENTS.md traceability.

**Handle return:** If "ROADMAP BLOCKED" — present blocker, work with user, re-spawn. If "ROADMAP CREATED" — read roadmap, present inline summary with phases, requirements mapping, and success criteria table. Ask for approval via multi-select: "Approve" | "Adjust phases" | "Review full file". Loop until approved. Commit roadmap.

### 10.5 Link Pending Todos to Roadmap Phases (Optional)

After roadmap approval, scan pending todos against newly approved phases. For each todo whose scope matches a phase, tag it with `resolves_phase: [N]` in YAML frontmatter.

### 11. Done

Present completion summary with artifact table and next steps (`/gsd:discuss-phase [N]`).

## Anti-Patterns

- Skipping milestone understanding verification
- Defining requirements without research when available
- Not using REQ-ID traceability format
- Creating roadmap before confirming requirements
- Not archiving old phase directories on reset

## Success Criteria

- [ ] PROJECT.md updated with Current Milestone section
- [ ] STATE.md reset for new milestone
- [ ] MILESTONE-CONTEXT.md consumed and deleted (if existed)
- [ ] Research completed if selected — 4 parallel agents, milestone-aware
- [ ] Requirements gathered and scoped per category
- [ ] REQUIREMENTS.md created with REQ-IDs
- [ ] `gsd-roadmapper` spawned with phase numbering context
- [ ] Roadmap files written immediately (not draft)
- [ ] User feedback incorporated if any
- [ ] Phase numbering mode respected (continued or reset)
- [ ] All commits made
- [ ] Pending todos scanned for phase matches; matched todos tagged
- [ ] User knows next step: `/gsd:discuss-phase [N]`
