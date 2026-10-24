# GO — DevFlow v3.3.1 统一路由器

> **AI指令**：
> 1. 本文件是 v3 路由入口，读完后按第四步路由表匹配用户意图
> 2. **第一条回复必须输出路由声明**（含选定的模式 Fast/Lean/Standard/Strict + 理由）
> 3. **所有产物必须保存到 `.devflow/<req-id>/` 下**
> 4. **⚠️ 所有产物必须严格按模板输出**（见 references/RULES-v3.md R19）
> 5. **协议权威性**：本文件是**操作路由**层；行为合规协议以 `SKILL.md` 的 `[R0]-[R7]` + 每条回复的 `[COMPLIANCE]` 声明为**唯一权威**。本文件与 `references/RULES-v3.md` 中的 "R1-R20" 是**详细规则集**，其编号空间与 `SKILL.md` 的 R0-R7 互补、互不冲突，请勿混用。
>
> 用户使用方式：`Use devflow` 或 `@devflow/SKILL.md` + 一句话需求

---

## ⚡ v3.2 交互模式（⭐核心原则）

**让用户少打字，多做选择题。**

```
❌ 错误：一次性抛给用户大量问题让用户自己组织答案
✅ 正确：批量展示进度 → 逐个提问（预设选项） → 更新进度 → 总结门控
```

### 标准交互流程（4步法）

1. **展示全局进度**：`[1/N] ● 已完成 / [2/N] ○ 当前 ← 正在提问`
2. **逐个提问，每题预设选项**：`[A]/[B]/[C]/[D]其他`
3. **用户回答后更新进度**，进入下一题
4. **全部完成后总结 + 门控确认**

### 选择题设计原则

| 场景 | 选项设计 | 示例 |
|------|---------|------|
| 严重程度 | 高/中/低 | 很痛/较痛/一般/不痛 |
| 频率 | 每天/每周/每月/偶尔 | 高频/中频/低频/一次性 |
| 技术选型 | 2-4个主流方案+自定义 | REST/GraphQL/gRPC/混合 |
| UI布局 | 视觉对比表 | 极简/卡片/表格/混合 |
| 优先级 | P0-P3分级 | P0-紧急/P1-重要/P2-一般/P3-优化 |
| 多选 | 可选多个 | 输入多个字母如 AC |

---

## ⚡ v3 执行流程（12步，模式自适应）

```
Step 0.5 · 模式预判定（入场检测之前）⭐v3.1
Step 1   · 读取项目状态 (.devflow/state.json)
Step 1.5 · 模式确认（路由声明，等用户确认）⭐v3.1移前
Step 2   · 入场检测（Fast/Lean简化，Standard/Strict完整）
Step 3   · GitNexus可选检测 (detect → prompt → grep fallback)

根据模式跳转到对应 Phase 起点:
  ┌─ Fast:     Phase 4→5→6（跳过 0-3，自检审查）
  ├─ Lean:     Phase 2→4→5→6→8（跳过 0-1/2a/3/7，轻量方案+归档LESSONS）
  ├─ Standard: Phase 0→1→1b→2→2a→4→5→6→7→8（跳过 3，完整流程）
  └─ Strict:   Phase 0→1→1b→2→2a→3→4→5→6→7→8（全量 Phase）

Phase 详细流程详见 docs/phases/（phase-0-strategy.md ~ phase-7-canary-archive.md）
```

---

## 🔍 快速索引

| 需要... | 读取... |
|---------|---------|
| v3架构设计 | `docs/ARCHITECTURE.md` |
| 模式判定规则 | `references/mode-rules.md` |
| 入场检测流程 | `references/entry-check.md` |
| 阶段门验证 | `references/gate-rules.md` |
| Token预算 | `references/token-budget.md` |
| v3规则集 R1-R20 | `references/RULES-v3.md` |
| **Phase 0: 战略 (种子捕获 → YC六问)** | `docs/phases/phase-0-strategy.md` |
| **Phase 1: 5Whys** | `docs/phases/phase-1-analysis.md` |
| **Phase 1b: 决策捕获** | `docs/phases/phase-1-analysis.md`（Phase 1b 章节） |
| **Phase 2: 方案设计** | `docs/phases/phase-2-design.md` |
| **Phase 2a: 设计枪战** | `docs/phases/phase-2-design.md`（Phase 2a 章节） |
| **Phase 3: 任务拆分** | `docs/phases/phase-3-tasks.md` |
| **Phase 4: 实施** | `docs/phases/phase-4-build.md` |
| **Phase 5: 测试** | `docs/phases/phase-5-test.md` |
| **Phase 6: 三层对抗审查** | `docs/phases/phase-6-review.md` |
| **Phase 7-8: Canary+归档** | `docs/phases/phase-7-canary-archive.md`（Phase 7、Phase 8 内容合并在同一文件） |
| L2 LearningWorkflow | `layers/L2-ENGINE/learning-workflow/_SKILL.md` |
| L2 Wave Executor | `layers/L2-ENGINE/wave-executor/_SKILL.md` |
| L2 PartyMode | `layers/L2-ENGINE/party-mode/_SKILL.md` |
| L3 DAG Router | `layers/L3-ARCHITECTURE/dag-router/_SKILL.md` |
| L3 Provider Gateway | `layers/L3-ARCHITECTURE/provider-gateway/_SKILL.md` |

