# Delta Specs — 差量规范协议

> **Layer**: L1-INTERACTION (Phase 2-3) + L3-ARCHITECTURE (Merge Engine)  
> **目的**: Brownfield 开发时多人并行修改同一 spec 不冲突，只描述变更而非重写完整文档  
> **来源**: OpenSpec Delta Specs → devflow-evo v3.0 adaptation

---

## 核心原则

**增量优于全量。** 对于已有项目的迭代（Brownfield），delta spec 只描述「发生了什么变化」，不重写完整文档。

---

## 变更标记格式

每个 delta spec 必须使用以下四类 markers 之一：

### `[ADDED]` — 新增条目

用于向主 spec 添加**原来不存在**的段落/需求/章节。

```markdown
# Delta Spec: add-auth-interceptor (req-abc123)

## [ADDED] Requirements

### Requirement: Auth Interceptor
所有 API 调用必须经过 auth interceptor，统一管理 JWT token 刷新和 retry。

#### Scenario: Token 过期自动刷新
- **WHEN** API 返回 401 且本地 token 已过期
- **THEN** interceptor 发起 single-flight token refresh
- **AND** 等待新 token 拿到后重试原请求

### Requirement: Domain Skill — auth-interceptor
首次出现在 req-abc123，累计复用 ≥ 3 次后持久化到 `memory/domain-skills/auth-interceptor.md`。
```

### `[MODIFIED]` — 修改现有条目

用于**更新**主 spec 中已存在的内容。**必须保留上下文 + diff 块**。

```markdown
## [MODIFIED] Requirements

### Requirement: Logging Level (原 v1 → v2)

**当前内容**:
```yaml
logging:
  level: INFO
  format: json
```

**改为**:
```yaml
logging:
  level: DEBUG  # ← changed from INFO
  format: json
  include_request_body: true  # ← added
```

**变更理由**: Phase 5 测试发现 debug context 缺失导致排查困难。

**冲突检测**: AI 在 merge 时必须验证「原文档中是否存在完全匹配的当前内容块」，未找到则标记 MERGE_CONFLICT。
```

### `[REMOVED]` — 删除条目

用于**移除**主 spec 中的旧内容。**必须附带保留理由**。

```markdown
## [REMOVED] Requirements

### Requirement: Legacy Config File (removed in req-abc123)

**原内容**:
> 使用 `.env.development` 和 `.env.production` 分离配置。

**删除理由**: Phase 6 安全审查发现 `.env.development` 被误提交到 git，改用 project-level config.json。

**回滚路径**: `git checkout HEAD~1 -- .env.*`
```

### `[RENAMED]` — 重命名条目

用于**变更**条目名称但不改变语义。

```markdown
## [RENAMED] Requirements

从 `Logging Configuration` → `Structured Logging` (req-abc123)
**理由**: 与项目 logging 规范统一命名。
```

---

## Brownfield 并行策略

### 目录结构

```
changes/
├── <feature-name>/
│   ├── proposal.md          # 变更提案（问题+方案+影响）
│   └── delta-spec.md        # 差量规范（ADDED/MODIFIED/REMOVED）
└── ...
```

### 并行工作流

```
Feature A developer:
  changes/add-upload-feature/delta-spec.md
  → [ADDED] File Upload Component
  → [MODIFIED] API Client (added upload endpoint)

Feature B developer:
  changes/refactor-api-client/delta-spec.md  
  → [MODIFIED] API Client (retry logic)

Merge (AI or human):
  ├── read main spec (02-design.md)
  ├── apply Delta A: ADDED OK, MODIFIED retry logic
  ├── apply Delta B: MODIFIED upload endpoint
  └── conflict check: same section modified by both? 
      → YES → MERGE_CONFLICT → prompt user
      → NO → auto-merge SUCCESS
```

### Conflict Detection Rules

| 场景 | 冲突类型 | 处理方式 |
|------|---------|---------|
| 不同条目被修改 | OK | Auto-merge |
| 同一条目被不同 feature MODIFIED | CONFLICT | Prompt user → merge manually |
| ADDED + REMOVED 同一条目 | CONFLICT | Prompt user → resolve priority |
| ADDED + ADDED 相同标题 | WARNING | Auto-merge (treat as same intent) |

