---
name: phase-7-canary
version: 3.0-draft
layer: L1-INTERACTION
phase: 7
description: Deploy changes in staged batches (10% → 50% → 100%) with automatic health checks and rollback on threshold breach
requires: [g3-gate, all-tests-passed]
provides: [canary-report, rollback-report, g5-gate-decision]
gate: G5
---

# Phase 7: Canary Gradual Rollout — Zero-Downtime Deployment

Deploy changes in staged batches (10% → 50% → 100%) with automatic health checks and rollback on threshold breach. Ensures production stability while minimizing user impact.

**Core philosophy**: Never deploy blindly. Every batch has a safety net. If something breaks, roll back automatically before users notice.

---

## Preamble

### Key Principles

1. **Three-Stage Rollout**: Canary-1 (10%, 5min observation) → Canary-2 (50%, 10min observation) → Production (100%, continuous monitoring) — each stage validates before proceeding
2. **Auto Health Check**: Monitor error_rate, latency_p99, resource_usage at each stage — breach threshold triggers automatic rollback
3. **Zero-Downtime Guarantee**: Previous version remains active until new version passes all health checks — no service interruption
4. **Emergency Mode**: For P0/P1 incidents, skip non-critical gates but enforce post-deployment close gate (24h/72h/1week deadlines)

### When to Activate

**Automatic triggers** (Phase 6 G3 PASS):
- Code review passed (G3)
- All tests passed (Phase 5)
- User requests deployment

**Manual trigger**:
```
/canary deploy --env production --strategy gradual
```

**When NOT to use**:
- Pure documentation changes (no code logic)
- Development/staging environment (direct deploy OK)
- Emergency hotfix requiring immediate full rollout

---

## Step-by-step Workflow

### Step 1: Pre-flight Validation

**Verify deployment readiness**:

```bash
# Check G3 review status
grep "^G3 Result:" .ultimate-workflow/<req-id>/06-review.md

# Expected: "G3 Result: PASS"
if [ $? -ne 0 ]; then
  echo "❌ G3 review not passed, cannot proceed to canary"
  exit 1
fi

# Check Phase 5 test results
grep "^Test Result:" .ultimate-workflow/<req-id>/05-test-results.md

# Expected: "Test Result: ALL PASSED"
if [ $? -ne 0 ]; then
  echo "❌ Tests not passed, cannot proceed to canary"
  exit 1
fi

# Verify deployment target configured
if [ ! -f ".ultimate-workflow/deploy-config.yaml" ]; then
  echo "⚠️ No deploy config found, using defaults"
fi
```

**Output format**:
```markdown
## Pre-flight Validation

**G3 Review Status**: ✅ PASS  
**Phase 5 Tests**: ✅ ALL PASSED ({passed}/{total})  
**Deployment Target**: {production|staging|canary}  
**Rollback Version**: {previous_commit_hash}  

Ready to begin Canary-1 (10%).
```

---

### Step 2: Canary-1 Deployment (10%)

**Deploy to 10% of users/traffic with 5-minute observation**.

#### Deployment Command

```bash
# Deploy to 10% traffic (Kubernetes example)
kubectl set image deployment/app app=myapp:v2.0.0-canary-1
kubectl annotate deployment/app canary-stage="1" canary-percentage="10"

# Or for load balancer-based routing (AWS ALB):
aws elbv2 modify-listener --listener-arn $ARN \
  --default-actions Type=forward,TargetGroupArn=$CANARY_TG_10
```

#### Health Check Protocol

Monitor every minute for 5 minutes:

```yaml
health_check_canary_1:
  duration_minutes: 5
  check_interval_seconds: 60
  
  thresholds:
    error_rate: 1.0%        # Max 1% errors allowed
    latency_p99_ms: 200     # P99 latency < 200ms
    cpu_usage_percent: 60   # CPU < 60%
    memory_usage_percent: 70 # Memory < 70%
  
  pass_criteria: "all_metrics_below_threshold AND no_critical_alerts"
  auto_rollback_on_fail: true
```

**Monitoring script**:

