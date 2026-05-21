---
name: phase-1-5whys
version: 3.0.0
layer: L1-INTERACTION
phase: 1
description: Apply the "5 Whys" root cause analysis technique to uncover true user needs beneath surface-level requests
requires: [g0-gate-decision, strategy-document]
provides: [user-stories, acceptance-criteria, glossary, scope-boundaries, g1-gate-decision]
dependencies:
  - phase-0-strategy
gate: G1
triggers:
  - requirements clarification
  - root cause analysis
  - user stories
  - g1-gate
  - phase 1
allowed-tools:
  - Read
  - Write
  - Bash
  - Edit
  - AskUserQuestion
  - WebSearch
  - Skill
token_budget: "~200K per execution agent"
---

# Phase 1: 5 Whys Deep Dive — Requirements Clarification

Apply the "5 Whys" root cause analysis technique to uncover true user needs beneath surface-level requests. Transform vague requirements into testable acceptance criteria with clear scope boundaries. Prevents building solutions to wrong problems.

**Core philosophy**: Users often describe solutions, not problems. Dig deeper. Ask "why" until you hit the real pain point. Define success criteria before writing code.

---

## Preamble

### Key Principles

1. **Root Cause Over Surface Requests**: Users say "I need a button" but mean "I need faster workflow" — find the underlying need through iterative questioning
2. **Testable Acceptance Criteria**: Every requirement must have measurable success criteria (not "improve UX" but "reduce clicks from 5 to 2")
3. **Explicit Scope Boundaries**: Clearly define what's IN scope and OUT of scope — prevents scope creep during implementation
4. **Risk-Aware Planning**: Identify v2 opportunities (nice-to-have) and out-of-scope risks early — set realistic expectations

### When to Activate

**Automatic triggers** (Phase 0 G1 PASS):
- YC strategy assessment passed (≥4 questions substantive)
- User confirms proceeding to requirements phase
- Complex feature requiring detailed specification

**Manual trigger**:
```
/requirements analyze --input .devflow-evo/<req-id>/00-strategy.md
```

**When NOT to use**:
- Trivial bug fixes (<1 hour effort)
- Requirements already crystal clear (documented API spec, wireframes)
- Emergency hotfixes (speed over thoroughness)
- Pure technical refactoring (no user-facing changes)

---

## Step-by-step Workflow

### Step 0: Load Phase 0 Strategy & Context

**Read prerequisite documents**:

```bash
# Load Phase 0 output
cat .devflow-evo/<req-id>/00-strategy.md

# Extract key decisions
YC_PAIN=$(grep -A 3 "Q1:" .devflow-evo/<req-id>/00-strategy.md | grep "Answer:")
YC_COMPETITION=$(grep -A 3 "Q2:" .devflow-evo/<req-id>/00-strategy.md | grep "Answer:")
YC_ADVANTAGE=$(grep -A 3 "Q3:" .devflow-evo/<req-id>/00-strategy.md | grep "Answer:")

echo "✅ Loaded YC assessment: Pain=$YC_PAIN, Competition=$YC_COMPETITION"

# Load project context
if [ -f ".devflow-evo/CONTEXT.md" ]; then
  cat .devflow-evo/CONTEXT.md
  
  # Extract glossary terms
  TERMS=$(grep "^- " .devflow-evo/CONTEXT.md | wc -l)
  echo "✅ Context loaded: $TERMS terms defined"
else
  echo "⚠️ No CONTEXT.md found, will create glossary from scratch"
fi

# Load relevant lessons
if [ -f ".devflow-evo/memory/LESSONS.md" ]; then
  grep -A 5 "related:.*$(basename $(pwd))" .devflow-evo/memory/LESSONS.md
  echo "✅ Relevant lessons loaded"
else
  echo "⚠️ No LESSONS.md found"
fi
```

**Extract core requirement**:

```markdown
## Requirement Summary

**Original Request**: "{user's initial statement}"  
**YC Pain Point**: {from Q1}  
**Target Users**: {from PROJECT_CONTEXT.md}  
**Business Goal**: {from Q5 monetization}  

**Key Constraints**:
- Timeline: {from user or default 2 weeks}
- Budget: {from user or default standard}
- Technical: {from tech stack in CONTEXT.md}

Ready for 5 Whys deep dive.
```

---

### Step 1: Execute 5 Whys Root Cause Analysis

**Iteratively question each requirement to uncover root cause**.

#### 5 Whys Framework

