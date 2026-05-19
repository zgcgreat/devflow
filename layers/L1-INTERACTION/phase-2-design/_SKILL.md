---
name: phase-2-design
preamble-tier: 2
version: 3.0-draft
layer: L1-INTERACTION (交互层)
source: 交互层 Phase 2 + 架构层 DAG Routing
dependencies:
  - writing-plans
token_budget: ~100K tokens (Phase 2 design context)
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
---

# Phase 2: 方案设计

> **Layer**: L1-INTERACTION (交互层)
> **前置产物**: `01-analysis.md` (Phase 1 通过 G2)
> **后置产物**: `.devflow/<req-id>/02-design.md`
> **门控**: G2-PHASE2 — Design Quality Gate

## Skill元信息

```yaml
name: phase-2-design
version: 3.0-draft
layer: L1-INTERACTION
source: 交互层 Phase 2 + 架构层 DAG Routing
dependencies:
  - writing-plans
v3_upgrade:
  provider_routing: true (Phase 2→Creative/Architect-Model)
  agent_isolation: Research Agent ~200K fresh context
```

## 输入

- `01-analysis.md` — 需求分析 + AC
- `.devflow/CONTEXT.md` — 项目上下文
- LESSONS.md — 过往架构决策经验

## 输出

- `02-design.md` — 技术方案设计文档，包含：
  - 技术栈选型及理由
  - 系统架构图（ASCII/mermaid）
  - 关键 API 定义
  - 数据模型设计
  - 既有架构对齐分析（brownfield）
  - 设计决策记录（ADR-NNN）

## 执行流程

### Step 0.5: 宪法检查 (Constitution Gate · Sprint 11 修复)

> 来源: 问题 5 修复 — 确保 Phase 2 设计决策符合项目宪法约束。

**读取** `.devflow/memory/constitution.md`

**不存在时** → 使用默认模板创建新项目宪法：
1. 读取 `references/templates/constitution-template.md`
2. 基于 Phase 0/1 的输出填充宪法内容
3. 展示给用户确认
4. 用户确认后写入 `.devflow/memory/constitution.md`

**已存在时** → 读取现有宪法，Phase 2 所有设计决策必须符合宪法约束。

**宪法合规检查清单**（Phase 2 设计前逐项确认）：
- [ ] 技术栈符合宪法原则
- [ ] 代码风格与宪法约定一致
- [ ] 目录结构遵循宪法约定
- [ ] 架构边界不违反宪法约束
- [ ] 无禁止事项

### Step 1: 加载上下文

读取 `01-analysis.md`，提取：
- 所有 AC 的验证需求
- Out of Scope 边界
- 术语表中的技术约束

### Step 2: 架构方案设计

输出至少 2 个可选方案（简单任务可只输 1 个）：
- **方案 A**（推荐）：平衡性能/开发速度/可维护性
- **方案 B**（备选）：更高复杂度但更优雅的设计

每个方案评估：
- 开发时间估算
- 技术风险
- 与既有系统的兼容度

### Step 3: 编写设计文档

按模板 `templates/02-design.md` 输出：
- 架构图必须清晰标注模块边界
- API 定义包含请求/响应示例
- 数据模型覆盖核心实体和关系
- Brownfield 项目必须有"既有架构对齐分析"章节
- 每个设计决策记录为 ADR-NNN（Architecture Decision Record）

### Step 4: G2-PHASE2 门控检查

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| 架构图清晰度 | 模块边界和依赖关系明确 | 重绘架构图 |
| API 完整性 | 每个 AC 对应至少一个 API | 补充 API 定义 |
| 数据模型覆盖 | 核心实体全部覆盖 | 追加 ER 图 |
| ADR 记录 | ≥ 3 个关键设计决策已记录 | 补充决策记录 |
| Brownfield 兼容 | 标注所有修改/新增文件 | 更新影响范围分析 |

### Step 5: 决策流判断

- **简单任务**（≤3 文件，<50 行）→ 直接输出 `02-design.md`，跳过 Phase 2a
- **常规任务** → 进入 Phase 2a（设计枪战），Phase 2 产出作为基准变体
- **复杂任务** → Phase 2 与 Phase 2a 并行执行

### Step 6: 停等用户确认

输出完成声明，等待用户回复 Y 继续。

---

### 可执行命令示例

```bash
# Create design directory and initial spec
mkdir -p .devflow/<req-id>

# Validate design document exists and has required sections
grep -c "## ADR" .devflow/<req-id>/02-design.md

# Check all AC are mapped to API definitions
while read ac; do grep -q "$ac" .devflow/<req-id>/02-design.md && echo "$ac: covered" || echo "$ac: MISSING"; done < ac-list.txt

# Verify ADR count meets minimum (≥3)
adr_count=$(grep -c "^ADR-" .devflow/<req-id>/02-design.md || true); test "$adr_count" -ge 3 && echo "G2-ADR PASS" || echo "G2-ADR FAIL: need $((3 - adr_count)) more ADRs"
```

