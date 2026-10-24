# DevFlow 变更日志

所有重要变更记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/)。

---

## [3.6.3] - 2026-10-24

### Changed — GitNexus 引导安装优先，降级须用户知情

- **GO.md Step 3 检测协议重写**：检测失败不再允许静默降级——Step 3.2 改为**安装引导（必须停等）**：展示能力价值（调用链追踪/影响分析/语义搜索）+ 具体安装命令（`npm install -g gitnexus`，Node.js ≥ 22）；新增 Step 3.3 安装执行与复检（成功提示首次需 `gitnexus analyze` 建索引，失败给排障提示后允许重试）；Step 3.4 Grep 降级**仅在用户明确选择跳过或安装失败且放弃后**才进入，路由声明标注"已引导安装，用户选择跳过"
- **RULES-v3 R12 重写**：R12.1 降级前置条件（引导先行，禁止静默降级）；R12.2 降级标注要求；新增 R12.4「永久跳过」须用户显式声明，AI 不得代答，未标记永久跳过的项目下次 Standard/Strict 会话重新检测
- **gitnexus-bridge/_SKILL.md 降级策略**：同步写入降级前置条件块
- **doctor 新增 GitNexus 可发现性检查**（advisory，不计失败）：未安装时直接给出 `npm install -g gitnexus` 安装入口——流程外（doctor）也能发现可选增强

## [3.6.2] - 2026-10-24

### Changed — 入场检测/上下文路径全仓对齐 + entry-check CLI 接线修复

- **CONTEXT.md 路径统一**：全仓 22 处 `.devflow/CONTEXT.md` 统一为 canonical `.devflow/memory/CONTEXT.md`（与 `lib/entry-check.js` CONTEXT_CANDIDATES 及 init 骨架一致），覆盖 11 个 prompt（1-analysis / 2-design / 2a-ui-design / 3-task / 4-dev / 6-review / 7-integration / A-architect / A-evolve / M-health / I-intel-scan）+ 7 个模板 + phase-3-task-plan 等技能文件——修复"AI 按 prompt 写 `.devflow/` 根 → 引擎查不到 → 入场检测永远判情况 E"的路径分裂
- **STATE.md 双层定位**（v3.6.2 判定依据对齐收尾）：`templates/STATE.md` 与 `schema-definitions/STATE.md` 声明"`.devflow/state.json` = 引擎独占机器状态单一来源，STATE.md = AI 叙事层"；剔除模板内废弃字段 `ai_context_doc` / `last_intel_scan`（改为指向 `devflow entry-check --set-doc` / `--record-scan`）；2-design / 4-dev 的上下文文档读取改走 `state.json` 的 `aiContextDoc`（或 `devflow entry-check --json`）
- **I-intel-scan 文档对齐**：14 处旧机制引用（STATE.md / last_intel_scan / ai_context_doc / `@devflow/templates/` / flow-kit 品牌）对齐 v3.6.2 机制
- **品牌清理**：0-confirm / frontend-engineer-rules / template-check 注释的 flow-kit 残留；`runtime-adapters-devflow.md` 标注为历史设计文档

### Fixed

- **entry-check CLI 接线**：CMDS 表键 `entryCheck`（驼峰）与用户输入 `entry-check`（连字符）不一致导致"未知命令"——补别名映射 + 状态守卫白名单加入 `entry-check`

### Tests

- 36 → 37 项（新增：入场检测七情况 + 模式适配 + CLI 落库）

## [3.6.1] - 2026-10-24

### Added — ZCode 真实拦截接入

- **`devflow install --target zcode`**（新增 hooks-only 安装目标）：按 ZCode 官方契约（zcode-configuration-guide 验证）把写入守卫注册进 `~/.zcode/cli/config.json` 的 `hooks.events.PreToolUse` —— `type: "process"`（无 shell，跨平台）、matcher 覆盖 `Write|Edit|MultiEdit|NotebookEdit|Bash`（含 ApplyPatch 别名）、**exit 2 = deny 与守卫同款契约**；自动开启 `hooks.enabled`（ZCode 配置文件 hook 默认禁用）；托管识别/幂等/写前备份/可卸载与 Claude 目标同标准
- **ZCode 特化**：只注册 PreToolUse 拦截，不注册 Stop 提醒 —— ZCode 的 hook stdout 走严格 JSON schema，多余键（systemMessage）会被判失败
- **WorkBuddy 接入状态明确化**（`docs/INTEGRATION.md`）：其 settings.json 无 hook 生命周期 —— 技能层经 junction 全量生效、提交侧 git 兜底可用；写入级真实拦截需在其源码的工具执行路径加契约一的进程内调用（约 10 行），安装输出已附指引
- doctor 新增"ZCode 写入守卫注册"健康检查；`install --list` 显示 ZCode 注册状态
- 修复 `checkClaudeHooks` 脚本存在性检查路径（v3.6.0 安装时发现）

### Tests

- 35 → 36 项：ZCode 托管合并（enabled 强制翻转 / process 形状 / 幂等 / 用户 mcp+plugins 配置保留 / 备份写盘 / 卸载）

---

## [3.6.0] - 2026-10-24

