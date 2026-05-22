# 阶段门验证参考 — DevFlow-Evo v3.2.4

本文档列出所有 **阶段门（Gate）** 的完整验证规则。每个门是 Phase 之间的质量关口，未通过则不可进入下一阶段。

> **v3.2.4 更新**: 新增 Gate 强制验证机制（防盲飞），P3-4 修复

## 门控链全景

```
Phase 0 → [G0] → [G1] → Phase 1 → [G2] → Phase 1b → [G2.5] → Phase 2 → [G3]
Phase 2a → [G3.5] → Phase 3 → [G4] → Phase 4 → [G5]
Phase 5 → [G2质量门] → Phase 6 → [G6] → Phase 7 → [G7] → [G7.5]
Phase 8 → [G8]
```

**完整依赖链**: G0 → G1 → G2.5 → G3 → G3.5 → G4 → G5 → G6 → G7 → G7.5 → G8

## G0 — Entry Gate（入场门）

**位置**: 入场检测 → Phase 0
**检查项**:
- [ ] 项目目录已识别（greenfield / brownfield）
- [ ] GitNexus 可用性检测完成（就绪 / grep fallback / 关闭）
- [ ] 模式已判定（Fast / Lean / Standard / Strict）

**不通过处理**: 重新执行入场检测

## G1 — Plan Quality Gate（计划质量门）

**位置**: Phase 0 (YC六问) → Phase 1
**检查项**:
- [ ] 6个问题全部有回答（有效回答≥4）
- [ ] 痛点描述有具体场景或数据支撑
- [ ] 商业模式描述清晰（至少说明怎么赚钱）

**Phase 0 确认项（v3.2.3 统一为 3 项）**:
1. Gate 决策：PASS / CONDITIONAL / FAIL
2. 弱点识别：核心问题摘要
3. 项目风险级别：🟢低 / 🟡中 / 🔴高

**不通过处理**: 退回需求澄清，重新执行 Phase 0

## G2 — Requirements Completeness Gate（需求完整性门）

**位置**: Phase 1 (5 Whys) → Phase 1b
**检查项**:
- [ ] 所有模糊需求项已澄清为可执行验收标准
- [ ] AC列表覆盖用户核心需求 + 关键非功能需求
- [ ] 影响范围分析完成（受影响的模块/文件）

**不通过处理**: 继续追问未澄清的需求项，不得跳过

## G2.5 — Decision Clarity Gate（决策清晰度门）⭐v3新增

**位置**: Phase 1b (技术决策) → Phase 2
**检查项**:
- [ ] 决策覆盖率 ≥70%
- [ ] 所有未决项标注 `[NEEDS CLARIFICATION]`
- [ ] CONTEXT.md格式正确，包含所有技术决策记录

**不通过处理**: 补充未决的技术选型（API设计/数据存储/状态管理/错误处理）

## G3 — Design Quality Gate（设计质量门）

**位置**: Phase 2 (方案设计) → Phase 2a/Phase 3
**检查项**:
- [ ] 设计方案满足 Phase 0 和 Phase 1 的所有约束条件
- [ ] DAG有向无环，拓扑排序有效
- [ ] Wave划分合理（依赖组在同一 Wave）

**不通过处理**: 重新审视设计方案，补充缺失的设计要素

## G3.5 — Design Diversity Gate（设计多样性门）⭐v3新增

**位置**: Phase 2a (设计枪战) → Phase 3
**检查项**:
- [ ] ≥4个方案变体已生成
- [ ] 每个变体有明确的优缺点分析
- [ ] AI推荐有明确依据
- [ ] 用户选择了最终方案或组合方案

**不通过处理**: 重新生成设计变体（需增加多样性）

## G4 — Plan Completeness Gate（计划完整性门）

**位置**: Phase 3 (任务拆分) → Phase 4
**检查项**:
- [ ] 所有任务已原子化（每个任务可独立完成）
- [ ] 依赖关系完整，无遗漏
- [ ] Wave优先级标注合理（P0/P1/P2/P3）

**不通过处理**: 重新拆分任务（粒度不合理时拆得更细）

## G5 — Implementation Gate（实施门）

**位置**: Phase 4 (实施) → Phase 5
**检查项**:
- [ ] 所有 Wave 按计划完成
- [ ] Heartbeat检查点已输出：`[checkpoint][wave:N][task:X]`
- [ ] LESSON提名已记录到 LearningWorkflow

**不通过处理**: 补做未完成的任务或 Wave

## G2质量门 — Code Quality Gate（代码质量门）⚠️注意不是G2

**位置**: Phase 5 (测试) → Phase 6
**检查项**:
- [ ] 单元测试通过率 ≥90%（Strict模式≥95%）
- [ ] 集成测试通过
- [ ] E2E流程测试通过
- [ ] 代码风格无错误或警告
- [ ] 覆盖率 ≥80%（可条件放宽，需用户确认）

**不通过处理**: 补充测试覆盖 → 重新验证 → 直到所有子项通过

## G6 — Review Sign-off Gate（审查签字门）

**位置**: Phase 6 (三层对抗) → Phase 7
**检查项**:
- [ ] Blind Hunter: 未发现阻塞级盲点
- [ ] Edge Case Hunter: 已知边界条件已处理或标记为可接受
- [ ] Acceptance Auditor: PRD验收标准覆盖率 ≥90%

**不通过处理**: 修复中高风险问题 → 重新审查直到所有层通过

## G7 — Canary Health Gate（Canary健康门）

**位置**: Phase 7 (Canary发布) → Phase 8
**检查项**:
- [ ] error_rate < 0.5%
- [ ] P99延迟 < 500ms
- [ ] 错误日志无异常
- [ ] Canary-1(10%) 和 Canary-2(50%) 全部通过

