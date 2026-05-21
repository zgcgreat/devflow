---
name: phase-2a-shotgun
preamble-tier: 2
version: 3.0.0
description: |
  Multi-variant design generation specialist for Phase 2a.
  Generates 4-6 design variants with clear trade-offs and AI recommendation based on maintainability/cost/UX scoring. (devflow-evo)
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

Generate 4-6 design variants with clear trade-offs, AI recommendation based on maintainability/cost/UX scoring, and user selection workflow. Prevents decision fatigue by providing structured comparison rather than open-ended options.

**Core philosophy**: Show options with clear rationale. Never dump choices without guidance. Score every variant objectively. Recommend best option with evidence.

---

## Preamble

### Key Principles

1. **Minimum 4 Variants**: Always generate ≥4 distinct design approaches covering different dimensions (layout, interaction, visual complexity) — prevents anchoring bias
2. **Evidence-Based Recommendation**: AI must score each variant on maintainability (1-5), development cost (low/medium/high), UX quality, and extensibility — no subjective "I like this one"
3. **Clear Trade-Offs**: Every variant lists 3+ pros and 1-2 cons/risks — honest assessment builds trust
4. **User Choice with Guidance**: Present options clearly but recommend best fit based on project context (B2B vs B2C, timeline, team skills)

### When to Activate

**Automatic triggers** (Phase 2 completion):
- Frontend/UI project (mandatory)
- Complex user interface with multiple interaction patterns
- User explicitly requests design exploration

**Manual trigger**:
```
/design shotgun --variants 5 --dimensions layout,interaction,visual
```

**When NOT to use**:
- Backend-only features (no UI)
- Simple CRUD forms (standard pattern sufficient)
- Tight deadline (<1 day, no time for exploration)
- Design system already dictates pattern

---

## Step-by-step Workflow

### Step -1: 触发式参考加载（flow-kit UI 美学原则）

> 来源: `references/flow-kit-reference/ui-aesthetics.md` — 9 种调性卡片 + 5 美学维度实施指南。
> **触发条件**: Phase 2a 生成 UI 设计变体前（前端项目必选）。
> **跳过条件**: 纯后端/CLI/SDK 项目 → 跳过本步。

**判定**: 检查当前项目是否涉及用户界面设计（前端 SaaS / 移动端 / 桌面端）。
- **涉及 UI 设计** → 加载以下参考文件
- **纯后端** → 跳过 Step -1，直接进入 Step 0

**加载流程**:

1. **读取 `references/flow-kit-reference/ui-aesthetics.md`** — 9 种 UI 调性卡片:
   - 极简主义（Minimalist）— 大量留白、单一强调色
   - 新拟态（Neumorphism）— 柔和阴影凸起/凹陷效果
   - 玻璃拟态（Glassmorphism）— 毛玻璃模糊 + 半透明层叠
   - 深色专业（Dark Professional）— 深色背景 + 高对比度强调色
   - 大胆现代（Bold & Modern）— 渐变、大字体、动画
   - 卡通插画（Playful Illustration）— 圆角、插画、活泼配色
   - 杂志排版（Editorial/杂志）— 不对称布局、衬线字体
   - 数据密集型（Data Dense）— 紧凑表格、高信息密度
   - 游戏化（Gamification）— 进度条、徽章、动画反馈

2. **从 9 种调性中挑 2-3 种作为变体设计的视觉方向参考**:
   - 每种变体指定一个主调性（不要全部变体用同一风格）
   - 记录选择理由（结合用户画像 + 品牌调性）

3. **使用 5 美学维度评估每个变体**（来自 ui-aesthetics.md 实施指南）:
   - **一致性**: 变体内组件风格统一
   - **层次性**: 信息层级清晰（字号/颜色/间距区分）
   - **呼吸感**: 留白充足，不拥挤
   - **可访问性**: 对比度 ≥4.5:1（WCAG AA）
   - **情感匹配**: 视觉调性符合产品定位

4. **在 Variant Template 中追加美学评估段**:
   ```markdown
   ### Visual Aesthetics
   - **Style Direction**: {调性名称}
   - **Consistency**: {高/中/低}
   - **Hierarchy**: {清晰/一般/模糊}
   - **Breathing Room**: {充足/一般/拥挤}
   - **Accessibility**: {AA compliant / 需调整}
   ```

