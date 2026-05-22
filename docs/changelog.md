# 变更日志 — DevFlow-Evo v3.2

本文档记录从 v1.0 到 v3.2 的完整变更历史。

---

## [v3.2.3] — 2026-05-21 — Audit Sprint (P0-P2 全量修复)

### 审计概况
- **审查范围**: 72 _SKILL.md / 330 .md 文件 / L1-L2-L3 三层架构
- **审查方法**: 8 维度 × P0-P3 严重度分级
- **健康度评分**: 72/100 → 88/100 (+16)

### P0 修复 (4项，阻塞发布) ✅
- **P0-1**: specialists requires 命名统一 — `g6-gate` → `g6-gate-decision` 格式
- **P0-2**: 15 个 stage-skills 补齐 `deprecated: true` + `replaced-by` 标记
- **P0-3**: 54→0 个 requires 断裂修复 — 命名统一 + external-inputs 迁移 + 缺失逻辑补齐
- **P0-4**: 8 个文件版本号统一为 3.0.0

### P1 修复 (6项，功能受损) ✅
- **P1-1**: L2 引擎层 Error Taxonomy 覆盖率 29%→100% (7/24→23/23)
- **P1-2**: L2 引擎层 Boundary Conditions 覆盖率 25%→100% (6/24→23/23)
- **P1-3**: L2→L3 跨层引用修正 — L2 requires 中 L3 实现名移至 `dependencies`
- **P1-4**: 99 个孤立 provides 甄别分类 — pipeline-consumed(28) + on-demand(52) + terminal-output(8) + redundant-child(11)
- **P1-5**: 3 处关键路径引用修复 — 裸路径补全 `.devflow-evo/<req-id>/` 前缀，模板路径补全 `references/` 前缀
- **P1-6**: code-intelligence 残留引用替换为 gitnexus-bridge (2处)

### P2 修复 (6项，质量受损) ✅
- **P2-1**: phase-0-strategy 补齐 Boundary Conditions (escalate/skip/degradation 三条)
- **P2-2**: mcp + skills/ 下 3 个 utility 标注 `standalone: true`
- **P2-3**: phase-0-strategy 确认项 2→3 项，新增"项目风险级别评估"（🟢低/🟡中/🔴高）
- **P2-4**: RULES-v3.md 引用路径评估，确认大部分引用已含 `references/` 前缀
- **P2-5**: code-intelligence DEPRECATED 标记确认
- **P2-6**: executor/_SKILL.md `// TODO` 替换为指令式描述

### 健康度评分提升明细

| 维度 | 修复前 | 修复后 | 关键改进 |
|------|--------|--------|---------|
| 结构完整性 | 80 | 95 | frontmatter 满分，版本统一，standalone 标注 |
| 协议合规性 | 55 | 92 | L1/L2 ET+BC 100%，L3 仍有提升空间 |
| 数据流闭环 | 65 | 85 | requires 0 断裂，orphan provides 已甄别分类 |
| 层级职责 | 70 | 85 | L2→L3 引用已修正，code-intelligence DEPRECATED |
| 用户体验 | 90 | 98 | 12 Phase 确认项统一为 3 项 |
| 代码健康 | 75 | 88 | TODO 已清理，code-intelligence 残留已修复 |
| 可执行性 | 68 | 80 | 关键路径已统一，RULES 引用已评估 |
| 安全与健壮 | 73 | 82 | Phase 0 BC 已补齐，Gate 仍无强制机制 |

### Gate 依赖链验证 ✅
```
G0 → G1 → G2.5 → G3 → G3.5 → G4 → G5 → G6 → G7 → G7.5 → G8
```
完整自洽，无断裂。

### 文档更新
- `docs/AUDIT-REPORT-v3.md`: 全面深度审查报告（8 维度 21 项发现）
- `docs/changelog.md`: 新增 v3.2.3 审计修复记录
- `docs/architecture.md`: 更新协议合规性、数据流闭环状态
- `docs/gates-reference.md`: 更新 G0 入口门 + 依赖链
- `docs/TEST-VERIFICATION.md`: 新增测试验证文档

