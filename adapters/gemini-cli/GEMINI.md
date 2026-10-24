# DevFlow Workflow — Gemini CLI Extension

## Core Rules

This project uses DevFlow v3.0 phased workflow. Follow these instructions:

### Phase Awareness
- Read `.devflow/state.json` to determine current phase
- Respect gate checks — do not skip phases
- Load memory from `.devflow/memory/` for project context

### Phase Gate Requirements

Artifacts live under `.devflow/<req-id>/`. Each phase's exit gate requires its artifact:

| Phase | Artifact (Gate) |
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

Mode trimming: `fast` starts at 04-wave-logs.md; `lean` starts at 02-design.md; no 03-tasks.md unless `strict`.

### Memory Management
- Decisions: `.devflow/memory/DECISIONS.md`
- Lessons: `.devflow/memory/LESSONS.md`
- Known Failures: `.devflow/memory/KNOWN_FAILURES.md`
- Patterns: `.devflow/memory/PATTERNS.md`

### Token Compression
Apply compression based on `.devflow/config.yaml` caveman.level setting:
- lite: 500 chars/file
- ultra: 200 chars/file
- extreme: 100 chars/file