---

### Step 0: Load Phase 2 Design Specification

**Read base design**:

```bash
# Load Phase 2 design document
cat .devflow-evo/<req-id>/02-design.md

# Extract key requirements
grep -A 5 "User Stories\|Acceptance Criteria" .devflow-evo/<req-id>/02-design.md

# Check for existing UI/UX guidelines
if [ -f ".devflow-evo/ui-guidelines.md" ]; then
  echo "✅ UI guidelines found, will incorporate"
else
  echo "⚠️ No UI guidelines, using default patterns"
fi
```

**Extract design dimensions**:

```yaml
design_dimensions:
  layout:
    options: [left-sidebar, top-nav, drawer, modal, full-screen]
    constraints: [mobile-responsive, accessibility-WCAG-2.1]
  
  interaction:
    options: [progressive-disclosure, all-at-once, tabs, wizard, accordion]
    constraints: [max-3-clicks-to-goal, keyboard-navigable]
  
  visual_complexity:
    options: [minimal, standard, rich]
    constraints: [brand-colors, typography-scale]
```

**Output format**:
```markdown
## Design Context Loaded

**Project Type**: {B2B SaaS | B2C App | Internal Tool}  
**Primary Users**: {persona description}  
**Key Requirements**:
- {requirement_1}
- {requirement_2}

**Design Dimensions**:
- Layout: {options}
- Interaction: {options}
- Visual: {options}

Ready to generate variants.
```

---

### Step 1: Variant Planning

**Define variant generation strategy across 3 dimensions**.

#### Dimension Matrix

| Dimension | Variant #1 | Variant #2 | Variant #3 | Variant #4 | Variant #5 |
|-----------|------------|------------|------------|------------|------------|
| **Layout** | Left Sidebar | Top Navigation | Drawer | Modal | Full-Screen |
| **Interaction** | Progressive Disclosure | All-at-Once | Tabs | Wizard | Accordion |
| **Visual** | Minimal | Standard | Rich | — | — |

**Variant Combination Logic**:

```python
def generate_variant_combinations(dimensions):
    """
    Generate balanced variant combinations.
    Avoid extreme combinations (e.g., minimal + wizard = confusing).
    """
    variants = []
    
    # Variant 1: Conservative (safe, proven pattern)
    variants.append({
        "layout": "left-sidebar",
        "interaction": "progressive-disclosure",
        "visual": "minimal",
        "rationale": "Lowest risk, highest familiarity"
    })
    
    # Variant 2: Balanced (moderate innovation)
    variants.append({
        "layout": "top-nav",
        "interaction": "tabs",
        "visual": "standard",
        "rationale": "Good balance of efficiency and clarity"
    })
    
    # Variant 3: Innovative (higher risk, potential reward)
    variants.append({
        "layout": "drawer",
        "interaction": "wizard",
        "visual": "rich",
        "rationale": "Modern UX, may require user education"
    })
    
    # Variant 4: Alternative approach
    variants.append({
        "layout": "modal",
        "interaction": "all-at-once",
        "visual": "minimal",
        "rationale": "Focused task completion, less navigation"
    })
    
    # Variant 5: Hybrid (combine best elements)
    variants.append({
        "layout": "left-sidebar",
        "interaction": "accordion",
        "visual": "standard",
        "rationale": "Familiar layout with flexible content organization"
    })
    
    return variants[:5]  # Return max 5 variants
```

**Output format**:
```markdown
## Variant Strategy

**Total Variants**: 5  

**Dimension Coverage**:
- Layout: 4 unique patterns (left-sidebar, top-nav, drawer, modal)
- Interaction: 4 unique patterns (progressive, tabs, wizard, accordion)
- Visual: 3 levels (minimal, standard, rich)

**Rationale**:
- Variant #1: Conservative (proven pattern, low risk)
- Variant #2: Balanced (efficiency + clarity)
- Variant #3: Innovative (modern UX, higher learning curve)
- Variant #4: Focused (task completion emphasis)
- Variant #5: Hybrid (best of both worlds)

Proceeding to generate detailed variants.
```

