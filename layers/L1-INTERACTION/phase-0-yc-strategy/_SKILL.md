---
name: phase-0-yc-strategy
version: 3.0-draft
layer: L1-INTERACTION
phase: 0
description: Apply Y Combinator's due diligence framework to validate project viability before implementation
requires: [project-context]
provides: [g0-gate-decision, strategy-document, follow-up-queue]
dependencies:
  - phase-0-strategy
gate: G0
triggers:
  - YC strategy validation
  - six questions assessment
  - g0-gate
  - strategy phase
allowed-tools:
  - Read
  - Write
  - Bash
  - Edit
  - AskUserQuestion
  - WebSearch
  - WebFetch
token_budget: "~200K per execution agent"
---

# Phase 0: YC Six Questions — Strategic Assessment

Apply Y Combinator's due diligence framework to validate project viability before implementation. Answer 6 critical questions about pain point, competition, advantage, acquisition, monetization, and acceleration. Ensures strategic alignment before tactical execution.

**Core philosophy**: Don't build what nobody wants. Validate problem-solution fit first. Be brutally honest about weaknesses. Kill bad ideas early.

---

## Preamble

### Key Principles

1. **Brutal Honesty**: No sugar-coating — if pain point is weak, say so; if competition is fierce, acknowledge it; if monetization unclear, flag it
2. **Evidence-Based Answers**: Every claim backed by data (market research, user interviews, competitor analysis) — no gut feelings
3. **Minimum 4 Substantive Answers**: At least 4 of 6 questions must have detailed, evidence-backed responses to pass G1 gate — prevents proceeding with half-baked ideas
4. **Follow-Up on Weak Areas**: Questions scoring <3/5 automatically flagged for Phase 1 (5 Whys) deep-dive — ensures thorough validation

### When to Activate

**Automatic triggers** (project start):
- New feature request with business impact
- User says "build X" without context
- Complex project requiring strategic alignment

**Manual trigger**:
```
/strategy assess --context .devflow-evo/memory/PROJECT_CONTEXT.md
```

**When NOT to use**:
- Trivial bug fixes (<1 hour effort)
- Internal tooling with known requirements
- Emergency hotfixes (speed over strategy)
- Pure technical refactoring (no business logic change)

---

## Step-by-step Workflow

### Step 0: Load Project Context

**Read background information**:

```bash
# Load project context
if [ -f ".devflow-evo/memory/PROJECT_CONTEXT.md" ]; then
  cat .devflow-evo/memory/PROJECT_CONTEXT.md
  
  # Extract key info
  TECH_STACK=$(grep "Tech Stack:" .devflow-evo/memory/PROJECT_CONTEXT.md | cut -d':' -f2-)
  BUSINESS_DOMAIN=$(grep "Business Domain:" .devflow-evo/memory/PROJECT_CONTEXT.md | cut -d':' -f2-)
  USER_PERSONA=$(grep "Target Users:" .devflow-evo/memory/PROJECT_CONTEXT.md | cut -d':' -f2-)
  
  echo "✅ Context loaded: $TECH_STACK, $BUSINESS_DOMAIN"
else
  echo "⚠️ No project context found, will derive from user input only"
  CONFIDENCE="LOW"
fi

# Load current state
cat .devflow-evo/STATE.md
```

**Extract user requirement**:

```bash
# Parse user's initial request
USER_INPUT="$1"  # Passed as argument

# Identify key elements
PROBLEM=$(echo "$USER_INPUT" | grep -oP '(?<=problem: ).*')
GOAL=$(echo "$USER_INPUT" | grep -oP '(?<=goal: ).*')
CONSTRAINTS=$(echo "$USER_INPUT" | grep -oP '(?<=constraints: ).*')
```

**Output format**:
```markdown
## Project Context Loaded

**Tech Stack**: {languages/frameworks}  
**Business Domain**: {industry/sector}  
**Target Users**: {persona description}  
**User Request**: "{original input}"  

**Confidence Level**: {HIGH|MEDIUM|LOW} (based on context availability)

Ready for YC Six Questions assessment.
```

---

### Step 1: Q1 — How Painful Is the Problem?

**Assess problem severity and urgency**.

#### Question Framework

```markdown
## Q1: How Painful Is the Problem?

**Sub-questions**:
1. What specific problem are users trying to solve?
2. What's the cost of NOT solving it? (time/money/frustration)
3. What are current workarounds? Why do they suck?
4. How frequently does this problem occur? (daily/weekly/monthly)
5. How many users experience this? (TAM/SAM/SOM)

**Evidence Required**:
- User interview quotes (≥3)
- Support ticket volume (if applicable)
- Market research data
- Competitor customer complaints
```

#### Example Answer

