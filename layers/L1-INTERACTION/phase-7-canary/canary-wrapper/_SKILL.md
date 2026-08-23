---
name: canary-wrapper
version: 3.0.0
layer: L1-INTERACTION
phase: 7
parent: phase-7-canary
gate: G7.5
requires: []
provides: [script-lifecycle-report, health-check-log, rollback-log, g7.5-gate-decision]
dependencies:
  - phase-7-canary (module dependency)
description: Lifecycle wrapper that manages canary-health-check.sh and auto-rollback.sh scripts, ensuring proper initialization, execution, error handling, and cleanup during Phase 7 canary deployments
triggers:
  - canary deployment starts
  - health check triggered
  - auto-rollback needed
  - canary stage completes
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
runtime-inputs: [deploy-ready]
---

# Canary Wrapper — Script Lifecycle Management for Phase 7

Manages the full lifecycle of `canary-health-check.sh` and `auto-rollback.sh` scripts used in canary deployments. Ensures scripts are found, validated, executed with correct parameters, and their outputs are captured and reported.

**Core responsibility**: This wrapper skill is the single point of control for all script-based operations during Phase 7. It verifies script availability, launches them with stage-appropriate parameters, monitors execution, and generates lifecycle reports.

---

## Error Taxonomy

| Priority | Condition | Script(s) Affected | Recovery Action |
|----------|-----------|-------------------|-----------------|
| **P0** | Canary deployment unhealthy after N consecutive health check failures (N >= 3) | canary-health-check.sh, auto-rollback.sh | Trigger auto-rollback immediately; if rollback also fails, escalate to on-call with full diagnostic logs |
| **P1** | Auto-rollback script fails to execute or returns non-zero exit code | auto-rollback.sh | Retry once with fallback parameters; if still failing, use manual rollback via `kubectl rollout undo` and continue monitoring |
| **P2** | Health check script not found or executable in expected path | canary-health-check.sh | Locate script in alternative path; if absent, inline the health check logic from phase-7-canary/_SKILL.md Step 2/3 |
| **P3** | Rollback target version not explicitly specified or ambiguous | auto-rollback.sh | Default to previous stable version (last successful G4 gate); log warning and continue with enhanced monitoring |

---

## Boundary Conditions

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| max_canary_cycles | 3 | Maximum consecutive canary stages before mandatory pause or rollback |
| rollback_threshold | error_rate > 5% | Upper bound: if error rate exceeds 5%, force immediate rollback regardless of stage |
| health_check_interval | 60s minimum | Balances detection speed with monitoring overhead |
| script_timeout_seconds | 300 (5 min) | Prevents hanging scripts from blocking deployment pipeline |
| max_retries_on_failure | 2 | Retry a failed script invocation up to 2 times before escalation |

---

## Script Inventory

### canary-health-check.sh

**Purpose**: Monitors a specific canary stage's health metrics at regular intervals and triggers rollback on threshold breach.

**Lifecycle**:
1. **Initialization**: Verify script exists at `layers/L1-INTERACTION/phase-7-canary/_SKILL.md` (inline) or extract from parent skill
2. **Execution**: Run with parameters `$STAGE $DURATION_MINUTES $THRESHOLD_ERROR_RATE`
3. **Monitoring**: Track stdout for metric snapshots and threshold checks
4. **Completion**: Capture exit code (0 = pass, 1 = threshold breach)
5. **Reporting**: Append health check log to deployment report

**Parameters**:
- `$1` — Stage identifier: `1`, `2`, or `3` (Canary-1, Canary-2, Production)
- `$2` — Observation duration in minutes
- `$3` — Error rate threshold percentage for that stage

### auto-rollback.sh

**Purpose**: Executes the rollback procedure when a health check fails, reverting to the previous stable version and generating a rollback report.

