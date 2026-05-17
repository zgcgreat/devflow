# Phase 0: YC 六问战略评估

> **Layer**: L1-INTERACTION (SuperCorp 交互层)  
> **前置**: Step 2 入场检测通过, Step 3 GitNexus检测完成  
> **后置产物**: `.ultimate-workflow/<req-id>/00-strategy.md`  
> **门控**: G1 — Plan Quality Gate

## Skill元信息

```yaml
name: phase-0-ycc-strategy
version: 3.0-draft
layer: L1-INTERACTION
source: SuperCorp Phase 0 + Y Combinator Due Diligence
dependencies:
  - brainstorming
  - writing-plans
v3_upgrade:
  provider_routing: true (Phase 0→Search-Model)
  agent_isolation: Research Agent ~200K fresh context
```

## 输入

- 用户原始需求描述（一句话即可）
- `.ultimate-workflow/STATE.md`
- `.ultimate-workflow/memory/PROJECT_CONTEXT.md`

## 输出

- `00-strategy.md` — YC六问回答 + G1门控结果

## 执行流程

### Step 1: 项目背景注入

读取 PROJECT_CONTEXT.md，提取技术栈、业务场景、用户画像作为YC六问上下文。

### Step 2: YC 六问输出

**⚠️ 强制规则**：必须逐一回答以下6个问题，不得跳过或合并。AI主动提问，一问一答式推进。

```markdown
# Phase 0: YC 六问战略评估 — [需求简述]

## Q1: 痛点有多痛？
用户在解决什么问题？不解决的代价是什么？当前解决方案是什么？
回答: ...

## Q2: 现有方案有哪些？为什么不够好？
列出3+替代方案，逐个分析优缺点，说明为什么我们的方向更好。
回答: ...

## Q3: 你的独特优势是什么？
为什么是你能做、别人做不了？有什么差异化壁垒？
回答: ...

## Q4: 怎么获客？
用户从哪里来？获客渠道是什么？CAC预估多少？
回答: ...

## Q5: 怎么赚钱？
商业模式是什么？定价策略？LTV/CAC比？
回答: ...

## Q6: 2倍速验证
如果明天资源翻倍，做什么能最快拿到结果？最关键的里程碑是什么？
回答: ...
```

### Step 3: G1 门控判定

**⚠️ 强制规则**：至少4个问题有实质性回答才能通过 G1。少于4个 → 退回 Phase 1 (5 Whys) 继续追问。

```markdown
## G1 门控结果: [PASS / FAIL]

| 问题 | 回答质量 | 评分(1-5) |
|------|---------|----------|
| Q1 痛点 | ✓实质性 | 4/5 |
| Q2 竞品 | ✓实质性 | 3/5 |
| Q3 优势 | ⚠️模糊 | 2/5 |
| Q4 获客 | ✓实质性 | 4/5 |
| Q5 商业模式 | ⚠️未回答 | 1/5 |
| Q6 2倍速 | ✓实质性 | 3/5 |

总有效问题: 4/6 → G1 [PASS]
评分<3的问题: Q3, Q5 → Phase 1继续追问
```

### Step 4: 更新 STATE.md

```yaml
current_phase: phase-0-complete
phase_0_result: G1_PASS
g1_scores:
  q1_pain: 4
  q2_competitors: 3
  q3_advantage: 2
  q4_acquisition: 4
  q5_business_model: 1
  q6_twice_speed: 3
follow_up_questions: [q3, q5]
```

## 降级策略

- PROJECT_CONTEXT.md 不存在 → 纯用户输入推导，标注"低置信度"
- Research Agent context满 → 降级为标准对话模式