```markdown
### Q1 Answer: HIGH PAIN (4/5)

**Problem**: Small business owners spend 2-3 hours daily manually reconciling bank transactions with invoices.

**Cost of Not Solving**:
- Time waste: 2.5 hrs/day × $50/hr = $125/day × 260 days = $32,500/year per business
- Error rate: Manual entry has 5% error rate → average $2,000/year in accounting mistakes
- Frustration: 78% of surveyed owners say this is their #1 administrative pain point

**Current Workarounds**:
1. Excel spreadsheets (error-prone, time-consuming)
2. Hire bookkeeper ($500-1,000/month, still manual)
3. QuickBooks auto-import (only works for 60% of transactions, rest manual)

**Why They Suck**:
- Excel: No automation, high error rate, doesn't scale
- Bookkeeper: Expensive, still requires oversight
- QuickBooks: Incomplete automation, requires manual review

**Frequency**: Daily (for active businesses)

**Market Size**:
- TAM: 30M small businesses globally
- SAM: 8M in English-speaking markets
- SOM: 800K reachable via our channels (10% of SAM)

**User Quotes**:
- "I dread month-end reconciliation. Takes forever and I always find mistakes." — Sarah, bakery owner
- "Hired a bookkeeper but still spend 1 hour/week reviewing their work." — Mike, consulting firm
- "QuickBooks helps but I still manually categorize 40% of transactions." — Lisa, e-commerce store

**Verdict**: HIGH PAIN — Significant time/money waste, frequent occurrence, large market
```

**Scoring Criteria**:

| Score | Criteria |
|-------|----------|
| 5/5 | Critical problem, daily occurrence, >$10K/year cost, huge market |
| 4/5 | Significant pain, weekly occurrence, $1-10K/year cost, large market |
| 3/5 | Moderate inconvenience, monthly occurrence, <$1K/year cost, medium market |
| 2/5 | Minor annoyance, rare occurrence, negligible cost, small market |
| 1/5 | Non-problem, users don't care, no market |

---

### Step 2: Q2 — What Are Existing Solutions?

**Analyze competitive landscape and identify gaps**.

#### Question Framework

```markdown
## Q2: What Existing Solutions Exist and Why Aren't They Good Enough?

**Sub-questions**:
1. List top 3-5 competitors/alternatives
2. What do they do well? (be fair)
3. Where do they fall short? (specific gaps)
4. Why haven't they solved this completely?
5. What's our differentiation?

**Evidence Required**:
- Competitor feature comparison table
- Customer reviews (G2, Capterra, Trustpilot)
- Pricing analysis
- Market share data
```

#### Example Answer

```markdown
### Q2 Answer: MODERATE COMPETITION (3/5)

**Competitor Analysis**:

| Solution | Strengths | Weaknesses | Price | Market Share |
|----------|-----------|------------|-------|--------------|
| QuickBooks | Brand recognition, ecosystem | Only 60% auto-categorization, complex UI | $25-150/mo | 45% |
| Xero | Clean UI, good mobile app | Poor bank reconciliation, limited rules | $11-62/mo | 20% |
| FreshBooks | Great for freelancers | Not built for multi-account businesses | $15-50/mo | 10% |
| Excel + Macros | Free, fully customizable | High setup time, error-prone, no support | $0 | 15% |
| Manual Bookkeeper | Human judgment, handles edge cases | Expensive, slow, inconsistent | $500-1,000/mo | 10% |

**Gap Analysis**:

**What Competitors Do Well**:
- QuickBooks: Strong brand, extensive integrations (2,000+ apps)
- Xero: Beautiful UI, excellent mobile experience
- FreshBooks: Perfect for solo freelancers

**Where They Fall Short**:
1. **Automation Gap**: None achieve >80% auto-categorization accuracy
   - QuickBooks: 60% (requires manual review of 40%)
   - Xero: 50% (even worse for complex businesses)
   
2. **Learning Curve**: All require 10-20 hours initial setup
   - Rule configuration is complex
   - Chart of accounts setup confusing for non-accountants
   
3. **Multi-Account Handling**: Poor support for businesses with 3+ bank accounts
   - Reconciliation across accounts is manual
   - Transfer detection is unreliable

4. **Price vs Value**: Expensive for what you get
   - QuickBooks at $150/mo still requires 5 hrs/month manual work
   - Effective hourly rate: $30/hr (not much better than hiring)

**Why Haven't They Solved It**:
- Legacy architecture (QuickBooks founded 1983, hard to modernize)
- Focus on breadth over depth (serve all business types, none perfectly)
- AI/ML adoption slow (traditional accounting software companies)

**Our Differentiation**:
1. **AI-Powered Categorization**: Target 90%+ accuracy using ML trained on 1M+ transactions
2. **Zero-Setup Onboarding**: Auto-detect business type, pre-configure rules (5 min vs 10-20 hrs)
3. **Multi-Account Intelligence**: Automatically detect transfers, reconcile across accounts
4. **Transparent Pricing**: $49/mo flat rate, unlimited accounts, unlimited transactions

**Verdict**: MODERATE COMPETITION — Established players exist but have clear gaps we can exploit
```

**Scoring Criteria**:

