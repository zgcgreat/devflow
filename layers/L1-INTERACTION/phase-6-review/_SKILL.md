# Phase 6: 双阶段审查 (Two-Stage Adversarial Review)

> **Layer**: L1-INTERACTION (SuperCorp 交互层)  
> **前置**: Phase 5 测试通过, Phase 4 Wave执行完成  
> **后置产物**: `.ultimate-workflow/<req-id>/06-review.md`  
> **门控**: G3 — Review Quality Gate

## Skill元信息

```yaml
name: phase-6-review
version: 3.1-enhanced (two-stage)
layer: L1-INTERACTION
source: SuperCorp Three-Layer Adversarial Review + gstack Cross-Model Review (R14) + Two-Stage Spec Compliance
dependencies:
  - code-quality, spec-compliance
v3_upgrade:
  two_stage_separation: true (Stage A spec compliance → Stage B code quality)
  three_layer_adversarial: true (Blind Hunter / Edge Case Hunter in Stage B only)
  cross_model_review: R14 (CRITICAL tasks → Claude+Codex comparison)
  agent_isolation: Review Agents run in isolated ~200K context each
```

## 输入

- Phase 4 实施代码
- Phase 5 测试报告 (`05-test-results.md`)
- Phase 3 任务计划 (`03-tasks.md`)
- PRD/需求文档 (`00-requirements.md`)
- Delta Spec (如有，`changes/<feature>/delta-spec.md`)

## 输出

- `06-review.md` — 双阶段审查报告 + G3门控结果

---

## ⭐ 核心创新: 双阶段分离 Concerns

**设计理念**: Spec compliance（需求对齐）和 code quality（代码质量）是两个正交 concern，混在同一轮审查会导致：
1. 优先级混乱 — PRD 遗漏和边界条件 bug 混在一起，不知先修哪个
2. Agent context 污染 — Acceptance Auditor 的 spec 上下文干扰 Blind Hunter 的代码盲点检测
3. 修复闭环不明确 — spec 问题需退回 Phase 3/4，code 问题只需在本 Wave 修

### 阶段概览

```
Phase 6: 双阶段审查
    │
    ├─→ Stage A: Spec Compliance Check (准入检查)
    │   ├─ Agent: Acceptance Auditor (独占)
    │   ├─ 输入: PRD/需求文档 + 实现代码
    │   ├─ 输出: PRD→实现覆盖矩阵
    │   └─ Gate: NOT_PASS → 直接退回 Phase 3，不进 Stage B
    │
    └─→ Stage B: Three-Layer Code Review (质量审查)
        ├─ Agents: Blind Hunter + Edge Case Hunter (并行独立)
        ├─ 输入: 代码 + Stage A 通过的覆盖矩阵
        ├─ 输出: 盲点发现 + 边界条件报告
        └─ Gate: G3 → PASS/FAIL
```

---

## Stage A: Spec Compliance Check (准入检查)

**Gate**: "Spec compliance NOT_PASS" → 需求未实现 → 退回 Phase 3，不执行 Stage B。

### Step A0: Acceptance Auditor 初始化

```yaml
acceptance_auditor:
  model_preference: requirement_focused
  context_isolation: ~200K fresh (PRD + implementation only)
  focus: "Map every PRD requirement to implementation"
```

### Step A1: PRD→实现覆盖矩阵

**审查维度**:
1. **逐条对照验收标准**: 每个 AC 是否有对应的实现？
2. **Delta Spec 差异确认**: Brownfield 项目中，delta spec 中 `[MODIFIED]` 的条目是否已正确应用？
3. **回归影响**: 修改是否影响已有功能的正确性？
4. **文档完整性**: API 文档/用户指南是否同步更新？

**输出格式**:

```markdown
## ✅ Stage A: Spec Compliance Check — [需求简述]

### 验收标准覆盖矩阵

| # | PRD要求 | 实现状态 | Delta Spec | 测试覆盖 | 审查结果 |
|---|--------|---------|-----------|---------|---------|
| 1 | 支持邮箱密码登录 | ✅已实现 | N/A (full) | ✅有单测 | PASS |
| 2 | JWT有效期30分钟 | ✅已实现 | [MODIFIED] from 60m | ✅有集成测试 | PASS |
| 3 | 失败锁定5分钟 | ✅已实现 | N/A (full) | ⚠️缺少压力测试 | PASS with note |
| 4 | 支持记住我(7天) | ✅未实现 | [ADDED] from delta spec | ❌无测试 | FAIL — missing implementation |

总覆盖: 3/4需求 = 75% (不通过 Stage A)
Stage A 判定: FAIL
退回阶段: Phase 3/4 — 补充实现记住我功能后再审
```

### Step A2: Stage A Gate Decision

```markdown
## Stage A Gate Result: [PASS / NOT_PASS]

| 检查项 | 状态 | 说明 |
|--------|------|------|
| PRD AC 覆盖 | ⚠️ 3/4 PASS | #4 "记住我"未实现 |
| Delta Spec 合并 | ✅ OK | [ADDED] 条目正确应用 |
| 回归影响 | ✅ OK | 已有功能无破坏 |
| 文档同步 | ✅ OK | API docs updated |

Stage A判定: NOT_PASS (#4 missing)
→ 退回 Phase 3/4，补充实现后重新进入 Phase 6
```

