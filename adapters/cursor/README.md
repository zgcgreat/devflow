# Cursor Adapter

ForgeOS adapter for [Cursor](https://cursor.sh) IDE. Enables ForgeOS's phase-gated workflow and rule system within the Cursor harness.

## Installation

1. Copy `forgeos.mdc` to `.cursor/rules/`
2. Copy rules from `rules/` to `.cursor/rules/`

See `install.md` for a step-by-step walkthrough.

## Runtime Levels

### Level 1 (Node.js available)

When Node.js is present, the adapter operates at Level 1 capability:

- **JS hooks via Cursor's MCP integration** -- ForgeOS hooks execute as MCP server calls, leveraging Cursor's Model Context Protocol support
- **Gate auto-check** -- phase-transition hooks verify gate conditions through MCP tool calls
- **Persona loads with hook support** -- personas can register MCP tools that respond to hook events

### Level 0 (No Node.js)

When Node.js is not available, the adapter falls back to Level 0:

- **Markdown rules only** -- all workflow logic is expressed as `.mdc` rule files that the AI follows as instructions
- **AI follows forgeos.mdc instructions** -- the main rule file encodes the full phase-gated workflow, gate conditions, and persona selection logic as natural-language instructions
- **No automated hook execution** -- gate checks and context monitoring rely on the AI self-enforcing the rules described in the markdown files

## Files Included

| File | Purpose |
|------|---------|
| `forgeos.mdc` | Main Cursor rule file encoding the ForgeOS workflow |
| `install.md` | Installation instructions and verification steps |
