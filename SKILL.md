---
name: devflow
version: 3.6.0
description: |
  DevFlow — 带门控强制的分阶段软件交付流程（Phase 0-8）。
  当用户要求按阶段推进开发、或在动手写代码前需要先做需求分析、方案设计、任务拆分时使用。
  触发场景：(1) 用户说"用 devflow"、"走流程"、"按阶段做"、"/devflow"；
  (2) 新功能或需求模糊，需要先追问澄清（5 Whys 根因追问）再设计；
  (3) 架构选型、技术方案比选，需要产出设计文档与变体对比；
  (4) 需要把需求拆成有依赖关系的任务（DAG / Wave 并行）；
  (5) 存量系统改造、架构变更、数据模型变更等高风险改动，需要先评估再实施；
  (6) 要求代码评审、安全审查、测试覆盖率核查、灰度发布或发布前检查清单。
  产物落地在 .devflow/，门控（Gate）未通过不得推进阶段。
  不适用：单行修复、纯问答、纯文档润色等无需流程约束的任务。
---

# DevFlow v3.6.0 — AI 开发操作系统

> DevFlow Phase 管线 + Gate 门控 + 3 级运行时，零外部依赖自包含架构。
> 所有文件在 devflow 目录内，无外部引用。

## AI 执行协议（必须遵守，违反即违规）

任何 AI 使用 DevFlow 时，**必须**按以下顺序执行。省略任何一步均视为履约违规。

```
[R0] 加载 SKILL.md → 读取域路由 + 模式判定规则
[R1] 加载 GO.md → 输出路由声明（第一条回复必须包含）
[R2] 按模式匹配 Phase 路径（Fast/Lean/Standard/Strict）
[R3] 在每个 Phase 转换前：调用 phase-engine.js 验证门控状态
[R4] 产出后：调用 phase-engine.js outputWritten() 标记门控通过（manual 主门控需 --note 用户确认凭证）
[R5] 推进 Phase 前：调用 phase-engine.js nextPhase()
[R6] 每个 Phase 完成时：运行测试/验证（test/all.js / doctor）
[R7] 归档：Phase 8 必须产物到 LESSONS.md + Domain Skills
```

**规则编号说明**: 本文件的 `[R0]-[R7]` 是**行为合规协议**（强制、与 `[COMPLIANCE]` 声明绑定）。GO.md 与 `references/RULES-v3.md` 使用独立的 "R1-R20" 详细规则编号，二者互补、不在同一编号空间，请勿混淆。

**违反后果**: AI 跳过上述任意一步，用户有权要求回滚到上一个合规检查点。
**强制检查点**: 每条回复末尾必须包含 `[COMPLIANCE]` 声明（见底部模板）。

---

## 🧠 域路由

| 意图 | 路由到 |
|------|-------|
| 代码查询? | `domains/code-intel/_SKILL.md` |
| 设计方案? | `domains/specification/_SKILL.md` |
| 开发执行? | `domains/execution/_SKILL.md` → Phase 管线 |
| 专家意见? | `domains/expertise/_SKILL.md` |
| 记忆存储? | `domains/memory/_SKILL.md` |
| 钩子检查? | `domains/hooks/_SKILL.md` |

## ⚡ 模式判定 (来自 DevFlow)

| 模式 | 触发条件 | 流程 |
|------|---------|------|
| **Fast** | ≤2文件, <50行 | Phase 4→5→6(自检) |
| **Lean** | ≤5文件, <300行 | Phase 2(轻量)→4→5→6→8 |
| **Standard** | ≤10文件, <500行 | Phase 0→1→1b→2→2a→4→5→6→7→8 |
| **Strict** | >3模块/架构变更 | 全量 Phase 0→8 + 专家域 |

> 详细判定 → `references/mode-rules.md`

## CLI