---

## Stage B: Three-Layer Code Review (质量审查)

**前置条件**: Stage A PASS → 继续执行 Stage B。

### Step B0: 审查员初始化

Stage B 有 **两个独立审查员并行工作**（不再含 Acceptance Auditor，它已在 Stage A 完成 spec 检查）：

```yaml
review_agents:
  blind_hunter:
    model_preference: analysis_strong
    context_isolation: ~200K fresh (no PRD context)
    focus: "Find what the developer expected to NOT happen"
  edge_case_hunter:
    model_preference: detail_oriented
    context_isolation: ~200K fresh
    focus: "Break everything at the edges"
```

### Step B1: Blind Hunter 审查

**审查维度**:
1. **静默失败**: API超时后用户看到什么？错误日志是否记录？
2. **竞态条件**: 重复提交/并发修改/网络重连时的行为
3. **状态不一致**: 前端显示与后端实际状态的差异
4. **边界资源**: 内存泄漏、连接池耗尽、磁盘满

**输出格式**:

```markdown
## 🎯 Blind Hunter — [需求简述]

### R1 (medium): Token过期后未刷新
**场景**: API调用时JWT过期 → 返回401 → 前端显示"未知错误"
**位置**: `api/user.ts:47`
**建议**: 添加token refresh interceptor + retry once
```

### Step B2: Edge Case Hunter 审查

**审查维度**:
1. **空值/默认值**: null/undefined/空字符串/0/[]的处理
2. **极端输入**: 超长字符串/超大数字/特殊字符/emoji
3. **并发场景**: 重复提交/同时编辑/WebSocket断连重连
4. **时区/语言**: UTC+8 vs UTC-5 / i18n缺失 / RTL布局

**输出格式**:

```markdown
## 🔍 Edge Case Hunter — [需求简述]

### E1 (medium): 搜索关键词包含正则特殊字符
**场景**: 搜索"test.cases" → 正则匹配任意字符
**位置**: `search/utils.ts:12`
**建议**: RegExp.escape() before query compile
```

---

## Stage A + Stage B 汇总 + G3 门控

### Step C: 双阶段审查报告合并

**⚠️ 强制规则**: 所有 High 风险必须修复后才能通过 G3。Medium 可标记已知问题并计划修复。

```markdown
# Phase 6 Review Report — [req-id]

## Stage A: Spec Compliance Check
- **结果**: PASS (4/4 AC covered)
- **Delta Spec 确认**: [MODIFIED] + [ADDED] 条目均已正确应用
- **回归影响**: ✅ No breakage in existing features

## Stage B: Three-Layer Code Review
- **Blind Hunter**: R1 (medium), R2 (high)
- **Edge Case Hunter**: E1 (low), E2 (low), E3 (medium)
- **Acceptance Auditor (Stage A)**: No findings

### 风险汇总

| ID | Stage | Agent | Severity | 描述 | 修复建议 |
|----|-------|-------|----------|------|---------|
| R1 | B | Blind Hunter | medium | Token过期未刷新 | Add interceptor + retry |
| R2 | B | Blind Hunter | high | 文件上传无大小限制 | maxFileSize validation |
| E1 | B | Edge Case | low | UI空状态不一致 | Unified EmptyState |
| E3 | B | Edge Case | medium | Regex special chars | RegExp.escape() |

### G3 门控结果: [FAIL]

- **需修复**: R2 (high) — 阻塞 Phase 7
- **计划中**: R1 (medium), E3 (medium) — 可后续处理
- **Low风险**: E1 — 忽略或标记 technical debt

G3判定: FAIL → 退回 Wave 修复 R2 后重审
预计修复时间: ~15分钟
```

## Phase 6 → Phase 7 衔接

- G3 PASS → 进入 Phase 7 (Canary发布)
- G3 FAIL → 退回对应 Wave 修复，重新执行 Phase 4→5→6
- Stage A NOT_PASS → 直接退回 Phase 3/4，不执行 Stage B

---

## Stage Separation Benefits

| 指标 | 单阶段审查 (旧) | 双阶段审查 (新) | 改进 |
|------|----------------|----------------|------|
| **优先级清晰度** | 低 (所有问题混排) | 高 (spec → code 分离) | ✅ |
| **Agent context 污染** | 高 (100K+ 混合上下文) | 低 (各 ~200K 独立) | ✅ |
| **修复闭环明确性** | 中 (不知退回 Phase 3/4/6) | 高 (Stage A FAIL → Phase 3, Stage B FAIL → Phase 4-6) | ✅ |
| **Token 效率** | ~50K (一次性读 PRD+代码) | ~25K × 2 (Stage A 读 PRD, Stage B 读代码) | ✅ 约 10% 节省（Stage A 可 skip 已覆盖的 AC） |

---

## Phase 6 → Next Phase Routing Decision

```
Stage A NOT_PASS:
    └─→ 退回 Phase 3/4 → 补充实现/修改 spec → re-enter Phase 6

Stage A PASS → Stage B FAIL (G3):
    └─→ 退回对应 Wave → 修复 High/Medium issues → re-enter Phase 6

Stage A PASS → Stage B PASS (G3):
    └─→ Phase 7 Canary发布
```
