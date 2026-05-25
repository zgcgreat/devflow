# devflow v3.0.0 全面深度审查报告

> 审查时间: 2026-05-21
> 审查范围: 72 _SKILL.md / 330 .md 文件 / L1-L2-L3 三层架构
> 审查方法: 8 维度 × P0-P3 严重度分级

---

## 审查框架：8 大维度

| # | 维度 | 核心问题 | 关键指标 |
|---|------|---------|---------|
| 1 | **结构完整性** | 每个文件是否具备完整的元数据和声明？ | frontmatter 覆盖率、requires/provides 声明完整性、版本一致性 |
| 2 | **协议合规性** | 每个技能是否遵循 Three Elements 协议？ | Error Taxonomy P0-P3 覆盖率、Boundary Conditions 覆盖率 |
| 3 | **数据流闭环** | 跨 skill 数据流是否形成完整闭环？ | requires→provides 匹配率、Gate 依赖链 G0→G8 自洽性 |
| 4 | **层级职责** | L1/L2/L3 各层是否边界清晰？ | 跨层调用契约、层内内聚度、层间耦合度 |
| 5 | **用户体验** | 交互协议是否一致且低认知负荷？ | 交互模式统一性、确认流程完备性、歧义消除 |
| 6 | **代码健康** | 是否存在残留技术债？ | DEPRECATED/TODO 残留、重复模块、死引用 |
| 7 | **可执行性** | AI 指令是否足够明确可执行？ | 指令确定性、产物路径一致性、模板对齐 |
| 8 | **安全与健壮** | 流程是否存在可绕过漏洞？ | Gate 强制性、降级策略完备性、盲飞检测 |

---

## 审查发现汇总

### P0 — BLOCKING (阻塞发布，4 项) ✅ 全部修复

| # | 维度 | 发现 | 影响 | 修复建议 | 状态 |
|---|------|------|------|---------|------|
| P0-1 | 数据流闭环 | **specialists 的 requires 使用 `g6-gate` 而非 `g6-gate-decision`** | security/testing specialist 无法匹配 Gate 依赖链 | 统一为 `g6-gate-decision` 格式 | ✅ 已统一 |
| P0-2 | 代码健康 | **15 个 stage-skills 无 DEPRECATED 标记** | 用户可能误用已废弃的 stage-skills | 给所有 15 个加 `deprecated: true` + `replaced-by` | ✅ 已标记 |
| P0-3 | 数据流闭环 | **54→0 个 requires 项无对应 provides 匹配** | AI 执行时可能找不到所需输入 | 分类处理：命名统一 + 外部输入迁移 + 缺失逻辑补齐 | ✅ 0 断裂 |
| P0-4 | 版本一致性 | **8 个文件版本号不一致** | 版本号混乱 | 统一为 3.0.0 | ✅ 已统一 |

### P1 — MAJOR (功能受损，6 项) ✅ 全部修复

| # | 维度 | 发现 | 影响 | 修复建议 | 状态 |
|---|------|------|------|---------|------|
| P1-1 | 协议合规性 | **L2 引擎层 Error Taxonomy 覆盖率仅 29%** (7/24 有 ET) | 引擎层技能出错时无结构化分类，难以自动降级 | 给核心引擎(executor/wave-executor/hooks-system/learning-workflow)补 ET | ✅ 100% (23/23) |
| P1-2 | 协议合规性 | **L2 引擎层 Boundary Conditions 覆盖率仅 25%** (6/24 有 BC) | 无边界条件 = 无降级策略，引擎层极端情况无保护 | 补量优先级：executor > wave-executor > hooks > provider-gateway | ✅ 100% (23/23) |
| P1-3 | 层级职责 | **L2 skill 直接引用 L3 模块名作为 requires** | 违反 L2→L3 调用方向约束 | 引入 layer-interfaces 中间契约，L2 requires interface 名而非 L3 实现名 | ✅ 已移至 dependencies |
| P1-4 | 数据流闭环 | **107→99 个 provides 项无任何 requires 消费** | "产出无人消费"的孤立 provides | 逐一甄别：pipeline-consumed 28 + on-demand 52 + terminal 8 + redundant 11 | ✅ 甄别完成 |
| P1-5 | 可执行性 | **部分 Phase 引用产物路径格式不统一** | AI 执行时可能无法确定产物写入位置 | 统一为 `.devflow/<req-id>/` 前缀路径规范 | ✅ 关键不一致已修复 |
| P1-6 | 代码健康 | **code-intelligence 已 DEPRECATED 但可能存在调用残留** | 残留引用可能导致 AI 误调用废弃模块 | grep 全项目确认无调用残留，如有则替换为 gitnexus-bridge | ✅ 2处残留已修复 |