### Added — 通用接入方案（一个内核 + 三种传输 + git 兜底）

- **`devflow guard` 统一守卫入口**：argv 模式（`--tool/--file-path/--command`）与 stdin JSON 模式（与宿主 hook 契约同形 `{tool_name, tool_input}`）双模式，exit 0 = 放行 / **exit 2 = 拦截**（理由在 stderr）——任何"能在动作前跑一条命令"的 AI 编码工具都可接入，无需各自的适配器代码
- **git hooks 兜底拦截** `devflow git install-hook` / `uninstall-hook`：写入 `.git/hooks/pre-commit`（state.json 健康 + devflow 分支链路检查）与 `commit-msg`（`devflow/<req-id>` 分支提交必须 `devflow(<req-id>): <说明>`，Merge 豁免）——**唯一不依赖宿主工具配合的无死角拦截层**（所有工具提交必经 git）；已存在非 DevFlow 的同名 hook（husky 等）拒绝覆盖并给出手工共存指引；卸载只删带 `devflow-managed` 标记的文件
- **`docs/INTEGRATION.md` 集成契约**：write-guard 纯函数签名与规则表、state.json schema、事件日志类型、CLI 退出码表、hook stdin/stdout 协议、四档接入清单（自研进程内 require / hook 系统 / guard CLI / git 兜底）——自研工具照契约实现一次即获得全套强制力
- 测试 33 → 35 项：guard CLI 双模式退出码契约（argv 拦截/放行、stdin、R0）、git hooks 真实仓库端到端（安装/外部 hook 保护/三项检查/**真实 git commit 被拦截与放行**/卸载）

---

## [3.5.0] - 2026-10-24

### Added — 真实拦截层（借鉴 AI-DLC 架构思想，保持零依赖轻量定位）

- **阶段感知写入守卫** `lib/write-guard.js` + `hooks/scripts/phase-write-guard.js`：流程纪律从"AI 自愿调用引擎校验"升级为"违规写入在工具调用层被真实拒绝"。注册进宿主 PreToolUse 生命周期后（exit 2 = 拒绝本次工具调用）：Phase < 4 拦截源代码写入（fast 模式起点即 Phase 4，天然豁免；拦截消息含正确路径与逃生阀指引）；`.devflow/state.json` 与 `state-events.jsonl` 引擎独占（防手改状态绕过门控）；`devflow/<req-id>` 分支上的 git commit 格式守卫（引导用 `devflow git checkpoint`）。守卫自身异常一律 fail-open
- **人工门审批凭证**：manual 门控（G2/G2.5/G3/G3.5/G5/G7/G7.5）必须 `--note "<用户原话或确认摘要>"` 才能标记通过，凭证 sha256 哈希入 `state.approvals` 账本（`devflow phase --gate G3 --note "..."` / `--output ... --note "..."`），无凭证直接拒绝 —— 堵死"AI 自批门控"。outputWritten 语义升级：产物是过门的必要条件而非充分条件（manual 主门控的 Phase 仍需凭证；auto 门 G0/G1/G4/G6/G8 不变）
- **追加式事件日志** `state-events.jsonl`：约 10 类状态变更事件（MODE_SET/GATE_PASSED/GATE_APPROVED/SKIP_FORCED/PHASE_ADVANCED/OUTPUT_RECORDED/NEXT_BLOCKED/STATE_CORRUPTED 等）原子追加；`devflow phase --journal` 查看审计时间线；**state.json 损坏时自动从日志重建**（先备份再回放，重建结果立即持久化）
- **Claude 托管注册** `lib/claude-hooks.js`：`devflow install --target claude` 通过托管段合并把守卫写入 `~/.claude/settings.json` —— 识别标识为 command 含 phase-write-guard.js 的条目，幂等（重复安装不叠加）、保留用户已有 hooks、写前备份 settings.json.devflow-bak、卸载只删托管条目；配置不可解析时拒绝修改
- **适配器生成器** `scripts/gen-adapters.js`：四个 adapter 文档的产物清单块与 `adapters/claude-code/hooks.json` 整文件均从 phase-engine 权威定义生成（标记块 `devflow:generated:artifacts`），`--check` 漂移检测进入测试 —— 此前两次人工审计修复的适配器漂移从此在机器层被拦住
- **Stop 温和提醒**：守卫的 stop 模式在有未关门控时注入 systemMessage 续跑提醒（不阻断，与 aidlc 的强制 continue-workflow 区分定位）
- **doctor 增强**：新增"写入守卫"可加载检查与"Claude 写入守卫注册"健康检查（未注册为可选提示）

### Tests

- 30 → 33 项：写入守卫 13 例判定矩阵（含 Windows 路径形态）、Claude 托管合并（幂等/用户配置保留/旧条目替换/卸载/备份）、生成器零漂移检测、审批凭证语义（manual 缺凭证拒/auto 免凭证）、损坏 → journal 重建

---

## [3.4.1] - 2026-10-24

### Fixed — Phase 子技能契约与质量（14 文件全量审计修复）

