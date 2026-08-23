# ForgeOS Workflow — Gemini CLI Extension

## Core Rules

This project uses ForgeOS v3.0 phased workflow. Follow these instructions:

### Phase Awareness
- Read `.forgeos/STATE.md` to determine current phase
- Respect gate checks — do not skip phases
- Load memory from `.forgeos/memory/` for project context

### Phase Gate Requirements

| Phase | Required Artifacts |
|-------|-------------------|
| Phase 1 | 00-requirements.md |
| Phase 2 | 01-analysis.md |
| Phase 3 | 02-design.md, 03-tasks.md |
| Phase 4 | 03-tasks.md |
| Phase 5 | 04-dev-log.md |
| Phase 6 | 05-test-report.md |
| Phase 7 | 06-code-review.md |
| Phase 8 | 07-release-checklist.md |

### Memory Management
- Decisions: `.forgeos/memory/DECISIONS.md`
- Lessons: `.forgeos/memory/LESSONS.md`
- Known Failures: `.forgeos/memory/KNOWN_FAILURES.md`
- Patterns: `.forgeos/memory/PATTERNS.md`

### Token Compression
Apply compression based on `.forgeos/config.yaml` caveman.level setting:
- lite: 500 chars/file
- ultra: 200 chars/file
- extreme: 100 chars/file