```markdown
## 5 Whys Analysis — [Requirement Topic]

**Starting Point**: "{user's original request}"

### Why #1: Why do you need this?
**Answer**: {business motivation}

### Why #2: Why is that important?
**Answer**: {deeper business impact}

### Why #3: What happens if we don't solve this?
**Answer**: {pain point / risk quantified}

### Why #4: Is there a simpler way to achieve this?
**Answer**: {alternative solutions considered}

### Why #5: How will we know it's successful?
**Answer**: {measurable success criteria}

### Root Cause Identified
**Surface Request**: "{original solution idea}"  
**Real Problem**: "{underlying pain point}"  
**Success Metric**: "{quantifiable target}"
```

#### Example: E-commerce Checkout Optimization

```markdown
## 5 Whys Analysis — Checkout Flow Redesign

**Starting Point**: "Add one-click checkout button"

### Why #1: Why do you need one-click checkout?
**Answer**: Customers abandon cart at payment step (60% drop-off rate).

### Why #2: Why do they abandon at payment?
**Answer**: Form has 12 fields, takes 3-5 minutes to complete on mobile.

### Why #3: What's the cost of this abandonment?
**Answer**: 
- Lost revenue: $50K/month (based on 1,000 abandoned carts × $50 avg order)
- Customer frustration: 40% negative reviews mention "checkout too long"
- Competitive disadvantage: Amazon has 1-click, we don't

### Why #4: Is one-click the only solution?
**Answer**: Alternatives considered:
1. **Guest checkout** (no account required) → Reduces friction but doesn't solve form length
2. **Address autocomplete** (Google Places API) → Helps but still 8+ fields
3. **Saved payment methods** (Stripe Customer) → Good for returning users, not new
4. **Progressive disclosure** (show fields step-by-step) → Better UX but same time
5. **One-click** (pre-fill from profile) → Best for returning users, requires account

**Best approach**: Hybrid — guest checkout + address autocomplete + saved payments for logged-in users

### Why #5: How will we measure success?
**Answer**:
- Primary metric: Cart abandonment rate at payment step (current: 60%, target: <30%)
- Secondary metric: Checkout completion time (current: 3-5 min, target: <1 min)
- Tertiary metric: Conversion rate (current: 2%, target: 3.5%)
- Validation period: 2 weeks A/B test

### Root Cause Identified
**Surface Request**: "Add one-click checkout button"  
**Real Problem**: "Mobile checkout form too long, causing 60% abandonment"  
**Success Metric**: "Reduce payment-step abandonment from 60% to <30% within 2 weeks"
```

**AI 执行 5 Whys 分析**（按指令自执行）:

```markdown
# AI 逐步追问执行 5 Whys 分析
# 输入：用户需求 + 项目上下文
# 输出：根因分析 + 成功指标

## 步骤：
1. Why 1: "为什么需要 {requirement}？"
2. Why 2: "为什么 {why1} 对业务重要？"
3. Why 3: "如果不解决 {why2} 会怎样？量化成本"
4. Why 4: "{requirement} 是唯一方案吗？更简单的替代？"
5. Why 5: "如何衡量成功？具体指标和时间线"

## 输出格式：
- surface_request: 用户原始需求
- root_cause: Why 3 揭示的根因
- success_metric: Why 5 定义的成功标准
- alternatives_considered: Why 4 考虑的替代方案
- whys_chain: [why1, why2, why3, why4, why5]
```

---

### Step 2: Generate User Stories & Acceptance Criteria

**Transform root cause into actionable user stories with testable AC**.

#### User Story Template

```markdown
## User Stories

### Story US-001: [Role] can [Action] so that [Benefit]

**As a**: {user persona}  
**I want to**: {specific action}  
**So that**: {business value / benefit}  

**Priority**: {P0/P1/P2}  
**Effort Estimate**: {S/M/L/XL}  

### Acceptance Criteria

**AC-001**: {testable condition}
- **Given**: {precondition}
- **When**: {action}
- **Then**: {expected outcome}
- **Verification**: {how to test}

**AC-002**: {testable condition}
- **Given**: ...
- **When**: ...
- **Then**: ...
- **Verification**: ...

[Repeat for all ACs]

### Out of Scope (for this iteration)
- {item_1} → Deferred to v2
- {item_2} → Requires separate epic

### Risks
- **v2 Opportunity**: {nice-to-have enhancement}
- **Out-of-Scope Risk**: {what could go wrong if we skip this}
```

