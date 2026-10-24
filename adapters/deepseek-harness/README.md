# DeepSeek Harness Adapter

DevFlow adapter for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) — the Cordis-based
agent harness shipped as the DSH Desktop app.

DSH exposes **two** extension mechanisms, and DevFlow needs both of them:

| DSH mechanism | Carries | DevFlow half |
|---|---|---|
| **Skill** (Markdown bundle, lazily loaded) | prompt-level workflow guidance | `SKILL.md` + `GO.md` + `layers/` + `references/` |
| **Cordis plugin** (`apply(ctx, config)`) | code-level enforcement | the gate guard (`ctx.tools.guard`) |

A Skill alone can only *ask* the model to respect a gate. The plugin is what makes the gate real.

## Installation

Two independent steps — do the Skill first, it needs no code.

### Step 1 — Mount the skill (no code, works today)

DSH discovers skills only from these roots, lowest rank winning:

| Root | Rank |
|---|---|
| `<projectRoot>/.dsh/skills` | 100 |
| `<projectRoot>/.agents/skills` | 200 |
| `customSkillDirs` (config) | 300 |
| `$DSH_HOME/skills` | 400 |
| `~/.agents/skills` | 500 |

`projectRoot` is the nearest ancestor containing `.git` (else the cwd itself).

**A repository root `SKILL.md` is NOT discovered.** The file must sit one level down, as
`<root>/<name>/SKILL.md`. Use a directory junction so the checkout stays authoritative:

```powershell
# Windows — no admin rights needed (<DEVFLOW_REPO> = your local devflow checkout path)
New-Item -ItemType Junction -Path "$env:USERPROFILE\.agents\skills\devflow" -Target "<DEVFLOW_REPO>"
```

```bash
# POSIX
ln -s /path/to/devflow ~/.agents/skills/devflow
```

Symlinks are followed (`watchFollowSymlinks` defaults to true), and DSH watches the root for
changes, so edits to the checkout are picked up live.

DSH renders **only `name` and `description`** (whitespace collapsed, truncated at 500 chars) into
its skill catalog. The checkout's `SKILL.md` description must therefore carry the
routing words the model actually matches on (`requirement analysis`, `design`, `task breakdown`,
`code review`, `phased workflow`, `gate`) — a description naming only the product is never selected.

### Step 2 — Mount the gate plugin (code-level enforcement)

The plugin lives in its own package (`dsh-devflow`), not in this repository. See
`cordis.patch.yml` and `install.md`.

## Files Included

| File | Purpose |
|------|---------|
| `cordis.patch.yml` | Loader patch row that mounts the gate plugin into a DSH profile |
| `install.md` | Step-by-step walkthrough and verification |
| `README.md` | This file |

## What the adapter does NOT do

- **No `hooks.json` bridge.** DSH's `dsh-hooks-claude-code` package needs an explicit `configPath`
  and expects Claude Code's `event -> matcher-group array` shape. DevFlow's
  `hooks/hooks.json` and `adapters/claude-code/hooks.json` use a different schema
  (`hooks: { "<id>": { script, type, gates, fail_action, ... } }`) that parses to **zero**
  hooks in DSH. Do not point a bridge at them.
- **No `hooks/scripts/` port.** Those scripts read `CLAUDE_SESSION_ID`, `CLAUDE_PLUGIN_ROOT`,
  `CLAUDE_TRANSCRIPT_PATH` and `ECC_*` environment variables that DSH never sets.
- **No dshmarket publication.** DSH is fail-loud: a plugin that fails to resolve aborts startup
  (recovery is `safe-mode.html` / `plugin-recovery.html`). Mount locally and iterate before
  publishing anything.

## Runtime Levels

| Level | Condition | Capability |
|-------|-----------|------------|
| **L0** | DSH without the plugin | Skill only — DevFlow phases are advisory, gates are self-declared |
| **L1** | DSH + `dsh-devflow` plugin | `ctx.tools.guard` refuses out-of-gate mutations; artifacts are verified on disk |

`detectRuntime()` in `adapters/shared/core-bridge.js` recognises DSH via the `DSH_SESSION_ID`
environment variable that every DSH session sets.
