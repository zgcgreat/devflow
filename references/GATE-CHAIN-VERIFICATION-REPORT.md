# Devflow Phase Gate 依赖链完整性验证报告

> 验证时间: 2026-05-20
> 验证范围: gate-rules.md vs 12 个 Phase _SKILL.md (layers/L1-INTERACTION/)

---

## 一、基础数据汇总

### gate-rules.md 定义的阶段链

```
0-confirm → 1-analysis → 2-design → [2a-ui-design] → 3-task → 4-dev → 5-test → 6-review → 7-integration
```

产物链:
```
00-requirements.md → 01-analysis.md → 02-design.md → [02a-ui-design.md]
→ 03-tasks.md → *-dev-log.md → 05-test-report.md → 06-code-review.md → 07-release-checklist.md
```

### 实际 Phase 文件清单 (12 个)

| Phase | frontmatter requires | frontmatter provides | frontmatter gate | 正文 requires | 正文 provides | 正文 gate |
|---|---|---|---|---|---|---|
| phase-0-strategy | — | — | — | 无 | SEED-*.md | G0 |
| phase-0-yc-strategy | [project-context] | [g1-gate-decision, strategy-document, follow-up-queue] | G1 | — | — | — |
| phase-1-5whys | [g1-gate-decision, strategy-document] | [user-stories, acceptance-criteria, glossary, scope-boundaries, g2-gate-decision] | G2 | — | — | — |
| phase-1b-discuss | — | — | — | 01-analysis.md (G2) | CONTEXT.md | G2.5 |
| phase-2-design | — | — | — | 01-analysis.md + CONTEXT.md | 02-design.md | G2-PHASE2 |
| phase-2a-shotgun | — | — | — | 02-design.md | 设计变体 | — |
| phase-3-task-plan | — | — | — | 02+02a+CONTEXT.md | 03-tasks.md | — |
| phase-4-build | — | — | — | 03-tasks.md (G4) | 代码变更 | G4-PHASE4 |
| phase-5-test | — | — | — | 03-tasks.md + P4完成 | 05-test-results.md | G5-PHASE5 |
| phase-6-review | — | — | — | P5测试通过+P4完成 | 06-review.md | G3-PHASE6 |
| phase-7-canary | [g3-gate, all-tests-passed] | [canary-report, rollback-report, g5-gate-decision] | G5 | — | — | — |
| phase-8-archive | — | — | — | G5通过+P7完成 | LESSONS.md等 | G8 |

---

## 二、A 类 — 依赖链断裂点 (requires 无法被前序 provides 满足)

### A1. phase-0-yc-strategy requires [project-context] — 无前序提供 [HIGH]

- **断裂**: `project-context` 无任何前序 Phase provides
- **原因**: phase-0-strategy 的 frontmatter provides 为空，正文产物为 `.planning/seeds/SEED-*.md`
- **修复建议**: 在 phase-0-strategy frontmatter 添加 `provides: [project-context]`，或将 `project-context` 标记为外部输入

### A2. phase-1b-discuss 依赖 01-analysis.md — 命名体系不匹配 [MEDIUM]

- **断裂**: phase-1-5whys provides `[user-stories, acceptance-criteria, glossary, scope-boundaries, g2-gate-decision]`，无 `01-analysis.md`
- **原因**: frontmatter 用语义名，正文用编号文件名，两套体系无映射
- **修复建议**: 统一命名，或在 phase-1-5whys provides 补充 `01-analysis-md`

### A3. phase-2-design 依赖 01-analysis.md + CONTEXT.md — 无 provides 声明 [MEDIUM]

- **断裂**: phase-1 的 provides 不含 `01-analysis.md`；`CONTEXT.md` 由 phase-1b 产出但未在 provides 链中
- **修复建议**: phase-1-5whys provides 补充产物；phase-1b-discuss frontmatter 补充 `provides: [context-md, g2.5-gate-decision]`