- **产物名契约（阻断级）**：phase-4 声明不写产物但引擎要求 04-wave-logs.md、phase-8 全篇无 08-archive.md、phase-2a 写 02a-design-variants.md、phase-1b 写 CONTEXT.md —— 四者按字面执行会在 outputWritten() 硬校验处必然 FAIL，全部对齐引擎 PHASES；phase-5 产物目录 .devflow/test/ 会绕过 ac-coverage.js 的 AC 源定位，改为 .devflow/<req-id>/
- **门控编号卫生**：phase-0-yc 正文 4 处 G1→G0；phase-1b 子门 G1-G5 改"检查项 1-5"（消除与全局门控冲突）；phase-4 "Integration Gate"→"Build Gate"（含 L1 README）；phase-5 自创 G6.5 改为 G6 内部子检查标注
- **模板库补齐**：新增 00-strategy/01b-context/02a-variants/04-wave-logs/06-review/07-canary/08-archive 七个 R13.11 双载体模板（总数 32），引擎 11 个产物名模板首次全覆盖；旧 04-dev-log/06-code-review/07-release-checklist 头部标注弃用；references/prompts/ 四文件（4-dev/6-review/7-integration/8-archive）产物名映射到新契约
- **内容质量**：phase-2-design 补 6 步执行步骤+AskUserQuestion 权限+删除不合理 15min 超时；phase-3 接线 devflow task --file 机器校验并标注 4 项人工核验项；phase-1 内联模板 AC 格式对齐 ### AC-N（修复 G6 覆盖率解析）；reviewer(L2-ENGINE executor/wave-executor 同病) 数据约定适配 DevFlow 布局；phase-0-yc/1b/2a/6/7 与 docs 五处阈值/退回路径/步骤引用矛盾消除；phase-6-review dependencies 指向真实技能
- 14 个子技能 frontmatter 版本戳 3.0.0 → 3.4.0，缺失字段（preamble-tier/dependencies/allowed-tools/triggers）补齐

## [3.4.0] - 2026-10-24

### Added — 内容级门控与 Git 链路（功能补齐三件套）

- **AC 覆盖率检查器** `lib/ac-coverage.js`：G6 的 "AC 覆盖率 ≥ 90%" 从纸面声明变为机器度量。解析 01-analysis.md 的 `### AC-N` 清单与 05-test-report.md 的用例映射表（1.1 测试矩阵 + 新增测试登记），覆盖率不足阈值或存在 ❌ 状态用例即 FAIL；Fast/Lean 模式无 01-analysis.md（无 AC 来源）时显式豁免。CLI：`devflow gates --ac <目录>`
- **模板内容校验** `lib/template-check.js`：R13.11 双载体清单机器化。以 references/templates/ 模板自带的 `<!-- 必填段落清单 -->` 注释为单一来源（零副本），校验产物包含全部必填段落标题且无未替换 CJK 占位符（`<角色>`/`<req-id>` 等）。CLI：`devflow gates --template <文件>`；`devflow gates --phase N` 自动对每个产物执行
- **Git 链路** `lib/git-bridge.js` + `devflow git` 子命令：req-id ↔ 分支（`devflow/<req-id>`）↔ 提交（`devflow(<req-id>): <说明>`）链路自动化。start 创建分支并写 `.devflow/<req-id>/git.json`；checkpoint 只 stage `.devflow/` 流程产物（绝不自动提交源代码）；verify 检查分支约定/链路记录/未提交产物
- `gate-check.js` 的 `checkGate()` 新增可选 `{ content: true }` 内容级检查（CLI gates 路径启用；G6 联动 AC 覆盖率），默认存在性口径不变 —— adapters/core-bridge 契约不受影响
- doctor 新增 3 项检查（AC 覆盖检查器/模板内容校验/Git 链路桥接）；HELP/文档全量更新

### Tests

- 26 → 30 项：AC 覆盖率 4 场景（75% 拦截/❌用例拦截/100% 通过/无 AC 来源豁免）、模板校验 4 场景（全段落/缺段/占位符/无模板豁免）、真实临时 git 仓库上的 start-checkpoint-verify 链路、gate-check 内容级生效 + adapters 存在性口径兼容回归

---

## [3.3.1] - 2026-10-24

### Fixed — 门控强制硬化（高严重度）

- `phase --set` 前向跳跃此前不校验途经门控，可从 Phase 0 无 `--force` 直达 Phase 4 绕过 G0-G3.5；现与 `--next` 同受门控拦截，`--force` 为显式逃生阀并记录到 state.json 的 `skips` 数组（含越过门控清单）
- `phase --output` 此前 filePath 可省略、只查文件存在不校验产物名（README.md/目录可冒充）；现强制：路径必填 + 文件存在且为普通文件 + basename 必须等于该 Phase 预期产物名
- state.json 此前非原子写（并发可截断）且损坏时静默清零全部门控历史；现 tmp+rename 原子写，损坏时备份为 `state.json.corrupt-*` 后显式重建
- `devflow init` 在空目录把"改动规模阈值"误用于"仓库规模"，全新项目被误判 Fast（从 Phase 4 开始）；现 greenfield（0 文件 0 行非 brownfield）判 STANDARD，与 GO.md"从零开始必跑 Phase 0"一致
- TaskPlanner 此前无环检测/无拓扑排序（GO.md 承诺的 Kahn 不存在），tasks.json 缺 wave 字段时静默产出 `wave: NaN`；现依赖完整性校验 + 环检测 + Kahn 拓扑 + 按最长依赖深度重算 Wave
- 被跳过 Phase 的门控不再误拦 `nextPhase()`（模式切换残留场景正确传送到模式起点）

