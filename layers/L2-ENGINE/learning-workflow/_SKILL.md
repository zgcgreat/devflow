# LearningWorkflow — 自动进化引擎 (v3独有核心)

> **Layer**: L2-ENGINE (SEP Engine Layer)  
> **触发时机**: Phase 4 每个Wave完成后  
> **前置产物**: Wave执行日志、TASK状态、TEST结果  
> **后置产物**: `memory/LESSONS.md` + `memory/domain-skills/*.md`  
> **版本**: v3.0-draft

## Skill元信息

```yaml
name: learning-workflow
version: 3.0-draft
layer: L2-ENGINE
source: SEP LearningWorkflow + SuperCorp ARCHIVE-PROMPT (enhanced)
dependencies:
  - none (runs as post-Wave hook in Phase 4)
v3_upgrade:
  auto_evolution: true (post-Wave automatic lesson extraction)
  cross_wave_injection: true (Wave N LESSONS → Wave N+1 context injection)
  domain_skills_promotion: true (high-frequency patterns → persistable skills)
```

## ⭐ LearningWorkflow 核心设计

LearningWorkflow 是 v3.0 **唯一在所有三大项目(SEP/SuperCorp/Mega-Workflow)中都缺失**的能力——其他三个项目都没有运行时自动进化机制。它让系统**越用越强**，每次工作流的经验都能被后续工作流复用。

### 生命周期

```
Phase 4: Wave执行完成
    │
    ▼
LearningWorkflow.run() [post-Wave hook]
    │
    ├─→ Extract Lessons (失败教训提取)
    │   ├─ NEW patterns → LESSONS.md
    │   └── UPDATED patterns → dedup against existing
    │
    ├─→ Promote Domain Skills (高频模式固化)
    │   ├─ Frequency ≥ 3 → domain-skill/{domain}.md
    │   └─ Merge with existing (keep best version)
    │
    └─→ Mark for Cross-Wave Injection (下次Wave自动加载)
        └─ Wave N+1启动时: load matching domain-skills/
```

## 执行流程

### Step 0: Data Classification — Durable vs Temporary (v3.1 Enhancement)

**⚠️ 强制规则**: 所有学习产出在写入前必须分类为 durable facts、temporary notes 或 session state。混写是知识管理混乱的根因。

#### 三类数据定义

| 类别 | 用途 | 生命周期 | 存储位置 |
|------|------|---------|---------|
| **Durable Facts** | 可跨会话复用的领域知识 | 永久（除非被 newer evidence 取代） | `memory/domain-skills/{domain}/SKILL.md` |
| **Temporary Notes** | 本次工作流有效，下次不需要的笔记 | 当前 session / Phase 8 清理 | `memory/TEMPORARY.md` |
| **Session State** | 当前请求的工作状态追踪 | 每次 req-id 独立，不跨 req 复用 | `.ultimate-workflow/<req-id>/STATE.md` |

#### Classification Decision Tree

```yaml
is_learning_output: true → classify

if is_domain_knowledge(learning_output):
    # 可被 ≥2 个不同 req/workflow 复用的知识
    if frequency_in_lessons >= 3:
        action: create/update domain-skill/{domain}/SKILL.md
        category: DURABLE
    else:
        action: append to LESSONS.md (as NEW/UPDATE)
        category: TEMPORARY → may become durable later
        
elif is_session_tracking(learning_output):
    # 仅反映当前 req-id 的状态变更
    action: update STATE.md [req-id]
    category: SESSION_STATE
    
else:
    # session-specific observation, not reusable
    action: append to TEMPORARY.md (with expiry marker)
    category: TEMPORARY
```

#### TEMPORARY.md Format

```markdown
# Temporary Session Notes

> ⚠️ 本文件在 Phase 8 Archive 时清理。跨会话无效。

## [req-abc123] — 2026-05-17 15:30
- Observations that may inform next similar task but are not domain-wide patterns
- E.g., "this project's API uses camelCase for all fields, NOT snake_case"
- Expires: Phase 8 Archive

## [req-def456] — 2026-05-17 16:00
- ...
```

### Step 1: Wave 日志扫描 → Lesson提取

**⚠️ 强制规则**: 扫描本Wave所有task的execution log，按以下决策树分类：

```yaml
learning_scan:
  task_result: success | failure | partial_success
  
  # Success 分支
  if success:
    extract_patterns: [
      "使用了哪个最佳实践? (e.g., retry pattern, memoization)",
      "避免了哪种常见坑? (e.g., race condition, N+1 query)",
      "有什么可复用的组件/模式? (e.g., auth interceptor)"
    ]
  
  # Failure 分支  
  if failure:
    root_cause_analysis: [
      "技术根因是什么? (code bug / config error / env issue)",
      "修复方案是什么? (具体代码变更 + 验证方法)",
      "下次如何预防? (linter rule / pre-commit hook / code review checklist)"
    ]
  
  # Partial Success 分支
  if partial_success:
    document_gap: [
      "什么场景下部分失败?",
      "需要补充什么测试/验证来覆盖? (e.g., edge case test)",
      "对下游的影响范围是什么? (which other modules might break)"
    ]
```

