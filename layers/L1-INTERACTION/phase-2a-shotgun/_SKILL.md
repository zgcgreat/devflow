---
name: phase-2a-shotgun
preamble-tier: 2
version: 3.0.0
description: |
  Multi-variant design generation — 4-6 design variants with trade-offs and AI recommendation.
layer: L1-INTERACTION
phase: 2a
requires: [g3-gate-decision, design-document]
provides: [variant-proposals, weighted-scores, g3.5-gate-decision]
parent: phase-2a-shotgun
dependencies:
  - phase-2-design
gate: G3.5
triggers:
  - design variant generation
  - shot gun design
  - multi-design exploration
  - phase 2a
allowed-tools:
  - Read
  - Write
  - Bash
  - Edit
  - AskUserQuestion
---

# Phase 2a: Design Shotgun — Multi-Variant Design Generation

> **前置产物**: `02-design.md` (Phase 2 通过 G3)
> **后置产物**: `02a-design-variants.md` + `02a-design-final.md`
> **门控**: G3.5 — Variant Selection Gate

## 核心定位

生成 4-6 设计变体，含优劣势和加权评分，AI 推荐最佳选项，用户选择。

## 产物

- `02a-design-variants.md` — 4-6 变体 (含优劣势、维护性评分)
- `02a-design-final.md` — 最终选定方案 (含加权评分矩阵)

## 执行流程

详见 `docs/phases/phase-2a-shotgun.md`

## Error Taxonomy

| Level | Name | Recovery | Impact |
|-------|------|----------|--------|
| P0 | BLOCKING (all variants eliminated / user rejects top 2x) | Regenerate with expanded dimensions or hybrid | Blocks Phase 3 |
| P1 | RECOVERABLE (insufficient diversity / no weighted score) | Re-generate with forced diversity | Delays selection |
| P2 | WARNING (one variant <3/5 maintainability but UX superior) | Document trade-off, proceed | No blocking |
| P3 | INFO (minor scoring sensitivity) | Note limitation | No impact |

## Boundary Conditions

| Threshold | Value |
|-----------|-------|
| Min variants | 4 (mandatory) |
| Max variants | 5 (cap) |
| Timeout per batch | ≤15 min |
| Maintainability floor | ≥3/5 for viable variant |

## ForgeOS 增强

**Persona**: designer (always) + code-explorer (on-demand)
**Hook**: phase-transition, context-monitor