```bash
#!/bin/bash
# canary-health-check.sh

STAGE=$1  # 1, 2, or 3
DURATION_MINUTES=$2
THRESHOLD_ERROR_RATE=$3

START_TIME=$(date +%s)
END_TIME=$((START_TIME + DURATION_MINUTES * 60))

while [ $(date +%s) -lt $END_TIME ]; do
  # Sample metrics
  ERROR_RATE=$(curl -s http://monitoring/api/metrics?metric=error_rate | jq '.value')
  LATENCY_P99=$(curl -s http://monitoring/api/metrics?metric=latency_p99 | jq '.value')
  
  echo "[$(date '+%H:%M:%S')] error_rate=${ERROR_RATE}% latency_p99=${LATENCY_P99}ms"
  
  # Check thresholds
  if (( $(echo "$ERROR_RATE > $THRESHOLD_ERROR_RATE" | bc -l) )); then
    echo "❌ Threshold breached: error_rate ${ERROR_RATE}% > ${THRESHOLD_ERROR_RATE}%"
    trigger_rollback $STAGE
    exit 1
  fi
  
  sleep 60
done

echo "✅ Canary-${STAGE} health check PASSED"
exit 0
```

**Sample output**:

```markdown
## Canary-1: 10% Deployment

**Start Time**: 2026-05-17T14:00:00+08:00  
**Observation Period**: 5 minutes  

**Health Check Results**:
- [14:00] Deployment started → waiting for pods ready...
- [14:01] Pods ready (3/3) → starting health checks ✓
- [14:02] error_rate=0.3% (<1.0% ✓), latency_p99=120ms (<200ms ✓)
- [14:03] error_rate=0.4% (<1.0% ✓), latency_p99=135ms (<200ms ✓)
- [14:04] error_rate=0.2% (<1.0% ✓), latency_p99=110ms (<200ms ✓)
- [14:05] No critical alerts → Canary-1 [PASS]

**Result**: ✅ PASS → Proceeding to Canary-2 (50%)
```

---

### Step 3: Canary-2 Deployment (50%)

**Expand to 50% traffic with 10-minute observation**.

#### Deployment Command

```bash
# Scale up to 50% traffic
kubectl annotate deployment/app canary-stage="2" canary-percentage="50"

# Update load balancer routing
aws elbv2 modify-listener --listener-arn $ARN \
  --default-actions Type=forward,TargetGroupArn=$CANARY_TG_50
```

#### Enhanced Health Checks

Add resource usage monitoring:

```yaml
health_check_canary_2:
  duration_minutes: 10
  check_interval_seconds: 60
  
  thresholds:
    error_rate: 0.5%        # Stricter than Canary-1
    latency_p99_ms: 200
    cpu_usage_percent: 60
    memory_usage_percent: 70
    db_connection_pool_active: 80%  # <80% of max connections
  
  additional_checks:
    - database_connectivity
    - cache_hit_rate
    - disk_io_latency
  
  pass_criteria: "all_metrics_below_threshold AND no_user_complaints"
  auto_rollback_on_fail: true
```

**Sample output**:

```markdown
## Canary-2: 50% Deployment

**Start Time**: 2026-05-17T14:10:00+08:00 (10min after Canary-1 PASS)  
**Observation Period**: 10 minutes  

**Health Check Results**:
- [14:10] Traffic scaled to 50% → monitoring...
- [14:11] error_rate=0.2% (<0.5% ✓), latency_p99=125ms (<200ms ✓)
- [14:12] CPU=15% (<60% ✓), Memory=45% (<70% ✓)
- [14:13] DB connections=20/200 (10% <80% ✓)
- [14:14] Cache hit rate=95% (>90% ✓)
- [14:15] No user complaints → Canary-2 [PASS]

**Result**: ✅ PASS → Proceeding to Production (100%)
```

---

### Step 4: Production Deployment (100%)

**Full rollout with continuous monitoring**.

#### Deployment Command

```bash
# Promote to 100% traffic
kubectl annotate deployment/app canary-stage="3" canary-percentage="100"
kubectl label deployment/app version=v2.0.0 stable=true

# Update load balancer to full production
aws elbv2 modify-listener --listener-arn $ARN \
  --default-actions Type=forward,TargetGroupArn=$PROD_TG
```

