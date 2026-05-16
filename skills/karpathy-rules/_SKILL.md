---
name: karpathy-rules
description: |
  Karpathy 的 12 条 CLAUDE.md 编码行为准则。
  来源：Andrej Karpathy原始4条 + Mnimiy经30个代码库验证后添加的8条。
  效果：错误率从 41% 降至 3%。
  使用场景：编码、审查、重构代码时应用这些准则。
---

# Karpathy 12 条编码行为准则

> ⚡ **核心原则**：这些规则将常见 LLM 编码错误率从 41% 降至 3%。经 30 个代码库、6 周测试验证。

**权衡**：这些规则偏向谨慎而非速度。对于简单任务，使用判断。

---

## 原始 4 条规则（Karpathy/Forrest Chang）

### Rule 1 — Think Before Coding（编码前先思考）

**不要假设。不要隐藏困惑。暴露权衡。**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

**Tradeoff**: Bias toward caution over speed.

### Rule 2 — Simplicity First（简单优先）

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

**Ask**: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Rule 3 — Surgical Changes（精准修改）

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**Test**: Every changed line should trace directly to the user's request.

### Rule 4 — Goal-Driven Execution（目标驱动执行）

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

**Strong success criteria** let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 新增 8 条规则（Mnimiy）

### Rule 5 — Use the model only for judgment calls

**Use Claude for**: classification, drafting, summarization, extraction from unstructured text.

**Do NOT use Claude for**: routing, retries, status-code handling, deterministic transforms.

If a status code already answers the question, plain code answers the question.

**The moment**: Code that called Claude to "decide if we should retry on 503" worked beautifully for two weeks, then started flaking because the model started reading the request body as context for the decision.

### Rule 6 — Token budgets are not advisory

**Per-task budget**: 4,000 tokens.
**Per-session budget**: 30,000 tokens.

If a task is approaching budget, summarize and start fresh. Do not push through.

Surfacing the breach > silently overrunning.

**The moment**: A debugging session ran for 90 minutes. The model was perfectly happy iterating on the same 8KB error message, gradually losing track of which fix it had already tried. Token budget would have killed it at minute 12.

### Rule 7 — Surface conflicts, don't average them

When two existing patterns in the codebase contradict:
- Don't blend them.
- Pick one (the more recent / more tested), explain why, and flag the other for cleanup.

"Average" code that satisfies both rules is the worst code.

**The moment**: A codebase had two error-handling patterns — one async/await with explicit try/catch, one with a global error boundary. Claude wrote new code that did both. Doubled error handlers. Took 30 minutes to figure out why errors were swallowed twice.

### Rule 8 — Read before you write

Before adding code in a file:
- Read the file's exports, the immediate caller, and any obvious shared utilities.
- If you don't understand why existing code is structured the way it is, ask before adding to it.

"Looks orthogonal to me" is the most dangerous phrase in this codebase.

**The moment**: Claude added a function next to an existing identical function it hadn't read. Both functions did the same thing. The new one took precedence because of import order. The old one had been the source of truth for 6 months.

### Rule 9 — Tests verify intent, not just behavior

Every test must encode WHY the behavior matters, not just WHAT it does.

A test like `expect(getUserName()).toBe('John')` is worthless if the function takes a hardcoded ID.

If you can't write a test that would fail when business logic changes, the function is wrong.

**The moment**: Claude wrote 12 tests for an auth function. All passed. Auth was broken in production. The tests were testing the function returned something, not whether it returned the right thing.

### Rule 10 — Checkpoint after every significant step

After completing each step in a multi-step task:
- Summarize what was done, what's verified, what's left.
- Don't continue from a state you can't describe back to me.
- If you lose track, stop and restate.

**The moment**: A 6-step refactor went wrong on step 4. By the time I noticed, Claude had also done step 5 and 6 on top of the broken state. Untangling took longer than redoing the whole thing. Checkpoints would have caught it at step 4.

### Rule 11 — Match the codebase's conventions, even if you disagree

If the codebase uses snake_case and you'd prefer camelCase: snake_case.
If the codebase uses class-based components and you'd prefer hooks: class-based.

Disagreement is a separate conversation. Inside the codebase, conformance > taste.

If you genuinely think the convention is harmful, surface it. Don't fork it silently.

**The moment**: Claude introduced React hooks into a class-component codebase. They worked. They also broke the codebase's testing patterns, which assumed componentDidMount.

### Rule 12 — Fail loud

**If you can't be sure something worked, say so explicitly.**

- "Migration completed" is wrong if 30 records were skipped silently.
- "Tests pass" is wrong if you skipped any.
- "Feature works" is wrong if you didn't verify the edge case I asked about.

Default to surfacing uncertainty, not hiding it.

**The moment**: Claude said a database migration "completed successfully." It had silently skipped 14% of records that hit a constraint violation. Discovered the problem 11 days later.

---

## 验证标准

**这些规则生效时**：
- diff 中不必要的改动更少
- 因过度复杂导致的返工更少
- 澄清问题在错误之前而不是错误之后出现

---

## 使用建议

1. **开发阶段自动应用**：在 stage-4-dev 中引用这些规则
2. **代码审查时检查**：用这些规则审视代码改动
3. **重构前复习**：确保符合规则后再进行
4. **不要过度**：简单任务不需要字字遵循

---

## 参考文献

- Original: https://github.com/forrestchang/andrej-karpathy-skills
- Extended: https://x.com/Mnilax/status/2053116311132155938
- Stats: 60,000 bookmarks, 120,000 stars, mistake rate 41% → 3%