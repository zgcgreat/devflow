# DevFlow 双通道自进化规范

> 融合 DevFlow LESSONS 通道（流程沉淀）与 ECC Agent-Eval 通道（模式提取），形成完整的知识进化闭环。

---

## 1. 双通道架构

```
通道A: 流程沉淀 (DevFlow LESSONS)
  Phase 0→8 执行 → Wave SUMMARY → Phase 8 归档 → LESSONS.md → Domain Skills晋升

通道B: 模式提取 (ECC Agent-Eval)
  日常开发 → learn-eval 质量门 → 模式提取 → Global/Project双位置 → evolve聚类晋升

融合节点: Phase 8
  ┌─────────────────┐
  │   Phase 8 归档   │ ← 通道A输入
  │  ┌───────────┐  │
  │  │ LESSONS.md│  │ ← 流程沉淀
  │  └───────────┘  │
  │  ┌───────────┐  │
  │  │ Domain Sk │  │ ← 晋升(≥3频率)
  │  └───────────┘  │
  │  ┌───────────┐  │
  │  │ Learned   │  │ ← 通道B输入(模式提取)
  │  └───────────┘  │
  └─────────────────┘
```

---

## 2. 通道A: 流程沉淀 (LESSONS)

### 2.1 触发时机
- 每个 Wave 完成后生成 `SUMMARY.md`
- Phase 8 归档时汇总所有 Wave SUMMARY

### 2.2 LESSONS.md 格式
```markdown
## [类别] LESSON 标题
- **来源**: Phase X Wave Y
- **场景**: [触发条件描述]
- **教训**: [具体经验]
- **复用度**: [1次/2次/3次+] — ≥3次触发Domain Skills晋升
```

### 2.3 Domain Skills 晋升规则
- 同类 LESSONS 出现 ≥3 次 → 自动晋升为 Domain Skill
- Domain Skill 写入 `memory/domain-skills/*.md`
- Domain Skill 在后续 Phase 流程中作为 `⭐ 增强能力` 注入

---

## 3. 通道B: 模式提取 (Agent-Eval)

### 3.1 触发时机
- 日常开发中遇到可复用模式（非Phase流程中）
- 用户主动 `/learn-eval` 命令

### 3.2 质量门评估
提取模式前，先自评质量：

| 维度 | 评分标准 |
|------|---------|
| 可复用性 | 能否跨 ≥2 个项目使用？ |
| 稀缺性 | 是否是文档/常识中找不到的经验？ |
| 完整性 | 是否包含根因+修复+验证的完整链条？ |
| 时效性 | 是否针对当前版本有效？ |

**质量门槛**: ≥2 维度达到 "高" 才保存，否则仅记入 LESSONS.md

### 3.3 存储位置决策
- **Global** (`~/.claude/skills/learned/`): 通用模式，跨项目可用
- **Project** (`.claude/skills/learned/`): 项目特有知识
- 默认选择 Global，后续可降级到 Project

### 3.4 evolve 晋升
- 相关模式 ≥3 个 → 聚类为更高阶结构（Command / Skill / Agent）
- 晋升后写入对应的 agents/ 或 skills/ 目录

---

## 4. 融合规则

### 4.1 交叉注入
- 通道A 的 Domain Skills 在 Phase 流程中注入（自动）
- 通道B 的 Learned Skills 在日常开发中注入（按需）
- 两个通道的产物在 Phase 8 归档时合并审查

### 4.2 晋升统一标准
无论是 LESSONS 还是 Learned 模式，晋升为 Domain Skill 的标准统一：

```
触发频率 ≥ 3次 → 晋升为 Domain Skill
内容质量 ≥ 2维度"高" → 晋升为 Domain Skill
两者同时满足 → 优先晋升
```

### 4.3 冲突处理
- 同一模式在两个通道都有产物 → 合并为一个 Domain Skill，保留更完整的版本
- LESSONS 版本侧重流程经验 → Learned 版本侧重技术模式 → 合并时两者互补

---

## 5. 存储结构

```
devflow/
  memory/
    LESSONS.md              ← 通道A沉淀（流程经验）
    domain-skills/           ← 晋升产物（两个通道共享）
      *.md                  ← 每个 Domain Skill 一个文件
  agents/
    core/                   ← 核心Agent（已稳定）
    extended/               ← 扩展Agent（按需加载）
  skills/
    learned/                ← 通道B产物（可降级）
      global/               ← 通用模式
      project/              ← 项目特有
    specialized/            ← 精选专业技能
```

---

## 6. 与 Phase 8 的集成

Phase 8 归档时增加步骤：

**Step: 双通道知识审查**

1. 汇总本轮 LESSONS 提名（通道A）
2. 扫描本轮 Learned 模式（通道B，如有）
3. 评估晋升候选（≥3频率 或 ≥2维度"高"）
4. 执行晋升（写入 domain-skills/ 或 skills/learned/）
5. 更新 LESSONS.md（去重、合并、标记晋升状态）

---

## 7. Token 预算

| 操作 | Token 预算 |
|------|----------|
| 单次 LESSONS 撰写 | ~500 |
| Phase 8 归档汇总 | ~2000 |
| learn-eval 质量门 | ~1000 |
| Domain Skill 撰写 | ~1500 |
| evolve 聚类分析 | ~2000 |
| **单轮自进化总计** | **≤5000** |