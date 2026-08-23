---
name: gsd-new-project
description: Initialize a new project through unified flow: questioning, research, requirements, roadmap. Takes you from idea to ready-for-planning
---

# New Project Workflow

Initialize a new project through unified flow: questioning, research (optional), requirements, roadmap. This is the most leveraged moment in any project — deep questioning here means better plans, better execution, better outcomes. One workflow takes you from idea to ready-for-planning.

**Core principle:** Invest time upfront in thorough questioning and context gathering. Better requirements lead to better plans which lead to better execution.

## When to Use

- Starting a brand new project
- Initializing an empty directory as a GSD-managed project
- Setting up planning structure for a greenfield development

## Available Agent Types

- `gsd-project-researcher` — Researches project-level technical decisions
- `gsd-research-synthesizer` — Synthesizes findings from parallel research agents
- `gsd-roadmapper` — Creates phased execution roadmaps

## The Process

### 1. Setup

Parse `$ARGUMENTS`. If `--auto` flag present: skip brownfield mapping and deep questioning, require idea document (`@your-idea.md` or pasted text), set smart defaults for all choices.

Initialize via SDK: load project info, resolve agent models, detect runtime (Claude/Codex/Gemini/OpenCode). Validate project not already initialized. Handle git init with worktree awareness.

```bash
INIT=$(gsd-sdk query init.new-project)
```

### 2. Brownfield Offer

If existing code detected but no codebase map: ask to map codebase first or skip mapping. In auto mode, skip (assume greenfield).

### 3. Deep Questioning

Present the project idea and conduct deep questioning on:
- **What** — What are we building? Core value proposition?
- **Why** — Why this? Why now? Problems it solves?
- **Who** — Who are users? Target audience?
- **How** — How should it work? Key flows?
- **Constraints** — Technical constraints, timeline, budget?

### 4. Validate Understanding

Present summary of understanding and ask for confirmation before writing any files.

```
GSD > PROJECT UNDERSTANDING SUMMARY
Project: [Name]
Problem: [Description]
Users: [Target audience]
Core value: [Value proposition]
Key features: [List]
Constraints: [List]
```

Options: "Looks good" (proceed) | "Adjust" (correct details). Loop until confirmed.

### 5. Write PROJECT.md

Write comprehensive PROJECT.md with: project description, problem statement, target users, core value proposition, key features, constraints, decisions, tech stack (if determined).

### 6. Determine Milestone Direction

Ask what the first milestone should focus on. Scope initial requirements based on questioning answers. Prioritize table stakes vs differentiators.

### 7. Research Decision

If research enabled: ask if user wants domain ecosystem research before planning. If yes: spawn 4 parallel researcher agents (Stack, Features, Architecture, Pitfalls). Synthesize findings into SUMMARY.md.

### 8. Define Requirements

Present features by category for scoping. Scope each category via multi-select. Generate REQUIREMENTS.md with REQ-IDs. Present full requirements for confirmation. Commit requirements.

### 9. Create Roadmap

Spawn `gsd-roadmapper` agent with full project context and requirements. Roadmapper writes ROADMAP.md with phases mapped to requirements, success criteria per phase, and 100% coverage validation. Handle BLOCKED/CREATED returns. Ask for approval. Commit roadmap.

### 10. Done

Present completion summary with artifact table:
- PROJECT.md (project context and decisions)
- REQUIREMENTS.md (scanned and prioritized requirements)
- ROADMAP.md (phased execution plan)

Next steps: `/gsd:discuss-phase 1` or `/gsd:plan-phase 1`.

## Anti-Patterns

- Skipping deep questioning to rush into planning
- Writing PROJECT.md without user confirmation
- Defining all requirements upfront without research option
- Not validating understanding before file creation
- Auto mode without idea document

## Success Criteria

- [ ] Project not already initialized
- [ ] Deep questioning completed (unless auto mode)
- [ ] Understanding summary confirmed by user
- [ ] PROJECT.md written with full context
- [ ] Research completed if selected (4 parallel agents)
- [ ] REQUIREMENTS.md created with REQ-IDs
- [ ] `gsd-roadmapper` spawned with project context
- [ ] ROADMAP.md written with phased plan and success criteria
- [ ] User approval obtained for roadmap
- [ ] All commits made
- [ ] User knows next step: `/gsd:discuss-phase 1`