### Fixed — 钩子诚实化

- console-log-check 此前只警告恒 exit(0)，与 hooks.json 注册的 `gate_fail` 矛盾；现发现残留非零退出
- security-scan 默认禁用却注册为 G6/G7 强制门控（恒放行）；注册语义改为 advisory 并注明启用前提（ECC_ENABLE_INSAITS=1 + Python 3.9+）
- format-typecheck 依赖的会话累加器写入方不存在于本仓库，恒空转；现缺失时回退 git 工作区改动信号（与 console-log-check 同口径）
- insaits-security-wrapper.js 与 security-scan.js 逐字节重复，前者改为别名入口（单一实现）
- token-monitor/context-monitor 注册描述补充信号来源前提（无 harness 信号时为 no-op）

### Fixed — 适配器

- DSH `cordis.patch.yml` 裸包名 `dsh-devflow` 会导致 DSH 启动中断，改为 `./plugins/dsh-devflow`（与 install.md 一致）
- 删除 `adapters/cursor/hooks/` 整目录死代码（脚本路径全部断链且与"Cursor 不支持原生 hook"自相矛盾）
- codex/gemini/copilot/cursor 四处产物清单漂移（00-requirements.md 等旧名）对齐 phase-engine 权威定义
- claude-code 适配器：非法 `PreCommit` 事件名修正为 Stop/PreCompact 等真实事件；install 指南不再整文件覆盖用户 `.claude/settings.json`（改为合并 hooks 段）；`DevFlow_HOME`/`DEVFLOW_HOME` 变量名统一
- core-bridge.js：claude-code 检测改用真实存在的 `CLAUDECODE=1`；新增 `detect-runtime`/`read-state` CLI 入口（四处文档示范的命令此前静默无输出）；findArtifact 候选顺序与 gate-checker 统一；gate-checker 对 phase-engine 的 require 增加静态兜底（adapters 可独立拷贝）
- harnesses/install.js：`--list`/`--status` 对损坏链接不再崩溃；陈旧文件清理同时移除残留空目录

### Changed — 文档一致性

- references/gate-rules.md：头部 v3.2 版本标签更新；依赖图 Phase 1 补画 G2；Phase 2a"可选"表述修正为 standard/strict 必跑
- GO.md：Step 1 状态字段名对齐 state.json 真实字段（mode/currentPhase/gates/skips）；Phase 0/1 条件跳过补引擎落地方式（`--set --force` + skips 审计）；阶段依赖补 1b、修正 2a/3 可选性表述；greenfield 判定入 Step 1.5
- docs/cli-reference.md 与实际 CLI 全量对齐（--version/--help、phase --set 门控行为、phase --output 产物名校验、task --file/--save/--json、mem --recent、init greenfield）
- CONSTITUTION.md 谱系标注、根 README 安装目标现状、mode-rules greenfield 规则、hooks/markdown-hooks.yaml 与 hooks.json 语义同步

### Tests

- 21 → 26 项：新增 setPhase 前向门控拦截+审计、outputWritten 产物名校验、state.json 损坏备份重建、残留 Phase 传送、TaskPlanner 环检测/Kahn/Wave 重算、Memory id 唯一+访问统计持久化

---

## [3.3.0] - 2026-09-12

### Changed

- **项目更名 DevFlow** — ForgeOS 正式更名回 DevFlow（github.com/zgcgreat/devflow），本仓库为 DevFlow v3 系列的唯一延续
- 全仓品牌替换 1333+ 处：ForgeOS→DevFlow、forge-os→devflow、.forgeos/→.devflow/、FORGEOS_→DEVFLOW_
- 文件重命名：`bin/forge-os.js` → `bin/devflow.js`、`references/runtime-adapters-forge.md` → `references/runtime-adapters-devflow.md`
- 内部标识符统一：`FORGE_OS_HOME`/`FORGE_DIR`/`forgeDir` → `DEVFLOW_HOME`/`DEVFLOW_DIR`/`devflowDir`，`ForgeMemory` → `DevFlowMemory`
- 本地运行时目录由 `.forgeos/` 变更为 `.devflow/`（升级后需重新 `devflow init` 或改名现有目录）

---

## [Unreleased] - 2026-09-12

### 发布准备与质量清理

#### 深度审计修复（2026-08-29）
- 修复 5 个致命 bug：模式检测 `detectMode`、Phase 序列合法性、门控分离（G1/G2）、路径处理、状态守卫
- 测试由 16 → 21 项真实通过（原 6 项假测试全部替换为真实断言）
- 补建 WIP checkpoint 模块（`layers/L2-ENGINE/wip-checkpoint/`）
- `doctor` 健康自检 10/10 通过，全部入库（commit 222a55d）