#### Example: Checkout Optimization User Stories

```markdown
## User Stories

### Story US-001: Guest users can checkout without creating an account

**As a**: First-time shopper  
**I want to**: Complete purchase without forced account creation  
**So that**: I can buy quickly without remembering another password  

**Priority**: P0 (critical for conversion)  
**Effort Estimate**: M (2-3 days)  

### Acceptance Criteria

**AC-001**: Guest checkout option visible on cart page
- **Given**: User has items in cart
- **When**: User clicks "Proceed to Checkout"
- **Then**: User sees two options: "Login" or "Continue as Guest"
- **Verification**: Manual test on staging environment

**AC-002**: Guest checkout form has ≤5 required fields
- **Given**: User selects "Continue as Guest"
- **When**: Checkout form loads
- **Then**: Only 5 fields marked as required: Email, Name, Address, City, ZIP
- **Verification**: Count required fields in UI, verify form submits with only these

**AC-003**: Guest checkout completes in <1 minute on mobile
- **Given**: User on mobile device (iPhone/Android)
- **When**: User fills guest checkout form with valid data
- **Then**: Total time from form load to confirmation <60 seconds
- **Verification**: Automated performance test using Lighthouse mobile emulation

**AC-004**: Guest receives order confirmation email
- **Given**: User completes guest checkout
- **When**: Payment succeeds
- **Then**: Confirmation email sent to provided email within 30 seconds
- **Verification**: Check email inbox (or Mailhog in staging)

**AC-005**: Guest can optionally create account after purchase
- **Given**: User completed guest checkout
- **When**: User views order confirmation page
- **Then**: Option to "Create Account with This Order" appears
- **Verification**: Click button, verify account created with order history

### Out of Scope (for this iteration)
- Saved payment methods for guests → Requires PCI compliance, deferred to v2
- Address validation (USPS API) → Nice-to-have, not critical for MVP
- Multi-shipping addresses → Complex feature, separate epic

### Risks
- **v2 Opportunity**: One-click checkout for returning customers (requires Stripe Customer integration)
- **Out-of-Scope Risk**: Without saved payments, repeat purchases still slow → May lose loyal customers to competitors
```

**Generation** (AI 按指令执行):

```markdown
# AI 根据根因和成功指标生成用户故事
# 输入：root_cause + success_metric
# 输出：.devflow-evo/<req-id>/01-analysis.md（含用户故事和验收标准）
```

---

### Step 3: Define Glossary & Terminology

**Document domain-specific terms to prevent ambiguity**.

#### Glossary Template

```markdown
## Glossary

| Term | Definition | Example |
|------|------------|---------|
| {term_1} | {clear definition} | {usage example} |
| {term_2} | {clear definition} | {usage example} |
| {term_3} | {clear definition} | {usage example} |

**Minimum**: ≥3 terms for technical domains, ≥5 for complex business logic
```

#### Example: E-commerce Glossary

```markdown
## Glossary

| Term | Definition | Example |
|------|------------|---------|
| Cart Abandonment Rate | % of users who add items to cart but don't complete purchase | 60% = 600 abandonments / 1,000 cart additions |
| Guest Checkout | Purchase flow that doesn't require account creation | User enters email, ships, pays, done — no password needed |
| Conversion Rate | % of visitors who complete desired action (purchase) | 2% = 20 purchases / 1,000 visitors |
| PCI Compliance | Payment Card Industry security standards for handling credit cards | Required if storing card numbers; Stripe handles this for us |
| A/B Test | Experiment comparing two versions to determine which performs better | Version A (current) vs Version B (guest checkout) for 2 weeks |
| Lighthouse Score | Google's performance measurement tool (0-100 scale) | Target: Mobile score >80 for checkout page |
```

**Extraction** (AI 按指令执行):

```markdown
# AI 从 CONTEXT.md 和 5 Whys 分析中提取术语
# 1. 读取 CONTEXT.md 中的已有术语
# 2. 识别 5 Whys 分析中的新术语
# 3. 合并去重，更新术语表
```
    """Identify new terms from 5 Whys analysis"""
    # Extract technical/business terms from root cause
    # Use NLP to identify domain-specific vocabulary
    pass

# Merge and deduplicate
existing = extract_terms_from_context('.devflow-evo/CONTEXT.md')
new = add_new_terms(analysis_result)
all_terms = merge_and_deduplicate(existing, new)

# Output glossary markdown
print("## Glossary\n")
for term, definition in all_terms:
    print(f"| **{term}** | {definition} | ... |")