---

## Delta Spec → Main Spec Merge Protocol

### Step 1: Read Base

读取主 spec（如 `02-design.md` 或项目级 `openspec/specs/<spec>.md`）。

### Step 2: Apply Markers

按顺序应用每个 marker：

```typescript
// Pseudo-code
function applyDelta(baseSpec, deltaSpec) {
  for (const marker of deltaSpec.markers) {
    switch (marker.type) {
      case 'ADDED':
        appendToSection(baseSpec, marker.content);
        break;
      case 'MODIFIED':
        replaceInSection(baseSpec, marker.oldBlock, marker.newBlock);
        verifyBaseContains(baseSpec, marker.oldBlock); // conflict check
        break;
      case 'REMOVED':
        removeFromSection(baseSpec, marker.oldBlock, { reason: marker.reason });
        break;
      case 'RENAMED':
        renameInSection(baseSpec, marker.from, marker.to);
        break;
    }
  }
  return baseSpec;
}
```

### Step 3: Verify Integrity

**⚠️ 强制规则**: merge 后必须验证：
1. 所有 `[MODIFIED]` 条目在原文档中能找到对应内容块 → 否则 MERGE_CONFLICT
2. 行数变化 ≤ ±50%（异常膨胀说明 delta 包含过多上下文）
3. 所有 `[ADDED]` 条目无重复标题

---

## Delta Spec vs Full Spec 决策矩阵

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 首次创建 spec (Greenfield) | **Full Spec** | 从零开始，无冲突风险 |
| 单人修改已有项目 (Brownfield) | **Delta Spec** | 增量变更，便于追溯 |
| 多人并行修改同一 spec | **Delta Spec（必须）** | 避免 git conflict |
| 大规模重构 (>50% 内容变动) | **Full Spec** | Delta 碎片化，不易阅读 |
| Emergency hotfix (限时) | **Delta Spec** | 快速变更，事后补全量文档 |

---

## Phase Integration

### Phase 2 (Design) — Greenfield

首次创建 `02-design.md` → **Full Spec**。同时创建 baseline delta spec：

```markdown
# Delta Spec: initial-baseline

## [ADDED] All Sections (from scratch)
- Architecture Overview
- API Client Configuration  
...
标记为 `baseline_version: 1.0`。
```

### Phase 3 (Task Splitting) — Brownfield

用户说「修改 API client 的 retry 逻辑」：
1. AI 创建 `changes/retry-logic/delta-spec.md`
2. Delta Spec 中 `[MODIFIED] API Client Configuration`
3. Task split 时引用 delta spec，不引用完整设计文档（省 token）

### Phase 6 (Review) — Verify Mergeability

Acceptance Auditor 检查：
1. 所有修改是否生成了对应的 delta spec？
2. Delta Spec merge 后主 spec 完整性是否 OK？
3. 是否有未 resolve 的 MERGE_CONFLICT？

---

## 向后兼容

| v1.0 产物 | Delta Spec 处理 |
|-----------|----------------|
| `02-design.md` (完整设计文档) | 创建 baseline delta spec |
| `00-requirements.md` (需求文档) | Brownfield 项目 → delta spec; Greenfield → full spec |
| `03-tasks.md` (任务计划) | 每次修改用 delta spec 描述增量 |

---

## Token Savings Estimate

| 操作 | Full Spec | Delta Spec | Savings |
|------|-----------|-----------|---------|
| 修改单一配置项 | ~15K tokens (读全文档) | ~2K tokens (只读 diff) | **~87%** |
| 多人并行 merge (无冲突) | ~30K tokens (3 × 全文档) | ~6K tokens (3 × delta) | **~80%** |
| 小规模重构 (<10% 变动) | ~50K tokens | ~8K tokens | **~84%** |

> ⚠️ Delta Spec 在 Brownfield 开发中是**必备能力**，在 Greenfield 首次创建时收益有限。
