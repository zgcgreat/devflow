---
name: phase-8-archive
preamble-tier: 2
version: 3.0-draft
description: |
  Knowledge archival engine that aggregates Wave SUMMARYs, promotes lessons learned
  to LESSONS.md, creates/updates domain skills from high-frequency patterns (≥3),
  and archives session state. Use when: "archive phase", "knowledge consolidation",
  "LESSONS nomination", "domain skill promotion". (devflow)
layer: L1-INTERACTION
source: 交互层 Phase 8 + 引擎层 LearningWorkflow + 架构层 Memory Manager
dependencies:
  - wave-executor (input: per-wave SUMMARY.md files)
  - learning-workflow (post-archive: LESSONS update + domain skill graduation)
token_budget: ~80K tokens (Wave SUMMARY aggregation + LESSONS deduplication, max 10 waves)
triggers:
  - archive phase
  - knowledge consolidation
  - LESSONS nomination
  - domain skill promotion
  - G8 gate
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Phase 8: 知识归档 (Knowledge Archival)

> **Layer**: L1-INTERACTION (交互层交互层) + L2-ENGINE (LearningWorkflow) + L3-ARCHITECTURE (Memory Manager)  
> **前置**: G5 集成通过, Phase 7 Canary发布完成  
> **后置产物**: `memory/LESSONS.md` + `memory/domain-skills/*.md` + `STATE.md`归档  
> **门控**: G8 — Archive Quality Gate

## Preamble

### What I Am / What I'm Not

**I am**: The knowledge archival engine that turns completed workflow experience into reusable assets — lessons learned, domain skills, and state summaries. I enable cross-session learning by ensuring Phase 9+ inherits wisdom from every completed requirement.

**I'm not**: A report generator (that's Phase 6 review output), a code linter, a test runner, or a Git commit tool. My sole purpose is knowledge preservation and reuse preparation.

### Pre-Requisite Gate Checklist

Before starting archive phase, verify ALL of the following:

- [ ] G5 Integration Gate has passed
- [ ] Phase 7 Canary release completed (or no canary if non-production)
- [ ] All Wave SUMMARY.md files accessible at `.specs/waves/wave-{N}/SUMMARY.md`
- [ ] Phase 6 review report exists (`06-review.md`) — for edge case extraction
- [ ] memory/ directory exists and is writable (or create it)

**Gate Result**: `[PASS / FAIL]` — If any item FAILS, address before starting. This gate MUST pass for every requirement archive.

### Key Principles

1. **LESSONS Must Nominate**: Every failed task across all waves nominates to LESSONS.md; duplicate root causes merge into single update entry
2. **Domain Skill Threshold ≥3**: Same domain pattern appears ≥3 times → create/update domain-skill file with best practices
3. **TEMPORARY Cleanup Required**: Clear session-specific temporary notes, keep only cross-session valuable information
4. **STATE.md Must Record Archive Metrics**: total_waves, tasks_succeeded/failed, lessons_nominated, domain_skills_created — enables progress tracking

---

## Skill元信息

```yaml
name: phase-8-archive
version: 3.0-draft
layer: L1-INTERACTION (L2/L3 collaboration for knowledge archival)
source: 交互层 Phase 8 + 引擎层 LearningWorkflow + 架构层 Memory Manager
dependencies:
  - wave-executor (input: per-wave SUMMARY.md files)
  - learning-workflow (post-archive: LESSONS update + domain skill graduation)
v3_upgrade:
  learning_workflow_integration: true (LESSONS nomination + domain-skills promotion)
  cross_wave_dedup: true (cross-wave lesson deduplication)
  wave_summary_archival: true (per-wave SUMMARY.md aggregation)
```

## 输入

- 所有 Phase 产物 (`.devflow/<req-id>/`)
- **Wave SUMMARY.md 文件** — `.specs/waves/wave-{N}/SUMMARY.md` (Wave Executor L2-ENGINE 写入,Phase 4 已在此路径统一输出)
- Phase 6 审查报告 (`06-review.md`)
- Phase 7 Canary报告 (`07-canary.md`)
- `memory/STATE.md` (当前会话状态)