---

### Step 2: Generate Design Variants

**⚠️ MANDATORY**: Each variant must include design concept, pros (3+), cons (1-2), use cases, and maintainability score (1-5).

#### Variant Template

```markdown
## Variant #{N}: {Name}

**Design Concept**: "{1-sentence philosophy}"

### Pros
1. {pro_1}
2. {pro_2}
3. {pro_3}

### Cons / Risks
1. {con_1}
2. {con_2} (optional)

### Use Cases
- Best for: {scenario_1}
- Avoid for: {scenario_2}

### Maintainability: {X}/5
- Code complexity: {low/medium/high}
- Component reusability: {high/medium/low}
- Test coverage ease: {easy/moderate/hard}

### Estimated Development Time
- Frontend: {X} days
- Backend integration: {Y} days
- Testing: {Z} days
- **Total**: {X+Y+Z} days

### Wireframe Sketch
{ASCII art or description of layout structure}
```

#### Example Variants

```markdown
## Variant #1: Progressive Disclosure Cards ⭐ RECOMMENDED

**Design Concept**: "Users focus on one step at a time, reducing cognitive load"

### Pros
1. Mobile-friendly, single-step focus prevents overwhelm
2. Lowest development cost (pure component reuse, no complex state)
3. Easy to extend with new steps (add card, no refactoring)
4. Clear progress indicator (Step 1/5, 2/5, etc.)

### Cons / Risks
1. Multi-step operations slightly slower (must navigate sequentially)
2. Can't easily compare information across steps

### Use Cases
- Best for: B2B tools, repetitive workflows, form wizards
- Avoid for: Data-heavy dashboards, comparison tasks

### Maintainability: 4/5
- Code complexity: Low (simple component composition)
- Component reusability: High (card component reusable everywhere)
- Test coverage ease: Easy (isolated step testing)

### Estimated Development Time
- Frontend: 2 days
- Backend integration: 1 day
- Testing: 1 day
- **Total**: 4 days

### Wireframe Sketch
```
┌─────────────────────┐
│ Progress: Step 2/5  │
├─────────────────────┤
│                     │
│   [Card Content]    │
│                     │
├─────────────────────┤
│  ← Prev | Next →   │
└─────────────────────┘
```

---

## Variant #2: Tabbed Interface

**Design Concept**: "All sections visible, users freely jump between them"

### Pros
1. Fast comparison across sections
2. Supports non-linear completion (fill section 3 before 1)
3. Familiar pattern (users know how tabs work)

### Cons / Risks
1. Mobile requires horizontal scrolling or dropdown
2. State synchronization complexity (unsaved changes in tab A when switching to B)

### Use Cases
- Best for: C2C forms, settings pages, <5 minute completion time
- Avoid for: Long forms (>10 fields), mobile-first apps

### Maintainability: 3/5
- Code complexity: Medium (tab state management)
- Component reusability: Medium (tab-specific logic)
- Test coverage ease: Moderate (cross-tab state testing)

### Estimated Development Time
- Frontend: 3 days
- Backend integration: 1 day
- Testing: 2 days
- **Total**: 6 days

### Wireframe Sketch
```
┌─────────────────────┐
│ [Tab1] [Tab2] [Tab3]│
├─────────────────────┤
│                     │
│   [Tab Content]     │
│                     │
└─────────────────────┘
```

---

## Variant #3: Slide-Out Drawer

**Design Concept**: "Context preserved, details slide in from side"

### Pros
1. Maintains spatial awareness (can see parent list while editing)
2. Modern UX pattern (feels native on mobile)
3. Quick dismiss (swipe or click outside)

### Cons / Risks
1. Limited horizontal space (complex forms cramped)
2. Accessibility challenges (keyboard trap if not implemented correctly)

### Use Cases
- Best for: Quick edits, detail views, mobile apps
- Avoid for: Complex multi-field forms, desktop-first apps

### Maintainability: 3/5
- Code complexity: Medium (animation + state)
- Component reusability: High (drawer component reusable)
- Test coverage ease: Moderate (animation testing)

### Estimated Development Time
- Frontend: 3 days
- Backend integration: 1 day
- Testing: 2 days
- **Total**: 6 days

---

## Variant #4: Full-Screen Modal

**Design Concept**: "Complete focus, no distractions from background"

### Pros
1. Maximum attention on task
2. Simple implementation (overlay + content)
3. Clear entry/exit points

### Cons / Risks
1. Blocks background context (can't reference other data)
2. Feels heavy for simple tasks

### Use Cases
- Best for: Critical actions (delete, confirm), focused workflows
- Avoid for: Reference-heavy tasks, quick edits

### Maintainability: 2/5
- Code complexity: Low (simple modal)
- Component reusability: Low (modal often custom per use case)
- Test coverage ease: Easy (isolated modal testing)

### Estimated Development Time
- Frontend: 2 days
- Backend integration: 1 day
- Testing: 1 day
- **Total**: 4 days

---

## Variant #5: Accordion Sections

**Design Concept**: "Expandable sections, control over information density"

### Pros
1. Users control what they see (expand only needed sections)
2. Good for long content (scrollable within page)
3. Flexible ordering (reorder sections easily)

### Cons / Risks
1. Can become "click-heavy" (many expansions needed)
2. Hard to get overview (must expand all to see everything)

### Use Cases
- Best for: Documentation, FAQs, settings with many options
- Avoid for: Linear workflows, time-sensitive tasks

### Maintainability: 3/5
- Code complexity: Medium (accordion state)
- Component reusability: High (accordion component reusable)
- Test coverage ease: Moderate (expand/collapse testing)

### Estimated Development Time
- Frontend: 3 days
- Backend integration: 1 day
- Testing: 2 days
- **Total**: 6 days
```

