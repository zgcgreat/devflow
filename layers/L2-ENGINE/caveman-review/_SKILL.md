---
name: caveman-review
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: [implemented-code, code-commits, review-context]
provides: [one-line-comments, severity-badge]
description: >
  Caveman-style one-line PR comments for Phase 6 Review.
  Format: L{line}: {severity} {category}: {finding}. {action}.
  Cuts review verbosity ~80% while preserving full technical precision.
  Example: "L42: 🔴 bug: user null. Add guard."
source: caveman skills/caveman-review
dependencies:
  - token-compression-v2
---

# Caveman Review — 一行审查评论

## Purpose

Phase 6 双阶段对抗审查中，用 caveman 风格生成一行 PR 评论。
保留完整技术精度，减少 ~80% 冗余描述。

## 格式

```
L{line}: {severity} {category}: {finding}. {action}.
```

### 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| L{line} | 代码行号 | L42 |
| severity | 严重程度 | 🔴 P0 / 🟠 P1 / 🟡 P2 / 🟢 P3 |
| category | 问题类别 | bug / security / perf / style / edge |
| finding | 发现了什么 | user null, N+1 query, XSS vector |
| action | 怎么做 | Add guard, Add index, Escape input |

### 完整示例

```
L42: 🔴 bug: user null. Add guard.
L128: 🟠 security: raw SQL in query. Use params.
L89: 🟡 perf: N+1 query. Add eager load.
L156: 🟢 style: redundant else. Simplify.
L203: 🔴 edge: race condition in checkout. Add mutex.
```

## 与 Phase 6 集成

### Stage A (Spec Compliance Auditor)

审查需求满足度时，用一行评论标注每个 FR 的实现状态：

```
FR-001: ✅ L23-L67 impl. All AC pass.
FR-002: ⚠️  L89-L102 impl. AC-3 missing. Add.
FR-003: 🔴 L145-L189 impl. Bug: user null (L156). Fix guard.
```

### Stage B (代码质量 + Edge Hunter)

审查代码质量时，用 caveman-review 生成评论：

```
L42: 🔴 bug: user null. Add guard.
L128: 🟠 security: raw SQL in query. Use params.
L89: 🟡 perf: N+1 query. Add eager load.
L203: 🔴 edge: race condition in checkout. Add mutex.
```

## 规则

### 必须压缩

- 移除冠词 (a/an/the)
- 移除填充词 (just, really, basically)
- 移除连接词 (however, furthermore)
- 用缩写 (user, query, impl, add, use, fix)
- 用箭头表示因果 (X → Y)
- 短句/片段 OK

### 必须保留

- 代码行号
- 错误字符串（精确）
- API 名称、函数名
- 技术术语（XSS, N+1, mutex）
- 代码行号范围内的行号范围（如 L23-L67）

## 与 caveman-compress 的关系

- caveman-compress 压缩**文件内容**
- caveman-review 压缩**审查评论**
- 两者共享同一套压缩规则
- caveman-review 是 Phase 6 的专用压缩器

## Boundaries

- 仅用于审查评论生成
- 不修改代码本身
- 保留代码行号、错误字符串、API 名称
- 如果一行评论产生歧义，自动展开为两句（见 output-compression 的 auto-clarity 规则）

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Execution Impact |
|-------|------|------------|--------|------------------|
| **P0** | BLOCKING | Core operation fails with unrecoverable state corruption | Halt, rollback to last checkpoint, escalate | Blocks dependent operations |
| **P1** | RECOVERABLE | Operation fails but state remains consistent | Retry 3x with exponential backoff (1s→2s→4s); if still fails → document, mark NEEDS_WORK | No cross-skill impact |
| **P2** | WARNING | Operation succeeds with quality degradation | Document in SUMMARY, do NOT block execution | Continue normally |
| **P3** | DEGRADATION | Operation timeout or resource exhaustion | Cancel current sub-operation, mark PARTIAL_PASS, log to heartbeat | Cancels current op; next cycle may proceed |

**Severity Assignment Rules**:
- Default to P1 for any operation failure
- Escalate to P0 if state corruption detected or dependent operations affected
- Never demote: once P0, only manual override can clear

## Boundary Conditions

### When to Escalate Immediately
- Operation produces corrupted output → halt and rollback
- Dependency unavailable and no fallback → halt, report missing dependency

### When to Skip Operation
- Input preconditions not met → skip, log reason, proceed to next step
- Already completed in current session → skip (idempotency)

### Degradation Path
1. Full operation → 2. Retry with backoff → 3. Fallback/skip → 4. Halt and report
