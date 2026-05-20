---
name: graduation
version: 3.0.0
layer: L2-ENGINE
gate: internal
parent: learning-workflow
requires: [learnings-files, phase-transition]
provides: [project-patterns, graduation-backlog]
source: get-shit-done graduation.md (adapted to devflow-evo)
description: Cross-phase pattern clustering and promotion from LEARNINGS → project-level knowledge
---

# Graduation — 跨 Phase 模式聚类与知识提升

> **Layer**: L2-ENGINE (LearningWorkflow 闭环关键缺环)  
> **触发时机**: Phase 过渡时（Phase N 完成 → Phase N+1 开始）  
> **前置产物**: 最近 N 个 Phase 的 `LEARNINGS.md` 文件  
> **后置产物**: `PROJECT.md` / `PATTERNS.md` 追加 + `STATE.md` graduation_backlog 更新  
> **版本**: v3.1-draft

## Graduation 在 LearningWorkflow 闭环中的位置

```
当前闭环（缺环）:
Phase 4 Wave完成 → LESSONS.md(失败教训) → 下次Wave加载 → ❌ 缺少跨Phase模式识别 → ❌ 缺少知识提升

完整闭环（补充后）:
Phase 4 Wave完成 → LESSONS.md → Phase过渡Graduation聚类 → HITL确认 → PROJECT.md/PATTERNS.md(项目级知识)
```

**为什么是 LearningWorkflow 的唯一缺环**: devflow-evo 的 LearningWorkflow 负责提取 LESSONS（记录教训），但缺少自动发现跨 Phase 模式并提升到项目级知识的能力。Graduation 填补了"记录教训→识别规律→提升到项目级知识"的完整闭环。

## Configuration

```yaml
# In project config (defaults)
features:
  graduation_enabled: true        # Master on/off switch
  graduation_window: 5            # How many prior phases to scan
  graduation_threshold: 3         # Minimum distinct phases for cluster surface
```

## Step 1: Guard Checks

**Silently skip if:**
- `graduation_enabled` is `false`
- Fewer than `graduation_threshold` completed phases with LEARNINGS.md exist
- Total items across all LEARNINGS.md files in window < 5

## Step 2: Collect LEARNINGS.md Files

Find LEARNINGS.md files from the last N completed phases (excluding current phase):

For each file:
1. Parse sections: `Decisions`, `Lessons`, `Patterns`, `Surprises`
2. Extract each item as record: `{ category, title, body, source_phase }`
3. **Skip items** with `**Graduated:**` marker (already promoted)

## Step 3: Jaccard Similarity Clustering

For each category independently, cluster items using Jaccard similarity on tokenized title+body:

**Tokenization**: lowercase, strip punctuation, split on whitespace, remove stop words.

**Jaccard similarity**: `|A ∩ B| / |A ∪ B|` where A and B are token sets. Similarity ≥ 0.25 = same cluster.

**Clustering algorithm**: single-pass greedy — process items in phase order; add to first cluster whose centroid (union of all cluster tokens) has similarity ≥ 0.25 with new item; otherwise start new cluster.

**Cluster size filter**: only surface clusters with distinct source phases ≥ `graduation_threshold` (not total items — same item in one phase counts as 1).

## Step 4: Check graduation_backlog in STATE.md

Read `.planning/STATE.md` or `memory/STATE.md` `graduation_backlog` section:

```yaml
graduation_backlog:
  - cluster_id: "{sha256-of-cluster-title}"
    status: "dismissed"   # or "deferred"
    deferred_until: "phase-N"  # only for deferred
    cluster_title: "{representative title}"
```

- Skip any `cluster_id` with `status: dismissed`
- Skip any `status: deferred` where `deferred_until` phase not yet completed

## Step 5: Surface Promotion Candidates

For each qualifying cluster, determine suggested target:

| Category | Suggested Target |
|----------|-----------------|
| `decisions` | `PROJECT.md` — append under `## Validated Decisions` |
| `patterns` | `PATTERNS.md` — append under appropriate section |
| `lessons` | `PROJECT.md` — append under `## Invariants` |
| `surprises` | Flag for human review — if genuinely surprising 3+ times, structural issue |

Print graduation report:

```text
📚 Graduation scan across phases {M}–{N}:

  HIGH RECURRENCE ({K}/{WINDOW} phases)
  ├─ Cluster: "{representative title}"
  ├─ Category: {category}
  ├─ Sources: {phase-N-LEARNINGS, phase-M-LEARNINGS}
  └─ Suggested target: {target file} § {section}

For each cluster, choose: P = Promote / D = Defer / X = Dismiss / A = All remaining
```

## Step 6: HITL — Process Each Cluster

For each cluster (in order), ask developer for action:

### On `P` (Promote now):
1. Read target file (or create with standard header)
2. Append under suggested section:
   ```markdown
   ### {Cluster representative title}
   {Merged body — combine unique sentences across cluster items}

   **Sources:** Phase {A}, Phase {B}, Phase {C}
   **Promoted:** {ISO_DATE}
   ```
3. For each source LEARNINGS.md item, append `**Graduated:** {target-file}:{ISO_DATE}` after its last field
4. Commit: `docs(learnings): graduate "{cluster title}" to {target-file}`

### On `D` (Defer):
Write to `STATE.md` graduation_backlog:
```yaml
- cluster_id: "{sha256}"
  status: "deferred"
  deferred_until: "phase-{NEXT_PHASE_NUMBER}"
  cluster_title: "{title}"
```

### On `X` (Dismiss):
Write to `STATE.md` graduation_backlog:
```yaml
- cluster_id: "{sha256}"
  status: "dismissed"
  cluster_title: "{title}"
```

### On `A` (Defer all):
Defer current cluster and skip all remaining. Print:
```text
[graduation: deferred all remaining clusters to next transition]
```

## Step 7: Completion Report

After processing all clusters:
```text
Graduation complete: {N} promoted, {M} deferred, {K} dismissed.
```

If no clusters qualified:
```text
[graduation: no qualifying clusters in phases {M}–{N}]
```

## First-Run Behavior

On first transition after upgrading, all extant LEARNINGS.md files may produce large batch. Use `A` (Defer all) to avoid overwhelming developer.

## No-Op Conditions

- `graduation_enabled = false`
- Fewer than `graduation_threshold` prior phases with LEARNINGS.md
- Total items < 5 across window
- All qualifying clusters in `graduation_backlog` as dismissed

## Relationship to LearningWorkflow Durable vs Temporary (v3.1)

```yaml
# Graduation integration with Step 0 classification
if cluster_suggested_target == PROJECT.md or PATTERNS.md:
    category: DURABLE fact → promoted to domain knowledge
elif cluster_suggested_target == STATE.md backlog:
    category: TEMPORARY note → defers for next scan
```

**Key insight**: Graduation output is the primary mechanism for converting `LESSONS.md` temporary observations into `PROJECT.md`/`PATTERNS.md` durable facts. This completes the LearningWorkflow durability pipeline.

## Real-World Impact (from get-shit-done)

- Catches recurring issues invisible at single-phase level
- Example: "auth refresh race condition" appearing in Phase 2, 4, 6 individually → promoted to PATTERNS.md after 3-phase threshold reached
- Prevents same class of bug reappearing in future phases

---

> **Adapted from**: get-shit-done `workflows/graduation.md` (~196 lines)  
> **Adaptation date**: 2026-05-17  
> **Key changes from original**: Integrated with devflow-evo's Step 0 Durable/Temporary classification; uses STATE.md instead of `.planning/STATE.md`; aligned cluster_id hash scheme