**Generation** (AI 按指令执行):

```markdown
# AI 生成设计变体
# 1. 读取 02-design.md 作为上下文
# 2. 按维度（layout, interaction, visual）生成 N 个变体
# 3. 每个变体包含：描述、评分维度、优劣势
# 4. 输出到 .devflow-evo/<req-id>/02a-design-variants.md
```

---

### Step 3: AI Recommendation with Scoring

**⚠️ MANDATORY**: Score each variant on 4 dimensions and recommend best option with clear rationale.

#### Scoring Matrix

```markdown
## AI Recommendation Analysis

### Comparative Scoring

| Dimension | #1 Progressive | #2 Tabs | #3 Drawer | #4 Modal | #5 Accordion |
|-----------|---------------|---------|-----------|----------|--------------|
| **Maintainability** | 4/5 ⭐ | 3/5 | 3/5 | 2/5 | 3/5 |
| **Development Cost** | Low ($4k) | Medium ($6k) | Medium ($6k) | Low ($4k) | Medium ($6k) |
| **UX Quality** | Good | Good | Very Good | Fair | Good |
| **Extensibility** | Excellent | Good | Good | Poor | Good |
| **Mobile Friendliness** | Excellent | Fair | Excellent | Good | Good |
| **Accessibility** | Good | Good | Fair* | Good | Good |

*Drawer requires extra ARIA work for full accessibility

### Weighted Score Calculation

Weights (project-specific):
- Maintainability: 30% (long-term code health priority)
- Development Cost: 25% (tight budget)
- UX Quality: 25% (user satisfaction critical)
- Extensibility: 20% (future feature additions expected)

**Weighted Scores**:
- Variant #1: (4×0.30) + (5×0.25) + (4×0.25) + (5×0.20) = **4.45/5** ⭐
- Variant #2: (3×0.30) + (3×0.25) + (4×0.25) + (4×0.20) = 3.45/5
- Variant #3: (3×0.30) + (3×0.25) + (5×0.25) + (4×0.20) = 3.70/5
- Variant #4: (2×0.30) + (5×0.25) + (3×0.25) + (2×0.20) = 3.00/5
- Variant #5: (3×0.30) + (3×0.25) + (4×0.25) + (4×0.20) = 3.45/5

**Winner**: Variant #1 (Progressive Disclosure Cards) with 4.45/5

### Recommendation Rationale

**Why Variant #1 Wins**:
1. **Highest maintainability** (4/5): Simple component composition, easy to test, high reusability
2. **Lowest cost** ($4k): 4 days total dev time vs 6 days for alternatives
3. **Best extensibility** (5/5): Adding new steps is trivial (just add card)
4. **Mobile excellence**: Single-column layout perfect for small screens
5. **Aligns with existing patterns**: Company component library already has card/wizard components

**Trade-offs Accepted**:
- Slightly slower for power users (must click through steps)
- Can't compare across steps easily

**Mitigation**: Add "Summary" step at end showing all inputs for review

### Suggested Hybrid Approach

**Base**: Variant #1 (Progressive Cards)  
**Enhancement**: Borrow Variant #2's tab navigation for "Advanced Settings" sub-page

**Result**: Main flow uses cards (simple), advanced users can switch to tabs (flexible)
```

