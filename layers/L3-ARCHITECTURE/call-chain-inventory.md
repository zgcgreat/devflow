# Call Chain Inventory

> **Cross-Layer Call Chain Ownership Matrix**
> Policy: See RULES-v3.md R24

- **Last Updated**: 2026-05-18
- **Owner**: L3-ARCHITECTURE team
- **Scope**: L1 Phase Skills → L2 Engine Skills → L3 Architecture Components

---

## Call Chain Ownership Matrix

| Phase Skill (L1) | Calls → | L2 Component | L3 Component | Owner | Boundary Check |
|------------------|---------|--------------|--------------|-------|----------------|
| phase-0-yc-strategy | party-mode | L2-ENGINE/party-mode | — | @l2-engine-team | validates 3+ options per question |
| phase-2-design | research-agent | L2-ENGINE (via agent-isolation) | L3-ARCHITECTURE/agent-isolation | @l3-arch-team | ~200K/token per agent |
| phase-3-task-plan | dag-router | — | L3-ARCHITECTURE/dag-router | @l3-arch-team | validates task dependency DAG |
| phase-4-build | wave-executor, executor | L2-ENGINE/wave-executor, L2-ENGINE/executor | L3-ARCHITECTURE/parallel-engine | @l2-engine-team | validates wave-plan.yaml schema |
| phase-5-test | gate-check | — | AI 逐项核对清单 | @l2-engine-team | validates test-results.md exists |
| phase-6-review | party-mode, reviewer | L2-ENGINE/party-mode, L2-ENGINE/reviewer | — | @l2-engine-team | validates review findings |
| phase-7-canary | canary-health-check | — | AI 逐项核对健康指标 | @l2-engine-team | validates stability score ≥ threshold |
| phase-8-archive | learning-workflow | L2-ENGINE/learning-workflow | — | @l2-engine-team | validates wave SUMMARY existence |

## Wave Execution Call Chain (Internal)

| Wave Executor Step | Calls → | Component | Layer | Owner |
|-------------------|---------|-----------|-------|-------|
| Step 1: Read wave-plan.yaml | dag-router output | dag-router | L3 | @l3-arch-team |
| Step 2: Kahn topological sort | parallel-engine | parallel-engine | L3 | @l3-arch-team |
| Step 3: Deploy tasks | executor | executor | L2 | @l2-engine-team |
| Step 4: Monitor heartbeat | heartbeat.log | executor | L2 | @l2-engine-team |
| Step 5: Generate SUMMARY | wave-executor | wave-executor | L2 | @l2-engine-team |
| Step 6: LearningWorkflow injection | learning-workflow | learning-workflow | L2 | @l2-engine-team |

## Cross-Layer Boundary Validation Rules

1. **L1→L2**: L1 Phase skill must validate L2 component's input schema (frontmatter `triggers` + required fields)
2. **L2→L3**: L2 component must validate L3 component's output schema (e.g., wave-plan.yaml follows defined JSON Schema)
3. **L3→L2**: L3 component must validate L2 component's readiness (e.g., dag-router validates executor availability)
4. **Unregistered Call**: Any L1→L2/L3 call not in this inventory → P2 error in CI gate

---

_Sync policy: See RULES-v3.md R24_
