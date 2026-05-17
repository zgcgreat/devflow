# Phase 3: 任务拆分 (DAG + 拓扑排序)

> **Layer**: L1-INTERACTION (SuperCorp 交互层) → Layer 3 架构层介入
> **前置产物**: `02-design.md` 或 `02a-ui-design.md` (Phase 2/2a 通过 G3)
> **后置产物**: `.ultimate-workflow/<req-id>/03-tasks.md`
> **门控**: G4 — Task Plan Quality Gate

## Skill元信息

```yaml
name: phase-3-task-plan
version: 3.0-draft
layer: L1-INTERACTION (DAG), L3-ARCHITECTURE (执行)
source: SuperCorp Phase 3 + Mega-Workflow DAG Router
dependencies:
  - writing-plans
v3_upgrade:
  dag_router: true (Kahn topological sort)
  agent_isolation: Research ~200K / Execution ~200K per Agent
```

## 输入

- `02-design.md` — 技术方案设计文档
- `02a-ui-design.md` — UI设计方案（如有）
- `.ultimate-workflow/CONTEXT.md` — 项目上下文
- LESSONS.md — 过往任务拆分经验

## 输出

- `03-tasks.md` — 任务拆分文档，包含：
  - 依赖关系图 (DAG)
  - 任务列表（含 Task-ID, Write Files, Read Files, Verify）
  - Wave 分组建议（并行无依赖任务分配到同 Wave）
  - verify 命令和 done 判定标准

## 执行流程

### Step 1: 设计文档解析

从 `02-design.md` 提取：
- 所有 API/接口定义 → 转化为 Task
- 数据模型变更 → 转化为 Migration Task
- UI 组件 → 转化为 Frontend Tasks
- 既有文件修改 → 标注 Read Files

### Step 2: DAG 构建与拓扑排序

1. **识别依赖**：Task B 是否依赖 Task A 的输出？
2. **Kahn 算法排序**：找出无前置依赖的任务作为 Wave N 的并行种子
3. **Wave 分组**：同一 Wave 内的任务互不依赖，可并行执行

```
DAG 示例:
T01 (DB Schema) ──→ T03 (API Endpoint) ──→ T05 (Frontend Component)
                              │
T02 (Migration) ─────────────┘              ──→ T06 (Test Suite)

Wave N1: [T01, T02]  ← 并行执行
Wave N2: [T03]       ← T01+T02 完成后执行
Wave N3: [T05, T06]  ← T03 完成后并行执行
```

### Step 3: 编写任务拆分文档

按模板 `templates/03-tasks.md` 输出每个 Task：

```markdown
### Task ID: T<NN>
**描述**: <一句话说明做什么>
**前置**: [T<MM>] (如无条件为空)
**Read Files**: [<path1>, <path2>]
**Write Files**: [<path1>, <path2>]
**Verify**: `<command>`
**Done 判定**: <具体的验收标准>
```

### Step 4: G4 门控检查

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| 依赖完整性 | 每个 Task 的前置关系明确 | 补画 DAG |
| Verify 命令 | 每个 Task 有可执行的 verify 命令 | 重写 verify |
| Done 判定 | 客观可验证，非"看起来对了" | 补充具体标准 |
| Wave 分组 | 并行任务无交叉依赖 | 重新分组 |
| 原子性 | 单 Task < 10 文件, < 500 行改动 | 拆分大 Task |

### Step 5: 停等用户确认

输出完成声明，等待用户回复 Y 继续。

---

## Error Taxonomy (Phase 3 Task Plan 专属)

| Level | Name | Symptom | Recovery Action | Wave Impact |
|-------|------|---------|-----------------|-------------|
| P0 | UNRESOLVED_DEP | Task B depends_on Task A, but Task A not in task list | Add missing task or remove dangling dependency | Blocks Phase 4 BUILD |
| P1 | CYCLE_DETECTED | Kahn algorithm finds no zero-in-degree tasks → DAG cycle | Log cycle tasks → return to Phase 2 for re-split | Blocks all downstream waves |
| P2 | NON_ATOMIC_TASK | Single task >10 files or >500 line change | Split into sub-tasks with shared resource annotation | No cross-wave impact |
| P3 | WARN_VERIFY_ABSENT | Task missing verify command or done criterion | Auto-generate reasonable default, flag for review | Continue normally |

## Boundary Conditions (Phase 3 Task Plan)

### Thresholds
- **Atomic Task Limit**: ≤10 files, ≤500 line changes per task (G4 FAIL if exceeded)
- **DAG Depth Check**: Max depth ≤ task count / 2 (flatten if deeper)
- **Wave Parallelism Ratio**: Independent tasks in same wave should be ≥60% of total (warn if <60%)

### Timeout
- Task splitting phase: ≤10 min (parse design → build DAG → output task list)
- If exceeded: output initial wave plan, defer complex dependencies to Phase 4 refinement

### Input Schema Validation
- [ ] `02-design.md` exists and has G3 passed
- [ ] All AC from Phase 1 are addressed in design
- [ ] Design doc contains explicit module boundary annotations
- [ ] API definitions cover all user story verification paths
- [ ] Data model ER diagram present for database changes

## Provider 路由

- Phase 3 → **高分析能力模型**（需要 DAG 分析和依赖判断）

---

> **关联规则**: R8 (Wave并行), R16 (原子提交)
> **参考文件**: `references/RULES-v3.md` R1-R20, `references/prompts/3-task.md`, `layers/L2-ENGINE/wave-executor/SKILL.md`