**Scoring** (AI 按加权公式计算):

```markdown
# AI 为每个变体按维度评分，计算加权总分
# 权重配置示例：
# maintainability: 0.30, cost: 0.25, ux: 0.25, extensibility: 0.20
# 加权总分 = Σ(维度分数 × 权重)
# 输出排序：最高分的变体为推荐方案
```

# Define weights (customize per project)
weights = {
    "maintainability": 0.30,
    "cost": 0.25,
    "ux_quality": 0.25,
    "extensibility": 0.20
}

# Score each variant
for variant in variants:
    variant["weighted_score"] = calculate_weighted_score(variant, weights)

# Sort by score
variants.sort(key=lambda x: x["weighted_score"], reverse=True)

# Output recommendation
print(f"🏆 Recommended: Variant #{variants[0]['number']} ({variants[0]['name']})")
print(f"   Score: {variants[0]['weighted_score']}/5")
print(f"\nFull ranking:")
for i, v in enumerate(variants, 1):
    print(f"   {i}. Variant #{v['number']}: {v['weighted_score']}/5")
```

---

### Step 4: User Selection Workflow

**Present options clearly with recommended action**.

```markdown
## Your Decision

Based on analysis above, please choose:

### Option 1: ✅ Accept Recommendation (Variant #1)
- **Action**: Proceed with Progressive Disclosure Cards
- **Next Step**: Move to Phase 3 (Task Breakdown)
- **Timeline**: 4 days development

### Option 2: Choose Different Variant
- Select: Variant #___
- Reason: {brief explanation why}
- **Next Step**: Update design spec, then Phase 3

### Option 3: Hybrid Approach
- Base: Variant #__
- Enhancements: Borrow {feature} from Variant #__
- **Next Step**: Document hybrid design, then Phase 3

### Option 4: Request Regeneration
- New constraints: {describe additional requirements}
- Example: "Must support offline mode" or "Priority on animation smoothness"
- **Next Step**: Re-run Phase 2a with new constraints

**Please respond with your choice (1/2/3/4)**:
```

**User response handling** (AI 按指令执行):

```markdown
# AI 根据用户选择处理变体决策
# 用户选择 1 → 采纳推荐变体，进入 Phase 3
# 用户选择 2-4 → 选择替代变体
# 用户选择 "混合" → 合并多个变体的优势元素
# 输出：02a-design-final.md
```
    # Update design spec
    ;;
  3)
    echo "Hybrid approach selected"
    # Merge variant features
    # Document hybrid design
    ;;
  4)
    echo "Regenerating with new constraints..."
    # Re-run variant generation
    ;;
  *)
    echo "❌ Invalid choice. Please select 1/2/3/4"
    exit 1
    ;;
esac
```

---

### Step 5: Finalize Design Specification

**Generate final design document for Phase 3 input**.