**Lifecycle**:
1. **Initialization**: Load current deployment config to identify rollback target
2. **Execution**: Run with parameters `$STAGE $REASON`
3. **Verification**: Confirm rollback success by re-checking error_rate post-rollback
4. **Reporting**: Generate structured rollback report at `.forgeos/<req-id>/rollback-report.md`

**Parameters**:
- `$1` — Stage from which rollback was triggered (1, 2, or 3)
- `$2` — Reason string describing why rollback was triggered

---

## Output Template

### Health Check Lifecycle Report

```markdown
# Canary Health Check — Script Lifecycle Report

**Script**: canary-health-check.sh
**Stage**: {1 | 2 | 3}
**Timestamp**: {YYYY-MM-DD HH:mm:ss}

| Phase | Status | Details |
|-------|--------|---------|
| Initialization | {FOUND/MISSING/EXTRACTED} | Script location: {path or "extracted from parent"} |
| Parameter Validation | {VALID/INVALID} | stage={$STAGE} duration={$DURATION_MINUTES}s threshold={$THRESHOLD_ERROR_RATE}% |
| Execution | {RUNNING/PASSED/FAILED/TIMEOUT} | Exit code: {$?}, Duration: {actual_seconds}s |
| Output Capture | {SUCCESS/FAILED} | Logs stored at: {log_file_path} |
| Threshold Check | {PASSED/BREACHED/UNKNOWN} | Max error_rate observed: {value}% vs threshold: {threshold}% |

**Result**: {PASS → Proceeding to next stage / FAIL → Triggering auto-rollback}
```

### Rollback Lifecycle Report

```markdown
# Auto-Rollback — Script Lifecycle Report

**Script**: auto-rollback.sh
**Trigger Stage**: {1 | 2 | 3}
**Timestamp**: {YYYY-MM-DD HH:mm:ss}

| Phase | Status | Details |
|-------|--------|---------|
| Initialization | {SUCCESS/FAILED} | Rollback target: {previous_version_hash_or_tag} |
| Parameter Validation | {VALID/INVALID} | stage={$STAGE} reason="$REASON" |
| Execution | {RUNNING/SUCCEEDED/FAILED/TIMEOUT} | Exit code: {$?}, Duration: {actual_seconds}s |
| Post-Rollback Verification | {PASSED/FAILED} | error_rate post-rollback: {value}% (target: <0.5%) |
| Report Generation | {SUCCESS/FAILED} | Report saved at: {path/to/rollback-report.md} |

**Result**: {ROLLBACK SUCCESSFUL → Resuming monitoring / ROLLBACK FAILED → Escalating to on-call}
```

---

## Ownership & Delegation

This wrapper skill owns the lifecycle of two scripts:

- **canary-health-check.sh** — Managed by `canary-wrapper` during all canary stages (Step 2, Step 3, Step 4 of phase-7-canary)
- **auto-rollback.sh** — Managed by `canary-wrapper` whenever any health check breaches its threshold (Step 5 of phase-7-canary)

**Delegation rules**:
- The wrapper extracts inline scripts from `phase-7-canary/_SKILL.md` if not available as standalone files
- All script invocations pass through this wrapper for consistent parameter validation and logging
- If a script fails P0 or P1, the wrapper logs the full execution context before escalation

---

## Integration with Phase 7

This wrapper is invoked by `phase-7-canary` at these points:

1. **Before Canary-1**: `canary-wrapper` validates both scripts are available and extracts if needed
2. **During each stage**: `canary-wrapper run-health-check $STAGE $DURATION $THRESHOLD`
3. **On threshold breach**: `canary-wrapper run-rollback $STAGE "$REASON"`
4. **After deployment**: `canary-wrapper generate-final-report` — aggregates all lifecycle logs into the canary report

---

## Version History

- **v1.0** (2026-05-18): Initial creation to resolve audit finding P1-2 (F) — External scripts orphaned in Phase 7
  - Added structured lifecycle management for canary-health-check.sh and auto-rollback.sh
  - Defined error taxonomy (P0-P3) specific to script operations
  - Established boundary conditions and ownership rules
