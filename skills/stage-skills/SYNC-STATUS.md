# Stage Skills Sync Status

> **DEPRECATED**: Stage skills are superseded by `layers/L1-INTERACTION/phase-*` modules in devflow-evo v3.0.
> Do not create new content in stage-skills. All new development should go to the corresponding phase module.
> See mapping table below for the canonical replacement.

- **Last Synced**: 2026-05-18
- **Core Version**: v3.0-draft
- **Stage Skills Version**: v3.0-draft (must match)
- **Owner**: L2-ENGINE team
- **Deprecation Date**: 2026-05-19

## Sync Mapping

| Stage Skill | Core Skill | Status | Last Verified |
|-------------|------------|--------|---------------|
| stage-2-design | phase-2-design | needs-verify | 2026-05-18 |
| stage-3-task | phase-3-task-plan | needs-verify | 2026-05-18 |
| stage-3a-plan | phase-3-task-plan (sub) | needs-verify | 2026-05-18 |
| stage-4-dev | phase-4-build | needs-verify | 2026-05-18 |
| stage-5-test | phase-5-test | needs-verify | 2026-05-18 |
| stage-6-review | phase-6-review | needs-verify | 2026-05-18 |
| stage-7-integration | phase-7-canary | needs-verify | 2026-05-18 |
| stage-orchestrator | phase-4-build (orch) | needs-verify | 2026-05-18 |

## Sync Verification Checklist

- [ ] All version fields match core skills
- [ ] No deprecated fields in stage skills
- [ ] Error Taxonomy P0-P3 sections present in all stage skills
- [ ] Boundary Conditions sections present
- [ ] YAML frontmatter valid on all files

## Divergence Log

| Date | Core Change | Stage Action | Result |
|------|-------------|--------------|--------|
| 2026-05-18 | Sprint 8: E-P2-1/R22 Quality Scoring added | Updated SYNC-STATUS.md tracking | Created |

---

_Sync policy: See RULES-v3.md R23_
