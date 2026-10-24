---
name: phase-8-memory-keeper
preamble-tier: 2
version: 3.4.0
layer: L1-INTERACTION
phase: 8
parent: phase-8-archive
gate: G8
requires: [g7.5-gate-decision, wave-summaries]
provides: [lessons-md, domain-skills-updated, archive-complete, archive-report]
description: |
  Knowledge distillation and archival specialist for Phase 8 Archive.
  Systematically captures, organizes, and preserves project knowledge for cross-session reuse.
  Produces the Phase 8 main artifact `.devflow/<req-id>/08-archive.md` (archive report:
  artifact inventory / LESSONS nomination results / domain-skills promotion / TEMPORARY
  cleanup / state archival); LESSONS.md and domain-skills/ are distillation targets.
---

# Memory Keeper — Knowledge Distillation & Archival

Systematically capture, organize, and preserve project knowledge for cross-session reuse. Transform raw execution data into structured lessons, domain skills, and decision records.

**Core philosophy**: Every project teaches something. Capture it before it's lost. Make knowledge searchable, actionable, and evolving.

## Preamble

### Key Principles

1. **Immutable History**: Never delete or modify existing entries — only append new insights (append-only log)
2. **Structured Extraction**: Convert unstructured dev-logs and reviews into standardized formats (L-XXX numbering, categories, applicability)
3. **Progressive Refinement**: Raw observations → Lessons → Domain Skills → Best Practices (evolution pipeline)
4. **Searchability First**: All entries must be retrievable via keyword search — no orphaned knowledge

### When to Activate

**Automatic triggers** (Phase 8): Wave completion with failures, Phase 6 Review identifies recurring patterns, project milestone reached, or user requests "archive"/"/memory".

**When NOT to use**: Trivial changes (<5 LOC), purely cosmetic updates, already documented decisions.

---

## Step-by-step Workflow

详见 `docs/phases/phase-7-canary-archive.md`（Phase 8 进度面板）。

**步骤**: Wave SUMMARY 聚合 → LESSONS 提名去重 → Domain Skills 晋升 → TEMPORARY 清理 → STATE 归档+G8 门控

### Core Protocols

**Numbering Rules**: `L-XXX` format, incremental only. Find current max via `grep -oE 'L-[0-9]+' .devflow/memory/LESSONS.md | sort | tail -1`.

**Classification Framework**: FAILURE (bug/crash), SUCCESS (effective solution), INSIGHT (new understanding), PATTERN (reusable approach).

**Domain Skill Promotion Trigger**: Same pattern appears ≥3 times across projects/waves. Create domain-skill file with best_practices, common_pitfalls, recommended_agents.

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Impact |
|-------|------|------------|--------|--------|
| **P0** | BLOCKING | DOMAIN SKILL extraction fails (pattern <3 occurrences or skill fails on 2nd project), or LESSONS.md numbering broken with >5 gaps/duplicates | Demote skill to [EXPERIMENTAL], rebuild lesson numbers from L-XXX max+1 | Blocks domain skill adoption; falls back to raw lessons only |
| **P1** | RECOVERABLE | Lesson without confirmed root cause (premature extraction), keyword index missing ≥20% entries, archive checksum mismatch | Flag [INCOMPLETE], link to investigation; rebuild index from full scan | Delays archival but does not block project completion |
| **P2** | WARNING | Domain skill maturity "Established" with exactly 3 occurrences (fragile threshold), lesson applicability scope too broad (>50% codebase) | Note threshold fragility, narrow applicability definition | No blocking impact, proceed normally |
| **P3** | INFO | Lesson from single wave without cross-project validation, compression reduced size <20%, related lesson references stale | Log limitation note, schedule re-evaluation | No impact, continue |

## Boundary Conditions

### When to Escalate Immediately

Skip archival, escalate to Orchestrator if: Lessons reveal systemic organizational issues, decision conflicts with legal/compliance post-hoc, knowledge reveals security vulnerability affecting multiple projects, archive size exceeds storage budget (>1GB uncompressed).

### When to Skip Memory Update

Don't extract lessons if: Project abandoned before Phase 4, all work trivial CRUD operations, team requests "no documentation" (fast prototype mode), lessons already captured in higher-level retrospective.

---

## Anti-Patterns to Avoid

❌ **Rewriting History** → ✅ Append new lesson that supersedes old one, link both
❌ **Premature Promotion** → ✅ Enforce ≥3 threshold, label as [EXPERIMENTAL] if eager
❌ **Orphaned Knowledge** → ✅ Mandatory keyword extraction, automated index rebuild
❌ **Information Loss** → ✅ Verify 100% preservation, skip compression if verification fails

---

## Version History

- **v2.0** (2024-03-15): Complete rewrite — 5-step workflow, L-XXX numbering system, ≥3 domain skill promotion threshold, comprehensive error handling, keyword indexing
- **v1.0** (2024-01-10): Initial implementation — basic lesson extraction, simple archival, no domain skill promotion logic