---

## [v3.2.2] — 2026-05-20 — Scale & Revert Intelligence

### 新增功能
- **scale-domain-adaptive** ⭐: 动态规划深度引擎，基于项目规模(模块数)与领域信号(fintech/iot/saas/healthcare/gamedev)自动映射 Lite/Standard/Enhanced/Advanced 四级 Phase 流程
- **conductor-revert** ⭐: Git-aware 四阶段回滚协议 (交互选择 → Git对账 → 计划确认 → 执行验证)，支持 Track/Phase/Task 粒度精准回滚
- **hooks-chain-trigger** ⭐: Chain-Trigger链式触发 — One-to-Many/Many-to-Many级联执行(parallel/serial模式)
- **hooks-config-validation** ⭐: Hooks配置校验算法(阈值递增约束 + Scale自适应覆盖)

### 文档更新
- `L2-ENGINE/README.md`: 新增6模块文件树 + L2↔L3/L2↔L1协作协议表扩展
- `docs/advanced.md`: 新增Hooks Chain-Trigger、Conductor-Revert、Scale-Domain-Adaptive章节
- `GO.md`: 新增 `/dfevo:scale` + `/dfevo:revert` 命令索引

---

## [v3.2.1] — 2026-05-20 — Runtime Intelligence Sprint

### 新增功能
- **caveman-shrink v2** ⭐: MCP工具组压缩引擎，`TASK_MASTER_TOOLS`三级加载(core/standard/all)，70-76% context节省
- **codegraph-bridge** ⭐: CodeGraph本地知识图谱桥接 (SQLite+FTS5+Auto-Sync)，94%工具调用减少
- **hooks-system** ⭐: 运行时钩子系统 — context-monitor(阈值自动压缩)、prompt-guard(脱敏/注入检测)、phase-transition(checkpoint保存)、tool-execution(审计/重试)
- **surface-switch** ⭐: 运行时技能簇切换 — `/dfevo:surface [lite|standard|strict|audit|extreme]`，5种模式平滑过渡不丢上下文

### 文档更新
- `L2-ENGINE/README.md`: 新增4模块文件树 + 协作协议表扩展
- `docs/advanced.md`: 新增Hooks系统、Surface Switch、Caveman-Shrink v2、CodeGraph-Bridge章节
- `GO.md`: 新增4模块索引 + 3新命令(`/dfevo:surface`, `/dfevo:compress`, `/dfevo:budget`)

### 已知变更
- CodeGraph-Bridge从L3移至L2（本地SQLite查询，非决策层组件）
- Caveman-Shrink v2的MCP工具组压缩替代了v1.x的纯文本压缩

---

## [v3.2.0] — 2026-05-20 — Interactive UX Overhaul

### 核心改动（交互模式重构）⭐
**目标**: 让用户少打字，多做选择题。禁止一次性抛给用户大量问题让用户自己组织答案。

### Phase交互变更
| Phase | v3.1及之前 | v3.2新增 |
|-------|-----------|---------|
| Phase 0 | 6个大问题自由回答 | 批量展示进度 + 逐个选择题交互 + 自定义输入 |
| Phase 1 | 5 Whys追问（自由文本） | 批量展示需求澄清项 + 逐项选择题交互 + 多选支持 |
| Phase 1b | 技术选型自由讨论 | 技术选型批量展示 + 逐个选择题交互 + 优缺点说明 |
| Phase 2a | 设计方案自由对比 | 设计变体对比表 + 推荐度排序 + 快速选择 |
| Phase 3 | Wave计划手动确认 | Wave计划可视化 + 一键确认/修改/合并/拆分 |
| Phase 4 | 实施过程文本输出 | 实施进度面板 + 实时进度追踪 + Heartbeat自动输出 |
| Phase 5 | 测试结果文本报告 | 测试进度可视化 + 质量门交互式确认 + 不通过处理流程 |
| Phase 6 | 审查问题列表 | 审查结果分级展示(高/中/低风险) + 交互式修复确认 |
| Phase 7 | 发布状态文本 | 发布进度可视化 + 健康检查实时展示 + 一键确认/回滚 |
| Phase 8 | 归档清单 | 归档进度可视化 + LESSONS价值分级 + 最终统计汇总 |