```bash
npm install -g devflow
devflow init --mode standard   # 初始化管线
devflow status                 # 状态检查
devflow gates --phase 5        # 门控检查 (含 G6 AC 覆盖率 ≥90% + 模板必填段落)
devflow guard --tool Write --file-path src/a.js  # 通用守卫判定 (exit 0/2, 契约见 docs/INTEGRATION.md)
devflow git start req-001      # req 工作分支 + 产物提交链路
# 所有命令参考: docs/cli-reference.md
```

## 三级运行时 (来自 DevFlow)

| 级别 | 检测条件 | 能力 |
|------|---------|------|
| **L0** | 无 Node.js / Copilot / Gemini CLI | 纯 Markdown 指令 + SKILL.md 规则 |
| **L1** | Node.js + Claude Code / Cursor | phase-engine.js + hooks/scripts/ 执行 |
| **L2** | L1 + CodeGraph / SQLite | 知识图谱桥接 + 完整集成 |

> 降级规则：不报错、不阻塞。L0 环境用 Markdown 指令，L1/L2 自动启用 JS 内核。
> 前置条件：L1/L2 需要 **Node.js ≥ 18**（`devflow doctor` 自动校验运行时版本）；未安装或版本不足时降级 L0。

## 强制行为约束 (R1-R7, 来自 DevFlow)

| # | 规则 | 说明 | 违反后果 |
|---|------|------|---------|
| R1 | 先路由后执行 | SKILL.md → 匹配意图 → 再执行对应 Phase | 用户有权要求终止当前操作，回退到路由步骤 |
| R2 | 渐进式披露 | Phase 0-8 按需加载，不一次性展开 | 视作 Token 滥用，用户可要求立即压缩 |
| R3 | Token 监控 70%/90% | >70% 提示压缩，>90% 触发 Caveman 压缩 | 超过 90% 用户可拒绝继续对话 |
| R4 | 选择题优先 | GO.md Step 2: 给用户预设选项[A]/[B]/[C] | 用户可要求重新提问 |
| R5 | Gate 声明式验证 | `references/gate-rules.md` 定义"跳过条件",`lib/phase-engine.js` 自动阻止非法推进 | phase-engine **不会**推进未通过门控的 Phase：`--next` 校验当前门控，`--set` 前向跳跃校验途经门控 |
| R6 | 门控不阻塞用户 | Fast/Lean 例外规则 + 用户显式 skip 优先于自动检查 | 跳过必须用 `--force` 显式声明：引擎会记录到 state.json 的 `skips` 数组（含越过的门控），并在路由声明中标注 |
| R7 | 单一来源 of truth | references/templates/ (32个) 是权威模板, domains/specification/templates/ 是简化版 | 不一致时以 references/templates/ 为准 |

> R8-R11 → `layers/L2-ENGINE/hooks-system/_SKILL.md`（钩子系统规则）

## 📂 按需加载指南 (Phase × 必须/推荐)

每个 Phase 只在需要时加载对应文件，避免一次性注入所有上下文。

### 核心文件 (每个 Phase 必须)

| 文件 | 何时加载 | 说明 |
|------|---------|------|
| `SKILL.md` | 始终 | 路由 + 约束 + 模式判定 |
| `GO.md` | 始终 | 交互协议路由器 |
| `lib/phase-engine.js` | Phase 进入时 | 门控流转 + 进度计算 |

### Phase 按需加载矩阵

> **命名对照**：引擎 `phase-engine.js` 用数字 id 排序（0 / 1.5 / 2.5），文档用 `1b` / `2a` 称呼同一阶段。
> 下表同时给出两者，避免歧义。

