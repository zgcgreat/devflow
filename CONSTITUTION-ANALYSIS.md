# Shared Rules Analysis: devflow v3.0 Phase Skills to CONSTITUTION.md Candidates

> ⚠️ Historical document — references to "devflow" predate the "devflow-evo" rename.

Generated: 2026-05-20
Source: Phase 0-7 _SKILL.md under e:/LLM/skills/devflow/layers/L1-INTERACTION/phase-{0-7}-*/_SKILL.md

---

## CATEGORY 1: SHARED RULES (Appear in 2+ files) -- CONSTITUTION.md Candidates

### S1. Multi-Question User Confirmation Protocol (ALL 8 FILES)

Files: Phase 0 (L71-85), Phase 1 (L700-745), Phase 2 (L152-196), Phase 3 (L122-166),
Phase 4 (L323-367), Phase 5 (L140-184), Phase 6 (L492-536), Phase 7 (L800-844)

Every phase uses the identical pattern:
- 3 numbered questions, each with [1] recommended, [2] alternative, [3] alternative
- Question 3 always asks whether to proceed to next phase, with a rollback option
- After user reply, echo selections and ask binary confirm (1=confirm 2=modify)
- All cite: devflow-kit/references/user-interaction-guidelines.md

Constitution rule: USER-CONFIRM-PROTOCOL
Every Phase transition MUST use multi-question confirmation with 3 questions,
numbered options (recommended marked with arrow), and a binary echo-confirm step.
Question 3 MUST always ask about proceeding to next phase with rollback option.

---

### S2. Gate Check Table (ALL 8 FILES)

Files: Phase 0 (G0, L63), Phase 1 (G2, L577), Phase 2 (G2-PHASE2, L136),
Phase 3 (G4, L112), Phase 4 (G4-PHASE4, L377), Phase 5 (G5-PHASE5, L111),
Phase 6 (G3-PHASE6, L306), Phase 7 (Pre-flight, L73)

All use 3-column table: checking item | pass condition | failure handling.
All checks must PASS before proceeding. On FAIL, execute failure action then re-evaluate.
Gate IDs follow G{N} or G{N}-PHASE{M} pattern.

Constitution rule: GATE-CHECK-TABLE
Every Phase MUST define a gate check table with columns for check item, pass condition,
and failure handling. Gate IDs follow G{N} or G{N}-PHASE{M} pattern.

---

### S3. Error Taxonomy P0-P3 (ALL 8 FILES)

Files: Phase 0 (L93), Phase 1 (L805), Phase 2 (L273), Phase 3 (L223),
Phase 4 (L388), Phase 5 (L228), Phase 6 (L540), Phase 7 (L493)

Consistent severity definitions:
- P0 = BLOCKING: must stop, blocks downstream phases
- P1 = RECOVERABLE/HIGH: needs fix, conditional pass
- P2 = WARNING/MEDIUM: document and proceed, fix before completion
- P3 = INFO/LOW: note only, tech debt queue

Table columns: Level | Name | Symptom | Recovery Action | Wave Impact (optional)

Constitution rule: ERROR-TAXONOMY-P0-P3
Every Phase MUST define an Error Taxonomy with standardized P0-P3 severity levels.
P0 blocks all downstream. P1 allows conditional pass. P2 documents and proceeds.
P3 notes for awareness. Table columns: Level, Name, Symptom, Recovery Action.

---

### S4. Boundary Conditions Section (5 FILES)

Files: Phase 1 (L816), Phase 2 (L282), Phase 3 (L232), Phase 4 (L397), Phase 5 (L237)

All use subsections: Thresholds (quantitative limits with rationale),
Timeout (max execution time with fallback), Input Schema Validation (checklist).

Constitution rule: BOUNDARY-CONDITIONS
Every Phase MUST define Boundary Conditions with Thresholds, Timeout, and
Input Schema Validation subsections.

---

### S5. Input Schema Validation (5 FILES)

Files: Phase 2 (L293), Phase 3 (L243), Phase 4 (L409), Phase 5 (L249), Phase 6 (L42)

