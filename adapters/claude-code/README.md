# Claude Code Adapter

ForgeOS adapter for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI. Enables ForgeOS's phase-gated workflow, persona system, and hook infrastructure within the Claude Code harness.

## Installation

1. Copy `hooks.json` contents into `.claude/settings.json` under the `hooks` section
2. Copy rules from `rules/` to `.claude/rules/`
3. Copy personas from `personas/` to `.claude/personas/`

See `install.md` for a step-by-step walkthrough.

## Runtime Levels

### Level 1 (Node.js available)

When Node.js is present, the adapter operates at full Level 1 capability:

- **JS hooks execute natively** -- all hook scripts run as Node.js modules via Claude Code's hook system
- **Gate auto-check** -- phase-transition hooks automatically verify gate conditions before allowing phase advancement
- **Persona loads with hook support** -- personas can register and respond to hook events, enabling context-aware behavior shifts

### Level 2 (Node.js + CodeGraph)

When CodeGraph is also available, the adapter gains Level 2 capabilities:

- **Full runtime with CodeGraph bridge** -- dependency analysis, blast-radius computation, and call-chain traversal
- **Enhanced phase-transition** -- DAG snapshots include CodeGraph index data
- **Scale-aware context monitoring** -- Advanced mode uses stricter thresholds informed by CodeGraph structure analysis

## Hook Mapping

8 hooks are mapped to scripts in this adapter:

| Hook | Script | Trigger |
|------|--------|---------|
| context-monitor | `context-monitor.js` | phase_transition, periodic_check |
| prompt-guard | `prompt-guard.js` | user_input |
| phase-transition | `phase-transition.js` | phase_boundary |
| tool-execution | `tool-execution.js` | tool_call |
| format-typecheck | `format-typecheck.js` | gate_check |
| console-log-check | `console-log-check.js` | gate_check |
| security-scan | `security-scan.js` | gate_check |
| cost-tracker | `cost-tracker.js` | session_end |

## Files Included

| File | Purpose |
|------|---------|
| `hooks.json` | Hook registration configuration for Claude Code |
| `settings.json` | Recommended Claude Code settings (permissions, model preferences) |
| `install.md` | Installation instructions and verification steps |