```markdown
# Final Design Specification — [req-id]

## Selected Approach
- **Variant**: #1 Progressive Disclosure Cards
- **Rationale**: Highest weighted score (4.45/5), lowest cost, best maintainability

## Design Details

### Layout Structure
```
┌─────────────────────┐
│ Progress: Step 2/5  │
├─────────────────────┤
│                     │
│   [Card Content]    │
│                     │
├─────────────────────┤
│  ← Prev | Next →   │
└─────────────────────┘
```

### Component Hierarchy
- `WizardContainer` (parent)
  - `ProgressBar` (step indicator)
  - `CardStep` (reusable, 5 instances)
    - `FormField` (dynamic based on step)
  - `NavigationButtons` (Prev/Next)

### State Management
- Current step index (0-4)
- Form data (accumulated across steps)
- Validation errors (per step)

### API Integration Points
- POST `/api/wizard/step/{n}` (save step data)
- GET `/api/wizard/summary` (retrieve all data)

### Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader announcements (step changes)

### Testing Strategy
- Unit tests: Each card component isolated
- Integration tests: Step navigation flow
- E2E tests: Complete wizard completion

## Phase 3 Input

This design spec feeds into Phase 3 (Task Breakdown):
- Task priorities based on component complexity
- Dependency graph (ProgressBar → CardStep → NavigationButtons)
- Estimated effort per task (from variant development time)

**G2 Gate Result**: ✅ PASS → Proceed to Phase 3
```

**Write to disk**:

```bash
# Generate final design spec
cat > .devflow-evo/<req-id>/02a-design-final.md << 'EOF'
{final design content}
EOF

echo "✅ Final design specification generated"
```

---

## Error Handling

### Common Issues and Fixes

**Issue 1: Insufficient Variant Diversity**

- **Symptom**: All 5 variants look similar (e.g., all use left sidebar)
- **Cause**: Narrow dimension exploration
- **Fix**:
  1. Expand dimension options (add more layout/interaction choices)
  2. Force diversity: "Ensure at least 3 different layout patterns"
  3. Re-generate variants with broader scope
- **Prevention**: Pre-define dimension matrix before generation

**Issue 2: Missing Risk Assessment**

- **Symptom**: Variants list only pros, no cons
- **Cause**: Optimistic bias in generation
- **Fix**:
  1. Require minimum 1 con per variant (validation rule)
  2. Prompt AI: "What could go wrong with this approach?"
  3. Review for honesty (no sugar-coating)
- **Prevention**: Template enforces cons section

**Issue 3: Vague Recommendation Rationale**

- **Symptom**: "I recommend #1 because it's better" (no specifics)
- **Cause**: Lazy scoring without justification
- **Fix**:
  1. Require weighted score calculation (show math)
  2. Demand specific reasons: "Variant #1 wins because maintainability=4/5 vs #2's 3/5"
  3. Reject vague language ("better", "nicer")
- **Prevention**: Scoring template requires numerical justification

**Issue 4: User Indecision (Analysis Paralysis)**

- **Symptom**: User requests regeneration 3+ times, never chooses
- **Cause**: Too many options or unclear trade-offs
- **Fix**:
  1. Reduce variants from 5 to 3 (focus on top contenders)
  2. Strengthen recommendation: "Strongly recommend #1, here's why others are worse"
  3. Offer to decide on user's behalf: "Shall I proceed with #1?"
- **Prevention**: Limit to max 5 variants, clear scoring

**Issue 5: Incompatible with Existing Design System**

- **Symptom**: Chosen variant conflicts with company UI library
- **Cause**: Didn't check design system constraints upfront
- **Fix**:
  1. Audit design system components before generation
  2. Filter variants to only use available components
  3. If no match → flag as "requires custom development"
- **Prevention**: Step 0 loads UI guidelines, constrains generation

---

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Impact |
|-------|------|------------|--------|--------|
| **P0** | BLOCKING | All 5 variants eliminated (each has ≥2 critical cons, or scoring variance <0.2 indicating no meaningful differentiation), or user rejects top variant twice | Regenerate with expanded dimensions, or recommend hybrid of top 2 variants' strongest features | Blocks Phase 3 until viable design selected |
| **P1** | RECOVERABLE | Insufficient variant diversity (≥3 variants share identical layout pattern), recommendation lacks weighted score calculation, development time estimates vary >50% across variants | Re-generate with forced dimension diversity, add missing scoring math, provide time range (min/max) instead of point estimate | Delays selection but does not block design |
| **P2** | WARNING | One variant scores <3/5 on maintainability (acceptable trade-off if UX is superior), user prefers higher-cost variant within budget tolerance | Document trade-off in decision rationale, proceed with selected variant | No blocking impact, proceed normally |
| **P3** | INFO | Minor scoring sensitivity (<0.1 weight change flips ranking), alternative visual style not explored, one dimension under-specified by user | Note limitation in report, recommend validation during implementation phase | No impact, continue |

