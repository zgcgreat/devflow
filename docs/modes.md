# 四档模式详解 — DevFlow v3.2.3

DevFlow 提供 **Fast / Lean / Standard / Strict** 四种执行模式，每种模式裁剪不同的 Phase 流程和检测深度。

## 模式决策矩阵

| 维度 | Fast | Lean | Standard | Strict |
|------|------|------|----------|--------|
| **文件数** | ≤2 | ≤5 | ≤10 | 不限 |
| **代码行数** | <50行 | <300行 | <500行 | 不限 |
| **风险级别** | 低 | 低-中 | 中 | 高 |
| **适用场景** | typo、文案、样式修复 | brownfield明确需求小改动 | 常规功能开发 | 架构变更、数据模型变更 |
| **Token预算建议** | small | small-medium | medium-large | large-enterprise |

## 模式预判定流程（Step 1.5）

```
用户需求 → 快速评估文件数/行数/风险
    ↓
模式推荐（AI给出理由）→ 用户确认/切换
    ↓
根据模式裁剪后续步骤
```

**⚠️ 强制规则**: AI必须使用 `read_file` 读取 `mode-rules.md`，输出模式确认后停等用户。

## 各模式流程对比

### Fast 模式（最快，Token最少）

```
Phase 0: YC六问          ⏭️ 跳过
Phase 1: 5 Whys          ⏭️ 跳过
Phase 1b: 决策捕获       ⏭️ 跳过
Phase 2: 方案设计        ⏭️ 跳过（直接进入 Phase 4）
Phase 3: 任务拆分        ⏭️ 跳过
Phase 4: 实施            ✅ 直接开始
Phase 5: 测试            ✅ 窄验证
Phase 6: 审查            ✅ 自检清单
Phase 7-8: Canary+归档   ⏭️ Phase 7跳过 / Phase 8归档到LESSONS
```

### Lean 模式（低开销，比Fast多一点流程）

```
Phase 0: YC六问          ⏭️ 跳过
Phase 1: 5 Whys          ⏭️ 跳过
Phase 1b: 决策捕获       ⏭️ 跳过
Phase 2: 方案设计        ✅ 轻量（口述方案，1段描述）
Phase 3: 任务拆分        ⏭️ 跳过
Phase 4: 实施            ✅ 直接开始
Phase 5: 测试            ✅ 窄验证
Phase 6: 审查            ✅ 自检清单
Phase 7-8: Canary+归档   Phase 7跳过 / Phase 8归档到LESSONS
```

### Standard 模式（完整流程）

```
Phase 0: YC六问          ⚠️ 条件跳过（见下方规则）
Phase 1: 5 Whys          ⚠️ 条件跳过（见下方规则）
Phase 1b: 决策捕获       ⚠️ 条件执行
Phase 2: 方案设计        ✅ 完整
Phase 3: 任务拆分        条件触发
Phase 4: 实施            ✅ 完整
Phase 5: 测试            ✅ 完整
Phase 6: 审查            ✅ 三层对抗
Phase 7-8: Canary+归档   ✅ 完整
```

### Strict 模式（最严格）

```
Phase 0: YC六问          ✅ 必跑
Phase 1: 5 Whys          ✅ 必跑
Phase 1b: 决策捕获       ✅ 必跑
Phase 2: 方案设计        ✅ 完整 + Design Shotgun（前端/UI必跑）
Phase 3: 任务拆分        ✅ DAG全量 + Wave编排
Phase 4: 实施            ✅ PartyMode并行
Phase 5: 测试            ✅ 全量QA覆盖
Phase 6: 审查            ✅ 三层对抗（强制通过G1/G2门）
Phase 7: Canary          ✅ 分批灰度发布
Phase 8: 归档            ✅ LESSONS + Domain Skills + GitNexus分析
```

## Standard 模式的条件跳过规则 ⭐v3.1新增

### Phase 0 跳过条件（满足任意2项即可）

- ✅ brownfield 项目（已有代码库）
- ✅ 用户需求描述具体明确（非"做个APP"类模糊表述）
- ✅ 任务是优化/修复/小功能，非新项目/新方向
- ✅ 项目已有完整上下文（MEMORY.md/CLAUDE.md/CONTEXT.md）
- ❌ 用户说"我想做一个XX"类从零开始的表述 → **必跑**

### Phase 1 跳过条件（满足任意2项即可）

- ✅ 需求有明确验收标准（用户说"排版乱"且指向具体组件）
- ✅ 技术方案无歧义（不涉及技术选型决策）
- ✅ 影响范围可控（仅前端展示层，不涉及后端/数据）
- ❌ 需求包含"支持XX"但未列具体项 → **必跑5Whys追问**

### 跳过时的替代动作

- 跳过 Phase 0 → 生成简版 `00-strategy.md`（1段话：背景+目标+范围）
- 跳过 Phase 1 → 生成简版 `01-analysis.md`（AC列表 + 影响范围）

### ⚠️ 防盲飞验证规则 ⭐v3.2.4新增

> **问题**: AI 可能声称"产物已存在"跳过 Phase，但实际产物不存在或不完整。

**验证流程**（Standard/Strict 模式下，跳过 Phase 2 及后续阶段时必执行）:

1. 使用 `Read` 工具读取产物文件
2. 展示产物关键内容片段（≥3行）
3. 向用户确认: "产物已存在且完整，是否确认跳过此 Phase？"
4. 用户确认后方可跳过

**豁免**: Fast/Lean 模式下可直接跳过（低风险场景，无需验证）。

**不可跳过的 Phase**: Phase 4（实施）、Phase 5（测试）、Phase 8（归档）— 无论何种模式。

## 入场检测的模式适配 ⭐v3.1新增

| 模式 | 入场检测深度 | 说明 |
|------|------------|------|
| Fast | ⏭️ 跳过 | 直接进入 Phase 4 |
| Lean | ✅ 简化 | 检查已有上下文，如可用则直接复用 |
| Standard | ✅ 完整 | 按 entry-check.md 决策树执行 |
| Strict | ✅ 完整 | 按 entry-check.md + GitNexus 深度分析 |

## 使用建议

| 场景 | 推荐模式 |
|------|---------|
| typo/文案/样式修复 | Fast |
| brownfield 已知上下文小改动 | Lean |
| 新feature / bug修复 / refactor | Standard |
| 架构变更 / 数据模型变更 / 微服务拆分 | Strict |
| Token 极度敏感 | Fast + lean 或 full 压缩 |

## 模式切换

用户在任意阶段可要求切换模式：

```
从 Standard 切到 Fast → Phase 0/1/1b/2/3 产物保留，后续用 Fast 规则执行
从 Lean 切到 Strict → 补跑缺失的 Phase（Phase 0→1→1b→2a→3）
```

**关键约束**: 模式切换时，已生成的 Phase 产物不因模式变更而失效。前置阶段产物的合规性由对应阶段的门控保证。
