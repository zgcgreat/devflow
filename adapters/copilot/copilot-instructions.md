# DevFlow Workflow Integration

This project uses devflow v3.0 phased workflow. As a GitHub Copilot assistant, follow these rules:

## Phase Awareness

- Read `.devflow/state.json` to determine the current development phase
- Respect gate checks — do not skip phases
- Load context from `.devflow/memory/` when available

## Core Rules

1. **Check Phase**: Before making changes, verify the current phase in `.devflow/state.json`
2. **Gate Enforcement**: Ensure required artifacts exist before advancing phases
3. **Memory**: Important decisions go to `.devflow/memory/DECISIONS.md`
4. **Lessons**: Record learnings in `.devflow/memory/LESSONS.md`

## Phase Gate Requirements

Artifacts live under `.devflow/<req-id>/`. Before advancing past a phase, its exit gate requires the corresponding artifact:

<!-- devflow:generated:artifacts START -->
| Phase | Exit Artifact (Gate) |
|-------|-----------------|
| Phase 0 | 00-strategy.md (G0) |
| Phase 1 | 01-analysis.md (G1; plus manual gate G2) |
| Phase 1.5 | 01b-context.md (G2.5) |
| Phase 2 | 02-design.md (G3) |
| Phase 2.5 | 02a-variants.md (G3.5) |
| Phase 3 | 03-tasks.md (G4, strict mode only) |
| Phase 4 | 04-wave-logs.md (G5) |
| Phase 5 | 05-test-report.md (G6) |
| Phase 6 | 06-review.md (G7) |
| Phase 7 | 07-canary.md (G7.5) |
| Phase 8 | 08-archive.md (G8) |
<!-- devflow:generated:artifacts END -->

Mode trimming: `fast` starts at 04-wave-logs.md; `lean` starts at 02-design.md; no 03-tasks.md unless `strict`.

## Token Compression

Apply compression to memory files based on `.devflow/config.yaml` caveman settings:
- `lite`: Keep first 500 chars
- `ultra`: Keep first 200 chars
- `extreme`: Keep first 100 chars

## Limitations

Copilot does not support hooks. Gate checks and memory loading must be done manually by reading the files.
