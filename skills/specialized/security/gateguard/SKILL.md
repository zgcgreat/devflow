---
name: gateguard
description: |
  Gate-based quality enforcement for all Phase transitions. Ensures mandatory
  checks pass before advancing to next Phase. Hook-aware gate with recommendation
  and human override support.
  Use when: "gate check", "gate enforcement", "quality gate".
source: ECC skills/gateguard/SKILL.md
mapped_phase: all
---

# GateGuard Skill

> 安全底线: 见 rules/prompt-defense-baseline.md

## Gate Enforcement Model

### Standard Gate Flow
1. **Hook自动检查(推荐)** — Run mapped Hooks
   - ALL PASS → Show report → Step 2
   - HOOK FAIL → Show FAIL reason + recommend FAIL → Step 2
   - HOOK ERROR → Degraded WARNING → Show Markdown checklist → Step 2
2. **人工决策(最终)** — User makes final decision
   - User can override Hook recommendation (record reasoning)
   - Per Constitution Rule 8: final decision authority is human

### Gate Severity Levels
- CRITICAL: Must resolve before proceeding
- HIGH: Should resolve, can proceed with documented risk
- MEDIUM: Note for future resolution
- LOW: Informational

### Gate Categories by Phase
| Gate | Phase | Required Checks |
|------|-------|----------------|
| G0 | P0→P1 | Seeds exist, scope defined |
| G1 | P1→P2 | Root causes identified, stories complete |
| G3 | P2→P3 | Design documented, alternatives evaluated |
| G4 | P3→P4 | Tasks defined, DAG constructed |
| G5 | P4→P5 | Build complete, format+console hooks pass |
| G6 | P5→P6 | Tests pass, security scan pass |
| G7 | P6→P7 | Review complete, format+security hooks pass |
| G8 | P7→P8 | Archive complete, lessons extracted |