#### 架构层索引与发布清理（2026-09-12）
- 重写 L3 架构层索引：列出全部 13 个真实模块，标注弃用（`code-intelligence`）与幽灵条目（`memory-manager` 从未实现，职责由 `vector-memory` + Phase 8 承担）
- `init` 自动判定模式：未显式 `--mode` 时扫描项目规模自动选择 fast / lean / standard / strict
- `FUSION-PLAN.md` 悬空引用清理：3 处引用改为「已并入 SKILL.md / gate-rules.md」
- `sources/` 标注 reference-only（第三方摘抄，非运行时依赖）
- L3 全部 13 模块 frontmatter 加 `implementation: spec-only/code/deprecated` 标注
- 删除 `sources/` 及历史审计/规划工作文件（`FULL-AUDIT-REPORT` / `AUDIT-REPORT` / `INTEGRATION-PLAN` / `DEEP-AUDIT` / `M7-VERIFICATION` / `ENHANCEMENT-BACKLOG` / `FUSION-PLAN`），本 CHANGELOG 作为唯一历史源

---

## [3.2.2] - 2026-06-20

### 全面质量修复

#### 变更

- **品牌名统一** — FlowForge/flowforge/@devflow-kit 全部替换为 DevFlow/devflow/@devflow（~500+ 处）
- **断裂链接修复** — ARCHITECTURE.md、SKILL.md、plan-phase.md 中所有断裂引用修复
- **门控检查增强** — gate-check.js 新增 G8（空目录检查），Phase 感知自动加载矩阵完善
- **MCP 工具加载优化** — Phase 7/8 禁用大部分 MCP 工具，Token 节省 ~1.5K/次
- **文档精简** — SKILL.md 1249→623行, _SKILL.md 平均精简~75%
- **CONSTITUTION 统一** — 删除 L2 重复版，保留根目录权威版，所有引用统一指向 `RULES.md`

---

## [3.1.0] - 2026-06-19

### Phase B/C 融合方案实施

#### 新增

- **SKILL.md 按需加载矩阵** — Phase × 必须/推荐文件映射，L0/L1+ 分级加载
- **Gate Hook 推荐增强** — G5/G6/G7 根据项目复杂度动态调整建议（Fast/Lean/Standard/Strict）
- **Phase 8 知识蒸馏优化** — Crystallize 从"收集所有经验"→"只蒸馏可迁移模式"（信息密度提升 ~3×）
- **domains/ 目录重组** — code-intel, execution, expertise, hooks, memory, specification 按职责归类

#### 变更

- **12个 _SKILL.md 精简** — phase-4-build/5-test/6-review/7-canary/token-monitor/surface-switch/hook-bridge/debugging-workflow 等平均精简 ~75%
- **CONSTITUTION 体系统一** — L2 CONSTITUTION.md → .devflow 目录, phases CONSTITUTION → domains/specification/templates/
- **adapters/ 品牌统一** — devflow.mdc → devflow.mdc, DevFlow→DevFlow

---

## [3.0.0] - 2026-06-18

### DevFlow × DevFlow 融合方案 v2.0 实施

#### 新增

- **Gate 门控增强** — G8 空目录检查, Phase 感知加载矩阵
- **MCP 工具三级瘦身** — Core/Standard/All, Phase 自动调整
- **双通道自进化完善** — LESSONS → Domain Skills → 执行轨迹学习完整链路
- **Delta Specs v1.0** — 版本控制: base-version/author/status + ADDED/MODIFIED/REMOVED/DEPRECATED

#### 变更

- **全项目品牌统一** — FlowForge→DevFlow, @devflow-kit→@devflow
- **CONSTITUTION 层级化** — .devflow/PROJECT_CONSTITUTION.md + domains/specification/templates/ + cli/templates/

---

## [1.4.0] - 2026-05-30

### Phase 4 — 深度集成

DevFlow v1.4.0 — INTEGRATION-PLAN Phase 4 完成，5 个深度集成特性全部集成。

#### 新增

- **GitNexus 深度集成** — 知识图谱 + Blast Radius 变更影响分析
  - `layers/L3-ARCHITECTURE/blast-radius/_SKILL.md` — Blast Radius Engine
  - 影响分级: 🔴高置信度直接/🟡中置信度间接/🟢低置信度可能
  - 集成点: Phase 0(入场检测) / Phase 2(影响分析) / Phase 4(代码搜索) / Phase 5(测试范围) / Phase 6(审查影响)
  - Auto-generated Repo Skills: Phase 0 自动生成领域技能
- **PRD 自动解析** — Phase 3 集成 PRD 自动解析
  - Phase 3 Step 0.5: PRD 自动解析（支持 PRD.md / requirements.md / CSV/JSON）
  - 提取功能点 → 识别依赖 → 估算复杂度 → 输出 task-candidates.json
- **Party Mode 多角色辩论** — Phase 1b 多角色辩论增强
  - Party Mode SKILL 新增 Phase 1b 集成 (architect/reviewer/planner 三角色)
  - 流程: architect 提出方案 → reviewer 挑战 → planner 评估 → 综合决策