---

## Step 1 · 读取项目状态

1. 尝试读 `.devflow/state.json`。不存在 → 运行 `devflow init` 创建
2. 关注字段：`mode`（模式）/ `currentPhase`（当前阶段）/ `gates`（已过门控）/ `skips`（--force 跳过的审计记录）
3. 如 `skips` 非空 → 输出审计提示（存在被强制跳过的门控，路由声明中必须标注）
4. **初始化记忆系统**（首次使用必跑）:
   - 检查 `.devflow/memory/` 是否存在
   - **如不存在** → 创建目录并初始化：
     ```
     .devflow/memory/
     ├── PROJECT_CONTEXT.md    # 项目背景
     ├── DECISIONS.md          # 历史决策
     ├── KNOWN_FAILURES.md     # 已知失败
     ├── LESSONS.md            # LearningWorkflow教训库
     └── domain-skills/        # 领域技能沉淀
     ```
   - **如存在** → 加载上述文件
5. **多项目支持**: 每个项目独立 `.devflow/` 目录，记忆系统按项目隔离

> **记忆管理架构**：DevFlow 不单独设 L3 `memory-manager` 模块。语义检索由 `layers/L3-ARCHITECTURE/vector-memory/`（SQLite + HNSW）承担，经验沉淀由 L1 Phase 8 归档到 `memory/LESSONS.md` / `memory/domain-skills/` 承担。详见 `layers/L3-ARCHITECTURE/_SKILL.md`。
6. **加载项目宪法** ⭐v3.3:
   - 检查 `.devflow/PROJECT_CONSTITUTION.md` 是否存在
   - **如存在** → 读取并加载到当前上下文（冲突时项目宪法 > CONSTITUTION.md）
   - **如不存在** → 路由声明中标注 `项目宪法: ⚠️ 未设置`

---

## Step 1.5 · 模式预判定 + 确认 ⭐v3.1

> **为什么移到入场检测之前**：入场检测深度依赖模式。先判定模式，避免浪费 Token。

**⚠️ 强制规则**：必须使用 `read_file` 工具读取 `mode-rules.md`。

**阈值表**（与 `lib/phase-engine.js` 的 `detectMode()` 单一来源一致）：

| 模式 | 文件数 | 行数 | 其他条件 |
|------|--------|------|---------|
| Fast | ≤2 | <50 | — |
| Lean | ≤5 | <300 | brownfield |
| Standard | ≤10 | <500 | — |
| Strict | 任意 | 任意 | 高风险 / 架构变更 / 数据模型变更 / >3 模块 |

1. **优先程序化判定**，避免凭感觉估规模：

```bash
devflow detect --files 3 --lines 120 --brownfield
# → 🎯 建议模式: LEAN
#    理由: 3 文件 / 120 行 / brownfield
#    命中规则: files<=5 && lines<300 && brownfield

devflow detect --files 1 --lines 10 --arch-change   # → STRICT
devflow phase --mode lean                            # 应用判定结果
```

未提供 `--files`/`--lines` 时按 `--risk` 降级：low → fast，其余 → standard。
空目录（greenfield：0 文件 0 行且非 brownfield）自动判定为 STANDARD — 从零开始必跑 Phase 0
（详见 `references/mode-rules.md`）

> **自动判定已落地**：`devflow init` 在未显式传 `--mode` 时会自动扫描当前项目规模并调用 `detectMode()` 判定模式（可用 `--mode` 覆盖），结果写入 `.devflow/state.json`。AI 直接进入 Step 1 读取 state.json 的 `mode` 字段即可，无需每次手动 `devflow detect`。