```

---

### Step 4: Define Scope Boundaries (In/Out)

**Explicitly state what's included and excluded to prevent scope creep**.

#### Scope Boundary Template

```markdown
## Scope Boundaries

### In Scope (This Iteration)
- ✅ {feature_1}
- ✅ {feature_2}
- ✅ {feature_3}

### Out of Scope (Deferred)
- ❌ {feature_4} → Reason: {why deferred}
- ❌ {feature_5} → Reason: {why deferred}
- ❌ {feature_6} → Reason: {why deferred}

### Rationale for Exclusions
1. {exclusion_1}: {justification based on priority/cost/complexity}
2. {exclusion_2}: {justification}
3. {exclusion_3}: {justification}
```

#### Example: Checkout Scope

```markdown
## Scope Boundaries

### In Scope (This Iteration)
- ✅ Guest checkout flow (no account required)
- ✅ Simplified form (≤5 required fields)
- ✅ Address autocomplete (Google Places API)
- ✅ Mobile-optimized layout (responsive design)
- ✅ Order confirmation email

### Out of Scope (Deferred)
- ❌ Saved payment methods for guests → Reason: Requires PCI compliance audit ($10K cost), deferred to v2
- ❌ Multi-shipping addresses → Reason: Complex logic, low demand (only 2% of orders), separate epic
- ❌ International shipping calculations → Reason: Requires carrier API integration, current focus is domestic
- ❌ Loyalty points integration → Reason: Depends on loyalty program launch (Q3 roadmap)
- ❌ Buy Now Pay Later (Klarna/Afterpay) → Reason: Partnership negotiations ongoing, not ready

### Rationale for Exclusions
1. **Saved payments**: High compliance cost, low immediate ROI — guest checkout solves 80% of abandonment problem
2. **Multi-shipping**: Edge case (2% of orders) — prioritize features impacting 60% abandonment rate first
3. **International shipping**: Expands scope significantly — validate domestic improvement before expanding
4. **Loyalty points**: Dependency on unreleased feature — avoid coupling to uncertain timeline
5. **BNPL**: External dependency — can't control partner readiness, defer until partnership finalized
```

---

### Step 5: Risk Assessment (v2/out Balance)

**Identify opportunities and risks for future iterations**.

#### Risk Assessment Template

```markdown
## Risk Assessment

### v2 Opportunities (Nice-to-Have Enhancements)
1. **{opportunity_1}**: {description}
   - Impact: {high/medium/low}
   - Effort: {S/M/L}
   - Dependencies: {prerequisites}

2. **{opportunity_2}**: {description}
   - Impact: ...
   - Effort: ...
   - Dependencies: ...

### Out-of-Scope Risks (What Could Go Wrong)
1. **{risk_1}**: {description}
   - Probability: {high/medium/low}
   - Severity: {high/medium/low}
   - Mitigation: {how to reduce impact}

2. **{risk_2}**: {description}
   - Probability: ...
   - Severity: ...
   - Mitigation: ...

### Monitoring Plan
- **Metric 1**: {what to track post-launch}
- **Metric 2**: {what to track}
- **Review Date**: {when to reassess v2 priorities}
```

#### Example: Checkout Risks

```markdown
## Risk Assessment

### v2 Opportunities (Nice-to-Have Enhancements)
1. **One-click checkout for returning customers**: Pre-fill payment/shipping from profile
   - Impact: HIGH (could reduce abandonment to <15%)
   - Effort: M (2 days — Stripe Customer integration)
   - Dependencies: User authentication system (already exists)

2. **Address validation (USPS API)**: Auto-correct invalid addresses
   - Impact: MEDIUM (reduces failed deliveries by 5%)
   - Effort: S (1 day — API integration)
   - Dependencies: USPS developer account (free)

3. **Express checkout wallets (Apple Pay/Google Pay)**: Native mobile payment
   - Impact: HIGH (30% of mobile users prefer wallet payments)
   - Effort: L (5 days — wallet SDK integration)
   - Dependencies: Stripe supports both (no extra work)

### Out-of-Scope Risks (What Could Go Wrong)
1. **Fraud increases with guest checkout**: No account = harder to track fraudulent orders
   - Probability: MEDIUM (industry average 1-2% fraud rate)
   - Severity: HIGH ($50K/month loss if fraud doubles)
   - Mitigation: Implement Stripe Radar (fraud detection), monitor fraud rate weekly, revert if >2%

