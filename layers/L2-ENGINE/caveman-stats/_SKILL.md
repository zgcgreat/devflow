---
name: caveman-stats
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: []
provides: [stats-report, badge-display]
description: >
  Session token usage tracking with caveman-style badge display.
  Reports lifetime tokens saved, current session savings, and USD equivalent.
  Triggers: /caveman-stats or auto at phase transitions.
source: caveman skills/caveman-stats
external-inputs: [session-log, compression-log]
---

# Caveman Stats — Token 节省统计

## Purpose

Phase 4-5（高 Token 消耗阶段）实时显示压缩效果。
让节省量"可见"，激励压缩操作。

## 输出格式

### 状态栏徽章（简洁版）

```
[CAVEMAN] ⛏ 12.4k saved
```

### 详细统计（/caveman-stats 触发）

```
[CAVEMAN] Session Stats
─────────────────────
Lifetime saved:   124.5k tokens (~$2.49)
Current session:   18.2k tokens (~$0.36)
Compression rate:   67%
Files compressed:       4
Phase 4-5 savings:   12.1k tokens (~$0.24)

📊 Breakdown by Phase:
  Phase 4 (Build):  8.3k saved (ultra)
  Phase 5 (Test):   3.8k saved (ultra)
  Phase 6 (Review): 0.6k saved (lite)
  Phase 8 (Archive): 0.5k saved (ultra)
─────────────────────
```

## 集成点

### Phase 4 (Build) — Wave 级统计

每个 Wave 结束后更新：

```
[CAVEMAN] ⛏ Wave 1: 2.3k saved (ultra compress)
[CAVEMAN] ⛏ Wave 2: 3.1k saved (ultra compress)
```

### Phase 5 (Test) — 压缩效果报告

测试金字塔执行完毕后，报告压缩节省：

```
[CAVEMAN] Phase 5: 3.8k saved (ultra compress)
  - Test descriptions: 1.2k saved
  - Test fixtures:     2.6k saved
```

### Phase 8 (Archive) — 最终统计

归档时输出完整会话统计：

```
[CAVEMAN] Session Complete
─────────────────────
Total saved:    124.5k tokens (~$2.49)
Files compressed:       4
Compression rate:   67%
Best saving: Phase 4 (Build) — 8.3k tokens
─────────────────────
LESSONS.md updated. Archive done.
```

## USD 估算

默认估算：0.00002 USD / 1k tokens（基于 GPT-4o 价格）
可配置：`CAVEMAN_USD_RATE=0.00002`

## 与 token-compression-v2 的关系

- token-compression-v2 执行压缩
- caveman-stats 记录压缩前后的 token 差值
- 两者通过 compression-log 关联

## Boundaries

- 仅统计输出 token（thinking token 不计入）
- USD 为估算值，实际价格因模型/提供商而异
- 状态栏徽章仅在 Phase 4-5 高消耗阶段显示
- Phase 0-3/6-7/8 低消耗阶段不显示徽章

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Execution Impact |
|-------|------|------------|--------|------------------|
| **P0** | BLOCKING | Core operation fails with unrecoverable state corruption | Halt, rollback to last checkpoint, escalate | Blocks dependent operations |
| **P1** | RECOVERABLE | Operation fails but state remains consistent | Retry 3x with exponential backoff (1s→2s→4s); if still fails → document, mark NEEDS_WORK | No cross-skill impact |
| **P2** | WARNING | Operation succeeds with quality degradation | Document in SUMMARY, do NOT block execution | Continue normally |
| **P3** | DEGRADATION | Operation timeout or resource exhaustion | Cancel current sub-operation, mark PARTIAL_PASS, log to heartbeat | Cancels current op; next cycle may proceed |

**Severity Assignment Rules**:
- Default to P1 for any operation failure
- Escalate to P0 if state corruption detected or dependent operations affected
- Never demote: once P0, only manual override can clear

## Boundary Conditions

### When to Escalate Immediately
- Operation produces corrupted output → halt and rollback
- Dependency unavailable and no fallback → halt, report missing dependency

### When to Skip Operation
- Input preconditions not met → skip, log reason, proceed to next step
- Already completed in current session → skip (idempotency)

### Degradation Path
1. Full operation → 2. Retry with backoff → 3. Fallback/skip → 4. Halt and report
