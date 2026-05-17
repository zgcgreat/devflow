# Phase 1: 需求追问 (5 Whys)

> **Layer**: L1-INTERACTION (SuperCorp 交互层)
> **前置产物**: `00-strategy.md` (Phase 0 通过 G1)
> **后置产物**: `.ultimate-workflow/<req-id>/01-analysis.md`
> **门控**: G2 — Analysis Quality Gate

## Skill元信息

```yaml
name: phase-1-5whys
version: 3.0-draft
layer: L1-INTERACTION
source: SuperCorp Phase 1 + get-shit-done Grill
dependencies:
  - writing-plans
v3_upgrade:
  provider_routing: true (Phase 1→Search-Model)
  agent_isolation: Research Agent ~200K fresh context
```

## 输入

- `00-strategy.md` — YC六问结果 + G1门控状态
- `.ultimate-workflow/CONTEXT.md` — 项目上下文（术语表、技术栈、禁动清单）
- LESSONS.md — 过往相关经验

## 输出

- `01-analysis.md` — 需求分析文档，包含：
  - 用户故事 (User Stories)
  - 验收标准 (Acceptance Criteria, AC)
  - 术语表 (Glossary)
  - v2/out (至少各1条风险分析)
  - 范围边界 (In Scope / Out of Scope)

## 执行流程

### Step 1: 加载前置产物

读取 `00-strategy.md`，提取：
- 核心需求摘要
- YC六问中的关键决策点
- G1门控的通过条件

### Step 2: 5 Whys 穷追追问

对每个模糊表述执行至少 3 轮 Why：

```
Q1: 用户要什么？ → A1: [原始需求]
Q2: 为什么需要这个？ → A2: [业务动机]
Q3: 不这样做会怎样？ → A3: [痛点/风险]
Q4: 有没有更简单的方案？ → A4: [替代方案]
Q5: 如何验证成功了？ → A5: [验证标准]
```

### Step 3: 编写分析文档

按模板 `templates/01-analysis.md` 输出：
- 每个 AC 必须可测试（Testable）
- 每个 out of scope 必须明确边界
- v2/out 风险至少各列 1 条

### Step 4: G2 门控检查

- [ ] AC 是否全部可测试？
- [ ] 范围边界是否清晰？
- [ ] 术语表是否完整？
- [ ] 风险分析是否有 v2+out 平衡？
- [ ] 是否与 `00-strategy.md` 保持一致？

### Step 5: 停等用户确认

输出完成声明（R8.2），等待用户回复 Y 继续。

## G2 门控规则

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| AC 可测试性 | 每个 AC 包含可执行验证步骤 | 回退到 Step 2 补追问 |
| 范围边界 | In/Out of Scope 明确列出 | 追加讨论轮次 |
| 术语表 | ≥ 3 个专业术语定义 | 要求用户提供领域专家 |
| 风险平衡 | v2 ≥ 1, out ≥ 1 | 标注为 Standard 模式 |

## Provider 路由

- Phase 1 → **高检索能力模型**（需要广泛搜索领域知识）

---

> **关联规则**: R1 (PRD驱动), R2 (三档模式), R7 (Agent隔离)
> **参考文件**: `references/RULES-v3.md` R1-R20, `references/prompts/1-analysis.md`