2. **Customer support burden**: Guests can't view order history, call support more
   - Probability: HIGH (likely increase in "where's my order?" calls)
   - Severity: MEDIUM (support team capacity strain)
   - Mitigation: Add "Track Order" link in confirmation email (no login required), train support on guest lookup

3. **Email deliverability issues**: Guest emails may go to spam
   - Probability: LOW (using SendGrid with good reputation)
   - Severity: HIGH (customer thinks order failed, duplicates order)
   - Mitigation: Monitor bounce rate, implement SPF/DKIM records, test with Gmail/Yahoo/Outlook

### Monitoring Plan
- **Metric 1**: Cart abandonment rate at payment step (target: <30%, alert if >40%)
- **Metric 2**: Guest checkout fraud rate (target: <2%, alert if >3%)
- **Metric 3**: Support ticket volume related to "order status" (baseline: 50/week, alert if >100/week)
- **Review Date**: 2 weeks post-launch (after A/B test completes)
```

---

### Step 6: G2 Gate Evaluation

**Validate analysis quality before proceeding to Phase 2**.

#### G2 Checklist

```markdown
## G2 Gate: Analysis Quality Assessment

### Validation Checklist

- [ ] **AC Testability**: Each AC has Given/When/Then format with verification method
  - Status: {PASS/FAIL}
  - Notes: {details}

- [ ] **Scope Clarity**: In/Out of Scope explicitly listed with rationale
  - Status: {PASS/FAIL}
  - Notes: {details}

- [ ] **Glossary Completeness**: ≥3 technical/business terms defined
  - Status: {PASS/FAIL}
  - Count: {number of terms}
  - Notes: {details}

- [ ] **Risk Balance**: At least 1 v2 opportunity AND 1 out-of-scope risk identified
  - Status: {PASS/FAIL}
  - v2 count: {number}
  - Risk count: {number}
  - Notes: {details}

- [ ] **Consistency with Phase 0**: Aligns with YC strategy (pain point, target users)
  - Status: {PASS/FAIL}
  - Notes: {details}

### Gate Decision

**Passing Criteria**: All 5 checks PASS  
**Result**: [PASS / FAIL]

If FAIL:
- Return to Step 2 (5 Whys) to clarify ambiguous areas
- Add missing ACs, glossary terms, or risk assessments
- Re-evaluate gate

If PASS:
- Proceed to Phase 2 (Design & Architecture)
- User stories become input for task breakdown
```

**G2 自动化验证**（AI 逐项核对）:

```markdown
# AI 逐项核对 G2 Gate：
# 1. AC 可测试性：每个 AC 是否有 Verification 步骤
# 2. 根因是否识别（非表面需求）
# 3. 成功指标是否可量化
# 4. 用户故事是否覆盖所有场景
```
  exit 1
fi

# Check scope clarity
IN_SCOPE=$(grep -c "^- ✅" $ANALYSIS_FILE)
OUT_SCOPE=$(grep -c "^- ❌" $ANALYSIS_FILE)

if [ $IN_SCOPE -ge 1 ] && [ $OUT_SCOPE -ge 1 ]; then
  echo "✅ Scope Clarity: PASS ($IN_SCOPE in, $OUT_SCOPE out)"
else
  echo "❌ Scope Clarity: FAIL (missing in/out scope)"
  exit 1
fi

# Check glossary
GLOSSARY_TERMS=$(grep -c "^|" $ANALYSIS_FILE | head -1)

if [ $GLOSSARY_TERMS -ge 3 ]; then
  echo "✅ Glossary: PASS ($GLOSSARY_TERMS terms)"
else
  echo "❌ Glossary: FAIL (only $GLOSSARY_TERMS terms, need ≥3)"
  exit 1
fi

# Check risk balance
V2_OPPORTUNITIES=$(grep -c "v2 Opportunity" $ANALYSIS_FILE)
OUT_RISKS=$(grep -c "Out-of-Scope Risk" $ANALYSIS_FILE)

if [ $V2_OPPORTUNITIES -ge 1 ] && [ $OUT_RISKS -ge 1 ]; then
  echo "✅ Risk Balance: PASS ($V2_OPPORTUNITIES v2, $OUT_RISKS risks)"
else
  echo "❌ Risk Balance: FAIL (need ≥1 v2 AND ≥1 risk)"
  exit 1
fi

echo "✅ G2 Gate: PASS — All checks passed"
exit 0
```