- **执行轨迹学习** — LearningWorkflow 第三通道
  - LearningWorkflow Step 4.5: 执行轨迹学习 (v1.1 新增)
  - 三通道架构: A(LESSONS沉淀) + B(Domain Skills晋升) + C(执行轨迹学习)
  - 轨迹记录: 关键决策点 + 执行步骤 + 结果 + 教训
  - 轨迹聚类: Jaccard 相似度 > 0.7 归组 → Best Practice 晶体 / Anti-Pattern 警告
- **Delta Specs 完善** — 模板 + 校验 + 合并策略
  - `references/delta-spec-validator.js` — Delta Spec 校验脚本
  - Delta Spec 模板: base-version/author/status + ADDED/MODIFIED/REMOVED/DEPRECATED 标准格式
  - 合并策略: auto_merge / manual_merge / three_way_merge

#### 变更

- **Phase 3 Task Plan SKILL** — 新增 Step 0.5 PRD 自动解析
- **Party Mode SKILL** — 新增 Phase 1b 多角色辩论集成
- **LearningWorkflow SKILL** — 新增 Step 4.5 执行轨迹学习
- **delta-specs.md** — 新增模板、校验规则、合并策略
- **L3-ARCHITECTURE README** — 新增 blast-radius 模块
- **VERSION** — 1.3.0 → 1.4.0

#### 集成来源

- GitNexus: 知识图谱 + AST 解析 + Blast Radius Analysis
- Task Master: PRD 自动解析 (parse-prd)
- BMAD-METHOD: Party Mode 多角色辩论
- Ruflo: SONA 自学习 + ReasoningBank
- OpenSpec: opsx 流程 + Delta Specs 模板/校验/合并

---

## [1.3.0] - 2026-05-30

### Phase 3 — 体验优化

DevFlow v1.3.0 — INTEGRATION-PLAN Phase 3 完成，6 个 P2 特性全部集成。

#### 新增

- **Design 品味记忆** — Phase 2a 设计选择自动记录用户偏好
  - `memory/DESIGN_PREFERENCES.md` — 品味记忆文件（UI风格/组件偏好/调性倾向/历史选择）
  - Phase 2a Step -0.5: 品味记忆加载（优先推荐符合用户品味的变体）
  - 连续 3 次同调性 → 设为首选，连续 2 次拒绝 → 加入排斥
- **Phase 0 推回机制** — YC 六问后 AI 主动挑战前提假设
  - Phase 0 Step 6.5: 推回轮次（Standard/Strict 模式）
  - 最多挑战 2 个前提，必须提供替代方案
  - 用户选择: 维持/降级/延迟
- **变更边界检查** — Task 声明范围 vs 实际修改比对
  - `layers/L2-ENGINE/change-boundary-guard/_SKILL.md` — 边界检查技能
  - 三级分类: ✅范围内 / ⚠️越界 / 🔴危险越界
  - Phase 4 Step 2.5: 变更边界检查集成
- **假设声明步骤** — Task 开始前声明技术假设和不确定项
  - `layers/L2-ENGINE/assumption-declaration/SKILL.md` — 假设声明技能
  - Phase 4 Step 2: 假设声明集成
  - 与变更边界检查互补: 假设声明确认"做什么"，边界检查确认"改变了什么"
- **Preset 扩展系统** — 用户定制 Phase 行为的预设机制
  - `layers/L3-ARCHITECTURE/preset-system/_SKILL.md` — Preset 系统技能
  - `default-presets/minimal.yaml` — 个人项目/原型预设
  - `default-presets/standard.yaml` — 团队项目预设（默认）
  - `default-presets/enterprise.yaml` — 企业项目预设
  - 加载顺序: PROJECT_CONSTITUTION > Custom Preset > Default Preset > CONSTITUTION.md
- **WIP 自动保存** — Phase 4 执行中自动保存进度
  - `layers/L2-ENGINE/wip-checkpoint/_SKILL.md` — WIP Checkpoint 技能
  - 触发: 每 3 Task / Token > 60% / Phase 转换
  - 恢复: 会话中断后从 STATE.md 断点继续
  - Phase 4 Step 2.7: WIP 自动保存集成

#### 变更

- **Phase 2a Shotgun SKILL** — 新增 Step -0.5 品味记忆加载
- **Phase 0 YC Strategy SKILL** — 新增 Step 6.5 推回轮次
- **Phase 4 Build SKILL** — 新增 Step 2 假设声明 + Step 2.5 变更边界 + Step 2.7 WIP 保存
- **L2-ENGINE README** — 新增 change-boundary-guard/assumption-declaration/wip-checkpoint
- **L3-ARCHITECTURE README** — 新增 preset-system
- **VERSION** — 1.2.0 → 1.3.0

#### 集成来源

- gstack: gstack-taste-update 品味学习 + Office Hours push back + Checkpoint
- Karpathy Skills: Surgical Changes + Think Before Coding
- Spec-Kit: Extension/Preset 系统

---

## [1.2.0] - 2026-05-29

### Phase 2 — 质量提升

DevFlow v1.2.0 — INTEGRATION-PLAN Phase 2 完成，5 个 P1 特性全部集成。

#### 新增

