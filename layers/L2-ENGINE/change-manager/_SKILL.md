---
name: change-manager
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: []
provides: [applied-change, verification-result]
description: OpenSpec-inspired change lifecycle manager implementing proposal → apply → verify → archive workflow with dynamic Delta Specs merging
source: OpenSpec proposal→apply→archive lifecycle + ArtifactGraph + Delta Specs
dependencies:
  - dag-router
triggers:
  - change proposal
  - change apply
  - change verify
  - change archive
  - delta specs merge
external-inputs: [change-proposal]
---

# Change Manager — 变更生命周期管理器

## 核心原则（来自 OpenSpec）

1. **Fluid not rigid** — 依赖是"使能器"而非"门控"，可随时回退更新任何制品
2. **Iterative not waterfall** — 边构建边学习，随时优化
3. **Built for brownfield** — 专为已有代码库的变更设计，Delta Specs 是一等公民
4. **Actions Not Phases** — 不是阶段锁定，而是可组合的动作

## 生命周期

```
proposal → [specs] → [design] → [tasks] → apply → verify → archive
    │                                              │
    └── 可随时更新任何制品 ←─────────────────────────┘
```

### 快速路径 (核心 profile)
```
/df:propose → /df:apply → /df:sync → /df:archive
```

### 展开路径 (完整 profile)
```
/df:new → /df:continue → /df:ff → /df:apply → /df:verify → /df:archive
```

## 变更文件夹结构

```
.devflow-evo/
└── changes/
    ├── add-dark-mode/          # 活跃变更
    │   ├── proposal.md         # Why & What
    │   ├── design.md           # How (技术方案)
    │   ├── tasks.md            # 实现清单 (复选框)
    │   ├── .devflow-evo-change.yaml # 变更元数据
    │   └── specs/              # Delta specs
    │       └── ui/
    │           └── spec.md     # ADDED/MODIFIED/REMOVED
    └── archive/                # 已归档变更
        └── 2026-05-19-add-dark-mode/
```

## 变更元数据 (.devflow-evo-change.yaml)

```yaml
name: add-dark-mode
schema: spec-driven  # 对应 ArtifactGraph Schema
created: 2026-05-19
goal: Add dark mode support with system preference detection
affected_areas: [ui, theming, accessibility]
status: proposal  # proposal | design | tasks | applying | verifying | archived
artifacts:
  proposal: { completed: true, updated: 2026-05-19 }
  specs: { completed: false }
  design: { completed: false }
  tasks: { completed: false }
```

## ArtifactGraph 引擎

制品依赖形成 DAG：

```
        proposal (root)
       /          \
    specs        design
       \          /
        tasks
          |
      APPLY PHASE
```

### 状态转换

```
BLOCKED ──────→ READY ──────→ DONE
  │                │               │
Missing deps   All deps done   File exists
```

### 操作

| 操作 | 说明 | 条件 |
|------|------|------|
| `getNextArtifacts(completed)` | 返回所有依赖已完成的就绪制品 | 至少一个制品 READY |
| `getBlocked(completed)` | 返回被阻塞的制品及未满足依赖 | 有制品 BLOCKED |
| `isComplete(completed)` | 检查所有制品是否完成 | 全部制品 DONE |
| `detectCompleted(changeDir)` | 通过文件存在性检测完成状态 | 变更目录存在 |

## Delta Specs 动态合并

### 格式

Delta Specs 使用 ADDED/MODIFIED/REMOVED 标记描述变更：

```markdown
## ADDED Requirements
- Dark mode toggle in settings panel
- CSS custom properties for theme colors
- System preference detection via `prefers-color-scheme`

## MODIFIED Requirements
- **Header component**: Add theme toggle button
- **CSS variables**: Replace hardcoded colors with custom properties

## REMOVED Requirements
- Light-mode-only assumption in theme constants
```

### 合并引擎

```
merge(mainSpec, deltaSpec) → updatedMainSpec

规则:
1. ADDED → 追加到主 spec 末尾
2. MODIFIED → 定位已有需求（按名称匹配），替换内容
3. REMOVED → 定位已有需求，移除整条
4. 冲突 → 标记为 CONFLICT，需人工解决
```

### 合并时机

| 触发 | 动作 |
|------|------|
| `/df:apply` 前 | 合并所有 Delta Specs 到主 spec |
| `/df:verify` 后 | 确认合并结果与实现一致 |
| `/df:archive` 时 | 最终合并 + 移入 archive/ |

## Verify 三维验证

`/df:verify` 在归档前检查三个维度：

| 维度 | 验证内容 | 检查方法 |
|------|---------|---------|
| **Completeness** | 所有 tasks 完成、所有需求有代码对应、场景覆盖 | tasks.md 复选框 + 代码搜索 |
| **Correctness** | 实现匹配规格意图、边界情况处理 | 测试结果 + 代码审查 |
| **Coherence** | 设计决策反映在代码中、模式一致 | 架构规则检查 + Lint |

### 验证结果格式

```yaml
verification:
  change: add-dark-mode
  timestamp: 2026-05-19T14:30:00
  completeness:
    status: passed  # passed | failed | warning
    tasks_total: 8
    tasks_completed: 8
    requirements_covered: 5/5
  correctness:
    status: passed
    tests_passed: 12
    tests_failed: 0
    edge_cases_covered: true
  coherence:
    status: warning
    issues:
      - "Theme toggle not accessible (missing aria-label)"
  overall: passed_with_warnings
```

## 与 devflow-evo Phase 流程的关系

Change Manager 不是替代 Phase 流程，而是增强 Phase 6 Review 和 Phase 7 Canary：

- **Phase 6 Review** 后，自动触发 `/df:verify`（三维验证）
- **Phase 7 Canary** 期间，变更处于 `verifying` 状态
- **Phase 8 Archive** 时，调用 `/df:archive` 完成最终合并和归档

## 模板文件

变更制品使用以下模板（位于 `templates/changes/`）：

| 模板 | 说明 | 对应制品 |
|------|------|---------|
| `proposal.md` | 变更提案模板 | Why & What |
| `design.md` | 技术方案模板 | How |
| `tasks.md` | 实现清单模板（复选框） | Task breakdown |
| `delta-spec.md` | Delta Spec 模板 | ADDED/MODIFIED/REMOVED |
| `change-schema.yaml` | 变更元数据 Schema | `.devflow-evo-change.yaml` |

## 自定义 Schema

支持 OpenSpec 风格的自定义工作流 Schema：

```yaml
# .devflow-evo/schemas/my-workflow/schema.yaml
name: my-workflow
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    requires: []
  - id: specs
    generates: specs/**/*.md
    requires: [proposal]
  - id: design
    generates: design.md
    requires: [proposal]
  - id: tasks
    generates: tasks.md
    requires: [specs, design]
apply:
  requires: [tasks]
  tracks: tasks.md
```

Schema 操作：
- `schema init <name>` — 从零创建
- `schema fork spec-driven <name>` — 从默认 Schema fork
- `schema validate <name>` — 验证 Schema 合法性

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