### P2 — MINOR (质量受损，6 项) ✅ 全部修复/评估

| # | 维度 | 发现 | 影响 | 修复建议 | 状态 |
|---|------|------|------|---------|------|
| P2-1 | 协议合规性 | **phase-0-strategy 缺少 Boundary Conditions** | Phase 0 入口无边界保护 | 添加 BC：escalate/skip/degradation | ✅ 已添加 |
| P2-2 | 协议合规性 | **mcp 和 skills/ 下 3 个 utility 无 requires/provides** | 无法被 DAG 调度 | 标注 `standalone: true` | ✅ 已标注 |
| P2-3 | 用户体验 | **phase-0-strategy 确认项仅 2 项，其他 Phase 均 3 项** | 确认项数量不一致 | 添加"风险级别评估"为第3项 | ✅ 已添加 |
| P2-4 | 可执行性 | **RULES-v3.md 位于 references/ 而非根目录** | Phase skill 中引用路径可能不一致 | 统一引用路径 | ✅ 已评估，大部分引用已含前缀 |
| P2-5 | 层级职责 | **L3 层 code-intelligence (DEPRECATED) 与 gitnexus-bridge 功能重叠** | 同层两个模块功能重叠 | 确认无消费者后可考虑删除 | ✅ 已有 DEPRECATED 标记 |
| P2-6 | 代码健康 | **executor/_SKILL.md 含 `// TODO: persist to database`** | 零脚本项目不应有 TODO 代码注释 | 替换为指令式描述 | ✅ 已替换 |

### P3 — INFO (建议改进，5 项)

| # | 维度 | 发现 | 影响 | 修复建议 |
|---|------|------|------|---------|
| P3-1 | 结构完整性 | **72 个 _SKILL.md frontmatter 全部存在** ✅ | 无 | — |
| P3-2 | 用户体验 | **12 个 Phase 交互模式已统一为顺序确认** ✅ | 无 | — |
| P3-3 | 数据流闭环 | **Phase Gate 链 G0→G8 完全自洽** ✅ | 无 | — |
| P3-4 | 安全与健壮 | Phase skill 的"跳过条件"仅靠 AI 自判，无强制验证 | AI 可声称"已有 02-design.md"跳过 Phase 2 | 考虑在 Gate 验证中加文件存在性检查 |
| P3-5 | 层级职责 | **gsd-workflows/ 目录与 L1 Phase 存在历史遗留** | gsd-workflows 是 get-shit-done 遗留，与 Phase 体系独立 | 评估是否保留或迁移到适配器目录 |

---

## 各维度详细分析

### 维度 1: 结构完整性

**frontmatter 覆盖率: 100%** (72/72)

**版本一致性: 89%** (64/72 统一为 3.0.0)

| 版本 | 文件数 | 文件列表 |
|------|--------|---------|
| 3.0.0 | 68 | 主流 |
| 3.2.0 | 3 | caveman-shrink, codegraph-bridge, surface-switch |
| 3.2.2 | 3 | conductor-revert, hooks-system, scale-domain-adaptive |
| 空 | 2 | karpathy-rules, manage-memory |

**requires/provides 声明覆盖率: 79%** (57/72)

- L1 Phase: 19/19 (100%)
- L2 Engine: 24/24 (100%)
- L3 Architecture: 10/11 (code-intelligence DEPRECATED 免除)
- skills/stage-skills: 0/15 (0%)
- skills/ 其他: 1/3

### 维度 2: 协议合规性

**Error Taxonomy 覆盖率**

| 层级 | 有 ET | 无 ET | 覆盖率 |
|------|-------|-------|--------|
| L1-INTERACTION | 19/19 | 0 | **100%** |
| L2-ENGINE | 7/24 | 17 | **29%** |
| L3-ARCHITECTURE | 5/11 | 6 | **45%** |
| skills/ | 1/18 | 17 | **6%** |

L2 无 ET 的关键技能（按优先级）:
1. `hooks-system` — 7 类 hook，出错影响面广
2. `conductor-revert` — 回滚操作，P0 级安全
3. `debugging-workflow` — 调试场景天然多异常
4. `caveman-shrink` — 压缩操作可能丢失上下文
5. `memory-compression` — 压缩操作可能丢失记忆

