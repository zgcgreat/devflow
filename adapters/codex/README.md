# Codex Adapter

ForgeOS adapter for [OpenAI Codex](https://github.com/openai/codex) CLI. Enables ForgeOS's phase-gated workflow and rule system within the Codex harness.

## Installation

1. Copy `codex.yaml` to the project root directory
2. Copy rules from `rules/` to the project's rules directory

See `install.md` for a step-by-step walkthrough.

## Runtime Levels

### Level 1 (Codex hook system)

Codex provides its own hook system that ForgeOS leverages:

- **Hooks via Codex's hook system** -- ForgeOS hooks are registered as Codex-compatible hook entries in `codex.yaml`
- **Phase transitions** -- mapped to Codex's lifecycle events
- **Gate checks** -- implemented as pre-condition hooks that block phase advancement on failure
- **Context monitoring** -- adapted to Codex's token budget tracking

Codex does not expose a Node.js runtime for hook scripts, so all hooks execute as AI-followed instructions defined in the YAML configuration rather than as executable scripts.

## Files Included

| File | Purpose |
|------|---------|
| `codex.yaml` | Codex-format configuration with ForgeOS hooks and rules |
| `install.md` | Installation instructions and verification steps |
