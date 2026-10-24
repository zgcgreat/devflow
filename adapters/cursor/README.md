# Cursor Adapter

DevFlow adapter for [Cursor](https://cursor.sh) IDE. Enables DevFlow's phase-gated workflow and rule system within the Cursor harness.

## Installation

1. Copy `devflow.mdc` to `.cursor/rules/`
2. Copy rules from `rules/` to `.cursor/rules/`

See `install.md` for a step-by-step walkthrough.

## Runtime Levels

### Level 1 (Node.js available)

When Node.js is present, the adapter operates at Level 1 capability:

- **Manual gate checks via CLI** -- run `node adapters/shared/gate-checker.js check <GATE_ID>` (also `next` / `all`) to verify gate artifacts on disk. Cursor has no native hook mechanism, so checks are invoked manually rather than automatically
- **State and memory access via core-bridge** -- `node adapters/shared/core-bridge.js read-state .` reads the current phase from `.devflow/state.json`

### Level 0 (No Node.js)

When Node.js is not available, the adapter falls back to Level 0:

- **Markdown rules only** -- all workflow logic is expressed as `.mdc` rule files that the AI follows as instructions
- **AI follows devflow.mdc instructions** -- the main rule file encodes the full phase-gated workflow, gate conditions, and persona selection logic as natural-language instructions
- **No automated hook execution** -- gate checks and context monitoring rely on the AI self-enforcing the rules described in the markdown files

## Files Included

| File | Purpose |
|------|---------|
| `devflow.mdc` | Main Cursor rule file encoding the DevFlow workflow |
| `install.md` | Installation instructions and verification steps |
