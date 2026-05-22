---
name: context-rot-prevention
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: []
provides: [freshness-report, cleaned-memory]
description: Prevents context rot — stale memory, outdated references, and drift between documentation and reality
source: superpowers context management + caveman memory hygiene
dependencies:
  - memory-compression
  - verification-closed-loop
triggers:
  - memory load
  - phase transition
  - stale detection
external-inputs: [memory-files]
---

# Context Rot Prevention — 上下文腐化防护

## 问题

随着项目演进，记忆文件中的信息逐渐过时：
- 已修复的 bug 仍列在 KNOWN_FAILURES 中
- 已变更的架构仍按旧描述记录
- 已完成的任务仍在 DECISIONS 中标记为 pending
- 代码结构已变但 PATTERNS 仍引用旧路径

## 防护机制

### 1. 时间戳标记

每个记忆条目必须有创建时间和最后验证时间：

```markdown
## [PATTERN] React State Management
- Created: 2026-05-19
- Last Verified: 2026-05-19
- Expires: 2026-06-19 (30 days)
- Content: ...
```

### 2. 自动过期检查

```
Phase 变更时触发:
  1. 扫描所有记忆文件
  2. 查找 Last Verified > 14 天的条目
  3. 标记为 [STALE]
  4. 在 Phase 开始时提示: "N 个记忆条目需要验证"
```

### 3. 验证方法

| 条目类型 | 验证方法 | 自动化程度 |
|---------|---------|-----------|
| KNOWN_FAILURES | 检查 bug 是否已修复 | 半自动 (运行测试) |
| DECISIONS | 检查决策是否仍有效 | 手动 |
| PATTERNS | 检查代码路径是否仍存在 | 全自动 (grep) |
| API_CONTRACTS | 检查 API 是否仍匹配 | 全自动 (schema 验证) |
| LESSONS | 检查教训是否仍相关 | 手动 |

### 4. 腐化度评分

```
腐化度 = (stale_entries / total_entries) * 100

0-20%:   健康 ✅
20-40%:  需关注 ⚠️
40-60%:  需清理 🔶
60-100%: 严重腐化 🔴 → 必须在继续前清理
```

## 集成点

### Phase 0 (Strategy)
加载记忆时自动检查腐化度，超过 40% 时提示清理。

### Phase 4 (Build)
每个 Wave 开始时检查相关记忆条目是否仍然准确。

### Phase 8 (Archive)
归档时执行全面记忆清理：
1. 移除已不相关的条目
2. 更新所有 Last Verified 时间戳
3. 重置腐化度评分

## CLI

```bash
# 检查腐化度
node context-rot.js check /path/to/project

# 标记过期条目
node context-rot.js mark-stale /path/to/project --days 14

# 清理过期条目
node context-rot.js clean /path/to/project --confirm
```

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Execution Impact |
|-------|------|------------|--------|------------------|
| **P0** | BLOCKING | Memory corruption > 60% — majority of entries stale/inaccurate | Halt workflow; force full memory cleanup | All Phase work blocked until cleaned |
| **P1** | RECOVERABLE | Stale entry incorrectly marked as valid (false negative) | Re-verify entry; update timestamp or mark [STALE] | Proceed with caution; flag for review |
| **P2** | WARNING | Auto-verification unavailable for entry type (e.g., DECISIONS) | Mark as [NEEDS_MANUAL_REVIEW]; proceed | Continue; schedule manual review |
| **P3** | DEGRADATION | Partial memory scan — time budget exceeded | Process only high-priority entries; defer rest | Reduced coverage; next trigger completes scan |

**Severity Assignment Rules**:
- Default to P2 for any verification failure
- Escalate to P0 if corruption > 60% (structural integrity at risk)
- Never demote: once P0, only full cleanup can clear

## Boundary Conditions

### When to Escalate Immediately
- Memory corruption > 60% → halt and force cleanup before any Phase work
- Critical entry (KNOWN_FAILURES for security bug) is stale → immediate re-verification

### When to Skip Rot Check
- Session just started (< 5 minutes of work) → defer to first Phase transition
- Only 1-2 memory entries total → check is trivially fast, always run

### Degradation Path
1. Full scan → 2. High-priority only (time budget) → 3. Defer to next trigger