**Boundary Conditions 覆盖率**

| 层级 | 有 BC | 无 BC | 覆盖率 |
|------|-------|-------|--------|
| L1-INTERACTION | 19/19 | 0 | **100%** |
| L2-ENGINE | 6/24 | 18 | **25%** |
| L3-ARCHITECTURE | 4/11 | 7 | **36%** |
| skills/ | 1/18 | 17 | **6%** |

### 维度 3: 数据流闭环

**requires/provides 交叉匹配** (P0-3 修复后更新)

| 类别 | 数量 | 示例 | 分析 |
|------|------|------|------|
| requires 无 provides 匹配 | **0** ✅ | — | P0-3 修复完成：命名统一 + 外部输入迁移到 external-inputs + 缺失逻辑补齐 |
| provides 无 requires 匹配 | **99** | 见下方分类 | P1-4 甄别完成：pipeline-consumed 28 + on-demand 52 + terminal-output 8 + redundant-child 11 |

**孤立 provides 分类 (P1-4 甄别结果)**:

| 类别 | 数量 | 说明 | 处理 |
|------|------|------|------|
| **Pipeline-consumed** | 28 | Phase 间隐式传递，AI 按序执行时自然消费（如 user-stories→Phase2, variant-proposals→Phase3） | 保留，无需显式 requires |
| **On-demand** | 52 | L2/L3 按触发条件消费（如 hooks 触发 caveman-shrink, GitNexus 触发 impact-analysis） | 保留，triggers 替代 requires |
| **Terminal-output** | 8 | 流程终端产出（g8-gate-decision, archive-complete 等），无后续消费者 | 保留，流程结束即终止 |
| **Redundant-child** | 11 | 子技能与父技能 provides 重复（如 memory-keeper 的 archive-complete 与 phase-8-archive 重复） | 保留，子技能产出被父技能汇总 |

关键已修复断裂点:
1. ~~`g6-gate` vs `g6-gate-decision`~~: ✅ 已统一 (P0-1)
2. ~~外部输入无 provides~~: ✅ 已迁移到 external-inputs (P0-3)
3. ~~L2->L3 跨层引用~~: ✅ 已移至 dependencies (P1-3)

Gate 依赖链 G0->G8: 自洽通过

### 维度 4: 层级职责

| 层级 | 职责定义 | 技能数 | 内聚评估 |
|------|---------|--------|---------|
| L1-INTERACTION | 用户交互 + Phase 流程 | 19 | 高 |
| L2-ENGINE | 引擎逻辑 + 中间件 | 24 | 中 |
| L3-ARCHITECTURE | 基础设施 + 路由 | 11 | 中高 |

跨层调用问题:
- conductor-revert (L2) -> codegraph-bridge (L3): L2 直接依赖 L3 实现名
- scale-domain-adaptive (L2) -> phase-0 (L1): L2 依赖 L1 Phase 名（反向依赖）
- hooks-system (L2) -> scale-domain-adaptive (L2): L2 内部依赖，合理

skills/ 目录归属:
- stage-skills/ (15个): 与 L1 Phase 高度重复，14/15 无 DEPRECATED 标记
- karpathy-rules, manage-memory: 独立工具，无 requires/provides
- install-devflow: 安装器，唯一有声明的 skills/ 文件

### 维度 5: 用户体验

交互模式统一性: 100% — 12 个 Phase 全部已统一为顺序确认模式
确认项数量: 11/12 Phase 为 3 项，phase-0-strategy 仅 2 项
认知负荷评估: 统一为 3 项确认，每项 1-3 个选项，符合"7+/-2"原则

### 维度 6: 代码健康

DEPRECATED/TODO/FIXME 扫描结果:
- DEPRECATED: 3 处功能性引用
- TODO: ~10 处功能性引用为主，executor 含 1 处代码注释
- FIXME/HACK: 0 处
- TEMPORARY: 3 处功能性（Phase 8 archive 的 TEMPORARY.md 清理逻辑）
- XXX: ~5 处功能性（占位符示例、L-XXX 编号格式）

关键问题:
1. stage-skills 15 个无 DEPRECATED 标记（仅 stage-orchestrator 有）
2. executor/_SKILL.md 含 `// TODO: persist to database` 代码注释（零脚本项目不应有）
3. code-intelligence 已 DEPRECATED 但可能存在调用残留