Checklist format: - [ ] {file} exists and has G{N} passed.
Execution must not proceed if any item fails.

Constitution rule: INPUT-SCHEMA-VALIDATION
Every Phase (except Phase 0) MUST validate prerequisite files and gate passes
before starting. Use checklist format.

---

### S6. Provider Routing (5 FILES)

Files: Phase 0 (L103), Phase 2 (L301), Phase 3 (L252), Phase 4 (L416), Phase 5 (L257)

Pattern: Phase N -> {model type}({reason}).
Categories: general model, high-creativity, high-analysis, high-code.

Constitution rule: PROVIDER-ROUTING
Every Phase MUST declare which model type to route to.

---

### S7. Anti-Patterns Section (2 FILES)

Files: Phase 1 (L1011-1029), Phase 7 (L756-774)

Pattern: X {Name}: {description} / Fix: {correct approach}.
Phase 1 has 6 anti-patterns, Phase 7 has 6 anti-patterns.

Constitution rule: ANTI-PATTERNS
Phases SHOULD document known anti-patterns with corrections in
X {Name} / Fix format.

---

### S8. Trigger-Based Reference Loading (4 FILES)

Files: Phase 2 (L82, tech-stacks.md), Phase 4 (L51, frontend-engineer-rules.md + ui-anti-patterns.md),
Phase 5 (L45, test-pyramid.md), Phase 6 (L85, ui-anti-patterns.md)

Pattern: Step 0 loads a reference from references/flow-kit-reference/ based on
trigger conditions, with explicit skip conditions.

Constitution rule: TRIGGER-REFERENCE-LOADING
Phases that depend on external references MUST define trigger conditions,
skip conditions, and loading steps as Step 0.

---

### S9. Rollback-on-Failure Protocol (6 FILES)

Files: Phase 1 (G2 FAIL->return Step 2, L617), Phase 2 (FAIL->redesign, L140),
Phase 3 (P0 UNRESOLVED_DEP->return Phase 2, L227), Phase 5 (FAIL->create fix Task,
return Phase 4, L188), Phase 6 (Stage A NOT_PASS->return Phase 3/4, L190;
Stage B FAIL->return Wave, L484), Phase 7 (auto-rollback on threshold breach, L329-406)

Constitution rule: ROLLBACK-ON-FAIL
Every Phase gate FAIL MUST define an explicit rollback target
(which Phase/Step to return to). Rollback is never implicit.

---

### S10. Implementation Checklist (2 FILES)

Files: Phase 1 (L981-1007), Phase 7 (L723-752)

Pattern: Before/During/After sections + Quality gates section, all as checklists.

Constitution rule: IMPLEMENTATION-CHECKLIST
Phases SHOULD provide Before/During/After checklists with quality gate items.

---

## CATEGORY 2: UNIQUE RULES (1 file only) -- Stay in Phase _SKILL.md

These rules appear in exactly ONE phase and are specific to that phase's domain.
They should NOT be moved to CONSTITUTION.md.

### U1. Constitution Gate -- Phase 2 ONLY (L61-80)
Step 0.5 reads .devflow/memory/constitution.md and validates design decisions
against it. No other phase performs constitution compliance checking.

### U2. 5 Whys Depth Limit / Per-Step Timeout / Convergence -- Phase 1 ONLY (L820-825)
Boundary conditions specific to root cause analysis: max 5 layers deep,
3 min per "why" question, convergence on single root cause.

### U3. DAG Construction / Kahn Algorithm / Wave Grouping -- Phase 3 ONLY (L68-83)
Phase 3 is the only phase that builds dependency graphs using Kahn's algorithm
and groups tasks into parallel Waves.

### U4. Wave Plan Converter / Markdown-to-YAML -- Phase 4 ONLY (L113-294)
Phase 4 has the unique Phase 3-to-Wave Plan converter that parses 03-tasks.md
(Markdown or XML) and outputs wave-plan.yaml.