**不通过处理**: 自动回滚 → 分析问题 → 修复后重新 Canary

## G8 — Archive Gate（归档门）

**位置**: Phase 8 (知识归档) → 项目完成
**检查项**:
- [ ] 所有 Wave SUMMARY 已遍历
- [ ] LESSONS去重完成，无重复条目
- [ ] Domain Skills生成正确（≥3频率的LESSON主题已合并）
- [ ] STATE.md已更新为最新状态
- [ ] 产物目录 `.devflow-evo/<req-id>/` 完整

**不通过处理**: 补做缺失的归档步骤 → 重新验证直到所有子项通过

## Gate 强制验证机制（防盲飞）⭐v3.2.4新增

> **问题**: Phase skill 的"跳过条件"仅靠 AI 自判，AI 可声称"已有 02-design.md"跳过 Phase 2，而产物实际不存在或不完整。这构成 **P3-4 盲飞风险**。

### 验证规则

**规则 1 — 产物存在性验证**：任何 Phase 声称"跳过"时，必须先用 `Read` 工具读取产物文件并展示关键内容片段（≥3行），不得仅声称"产物已存在"。

**规则 2 — 产物完整性验证**：产物存在但不完整时（如 02-design.md 缺少架构图段），不得跳过，必须补全后重验。

**规则 3 — 用户确认兜底**：产物存在且完整时，仍须向用户展示产物摘要并取得确认，用户有权拒绝跳过。

### 各 Phase 产物验证清单

| Phase | 产物路径 | 验证关键段 | 跳过条件 |
|-------|---------|-----------|---------|
| Phase 0 | `.devflow-evo/00-strategy.md` | 目标+范围+风险级别 | Fast/Lean 模式直接跳过（无需验证） |
| Phase 1 | `.devflow-evo/01-5whys.md` | 5个Why + 根因 | Fast/Lean 模式直接跳过 |
| Phase 1b | `.devflow-evo/01b-context.md` | 技术决策 + 未决项 | Fast 模式跳过；Lean/Standard 需验证 CONTEXT.md 存在 |
| Phase 2 | `.devflow-evo/<req-id>/02-design.md` | 技术栈+架构图+API | 需 Read 验证 `## 0. 技术栈选定` 段已锁定 |
| Phase 2a | `.devflow-evo/<req-id>/02a-variants.md` | ≥4变体 + 评分 | 简单任务（≤3文件）自动跳过 |
| Phase 3 | `.devflow-evo/<req-id>/specs/03-tasks.md` | 任务列表+依赖DAG | Fast/Lean 模式直接跳过 |
| Phase 4 | Wave 产物目录 | 代码文件+commit | 不可跳过 |
| Phase 5 | `.devflow-evo/<req-id>/specs/test/` | 测试结果+覆盖率 | 不可跳过 |
| Phase 6 | `.devflow-evo/<req-id>/specs/06-review.md` | 审查结果+修复项 | Fast 模式可自检替代三层对抗 |
| Phase 7 | `.devflow-evo/<req-id>/specs/07-canary.md` | 健康指标+回滚阈值 | Fast/Lean 模式跳过 |
| Phase 8 | `LESSONS.md` + `STATE.md` | LESSONS去重+Domain Skills | 不可跳过 |

### 验证指令模板

在每个 Phase 的跳过判定处，应使用以下指令格式：

```markdown
### 跳过验证（防盲飞）

**声称跳过原因**: _← AI 塰明跳过此 Phase 的原因_

**验证步骤**（必须执行，不可省略）:
1. 使用 `Read` 工具读取产物文件: `Read("<产物路径>")`
2. 展示产物关键内容片段（≥3行）
3. 确认产物完整性（所有必要段存在且非空）
4. 向用户展示摘要并请求确认: "产物已存在且完整，是否确认跳过此 Phase？"

**验证结果**:
- ✅ 产物存在且完整 + 用户确认 → 跳过
- ⚠️ 产物存在但不完整 → 补全后重新验证
- ❌ 产物不存在 → 执行此 Phase
```

## 门控速查表

| 门 | 前置Phase | 核心检查 | 失败处理 |
|----|----------|---------|---------|
| G0 | 入场检测 | 项目识别+模式判定 | 重新检测 |
| G1 | Phase 0 | 6题≥4有回答 | 退回Phase 0 |
| G2 | Phase 1 | AC可执行+影响范围 | 继续追问 |
| G2.5 | Phase 1b | 决策覆盖率≥70% | 补充决策 |
| G3 | Phase 2 | DAG有效+Wave合理 | 重新设计 |
| G3.5 | Phase 2a | ≥4变体+用户选择 | 重新生成 |
| G4 | Phase 3 | 任务原子化+无遗漏 | 重新拆分 |
| G5 | Phase 4 | Wave完成+Heartbeat | 补做任务 |
| G2质量门 | Phase 5 | 通过率+覆盖率达标 | 补充测试 |
| G6 | Phase 6 | 三层全通过 | 修复后重审 |
| G7 | Phase 7 | 健康指标达标 | 回滚后重试 |
| G8 | Phase 8 | 归档完整+去重完成 | 补做归档 |

## 版本更新记录

- **v3.2.3**: Audit Sprint — G0 入口门确认完整；Phase 0 确认项统一为 3 项（含风险级别评估）；Gate 依赖链 G0→G8 审计验证自洽；requires 命名统一为 `gX-gate-decision` 格式
- **v3.2**: 门控编号统一为 `gX-gate` 格式；Phase 1b新增G2.5门；条件跳过规则与门控联动
- **v3.1**: Lean模式添加简化门控路径