**Update STATE.md**:

```bash
# Update state file
cat >> .devflow-evo/STATE.md << EOF

## Phase 1 Results ($(date))
current_phase: phase-1-complete
g2_result: PASS
user_stories_count: $(grep -c "^### Story US-" .devflow-evo/<req-id>/01-analysis.md)
acceptance_criteria_count: $(grep -c "^AC-" .devflow-evo/<req-id>/01-analysis.md)
glossary_terms: $(grep -c "^|" .devflow-evo/<req-id>/01-analysis.md | head -1)
next_phase: phase-2-design
EOF

echo "✅ STATE.md updated with Phase 1 results"
```

---

### Step 7: 用户确认

**交互协议**: 先展示完整确认清单,再逐项逐个确认(避免并列提问)。

```markdown
📍 当前阶段: Phase 1 · 5 Whys — G2 Analysis Quality Gate
🎯 本步目标: 确认五问分析结果和 G2 Gate 决策

---
## 📋 确认清单 (共 3 项)

请按顺序逐项确认以下问题。回答选项编号 [1]/[2]/[3] 或输入自定义内容:

### ❓ 问题 1/3：G2 Gate 决策是否合理（5 项检查全部 PASS）？

[1] ✅ 分析质量达标，继续 ← 推荐
[2] 需要补充用户故事或验收标准
[3] 查看详细 G2 检查结果

→ 回答: _← 请先确认此题后再看下一题_

---
*(确认后显示)*
### ❓ 问题 2/3：根因分析是否充分（≥1 个可执行根因）？

[1] ✅ 根因清晰，可执行 ← 推荐
[2] 根因不够深入，需要继续追问
[3] 存在多个根因，需要拆分方案

→ 回答: _← 请先确认此题后再看下一题_

---
*(确认后显示)*
### ❓ 问题 3/3：是否同意进入 Phase 2 设计？

[1] ✅ 同意，继续 Phase 2 ← 推荐
[2] 需要修改 01-analysis.md
[3] 回退到 Phase 0 重审战略

→ 回答: _← 确认所有问题后流程继续_
```→ 回答: _← 确认所有问题后流程继续_

---

## Error Handling

### Common Issues and Fixes

**Issue 1: Vague Acceptance Criteria**

- **Symptom**: AC says "Improve UX" or "Make it fast" (not testable)
- **Cause**: Didn't complete 5 Whys deeply enough
- **Fix**:
  1. Rewrite AC with Given/When/Then format
  2. Add measurable metric: "Load time <2s" not "fast"
  3. Specify verification method: "Lighthouse score >90" not "good performance"
- **Prevention**: Enforce AC template with verification field

**Issue 2: Missing Scope Boundaries**

- **Symptom**: No Out of Scope section, everything seems included
- **Cause**: Fear of excluding important features
- **Fix**:
  1. List top 3-5 features NOT building in this iteration
  2. Provide rationale for each exclusion (cost, complexity, priority)
  3. Document when they'll be addressed (v2, separate epic)
- **Prevention**: Require Out of Scope section in template

**Issue 3: Insufficient Glossary**