### A4. phase-3-task-plan 依赖 02+02a+CONTEXT — 无 provides 声明 [MEDIUM]

- **断裂**: phase-2-design 和 phase-2a-shotgun 的 frontmatter provides 均为空
- **修复建议**: phase-2-design 补充 `provides: [02-design-md, g2-phase2-gate-decision]`；phase-2a-shotgun 补充 `provides: [02a-ui-design-md]`

### A5. phase-7-canary requires [g3-gate] — 无法满足 [HIGH]

- **断裂**: phase-6-review 的 frontmatter provides 为空
- **原因**: phase-6 的 gate 编号为 `G3-PHASE6`，canary requires 的是 `g3-gate`，名称不匹配
- **修复建议**: phase-6-review frontmatter 补充 `provides: [g3-gate, review-report]`

### A6. phase-7-canary requires [all-tests-passed] — 无法满足 [HIGH]

- **断裂**: phase-5-test 的 frontmatter provides 为空，无 Phase provides `all-tests-passed`
- **修复建议**: phase-5-test frontmatter 补充 `provides: [all-tests-passed, test-report, g5-phase5-gate-decision]`

---

## 三、B 类 — 产物链断裂

### B1. 00-requirements.md 无人产出

- gate-rules 要求 Phase 1 前置 `00-requirements.md`
- phase-0-strategy 产出 `SEED-*.md`，phase-0-yc-strategy 产出 `strategy-document`
- 编号产物与语义产物之间无映射表
- **修复建议**: 建立映射 `SEED-*.md / strategy-document → 00-requirements.md`，或在 gate-rules 中使用语义名

### B2. 04-dev-log.md 无人产出

- gate-rules 要求 Phase 5 前置 `04-dev-log.md`
- phase-4-build 明确声明"Phase 4 自身不写 summary，仅编排和消费"
- **修复建议**: 确认 Wave Executor SUMMARY.md 是否等价于 04-dev-log.md；若是，更新 gate-rules 路径

### B3. 06-code-review.md vs 06-review.md — 命名不一致

- gate-rules: `06-code-review.md`，phase-6-review: `06-review.md`
- **修复建议**: 统一为 `06-review.md`（更准确反映双阶段审查内容）

### B4. 07-release-checklist.md 无人产出

- gate-rules 要求 Phase 7 产出 `07-release-checklist.md`
- phase-7-canary 产出 `canary-report` + `rollback-report`
- **修复建议**: 在 phase-7-canary 中补充 release checklist 产出，或更新 gate-rules

### B5. 05-test-report.md vs 05-test-results.md — 名称+路径不一致

- gate-rules: `05-test-report.md`，phase-5-test: `.specs/test/05-test-results.md`
- **修复建议**: 统一文件名和路径规范

---

## 四、C 类 — gate-rules.md 与实际文件不一致

### C1. gate-rules 缺失 4 个 Phase [HIGH]

gate-rules 依赖图仅含 8 个阶段 (0-confirm 到 7-integration)，缺少：

| 缺失 Phase | Gate | 产物 |
|---|---|---|
| phase-0-strategy (种子捕获) | G0 | SEED-*.md |
| phase-0-yc-strategy (YC 六问) | G1 | strategy-document |
| phase-1b-discuss (决策捕获) | G2.5 | CONTEXT.md |
| phase-8-archive (归档) | G8 | LESSONS.md |

**修复建议**: 更新 gate-rules.md 依赖图和验证表，加入以上 4 个阶段

### C2. 阶段编号体系不同 [MEDIUM]

