---
name: party-mode
version: 3.0-draft
layer: L2-ENGINE
source: SuperCorp PartyMode + Cavecrew sub-agent delegation
dependencies: []
triggers: [multi-agent consensus, technical debate, architectural decision]
allowed-tools: [Read, Bash, Write, Edit, AskUserQuestion]
---

# PartyMode — Multi-Agent Consensus Protocol

Orchestrate multi-agent roundtable discussions for complex decisions requiring diverse perspectives. Each agent provides independent analysis, then engages in structured debate to reach consensus or escalate.

**Core philosophy**: Independent thinking prevents groupthink. Structured debate ensures all voices are heard. Clear escalation paths prevent decision paralysis.

---

## Preamble

### Key Principles

1. **Independent Analysis First**: Every agent analyzes the problem independently before discussion begins — no influence from other agents' initial views
2. **Evidence-Driven Debate**: All arguments must be backed by facts, data, or concrete examples — opinions without evidence carry less weight
3. **Progressive Convergence**: Discussion aims for 80% consensus, not 100% agreement — document dissenting views and move forward
4. **Context Hygiene**: Auto-summarize every 3 rounds to keep context under 400 words — prevents token bloat while preserving key insights

### When to Use

**Automatic triggers** (any one):
- Task involves multiple technical domains (e.g., security + performance + UX)
- Agent confidence score < 70% on critical decision
- User explicitly requests "discussion", "review", or "/party"
- Architectural change affecting >3 modules
- Security implications with risk level ≥ MEDIUM

**Manual trigger**:
```
/party <decision description>
```

**When NOT to use**:
- Simple implementation details (<5 LOC changes)
- Purely cosmetic changes (UI styling, text updates)
- Already documented decision with no new information
- Time-critical fixes requiring immediate action

---

## Step-by-step Workflow

### Step 0: Initialize Party Mode

**Determine discussion scope**:

AskUserQuestion: "What type of decision needs consensus?"
- **Technical Architecture** (framework selection, design patterns, database schema)
- **Business Logic** (feature design, user flows, API contracts)
- **Risk Assessment** (security vulnerabilities, performance bottlenecks, cost analysis)
- **Quality Gate** (code review disputes, test coverage gaps, release readiness)

**Select agent roster**:

Load configuration from `.ultimate-workflow/config/party-agents.yaml` if exists. Otherwise use default pool:

| Role | Specialty | Weight |
|------|-----------|--------|
| Architect | Technical feasibility, scalability | 1.5x |
| Security-Auditor | Threat modeling, attack surface | 1.5x |
| Performance-Auditor | Latency, throughput, resource usage | 1.3x |
| QA-Lead | Test coverage, edge cases, failure modes | 1.2x |
| Dev-Reviewer | Code quality, maintainability, readability | 1.0x |

**Agent selection rules**:
- Minimum 3 agents for any discussion
- Maximum 5 agents to avoid noise
- Always include Architect for technical decisions
- Always include Security-Auditor if security implications exist
- Rotate agents across rounds to avoid dominance

**Output format**:
```markdown
## Party Mode Initialized

**Decision Type**: Technical Architecture  
**Selected Agents**: Architect (1.5x), Security-Auditor (1.5x), Performance-Auditor (1.3x)  
**Discussion Rules**: Max 5 rounds, auto-summary every 3 rounds  
**Consensus Threshold**: 75% weighted agreement  

Ready to begin. Please state the decision to be discussed.
```

---

### Step 1: Problem Statement & Independent Analysis

**Present problem to all agents**:

Provide clear problem statement with:
- Context (what led to this decision)
- Constraints (budget, timeline, technical limitations)
- Success criteria (how we'll know it's a good decision)
- Known unknowns (what we don't know yet)

**Independent analysis phase** (no cross-talk allowed):

Each agent privately analyzes and produces:
1. Initial position (support/oppose/neutral)
2. Confidence score (1-10)
3. Key reasoning (≤100 words)
4. Critical concerns (if any)

**Tool usage example**:
```bash
# If analyzing architecture decision, gather context first
find . -name "*.md" -path "*/docs/*" | grep -i "architecture\|design"
grep -rn "TODO\|FIXME" src/ --include="*.ts" | head -20
npm list --depth=0  # Check dependency versions
```

**Verification checklist**:
- [ ] All agents have read the full problem statement
- [ ] No agent has seen other agents' analyses yet
- [ ] Each agent provided confidence score
- [ ] Critical concerns are clearly flagged

**Output format** (per agent):
```markdown
[Architect] Position: ✅ Support | Confidence: 8/10

**Reasoning**: 
Current monolith is hitting scaling limits at 10K concurrent users. 
Microservices allow independent scaling of hot paths.

**Critical Concerns**: 
- Operational complexity increases significantly
- Need service mesh for observability
- Team must learn distributed systems patterns
```

---

### Step 2: Structured Debate

**Round structure** (repeat up to 5 times):

1. **Opening statements** (agents speak in weight order):
   - Highest weight speaks first (Architect 1.5x → Security 1.5x → Performance 1.3x → ...)
   - Each agent: ≤150 words, must reference specific evidence
   - Can adjust position based on new information

2. **Cross-examination** (Q&A round):
   - Any agent can question another's reasoning
   - Questions must be specific: "You mentioned X, but what about Y?"
   - Answering agent: ≤100 words per response
   - No ad hominem attacks — focus on ideas, not people

3. **Rebuttal** (optional, if positions shifted):
   - Agents who changed position explain why
   - Agents maintaining position address strongest counterargument
   - ≤100 words each

**Discussion rules enforcement**:
- ⏱️ **Time limit**: Each round ≤10 minutes total
- 📝 **Word limit**: Strict enforcement — verbose agents get truncated
- 🔇 **No interruptions**: Wait for turn to speak
- 🎯 **Stay on topic**: Moderator (you) redirects if discussion drifts

**Auto-summary trigger** (every 3 rounds):

Generate summary under 400 words:
```markdown
## Discussion Context (Round 3 Summary)

**Core Issue**: Whether to adopt microservices architecture for MVP

**Current Positions**:
- Architect: ✅ Support (8/10) — Scaling benefits outweigh complexity
- Security: ⚠️ Conditional (6/10) — Requires service mesh first
- Performance: ✅ Support (9/10) — Latency improvements significant

**Points of Agreement**:
- Monolith won't scale beyond 10K users
- Team needs training on distributed systems
- Service discovery is mandatory

**Remaining Disagreements**:
- Timing: Now vs. after Series A funding
- Scope: All services vs. only hot paths
- Infrastructure: Kubernetes vs. managed containers

**User Preference**: Leans toward phased approach (hot paths first)
```

**Verification after each round**:
- [ ] All active agents participated
- [ ] Word limits respected
- [ ] New evidence introduced (not just repeating)
- [ ] Summary updated if round % 3 == 0

---

### Step 3: Consensus Determination

**Calculate weighted consensus**:

Formula:
```
weighted_score = Σ(agent_confidence × agent_weight) / Σ(agent_weights)
consensus_pct = (agents_in_agreement / total_agents) × 100
```

**Decision matrix**:

| Scenario | Weighted Score | Consensus % | Action |
|----------|---------------|-------------|--------|
| **Strong Consensus** | ≥8.0 | ≥80% | ✅ Accept decision, document rationale |
| **Weak Consensus** | 6.0-7.9 | 60-79% | ⚠️ Accept with reservations, log dissent |
| **No Consensus** | <6.0 | <60% | ❌ Escalate to Orchestrator for manual decision |
| **Deadlock** | Any | Any | ❌ If >5 rounds with no movement, escalate |

**Special escalation conditions** (immediate escalation regardless of scores):
- Security-Auditor flags CRITICAL vulnerability with confidence ≥9/10
- Architect identifies fundamental flaw making solution infeasible
- Legal/compliance implications discovered mid-discussion
- Budget overrun >50% from original estimate

**Output format** (consensus reached):
```markdown
## Consensus Achieved

**Decision**: Adopt microservices for user authentication and payment processing only

**Weighted Score**: 7.8/10  
**Consensus Level**: 67% (2/3 agents fully agree, 1 conditional)  

### Rationale
- Phased approach balances scaling needs with team capacity
- Hot paths (auth, payments) benefit most from isolation
- Remaining monolith reduces operational overhead during transition

### Dissenting Views
**Security-Auditor** (conditional support):
- Concern: Service-to-service auth adds attack surface
- Requirement: Implement mTLS before deployment
- Mitigation: Use Istio service mesh with automatic mutual TLS

### Next Steps
- [ ] Create RFC for phased migration plan
- [ ] Prototype auth service in isolation
- [ ] Evaluate service mesh options (Istio vs. Linkerd)
- [ ] Schedule team training on distributed tracing
```

**Output format** (escalation required):
```markdown
## Decision Escalated to Orchestrator

**Reason**: No consensus after 5 rounds, fundamental disagreement on approach

**Summary of Positions**:
- Architect: Microservices now (scaling urgency)
- Security: Monolith until security framework ready (risk aversion)
- Performance: Hybrid approach (compromise not accepted by others)

**Key Blockers**:
1. Security concerns about service-to-service communication
2. Team lacks distributed systems experience
3. Budget constraints limit infrastructure investment

**Recommendation for Orchestrator**:
Consider third-party consultation or proof-of-concept before final decision.
Cost of wrong decision estimated at $50K (refactor + downtime).
```

---

### Step 4: Documentation & Memory Update

**Record decision in memory system**:

Update `.specs/memory/DECISIONS.md`:
```markdown
## [YYYY-MM-DD] Microservices Adoption Strategy

**Category**: Technical Architecture  
**Participants**: Architect, Security-Auditor, Performance-Auditor  
**Outcome**: Phased adoption (auth + payments first)  
**Confidence**: 7.8/10  

### Context
Monolith hitting scaling limits at 10K concurrent users. Need horizontal scaling for hot paths while managing team capacity.

### Decision Rationale
- Phased approach reduces risk
- Focus on highest-impact services first
- Allows team to learn gradually

### Dissenting Opinions
Security-Auditor requires mTLS implementation before any service deployment.

### Lessons Learned
- Early security involvement prevents rework
- Team training budget should be included in proposal
- Service mesh evaluation took longer than expected

### Related Decisions
- [2024-01-15] API Gateway Selection (Linkerd chosen)
- [2024-02-01] Observability Stack (Prometheus + Grafana)

### Review Date
Revisit in 3 months or when user base reaches 20K
```

**Extract learning points** (for LearningWorkflow):

If discussion revealed new insights:
```yaml
# Add to .specs/memory/LESSONS.md
- lesson: "Service mesh evaluation requires 2-week POC minimum"
  category: "Infrastructure"
  severity: "medium"
  extracted_from: "PartyMode session 2024-03-15"
  applicability: "Any microservices adoption"
  
- lesson: "Security review must happen before architecture finalization"
  category: "Process"
  severity: "high"
  extracted_from: "PartyMode session 2024-03-15"
  applicability: "All architectural decisions"
```

**Update domain skills** (if pattern repeats):

Check frequency of similar decisions:
```bash
grep -c "microservices\|service mesh" .specs/memory/DECISIONS.md
# If count >= 3, promote to domain skill
```

If threshold met, create `.specs/skills/microservices-adoption.md`:
```markdown
# Domain Skill: Microservices Adoption

**Frequency**: Used in 4 projects  
**Last Updated**: 2024-03-15  

## Best Practices
1. Start with hot paths only (auth, payments, notifications)
2. Implement service mesh before first service goes live
3. Allocate 20% budget for team training
4. Plan 2-week POC for infrastructure evaluation

## Common Pitfalls
- Underestimating operational complexity
- Skipping security review until too late
- Not budgeting for observability tooling

## Recommended Agents for Discussion
- Architect (mandatory)
- Security-Auditor (mandatory)
- Performance-Auditor (recommended)
- SRE (if available)
```

---

## Error Handling

### Common Issues and Fixes

**Issue 1: Agents陷入循环争论 (Circular Argument)**

- **Symptom**: Same points repeated for 3+ rounds with no new information
- **Cause**: Agents talking past each other, not addressing core disagreement
- **Fix**: 
  1. Pause discussion
  2. Ask each agent: "What single piece of evidence would change your mind?"
  3. If no answer possible → escalate immediately
  4. If answers provided → focus next round on gathering that evidence
- **Prevention**: Set explicit success criteria before discussion starts

**Issue 2: Dominant Agent Monopolizes Discussion**

- **Symptom**: One agent speaks >50% of total words, others defer
- **Cause**: Weight imbalance or personality dominance
- **Fix**:
  1. Enforce strict word limits (truncate verbose responses)
  2. Require quiet agents to speak first in next round
  3. Ask dominant agent: "What questions do you have for others?" (forces listening)
- **Prevention**: Rotate speaking order each round, don't always go by weight

**Issue 3: Agent Provides Vague/Generic Response**

- **Symptom**: Response lacks specifics, uses hedging language ("maybe", "perhaps", "it depends")
- **Cause**: Agent lacks domain expertise or avoiding commitment
- **Fix**:
  1. Challenge directly: "Please provide specific numbers/examples"
  2. If still vague → reduce agent's weight by 0.2 for this session
  3. Request clarification from user: "Should we bring in a specialist?"
- **Prevention**: Pre-screen agents for relevance to decision topic

**Issue 4: Context Overflow (Token Limit Approaching)**

- **Symptom**: Warning that context window >80% full
- **Cause**: Too many rounds without summarization
- **Fix**:
  1. Trigger immediate summary (even if not at round 3)
  2. Compress summary to <300 words (more aggressive)
  3. Remove early round details, keep only current positions
  4. If still overflowing → escalate with current state
- **Prevention**: Monitor token usage, summarize at round 2 if approaching limit

**Issue 5: Agent Timeout/No Response**

- **Symptom**: Agent doesn't respond within 2 minutes
- **Cause**: System overload or agent stuck
- **Fix**:
  1. Wait additional 1 minute (total 3 min timeout)
  2. If still no response → mark as absent, use default confidence 5/10
  3. Continue with remaining agents
  4. Log incident for post-mortem
- **Prevention**: Keep agent pool small (≤5), monitor system health

---

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Party Mode Impact |
|-------|------|------------|--------|-------------------|
| **P0** | BLOCKING | ≥2 agents give conflicting recommendations with no clear consensus after 3 rounds | Escalate to user for final decision; document all agent positions + confidence scores | Discussion halts, user must resolve conflict |
| **P1** | RECOVERABLE | Single agent times out (2 min) or throws error during round | Use default confidence 5/10 for this agent's vote; continue with remaining agents | Partial result but discussion continues |
| **P2** | WARNING | Agent provides vague recommendation without justification (e.g., "just do X") | Flag as `[WEAK: no rationale]`, give half-weight in final confidence calculation | Result diluted slightly but still usable |
| **P3** | INFO | Decision resolved in <2 rounds with unanimous agreement (>7/10 consensus) | Log as quick-win, no further analysis needed | Discussion completes efficiently |

**Severity Assignment Rules**:
- Default to P1 for any agent timeout (system health issue, not discussion problem)
- Escalate from P2→P0 only when ≥3 agents give mutually exclusive recommendations
- Never demote: once P0 assigned, user must make final call before proceeding

### Consensus Calculation Algorithm

| Round | Action | Threshold |
|-------|--------|-----------|
| Round 1 | All agents vote (1-10 confidence) with brief rationale | — |
| Round 2 | If max-min >4 → agents justify position to lowest-highest gap | Conflict detected if gap >4 |
| Round 3 | Lowest-confidence agent asks highest-confidence for counter-example | Escalation point: still no convergence after round 3 → P0 |
| Final | Calculate weighted average (confidence as weight); if ≥7/10 → PASS | Otherwise → escalate to user |

**Consensus Example**:
```yaml
# Round 1 votes: [8, 6, 5, 9, 7] → max=9, min=5, gap=4 (conflict)
# Round 2 agent-3 (5) justifies position to agent-4 (9)
# Round 3 agent-3 asks for counter-example from agent-4
# Final: agent-4 provides example showing case where approach fails → agent-3 updates to 7
# New votes: [8, 7, 7, 8, 7] → weighted_avg = (8*8+7*6+7*5+8*9+7*7)/(8+6+5+9+7) = 7.4/10 → PASS
```

---

## Boundary Conditions

### When to Escalate Immediately

**Skip discussion, escalate to Orchestrator if**:
- Decision has legal/compliance implications (GDPR, HIPAA, etc.)
- Budget impact >$100K or >50% of project budget
- Security vulnerability with CVSS score ≥9.0
- Deadline <24 hours and no clear path forward
- User explicitly requests human review

### When to Skip PartyMode

**Don't use PartyMode if**:
- Decision is reversible with low cost (<1 day effort to undo)
- Only one reasonable option exists (no tradeoffs to discuss)
- Decision was already made and documented (unless new info emerged)
- All stakeholders already agree (just document and proceed)
- Emergency situation requiring immediate action

### Edge Cases

**Monorepo with Multiple Services**:
- Run separate PartyMode sessions per service boundary
- Cross-service decisions need representation from each affected team
- Use "federation" pattern: local consensus → global alignment

**Conflicting Organizational Policies**:
- Flag policy conflict immediately
- Escalate to leadership for policy clarification
- Don't try to resolve policy disputes in technical discussion

**Missing Critical Information**:
- If key data unavailable (e.g., performance benchmarks, security audit results)
- Pause discussion, assign action item to gather data
- Resume when information available (can span multiple sessions)

**Cross-Timezone Teams**:
- Async PartyMode: agents respond within 24-hour window
- Summarize after each agent responds
- May take 2-3 days instead of 30 minutes
- Document timezone constraints in decision record

---

## Output Template

### Standard Consensus Output

```markdown
## PartyMode Consensus Result

**Topic**: {decision_topic}  
**Date**: {YYYY-MM-DD HH:mm}  
**Duration**: {N} rounds ({M} minutes)  
**Participants**: {agent_list_with_weights}  

### Final Scores
| Agent | Position | Confidence | Weight | Weighted Score |
|-------|----------|------------|--------|----------------|
| Architect | ✅ Support | 8/10 | 1.5x | 12.0 |
| Security-Auditor | ⚠️ Conditional | 6/10 | 1.5x | 9.0 |
| Performance-Auditor | ✅ Support | 9/10 | 1.3x | 11.7 |
| **Total** | - | - | **4.3x** | **32.7/43** |

**Consensus Level**: 76% (Weak Consensus)  
**Weighted Average**: 7.6/10  

### Decision
**Result**: ✅ Accepted with Reservations  

**Rationale**: 
{2-3 sentence summary of why this decision was made}

**Conditions**:
- {condition_1_if_any}
- {condition_2_if_any}

### Key Arguments

**Supporting**:
- {pro_argument_1_with_evidence}
- {pro_argument_2_with_evidence}

**Concerns Raised**:
- {concern_1_with_mitigation_plan}
- {concern_2_with_mitigation_plan}

### Dissenting Opinions

**{Agent_Name}** ({position}):
- **Concern**: {specific_concern}
- **Requirement**: {what_needs_to_happen_before_full_support}
- **Impact if Ignored**: {risk_assessment}

### Action Items
- [ ] {action_item_1} — Owner: {role}, Due: {date}
- [ ] {action_item_2} — Owner: {role}, Due: {date}
- [ ] {action_item_3} — Owner: {role}, Due: {date}

### Discussion History
**Full transcript**: `.specs/memory/party-mode/{YYYY-MM-DD}-{topic-slug}.md`  
**Auto-summaries**: Rounds 3, 6, 9... (if applicable)

### Review Criteria
**Success Metrics**:
- {metric_1}: {target_value}
- {metric_2}: {target_value}

**Review Date**: {YYYY-MM-DD} or {trigger_event}

**Escalation Path**: If metrics not met, revisit with {stakeholder_list}
```

### Escalation Output

```markdown
## PartyMode Escalation Report

**Topic**: {decision_topic}  
**Date**: {YYYY-MM-DD HH:mm}  
**Escalation Reason**: {no_consensus | deadlock | critical_concern | policy_conflict}  

### Summary of Impasse

**Rounds Conducted**: {N}  
**Final Positions**:
- {agent_1}: {position_and_key_reason}
- {agent_2}: {position_and_key_reason}
- {agent_3}: {position_and_key_reason}

**Core Disagreement**:
{1-2 sentences describing the fundamental divide}

**Attempts to Resolve**:
- {attempt_1}: {outcome}
- {attempt_2}: {outcome}

### Recommendation for Orchestrator

**Suggested Approach**: {recommendation}  
**Rationale**: {why_this_approach}  
**Estimated Cost of Delay**: {time_or_money_impact}  

**Options to Consider**:
1. {option_1}: {pros_and_cons}
2. {option_2}: {pros_and_cons}
3. {option_3}: {pros_and_cons}

**Information Needed**:
- {missing_data_point_1}
- {missing_data_point_2}

**Stakeholders to Consult**:
- {stakeholder_1}: {reason_to_consult}
- {stakeholder_2}: {reason_to_consult}

### Attachments
- Full discussion transcript: `.specs/memory/party-mode/{slug}.md`
- Relevant documentation: {links}
- Previous related decisions: {links}
```

---

## Tool Integration

### Required Tools

**Configuration Management**:
```bash
# Load agent roster
cat .ultimate-workflow/config/party-agents.yaml

# Check if config exists, fallback to defaults
test -f .ultimate-workflow/config/party-agents.yaml || echo "Using default agent pool"
```

**Context Gathering**:
```bash
# Find relevant architecture docs
find . -name "*.md" -path "*/docs/*" | grep -E "architecture|design|rfc"

# Check recent commits for context
git log --oneline --since="1 week ago" | head -20

# Identify affected files
git diff --name-only HEAD~5..HEAD | grep -E "\.ts$|\.js$"
```

**Dependency Analysis**:
```bash
# Check package versions
npm list --depth=0

# Audit for vulnerabilities
npm audit --json | jq '.metadata.vulnerabilities'

# Check for outdated packages
npm outdated --json
```

**Memory System Updates**:
```bash
# Append to DECISIONS.md
echo "## [$(date +%Y-%m-%d)] {topic}" >> .specs/memory/DECISIONS.md

# Extract lessons for LESSONS.md
grep -A5 "lesson:" .specs/memory/LESSONS.md

# Check domain skill frequency
grep -c "{keyword}" .specs/memory/DECISIONS.md
```

### Optional Tools

**Performance Benchmarking** (if Performance-Auditor involved):
```bash
# Run load test
wrk -t12 -c400 -d30s http://localhost:3000/api/test

# Profile application
node --prof app.js
node --prof-process isolate-*.log > processed.txt
```

**Security Scanning** (if Security-Auditor involved):
```bash
# Secret detection
trufflehog filesystem . --only-verified

# Dependency vulnerabilities
npm audit --audit-level=high

# Static analysis
semgrep --config=p/security-audit .
```

**Architecture Validation** (if Architect involved):
```bash
# Check circular dependencies
madge --circular src/index.ts

# Analyze module coupling
depcheck . --ignores="eslint,jest"

# Generate dependency graph
npx dpdm src/index.ts --tree false --warning false --exit-code circular:1
```

---

## Implementation Checklist

Before starting PartyMode:
- [ ] Problem statement is clear and complete
- [ ] Success criteria defined
- [ ] Constraints documented (budget, timeline, technical)
- [ ] Relevant agents selected (3-5 based on topic)
- [ ] Configuration loaded (or defaults confirmed)
- [ ] Memory system accessible for recording

During discussion:
- [ ] Independent analysis completed before debate starts
- [ ] Word limits enforced (150 words opening, 100 words rebuttal)
- [ ] All agents participate in each round
- [ ] Auto-summary generated every 3 rounds (<400 words)
- [ ] Token usage monitored (alert at 80% capacity)
- [ ] Circular arguments detected and interrupted

After consensus:
- [ ] Weighted scores calculated correctly
- [ ] Dissenting opinions documented verbatim
- [ ] Action items assigned with owners and due dates
- [ ] Decision recorded in `.specs/memory/DECISIONS.md`
- [ ] Lessons extracted to `.specs/memory/LESSONS.md`
- [ ] Domain skills updated if frequency threshold met (≥3)
- [ ] Review date set (typically 3 months or milestone-based)

Quality gates:
- [ ] No agent dominated (>50% of words)
- [ ] Evidence cited for all major claims
- [ ] Counterarguments addressed, not ignored
- [ ] Mitigation plans for all raised concerns
- [ ] Output matches standard template format
- [ ] Links to full transcript provided

---

## Anti-Patterns to Avoid

❌ **Groupthink**: All agents quickly agree without genuine debate  
✅ **Fix**: Assign one agent as "devil's advocate" to challenge consensus

❌ **Analysis Paralysis**: Endless discussion without decision  
✅ **Fix**: Enforce 5-round maximum, escalate if no convergence

❌ **Authority Bias**: Lower-weight agents defer to higher-weight  
✅ **Fix**: Anonymous initial scoring, reveal weights only during debate

❌ **Scope Creep**: Discussion drifts to unrelated topics  
✅ **Fix**: Moderator redirects firmly: "Let's stay focused on {original_topic}"

❌ **False Consensus**: Agreement reached but concerns not truly resolved  
✅ **Fix**: Require each agent to state: "My remaining concern is..." before closing

❌ **Documentation Debt**: Decision made but not recorded  
✅ **Fix**: Make memory update part of Step 4, block progress until done

---

## Cavecrew 轻量级子代理模式 (v3.1 新增)

PartyMode 的 Roundtable Discussion 适用于决策型场景（架构选择、技术方案辩论）。但对于**代码修改类任务**，需要更轻量的子代理委托协议。Cavecrew 提供三个只读/最小变更子代理：

### 何时使用 Cavecrew vs PartyMode

| 场景 | 模式 |
|------|------|
| "选哪个框架？" / "怎么设计这个模块？" | PartyMode (Roundtable) |
| "修这个 bug" / "改这两行代码" | Cavecrew (Surgical) |
| "review 这段 diff" | Cavecrew-Reviewer |
| "查一下 X 在哪里定义的" | Cavecrew-Investigator |

### Cavecrew 子代理协议

**Cavecrew-Investigator（只读代码定位器）**:
- 职责：查找文件:行号表格，回答"X 在哪里定义"、"谁调用了 Y"、"列出 Z 的所有使用点"
- 输出格式：`<path:line> — <symbol> — <≤6词注释>`，按 Defs/Refs/Callers 分组
- **关键优势**：输出被主上下文压缩 60%，主会话寿命延长数倍
- 拒绝提议修复、拒绝设计

**Cavecrew-Builder（手术式单文件编辑）**:
- 职责：1-2 个文件范围内的精确编辑，包括 typo 修复、单函数重写、机械重命名
- 硬限制：3+ 文件范围则拒绝并拆分
- 四种终端状态：tiny-big / needs-confirm / ambiguous / regressed
- 输出格式：`<path:line-range> — <变更≤10词>` + verified: <re-read OK | mismatch>

**Cavecrew-Reviewer（Diff/分支审查器）**:
- 职责：代码审查，每个发现一行报告，四级严重度体系
- 严重度等级：🔴 bug(错误输出/崩溃/安全漏洞) / 🟡 risk(边界条件/竞态/泄漏) / 🔵 nit(样式/命名) / ❓ question(需作者意图)
- 输出格式：`path:line: <emoji> <severity>: <problem>. <fix>.`

### Cavecrew + PartyMode 集成模式

```
Wave Execution Agent 需要修改代码时:
    │
    ├─→ Step 1: Spawn Investigator (定位变更范围)
    │   └─→ Output: file list + line ranges (~40% token savings)
    │
    ├─→ Step 2: Spawn Builder (执行精确编辑)
    │   └─→ Constraint: max 2 files, surgical changes only
    │
    └─→ Step 3: Spawn Reviewer (审查 diff)
        └─→ Output: severity-tagged findings
```

**设计原则**: 子代理输出被注入主上下文时压缩 ~60% = 主会话寿命延长数倍。与 Wave Executor 中"最小变更 Agent 模板"高度互补。

---

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added detailed step-by-step workflow
  - Implemented comprehensive error handling
  - Defined strict output templates
  - Added boundary conditions and edge cases
  - Integrated with memory system (DECISIONS, LESSONS, domain skills)

- **v1.0** (2024-01-10): Initial implementation based on BMAD-METHOD
  - Basic multi-agent discussion framework
  - YAML configuration system
  - Auto-summary mechanism
  - Simplified consensus calculation
