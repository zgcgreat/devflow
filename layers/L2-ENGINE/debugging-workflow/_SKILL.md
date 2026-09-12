---
name: debugging-workflow
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: []
provides: [root-cause-analysis, fix-proposal, defense-in-depth]
source: DevFlow systematic-debugding (~500 lines across multiple files)
description: Four-phase methodology for systematic debugging — inserted between Phase 4 code and Phase 5 testing
external-inputs: [failed-test, bug-report]
---

# Systematic Debugging — 系统化调试方法论

> **Layer**: L2-ENGINE (引擎层 Engine Layer 唯一缺失的方法论层)  
> **触发时机**: Phase 4 代码完成后、Phase 5 测试前（Phase 4 → Phase 5 过渡时）  
> **前置产物**: 失败的测试、Bug 报告、异常行为日志  
> **后置产物**: Root cause 分析结果 + 修复方案 + Defense-in-depth 验证层  
> **版本**: v3.1-draft

## Systematic Debugging 在 DevFlow 中的位置

```
Phase 4: Wave代码完成
    │
    ▼
Systematic Debugging.run() [Phase 4→5过渡钩子]
    │
    ├─→ Phase 1: Root Cause Investigation (根因调查)
    ├─→ Phase 2: Pattern Analysis (模式分析)
    ├─→ Phase 3: Hypothesis & Testing (假设与验证)
    └─→ Phase 4: Implementation (实施修复)
    │
    ▼
Phase 5: Testing (测试验证)
```

**为什么是最大的单一价值遗漏**: DevFlow 有开发(Wave执行)、测试、审查三个阶段，但没有专门针对"发现问题→定位原因→验证修复"全链路的调试方法论。Systematic Debugging 填补了这个空白，包含真实世界影响数据(15-30分钟vs 2-3小时)。

## 铁律 (The Iron Law)

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

未完成后 Phase 1（根因调查），不得提出修复方案。违反铁律等于调试失败。

## When to Use

**必须使用 Systematic Debugging**:
- 测试失败（尤其是 flaky test）
- 生产环境 Bug
- 意外行为/异常日志
- 性能问题
- 构建失败
- 集成问题

**尤其重要**:
- 时间压力下（紧急感最易导致乱猜）
- "就一个快速修复"看起来很明显时
- 已尝试多次修复未果时
- 上次修复未解决问题时

## The Four Phases

必须按顺序完成每个 Phase，不得跳步。

---

### Phase 1: Root Cause Investigation (根因调查)

**在任何修复尝试之前**:

#### 1.1 仔细阅读错误信息
- 不要跳过错误或警告
- 错误信息常包含确切解决方案
- 完整阅读 stack trace
- 记录行号、文件路径、错误码

#### 1.2 稳定复现
- 能否可靠触发？
- 精确步骤是什么？
- 每次都发生吗？
- 不可复现 → 收集更多证据，不猜

#### 1.3 检查最近变更
- 什么变更可能导致此问题？
- Git diff、最近 commit
- 新依赖、配置变更
- 环境差异

#### 1.4 多组件系统: 证据收集

**当系统有多个组件时（CI → build → signing, API → service → database）**:

```yaml
# For EACH component boundary:
evidence_collection:
  - "Log what data enters component"
  - "Log what data exits component"
  - "Verify environment/config propagation"
  - "Check state at each layer"

Run once to gather evidence showing WHERE it breaks
THEN analyze evidence to identify failing component
```

**示例（多层系统）**:
```bash
# Layer 1: Workflow
echo "=== Secrets available in workflow: ==="
echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

# Layer 2: Build script
echo "=== Env vars in build script: ==="
env | grep IDENTITY || echo "IDENTITY not in environment"

# Layer 3: Signing script
echo "=== Keychain state: ==="
security list-keychains
security find-identity -v

# Layer 4: Actual signing
codesign --sign "$IDENTITY" --verbose=4 "$APP"
```

此方法揭示哪一层失败（secrets → workflow ✓, workflow → build ✗）

#### 1.5 Trace Data Flow (数据流追溯)