| Score | Criteria |
|-------|----------|
| 5/5 | No direct competitors, blue ocean opportunity |
| 4/5 | Competitors exist but have major gaps, easy differentiation |
| 3/5 | Moderate competition, some differentiation possible |
| 2/5 | Fierce competition, hard to differentiate, commoditized market |
| 1/5 | Saturated market, dominant player with 80%+ share, no room |

---

### Step 3: Q3 — What's Your Unfair Advantage?

**Identify sustainable competitive moats**.

#### Question Framework

```markdown
## Q3: What's Your Unfair Advantage?

**Sub-questions**:
1. Why can YOU build this when others couldn't/didn't?
2. What unique assets do you have? (data, relationships, IP, expertise)
3. What would prevent competitors from copying you?
4. How defensible is your position long-term?

**Evidence Required**:
- Team background/relevant experience
- Proprietary data/assets
- Partnerships/exclusive relationships
- Technical barriers (patents, complex algorithms)
```

#### Example Answer

```markdown
### Q3 Answer: WEAK ADVANTAGE (2/5) ⚠️ NEEDS IMPROVEMENT

**Claimed Advantages**:

1. **AI/ML Expertise**: CTO worked at Google Brain, published 5 papers on transaction classification
   - **Strength**: Deep technical knowledge
   - **Weakness**: AI talent is available to competitors too (not exclusive)
   - **Defensibility**: LOW — competitors can hire similar talent

2. **Proprietary Dataset**: Access to 1M anonymized transactions from partner accounting firms
   - **Strength**: Training data advantage, better ML models
   - **Weakness**: Dataset not exclusive (partners could share with others)
   - **Defensibility**: MEDIUM — depends on partnership exclusivity

3. **First-Mover in Niche**: Focusing specifically on e-commerce businesses (underserved segment)
   - **Strength**: Specialized features for e-commerce (Shopify integration, inventory tracking)
   - **Weakness**: Niche is small (limits TAM), QuickBooks could add these features easily
   - **Defensibility**: LOW — not hard to copy

4. **No Real Moat**: Nothing prevents QuickBooks from adding AI categorization tomorrow
   - They have more engineers, more data, bigger brand
   - Our only hope is speed and focus

**Competitor Copy Risk**: HIGH
- QuickBooks has 5,000 engineers vs our 10
- They have 100M+ transactions in their system vs our 1M
- They could launch competing feature in 6 months

**Potential Moats to Build**:
1. **Network Effects**: If we become standard for e-commerce, merchants recommend to each other
2. **Switching Costs**: Once configured, painful to migrate to another system
3. **Brand in Niche**: Become synonymous with "accounting for e-commerce"

**Verdict**: WEAK ADVANTAGE (2/5) — Need to strengthen defensibility or pivot to more defensible position

**Recommendation**: 
- Secure exclusive data partnerships (legally binding)
- Build network effects quickly (referral program, community)
- Consider patenting novel ML approach (if truly innovative)
```

**Scoring Criteria**:

| Score | Criteria |
|-------|----------|
| 5/5 | Strong moat (network effects, proprietary data, patents, regulatory barriers) |
| 4/5 | Moderate moat (brand, switching costs, specialized expertise) |
| 3/5 | Weak moat (first-mover advantage, niche focus) |
| 2/5 | Very weak moat (easily copyable, no exclusivity) |
| 1/5 | No moat (commoditized, anyone can build this) |

---

### Step 4: Q4 — How Will You Acquire Customers?

**Define go-to-market strategy and CAC**.

#### Question Framework

```markdown
## Q4: How Will You Acquire Customers?

**Sub-questions**:
1. Who are your ideal customers? (specific persona)
2. Where do they hang out? (channels)
3. What's your acquisition strategy? (content, ads, partnerships, sales)
4. What's estimated CAC? (cost per acquired customer)
5. What's payback period? (months to recover CAC)

**Evidence Required**:
- Channel testing results (if any)
- Industry benchmark CAC data
- Conversion rate assumptions
- Sales cycle length
```

#### Example Answer