**Severity Assignment Rules**:
- Default to P0 when weighted scores of top 2 variants differ by <0.15 (indicates equivalent options without clear winner)
- Escalate from P1→P0 only if re-generation still produces <3 distinct variants meeting minimum quality threshold (maintainability ≥3, cost ≤Medium)
- Never auto-resolve: user must explicitly approve selected variant before proceeding to Phase 3

**Auto-Resolution Rules** (no user input needed):
- If variant dev time exceeds budget by >2x → auto-evaluate as "not viable" regardless of other scores
- If user accepts recommendation without selecting alternative → auto-proceed with recommended variant, log decision in design-final.md

---

## Boundary Conditions

### When to Escalate Immediately

**Skip variant generation, escalate to designer if**:
- Project has dedicated UX designer (their job, not AI's)
- Brand guidelines strictly dictate pattern (no flexibility)
- Legal/compliance requirements mandate specific UI (accessibility laws)
- User rejects all 5 variants twice (fundamental mismatch)

### When to Skip Phase 2a

**Use standard pattern (no variants) if**:
- Simple CRUD form (<5 fields)
- Internal tool with established patterns
- Timeline <1 day (no time for exploration)
- Backend-only feature (no UI)

### Timeout Constraints

| Constraint | Detail | Fallback Behavior |
|------------|--------|-------------------|
| Timeout | variant generation + scoring loop | ≤15 min per batch (5 variants); total ≤45 min across all batches | Abort on timeout; fallback to best-so-far with warning |

### Edge Cases

**Conflicting Stakeholder Preferences**:

- Document each stakeholder's priority (CEO wants "modern", CFO wants "cheap")
- Generate variants addressing different priorities
- Let stakeholders vote on variants
- Use voting results to weight scoring

**A/B Testing Requirement**:

- Instead of choosing one variant, implement top 2
- Split traffic 50/50 between variants
- Measure conversion/engagement metrics
- Winner becomes permanent after 2 weeks

**Internationalization Constraints**:

- Some layouts break with long text (German, Finnish)
- Test variants with worst-case text length
- Eliminate variants that don't scale
- Prioritize flexible layouts (accordion > fixed-width cards)

**Performance Budget**:

- Rich animations may exceed performance budget on low-end devices
- Score variants on performance impact
- Eliminate variants exceeding budget
- Or offer "lite" version for slow connections

---

## Output Template

### Standard Design Variants Document

```markdown
# Phase 2a: Design Shotgun — [Project Name]

## Context
- **Project Type**: {B2B/B2C/Internal}
- **Primary Users**: {persona}
- **Key Requirements**: {list}

## Variants

### Variant #1: {Name}
**Design Concept**: "{philosophy}"

**Pros**:
1. {pro_1}
2. {pro_2}
3. {pro_3}

**Cons**:
1. {con_1}

**Maintainability**: {X}/5  
**Dev Time**: {days} days  
**Use Cases**: {scenarios}

[Repeat for Variants #2-#5]

## AI Recommendation

### Scoring Matrix
| Dimension | #1 | #2 | #3 | #4 | #5 |
|-----------|----|----|----|----|----|
| Maintainability | 4 | 3 | 3 | 2 | 3 |
| Cost | 5 | 3 | 3 | 5 | 3 |
| UX Quality | 4 | 4 | 5 | 3 | 4 |
| Extensibility | 5 | 4 | 4 | 2 | 4 |

### Weighted Score
- Variant #1: 4.45/5 ⭐ WINNER
- Variant #2: 3.45/5
- ...

### Rationale
1. {reason_1}
2. {reason_2}
3. {reason_3}

## User Decision
[ ] Accept Recommendation (#1)
[ ] Choose Alternative (#__)
[ ] Hybrid Approach
[ ] Regenerate

**Final Selection**: {chosen variant}

**G2 Gate Result**: [PASS / FAIL]
```

---

## Tool Integration

### Required Tools

**Variant Generation**:
```markdown
# AI 生成设计变体（按维度：layout, interaction, visual）
# --count 变体数量，--dimensions 评分维度
# 输出到 .devflow-evo/<req-id>/02a-design-variants.md
```

**Scoring Calculator**:
```markdown
# AI 按加权公式计算变体评分
# 权重示例：maintainability=0.30, cost=0.25, ux=0.25, extensibility=0.20
```

### Optional Tools

**Wireframe Generator** (ASCII art):
```markdown
# AI 为指定变体生成 ASCII 线框图
```

**Stakeholder Voting App**:
```bash
# Simple web app for stakeholder voting
npm run start:voting-app -- --variants 02a-design-variants.md
```

---

## Implementation Checklist

Before variant generation:
- [ ] Phase 2 design spec loaded
- [ ] UI/UX guidelines reviewed (if exist)
- [ ] Design dimensions defined (layout, interaction, visual)
- [ ] Constraint checklist complete (budget, timeline, tech stack)

During generation:
- [ ] ≥4 variants generated (ideally 5)
- [ ] Each variant has 3+ pros and 1-2 cons
- [ ] Maintainability scored (1-5) for each variant
- [ ] Development time estimated for each variant

After generation:
- [ ] Weighted scoring completed with clear rationale
- [ ] Recommendation provided with evidence
- [ ] User presented with clear choice options
- [ ] Final design spec generated (02a-design-final.md)
- [ ] G2 gate evaluated (PASS/FAIL)

Quality gates:
- [ ] Variants are genuinely different (not just color changes)
- [ ] Trade-offs honestly assessed (no hidden risks)
- [ ] Scoring is objective (numerical, not subjective)
- [ ] Recommendation aligns with project priorities
- [ ] Final spec ready for Phase 3 task breakdown

---

## Anti-Patterns to Avoid

❌ **Generating Similar Variants**: 5 variants that all look the same  
✅ **Fix**: Enforce diversity across dimensions (different layouts, interactions)

❌ **Hiding Cons**: Only listing pros, pretending no downsides  
✅ **Fix**: Mandatory cons section, at least 1 per variant

❌ **Vague Recommendations**: "I like #1" without scoring  
✅ **Fix**: Weighted scoring with numerical justification

❌ **Ignoring Constraints**: Recommending expensive variant on tight budget  
✅ **Fix**: Factor budget/timeline into scoring weights

❌ **Analysis Paralysis**: Endless regeneration, never choosing  
✅ **Fix**: Limit to 2 regeneration rounds, then force decision

❌ **Skipping User Input**: AI decides without user approval  
✅ **Fix**: Always present options, let user make final call

---

## 用户确认

> 格式参考: `CONSTITUTION.md` 规则 #8（用户确认协议）

📍 当前阶段: Phase 2a · Design Shotgun — UI Design Variants
🎯 本步目标: 确认设计变体评估和用户选择

## 📋 确认清单 (共 3 项)

请按顺序逐项确认以下问题。回答选项编号 [1]/[2]/[3] 或输入自定义内容：

### ❓ 问题 1/3：设计变体多样性是否足够？

[1] ✅ 变体差异明显，足够选择 ← 推荐
[2] 需要更多差异化变体
[3] 查看变体对比

→ 回答: _← 请先确认此题后再看下一题_

---
*(确认后显示)*
### ❓ 问题 2/3：加权评分是否合理？

[1] ✅ 评分合理，推荐选项正确 ← 推荐
[2] 需要调整评分权重
[3] 查看评分详情

→ 回答: _← 请先确认此题后再看下一题_

---
*(确认后显示)*
### ❓ 问题 3/3：是否同意进入下一阶段？

[1] ✅ 同意，继续 Phase 3 ← 推荐
[2] 需要修改设计方案
[3] 回退到 Phase 2

→ 回答: _← 确认所有问题后流程继续_

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added 5-step workflow (load context → plan variants → generate → score → finalize)
  - Implemented weighted scoring system with customizable weights
  - Defined clear variant template (pros/cons/maintainability/dev time)
  - Added comprehensive error handling (5 common issues)
  - Integrated user selection workflow with 4 options

- **v1.0** (2024-01-10): Initial implementation based on 交互层 Design Shotgun
  - Basic variant generation (4-6 options)
  - Simple pros/cons list
  - No scoring system
  - Manual recommendation