**当错误在调用栈深处时**:

参见本目录 `root-cause-tracing.md` 的完整向后追溯技术。

快速版本：
- 坏值从哪里起源？
- 什么调用传入了坏值？
- 持续向上追溯直到找到源头
- 在源头修复，不在症状处修复

---

### Phase 2: Pattern Analysis (模式分析)

**找到模式再修复**:

#### 2.1 查找正常工作的示例
- 定位代码库中类似的正常工作代码
- 什么能正常工作且与问题类似？

#### 2.2 对比参考实现
- 如果正在实现某个模式，完整阅读参考实现
- 逐行阅读，不要 skim
- 完全理解模式后再应用

#### 2.3 识别差异
- 正常工作和失败之间有什么不同？
- 列出每个差异，无论多小
- 不要假设"这个不重要"

#### 2.4 理解依赖
- 需要哪些其他组件？
- 什么设置、配置、环境变量？
- 做了什么假设？

---

### Phase 3: Hypothesis & Testing (假设与验证)

**科学方法**:

#### 3.1 提出单一假设
- 清晰陈述："我认为 X 是根因，因为 Y"
- 写下来
- 具体，不要模糊

#### 3.2 最小化测试
- 做最小的可能变更来测试假设
- 一次只改一个变量
- 不要同时修复多个问题

#### 3.3 验证后再继续
- 成功？→ Phase 4
- 没成功？→ 提出新假设
- **不要在原修复上叠加新修复**

#### 3.4 当不知道时
- 说"我不理解 X"
- 不要假装知道
- 寻求帮助
- 更多研究

---

### Phase 4: Implementation (实施修复)

**修复根因，不是症状**:

#### 4.1 创建失败测试用例
- 最简单的可能复现
- 自动化测试（如果可能）
- 一次性测试脚本（如果没有框架）
- **必须先有测试再修复**

#### 4.2 实施单一修复
- 解决已识别的根因
- 一次一个变更
- 不要"趁机改进"
- 不要捆绑重构

#### 4.3 验证修复
- 测试通过了？
- 没有其他测试被破坏？
- 问题确实解决了？

#### 4.4 如果修复未成功
- **STOP**
- 计数：已尝试多少次修复？
- 如果 < 3: 返回 Phase 1，用新信息重新分析
- **如果 ≥ 3: STOP 并质疑架构**（见下）
- 不要在没有架构讨论的情况下尝试第 4 次修复

#### 4.5 如果 3+ 次修复失败: 质疑架构

**指示架构问题的模式**:
- 每次修复揭示新的共享状态/耦合在不同位置
- 修复需要"大规模重构"才能实现
- 每次修复在其他地方创建新症状

**STOP 并质疑根本问题**:
- 这个模式是否 fundamentally sound？
- 我们是否只是"inertia 坚持"？
- 应该重构架构还是继续修症状？

**在尝试更多修复之前，与开发者讨论**

这不是失败的假设——这是错误的架构。

---

## Red Flags - STOP and Return to Phase 1

捕获以下思维时 **STOP，返回 Phase 1**:

- "先快速修复，稍后调查"
- "就试试改 X 看是否有效"
- "加多个变更，跑测试"
- "跳过测试，我手动验证"
- "可能是 X，让我修一下"
- "我不完全理解但这样可能行"
- "模式说 X 但我换种方式做"
- "列出了主要问题：[修复列表而非调查]"
- 在追溯数据流前就提出解决方案
- **"再试一次修复"**（已尝试 2+ 次后）
- **每次修复在其他地方揭示新问题**

## Common Rationalizations (常见借口)

| 借口 | 现实 |
|------|------|
| "问题简单，不需要流程" | 简单问题也有根因。流程对简单 bug 很快。 |
| "紧急，没时间" | Systematic 调试比瞎猜快。 |
| "先试这个，然后调查" | 第一次修复定模式。从一开始就做对。 |
| "确认修复有效后再写测试" | 无测试的修复不持久。测试先证明。 |
| "同时多个修复省时" | 无法隔离哪个有效。导致新 bug。 |
| "参考太长，我适配一下" | 部分理解保证有 bug。完整阅读。 |
| "我看到问题了，让我修" | 看到症状 ≠ 理解根因。 |
| "再试一次"（2+ 次失败后） | 3+ 次失败 = 架构问题。质疑模式，不继续修。 |

