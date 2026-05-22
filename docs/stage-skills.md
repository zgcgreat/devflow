# Phase Skills 参考 — DevFlow-Evo v3.2.3

本目录列出所有 **阶段技能（Phase Skills）** 的完整描述和执行要点。每个 Phase Skill 是 L1: INTERACTION 层的交互入口。

> **注意**: 原 `skills/stage-skills/` 目录已于 2026-05-22 移除（全部标记 DEPRECATED 后与 L1 Phase 重复）。所有阶段技能统一走 `layers/L1-INTERACTION/phase-*`。

## Phase 0: YC六问战略评估

**文件**: 见下方「路由」字段
**路由**: `layers/L1-INTERACTION/phase-0/_SKILL.md`
**门控**: G1 (Plan Quality Gate) — 6题全部回答通过

### 执行要点

- 输出6个战略问题：痛点、现有方案、独特优势、获客、赚钱、2倍速验证
- v3.2 交互模式：批量展示 + 逐个选择题交互
- 不满足 G1（有效回答<4）→ 退回需求澄清，不进入 Phase 1
- Standard 模式可条件跳过（需满足2项以上条件）

### 产物

```
.devflow-evo/<req-id>/00-strategy.md
```

## Phase 1: 5 Whys 需求追问

**文件**: 见下方「路由」字段
**路由**: `layers/L1-INTERACTION/phase-1-five-whys/_SKILL.md`
**门控**: G2 (Requirements Completeness Gate) — AC可执行 + 影响范围明确

### 执行要点

- 使用 grill skill 或 5 Whys 方法穷追模糊表述
- "用户说'要快'——多快？具体指标是什么？"
- v3.2 交互模式：批量展示需求澄清项 + 逐项选择题交互 + 多选支持
- Standard 模式可条件跳过

### 产物

```
.devflow-evo/<req-id>/01-analysis.md
```

## Phase 1b: 技术决策捕获 (Discuss)

**文件**: `skills/stage-skills/stage-1b-discuss.md`
**路由**: `layers/L1-INTERACTION/phase-1b-discuss/_SKILL.md`
**门控**: G2.5 (Decision Clarity Gate) — 决策覆盖率≥70%

### 执行要点

- **触发条件**: Phase 1输出的AC包含≥3个技术选型歧义 / 检测到未明确的实现细节 / 用户明确要求"/discuss"
- v3.2 交互模式：技术选型批量展示 + 逐个选择题交互 + 优缺点说明
- CONTEXT.md将作为Phase 2方案设计的约束条件

### 产物

```
CONTEXT.md（含所有技术决策记录）
```

## Phase 2: 方案设计

**文件**: 见下方「路由」字段
**路由**: `layers/L1-INTERACTION/phase-2-design/_SKILL.md`
**门控**: G3 (Design Quality Gate) — 满足需求 + 文档完整

### 执行要点

- L3 DAG-Router 构建依赖关系 → Kahn拓扑排序 → Wave分配
- L3 Provider-Gateway 按任务类型选择模型
- Phase 0/1产物作为输入约束条件
- Standard 模式输出完整设计文档；Lean 模式输出轻量方案（1段描述）

### 产物

```
.devflow-evo/<req-id>/02-design.md
```

## Phase 2a: 设计枪战 (Design Shotgun)

**文件**: 见下方「路由」字段
**路由**: `layers/L1-INTERACTION/phase-2a-shotgun/_SKILL.md`
**门控**: G3.5 (Design Diversity Gate) — ≥4个方案变体 + 加权评分通过

### 执行要点

- **触发条件**: 前端/UI项目时必跑；其他项目AI推荐
- 生成≥4个设计变体，展示对比表
- v3.2 交互模式：对比表展示 + AI推荐 + 快速选择
- 防决策疲劳：AI推荐必须有明确依据

### 产物

```
.devflow-evo/<req-id>/02-design.md（更新为最终方案）
```

## Phase 3: 任务拆分 (DAG + Wave Planning)

**文件**: 见下方「路由」字段
**路由**: `layers/L1-INTERACTION/phase-3-task-plan/_SKILL.md`
**门控**: G4 (Plan Completeness Gate) — DAG有向无环 + 任务原子化

### 执行要点

- L3 DAG-Router: 基于设计文档拆分成原子任务，建立依赖关系
- Kahn算法拓扑排序: 输出无环执行序列
- Wave分配: 依赖组 → 同一Wave；独立任务 → 不同Wave可并行
- v3.2 交互模式：Wave计划可视化 + 一键确认/修改/合并/拆分

### 产物

```
.devflow-evo/<req-id>/03-plan.md（含DAG描述 + Wave计划）
```

## Phase 4: 实施 (Implementation)

**文件**: 见下方「路由」字段
**路由**: `layers/L1-INTERACTION/phase-4-build/_SKILL.md`
**门控**: G5 (Implementation Gate) — Wave完成 + Heartbeat输出

### 执行要点

- L2 Wave-Executor 依次调度各 Wave
- L3 Parallel-Engine 并行执行同 Wave 内无依赖任务
- L2 PartyMode 启动多 Agent 协同
- LearningWorkflow自进化: Phase 4每个Wave完成时自动运行 LESSON 提名
- Heartbeat检查点协议: `[checkpoint][wave:N][task:X]`
- v3.2 交互模式：实施进度面板 + 实时追踪 + Heartbeat输出