#### Continuous Monitoring

```yaml
health_check_production:
  duration: continuous
  check_interval_seconds: 60
  alert_threshold_minutes: 5  # Alert if breach persists >5min
  
  thresholds:
    error_rate: 0.1%        # Very strict for production
    latency_p99_ms: 200
    cpu_usage_percent: 60
    memory_usage_percent: 70
  
  escalation_policy:
    warning: "Notify on-call engineer via Slack"
    critical: "Auto-rollback if error_rate > 0.5% for 5min"
```

**Sample output**:

```markdown
## Production: 100% Deployment

**Start Time**: 2026-05-17T14:25:00+08:00 (15min after Canary-2 PASS)  
**Monitoring**: Continuous  

**Initial Health Check**:
- [14:25] Full production rollout complete
- [14:26] error_rate=0.15% (<0.1% ⚠️ slightly over)
- [14:27] Investigating... endpoint /api/reports has error_rate=1.2%
- [14:28] Root cause: Known issue R1 (pending fix in Phase X)
- [14:29] Overall error_rate acceptable (0.15% < 0.2% relaxed threshold)

**Result**: ✅ PASS WITH NOTE  
⚠️ Note: /api/reports error_rate elevated (known issue R1)  
✅ Overall system healthy → Production deployment successful
```

---

### Step 5: Automatic Rollback Protocol

**Triggered when any stage breaches thresholds**.

#### Rollback Decision Tree

```yaml
rollback_decision:
  if error_rate > threshold:
    action: immediate_rollback
    reason: "User-facing errors detected"
    
  elif latency_p99 > threshold * 1.5:
    action: immediate_rollback
    reason: "Severe performance degradation"
    
  elif cpu_usage > 90% OR memory_usage > 90%:
    action: pause_and_investigate
    reason: "Resource exhaustion risk"
    timeout_minutes: 5
    
  else:
    action: continue_monitoring
```

#### Rollback Execution

```bash
#!/bin/bash
# auto-rollback.sh

STAGE=$1
REASON=$2

echo "🚨 TRIGGERING ROLLBACK from Canary-${STAGE}"
echo "Reason: ${REASON}"

# Revert to previous version
kubectl rollout undo deployment/app
kubectl annotate deployment/app canary-stage="rolled-back" rollback-reason="${REASON}"

# Verify rollback success
sleep 30
ERROR_RATE=$(curl -s http://monitoring/api/metrics?metric=error_rate | jq '.value')

if (( $(echo "$ERROR_RATE < 0.5" | bc -l) )); then
  echo "✅ Rollback successful, error_rate restored to ${ERROR_RATE}%"
  
  # Generate rollback report
  cat > .ultimate-workflow/<req-id>/rollback-report.md << EOF
# Auto-Rollback Report

**Triggered From**: Canary-${STAGE}  
**Reason**: ${REASON}  
**Timestamp**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")  

**Impact Assessment**:
- Affected Users: ~{calculate based on stage percentage}
- Duration: {time from deploy to rollback}
- Error Spike: {max error_rate during incident}

**Root Cause Analysis**:
{investigate and document}

**Next Steps**:
- [ ] Fix root cause in next sprint
- [ ] Add regression test
- [ ] Update runbook with lessons learned
EOF
  
  exit 0
else
  echo "❌ Rollback failed, error_rate still ${ERROR_RATE}%"
  echo "🚨 ESCALATING to on-call engineer"
  notify_oncall "Rollback failed for req-<id>"
  exit 1
fi
```

**Sample rollback report**:

```markdown
# Auto-Rollback Report

**Triggered From**: Canary-2  
**Reason**: error_rate=0.8% > threshold 0.5%  
**Timestamp**: 2026-05-17T14:15:00Z  

**Impact Assessment**:
- Affected Users: ~500 (50% of 1000 active users)
- Duration: 5 minutes (14:10 → 14:15)
- Error Spike: 0.8% (normal baseline: 0.2%)

**Root Cause Analysis**:
Database connection timeout retry strategy not生效 on /api/checkout endpoint.
New connection pool settings incompatible with existing DB proxy.

**Next Steps**:
- [ ] Fix retry strategy in next sprint (Task: DB-CONN-RETRY-001)
- [ ] Add integration test for connection pool under load
- [ ] Update deployment checklist: verify DB proxy compatibility
```

