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

### Step 0: Load Phase 2 Design Specification

**Read base design**:

```bash
# Load Phase 2 design document
cat .ultimate-workflow/<req-id>/02-design.md

# Extract key requirements
grep -A 5 "User Stories\|Acceptance Criteria" .ultimate-workflow/<req-id>/02-design.md

# Check for existing UI/UX guidelines
if [ -f ".ultimate-workflow/ui-guidelines.md" ]; then
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

**Generation script** (automated):

```bash
#!/bin/bash
# generate-variants.sh

VARIANT_COUNT=${1:-5}
OUTPUT_FILE=".ultimate-workflow/<req-id>/02a-design-variants.md"

echo "# Phase 2a: Design Shotgun — $(date)" > $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

for i in $(seq 1 $VARIANT_COUNT); do
  echo "Generating Variant #$i..."
  
  # Call AI to generate variant details
  python3 scripts/generate-variant.py \
    --variant-number $i \
    --dimensions "layout,interaction,visual" \
    --context .ultimate-workflow/<req-id>/02-design.md \
    >> $OUTPUT_FILE
  
  echo "" >> $OUTPUT_FILE
  echo "---" >> $OUTPUT_FILE
  echo "" >> $OUTPUT_FILE
done

echo "✅ Generated $VARIANT_COUNT variants in $OUTPUT_FILE"
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

**Scoring script** (automated):

```python
# scripts/score-variants.py
import json
import sys

def calculate_weighted_score(variant, weights):
    """
    Calculate weighted score for a variant.
    
    Args:
        variant: Dict with scores for each dimension
        weights: Dict with weight for each dimension
    
    Returns:
        Float: Weighted score (0-5)
    """
    score = 0
    for dimension, weight in weights.items():
        score += variant[dimension] * weight
    return round(score, 2)

# Load variant scores
with open(sys.argv[1]) as f:
    variants = json.load(f)

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

**User response handling**:

```bash
#!/bin/bash
# handle-user-choice.sh

USER_CHOICE=$1

case $USER_CHOICE in
  1)
    echo "✅ Accepted recommendation (Variant #1)"
    cp .ultimate-workflow/<req-id>/02a-design-variants.md .ultimate-workflow/<req-id>/02a-design-final.md
    echo "Moving to Phase 3..."
    ;;
  2)
    echo "Selected alternative variant"
    # Extract chosen variant details
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
cat > .ultimate-workflow/<req-id>/02a-design-final.md << 'EOF'
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

**Variant Generation Script**:
```bash
python3 scripts/generate-variants.py \
  --count 5 \
  --dimensions layout,interaction,visual \
  --output .ultimate-workflow/<req-id>/02a-design-variants.md
```

**Scoring Calculator**:
```bash
python3 scripts/score-variants.py \
  --input variants.json \
  --weights '{"maintainability": 0.30, "cost": 0.25, "ux": 0.25, "extensibility": 0.20}'
```

### Optional Tools

**Wireframe Generator** (ASCII art):
```bash
# Auto-generate ASCII wireframes
python3 scripts/ascii-wireframe.py --variant progressive-cards
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

## Version History

- **v2.0** (2024-03-15): Complete rewrite following gstack standards
  - Added 5-step workflow (load context → plan variants → generate → score → finalize)
  - Implemented weighted scoring system with customizable weights
  - Defined clear variant template (pros/cons/maintainability/dev time)
  - Added comprehensive error handling (5 common issues)
  - Integrated user selection workflow with 4 options

- **v1.0** (2024-01-10): Initial implementation based on SuperCorp Design Shotgun
  - Basic variant generation (4-6 options)
  - Simple pros/cons list
  - No scoring system
  - Manual recommendation
