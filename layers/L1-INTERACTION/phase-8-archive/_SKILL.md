# Phase 8: 知识归档 (Knowledge Archival)

> **Layer**: L1-INTERACTION (SuperCorp交互层) + L2-ENGINE (LearningWorkflow) + L3-ARCHITECTURE (Memory Manager)  
> **前置**: G5 集成通过, Phase 7 Canary发布完成  
> **后置产物**: `memory/LESSONS.md` + `memory/domain-skills/*.md` + `STATE.md`归档  
> **门控**: G8 — Archive Quality Gate

## Skill元信息

```yaml
name: phase-8-archive
version: 3.0-draft
layer: L1-L2-L3_COLLABORATION
source: SuperCorp Phase 8 + SEP LearningWorkflow + Mega-Workflow Memory Manager
dependencies:
  - none (finalization phase)
v3_upgrade:
  learning_workflow_integration: true (LESSONS nomination + domain-skills promotion)
  cross_wave_dedup: true (cross-wave lesson deduplication)
  wave_summary_archival: true (per-wave SUMMARY.md aggregation)
```

## 输入

- 所有 Phase 产物 (`.ultimate-workflow/<req-id>/`)
- Wave SUMMARY.md 文件 (Phase 4 each wave)
- Phase 6 审查报告 (`06-review.md`)
- Phase 7 Canary报告 (`07-canary.md`)
- `memory/STATE.md` (当前会话状态)

## 输出

- `memory/LESSONS.md` — Lessons Learned更新
- `memory/domain-skills/*.md` — Domain Skills Promotion
- `STATE.md` — 归档完成状态标记

## ⭐ 核心创新: LearningWorkflow 知识沉淀闭环

Phase 8 是 v3.0 **LearningWorkflow自动进化**的核心入口——将本次工作流的所有经验沉淀为可复用的知识资产。

## 执行流程

### Step 1: Wave SUMMARY 聚合

遍历 Phase 4 所有 Wave，提取关键指标：

```markdown
# Wave Summaries

| Wave | 任务数 | 成功 | 失败 | 耗时 | LESSONS提名 |
|------|--------|------|------|------|------------|
| Wave 1 | 3 | 3 | 0 | 15min | auth-retry-pattern (NEW) |
| Wave 2 | 2 | 2 | 0 | 8min | — |
| Wave 3 | 4 | 3 | 1 | 20min | file-upload-concurrent (NEW), api-timeout-stale (UPDATE) |
```

### Step 2: LESSONS 提名 + 去重

**⚠️ 强制规则**: 每个Wave的失败教训必须提名到LESSONS.md，重复根因合并。

```markdown
## LESSONS Nomination Protocol

### [NEW] auth-retry-pattern (来自 Wave 1)
- **场景**: JWT token刷新时并发竞争导致401错误
- **根因**: 多个请求同时检测token过期 → 同时发起刷新 → race condition
- **解决方案**: Single-flight模式，加锁确保只有一个刷新请求
- **复用性**: ⭐⭐⭐⭐ (可复用到所有API调用场景)

### [NEW] file-upload-concurrent (来自 Wave 3)
- **场景**: 多文件并发上传时顺序错乱
- **根因**: Promise.all并行无order保证，后端按到达顺序处理
- **解决方案**: 添加fileIndex字段 + 后端按index排序
- **复用性**: ⭐⭐⭐ (通用文件上传模式)

### [UPDATE] api-timeout-stale (来自 Wave 3, updated from Wave 1)
- **原记录**: API超时未配置 → 用户无限等待
- **本次观察**: 已添加5s timeout + retry，但retry策略过于激进(立即重试)
- **改进**: 改为exponential backoff (base=500ms, max=5s, multiplier=2)
```

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

## Phase 8 向后兼容

| v1.0 产物 | Phase 8 处理 |
|-----------|-------------|
| `memory/DECISIONS.md` | 保留不变，追加最终决策摘要 |
| `memory/KNOWN_FAILURES.md` | 保留不变，Phase 6发现的Edge Case补充到此文件 |
| `<req-id>/07-integration.md` | Phase 8产物合并到此文件 |