> **修复 (2024-05-17)**: Wave SUMMARY 引用统一为 `.specs/waves/wave-{N}/SUMMARY.md`,与 Phase 4/Phase 5/Wave Executor 一致。不再引用旧的 `WAVE-N-SUMMARY.md` 路径。

## 输出

- `memory/LESSONS.md` — Lessons Learned更新
- `memory/domain-skills/*.md` — Domain Skills Promotion
- `STATE.md` — 归档完成状态标记

## ⭐ 核心创新: LearningWorkflow 知识沉淀闭环

Phase 8 是 v3.0 **LearningWorkflow自动进化**的核心入口——将本次工作流的所有经验沉淀为可复用的知识资产。

## 执行流程

### Step 1: Wave SUMMARY 聚合

**Canary Stability Priority**: If Phase 7 completed and `.devflow/canary-report.md` exists, parse its stability score. Waves with canary failures get LESSONS priority boost (P1→P0). Flag any lessons from unstable waves in `LESSONS.md` as `[CANARY-FAILED]`.

**Pre-aggregation gate-check**: Run this before proceeding:
```bash
if [ -f ".devflow/canary-report.md" ]; then
  echo "✅ Canary report found — applying stability priority to LESSONS nominations"
  CANARY_STABILITY=$(grep -i "stability\|final.result\|PASS\|FAIL" .devflow/canary-report.md | tail -5)
else
  echo "⚠️ No canary report — normal LESSONS priority ordering"
fi

# Canary gate-check reference: custom validation for canary-report existence
if [ ! -f ".devflow/canary-report.md" ] && [ -f ".devflow/g5-gate-decision" ]; then
  G5_RESULT=$(grep "G5 Result:" .devflow/g5-gate-decision 2>/dev/null || echo "UNKNOWN")
  echo "Canary report missing but G5 gate exists: $G5_RESULT — verify Phase 7 output before aggregation"
fi
```

**Aggregation Limits**:
- Read at most 10 most recent waves (or ALL if total ≤10 waves)
- Total processing time cap: 20 minutes / 50 waves max per batch
- Skip waves where `wave_number < current - 10` unless explicitly requested

Iteration limit logic:
```bash
TOTAL_WAVES=$(ls .specs/waves/wave-*/SUMMARY.md 2>/dev/null | wc -l)
if [ "$TOTAL_WAVES" -le 10 ]; then
  WAVE_START=1
else
  WAVE_START=$((TOTAL_WAVES - 9))
fi
for i in $(seq $WAVE_START $TOTAL_WAVES); do
  SUMMARY=".specs/waves/wave-${i}/SUMMARY.md"
  [ -f "$SUMMARY" ] || continue
  # process $SUMMARY...
done
```

遍历 Phase 4 所有 Wave，提取关键指标 from canonical SUMMARIES (see [wave-executor/_SKILL.md](../L2-ENGINE/wave-executor/_SKILL.md) for field definitions). Consume these canonical fields:

- `Tasks Executed` → task count
- `Success Rate` → parsed as {passed}/{total}
- `Result` → PASS / NEEDS_WORK / BLOCKED
- `LESSONS Nomination` section → extract L-XXX entries
- `Breaking Changes` section → list migration requirements

```markdown
# Wave Summaries

| Wave | Tasks Executed | Success Rate | Result | LESSONS Nominated |
|------|---------------|--------------|--------|-------------------|
| Wave 1 | 3 | 3/3 (100%) | PASS | auth-retry-pattern (L-NEW) |
| Wave 2 | 2 | 2/2 (100%) | PASS | — |
| Wave 3 | 4 | 3/4 (75%) | NEEDS_WORK | file-upload-concurrent (L-NEW), api-timeout-stale (L-UPDATE) |
```

**Field mapping rules**:
- `Tasks Executed` = count from SUMMARY header
- `Success Rate` = parsed from `{passed}/{total}` format
- `Result` = read from `**Result**: {value}` line at bottom of SUMMARY
- LESSONS nominations = extract all `L-XXX [CATEGORY]` entries from LESSONS section

#### Brownfield Considerations

When archive contains changes from multiple waves, apply brownfield-aware analysis:

1. **Cross-wave conflict detection**: When comparing consecutive wave outputs (wave-{N} vs wave-{N+1}), detect merge conflicts between overlapping files
   - Command: `git diff --name-only wave-{N-1}..wave-{N}` for each wave boundary
   - Flag files modified by multiple waves with different changes

2. **Actual vs reported delta**: Use `.specs/waves/wave-{N}/SUMMARY.md` git diff to identify actual changes vs. what was reported in the summary
   - Compare `git status --short` against files listed in SUMMARY's "Modified Files" section
   - Report discrepancies in archive audit trail

3. **Delta Summary**: Add a "Delta Summary" section showing what actually changed vs Phase 4 initial brownfield state (from `brownfield-report.md`)
   ```markdown
   ## Delta Summary (Brownfield Analysis)
   
   | File | Brownfield State (Phase 4) | Final State | Net Change |
   |------|---------------------------|-------------|------------|
   | src/auth.py | Modified (pre-existing) | Wave 2 modified + Wave 3 refactored | Delta: {line changes} |
   ```
   - If brownfield-report.md flagged N conflicts and M were resolved → report resolution rate
   - Unresolved conflicts → escalate to Phase 6 review

### Step 2: LESSONS 提名 + 去重

**⚠️ 强制规则**: 每个Wave的失败教训必须提名到LESSONS.md，重复根因合并。

```markdown
## LESSONS Nomination Protocol

### L-NEW [FAILURE] auth-retry-pattern → Wave 1
- **场景**: JWT token刷新时并发竞争导致401错误
- **根因**: 多个请求同时检测token过期 → 同时发起刷新 → race condition
- **解决方案**: Single-flight模式，加锁确保只有一个刷新请求
- **复用性**: ⭐⭐⭐⭐ (可复用到所有API调用场景)

### L-NEW [FAILURE] file-upload-concurrent → Wave 3
- **场景**: 多文件并发上传时顺序错乱
- **根因**: Promise.all并行无order保证，后端按到达顺序处理
- **解决方案**: 添加fileIndex字段 + 后端按index排序
- **复用性**: ⭐⭐⭐ (通用文件上传模式)

### L-UPDATE [FAILURE] api-timeout-stale → Wave 3 (updated from Wave 1)
- **原记录**: API超时未配置 → 用户无限等待
- **本次观察**: 已添加5s timeout + retry，但retry策略过于激进(立即重试)
- **改进**: 改为exponential backoff (base=500ms, max=5s, multiplier=2)
```

Note: All L-XXX entries must use the `L-{NEW|UPDATE} [{CATEGORY}] {title} → Wave {N}` prefix format for cross-file consistency. This is enforced by wave-executor and executor templates.

### Step 3: Domain Skills Promotion

将高频复用的Best Practices提炼为Domain Skill文件：

**⚠️ 强制规则**: 同一领域出现≥3次相似模式 → 创建/更新 domain-skill。

```markdown
# Domain Skills Promotion Protocol

## auth.md (新建)
```yaml
domain: authentication
trigger_patterns:
  - "auth-*"
  - "login"
  - "token"
  - "jwt"
best_practices:
  - name: JWT Single-Flight Refresh
    description: Token刷新时使用single-flight模式，加锁防并发竞争
    implementation: const refreshPromise = Promise.resolve().then(...)
    note: 所有API调用统一使用auth interceptor管理token生命周期
  - name: Exponential Backoff Retry
    description: API失败重试使用指数退避
    formula: delay = min(base * multiplier^attempt, max)
    defaults: base=500ms, max=5s, multiplier=2
```

## file-upload.md (新建)
```yaml
domain: file_upload
trigger_patterns:
  - "upload"
  - "file"
  - "multipart"
best_practices:
  - name: Multi-File Order Preservation
    description: 并发上传时保持文件顺序
    implementation: add index field to each file request, backend sorts by index
```
```

### Step 3.5: TEMPORARY Notes Cleanup

**⚠️ 强制规则**: Phase 8 必须清理本次工作流产生的所有临时笔记。

```markdown
## TEMPORARY.md Archive Action

Before archive:
- memory/TEMPORARY.md has {N} entries from this req-id
- Entries older than 7 days → prune
- Entries relevant to current domain → promote to LESSONS.md if needed

After archive:
- Keep only cross-session valuable notes
- Clear session-specific observations (e.g., "this project uses X framework")
```