| gate-rules | 实际 Phase | 偏差 |
|---|---|---|
| 0-confirm | phase-0-strategy + phase-0-yc-strategy | 一对二，gate-rules 合并为一个 |
| 1-analysis | phase-1-5whys | 名称不同 |
| 2-design | phase-2-design | 名称对齐 |
| 2a-ui-design | phase-2a-shotgun | 功能定位不同 (UI设计 vs 多方案探索) |
| 3-task | phase-3-task-plan | 名称不同 |
| 4-dev | phase-4-build | 名称不同 |
| 5-test | phase-5-test | 名称对齐 |
| 6-review | phase-6-review | 名称对齐 |
| 7-integration | phase-7-canary | 定位不同 (集成 vs 金丝雀发布) |
| — | phase-8-archive | gate-rules 无此阶段 |

### C3. Gate 编号冲突 [HIGH]

G5 被两个 Phase 使用：
- phase-5-test: `G5-PHASE5` (Test Quality Gate)
- phase-7-canary: `G5` (frontmatter gate 字段)

gate-rules 中无 G5 定义。这导致路由歧义。

**修复建议**: 重新分配 gate 编号。推荐方案：
- phase-5-test 保持 `G5-PHASE5` 或改用 `G5`
- phase-7-canary 改用 `G6` 或 `G7`（与 Phase 7 编号对齐）

### C4. 产物命名体系不一致 [HIGH]

gate-rules 用编号名 (`00-requirements.md`)，Phase 文件用语义名 (`strategy-document`)。
无官方映射表，导致依赖链无法自动验证。

**修复建议**: 在 gate-rules.md 或单独文件中建立映射表：

| 编号产物 | 语义名 | 产出 Phase |
|---|---|---|
| 00-requirements.md | strategy-document | phase-0-yc-strategy |
| 01-analysis.md | user-stories + acceptance-criteria | phase-1-5whys |
| 02-design.md | 02-design-md | phase-2-design |
| 02a-ui-design.md | 02a-ui-design-md | phase-2a-shotgun |
| 03-tasks.md | 03-tasks-md | phase-3-task-plan |
| 04-dev-log.md | wave-SUMMARY.md | phase-4-build (via Wave Executor) |
| 05-test-report.md | 05-test-results.md | phase-5-test |
| 06-code-review.md | 06-review.md | phase-6-review |
| 07-release-checklist.md | canary-report + rollback-report | phase-7-canary |

### C5. frontmatter 声明覆盖率低 [MEDIUM]

12 个 Phase 中仅 3 个在 frontmatter 声明了 requires/provides/gate：

| 声明完整 | 声明缺失 |
|---|---|
| phase-0-yc-strategy | phase-0-strategy |
| phase-1-5whys | phase-1b-discuss |
| phase-7-canary | phase-2-design |
| | phase-2a-shotgun |
| | phase-3-task-plan |
| | phase-4-build |
| | phase-5-test |
| | phase-6-review |
| | phase-8-archive |

**修复建议**: 将所有 Phase 的正文 requires/provides/gate 信息补入 frontmatter，使依赖链可被程序化验证

---

## 五、D 类 — 其他问题

### D1. phase-1-5whys 的 dependencies 与 requires 指向不同 Phase

- `dependencies: [phase-0-strategy]` — 声明依赖 phase-0-strategy
- `requires: [g1-gate-decision, strategy-document]` — 实际产物来自 phase-0-yc-strategy

**修复建议**: `dependencies` 应改为 `[phase-0-yc-strategy]`，或同时包含两个

### D2. phase-6-review 的 dependencies 为技能依赖而非 Phase 依赖

- `dependencies: [code-quality, spec-compliance]` — 这是 L2-ENGINE 技能
- 实际 Phase 前置应是 phase-5-test 和 phase-4-build

**修复建议**: 区分 `phase-dependencies`（阶段依赖）和 `skill-dependencies`（技能依赖）两个字段

### D3. phase-2a-shotgun 与 gate-rules 的 2a-ui-design 定位不同

- gate-rules: `2a-ui-design` 是 UI 设计阶段，产出 `02a-ui-design.md`
- phase-2a-shotgun: 是多方案设计探索工具，产出设计变体而非 UI 设计文档