- **Symptom**: Only 1-2 terms defined, assuming everyone knows domain jargon
- **Cause**: Expert blind spot (forgetting what beginners don't know)
- **Fix**:
  1. Identify all acronyms and technical terms in user stories
  2. Define each term clearly with examples
  3. Ask non-expert colleague to review for clarity
- **Prevention**: Minimum 3 terms enforced by G2 gate

**Issue 4: No Risk Assessment**

- **Symptom**: v2/out sections empty or "none"
- **Cause**: Optimism bias (assuming everything will go smoothly)
- **Fix**:
  1. Brainstorm worst-case scenarios for each out-of-scope item
  2. Identify nice-to-have enhancements deferred to v2
  3. Create monitoring plan to detect issues early
- **Prevention**: Require ≥1 v2 opportunity AND ≥1 risk

**Issue 5: Inconsistency with Phase 0**

- **Symptom**: User stories don't align with YC pain point from Phase 0
- **Cause**: Lost sight of original problem during analysis
- **Fix**:
  1. Re-read 00-strategy.md Q1 (pain point) and Q6 (success metric)
  2. Verify each user story directly addresses that pain
  3. Remove stories that don't contribute to solving core problem
- **Prevention**: Cross-reference checklist in G2 gate

---

## Error Taxonomy

| Priority | Condition | Detection Method | Recovery Action |
|----------|-----------|------------------|-----------------|
| **P0** | Root cause sits above requirements layer (architectural/infra issue) | 5th "why" yields "because the framework is bad" or "needs new server" | Redirect to Phase 2 (Design), flag as infra refactor ticket, close requirement with P0 label |
| **P1** | Chain of 5 whys does not converge on single root cause | ≥3 distinct root causes identified at step 5 | Split into parallel requirement branches, each gets own user story set |
| **P2** | Answer to a "why" is ambiguous (multiple valid interpretations) | Any answer contains "or", "maybe", or spans >2 paragraphs without clear focus | Ask follow-up question to disambiguate before proceeding to next why |
| **P3** | A branch marked as "closed/defunct" but still active in analysis | A past decision (e.g., "using PostgreSQL") treated as open question mid-chain | Cross-reference with PROJECT_CONTEXT.md, close defunct branches early |

---

## Boundary Conditions

### Analysis Thresholds

| Parameter | Value/Condition | Rationale | Enforcement |
|-----------|-----------------|-----------|-------------|
| Whys depth limit | Maximum 5 layers deep | Beyond 5 whys → diminishing returns, cognitive overload | Stop at step ≤4 if root cause identified; note "chain incomplete — manual review needed" |
| Per-step timeout | ≤3 min per "why" question | Prevents analysis paralysis on single requirement branch | Auto-advance with "[ASSUMED] next why based on best available info" if exceeded |
| Convergence condition | Single root cause at final step OR ≥2 parallel branches clearly labeled | Multiple root causes → multi-pronged solution; none → analysis not deep enough | G2 gate validates: "≥1 root cause identified and actionable" or fail |
| Stakeholder alignment | All named stakeholders agree on ≥4 of 5 whys answers before proceeding to user stories | Prevents requirement rework when stakeholder expectations diverge | Disputed "why" → mark "[DISPUTED by {role}] — requires consensus" |

### When to Escalate Immediately

**Skip 5 Whys, escalate to product manager if**:
- Conflicting stakeholder requirements (CEO wants X, CTO wants Y)
- Regulatory/legal implications (GDPR, HIPAA compliance)
- Major architectural decisions affecting multiple teams
- Budget/timeline unrealistic for stated requirements

### When to Skip Phase 1

**Use lightweight analysis (no full 5 Whys) if**:
- Requirements documented in detail already (API spec, Figma wireframes)
- Small enhancement (<2 user stories, <1 week effort)
- Bug fix with clear reproduction steps
- Internal tooling with known users (informal agreement sufficient)

### Edge Cases

**Technical Spikes (Research Tasks)**:

- Replace user stories with research questions
- AC becomes "answer validated by prototype/test"
- Glossary focuses on new technologies/concepts
- Scope = research scope, not implementation scope

**Regulatory Compliance Features**:

- 5 Whys less relevant (requirement is legal mandate, not user choice)
- Focus on compliance checklist rather than user benefits
- Glossary includes legal/regulatory terms
- Risks emphasize non-compliance penalties

**AI/ML Features**:

- AC includes accuracy thresholds (e.g., "90% precision")
- Glossary defines ML metrics (precision, recall, F1)
- v2 opportunities include model improvements
- Risks highlight data quality dependencies

**Legacy System Integration**:

- 5 Whys uncovers hidden dependencies on old systems
- Glossary includes legacy terminology
- Out of Scope lists modernizations deferred
- Risks emphasize integration complexity

---

## Output Template

### Standard 01-analysis.md

```markdown
# Phase 1: Requirements Analysis — [Project Name]

## 5 Whys Root Cause Analysis

**Starting Point**: "{original request}"  
**Root Cause**: "{underlying problem}"  
**Success Metric**: "{measurable target}"  

[Full 5 Whys chain]

## User Stories

### Story US-001: [Role] can [Action] so that [Benefit]
**Priority**: {P0/P1/P2}  
**Effort**: {S/M/L}  

**Acceptance Criteria**:
- AC-001: Given/When/Then + Verification
- AC-002: ...

**Out of Scope**:
- {deferred_item}

---

[Repeat for all stories]

## Glossary

| Term | Definition | Example |
|------|------------|---------|
| ... | ... | ... |

## Scope Boundaries

### In Scope
- ✅ {feature_1}
- ✅ {feature_2}

### Out of Scope
- ❌ {feature_3} → Reason: {rationale}

## Risk Assessment

### v2 Opportunities
1. {opportunity_1} (Impact: {level}, Effort: {size})

### Out-of-Scope Risks
1. {risk_1} (Probability: {level}, Severity: {level}, Mitigation: {plan})

## G2 Gate Result

**Checklist**:
- [ ] AC Testability: PASS/FAIL
- [ ] Scope Clarity: PASS/FAIL
- [ ] Glossary: PASS/FAIL ({count} terms)
- [ ] Risk Balance: PASS/FAIL
- [ ] Phase 0 Consistency: PASS/FAIL

**Result**: [PASS / FAIL]
```

---

## Tool Integration

### Required Tools

**User Story Generation**:
```markdown
# AI 根据根因和成功指标生成用户故事
# --root-cause, --success-metric 作为参数理解分析上下文
# --output 输出到 .devflow-evo/<req-id>/01-analysis.md
```

**G2 Validation**:
```markdown
# AI 逐项核对 G2 Gate（见上方验证清单）
```

### Optional Tools

**Lighthouse Performance Testing** (for AC verification):
```bash
# Test checkout page performance
lighthouse http://localhost:3000/checkout \
  --output=json \
  --output-path=.devflow-evo/<req-id>/lighthouse-report.json
```

**A/B Test Setup** (for success metric tracking):
```bash
# Configure A/B test in analytics platform
curl -X POST "https://api.optimizely.com/v2/experiments" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Guest Checkout Test", "variations": [...]}'
```

---

## Implementation Checklist

Before analysis:
- [ ] Phase 0 strategy loaded (00-strategy.md)
- [ ] Project context available (CONTEXT.md or user interview)
- [ ] Relevant lessons reviewed (LESSONS.md)

During analysis:
- [ ] 5 Whys executed to root cause (not stopping at surface)
- [ ] User stories written in Role/Action/Benefit format
- [ ] Each AC has Given/When/Then + Verification method
- [ ] Glossary has ≥3 terms defined
- [ ] In/Out of Scope explicitly listed with rationale
- [ ] ≥1 v2 opportunity AND ≥1 out-of-scope risk identified

After analysis:
- [ ] 01-analysis.md written to .devflow-evo/<req-id>/
- [ ] G2 gate validation passed (all 5 checks)
- [ ] STATE.md updated with results
- [ ] User confirmation received (R8.2 stop-and-wait)

Quality gates:
- [ ] Every AC is testable (has verification method)
- [ ] Scope boundaries prevent ambiguity
- [ ] Glossary prevents terminology confusion
- [ ] Risks documented for proactive mitigation
- [ ] Alignment with Phase 0 strategy maintained

---

## Anti-Patterns to Avoid

❌ **Stopping at Surface Requests**: Building what user asked for, not what they need  
✅ **Fix**: Execute full 5 Whys chain, validate root cause with user

❌ **Untestable ACs**: "Improve performance" without metrics  
✅ **Fix**: Every AC must have measurable success criteria

❌ **Implicit Scope**: Assuming everyone knows what's excluded  
✅ **Fix**: Explicitly list Out of Scope items with rationale

❌ **Empty Glossary**: Using jargon without definitions  
✅ **Fix**: Define all domain-specific terms, minimum 3

❌ **Ignoring Risks**: Pretending nothing can go wrong  
✅ **Fix**: Identify v2 opportunities AND out-of-scope risks

❌ **Skipping User Confirmation**: Proceeding without explicit approval  
✅ **Fix**: R8.2 rule — wait for user "Y" before next phase

---

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added 6-step workflow (load context → 5 Whys → user stories → glossary → scope → G2)
  - Implemented detailed AC template (Given/When/Then + Verification)
  - Defined comprehensive error handling (5 common issues)
  - Integrated automated G2 validation script
  - Added boundary conditions for edge cases (spikes, compliance, AI/ML)

- **v1.0** (2024-01-10): Initial implementation based on 交互层 Phase 1 + get-shit-done Grill
  - Basic 5 Whys framework
  - Simple user story template
  - No automated validation
  - Minimal error handling

---

### Sprint 10 Audit
- **E-P1-1**: Phase 1-5whys quality document completed ✅ — Error Taxonomy (lines 755-763), Boundary Conditions (lines 766-821), Output Template (lines 825-890), Anti-Patterns (lines 961-979) all present

## Sprint 10 Audit
- **E-P1-1**: Phase 1-5whys quality document completed ✅ (Error Taxonomy, Boundary Conditions, Output Template, Anti-Patterns all present)