### Step 4: State Archive + Session Log

**⚠️ 强制规则**: 更新 STATE.md 归档标记，写入会话日志。

```yaml
# STATE.md update
archive:
  status: complete
  completed_at: "2026-05-17T15:00:00+08:00"
  req_id: "<req-id>"
  total_waves: 3
  total_tasks: 9
  tasks_succeeded: 8
  tasks_failed: 1
  lessons_nominated: 3
  domain_skills_created: 2
  domain_skills_updated: 1
  commit_hashes: ["abc123", "def456"]
  g8_gate: PASS

# Session journal entry
memory/journals/2026-05-17-session.md appended:
- req <req-id> completed at 15:00
- 3 waves, 9 tasks, 8 succeeded
- 3 lessons nominated to LESSONS.md
- 2 domain skills created in domain-skills/
```

### Step 5: G8 门控 + 跨波经验注入准备

**⚠️ 强制规则**: G8 必须检查所有Wave的LESSONS都已完成提名。

```markdown
## G8 门控结果: [PASS / FAIL]

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Wave SUMMARY聚合 | ✅ 完成 | 3 waves全部扫描 |
| LESSONS提名 | ✅ 完成 | 3条已提名(2 NEW + 1 UPDATE) |
| Domain Skills Promotion | ✅ 完成 | 2个新skill创建 |
| STATE.md归档 | ✅ 完成 | archive字段已更新 |
| Session Journal | ✅ 完成 | 日志已追加 |

G8判定: PASS → Phase 8完成，工作流结束。
```

## Phase 8 → Next Session 衔接

下次工作流启动时，`memory/domain-skills/`中的知识将自动注入到对应 Wave 的 Execution Agent 上下文中：