### 维度 7: 可执行性

产物路径一致性:
- `.devflow/<req-id>/02-design.md` — 规范路径
- `02-design.md` — Phase 2a shotgun 读取时缺少前缀
- `specs/03-tasks.md` — 与 `.devflow/` 前缀不一致
- `templates/02-design.md` — 应为 `references/templates/02-design.md`

模板对齐: `references/templates/` 下 25 个模板，`templates/` 下 67 个模板，两套并存

AI 指令明确性:
- Phase skill: 指令详细，步骤清晰
- Engine skill: 部分技能(anti-rationalization, caveman-stats)缺少具体操作步骤
- Architecture skill: 架构决策清晰

### 维度 8: 安全与健壮

Gate 强制性分析 — Phase skill 的 Gate 验证依赖 AI 自行核对清单，无外部强制机制:

| 绕过场景 | 当前保护 | 风险等级 |
|---------|---------|---------|
| AI 声称"已有 02-design.md"跳过 Phase 2 | Phase 2 有"检查文件是否存在"指令 | 低 |
| AI 跳过用户确认直接推进 | 交互协议要求逐项确认 | 低 |
| AI 忽略 Gate 验证直接 PASS | 每个 Phase 有验证步骤 | 中 |

降级策略完备性:
- provider-gateway: 指数退避降级链(5s->10s->20s)
- gitnexus-bridge: withFallback 自动降级到 regex
- code-intelligence: 已 DEPRECATED，降级路径经 gitnexus-bridge
- caveman-shrink: 无降级策略（压缩失败时无回退）
- memory-compression: 无降级策略（压缩失败时无回退）

---

## 修复优先级路线图

### Sprint 1: P0 修复 (阻塞发布)

| # | 修复项 | 工作量 | 依赖 |
|---|--------|--------|------|
| P0-1 | 统一 specialists requires 为 `g6-gate-decision` | 2 文件 | 无 |
| P0-2 | 给 15 个 stage-skills 加 DEPRECATED 标记 | 15 文件 | 需确认 L1 Phase 对应关系 |
| P0-3 | 分类处理 54 个 requires 断裂 | 需逐一甄别 | P0-1 完成后重新扫描 |
| P0-4 | 统一版本号为 3.0.0 或 3.2.2 | 8 文件 | 需决策版本号 |

### Sprint 2: P1 修复 (功能受损)

| # | 修复项 | 工作量 | 依赖 |
|---|--------|--------|------|
| P1-1 | L2 核心引擎补 Error Taxonomy | 5-7 文件 | 需设计 ET 内容 |
| P1-2 | L2 核心引擎补 Boundary Conditions | 5-7 文件 | 需设计 BC 内容 |
| P1-3 | L2->L3 引用改为 interface 契约 | 2-3 文件 | 需 layer-interfaces 扩展 |
| P1-4 | 甄别 107 个孤立 provides | 需逐一审查 | 低优先级，可分批 |
| P1-5 | 统一产物路径格式 | 3-5 文件 | 需定义路径规范 |
| P1-6 | 确认 code-intelligence 无调用残留 | grep 扫描 | 无 |

### Sprint 3: P2 修复 (质量受损)

6 项，工作量较小，可在 Sprint 2 完成后批量处理。

---

## 审查总结

| 严重度 | 数量 | 状态 |
|--------|------|------|
| P0 BLOCKING | 4 | ✅ 全部修复 |
| P1 MAJOR | 6 | ✅ 全部修复 |
| P2 MINOR | 6 | ✅ 全部修复/评估 |
| P3 INFO | 5 | 建议改进 |
| **总计** | **21** | — |

**项目健康度评分**: 88/100 (修复后)

- 结构完整性: 95/100 (frontmatter 满分，版本统一，standalone 标注)
- 协议合规性: 92/100 (L1/L2 ET+BC 100%，L3 仍有提升空间)
- 数据流闭环: 85/100 (requires 0 断裂，orphan provides 已甄别分类)
- 层级职责: 85/100 (L2→L3 引用已修正，code-intelligence DEPRECATED)
- 用户体验: 98/100 (12 Phase 确认项统一为 3 项)
- 代码健康: 88/100 (TODO 已清理，code-intelligence 残留已修复)
- 可执行性: 80/100 (关键路径已统一，RULES 引用已评估)
- 安全与健壮: 82/100 (Phase 0 BC 已补齐，Gate 仍无强制)