```markdown
### Q4 Answer: VIABLE STRATEGY (4/5)

**Target Persona**: E-commerce business owners, $50K-500K annual revenue, 1-10 employees, using Shopify/WooCommerce.

**Acquisition Channels**:

| Channel | Strategy | Est. CAC | Volume Potential | Confidence |
|---------|----------|----------|------------------|------------|
| Content Marketing | SEO blog posts ("how to reconcile Shopify transactions") | $50 | 500/mo | HIGH |
| Paid Ads | Google Ads (keywords: "automate bookkeeping", "QuickBooks alternative") | $150 | 200/mo | MEDIUM |
| Partnerships | Shopify App Store listing, accounting firm referrals | $30 | 300/mo | HIGH |
| Cold Email | Targeted outreach to e-commerce stores (Apollo.io list) | $100 | 100/mo | LOW |
| Community | Reddit r/ecommerce, Facebook groups, Indie Hackers | $20 | 150/mo | MEDIUM |

**Channel Deep-Dive**:

**1. Content Marketing (Primary)**:
- Strategy: Publish 2 SEO-optimized articles/week targeting long-tail keywords
- Topics: "Shopify reconciliation guide", "QuickBooks vs Xero for e-commerce", "automate bookkeeping"
- Expected traffic: 10,000 visitors/mo within 6 months (based on Ahrefs keyword difficulty)
- Conversion rate: 2% (industry benchmark for B2B SaaS)
- Signups: 200/mo
- CAC: $50 (content creation cost: $1,000/mo ÷ 200 signups)

**2. Shopify App Store (High-Potential)**:
- Strategy: List as Shopify app, optimize for "bookkeeping" category
- Shopify has 4M merchants, 10% actively search for accounting solutions
- Expected installs: 300/mo (top 10 apps in category get 200-500 installs/mo)
- Conversion to paid: 10% (freemium model)
- Paid customers: 30/mo
- CAC: $30 (app store optimization + minimal ads)

**3. Paid Ads (Supplementary)**:
- Strategy: Google Ads on high-intent keywords
- Keywords: "automate bookkeeping" (CPC: $8), "QuickBooks alternative" (CPC: $12)
- Landing page conversion: 5% (above industry average due to strong value prop)
- CAC: $150 ($8 CPC ÷ 5% conversion = $160, rounded up for safety)
- Volume: 200 signups/mo at $150 CAC = $30,000/mo ad spend (scalable if LTV justifies)

**Overall CAC Blended**: 
- Weighted average: ($50×500 + $30×300 + $150×200 + $100×100 + $20×150) ÷ 1,250 = **$68 CAC**

**Payback Period**:
- ARPU: $49/mo (flat pricing)
- Gross margin: 80% (SaaS typical)
- Monthly profit per customer: $49 × 80% = $39
- Payback period: $68 CAC ÷ $39/mo = **1.7 months** ✅ (excellent, <12 months is good)

**Risks**:
- Content marketing takes 6 months to gain traction (cash flow gap)
- Shopify App Store approval uncertain (review process 2-4 weeks)
- Paid ads may have higher CAC initially (optimization needed)

**Mitigation**:
- Start with partnerships (Shopify App Store) for quick wins
- Use paid ads sparingly while content ramps up
- Pre-launch waitlist to validate demand

**Verdict**: VIABLE STRATEGY (4/5) — Multiple channels, reasonable CAC, fast payback
```

**Scoring Criteria**:

| Score | Criteria |
|-------|----------|
| 5/5 | Clear path to customers, CAC < $50, payback <3 months, multiple channels |
| 4/5 | Viable strategy, CAC $50-150, payback 3-12 months, 2-3 channels |
| 3/5 | Unclear strategy, CAC $150-300, payback 12-24 months, 1-2 channels |
| 2/5 | Difficult acquisition, CAC >$300, payback >24 months, unproven channels |
| 1/5 | No clear path, CAC unknown, no channel testing, unrealistic assumptions |

---

### Step 5: Q5 — How Will You Make Money?

**Validate business model and unit economics**.

#### Question Framework

```markdown
## Q5: How Will You Make Money?

**Sub-questions**:
1. What's your pricing model? (subscription, usage-based, freemium, one-time)
2. What's your price point? (monthly/annual)
3. What's estimated LTV? (lifetime value)
4. What's LTV/CAC ratio? (should be >3:1)
5. What's break-even timeline? (months to profitability)

**Evidence Required**:
- Competitor pricing analysis
- Willingness-to-pay survey results
- Churn rate assumptions
- Unit economics calculation
```

#### Example Answer

```markdown
### Q5 Answer: SOLID MODEL (4/5)

**Pricing Model**: Flat-rate subscription, $49/mo, unlimited everything (accounts, transactions, users).

**Pricing Rationale**:
- QuickBooks: $25-150/mo (tiered by features)
- Xero: $11-62/mo (tiered by transaction volume)
- Our positioning: Premium automation at mid-tier price
- Value prop: Save 10 hrs/mo × $50/hr = $500/mo value → $49 is 10% of value (reasonable)

**Revenue Projections** (Year 1):

| Month | Customers | MRR | Growth Rate |
|-------|-----------|-----|-------------|
| 1-3 | 50 | $2,450 | — |
| 4-6 | 200 | $9,800 | 300% |
| 7-9 | 500 | $24,500 | 150% |
| 10-12 | 1,000 | $49,000 | 100% |

**Year 1 Total Revenue**: $215,000

**Unit Economics**:

**LTV Calculation**:
- ARPU: $49/mo
- Gross margin: 80% (typical SaaS)
- Monthly profit: $49 × 80% = $39
- Avg customer lifetime: 24 months (based on 4% monthly churn, industry benchmark)
- **LTV**: $39 × 24 = **$936**

**LTV/CAC Ratio**:
- LTV: $936
- CAC: $68 (from Q4)
- **Ratio**: $936 ÷ $68 = **13.8:1** ✅ (excellent, >3:1 is good, >10:1 is exceptional)

**Break-Even Analysis**:

**Monthly Fixed Costs**:
- Engineering (3 people): $30,000
- Marketing (1 person): $8,000
- Infrastructure (AWS, tools): $2,000
- Overhead (legal, accounting): $3,000
- **Total**: $43,000/mo

**Break-Even Point**:
- Contribution margin per customer: $39/mo
- Customers needed: $43,000 ÷ $39 = **1,103 customers**
- Timeline: Month 13 (based on growth projections above)

**Cash Flow Projection**:
- Months 1-12: Negative cash flow (building product, acquiring customers)
- Month 13: Break-even
- Month 18: $100K MRR, profitable
- Month 24: $250K MRR, healthy margins

**Risks**:
- Churn higher than expected (if product doesn't deliver on promises)
- CAC increases as easy channels saturate
- Price sensitivity (customers expect lower price from startup)

**Mitigation**:
- Annual billing discount (20% off) to improve cash flow and reduce churn
- Freemium tier (free for <50 transactions/mo) to reduce acquisition friction
- Usage-based upsell (charge extra for >10K transactions/mo) for heavy users

**Verdict**: SOLID MODEL (4/5) — Strong unit economics, reasonable pricing, clear path to profitability
```

