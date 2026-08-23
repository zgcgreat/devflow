# ForgeOS Workflow Integration

This project uses forgeos v3.0 phased workflow. As a GitHub Copilot assistant, follow these rules:

## Phase Awareness

- Read `.forgeos/state.json` to determine the current development phase
- Respect gate checks — do not skip phases
- Load context from `.forgeos/memory/` when available

## Core Rules

1. **Check Phase**: Before making changes, verify the current phase in `.forgeos/state.json`
2. **Gate Enforcement**: Ensure required artifacts exist before advancing phases
3. **Memory**: Important decisions go to `.forgeos/memory/DECISIONS.md`
4. **Lessons**: Record learnings in `.forgeos/memory/LESSONS.md`

## Phase Gate Requirements

| Phase | Required Before Entry |
|-------|----------------------|
| Phase 1 | Project initialized (Phase 0 complete) |
| Phase 2 | Requirements documented (00-requirements.md) |
| Phase 3 | Analysis complete (01-analysis.md), Design done (02-design.md) |
| Phase 4 | Tasks planned (03-tasks.md) |
| Phase 5 | Development log started (04-dev-log.md) |
| Phase 6 | Tests written and passing (05-test-report.md) |
| Phase 7 | Code review complete (06-code-review.md) |
| Phase 8 | Release checklist verified (07-release-checklist.md) |

## Token Compression

Apply compression to memory files based on `.forgeos/config.yaml` caveman settings:
- `lite`: Keep first 500 chars
- `ultra`: Keep first 200 chars
- `extreme`: Keep first 100 chars

## Limitations

Copilot does not support hooks. Gate checks and memory loading must be done manually by reading the files.
