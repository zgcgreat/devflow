# DevFlow — AI 开发操作系统

![Version](https://img.shields.io/badge/version-3.3.0-blue)
![Tests](https://img.shields.io/badge/tests-21%2F21-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![Runtime](https://img.shields.io/badge/runtime-Node.js%20%E2%89%A518-informational)

**DevFlow 为 AI 编码代理提供带门控强制的 Phase 管线**：每个阶段必须产出指定工件、通过指定门控才能推进，由 JavaScript 内核在代码级拦截违规，而不是靠提示词"自觉遵守"。

## 为什么需要 DevFlow

AI 编码代理在实际项目中反复出现三类失控：

| 失控模式 | 典型表现 | DevFlow 的对策 |
|---|---|---|
| **跳阶段** | 需求没问清就直接写代码，返工率飙升 | Phase 管线规定阶段顺序，门控未过无法推进 |
| **产物悬空** | 声称"设计完成"，但没有任何设计文档落地 | 每个阶段绑定硬性产物名（`02-design.md` 等），`outputWritten()` 未登记视为未完成 |
| **静默越权** | 未经确认就改 schema、加依赖、删文件 | `G5 Build Gate` 等人工门控 + `_verifyCurrentGate()` 代码级拦截 |

纯 Markdown 工作流只有"约束建议"，违规无代价。DevFlow 用 **50+ 个 JS 文件的内核**把约束变成可执行的检查——这就是它与传统 prompt 工作流框架的本质区别。

## 核心能力

### 1. Phase 管线（L1 交互层）

11 个阶段覆盖从战略到归档的完整生命周期，每个阶段绑定门控与产物：

| Phase | 名称 | 门控 | 产物 | Fast | Lean | Standard | Strict |
|---|---|---|---|:---:|:---:|:---:|:---:|
| 0 | YC 六问战略评估 | `G0` Strategy | `00-strategy.md` | — | — | ✅ | ✅ |
| 1 | 5 Whys 需求追问 | `G1`+`G2` Architecture | `01-analysis.md` | — | — | ✅ | ✅ |
| 1b | 决策捕获讨论 | `G2.5` Discussion | `01b-context.md` | — | — | ✅ | ✅ |
| 2 | 方案设计 | `G3` Design | `02-design.md` | — | ✅ | ✅ | ✅ |
| 2a | 设计枪战（变体比选） | `G3.5` Shotgun | `02a-variants.md` | — | — | ✅ | ✅ |
| 3 | DAG 任务拆分 | `G4` Task Plan | `03-tasks.md` | — | — | — | ✅ |
| 4 | 实施（Wave 并行） | `G5` Build | `04-wave-logs.md` | ✅ | ✅ | ✅ | ✅ |
| 5 | 测试验证 | `G6` Test（AC 覆盖 ≥90%） | `05-test-report.md` | ✅ | ✅ | ✅ | ✅ |
| 6 | 审查（三层对抗评审） | `G7` Review | `06-review.md` | ✅ | ✅ | ✅ | ✅ |
| 7 | Canary 灰度发布 | `G7.5` Canary | `07-canary.md` | — | — | ✅ | ✅ |
| 8 | 归档与经验沉淀 | `G8` Archive | `08-archive.md` | — | ✅ | ✅ | ✅ |

### 2. 四档模式，自动判定

不猜项目该多"重"——`detectMode` 扫描文件数、代码行数、模块数、风险等级（brownfield / 架构变更 / 数据变更），自动映射到合适的流程深度：

> **前置条件**：Node.js ≥ 18（`devflow doctor` 自动校验运行时版本）；未安装 Node 时自动降级为 L0 纯 Markdown 模式，不报错、不阻塞。

```bash
node bin/devflow.js detect --brownfield --arch-change   # → strict
node bin/devflow.js init                                 # 未指定 --mode 时自动判定
```

- **Fast**（3 阶段）：小改动、热修复
- **Lean**（6 阶段）：单功能迭代
- **Standard**（9 阶段）：常规功能开发
- **Strict**（11 阶段）：大型仓库 / 存量系统 / 高风险变更

### 3. 门控护卫（代码级强制）

```text
nextPhase() → _verifyCurrentGate() → 门控未过？→ 拒绝推进并给出原因
```

- 12 个门控进入 `PHASES` 数组统一管理，`gate-check.js` 由 `phase-engine.js` 单一派生（无重复副本）
- 启动前 `stateGuard()` 校验 `state.json` 合法性
- 旧版 state 文件自动合并兼容，升级不丢状态

### 4. 内核工具集（L2 引擎层）

| 组件 | 文件 | 职责 |
|---|---|---|
| Phase 引擎 | `lib/phase-engine.js` | 管线/门控/模式/状态的唯一权威源 |
| 四层记忆 | `lib/memory.js` | 长期+短期持久记忆，`--forget` 过期遗忘 |
| DAG 规划器 | `lib/task-planner.js` | 任务分解为依赖图，`--visualize` 可视化 |
| Party 仲裁器 | `lib/party-arbiter.js` | 多角色方案按成本/性能/可维护/安全四维评分 |
| 代码智能 | `domains/code-intel/code-explorer.js` | 符号查询与目录扫描 |
| 压缩引擎 | `domains/memory/caveman.js` | 四级文本压缩（lite/full/ultra/wenyan） |
| 门控验证器 | `domains/hooks/gate-check.js` | 运行时门控检查（Hook 桥接用） |
| CLI 入口 | `bin/devflow.js` | 12 组子命令，`help` 自描述 |

### 5. 多工具适配器

同一套流程，适配不同宿主工具的注入方式：

```text
adapters/
├── claude-code/   # hooks.json + settings.json
├── cursor/        # devflow.mdc 规则文件
├── copilot/       # copilot-instructions.md
├── gemini-cli/    # GEMINI.md
├── codex/         # codex.yaml
├── universal/     # 通用 Markdown 方案（无宿主依赖）
└── shared/        # 公共 JS 逻辑（gate-checker/memory-loader/core-bridge）
```

### 6. Persona 与 Hook 体系

- **Persona**：8 个核心角色（架构师/规划师/代码评审/安全评审/TDD 教练/构建排障/重构清理/代码向导）常驻，12 个扩展角色按需加载
- **Hook**：L0 Markdown 约定 → L1 JS 脚本（`before-shell-execution` 等 15 个生命周期钩子）→ L2 级联触发

## 快速开始

### 方式一：作为 AI Skill 安装（推荐）

把整个仓库放入你的 AI 工具技能目录（WorkBuddy 为 `~/.workbuddy/skills/devflow`，Claude Code 为 `.claude/skills/`），AI 将从 `SKILL.md` 入口按需加载 Phase 技能与规则。也可用安装器：

```bash
node bin/devflow.js install --target workbuddy   # 或 cursor / claude
```

### 方式二：CLI 直接使用

```bash
# 初始化管线（按项目规模自动选模式）
node bin/devflow.js init

# 查看状态 / 健康自检
node bin/devflow.js status
node bin/devflow.js doctor

# Phase 推进（受门控护卫）
node bin/devflow.js phase --list
node bin/devflow.js phase --next
node bin/devflow.js phase --output docs/devflow/02-design.md   # 登记产物并过门控
node bin/devflow.js gates --phase 3

# 任务分解 / 方案仲裁
node bin/devflow.js task --describe "JWT 登录" --visualize
node bin/devflow.js party --scenario "登录方案选型"

# 记忆 / 代码智能 / 压缩
node bin/devflow.js mem --save "选定 HS256 + refresh token" --tags auth
node bin/devflow.js code --scan src
node bin/devflow.js caveman --file SKILL.md --level ultra
```

> Windows cmd 中文乱码：先执行 `chcp 65001`，或看结果末尾 ASCII 行 `RESULT: N/N passed`。

## 质量保证

```bash
node test/all.js          # 21 项完整性测试
node bin/devflow.js doctor  # 11 项健康检查
```

测试覆盖：文件完整性、frontmatter 合规、宪法规则连续性、12 门控派生产物、Phase 序列与模式矩阵一致性、门控护卫拦截行为、adapters 相位映射、版本一致性等，全部为真实断言（执行真实文件 I/O 与引擎调用，非文本匹配）。

## 目录结构

```text
devflow/
├── bin/            # CLI 入口 (devflow.js)
├── lib/            # JS 内核 (phase-engine/memory/task-planner/party-arbiter)
├── domains/        # 领域扩展 (code-intel/memory/hooks/execution/expertise/specification)
├── layers/         # L1 交互层 (11 Phase 技能) / L2 引擎层 / L3 架构层
├── adapters/       # 多工具适配器 (claude-code/cursor/copilot/gemini-cli/codex/universal)
├── personas/       # 8 核心 + 12 扩展 Persona
├── hooks/          # Hook 配置与脚本
├── harnesses/      # 安装器
├── references/     # Gate 规则 / R 规则 / Prompt 模板 / 产物模板
├── rules/          # 行为规则
├── skills/         # 内置工作流/工程技能
├── memory/         # 记忆系统模板
├── docs/           # 架构文档 / CHANGELOG / CLI 参考
└── test/           # 完整性测试套件
```

运行时状态写入工作区的 `.devflow/` 目录（`state.json` + 各阶段产物），不污染项目源码，加入 `.gitignore` 即可。

## 设计原则

1. **门控即代码** — 一切流程约束必须有 JS 级检查点，Markdown 只负责解释
2. **产物即证据** — 阶段完成以登记的文件产物为准，不以 AI 的口头声明为准
3. **按需加载** — `SKILL.md` 164 行内核路由 + Phase 技能精简 75%，上下文预算可控
4. **单一权威源** — 门控定义只在 `phase-engine.js`，其余文件全部派生
5. **fail-open 兜底** — 运行时组件缺失时降级为纯 Markdown 流程，不阻断工作

## 版本历史

见 [docs/CHANGELOG.md](docs/CHANGELOG.md)。当前版本 **v3.3.0**（2026-09-12，ForgeOS 正式更名 DevFlow，纯更名版本功能零变更）。

## License

[MIT](LICENSE) © 2026 DevFlow Contributors
