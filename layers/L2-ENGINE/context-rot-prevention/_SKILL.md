---
name: context-rot-prevention
version: 3.0-draft
layer: L2-ENGINE
gate: internal
requires: [memory-files]
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