| 引擎 id | 文档名 | [必须] 文件 | [推荐] 文件 |
|---------|--------|-----------|-----------|
| **0** | Phase 0 | `layers/L1-INTERACTION/phase-0-strategy/_SKILL.md` → `phase-0-yc-strategy/_SKILL.md` | `domains/specification/_SKILL.md`, `docs/phases/phase-0-strategy.md` |
| **1** | Phase 1 | `layers/L1-INTERACTION/phase-1-5whys/_SKILL.md` | `docs/phases/phase-1-analysis.md` |
| **1.5** | Phase 1b | `layers/L1-INTERACTION/phase-1b-discuss/_SKILL.md` | `docs/phases/phase-1-analysis.md` (Phase 1b 章节) |
| **2** | Phase 2 | `layers/L1-INTERACTION/phase-2-design/_SKILL.md` | `docs/phases/phase-2-design.md`, `domains/code-intel/_SKILL.md` |
| **2.5** | Phase 2a | `layers/L1-INTERACTION/phase-2a-shotgun/_SKILL.md` | `docs/phases/phase-2-design.md` (Phase 2a 章节) |
| **3** | Phase 3 | `layers/L1-INTERACTION/phase-3-task-plan/_SKILL.md` | `docs/phases/phase-3-tasks.md` |
| **4** Build | `layers/L1-INTERACTION/phase-4-build/_SKILL.md` | — |
| **5** Test | `layers/L1-INTERACTION/phase-5-test/_SKILL.md` | `docs/phases/phase-5-test.md`, `references/test-pyramid.md` |
| **6** Review | `layers/L1-INTERACTION/phase-6-review/_SKILL.md` | `docs/phases/phase-6-review.md`, `references/ui-anti-patterns.md` (前端项目), `layers/L1-INTERACTION/phase-6-review/reviewer/_SKILL.md` (审查详情) |
| **7** Canary | `layers/L1-INTERACTION/phase-7-canary/_SKILL.md` | — |
| **8** Archive | `layers/L1-INTERACTION/phase-8-archive/_SKILL.md` | `layers/L1-INTERACTION/phase-8-archive/memory-keeper/_SKILL.md` (知识蒸馏) |

> **Phase 0 的两个技能是串联子步骤，不是两个 Phase**：
> `phase-0-strategy`（创意捕获 / 种子 / 范围界定）→ `phase-0-yc-strategy`（YC 六问可行性验证）。
> 引擎中只有**一个** Phase 0（name: `YC六问战略评估`），`phase-0-yc-strategy` 的 frontmatter
> 已声明 `dependencies: [phase-0-strategy]`。按顺序依次执行两个技能，产出 `00-strategy.md` 后过 G0。

### 门控检查加载

| Gate | [必须] 文件 |
|------|-----------|
| G0-G8 + G2/G2.5/G3.5/G7.5 | `domains/hooks/gate-check.js` (L1+) ⚠️, `references/gate-rules.md` (L0) ✅ |

### 参考文件 (仅特定场景)

| 文件 | 触发条件 |
|------|---------|
| `references/RULES-v3.md` | Strict/Audit 模式 |
| `personas/core/*.md` | 多角色协作 / Agent 角色定义（core 8 + extended 12 技术栈 + cavecrew 3） |
| `references/prompts/*.md` | Phase 交互模板 |
| `domains/memory/_SKILL.md` | Phase 8 / 跨会话 |
| `domains/expertise/_SKILL.md` | 专家审查触发 |

> ⚠️ `domains/hooks/gate-check.js` 存在但 frontmatter 不规范; `references/gate-rules.md` ✅ 已确认存在
> **加载原则**: L0 环境只加载 Markdown；L1+ 加载 JS 内核 + hooks；仅 Strict 模式加载全量 references。

---

## ✅ 合规声明模板（每条回复必须包含）

AI 在每条回复末尾输出以下合规声明，证明本次操作遵循了 DevFlow 协议：

```
[COMPLIANCE]
  Phase: <当前 Phase 编号>
  模式: <Fast/Lean/Standard/Strict>
  门控状态: <已通过 GX | 等待用户确认 GY | Gate FAIL — 见理由>
  产出记录: <本次操作创建的产物文件名，无则为 "—">
  上次验证: <test/all.js / doctor / gate-check.js 的最近运行时间>
  强制检查点: <R0 R1 R2 R3 R4 R5 R6 R7 — 标注本次触发了哪些>
```

**缺少此声明 → AI 操作不可信，用户应要求补全后再继续。**
