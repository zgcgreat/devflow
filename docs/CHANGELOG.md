# ForgeOS 变更日志

所有重要变更记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/)。

---

---

## [3.2.2] - 2026-06-20

### 全面质量修复

#### 变更

- **品牌名统一** — FlowForge/flowforge/@devflow-kit 全部替换为 ForgeOS/forgeos/@forge-os（~500+ 处）
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
- **CONSTITUTION 体系统一** — L2 CONSTITUTION.md → .forgeos 目录, phases CONSTITUTION → domains/specification/templates/
- **adapters/ 品牌统一** — devflow.mdc → forgeos.mdc, DevFlow→ForgeOS

---

## [3.0.0] - 2026-06-18

### ForgeOS × DevFlow 融合方案 v2.0 实施

#### 新增

- **Gate 门控增强** — G8 空目录检查, Phase 感知加载矩阵
- **MCP 工具三级瘦身** — Core/Standard/All, Phase 自动调整
- **双通道自进化完善** — LESSONS → Domain Skills → 执行轨迹学习完整链路
- **Delta Specs v1.0** — 版本控制: base-version/author/status + ADDED/MODIFIED/REMOVED/DEPRECATED

#### 变更

- **全项目品牌统一** — FlowForge→ForgeOS, @devflow-kit→@forge-os
- **CONSTITUTION 层级化** — .forgeos/PROJECT_CONSTITUTION.md + domains/specification/templates/ + cli/templates/

---

## [1.4.0] - 2026-05-30

### Phase 4 — 深度集成

ForgeOS v1.4.0 — INTEGRATION-PLAN Phase 4 完成，5 个深度集成特性全部集成。

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

ForgeOS v1.3.0 — INTEGRATION-PLAN Phase 3 完成，6 个 P2 特性全部集成。

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

ForgeOS v1.2.0 — INTEGRATION-PLAN Phase 2 完成，5 个 P1 特性全部集成。

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

ForgeOS v1.1.0 — INTEGRATION-PLAN Phase 1 完成，4 个 P0 特性全部集成。

#### 新增

- **Agent Comms 模块** — L2 引擎层 Agent 间通信（Markdown 消息板模式）
  - `layers/L2-ENGINE/agent-comms/_SKILL.md` — 通信技能定义（Pipeline/Fan-out/Supervisor 三模式）
  - `layers/L2-ENGINE/agent-comms/sendmessage-protocol.md` — SendMessage 协议规范（notify/request/response/error 四类型）
  - `layers/L2-ENGINE/agent-comms/pipeline-pattern.md` — Pipeline 串行依赖链模式
  - `layers/L2-ENGINE/agent-comms/fanout-pattern.md` — Fan-out 一对多广播模式
  - `layers/L2-ENGINE/agent-comms/supervisor-pattern.md` — Supervisor 双向协调模式
  - 消息板路径: `.forgeos/<req-id>/comms/wave-<N>/` (notifications/requests/responses/errors)
- **Project Constitution 分离** — 流程宪法与项目宪法分离
  - `cli/templates/PROJECT_CONSTITUTION.md` — 项目宪法模板（技术栈/质量标准/测试要求/禁止项）
  - Phase 0 自动检测 `.forgeos/PROJECT_CONSTITUTION.md`，不存在时提示 setup
  - R26 规则: 所有 Phase 执行必须遵守项目宪法约束
- **npx forgeos init CLI 安装器** — 一键安装 ForgeOS
  - `cli/package.json` + `cli/bin/forgeos.js` — CLI 入口
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
  - Statusline 集成: `ForgeOS Token: ████████░░ 78% | Mode: lite | Saved: 12.3K`

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

ForgeOS v1.0.0 — DevFlow v3.2.3 与 ECC v2.0.0-rc.1 的融合产物。

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