### 新增规范
- **交互铁律** ⭐: 4步标准交互流程（展示全局→逐个提问→更新进度→总结门控）
- **选择题设计原则** ⭐: 严重程度/频率/技术选型/UI布局/优先级的标准选项设计

---

## [v3.1.0] — 2026-05-20 — Lean Mode & Pre-Detection

### 核心改动
- **模式预判定前置** ⭐: Step 1.5移到入场检测之前，先定模式再决定检测深度
- **Lean模式新增** ⭐: 填补Fast(≤2文件)和Standard(完整流程)之间的空白 — ≤5文件、<300行、brownfield明确需求

### Phase×前置步骤矩阵 ⭐
| Step | Fast | Lean | Standard | Strict |
|------|------|------|----------|--------|
| 入场检测 | ⏭️跳过 | ✅简化(复用上下文) | ✅完整 | ✅完整 |
| GitNexus | ⏭️跳过 | ⏭️跳过 | ✅执行 | ✅执行 |
| Phase 0 YC六问 | ⏭️跳过 | ⏭️跳过 | ⚠️条件跳过 | ✅必跑 |
| Phase 1 5Whys | ⏭️跳过 | ⏭️跳过 | ⚠️条件跳过 | ✅必跑 |

### Phase 0/1条件跳过规则 ⭐（Standard模式）
- **Phase 0跳过**: brownfield + 明确需求 + 有上下文 → 可跳过（需满足2项）
- **Phase 1跳过**: AC明确 + 技术无歧义 + 影响可控 → 可跳过（需满足2项）

### 入场检测模式适配 ⭐
- Fast: 跳过
- Lean: 简化（复用已有上下文如 `.workbuddy/memory/`）
- Standard/Strict: 完整流程

### 情况G新增 ⭐
- 已有外部上下文（`.workbuddy/memory`等）可直接复用，不需停等

### 路由声明扩展
- 新增字段: `前置裁剪`、`上下文来源`、`Phase0/1状态`

---

## [v3.0.0] — 2026-05-17 — Three-Layer Architecture Launch

### 架构变更
- **三层架构** ⭐: L1(交互) / L2(引擎) / L3(架构) 首次发布
- **三层路由决策树** ⭐: Layer 1 → Layer 3 → Layer 2

### 执行流程（12步）
```
Step 1: 读取项目状态 (.devflow-evo/STATE.md)
Step 2: 入场检测 (entry-check.md)
Step 3: GitNexus可选检测
Phase 0-8: 各Phase执行（详见GO.md）
```

### 架构层组件
- **DAG-Router**: Kahn拓扑排序 + Wave编排
- **Provider-Gateway**: 6任务类型选择矩阵 + 指数退避降级链
- **Agent-Isolation**: ~200K/Agent Token预算 + Wave边界
- **Parallel-Engine**: DAG并行执行引擎
- **Delta-Specs**: Brownfield差量规范

### 引擎层组件
- **LearningWorkflow**: LESSON沉淀 → Domain Skills(≥3频率触发) → 跨波注入
- **Wave-Executor**: Heartbeat检查点协议 + 上下文传递
- **PartyMode**: 多Agent协同实施

### GitNexus检测协议 (Step 3)
```
gitnexus --version → detect → prompt → grep fallback
```

### Phase 2a设计枪战路由 ⭐
- 前端/UI项目: 必跑（≥4设计变体）
- 其他项目: AI推荐