- **向量记忆系统** — L3 架构层 HNSW 语义检索引擎
  - `layers/L3-ARCHITECTURE/vector-memory/_SKILL.md` — 向量记忆技能定义（4层记忆架构 + 混合检索 + 生命周期管理）
  - `layers/L3-ARCHITECTURE/vector-memory/hnsw-adapter.md` — HNSW 索引适配器（SQLite vec / hnswlib-node / brute-force 三级降级）
  - `layers/L3-ARCHITECTURE/vector-memory/migration-guide.md` — LESSONS.md → 向量记忆迁移指南
  - 4 层记忆架构: Working → Episodic → Semantic → Procedural
  - 混合检索: BM25 全文 + HNSW 向量 + RRF 融合，R@5 目标 ≥ 90%
  - 记忆生命周期: Ebbinghaus 衰减 + 矛盾检测 + 隐私过滤
  - Crystallize 动作链压缩: 重复操作序列 → 可复用晶体
- **Wave 实时审查** — L2 引擎层 Phase 4 Wave 后轻量审查
  - `layers/L2-ENGINE/real-time-review/_SKILL.md` — 实时审查技能定义
  - Step 1: Spec Compliance Check (规格合规检查)
  - Step 2: Code Quality Quick Scan (console.log/any/空catch/硬编码密钥)
  - Step 3: Change Boundary Check (变更边界检查)
  - Step 4: Decision (PASS/WARN/FAIL) + Agent Comms 消息板广播
  - Gate G5.5: Wave 间审查门控
- **浏览器 QA** — L2 引擎层 Playwright E2E 测试
  - `layers/L2-ENGINE/browser-qa/_SKILL.md` — 浏览器 QA 技能定义
  - Playwright 测试自动生成（基于设计文档 + 用户流程）
  - 截图对比 + Bug 报告自动生成（P0/P1/P2 三级）
  - Gate G6.5: 浏览器 QA 门控
- **OWASP/STRIDE 安全审计** — Phase 6 安全审查增强
  - `references/owasp-top10-checklist.md` — OWASP Top 10 (2021) 逐项检查清单
  - `references/stride-threat-model.md` — STRIDE 威胁建模模板
  - `layers/L1-INTERACTION/phase-6-review/specialists/owasp-stride.md` — OWASP/STRIDE 审计专家
  - Phase 6 Step D1 新增 OWASP/STRIDE Auditor 并行执行
- **MCP 工具瘦身** — L2 引擎层 MCP 工具三级加载
  - `layers/L2-ENGINE/mcp-shrink/_SKILL.md` — MCP Shrink 技能定义
  - Core (7 工具, ~2K) / Standard (15 工具, ~5K) / All (36+ 工具, ~12K) 三级
  - Phase 感知自动加载矩阵 (Phase 0-8)
  - 工具描述压缩 (full/shrink/ultra/extreme, 压缩率 ≥ 70%)
  - surface-switch 集成: 运行时模式切换自动调整工具集

#### 变更

- **LearningWorkflow SKILL** — 新增 Step 1.5 向量索引同步 + Step 3.5 Crystallize + Step 4 向量检索增强
- **Phase 4 Build SKILL** — 新增 Step 3.5 Wave 实时审查
- **Phase 5 Test SKILL** — 新增 Step 5.5 浏览器 QA 子阶段
- **Phase 6 Review SKILL** — Step D1 新增 OWASP/STRIDE Auditor
- **L2-ENGINE README** — 新增 real-time-review/browser-qa/mcp-shrink 模块说明
- **L3-ARCHITECTURE README** — 新增 vector-memory 模块说明
- **VERSION** — 1.1.0 → 1.2.0

#### 集成来源

- Ruflo: AgentDB HNSW 向量检索 + 4 层记忆架构
- agentmemory: 三流混合检索 + Ebbinghaus 衰减 + Crystallize + 隐私过滤
- Superpowers: Subagent-Driven Development 两阶段审查
- gstack: /qa 浏览器测试 + /cso OWASP/STRIDE
- caveman: caveman-shrink MCP 中间件
- Task Master: 三级工具加载

---

## [1.1.0] - 2026-05-29

### Phase 1 — 基础补强

DevFlow v1.1.0 — INTEGRATION-PLAN Phase 1 完成，4 个 P0 特性全部集成。

#### 新增

- **Agent Comms 模块** — L2 引擎层 Agent 间通信（Markdown 消息板模式）
  - `layers/L2-ENGINE/agent-comms/_SKILL.md` — 通信技能定义（Pipeline/Fan-out/Supervisor 三模式）
  - `layers/L2-ENGINE/agent-comms/sendmessage-protocol.md` — SendMessage 协议规范（notify/request/response/error 四类型）
  - `layers/L2-ENGINE/agent-comms/pipeline-pattern.md` — Pipeline 串行依赖链模式
  - `layers/L2-ENGINE/agent-comms/fanout-pattern.md` — Fan-out 一对多广播模式
  - `layers/L2-ENGINE/agent-comms/supervisor-pattern.md` — Supervisor 双向协调模式
  - 消息板路径: `.devflow/<req-id>/comms/wave-<N>/` (notifications/requests/responses/errors)