**Scoring Criteria**:

| Score | Criteria |
|-------|----------|
| 5/5 | LTV/CAC >10:1, payback <3 months, clear path to $1M ARR in 2 years |
| 4/5 | LTV/CAC 5-10:1, payback 3-12 months, path to $500K ARR in 2 years |
| 3/5 | LTV/CAC 3-5:1, payback 12-24 months, uncertain growth trajectory |
| 2/5 | LTV/CAC <3:1, payback >24 months, questionable unit economics |
| 1/5 | No clear monetization, free product, no path to profitability |

---

### Step 6: Q6 — 2x Speed Validation

**Identify fastest path to meaningful results**.

#### Question Framework

```markdown
## Q6: If Resources Doubled Tomorrow, What Would You Do to Get Results 2x Faster?

**Sub-questions**:
1. What's the single most important milestone? (North Star Metric)
2. What's blocking faster progress? (bottleneck)
3. If you had 2x engineers, what would you build first?
4. If you had 2x marketing budget, where would you spend it?
5. What's the minimum viable result? (what proves this works?)

**Evidence Required**:
- Prioritized roadmap
- Bottleneck analysis
- Resource allocation plan
- Success metrics
```

#### Example Answer

```markdown
### Q6 Answer: CLEAR PRIORITIES (3/5)

**North Star Metric**: % of transactions auto-categorized (target: 90% within 6 months)

**Current Bottlenecks**:
1. **ML Model Accuracy**: Currently at 75%, need 90% to deliver on value prop
   - Blocking factor: Need more training data (currently 1M transactions, need 5M+)
   - Solution: Partner with 3 more accounting firms for data access

2. **Onboarding Friction**: Takes 30 min to connect bank accounts, configure rules
   - Blocking factor: Manual bank connection setup (Plaid integration incomplete)
   - Solution: Complete Plaid integration, auto-detect business type

3. **Trust Building**: Users hesitant to connect bank accounts to unknown startup
   - Blocking factor: No social proof, no security certifications
   - Solution: Get SOC 2 Type I certification, collect testimonials from beta users

**If 2x Engineers (10 → 20)**:

**Priority 1: ML Model Improvement (4 engineers)**:
- Hire 2 ML engineers specializing in NLP/time-series classification
- Goal: Improve accuracy from 75% → 90% in 3 months (vs 6 months currently)
- Approach: 
  - Collect 4M more transactions from partners
  - Implement ensemble models (combine 3 different algorithms)
  - Active learning (flag uncertain transactions for human review, retrain)

**Priority 2: Plaid Integration (3 engineers)**:
- Complete bank account connection flow
- Auto-detect business type from transaction patterns
- Pre-configure rules based on business type (e.g., restaurants have different categories than retail)
- Goal: Reduce onboarding from 30 min → 5 min

**Priority 3: Security & Compliance (2 engineers)**:
- SOC 2 Type I certification (required for enterprise customers)
- End-to-end encryption for data at rest and in transit
- Audit logging for all data access
- Goal: Build trust, enable enterprise sales

**Priority 4: Mobile App (1 engineer)**:
- iOS/Android app for transaction review on-the-go
- Push notifications for uncategorized transactions
- Goal: Increase engagement, reduce churn

**If 2x Marketing Budget ($10K/mo → $20K/mo)**:

**Allocation**:
- Content Marketing: $8K/mo (hire freelance writers, produce 4 articles/week instead of 2)
- Paid Ads: $6K/mo (scale Google Ads from $3K to $6K, test Facebook/LinkedIn)
- Partnerships: $4K/mo (sponsor e-commerce podcasts, attend Shopify events)
- Community: $2K/mo (Reddit/Facebook group engagement, AMAs)

**Expected Impact**:
- Signups: 1,250/mo → 2,500/mo (2x)
- CAC: May increase slightly ($68 → $80) due to paid ads scaling, but acceptable given LTV

**Minimum Viable Result** (Proof of Concept):

**Success Criteria** (within 3 months):
1. 100 paying customers (validates willingness to pay)
2. 85% auto-categorization accuracy (close to target, proves ML works)
3. <10% churn in first month (validates product-market fit)
4. NPS >30 (users would recommend to others)

**If We Hit These**:
- Raise seed round ($2M at $10M valuation)
- Scale to 1,000 customers in Year 1
- Hire 10 more engineers

**If We Miss**:
- Pivot or shut down (don't throw good money after bad)

**Verdict**: CLEAR PRIORITIES (3/5) — Know what to build, but execution risk remains
```

