---
name: phase-3-task-plan
preamble-tier: 2
version: 3.0-draft
layer: L1-INTERACTION (DAG), L3-ARCHITECTURE (执行)
source: SuperCorp Phase 3 + Mega-Workflow DAG Router
dependencies:
  - writing-plans
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
---

# Phase 3: 任务拆分 (DAG + 拓扑排序)

## 输入

- `02-design.md` — 技术方案设计文档
- `02a-ui-design.md` — UI设计方案（如有）
- `.devflow/CONTEXT.md` — 项目上下文
- LESSONS.md — 过往任务拆分经验

## 输出

- `03-tasks.md` — 任务拆分文档，包含：
  - 依赖关系图 (DAG)
  - 任务列表（含 Task-ID, Write Files, Read Files, Verify）
  - Wave 分组建议（并行无依赖任务分配到同 Wave）
  - verify 命令和 done 判定标准

## 执行流程

### Step 1: ADR 与设计文档联合解析

**1.1 读取 Phase 2 产物**:
- `02-design.md` — 技术方案设计文档(必需)
- `02a-ui-design.md` — UI设计方案(如有)
- **ADR (架构决策记录)** — 如果存在 `.devflow/adr/*.md` 或 `layers/L3-ARCHITECTURE/schema-definitions/DECISIONS.md`,必须解析

**1.2 ADR 解析步骤**:
```markdown
## Phase 3: ADR → Task Mapping

从 ADR 中提取架构决策,转化为带约束的 Task:

| ADR ID | 决策内容 | Task 影响 | 约束类型 |
|--------|---------|-----------|----------|
| ADR-001 | 选用 SQLite 而非 PostgreSQL | T01-T05: 使用 sqlx (Rust) | Hard constraint |
| ADR-002 | UI 框架选定 React + Ant Design | T20-T30: import antd | Soft constraint |
```

**修复 (2024-05-17)**: Phase 3 必须在 Step 1 中显式解析 Phase 2/Phase 3 生成的 ADR,确保架构决策被 Task Plan 吸收。
**未解析 ADR 风险**: 实现偏离架构决策(如选了错误数据库 ORM),导致后续重构。

**1.3 从设计文档提取**:
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
### Task ID: {kebab-case-id}
**优先级**: {P0/P1/P2} (默认 P1, wave 1 中并行度最高的任务 → P0)
**类型**: {dev/test/config/docs/refactor}
**描述**: <一句话说明做什么>
**前置**: [{dep-task-id}] (如无条件为空)
**Read Files**: [<path1>, <path2>]
**Write Files**: [<path1>, <path2>]
**Verify**: `<command>`
**Done 判定**: <具体的验收标准>
```

**优先级分配规则 (2026-05-18 Sprint 9 新增)**:
- Wave 1 中并行度最高的核心任务 → P0
- 其他功能任务 → P1
- 辅助性任务（文档、配置、基础设施） → P2

**格式消费契约**: Phase 3 输出 `03-tasks.md` 为 Markdown 格式，Wave Executor 直接消费（不需要 YAML 中间格式）。Wave Executor Step 0 内置 markdown → internal task array 解析器。

**Task ID convention**: Use descriptive kebab-case IDs that reflect the task's domain/module (e.g., `user-auth-model`, `payment-webhook-handler`). This aligns with dag-router and executor expectations which use kebab-case identifiers. The legacy `T<NN>` format (e.g., `T01`) is still accepted for backward compatibility but kebab-case is canonical.

**Sprint 9 Audit (A-P2-1)**: All existing task ID examples in this file use `T01`, `T02` format. New task specifications SHOULD use kebab-case. Validation bash script provided in "可执行命令示例" section scans for non-conforming IDs. Phase 3 output `03-tasks.md` MUST have all Task IDs in kebab-case format (legacy `T<NN>` accepted only for backward compatibility with existing Wave Executor parsers).

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

### 可执行命令示例

```bash
# Validate DAG has no cycles using topological sort
python -c "
import re
with open('03-tasks.md') as f:
    content = f.read()
tasks = set(re.findall(r'Task ID: (T\d+)', content))
deps = re.findall(r'### Task.*?T(\d+).*?\*\*前置\*\*:.*?(T(?:,\s*)?T|\d+(?:,\s*)?\d+)*', content, re.DOTALL)
print(f'Found {len(tasks)} tasks in 03-tasks.md')
if not deps:
    print('No dependencies found — all tasks are independent (Wave N-1)')
"

# Verify each task has verify command and done criterion
python -c "
import re
with open('03-tasks.md') as f:
    content = f.read()
tasks = re.split(r'### Task ID:', content)[1:]
ok = 0; bad = 0
for t in tasks:
    has_verify = 'Verify' in t and 'Done 判定' in t
    if has_verify: ok += 1
    else: bad += 1; print(f'  MISSING verify/done: Task {t[:20]}...')
print(f'Tasks with valid verify+done: {ok}/{ok+bad}')
"

# Count tasks per wave for parallelism check
grep -E 'Wave N\d+' 03-tasks.md | while read line; do echo "$line"; done

# Validate Task ID format (kebab-case or T<NN> for backward compatibility)
python -c "
import re
with open('03-tasks.md') as f:
    content = f.read()
ids = re.findall(r'Task ID: ([\w-]+)', content)
kebab = [i for i in ids if re.match(r'^[a-z]+(-[a-z]+)+$', i)]
legacy = [i for i in ids if re.match(r'^T\d+$', i)]
other = [i for i in ids if not re.match(r'^[a-z]+(-[a-z]+)+$', i) and not re.match(r'^T\d+$', i)]
print(f'Total Task IDs: {len(ids)}')
print(f'  kebab-case (canonical): {len(kebab)}')
print(f'  T<NN> (legacy, backward compat): {len(legacy)}')
if other:
    print(f'  non-conforming: {other} — should be kebab-case')
if not kebab and not legacy:
    print('WARNING: No Task IDs found — verify 03-tasks.md format')
"
```

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