### G2 Automated Structural Checks (Sprint 9 Addition)

**G2-PHASE2 自动化检查清单** — 以下为 grep-able structural checks，用于验证设计文档质量：

| Check | Command | Threshold | Gate Result |
|-------|---------|-----------|-------------|
| Module Boundaries | `grep -c "^## Module\|^## Architecture" 02-design.md` | ≥3 module sections | PASS/FAIL |
| API Definitions | `grep -c "^### API\|^#### Endpoint" 02-design.md` | ≥1 API per AC | PASS/FAIL |
| Data Models | `grep -c "^### Data Model\|^#### Entity\|^ER Diagram" 02-design.md` | ≥2 data model sections | PASS/FAIL |
| ADR Records | `grep -c "^ADR-" 02-design.md` | ≥3 ADRs | PASS/FAIL |
| Brownfield Markers | `grep -c "\[BROWNFIELD\]\|既有\|migration" 02-design.md` | ≥1 if brownfield | PASS/FAIL |

**Automated Gate Script**:
```bash
#!/bin/bash
# G2-PHASE2 automated structural check (Sprint 9 addition)
# Usage: ./g2-structural-check.sh .devflow/<req-id>/02-design.md

DESIGN_DOC=$1
PASS_COUNT=0
FAIL_COUNT=0

check() {
  local name=$1
  local cmd=$2
  local threshold=$3
  
  result=$(eval "$cmd" || true)
  if [ "$result" -ge "$threshold" ] 2>/dev/null; then
    echo "✅ $name: $result (≥$threshold) PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "❌ $name: $result (<$threshold) FAIL"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

check "Module Boundaries" "grep -c '^## Module\|^## Architecture' $DESIGN_DOC" 3
check "API Definitions" "grep -c '^### API\|^#### Endpoint' $DESIGN_DOC" 1
check "Data Models" "grep -c '^### Data Model\|^#### Entity' $DESIGN_DOC" 2
check "ADR Records" "grep -c '^ADR-' $DESIGN_DOC" 3

echo "---"
echo "G2 Gate: $PASS_COUNT PASS, $FAIL_COUNT FAIL"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "Result: FAIL — Fix failed checks before Phase 2a/Phase 3"
  exit 1
else
  echo "Result: PASS — Proceed to Phase 2a/Phase 3"
  exit 0
fi
```

**Rationale**: These grep-able structural checks ensure design documents meet minimum quality thresholds before proceeding to implementation. Module boundaries prevent tangled architectures, API definitions ensure AC coverage, data models guarantee schema completeness, and ADRs document critical decisions.

---

## Error Taxonomy (Phase 2 Design 专属)

| Level | Name | Symptom | Recovery Action | Wave Impact |
|-------|------|---------|-----------------|-------------|
| P0 | BLOCKING | 设计文档无法闭环所有 AC（缺少核心 API/数据模型） | 回退 Step 1，补充需求澄清后重新执行 | Blocks Phase 2a/Phase 3 |
| P1 | RECOVERABLE | 方案 A/B 技术风险不均衡或 ADR 记录 < 3 | 补充缺失分析维度，重新输出设计文档 | No cross-wave impact |
| P2 | WARNING | Brownfield 兼容标注不完整但未阻塞 | 在 `02-design.md` 中追加 `[TODO: Verify Compatibility]` | Continue to Phase 2a |
| P3 | INFO | 简单任务（≤3文件）跳过 Phase 2a | 正常流程，记录为 skip | No impact |

## Boundary Conditions (Phase 2 Design)

### Thresholds
- **Simple Task Skip**: ≤3 文件且 <50 行改动 → 直接输出 `02-design.md`，跳过 Phase 2a
- **ADR Minimum**: ≥3 个关键设计决策必须记录（否则 G2-PHASE2 FAIL）
- **Architecture Clarity**: 模块边界和依赖关系必须在图中清晰标注（否则 G2-PHASE2 FAIL）

### Timeout
- Standard design phase: ≤15 min (read analysis → output design doc)
- If exceeded: reduce to single-scheme output, flag complex items for Phase 4 attention

### Input Schema Validation
- [ ] `01-analysis.md` exists and has G2 passed
- [ ] All user stories have ≥2 AC defined
- [ ] Out of Scope boundary is explicitly stated
- [ ] Terminology section covers technical constraints

## Provider 路由

- Phase 2 → **高创造力模型**（需要架构设计能力）

---

> **关联规则**: R1 (PRD驱动), R7 (Agent隔离), R14 (设计枪战前置)
> **参考文件**: `references/RULES-v3.md` R1-R20, `references/prompts/2-design.md`