2. **输出模式确认**（必须停等用户）：
```
🎯 建议模式：<Fast/Lean/Standard/Strict>
   理由：<简要说明>

   其他可选模式：
   - Fast — ≤2 文件、<50 行、低风险
   - Lean — ≤5 文件、<300 行、brownfield 明确需求
   - Standard — 常规 feature，完整 Phase 流程
   - Strict — 高风险/架构变更/数据模型变更

   请确认或选择其他模式：
   1. ✅ <建议模式>（推荐）
   2. Fast
   3. Lean
   4. Standard
   5. Strict
```

3. **用户确认后才可继续后续步骤**

### 模式×前置步骤矩阵 ⭐v3.1

| Step | Fast | Lean | Standard | Strict |
|------|------|------|----------|--------|
| Step 1 读state.json | ✅创建缺失 | ✅创建缺失 | ✅必跑 | ✅必跑 |
| Step 1.5 模式确认 | ✅路由声明 | ✅路由声明 | ✅停等 | ✅停等 |
| Step 2 入场检测 | ⏭️跳过 | ✅简化 | ✅完整 | ✅完整 |
| Step 3 GitNexus | ⏭️跳过 | ⏭️跳过 | ✅执行 | ✅执行 |
| Phase 0 YC六问 | ⏭️跳过 | ⏭️跳过 | ⚠️条件跳过 | ✅必跑 |
| Phase 1 5Whys | ⏭️跳过 | ⏭️跳过 | ⚠️条件跳过 | ✅必跑 |
| Phase 2 方案设计 | ⏭️跳过 | ✅轻量 | ✅完整 | ✅完整 |
| Phase 4 实施 | ✅直接开始 | ✅直接开始 | ✅ | ✅ |
| Phase 5 测试 | ✅窄验证 | ✅窄验证 | ✅完整 | ✅完整 |
| Phase 6 审查 | ✅自检清单 | ✅自检清单 | ✅三层对抗 | ✅三层对抗 |
| Phase 7-8 | ⏭️跳过 | ✅归档到LESSONS | ✅完整 | ✅Canary+归档 |

**图例**: ✅必跑 | ⏭️跳过 | ⚠️条件执行

### Phase 0/1 条件跳过规则（Standard）⭐v3.1

**Phase 0 跳过条件**（满足任意2项即可）：
- ✅ brownfield 项目（已有代码库）
- ✅ 用户需求描述具体明确
- ✅ 任务是优化/修复/小功能
- ✅ 项目已有完整上下文
- ❌ "我想做一个XX"类从零开始 → 必跑

**Phase 1 跳过条件**（满足任意2项即可）：
- ✅ 需求有明确验收标准
- ✅ 技术方案无歧义
- ✅ 影响范围可控
- ❌ 需求包含"支持XX"但未列具体项 → 必跑5Whys追问

**引擎落地方式**：满足跳过条件并经用户确认后，执行 `devflow phase --set <目标Phase> --force` 显式跳过 —— 引擎会记录到 state.json 的 skips 数组（含越过的门控清单），且必须在路由声明的『前置裁剪』中标注。不加 --force 的前向跳跃会被门控拦截。

---

## Step 2 · 入场检测

**⚠️ 强制规则**：必须使用 `read_file` 工具读取 `entry-check.md`。

**模式适配**:
- **Fast**: 跳过入场检测，直接进入 Phase 4
- **Lean**: 简化入场检测 — 检查已有上下文，如可用则直接复用
- **Standard/Strict**: 完整入场检测流程

**检测结果框**（必须输出）：
```
┌─────────────────────────────────────────────┐
│  🔍 入场检测                                 │
├─────────────────────────────────────────────┤
│  检测结果：<情况 A/B/C/D/E/F/G>              │
│  项目类型：<brownfield / greenfield>         │
│  上下文文档：<路径 或 "无">                   │
└─────────────────────────────────────────────┘
```

**⚠️ 情况 B/C/D/E 必须等待用户回复**。情况 G（已有外部上下文）可直接复用。

---

## Step 3 · GitNexus可选检测

**触发条件**: Standard/Strict模式确认后执行（仅一次）

### 检测协议

```
Step 3.1: gitnexus --version
  ├─ ✅ 成功 → "GitNexus已就绪，启用高级代码理解"
  └─ ❌ 失败 → Step 3.2

Step 3.2: 一次性提示用户
┌─────────────────────────────────────┐
│ ⚠️ GitNexus 未检测到                 │
│                                     │
│ [1] 现在安装（推荐）                  │
│ [2] 跳过本次会话                     │
│ [3] 永久跳过，使用grep降级            │
└─────────────────────────────────────┘

Step 3.4: Grep降级声明
┌─────────────────────────────────────┐
│ 🔧 使用 Grep Fallback               │
│ 文件搜索: ✅ glob+grep              │
│ 调用链分析: ⚠️ grep -rn             │
│ 依赖影响追踪: 🟡 静态分析            │
└─────────────────────────────────────┘
```