**修复建议**: 明确 phase-2a-shotgun 是否等价于 `2a-ui-design`；若不等价，需要新增 phase-2a-ui-design 或更新 gate-rules

### D4. phase-4-build 的 G4 门控来源不明

- phase-4-build 声明前置产物 `03-tasks.md (Phase 3 通过 G4)`
- 但 phase-3-task-plan 无任何 gate 声明
- G4 门控（Task Plan Quality Gate）在 gate-rules 验证表中也未出现

**修复建议**: 在 phase-3-task-plan 中补充 `gate: G4` 和 `provides: [03-tasks-md, g4-gate-decision]`

---

## 六、问题统计与优先级

| 类别 | HIGH | MEDIUM | 合计 |
|---|---|---|---|
| A. 依赖链断裂 | 3 | 3 | 6 |
| B. 产物链断裂 | 3 | 2 | 5 |
| C. gate-rules 不一致 | 2 | 3 | 5 |
| D. 其他问题 | 0 | 4 | 4 |
| **合计** | **8** | **12** | **20** |

---

## 七、修复优先级建议

### P0 — 必须立即修复 (阻塞依赖链自动验证)

1. **C5**: 所有 Phase 的 frontmatter 补充 requires/provides/gate
2. **C1**: gate-rules.md 补充缺失的 4 个 Phase
3. **C4**: 建立编号产物与语义名的映射表

### P1 — 尽快修复 (影响正确性)

4. **A1/A5/A6**: 修复断裂的 requires/provides 链
5. **C3**: 解决 G5 编号冲突
6. **D1**: 修复 phase-1-5whys 的 dependencies 错误

### P2 — 计划修复 (一致性问题)

7. **A2/A3/A4**: 补充中间 Phase 的 provides 声明
8. **B1-B5**: 统一产物命名和路径
9. **C2**: 统一阶段编号体系
10. **D2-D4**: 区分 Phase 依赖与技能依赖

---

## 八、理想依赖链 (修复后应达到的状态)

```
phase-0-strategy
  requires: []
  provides: [project-context, seed-files]
  gate: G0

phase-0-yc-strategy
  requires: [project-context]
  provides: [g1-gate-decision, strategy-document, follow-up-queue]
  gate: G1

phase-1-5whys
  requires: [g1-gate-decision, strategy-document]
  provides: [01-analysis-md, user-stories, acceptance-criteria, scope-boundaries, g2-gate-decision]
  gate: G2

phase-1b-discuss
  requires: [g2-gate-decision, 01-analysis-md]
  provides: [context-md, g2.5-gate-decision]
  gate: G2.5

phase-2-design
  requires: [g2-gate-decision, 01-analysis-md, context-md]
  provides: [02-design-md, g2-phase2-gate-decision]
  gate: G2-PHASE2

phase-2a-shotgun
  requires: [g2-phase2-gate-decision, 02-design-md]
  provides: [02a-ui-design-md]
  gate: — (可选阶段)

phase-3-task-plan
  requires: [02-design-md, g2-phase2-gate-decision]
  provides: [03-tasks-md, g4-gate-decision]
  gate: G4

phase-4-build
  requires: [g4-gate-decision, 03-tasks-md]
  provides: [dev-complete, wave-summaries]
  gate: G4-PHASE4

phase-5-test
  requires: [dev-complete, 03-tasks-md]
  provides: [all-tests-passed, 05-test-results-md, g5-gate-decision]
  gate: G5-PHASE5

phase-6-review
  requires: [all-tests-passed, g5-gate-decision]
  provides: [06-review-md, g3-gate]
  gate: G3-PHASE6

phase-7-canary
  requires: [g3-gate, all-tests-passed]
  provides: [canary-report, rollback-report, g5-gate-decision, 07-release-checklist-md]
  gate: G7

phase-8-archive
  requires: [g5-gate-decision]
  provides: [lessons-md, domain-skills]
  gate: G8
```