- **Project Constitution 分离** — 流程宪法与项目宪法分离
  - `cli/templates/PROJECT_CONSTITUTION.md` — 项目宪法模板（技术栈/质量标准/测试要求/禁止项）
  - Phase 0 自动检测 `.devflow/PROJECT_CONSTITUTION.md`，不存在时提示 setup
  - R26 规则: 所有 Phase 执行必须遵守项目宪法约束
- **npx devflow init CLI 安装器** — 一键安装 DevFlow
  - `cli/package.json` + `cli/bin/devflow.js` — CLI 入口
  - `cli/commands/init.js` — 6 步安装流程（检测宿主→创建目录→生成文件→检测技术栈→配置宿主→输出报告）
  - `cli/commands/setup.js` — 交互式项目设置（inquirer 问答）
  - `cli/commands/help.js` — 帮助文档
  - `cli/commands/upgrade.js` — 版本升级检查
  - `cli/lib/detector.js` — 宿主环境检测（Claude Code/Cursor/Copilot/Gemini CLI）
  - `cli/lib/tech-stack.js` — 技术栈自动检测（package.json/requirements.txt/go.mod/Cargo.toml）
  - `cli/lib/file-generator.js` — 文件生成器（STATE/PROJECT_CONSTITUTION/PROJECT_CONTEXT/DECISIONS/LESSONS/message-board）
  - `cli/lib/adapter-installer.js` — 宿主适配器安装
  - `cli/templates/STATE.md` + `cli/templates/metadata.json` — 模板文件
- **Token Monitor Hook** — Token 预算运行时监控
  - `hooks/scripts/token-monitor.js` — Hook 脚本（50%/70%/90% 三级阈值）
  - `layers/L2-ENGINE/token-monitor/_SKILL.md` — Token 监控技能定义
  - `hooks/hooks.json` — 新增 token-monitor Hook 注册（post_tool_use, advisory 模式）
  - Statusline 集成: `DevFlow Token: ████████░░ 78% | Mode: lite | Saved: 12.3K`

#### 变更

- **Phase 4 Build SKILL** — 新增 Step 1.5 Agent Comms 消息板初始化
- **Wave Executor SKILL** — 新增 Agent Comms 消息板读取和更新步骤
- **Phase 0 Strategy SKILL** — 新增 Project Constitution Detection 检测流程
- **L2-ENGINE README** — 新增 agent-comms/ 和 token-monitor/ 模块说明
- **RULES-v3.md** — 升级至 v3.4.0，新增 R25 (Agent 间通信) 和 R26 (项目宪法)
- **RULES.md** — 升级至 v3.1.0，新增 R25 + R26 规则及违规速查条目
- **VERSION** — 1.0.0 → 1.1.0

#### 集成来源

- Ruflo: SendMessage 协议 + Agent Teams 通信架构
- Spec-Kit: Constitution 文件分离 + 项目宪法模板
- BMAD-METHOD: npx 安装器模式 + 交互式 setup
- Caveman: caveman-stats Token 统计 + context-monitor Hook
- Conductor: Setup 引导流程

---

## [1.0.0] - 2026-05-27

### 初始发布

DevFlow v1.0.0 — DevFlow v3.2.3 与 ECC v2.0.0-rc.1 的融合产物。

#### 新增

- **Phase 0-8 流程管线** — 从 DevFlow 完整复制，含 Gate 门控和 LearningWorkflow
- **7 核心 Agent** — planner, architect, code-reviewer, security-reviewer, build-error-resolver, code-explorer, refactor-cleaner
- **21 扩展 Agent** — 覆盖 12 个技术栈 (python/go/rust/java/kotlin/flutter/cpp/swift/typescript/database/network/performance)
- **6 精选 Hook** — format-typecheck, console-log-check, security-scan, context-monitor, compact-suggest, cost-tracker
- **Gate-Hook 协同模型** — Hook FAIL→Gate 硬阻断, PASS→人工确认, 无运行时→Markdown 降级
- **Phase 4/5/6 Hook 步骤** — G5(format-typecheck+console-log-check), G6(security-scan), G7(format-typecheck+security-scan)
- **gate-hook-bridge 技能** — L2 引擎层 Gate↔Hook 桥接
- **checklist-fallback.md** — 6 个 Hook 的 Markdown 降级检查清单
- **hooks.json** — 6 个 Hook 的注册配置
- **技术栈检测** — 文件指纹 + 框架识别 + 加载决策
- **6 安全 Skill** — security-review, security-scan, security-bounty-hunter, canary-watch, deployment-patterns, production-audit
- **21 语言规则** — 10 通用 + 6 Python(含 FastAPI) + 5 TypeScript
- **双通道自进化** — LESSONS 流程沉淀 + Agent-Eval 模式提取融合
- **4 个 lib 依赖** — utils.js, session-bridge.js, resolve-formatter.js, package-manager.js
- **完整文档** — README.md, ARCHITECTURE.md, CHANGELOG.md, MERGE-MAP.md, AGENT-PHASE-MAP.md, TECH-STACK-DETECT.md, DUAL-EVOLUTION.md

#### 融合来源

- DevFlow v3.2.3: Phase 0-8 管线, Gate 门控, Skills, References, Memory, 三层架构
- ECC v2.0.0-rc.1: 28 Agent, 6 Hook 脚本, 6 安全 Skill, 语言规则