---

## Phase 详细执行流程

各 Phase 的详细交互流程、产物模板和门控规则见 `docs/phases/`：

| 引擎 id | Phase | 文件 | 门控 | 核心内容 |
|---------|-------|------|------|---------|
| 0 | 战略 (种子捕获 → YC六问) | `docs/phases/phase-0-strategy.md` | G0 | 战略评估 + 种子捕获 + 范围界定 |
| 1 | 5Whys | `docs/phases/phase-1-analysis.md` | G1 + G2 | 需求澄清 + AC列表 + 范围确认 |
| 1.5 | 1b 决策捕获 | `docs/phases/phase-1-analysis.md`（Phase 1b 章节） | G2.5 | 技术选型选择题 + CONTEXT.md |
| 2 | 方案设计 | `docs/phases/phase-2-design.md` | G3 | DAG路由 + Provider智能路由 |
| 2.5 | 2a 设计枪战 | `docs/phases/phase-2-design.md`（Phase 2a 章节） | G3.5 | 设计变体对比表 |
| 3 | 任务拆分 | `docs/phases/phase-3-tasks.md` | G4 | Wave计划 + Kahn拓扑排序 |
| 4 | 实施 | `docs/phases/phase-4-build.md` | G5 | Wave执行 + Heartbeat检查点 |
| 5 | 测试 | `docs/phases/phase-5-test.md` | G6 | 测试进度面板 + 质量门 |
| 6 | 三层对抗审查 | `docs/phases/phase-6-review.md` | G7 | Blind/Edge/Acceptance三线并行 |
| 7 | Canary | `docs/phases/phase-7-canary-archive.md` | G7.5 | 灰度发布 |
| 8 | 归档 | `docs/phases/phase-7-canary-archive.md` | G8 | LESSONS沉淀 |

---

## 🧭 路由表

### A. 用户意图路由

| 用户说 | Phase | 依赖 |
|--------|-------|------|
| 有新想法想做件事 | Phase 0 (YC六问) | brainstorming, writing-plans |
| 恢复中断任务 | 按R1.5重启 | - |
| 不要进入workflow | 直接做，跳过 | - |
| 健康检查 | `devflow doctor` | 核心自检 |
| 架构梳理 | 走 Phase 2 方案设计 | design-and-architecture |
| 纯技术问题 | 直接回答 | - |
| 上传文档/PRD | 文档解析 → Phase 2 | writing-plans |
| 修复Bug | Fast模式 → Phase 4 | systematic-debugging |
| 优化/小功能(brownfield明确需求) | Lean模式 → Phase 2轻量 | - |

### B. 可选命令

| 命令 | Phase | 说明 |
|------|-------|------|
| "换个方案" | Phase 2a | 触发新设计变体 |
| "架构梳理" | 走 Phase 2 方案设计 | 架构梳理 |
| "扫描代码" | `devflow code --scan <目录>` | 入场扫描 |
| "我的需求变了" | Phase 0+1 | 归档旧Req，重新确认 |
| "继续" | 下一阶段Phase | 按顺序执行 |
| "caveman wenyan" | - | 通信压缩到最简 |
| "压缩文本" | `devflow caveman --compress [level]` | 手动触发压缩 (lite/full/ultra/wenyan) |
| "预算管理" | 参考 `references/token-budget.md` | Token 预算规则 (暂无独立 CLI) |

### C. 阶段门验证

**核心规则 (R4)**: 缺前置产物 → 不允许直接进入。

**阶段依赖**: `0→1→1b→2→2a→[3]→4→5→6→7→8`

**可选阶段**:
- **[2a] 设计枪战**: standard/strict 模式必跑；前端/UI 项目产出完整变体对比，其他项目可产出轻量变体记录
- **[3] 任务拆分**: 仅 strict 必跑（standard 及以下跳过，Phase 4 内联拆分）

---

## 🎯 路由声明模板

完成所有前置步骤后，输出：

```markdown
🎯 v3 路由声明

架构层: Layer 1(交互) → Layer 3(架构) → Layer 2(引擎)
阶段: Phase <N>
Mode: <Fast/Lean/Standard/Strict>
前置裁剪: <列出跳过的Step/Phase及理由>
入口门禁: GitNexus=<状态> | 入场=<结果> | Phase0=<跳过/必跑> | Phase1=<跳过/必跑>
上下文来源: <DevFlow CONTEXT.md / .workbuddy memory / CLAUDE.md / 手动指定>
项目宪法: ✅已加载 / ⚠️未设置(运行 devflow init 生成)
自检清单: 待执行
```