### Provider智能路由
- 按任务类型自动选择最合适的AI模型/Provider

### LearningWorkflow自进化触发点
- Phase 4每个Wave完成时自动运行LESSON提名

### 跨波上下文读取协议
```
Wave N SUMMARY → predicates → LESSONS → 注入N+1
```

### 20条规则集集成 ⭐
- R1-R20全量生效，详见 `references/RULES-v3.md`

---

## [v1.0] — Previous — Foundation Release

### 核心功能
- **整合四大项目** ⭐: devflow-kit + superpowers + OpenSpec + GitNexus + caveman
- **GO.md统一路由**: 单入口自动分发
- **Stage Skills**: `skills/stage-skills/` 目录下的阶段技能（原始定义）
- **跨会话记忆系统**: PROJECT_CONTEXT.md / DECISIONS.md / KNOWN_FAILURES.md
- **Token优化支持**: `/caveman` 压缩命令

### Phase流程（7阶段）
```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
```

### 集成组件
- spec-kit: PRD → Plan → Tasks（作为Phase 2输入来源之一）
- OpenSpec: proposal → apply → archive（作为Phase 8归档目标）
- GitNexus: tree-sitter + graphDB代码理解（可选检测，Step 3）

---

## 版本演进时间线

```
v1.0 (最初发布)
  │ 整合 devflow-kit + superpowers + OpenSpec + GitNexus + caveman
  │ 7阶段流程 + GO.md统一路由 + 跨会话记忆
  ▼
v3.0 (2026-05-17)
  │ ★三层架构(L1/L2/L3)首次发布
  │ 12步执行流程 + DAG并行路由 + LearningWorkflow自进化
  │ Provider智能网关 + Delta-Specs差量规范
  ▼
v3.1 (2026-05-20)
  │ ★Lean模式新增 + 模式预判定前置
  │ Phase×前置步骤矩阵 + Phase 0/1条件跳过
  │ 入场检测模式适配 + 情况G(外部上下文复用)
  ▼
v3.2 (2026-05-20)
  │ ★交互模式全面重构(选择题+批量展示)
  │ 4级并行度 + Heartbeat检查点协议
  ▼
v3.2.1 (2026-05-20)
  │ Runtime Intelligence Sprint
  │ Caveman-Shrink v2 + CodeGraph-Bridge + Hooks + Surface Switch
  ▼
v3.2.2 (2026-05-20)
  │ Scale & Revert Intelligence
  │ Scale-Domain-Adaptive + Conductor-Revert + Chain-Trigger
  ▼
v3.2.3 (2026-05-21)
  │ ★Audit Sprint: P0-P2 全量修复
  │ 健康度 72→88/100 +16
  │ requires 0断裂 + ET/BC 100%覆盖 + Gate链自洽
```

---

## 从旧版本迁移指南

### v2.x → v3.x

1. **Stage Skills路径变更**: `skills/stage-skills/` 内部路由到 `layers/L1-INTERACTION/phase-*/*_SKILL.md`
2. **Lean模式可用**: 在需求评估时选择 Lean 替代 Standard（更低的Token开销）
3. **Phase 0/1条件跳过**: Standard模式下brownfield明确需求可跳过（满足2项规则）
4. **记忆系统扩展**: 新增 `LESSONS.md` 和 `domain-skills/` 目录

### v1.x → v3.x

完整迁移路径: v1.x → v3.0 → v3.1 → v3.2。每一步向后兼容，无需修改已有产物。

详见 [README](../README.md) 的 v1.0 向后兼容表。

---

## 关于版本号的语义化约定

- **vMAJOR.MINOR.PATCH** 遵循语义化版本规范
- MAJOR: 架构变更、Phase流程变更、门控变更
- MINOR: 新增模式（如Lean）、条件跳过规则
- PATCH: 交互优化、性能改进、文档更新