**Scoring Criteria**:

| Score | Criteria |
|-------|----------|
| 5/5 | Crystal-clear North Star, obvious bottlenecks, confident in 2x acceleration |
| 4/5 | Clear priorities, identified bottlenecks, realistic 2x plan |
| 3/5 | Some clarity, bottlenecks partially understood, uncertain about 2x impact |
| 2/5 | Vague priorities, bottlenecks unclear, doubtful 2x is possible |
| 1/5 | No idea what to prioritize, no bottleneck analysis, 2x seems impossible |

---

### Step 7: G1 Gate Evaluation

**Calculate overall score and determine pass/fail**.

#### Scoring Summary

```markdown
## G1 Gate: Plan Quality Assessment

### Question Scores

| Question | Score | Quality | Status |
|----------|-------|---------|--------|
| Q1: Pain Point | 4/5 | Substantive, data-backed | ✅ PASS |
| Q2: Competition | 3/5 | Moderate analysis, some gaps | ⚠️ WEAK |
| Q3: Advantage | 2/5 | Weak moat, needs improvement | ❌ FAIL |
| Q4: Acquisition | 4/5 | Viable strategy, reasonable CAC | ✅ PASS |
| Q5: Monetization | 4/5 | Solid unit economics | ✅ PASS |
| Q6: 2x Speed | 3/5 | Clear priorities, execution risk | ⚠️ WEAK |

### Gate Decision

**Passing Threshold**: ≥4 questions with score ≥3/5  
**Actual**: 4 questions passing (Q1, Q4, Q5, Q6 borderline)  

**Result**: ✅ **G1 PASS** (barely)

**Weak Areas Requiring Phase 1 Follow-Up**:
- Q3 (Advantage): Score 2/5 — Must strengthen competitive moat
- Q2 (Competition): Score 3/5 — Deeper competitor analysis needed

**Next Steps**:
1. Proceed to Phase 1 (5 Whys) to deepen Q2, Q3 answers
2. Specifically investigate:
   - How to build defensible moat (exclusive partnerships? patents?)
   - Detailed competitor feature gap analysis
3. Re-evaluate after Phase 1 before proceeding to Phase 2

**Risk Level**: MEDIUM — Idea has merit but defensibility concerns
```

**Update STATE.md**:

```bash
# Update state file
cat >> .devflow-evo/STATE.md << EOF

## Phase 0 Results ($(date))
current_phase: phase-0-complete
g1_result: PASS
g1_scores:
  q1_pain: 4
  q2_competition: 3
  q3_advantage: 2
  q4_acquisition: 4
  q5_monetization: 4
  q6_speed: 3
follow_up_required:
  - q3_advantage
  - q2_competition
next_phase: phase-1-5whys
EOF

echo "✅ STATE.md updated with Phase 0 results"
```

---

## Error Handling

### Common Issues and Fixes

**Issue 1: Insufficient Project Context**

- **Symptom**: PROJECT_CONTEXT.md missing, can't answer questions with confidence
- **Cause**: New project, no prior documentation
- **Fix**:
  1. Interview user to extract context (tech stack, target users, business goals)
  2. Research industry benchmarks online
  3. Mark answers as "LOW CONFIDENCE — based on assumptions"
  4. Recommend creating PROJECT_CONTEXT.md before proceeding
- **Prevention**: Enforce PROJECT_CONTEXT.md creation in project initialization

**Issue 2: Vague User Input**

- **Symptom**: User says "build an app" without specifics
- **Cause**: User hasn't thought through problem/solution fit
- **Fix**:
  1. Ask clarifying questions before YC assessment
  2. "What problem does this solve?" "Who experiences this?" "What's the cost of not solving it?"
  3. If user can't answer → recommend Phase 1 (5 Whys) first
  4. Don't proceed with YC questions until problem is clear
- **Prevention**: Require problem statement before Phase 0

**Issue 3: Overly Optimistic Assumptions**

- **Symptom**: User claims "CAC will be $10" with no evidence
- **Cause**: Wishful thinking, no market research
- **Fix**:
  1. Challenge assumptions: "What data supports $10 CAC?"
  2. Provide industry benchmarks: "SaaS average CAC is $100-300"
  3. Require evidence: channel testing, competitor analysis, surveys
  4. If no evidence → mark as "UNSUBSTANTIATED" and flag for validation
- **Prevention**: Evidence requirement for every claim

**Issue 4: G1 Fail (<4 Passing Questions)**