---

## 🔄 v1.0 向后兼容

| v1.0 特性 | v3.2.x 处理 |
|-----------|------------|
| Stage Skills (`skills/stage-skills/`) | 保留，内部重新路由到三层架构 |
| 记忆系统 (`memory/`) | 保留并扩展 LESSONS + domain-skills |
| Token压缩 (/caveman) | 保留，统一4级支持(lite/full/ultra/wenyan) |
| spec-kit集成 (Phase 2输入) | 保留，PRD桥接 |
| OpenSpec集成 (Phase 8归档) | 保留，proposal/design/tasks接口 |
| `references/gate-rules.md` | 保留 + R4升级 |
| `.devflow/` 产物 | **零改动**，v3直接读取 |

---

## 版本历史

### v3.3.1 (2026-10-24) — 门控强制硬化 + 全量审计修复
- **门控引擎**：`phase --set` 前向跳跃现在校验途经门控（防绕过整个门控体系）；`--force` 显式跳过记录到 state.json 的 `skips` 数组（审计可追溯）
- **产物先于声称**：`phase --output` 强制产物文件名等于该 Phase 预期产物名（如 02-design.md），目录冒充/README 冒充/无路径均拒绝
- **状态可靠性**：state.json 原子写（tmp+rename）；损坏时备份为 state.json.corrupt-* 后显式重建，不再静默清零
- **模式判定**：空目录 greenfield 自动判 STANDARD（从零开始必跑 Phase 0），不再误判 Fast
- **任务规划**：TaskPlanner 补齐依赖完整性校验、环检测、Kahn 拓扑排序，Wave 按最长依赖深度重算（缺失/非法 wave 字段自动纠正）
- **钩子诚实化**：console-log-check 发现残留非零退出（gate_fail 成立）；security-scan 改 advisory（默认不启用，强制需 ECC_ENABLE_INSAITS=1 + Python）；format-typecheck 回退 git 工作区信号；监控类钩子标注信号来源前提
- **适配器修复**：DSH cordis.patch.yml 包名修复；删除 cursor/hooks/ 死代码目录；codex/gemini/copilot/cursor 产物清单对齐权威定义；claude-code 事件名修正（Stop/PreCompact 等）+ 不再覆盖用户 settings.json；core-bridge 新增 CLI 入口与 CLAUDECODE 检测
- **文档一致性**：gate-rules 版本标签与依赖图、GO.md 阶段依赖/条件跳过落地方式/state 字段名、mode-rules greenfield 规则、cli-reference 全量对齐
- 测试 21 → 26 项（新增 setPhase 门控/outputWritten 校验/状态损坏恢复/残留传送/TaskPlanner/Memory 回归）

### v3.3.0 (2026-09-12) — 项目更名 DevFlow
- **品牌统一** — ForgeOS 正式更名 DevFlow，全仓 1333+ 处替换（含 bin/devflow.js、.devflow/ 目录约定）
- **功能零变更** — 纯更名版本，Phase 管线 / 门控 / 测试 21 项全部不变

### v3.2.2 (2026-05-20) — Scale & Revert Intelligence
- **scale-domain-adaptive** ⭐ 动态规划深度引擎 — 基于项目规模自动映射四级 Phase 流程
- **conductor-revert** ⭐ 逻辑单元回滚协议 — Git-aware 四阶段回滚，Track/Phase/Task粒度
- **hooks-chain-trigger** ⭐ One-to-Many/Many-to-Many 级联执行

### v3.2.1 (2026-05-20) — Runtime Intelligence Sprint
- **caveman-shrink** ⭐ MCP工具组压缩引擎 — 70-76% context节省
- **codegraph-bridge** ⭐ CodeGraph本地知识图谱桥接 — 94%工具调用减少
- **hooks-system** ⭐ 运行时钩子 (context-monitor/prompt-guard/phase-transition/tool-execution)
- **surface-switch** ⭐ 运行时技能簇切换 — `/devflow:surface [mode]`

### v3.2.0 (2026-05-20) — 交互模式重构 ⭐核心改动
- Phase 0-8 全部采用选择题交互（批量展示 → 逐个提问 → 更新进度 → 总结门控）

### v3.1.0 (2026-05-20) — 模式自适应
- **Lean 模式新增** + 模式预判定前置 + Phase 0/1 条件跳过

### v3.0.0 (2026-05-17)
- 三层架构路由 + 12步执行流程 + GitNexus可选检测