### U5. Circuit Breaker -- Phase 4 ONLY (L405-407)
3 consecutive P0 failures on same file -> OPEN circuit, route to Phase 6
Specialist review. Wave total failure rate >50% -> recommend re-split in Phase 3.

### U6. Cross-Wave Test Matrix / AC Coverage >=90% -- Phase 5 ONLY (L95-109, L240)
Phase 5 is the only phase that checks cross-wave regression risk and enforces
the >=90% AC coverage threshold.

### U7. Two-Stage Separation / Specialist Sub-Agents -- Phase 6 ONLY (L161-184, L396-474)
Phase 6's design of Stage A (spec compliance) vs Stage B (code quality) with
independent reviewer agents (Blind Hunter, Edge Case Hunter) and specialist
sub-agents (security, performance, API contract, etc.) is unique.

### U8. Three-Stage Canary Rollout / Auto-Rollback Protocol -- Phase 7 ONLY (L116-406)
Phase 7's 10%->50%->100% deployment with automatic health checks and
rollback on threshold breach is unique to the deployment phase.

---

## CATEGORY 3: CROSS-PHASE PROHIBITIONS (Must NOT rules appearing in 2+ files)

### P1. Never Skip User Confirmation (6+ FILES)
Phase 1 (L1028-1029): "Skipping User Confirmation: Proceeding without
explicit approval. Fix: R8.2 rule -- wait for user Y before next phase."
Phase 2, 3, 4, 5, 6, 7: All enforce the multi-question confirmation
before proceeding. Never auto-advance without user OK.

### P2. Never Proceed Past a FAIL Gate (ALL 8 FILES)
Every phase enforces: gate FAIL = must not proceed. Failure handling is
always explicitly defined (rollback, fix, re-evaluate).

### P3. Never Mix Spec Compliance with Code Quality (Phase 6 explicitly, Phase 1 implicitly)
Phase 6 (L78): "Spec compliance and code quality are orthogonal concerns --
don't mix them." Phase 1 enforces testable ACs (spec) separate from
implementation (code).

### P4. Never Deploy Without Health Checks (Phase 4, 7)
Phase 4 (L383): Verify pass rate 100% required. Phase 7 (L758): "Skipping
Health Checks: Deploying without monitoring -> blind failures. Fix: Mandatory
health checks at every stage with auto-rollback."

---

## CATEGORY 4: SUMMARY MATRIX

Rule ID | Rule Name | P0 | P1 | P2 | P3 | P4 | P5 | P6 | P7 | Count
--------|-----------|----|----|----|----|----|----|----|----|------
S1 | USER-CONFIRM-PROTOCOL | Y | Y | Y | Y | Y | Y | Y | Y | 8
S2 | GATE-CHECK-TABLE | Y | Y | Y | Y | Y | Y | Y | Y | 8
S3 | ERROR-TAXONOMY-P0-P3 | Y | Y | Y | Y | Y | Y | Y | Y | 8
S4 | BOUNDARY-CONDITIONS | | Y | Y | Y | Y | Y | | | 5
S5 | INPUT-SCHEMA-VALIDATION | | | Y | Y | Y | Y | Y | | 5
S6 | PROVIDER-ROUTING | Y | | Y | Y | Y | Y | | | 5
S7 | ANTI-PATTERNS | | Y | | | | | | Y | 2
S8 | TRIGGER-REFERENCE-LOADING | | | Y | Y | | Y | Y | | 4
S9 | ROLLBACK-ON-FAIL | | Y | Y | Y | | Y | Y | Y | 6
S10 | IMPLEMENTATION-CHECKLIST | | Y | | | | | | Y | 2

P1 | Never Skip User Confirmation | Y | | Y | Y | Y | Y | Y | Y | 6+
P2 | Never Proceed Past FAIL Gate | Y | Y | Y | Y | Y | Y | Y | Y | 8
P3 | Never Mix Spec and Code Review | | Y | | | | | Y | | 2
P4 | Never Deploy Without Health Checks| | | | Y | | | | Y | 2
