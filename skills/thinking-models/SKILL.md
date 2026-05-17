---
name: thinking-models
description: |
  在调试和调查过程中应用结构化推理模型。在决策点使用，不连续使用。
  每个模型 countering 一个特定的文档化失败模式。
triggers:
  - fault tree
  - hypothesis
  - 推理
  - think
  - 分析
  - investigate
  - 调试
  - 排查
---

# Thinking Models — 推理模型集群

> 用于调试和调查决策点。适用于debug/investigate/troubleshoot任务。

---

## 冲突解决

**Fault Tree和Hypothesis-Driven是顺序的**：
1. **Fault Tree FIRST**（生成可能原因树）
2. **Hypothesis-Driven SECOND**（系统地测试每个分支）

Fault Tree提供地图；Hypothesis-Driven提供遍历的纪律。

---

## 1. Fault Tree Analysis — 故障树分析

**Counter**: 在系统映射失败路径前不要跳跃到结论。

在测试任何假设之前，构建故障树：
- 以观察到的症状作为根节点
- 然后在每个级别分支到所有可能原因（硬件、软件、配置、数据、环境）
- 使用AND/OR门
  - 一些失败需要多个条件同时满足（AND）
  - 其他有独立触发器（OR）

此树成为你的调查路线图。按可能性和可测试性优先化分支，但**不要仅仅因为它们看起来不太可能就修剪分支** — 不太可能但容易测试的原因应该早测试。

```
                    [观察到 Symptom]
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      Hardware          Software       Environment
           │               │               │
      ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
      ▼         ▼     ▼         ▼     ▼         ▼
    Memory     CPU  Config    Logic  Network   Time
    Disk      ...    Data    ...    DNS       ...
```

---

## 2. Hypothesis-Driven Investigation — 假设驱动调查

**Counter**: 随机变更并希望某个起作用 — "霰弹调试"反模式。

对于故障树中的每个假设，遵循严格协议：

```
PREDICT:  "如果假设H正确，那么测试T应该产生结果R"
TEST:     执行恰好一个测试
OBSERVE:  记录实际结果
CONCLUDE: 
  - 匹配 → SUPPORTED（支持）
  - 失败 → ELIMINATED（排除）
  - 意外 → new evidence（新证据）
```

**规则**：每次测试不要改变超过一个变量 — 如果改变两个东西而bug消失，你不知道哪个变更修复了它。

---

## 3. Occam's Razor — 奥卡姆剃刀

**Counter**: 当简单解释尚未被排除时，追求复杂的多组件交互bug解释。

在调查复杂bug之前（race conditions、框架级问题），先验证简单解释：

```javascript
const simpleCauses = [
  "变量名拼写错误",
  "文件路径错误",
  "缺少import",
  "config值不正确",
  "缓存过期",
  "环境变量错误",
  "拼写错误",
  "错误的文件被编辑"
];

// 只有在简单解释被排除后，才升级到复杂假设
if (!eliminated(simpleCauses) && currentHypothesis.complexity > 3) {
  return verify(simpleCauses) first;
}
```

**简单解释account for大多数bug**。只有排除简单解释后才升级到复杂假设。

**如果你的当前假设需要3+个东西同时出错，后退并寻找单点失败**。

---

## 4. Counterfactual Thinking — 反事实思考

**Counter**: 不问"如果我们只改变这个会怎样"就无法隔离因果。

当你有关于根因的假设时，构建反事实：

```
"如果我只改变这一个变量/配置/代码行，bug应该消失（或出现）。"
```

执行反事实测试：

```javascript
function counterfactualTest(hypothesis, targetedChange) {
  const beforeState = getBugState();
  const beforeOccurrence = measureBugOccurrence();
  
  // 只应用目标变更
  applyOnly(targetedChange);
  
  const afterState = getBugState();
  const afterOccurrence = measureBugOccurrence();
  
  // 立即回滚
  rollback(targetedChange);
  
  // 分析
  if (afterOccurrence === beforeOccurrence) {
    return {
      verdict: 'ELIMINATED',
      reasoning: 'Bug持续存在，原因在别处'
    };
  }
  
  if (afterOccurrence === 0 && beforeOccurrence > 0) {
    return {
      verdict: 'SUPPORTED',
      reasoning: '强因果证据：目标变更是根因'
    };
  }
  
  return {
    verdict: 'INCONCLUSIVE',
    reasoning: '需要更多隔离测试'
  };
}
```

**这比相关性更强大**（"bug在deploy X后出现"），因为它测试机制，而不只是时间线。

---

## 何时不思考

在以下情况跳过结构化推理模型：

### 适合跳过的时候
- **明显的单原因bug** — 如果错误信息命名了确切的文件、行和原因，直接修复。不要为有堆栈跟踪的null引用构建故障树。
- **已知修复的复现** — 如果你已经从之前的调查或用户告诉你确切是什么导致了问题，知道根因，跳过假设驱动调查直接去修复。
- **Occam's Razor能立即解决的问题** — 如果奥卡姆剃刀能立即解决，用修复。不要调用完整模型。模型存在是为了简单检查失败时使用，不是为了阻碍简单检查。
- **读错误日志** — 读和理解错误输出是正常调试，不是"决策点"。只有在你有多个合理假设并需要选择先测试哪个时才调用模型。

### 何时使用

在以下情况使用这些模型：
- 同样的bug被"修复"了3次又出现
- Bug在不同地方出现，每次修复都揭示新问题
- 调查了一个小时没有任何进展
- 架构决策导致的问题
- 多组件系统中的间歇性bug
- 复杂的race condition

---

## 组合使用

### 调试工作流

```
1. [观察到Bug]
       │
       ▼
2. 构建Fault Tree
   - 列出所有可能原因
   - 识别AND/OR关系
   │
       ▼
3. 应用Occam's Razor
   - 简单解释优先测试
   │
       ▼
4. Hypothesis-Driven测试
   - 每个分支一个假设
   - PREDICT/TEST/OBSERVE/CONCLUDE
   │
       ▼
5. Counterfactual验证
   - 如果3+假设失败
   - 目标变更测试因果
   │
       ▼
6. [找到根因]
```

---

## Quick Reference

| 模型 | 用于 | Counter |
|------|------|---------|
| Fault Tree | 系统映射所有可能原因 | 跳跃到结论 |
| Hypothesis-Driven | 系统测试每个分支 | 霰弹调试 |
| Occam's Razor | 先验证简单解释 | 过度工程 |
| Counterfactual | 测试因果而非相关 | 混淆原因 |

---

## Example

**Bug**: 支付服务间歇性失败

**Fault Tree**:
```
[Payment Failed]
       │
       ├─[Hardware]──[DB Down]──[Network]
       ├─[Software]──[Timeout]──[Lock Contention]
       └─[Config]──[Rate Limit]──[Circuit Breaker]
```

**Occam's Razor检查**:
```bash
# 先验证简单原因
grep "rate_limit" config.yaml  # ✓ 找到了
# Rate limit设置太低
```

**Counterfactual Test**:
```
If I raise the rate limit, the bug should disappear.
→ Applied: rate_limit: 1000 → 10000
→ Bug disappears
→ SUPPORTED: Rate limit is the root cause
```