## 支持技术 (Supporting Techniques)

本目录提供以下 Systematic Debugging 支撑技术：

### `root-cause-tracing.md`
通过调用链回溯定位原始触发点的技术。适用于错误在深层调用栈时追溯数据起源。

### `defense-in-depth.md`
根因找到后，在多层添加验证使 bug "结构性不可能"重现的四层框架（入口校验→业务逻辑→环境守卫→调试日志）。

### `condition-based-waiting.md`
替代硬编码延迟的条件等待策略。通用轮询函数 + 领域专用助手实现。真实影响：15个 flaky 测试从60%通过率到100%，执行时间减少40%。

## Real-World Impact (来自 DevFlow-kit)

- **Systematic approach**: 15-30分钟定位根因
- **Random fixes approach**: 2-3小时反复试错
- **First-time fix rate**: 95% vs 40%
- **New bugs introduced**: Near zero vs common
- **Flaky test fix**: 60% → 100% pass rate, 40% faster execution

## Integration with Wave Executor (v3 DAG)

```yaml
# In Phase 4 Wave completion hook:
phase_4_completion:
  post_wave_hook:
    - learning_workflow.run()          # Step A: Extract lessons
    - debugging_workflow.run()         # Step B: Systematic debug (if tests fail)
    - code_review.run()                # Step C: Code review
```

**触发条件**:
- `debugging_workflow` 仅在 Phase 5 测试失败时运行
- 如果 Phase 4 Wave 代码无测试失败，跳过 debugging workflow
- 输出产物写入 `memory/debugging-reports/{req-id}.md` 供 Phase 6 Code Review 引用

---

> **Adapted from**: DevFlow-kit `skills/systematic-debugging/` directory  
> **Source files**: SKILL.md (~297 lines) + root-cause-tracing.md (~170 lines) + condition-based-waiting.md (~116 lines) + defense-in-depth.md (~123 lines) + condition-based-waiting-example.ts (~159 lines)  
> **Total source**: ~865 lines condensed to integrated format  
> **Key adaptation**: Inserted as Phase 4→5 transition hook in DevFlow's DAG; aligned with Wave Executor post-phase hooks

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Execution Impact |
|-------|------|------------|--------|------------------|
| **P0** | BLOCKING | Root cause indeterminate after 3+ systematic attempts | Halt, escalate to architectural review | Debugging blocked; may require design change |
| **P1** | RECOVERABLE | Flaky test — passes intermittently, no stable reproduction | Collect more evidence; add condition-based-waiting; mark FLAKY | Debugging continues with uncertainty flag |
| **P2** | WARNING | Fix introduced new symptom in different area | Document new symptom; return to Phase 1 | Continue with expanded investigation scope |
| **P3** | DEGRADATION | Evidence incomplete (missing logs, no stack trace) | Best-effort analysis; mark as LOW_CONFIDENCE | Proceed; flag for re-investigation |

**Severity Assignment Rules**:
- Default to P2 for any unexpected behavior post-fix
- Escalate to P0 if 3+ fix attempts fail (Iron Law: STOP and question architecture)
- Never demote: once 3+ failures logged, must go to architectural review

## Boundary Conditions

### When to Escalate Immediately
- 3+ failed fix attempts → STOP, question architecture (per Iron Law)
- Fix requires changes to >5 files → likely architectural issue
- Bug affects security-critical path → escalate to security specialist

### When to Skip Debugging Workflow
- Trivial typo with obvious root cause → direct fix + test
- Known fix documented in LESSONS → apply known fix, verify
- Emergency hotfix (production down) → minimal fix, schedule full debugging later

### Degradation Path
1. Full systematic debugging → 2. Abbreviated investigation → 3. Best-effort fix + schedule follow-up