---

## Error Handling

### Common Issues and Fixes

**Issue 1: Health Check Timeout**

- **Symptom**: Monitoring endpoint unresponsive during canary
- **Cause**: New version has bug blocking metrics endpoint
- **Fix**:
  1. Check pod logs: `kubectl logs deployment/app -f`
  2. If metrics endpoint broken → immediate rollback
  3. Fix metrics endpoint bug → redeploy
- **Prevention**: Test metrics endpoint in staging before production

**Issue 2: False Positive Rollback**

- **Symptom**: Rollback triggered by transient spike (not real issue)
- **Cause**: Threshold too sensitive or monitoring glitch
- **Fix**:
  1. Review metrics history: was it sustained or momentary?
  2. If transient → adjust threshold (e.g., require 3 consecutive breaches)
  3. Redeploy with updated threshold
- **Prevention**: Use moving average instead of point-in-time values

**Issue 3: Rollback Failure**

- **Symptom**: Rollback command executed but error_rate remains high
- **Cause**: Database schema change incompatible with old version
- **Fix**:
  1. Identify breaking change (schema, API contract, etc.)
  2. Manual intervention required → escalate to on-call
  3. On-call decides: fix forward or emergency patch
- **Prevention**: Backward-compatible changes only, or coordinate schema migrations

**Issue 4: Canary Stuck in Pending State**

- **Symptom**: Pods not becoming ready after 5 minutes
- **Cause**: Readiness probe failing or resource constraints
- **Fix**:
  1. Check pod status: `kubectl get pods -l app=myapp`
  2. Check events: `kubectl describe pod <pod-name>`
  3. If OOMKilled → increase memory limits
  4. If readiness probe failing → fix application startup
- **Prevention**: Test readiness probes in staging, set appropriate timeouts

**Issue 5: Load Balancer Routing Error**

- **Symptom**: Traffic not splitting correctly (100% going to canary or 0%)
- **Cause**: ALB/Nginx configuration error
- **Fix**:
  1. Verify listener rules: `aws elbv2 describe-listeners`
  2. Check target group health: `aws elbv2 describe-target-health`
  3. Manually adjust weights if needed
  4. If irrecoverable → rollback to previous listener config
- **Prevention**: Validate LB config in staging, use infrastructure-as-code

---

## Error Taxonomy

| Priority | Condition | Detection Method | Recovery Action |
|----------|-----------|------------------|-----------------|
| **P0** | Canary error rate exceeds threshold (≥5%) | `error_rate` metric breach in health check monitor | Auto rollback to previous version, generate rollback report with root cause analysis |
| **P1** | Canary deployment timeout (>15 minutes total observation) | Total elapsed time from Canary-1 start to decision >15 min | Force decision: if metrics inconclusive → hold at current stage + escalate to on-call |
| **P2** | Feature flag configuration inconsistency across canary stages | Flags active in Canary-1 but not Canary-2 (or vice versa) | Sync flag values across all stages, re-validate before continuing rollout |
| **P3** | Rollback report contains unresolved warnings | Non-critical alerts pending in rollback-report.md | Log warnings, schedule follow-up investigation within next sprint, continue monitoring |

---

## Boundary Conditions

### Deployment Thresholds

| Parameter | Value/Condition | Rationale | Enforcement |
|-----------|-----------------|-----------|-------------|
| Canary window per stage | ≥48h for production, ≥2h for staging | Allows observation of different usage patterns (business hours + off-hours) | Total deployment duration logged in canary report |
| Error rate threshold | ≤5% across all stages | Industry standard for acceptable error budget consumption | Auto-rollback triggered if breached for ≥3 consecutive health checks |
| Rollback condition | error_rate ≥5% OR latency_p99 ≥2x baseline | Rapid detection of performance regression | Auto-executed via rollback script; manual confirmation within 1 min |
| Observability coverage | All stages must have metrics, logs, traces | Blind deployments increase mean-time-to-detection (MTTD) | Missing any observability pillar → canary runs at half-traffic until added |

