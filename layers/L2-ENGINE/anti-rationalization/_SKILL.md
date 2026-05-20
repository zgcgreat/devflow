---
name: anti-rationalization
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: [pending-decision]
provides: [challenge-report, assumption-risks]
description: Anti-rationalization tables that challenge assumptions and prevent post-hoc justification of bad decisions
source: superpowers anti-rationalization + doubt-driven-development
dependencies: []
triggers:
  - decision making
  - design review
  - architecture choice
---

# Anti-Rationalization — 反理性化

## 核心问题

人类（和 AI）倾向于为已做的决策编造合理化解释，而非客观评估。反理性化表强迫在决策时显式列出反对理由。

## 反理性化表格式

```markdown
## Decision: [决策描述]

### For (支持)
- 理由1
- 理由2

### Against (反对)
- 反对理由1
- 反对理由2

### Devil's Advocate (魔鬼代言人)
- "如果这个决策完全错误，最可能的原因是？"
- "6个月后回看，什么会让这个决策看起来很蠢？"

### Reversibility (可逆性)
- 可逆: 是/否
- 逆转成本: 低/中/高
- 逆转时间: N 天/小时

### Alternatives Considered (已考虑的替代方案)
| 方案 | 优势 | 劣势 | 为什么没选 |
|------|------|------|-----------|
| A | ... | ... | ... |
| B | ... | ... | ... |

### Bias Check (偏见检查)
- [ ] 沉没成本: 是否因为已投入而继续？
- [ ] 熟悉度偏见: 是否因为熟悉而选择？
- [ ] 权威偏见: 是否因为某人推荐而选择？
- [ ] 确认偏见: 是否只看到了支持证据？

### Final Verdict
- 决策: [最终选择]
- 置信度: 1-5
- 复查日期: YYYY-MM-DD
```

## 与 devflow-evo Phase 集成

### Phase 2 (Design)
每个架构决策必须填写反理性化表，存入 `.devflow-evo/memory/DECISIONS.md`

### Phase 6 (Review)
审查时检查反理性化表的完整性和诚实度：
- Against 列是否和 For 列一样有力？
- Devil's Advocate 是否真的在挑战？
- Bias Check 是否全部完成？

### Phase 8 (Archive)
归档时回顾反理性化表，评估决策是否正确：
- 预测是否准确？
- 反对理由是否应验？
- 记录 LESSON