- **Symptom**: Only 2-3 questions have substantive answers
- **Cause**: Idea not validated, too early for implementation
- **Fix**:
  1. Return to Phase 1 (5 Whys) for deeper problem exploration
  2. Conduct customer interviews (≥10 users)
  3. Research competitors thoroughly
  4. Re-attempt Phase 0 after research complete
- **Prevention**: Don't skip Phase 1 even if user eager to start coding

**Issue 5: Conflicting Stakeholder Opinions**

- **Symptom**: CEO says pain is high, CFO says market is small
- **Cause**: Lack of alignment on problem/solution fit
- **Fix**:
  1. Document both perspectives in Q1, Q2 answers
  2. Recommend stakeholder workshop to align
  3. Gather data to resolve disagreement (user interviews, market research)
  4. Don't proceed until stakeholders agree on core assumptions
- **Prevention**: Single decision-maker or documented consensus required

---

## Error Taxonomy

| Priority | Condition | Detection Method | Recovery Action |
|----------|-----------|------------------|-----------------|
| **P0** | User not YC target customer (non-starter, non-scalable, non-urgent) | Q1 pain score <2 AND Q6 2x speed = "no clear bottleneck" | Return to Phase 1: explore adjacent markets or pivot problem space |
| **P1** | Value proposition unclear (can't articulate why users care) | Q1 score ≥3 but Q4 CAC >$300 OR payback >24 months | Return to Phase 1: run deeper user interviews, test messaging variants |
| **P2** | Problem definition ambiguous ("we'll fix it later" for ≥2 questions) | ≥2 questions scored <3 AND no evidence provided | Enforce Phase 1: require specific answers before proceeding |
| **P3** | Information incomplete (missing context, stale benchmarks) | CONFIDENCE=LOW OR industry data >6 months old | Mark as "UNSUBSTANTIATED", proceed with assumption tracking |

## Boundary Conditions

### Phase Thresholds

| Parameter | Value | Rationale | Enforcement |
|-----------|-------|-----------|-------------|
| YC questions answered | 6/6 mandatory | All 6 questions required for complete strategic assessment | G1 gate blocks progress if <4 answers with substantive content |
| Assessment completion time | Two-tiered: (a) Initial YC-style interview: ≤30 min per session (recommended max); (b) Full strategic deep-dive (if needed): ≤2 h total across multiple sessions | Too fast = superficial, too slow = over-analysis of simple project | Time tracking logged in STATE.md for continuous improvement |
| Evidence coverage | ≥4 of 6 questions have data-backed answers (not assumptions) | Minimum validation bar for G1 pass | Each evidence-backed answer must cite source (user quote, benchmark, metric) |
| Confidence level | HIGH required to skip Phase 1; MEDIUM triggers optional follow-up; LOW requires Phase 1 | Low confidence on problem/competition → deep dive needed | CONFIDENCE field in PROJECT_CONTEXT.md updated after assessment |

### When to Escalate Immediately

**Skip YC assessment, escalate to leadership if**:
- Idea clearly violates company strategy (building outside core business)
- Legal/regulatory red flags (privacy violations, compliance issues)
- Ethical concerns (exploitative practices, harmful products)
- Resource constraints make project infeasible (<1 engineer, <$10K budget)

### When to Skip Phase 0

**Use lightweight validation (no full YC) if**:
- Internal tooling (known users, known problem)
- Bug fix or minor enhancement (<1 week effort)
- Regulatory requirement (must build regardless of ROI)
- Executive mandate (strategic priority, skip validation)

### Edge Cases

**Solo Founder / Side Project**:

- Simplify YC questions (focus on Q1, Q4, Q5)
- Skip detailed competitor analysis (no time/resources)
- Emphasize speed over thoroughness
- Accept higher uncertainty

**Enterprise Internal Project**:

- Replace "customers" with "internal users"
- Replace "revenue" with "cost savings" or "productivity gains"
- Focus on stakeholder buy-in rather than market size
- CAC becomes "adoption cost" (training, change management)

**Non-Profit / Social Impact**:

- Replace "monetization" with "sustainability model" (grants, donations)
- Replace "LTV" with "impact per dollar"
- Emphasize mission alignment over profits
- Adjust success metrics accordingly

**Hardware / Physical Products**:

- Add questions about manufacturing, supply chain, inventory
- Higher capital requirements → more scrutiny on Q5 (monetization)
- Longer timelines → adjust Q6 (2x speed) expectations
- Consider prototyping costs in CAC calculation

---

## Output Template

### Standard 00-strategy.md

```markdown
# Phase 0: YC Six Questions — [Project Name]

## Context
- **Tech Stack**: {technologies}
- **Business Domain**: {industry}
- **Target Users**: {persona}
- **User Request**: "{original input}"

## YC Six Questions

### Q1: How Painful Is the Problem?
**Score**: {X}/5  
**Answer**: {detailed response with evidence}

### Q2: What Existing Solutions Exist?
**Score**: {X}/5  
**Answer**: {competitor analysis with gaps}

### Q3: What's Your Unfair Advantage?
**Score**: {X}/5  
**Answer**: {moat analysis, defensibility}

### Q4: How Will You Acquire Customers?
**Score**: {X}/5  
**Answer**: {channel strategy, CAC calculation}

### Q5: How Will You Make Money?
**Score**: {X}/5  
**Answer**: {pricing model, LTV/CAC, unit economics}

### Q6: 2x Speed Validation
**Score**: {X}/5  
**Answer**: {priorities, bottlenecks, MVP definition}

## G1 Gate Result

**Passing Questions**: {count}/6  
**Threshold**: ≥4  
**Result**: [PASS / FAIL]

**Weak Areas**:
- Q{N}: {issue} → Requires Phase 1 follow-up

**Risk Level**: {LOW|MEDIUM|HIGH}

**Next Steps**:
1. {action_1}
2. {action_2}
```

---

## Tool Integration

### Required Tools

**Context Loading**:
```bash
# Load project context
cat .devflow-evo/memory/PROJECT_CONTEXT.md

# Extract key fields
grep "Tech Stack:\|Business Domain:\|Target Users:" .devflow-evo/memory/PROJECT_CONTEXT.md
```

**Market Research** (optional):
```markdown
# AI 查询行业基准数据和竞品定价
# 使用 WebSearch 搜索竞品公开定价信息
# 整理为对比表格
```

### Optional Tools

**Survey Automation**:
```bash
# Send user interviews via Typeform
curl -X POST "https://api.typeform.com/forms" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Problem Validation Survey", ...}'
```

**Financial Modeling**:
```markdown
# AI 计算 LTV/CAC 单位经济学
# 输入参数：ARPU=49, 月流失率=4%, CAC=68, 毛利率=80%
# 输出：LTV, LTV/CAC 比值, 回收期
```

---

## Implementation Checklist

Before assessment:
- [ ] PROJECT_CONTEXT.md loaded (or user interviewed)
- [ ] User requirement clearly stated
- [ ] Industry benchmarks researched

During assessment:
- [ ] All 6 questions answered with evidence
- [ ] Each answer scored (1-5) with justification
- [ ] Weak areas identified (score <3)
- [ ] G1 gate evaluated (≥4 passing)

After assessment:
- [ ] 00-strategy.md written to .devflow-evo/<req-id>/
- [ ] STATE.md updated with scores and next steps
- [ ] Follow-up questions documented for Phase 1
- [ ] Risk level assessed (LOW/MEDIUM/HIGH)

Quality gates:
- [ ] Every claim backed by data (no gut feelings)
- [ ] Competitor analysis includes ≥3 alternatives
- [ ] CAC calculation shows work (not just final number)
- [ ] LTV/CAC ratio calculated correctly
- [ ] G1 threshold enforced (≥4 passing questions)

---

## Anti-Patterns to Avoid

❌ **Skipping Evidence**: Making claims without data ("CAC will be low")  
✅ **Fix**: Require sources for every assertion (benchmarks, surveys, tests)

❌ **Over-Optimism**: Assuming best-case scenario for everything  
✅ **Fix**: Include downside cases, stress-test assumptions

❌ **Ignoring Weak Areas**: Proceeding despite Q3 score 2/5  
✅ **Fix**: Mandatory Phase 1 follow-up for scores <3

❌ **Vague Answers**: "We'll figure out monetization later"  
✅ **Fix**: Require specific pricing model, price point, LTV calculation

❌ **Copying Competitors**: "We'll be the Uber of X" without differentiation  
✅ **Fix**: Force specific differentiation, not analogies

❌ **Rushing Through**: Spending <30 minutes on YC assessment  
✅ **Fix**: Minimum 2 hours for thorough analysis, evidence gathering

---

## 用户确认

> 格式参考: `CONSTITUTION.md` 规则 #8（用户确认协议）

📍 当前阶段: Phase 0 · YC Strategy — Strategic Assessment
🎯 本步目标: 确认六问评估结果和 G1 Gate 决策

**问题 1**: G1 Gate 决策是否合理？
[1] ✅ 决策合理，继续下一阶段 ← 推荐
[2] 需要重新评估
[3] 查看详细评分

**问题 2**: 弱点区域是否已正确识别？
[1] ✅ 弱点识别准确，后续会跟进 ← 推荐
[2] 需要补充/调整弱点项
[3] 查看详细弱点分析

**问题 3**: 风险级别是否准确？
[1] ✅ 风险级别准确 ← 推荐
[2] 需要调整风险等级
[3] 查看风险因素

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added 7-step workflow (context → Q1-Q6 → G1 evaluation)
  - Implemented detailed scoring criteria for each question (1-5 scale)
  - Defined comprehensive error handling (5 common issues)
  - Integrated evidence requirements for all claims
  - Added boundary conditions for edge cases (solo founder, enterprise, non-profit)

- **v1.0** (2024-01-10): Initial implementation based on 交互层 Phase 0 + YC Due Diligence
  - Basic 6-question framework
  - Simple pass/fail gate
  - No scoring system
  - Minimal evidence requirements
