# Memory Templates

This directory contains **template files** for the LearningWorkflow memory system.
These are **not** runtime memory — they serve as initialization templates.

## Usage

When LearningWorkflow initializes a new project's memory, it copies these templates
as the starting structure. The actual runtime memory lives at the project root `memory/`.

## Template Files

| File | Purpose |
|------|---------|
| AGENT_NOTES.md | Agent behavior notes template |
| LEARNING_BACKLOG.md | Learning items backlog template |
| SESSION_CLOSE_CHECKLIST.md | Session handoff checklist template |
| TEAM_PREFERENCES.md | Team coding preferences template |
| USER_PROFILE.md | User profile template |
| VERIFICATION_BASELINE.md | Verification criteria template |
| memory-index.yaml | Memory index schema |

## Root Memory (Runtime)

The project root `memory/` contains the actual runtime files:
- `LESSONS.md` — Learned lessons
- `DECISIONS.md` — Decision log
- `CURRENT_STATE.md` — Current project state
- `KNOWN_FAILURES.md` — Known failure patterns
- `PROJECT_CONTEXT.md` — Project context