### When to Escalate Immediately

**Skip canary, escalate to on-call if**:
- Rollback fails twice in a row (systemic issue)
- Data corruption detected (immediate incident response)
- Security vulnerability discovered mid-deployment
- >10% user impact within first minute (critical failure)

### When to Skip Canary Stages

**Direct to Production (skip Canary-1/2) if**:
- Emergency P0 incident (system down) → use Emergency Mode
- Pure frontend static assets (no backend logic)
- A/B test experiment (already isolated cohort)
- Development/staging environment

### Edge Cases

**No Deployment Environment** (local dev, static sites):

- Use local preview mode:
  ```bash
  # Start old version on port 3000
  npm run start -- --port 3000 &
  
  # Start new version on port 3001
  npm run start -- --port 3001 &
  
  # Run automated E2E tests against both
  cypress run --config baseUrl=http://localhost:3000
  cypress run --config baseUrl=http://localhost:3001
  
  # Visual diff comparison
  Percy compare build-3000 build-3001
  ```

**Multi-Region Deployment**:

- Deploy region-by-region (US-East → US-West → EU → APAC)
- Each region follows 10% → 50% → 100% pattern
- Monitor cross-region latency and data consistency
- Rollback one region at a time if issues detected

**Blue-Green Hybrid**:

- Maintain two full environments (blue/green)
- Canary deploys to blue first
- If blue passes → switch DNS to blue (instant full rollout)
- Green becomes standby for next deployment

**Database Migrations**:

- Run migrations BEFORE canary starts (backward-compatible)
- Old and new versions must work with same schema
- If breaking change unavoidable → maintenance window required
- Document migration rollback procedure

---

## Output Template

### Standard Canary Report

```markdown
# Canary Deployment Report — [req-id]

## Deployment Summary
- **Version**: {v2.0.0}
- **Strategy**: Gradual (10% → 50% → 100%)
- **Started At**: {YYYY-MM-DD HH:mm:ss}
- **Completed At**: {YYYY-MM-DD HH:mm:ss}
- **Total Duration**: {minutes}

## Stage Results

| Stage | Traffic % | Duration | error_rate | latency_p99 | Status |
|-------|-----------|----------|------------|-------------|--------|
| Canary-1 | 10% | 5min | 0.3% | 120ms | ✅ PASS |
| Canary-2 | 50% | 10min | 0.2% | 125ms | ✅ PASS |
| Production | 100% | ongoing | 0.15% | 130ms | ✅ PASS |

## Health Check Details

### Canary-1 (10%)
- error_rate: 0.3% (<1.0% ✓)
- latency_p99: 120ms (<200ms ✓)
- CPU: 12% (<60% ✓)
- Memory: 40% (<70% ✓)

### Canary-2 (50%)
- error_rate: 0.2% (<0.5% ✓)
- latency_p99: 125ms (<200ms ✓)
- DB Connections: 20/200 (10% <80% ✓)
- Cache Hit Rate: 95% (>90% ✓)

### Production (100%)
- error_rate: 0.15% (<0.1% ⚠️ slightly over, acceptable)
- latency_p99: 130ms (<200ms ✓)
- Overall System: Healthy

## Issues Encountered
- None / {list of issues with resolution}

## Rollback Events
- None / {list of rollbacks with reasons}

**Final Result**: [PASS / FAIL / PASS WITH NOTES]
```

### Rollback Report

```markdown
# Auto-Rollback Report

**Triggered From**: Canary-{N}  
**Reason**: {error_description}  
**Timestamp**: {YYYY-MM-DD HH:mm:ss}  

**Impact Assessment**:
- Affected Users: ~{count}
- Duration: {minutes}
- Error Spike: {max_error_rate}%

**Root Cause Analysis**:
{detailed explanation}

**Next Steps**:
- [ ] {action_item_1}
- [ ] {action_item_2}
```

---

## Tool Integration

### Required Tools

**Kubernetes Commands**:
```bash
# Deploy canary
kubectl set image deployment/app app=myapp:v2.0.0
kubectl annotate deployment/app canary-stage="1"

# Check pod status
kubectl get pods -l app=myapp -w

# Rollback
kubectl rollout undo deployment/app

# View logs
kubectl logs deployment/app -f --tail=100
```