```yaml
# Next session auto-injection
next_session:
  load_domain_skills: true
  match_context: "current task keywords → domain-skills/trigger_patterns"
  inject_amount: "<5 skills per wave, max ~200K tokens"
```

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Archive Impact |
|-------|------|------------|--------|----------------|
| **P0** | BLOCKING | LESSONS.md write fails OR domain-skill directory permission denied | Retry once; if still fails, output to `/tmp/phase8-archive-{req-id}.md` and warn user | Knowledge not persisted — critical for cross-session learning loss |
| **P1** | RECOVERABLE | Wave SUMMARY.md missing (file doesn't exist at expected path) | Skip missing wave, document skipped waves in archive report | Partial knowledge loss but archive continues |
| **P2** | WARNING | Domain skill pattern appears 2-3 times (below ≥3 graduation threshold) | Mark as `[NEEDS MORE DATA]` in domain-skill draft, don't promote to full domain-skill yet | Graduation deferred until pattern frequency confirmed ≥3 times |
| **P3** | INFO | TEMPORARY.md is empty or has no cross-session entries | Log info message, no action needed — normal for first-time requirements | No impact on archive completeness |

**Severity Assignment Rules**:
- Default to P1 for any missing Wave SUMMARY (should be caught by pre-requisite gate but allow gap)
- Escalate from P2→P0 only when domain-skill promotion would lose critical project-specific knowledge
- Never demote: once P0 assigned, archive fails and requires manual intervention

**Automated Deduplication**: When processing LESSONS nominations across waves, merge entries with same root cause into single `[UPDATE]` entry with list of wave sources (e.g., "[UPDATED by Wave 1 + Wave 3]").

---

## Boundary Conditions

### Archive Completeness Thresholds

| Parameter | Limit/Threshold | Rationale | Action if Below Threshold |
|-----------|-----------------|-----------|---------------------------|
| Wave SUMMARY files scanned | 100% of waves completed | Any wave without summary = knowledge gap | Log skipped wave with reason, proceed with remaining |
| LESSONS nominations per failed task | ≥1 nomination per P1/P0 task failure | Each failure must contribute to cross-session learning | Auto-nominate with `[AUTO: insufficient details from wave log]` |
| Domain skill pattern frequency | ≥3 occurrences across waves/requirements | Threshold for reusable best practice confirmation | Create draft domain-skill with `[NEEDS MORE DATA]` marker |
| TEMPORARY.md entries pruned | Entries >7 days old removed | Prevent memory bloat from stale session data | Archive old entries to `memory/TEMPORARY-{date}.bak.md` before purge |

### State Archive Requirements

| Field | Required | Validation Rule |
|-------|----------|-----------------|
| archive.status | ✅ Must be "complete" | No other values accepted (FAIL/UNKNOWN invalid) |
| archive.completed_at | ✅ ISO 8601 datetime | Must match actual archive execution timestamp |
| archive.req_id | ✅ Matches original requirement ID | Cross-reference with `.devflow/req-id` file |
| archive.total_waves | ✅ Non-negative integer | Must equal count of actual WAVE-N-SUMMARY.md files processed |
| archive.total_tasks | ✅ Sum of tasks_succeeded + tasks_failed | Arithmetic consistency check: succeeded + failed = total |
| archive.g8_gate | ✅ PASS or FAIL | If FAIL, must have reason in archive.report section |

### Memory File Size Constraints

| File | Max Size | Compression Action |
|------|----------|-------------------|
| LESSONS.md | ≤50KB per file | If >50KB: move entries older than 30 days to `memory/LESSONS-YYYY-MM-bak.md` |
| domain-skill/*.md | Each ≤5KB | Truncate implementation examples if too long, keep trigger_patterns + best_practices |
| TEMPORARY.md | ≤10KB | Prune entries >7 days old, keep only cross-session valuable notes |
| STATE.md | ≤2KB | Only archive section needs persistence; progress/decision sections can be compacted |

### Cross-Session Knowledge Injection Rules

| Rule | Constraint | Rationale |
|------|------------|-----------|
| Domain skills per wave | ≤5 skills injected | Beyond 5 → context window bloat, diminishing relevance |
| Skill injection token budget | ≤120K tokens (90% of domain skill allocation) | Remaining 10% reserved for other L2/L3 content |
| Match priority | Highest-frequency patterns first | Most proven practices have higher expected value |
| Stale skill eviction | Skills not referenced in 60 days → removed from rotation | Prevents dead knowledge accumulation |

### Timeout Constraints

| Constraint | Detail | Fallback Behavior |
|------------|--------|-------------------|
| Timeout | Wave SUMMARY aggregation + LESSONS.md update | ≤20 min for ≤50 waves; linear extrapolation beyond that | If >60 waves: process in batches of 10 with intermediate commits |

### G8 Gate Fail Scenarios

**Skip archive, escalate to Orchestrator if**:
- ≥2 consecutive Wave SUMMARY files missing (indicates Wave Executor failed to write)
- Domain skill promotion creates file that conflicts with existing git-tracked skill
- STATE.md is read-only and can't be updated (permission denied after retry)
- LESSONS nomination contains >10 entries in single archive (suggests systematic problem, not individual task failure)

### Provider Routing

- Phase 8 → **Any capable model** (knowledge extraction doesn't require special capabilities, standard coding model suffices)
- For large requirements with >20 tasks across waves → prefer model with larger context window to process all Wave SUMMARIES in single pass
- If memory compression needed → use model with good summarization capability for LESSONS deduplication

---

## 参考文件

- `references/RULES-v3.md` R1-R20
- `layers/L2-ENGINE/learning-workflow/_SKILL.md` (post-archive: domain skill graduation)
- `layers/L2-ENGINE/wave-executor/_SKILL.md` (input: per-wave SUMMARY.md files)

## Sprint 10 Audit: C-P2-3 Phase 8 Archive Token Usage Unbounded 修复确认

**Issue**: Phase 8 archive 聚合所有 wave SUMMARY 时未限制读取量
**Status**: ✅ RESOLVED — 已添加 N+M iteration limit (只读最近 10 waves)

**修复内容**:
1. Step 1 "Aggregation Limits" (lines 123-141) 定义了:
   - 最多读取最近 10 个 waves (或全部 ≤10 waves)
   - 总处理时间上限: 20分钟/50 waves per batch
   - 跳过 wave_number < current - 10 除非显式请求
2. bash iteration limit logic (lines 129-141) 实现了 WAVE_START 计算
3. token_budget frontmatter 已声明 ~80K tokens (max 10 waves)