### 产物

```
.devflow-evo/<req-id>/04-implementation.md（实施日志）
```

## Phase 5: 测试验证 (QA)

**文件**: 见下方「路由」字段
**路由**: `layers/L1-INTERACTION/phase-5-test/_SKILL.md`
**门控**: G2质量门（Code Quality Gate）— 通过率+覆盖率达标

### 执行要点

- RED-GREEN-REFACTOR (TDD硬约束)
- QA三层覆盖：单元测试 / 集成测试 / E2E流程测试
- 质量门: 代码风格 + 单测/集成/E2E通过 + 覆盖率≥80%（可条件放宽）
- v3.2 交互模式：测试进度面板 + 质量门交互式确认 + 不通过处理流程

### 产物

```
.devflow-evo/<req-id>/05-test-report.md
```

## Phase 6: 三层对抗审查

**文件**: 见下方「路由」字段
**路由**: `layers/L1-INTERACTION/phase-6-review/_SKILL.md`
**门控**: G6 (Review Sign-off Gate) — Blind Hunter + Edge Case + Acceptance全通过

### 执行要点

- **Blind Hunter**: 盲点发现 — "什么场景下会静默失败？"
- **Edge Case Hunter**: 边界条件 — "空数组/超长输入/并发冲突/时区差异？"
- **Acceptance Auditor**: 需求对齐 — "是否覆盖了PRD的所有验收标准？"
- v3.2 交互模式：审查结果分级展示（高/中/低风险）+ 交互式修复确认

### 产物

```
.devflow-evo/<req-id>/06-review-report.md
```

## Phase 7: Canary灰度发布

**文件**: 见下方「路由」字段
**路由**: `layers/L1-INTERACTION/phase-7-canary/_SKILL.md`
**门控**: G7 (Canary Health Gate) — error_rate + P99延迟达标

### 执行要点

- 分批次上线协议: Canary-1(10%) → Canary-2(50%) → Production(100%)
- 健康检查指标: error_rate阈值 / P99延迟阈值 / 错误日志检测
- 回滚阈值: error_rate > 0.5% 或 P99 > 500ms → 自动回滚
- v3.2 交互模式：发布进度可视化 + 健康检查实时展示 + 一键确认/回滚

### 产物

```
.devflow-evo/<req-id>/07-canary-report.md
```

## Phase 8: 知识归档

**文件**: 见下方「路由」字段
**路由**: `layers/L1-INTERACTION/phase-8-archive/_SKILL.md`
**门控**: G8 (Archive Gate) — LESSONS去重 + Domain Skills生成 + STATE更新

### 执行要点

- 遍历所有 Wave SUMMARY，识别可复用模式
- LESSONS去重：同名条目合并最佳实践
- Domain Skills沉淀: ≥3频率的LESSON主题自动触发
- OpenSpec集成（可选）：proposal → apply → archive
- v3.2 交互模式：归档进度可视化 + LESSONS价值分级 + 最终统计汇总

### 产物

```
.devflow-evo/memory/LESSONS.md（经验教训新增条目）
.devflow-evo/memory/domain-skills/（领域技能沉淀）
.devflow-evo/STATE.md（项目状态更新）
```

## Phase -1: 环境准备

**文件**: `skills/stage-skills/stage-(-1)-env-prep.md`

- 检测 GitNexus可用性
- 初始化记忆系统（首次使用必跑）
- 检查工具依赖（Python/Node等）

## Phase -2: 健康检查

**文件**: `skills/stage-skills/stage-m-health.md`

- 项目状态诊断
- Token预算状态
- 已知失败模式扫描

## Skill 引用索引

所有 Stage Skills 的内部路由映射到 L1 Phase技能目录：

| Stage Skill | L1 Phase _SKILL.md 文件 |
|------------|------------------------|
| stage-0-strategy | `layers/L1-INTERACTION/phase-0/_SKILL.md` |
| stage-1-analysis | `layers/L1-INTERACTION/phase-1-five-whys/_SKILL.md` |
| stage-1b-discuss | `layers/L1-INTERACTION/phase-1b-discuss/_SKILL.md` |
| stage-2-design | `layers/L1-INTERACTION/phase-2-design/_SKILL.md` |
| stage-2a-shotgun | `layers/L1-INTERACTION/phase-2a-shotgun/_SKILL.md` |
| stage-3-plan | `layers/L1-INTERACTION/phase-3-task-plan/_SKILL.md` |
| stage-4-build | `layers/L1-INTERACTION/phase-4-build/_SKILL.md` |
| stage-5-test | `layers/L1-INTERACTION/phase-5-test/_SKILL.md` |
| stage-6-review | `layers/L1-INTERACTION/phase-6-review/_SKILL.md` |
| stage-7-canary | `layers/L1-INTERACTION/phase-7-canary/_SKILL.md` |
| stage-8-archive | `layers/L1-INTERACTION/phase-8-archive/_SKILL.md` |

> **注意**: `skills/stage-skills/` 子目录下的文件是 Stage Skill 的原始定义，内部路由统一指向 L1 Phase `_SKILL.md` 指令文件。