### Step 2: LESSONS.md 写入协议

**⚠️ 强制规则**: 新lesson必须去重，已有lesson必须更新。

#### Lesson 模板

```markdown
# Lessons Learned — [req-id]

## [NEW] {short-name} (Wave {N} · {timestamp})
**场景**: {一句话描述触发场景}
**失败根因**: {技术根因，非表面症状}
**解决方案**: {具体修复代码或步骤}
**预防策略**: {如何避免下次再犯}
**复用性**: ⭐⭐ (1-5星) — 影响范围说明

---

## [UPDATE] {short-name} (Wave {N}, updated from Wave {M})
**原记录**: {原始lesson摘要}
**本次观察**: {新增证据或发现}
**改进建议**: {更新的解决方案}
```

#### Deduplication 协议

```typescript
// Pseudo-code: lesson deduplication logic
function deduplicate(newLesson, existingLessons) {
  for (const existing of existingLessons) {
    if (isSameRootCause(newLesson, existing)) {
      return existing.updateWith(newLesson); // UPDATE mode
    }
  }
  return newLesson.createIn(LESSONS.md); // NEW mode
}

function isSameRootCause(a, b) {
  return hashRootCause(a) === hashRootCause(b);
  // rootCause = normalized error message + affected module + trigger condition
}
```

### Step 3: Domain Skills Promotion

**⚠️ 强制规则**: 同一领域出现≥3次相似模式 → 创建/更新 domain-skill。

#### Domain Skill 模板

```markdown
# Domain Skills — {domain-name}

---

## {skill-name}
- **触发条件**: `{regex or keyword pattern}`
- **适用场景**: {一句话说明何时使用}
- **执行步骤**: 
  1. {step 1}
  2. {step 2}
- **注意事项**: {常见陷阱或边界条件}
- **首次出现**: Wave {N}
- **累计复用**: {N}次 (across {M} waves)
```

#### Promotion Decision Tree

```yaml
promotion_rules:
  # Auto-create domain skill
  if pattern_frequency >= 3 AND wave_count >= 2:
    action: create domain-skill/{domain}.md
  
  # Update existing domain skill  
  if new_observation in existing_skill.scenarios:
    action: update with new evidence
  
  # Deprecate (rare)
  if old_skill.success_rate < 50% across latest_5_waves:
    action: mark deprecated with reason
```

### Step 4: 跨波经验注入 (Cross-Wave Injection)

**⚠️ 强制规则**: Wave N+1启动时，自动加载匹配当前task上下文的domain-skills。

#### 注入流程

```
Wave N+1 Execution Agent 初始化
    │
    ├─→ 读取 domain-skills/ 所有 skill metadata
    │   (只读 .yaml frontmatter, 不读完整文件)
    │
    ├─→ 匹配当前 task 关键词 → trigger_patterns
    │   (最多匹配 ≤5 skills, max ~200K tokens)
    │
    ├─→ 构建 Execution Agent context:
    │   - Wave N+1 任务列表 + 依赖图
    │   - Wave N SUMMARY (前置Wave结果)
    │   - 匹配到的 domain-skill 完整内容
    │   - LearningFlow nomination 摘要
    │
    └─→ 输出: "LearningFlow注入: {skill-name} → {reason}"
```

#### Injection Output 示例

```markdown
🧠 LearningFlow Injected (Wave 3):
- auth.md/JWT-Single-Flight-Refresh → trigger matched: "auth-service task"
- file-upload.md/Multi-File-Order-Preservation → trigger matched: "bulk-upload task"
  
(2 skills loaded, ~4.2K tokens injected)
```

## LearningWorkflow 与 Phase 8 的关系

| 特性 | Phase 4 (每Wave后) | Phase 8 (工作流结束) |
|------|-------------------|---------------------|
| **触发时机** | 每个Wave完成后立即 | Phase 7 Canary发布后 |
| **LESSONS提取粒度** | 细粒度 (task级别) | 粗粒度 (phase级别) |
| **Domain Skills Promotion** | ✅ 自动(≥3次触发) | ✅ 补充审查 + 去重 |
| **跨波注入** | ✅ Wave N+1立即生效 | ❌ (工作流已结束) |
| **主要目的** | 运行时快速反馈 | 最终归档持久化 |

**分工**: Phase 4 LearningWorkflow = "实时经验积累"，Phase 8 Archive = "最终知识固化"。两者互补，不重复。

## 降级策略

| 场景 | 降级方案 |
|------|---------|
| Wave日志不存在 | 跳过LearningFlow，输出"[LearningFlow skipped: no execution logs]" |
| LESSONS.md已满(>100条) | Deprecate旧条目(<30天无复用标记的)，保持≤100条 |
| domain-skills/写权限不足 | 写入临时缓存，Phase 8统一归档 |
| Execution Agent context满 | 只注入domain-skill metadata(1K)，完整内容按需读取 |