**AWS ALB Commands**:
```bash
# Update listener routing
aws elbv2 modify-listener --listener-arn $ARN \
  --default-actions Type=forward,TargetGroupArn=$CANARY_TG

# Check target health
aws elbv2 describe-target-health --target-group-arn $TG_ARN
```

**Monitoring Queries**:
```bash
# Query Prometheus metrics
curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])' | jq

# Query Grafana dashboard
curl -s 'http://grafana:3000/api/dashboards/uid/canary-metrics' \
  -H "Authorization: Bearer $TOKEN"
```

### Optional Tools

**Percy Visual Testing** (frontend):
```bash
# Capture visual diffs
percy exec -- cypress run
percy compare build-old build-new
```

**Datadog Monitoring**:
```bash
# Query error rate
curl -X GET "https://api.datadoghq.com/api/v1/query" \
  -H "DD-API-KEY: $API_KEY" \
  -d "query=avg:error_rate{*} by {service}&from=$(date -d '5 minutes ago' +%s)"
```

**PagerDuty Integration**:
```bash
# Trigger incident
curl -X POST "https://events.pagerduty.com/v2/enqueue" \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "$ROUTING_KEY",
    "event_action": "trigger",
    "payload": {
      "summary": "Canary deployment failed",
      "severity": "critical",
      "source": "canary-monitor"
    }
  }'
```

---

## Implementation Checklist

Before deployment:
- [ ] G3 review passed (code quality verified)
- [ ] Phase 5 tests all passed
- [ ] Rollback version identified and tested
- [ ] Monitoring dashboards configured
- [ ] On-call engineer notified (if production)

During deployment:
- [ ] Canary-1 deployed to 10% traffic
- [ ] Health checks passing for 5 minutes
- [ ] Canary-2 expanded to 50% traffic
- [ ] Resource usage within thresholds
- [ ] Production rolled to 100%
- [ ] Continuous monitoring active

After deployment:
- [ ] Canary report generated (.ultimate-workflow/<req-id>/07-canary.md)
- [ ] Integration report created (08-integration-report.md)
- [ ] G5 gate evaluated (PASS/FAIL)
- [ ] Lessons documented (if rollback occurred)
- [ ] Monitoring alerts configured for new version

Quality gates:
- [ ] No stage exceeded error_rate threshold
- [ ] Rollback procedure tested and working
- [ ] All health checks passed or documented exceptions
- [ ] User impact minimized (<1% affected if rollback)
- [ ] Post-deployment monitoring active

---

## Anti-Patterns to Avoid

❌ **Skipping Health Checks**: Deploying without monitoring → blind failures  
✅ **Fix**: Mandatory health checks at every stage with auto-rollback

❌ **Too-Sensitive Thresholds**: Rolling back on transient spikes  
✅ **Fix**: Use moving averages, require consecutive breaches

❌ **Breaking Schema Changes**: New version incompatible with old database  
✅ **Fix**: Backward-compatible migrations only, or maintenance window

❌ **Ignoring Rollback Failures**: Assuming rollback always works  
✅ **Fix**: Test rollback procedure in staging, have manual fallback plan

❌ **Deploying Friday Evening**: Weekend incidents harder to resolve  
✅ **Fix**: Schedule deployments Tue-Thu 10am-2pm (best support coverage)

❌ **No Post-Mortem**: Not learning from failed deployments  
✅ **Fix**: Mandatory retrospective within 48h of any rollback

---

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added 5-step workflow (pre-flight → Canary-1 → Canary-2 → Production → Rollback)
  - Implemented automatic health check protocol with configurable thresholds
  - Defined comprehensive rollback decision tree and execution procedure
  - Added Emergency Mode for P0/P1 incidents with close gate protocol
  - Integrated multi-region and blue-green deployment patterns

- **v1.0** (2024-01-10): Initial implementation based on SuperCorp Canary Pipeline
  - Basic three-stage rollout (10% → 50% → 100%)
  - Manual health checks
  - Simple rollback script
  - No emergency mode
