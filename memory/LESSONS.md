# LESSONS — 经验沉淀库

> **用途**: 跨 Wave / 跨 Session 经验复用  
> **格式**: L-NNN (新条目) / UPDATE-L-NNN (更新旧条目)  
> **提名阶段**: Phase 7+ 每 Wave 结束前必须提名新条目

---

## 使用方式

### 提交新 LESSON（Phase 7+）

```markdown
### L-XXX: <简短标题>

- **来源**: Phase <N>, Wave <N>, Task <TXX>
- **触发条件**: <什么情况下会遇到这个问题>
- **解决方案**: <具体怎么做>
- **适用场景**: <哪些项目/情况适用>
- **引用次数**: 0（≥ 3 次触发 Domain Skills Promotion）
```

### 跨波注入（Wave N+1）

Phase N+1 Agent 启动前，读取：
1. `memory/SUMMARY-WAVE-{N}.md`（Wave N 摘要）
2. LESSONS.md 中相关条目（按来源 Phase / 技术领域匹配）
3. 限制 ≤ 5 skills, ~200K tokens

---

## 经验条目

_(暂无。Phase 7+ Wave 完成后开始积累。)_

<!--
### L-001: <标题>

- **来源**: Phase N, Wave N, Task TXX
- **触发条件**: ...
- **解决方案**: ...
- **适用场景**: ...
- **引用次数**: 0
-->

---

## Domain Skills Promotion

同一 LESSON 引用次数 ≥ 3 → 持久化到 `memory/domain-skills/<skill-name>/SKILL.md`

格式：
```markdown
---
name: <skill-name>
from: L-XXX
frequency: <引用次数>
created: YYYY-MM-DD
---

<implementation steps>
```
