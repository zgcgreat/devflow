# Devflow 项目结构完整性审查报告

> ⚠️ Historical document — references to "devflow" predate the "devflow-evo" rename.

**项目路径**: `E:\LLM\skills\devflow` (now `E:\LLM\skills\devflow-evo`)
**审查日期**: 2026-05-19

---

## 1.1 L1/L2/L3 每层是否有完整的模块集合

**结果: 警告**

三层目录均存在，但模块密度差异显著：

| 层 | 有 `_SKILL.md` 的模块 | 有实现文件的模块 | 纯壳模块 | 无 `_SKILL.md` 的子目录 |
|---|---|---|---|---|
| **L1-INTERACTION** | 18 | 0 | 18 | 3 (phase-0-strategy, gsd-workflows, superpowers-skills) |
| **L2-ENGINE** | 10 | 4 | 6 | 0 |
| **L3-ARCHITECTURE** | 10 | 3 | 7 | 2 (schema-definitions, references) |

L2 有实现的模块:
- `change-manager/` -- change-lifecycle.js, merge-engine.js
- `debugging-workflow/` -- SKILL.md + 3个 .md 子文件 (命名是 SKILL.md 非 _SKILL.md)
- `memory-compression/` -- SKILL.md + compress.js/py, detect.py, validate.py, cli.py
- `token-compression-v2/` -- budget-tracker.js, compressor.js
- `verification-closed-loop/` -- verify.js

L3 有实现的模块:
- `code-intelligence/` -- mcp-server.js, code-analyzer.js, blast-radius.js
- `provider-gateway/` -- 21个 .js 文件 + index.js

**命名不一致**: debugging-workflow/, memory-compression/, learning-workflow/graduation/ 使用 SKILL.md (无下划线前缀)，其余模块统一使用 _SKILL.md。

---

## 1.2 只有 _SKILL.md 没有其他实现文件的"壳模块"

**结果: 失败**

共发现 25 个纯壳模块（仅有 _SKILL.md，无 JS/YAML/JSON/PY 等实现文件）：

### L1 层 (18 个)
1. layers/L1-INTERACTION/phase-0-yc-strategy/
2. layers/L1-INTERACTION/phase-0-yc-strategy/orchestrator/
3. layers/L1-INTERACTION/phase-1-5whys/
4. layers/L1-INTERACTION/phase-1b-discuss/
5. layers/L1-INTERACTION/phase-2-design/
6. layers/L1-INTERACTION/phase-2-design/researcher/
7. layers/L1-INTERACTION/phase-2a-shotgun/
8. layers/L1-INTERACTION/phase-3-task-plan/
9. layers/L1-INTERACTION/phase-4-build/
10. layers/L1-INTERACTION/phase-5-test/
11. layers/L1-INTERACTION/phase-6-review/
12. layers/L1-INTERACTION/phase-6-review/reviewer/
13. layers/L1-INTERACTION/phase-6-review/specialists/security/
14. layers/L1-INTERACTION/phase-6-review/specialists/testing/
15. layers/L1-INTERACTION/phase-7-canary/
16. layers/L1-INTERACTION/phase-7-canary/canary-wrapper/
17. layers/L1-INTERACTION/phase-8-archive/
18. layers/L1-INTERACTION/phase-8-archive/memory-keeper/

### L2 层 (8 个)
19. layers/L2-ENGINE/anti-rationalization/
20. layers/L2-ENGINE/context-rot-prevention/
21. layers/L2-ENGINE/executor/
22. layers/L2-ENGINE/learning-workflow/
23. layers/L2-ENGINE/memory-auto-maintenance/
24. layers/L2-ENGINE/mvp-vertical-slice/
25. layers/L2-ENGINE/party-mode/
26. layers/L2-ENGINE/wave-executor/

### L3 层 (7 个)
27. layers/L3-ARCHITECTURE/agent-isolation/
28. layers/L3-ARCHITECTURE/dag-router/
29. layers/L3-ARCHITECTURE/dedup-cleanup/
30. layers/L3-ARCHITECTURE/install-profiles/
31. layers/L3-ARCHITECTURE/layer-interfaces/
32. layers/L3-ARCHITECTURE/model-selection-strategy/
33. layers/L3-ARCHITECTURE/parallel-engine/

另外 learning-workflow/graduation/ 仅有 SKILL.md (无下划线)，也属壳模块。

---

## 1.3 空目录检查

**结果: 通过**

项目内（排除 .git/）**无空目录**。所有 .git/ 内的空目录（objects/info/, objects/pack/, refs/tags/）属于 Git 正常结构。

---

## 1.4 adapters/ 5 个运行时配置完整性

**结果: 警告**

5 个运行时目录均存在，且每个都有 install.md。各适配器配置文件：

| 运行时 | 文件列表 | 核心配置文件 | 状态 |
|---|---|---|---|
| **claude-code** | hooks.json, settings.json, install.md | hooks.json + settings.json | 完整 |
| **cursor** | devflow.mdc, install.md | devflow.mdc | 完整 |
| **codex** | codex.yaml, install.md | codex.yaml | 完整 |
| **copilot** | copilot-instructions.md, install.md | copilot-instructions.md | 完整 |
| **gemini-cli** | GEMINI.md, install.md | GEMINI.md | 完整 |
| **shared** | core-bridge.js, gate-checker.js, memory-loader.js | 桥接层 | 完整 |

**警告详情**: 配置文件格式各异是设计差异，但缺乏统一验证规范来确保每个适配器的配置文件包含必要的字段（如 statePath, memoryPath 等）。claude-code 是唯一有 hooks.json 和 settings.json 双配置的适配器，其余仅有单一配置文件。

---

## 1.5 templates/ 模板文件是否被任何 SKILL 引用

**结果: 警告**

### 引用 templates/ 的 _SKILL.md 文件 (2 个)：
- `phase-2-design/_SKILL.md` -- 引用 `templates/02-design.md` 和 `references/templates/constitution-template.md`
- `phase-3-task-plan/_SKILL.md` -- 引用 `templates/03-tasks.md`

### 引用 templates/ 的 gsd-workflows 文件 (5 个)：
- `execute-phase.md` -- 引用 `~/.claude/get-shit-done/templates/summary.md`
- `new-milestone.md` -- 引用 `~/.claude/get-shit-done/templates/research-project/{FILE}`
- `new-project.md` -- 引用 `templates/project.md` 和 `~/.claude/get-shit-done/templates/research-project/`
- `plan-phase.md` -- 引用 `~/.claude/get-shit-done/templates/VALIDATION.md`
- `verify-phase.md` -- 引用 `~/.claude/get-shit-done/templates/verification-report.md`

### 存在性验证：

| 引用路径 | 实际文件是否存在 | 说明 |
|---|---|---|
| `templates/02-design.md` | **不存在** | 被引用但缺失，实际位于 references/templates/02-design.md |
| `templates/03-tasks.md` | **不存在** | 被引用但缺失，实际位于 references/templates/03-tasks.md |
| `references/templates/constitution-template.md` | 存在 | 正常 |
| `templates/project.md` | 存在 | 正常 |
| `templates/VALIDATION.md` | 存在 | 正常 |
| `templates/verification-report.md` | 存在 | 正常 |
| `templates/summary.md` | 存在 | 正常 |
| `~/.claude/get-shit-done/templates/research-project/` | 存在于项目 templates/research-project/ | 引用路径为旧版安装路径 |

### 问题总结：
1. **2 个断链**: `templates/02-design.md` 和 `templates/03-tasks.md` 被引用但不存在，实际位于 `references/templates/` 下
2. **路径过时**: gsd-workflows 中大量引用 `~/.claude/get-shit-done/templates/` 旧版路径，v3 项目结构下应为 `E:\LLM\skills\devflow\templates/`
3. **templates/ 目录中 36 个文件** 大部分未被任何 _SKILL.md 引用

---

## 1.6 mcp/ 和 code-intelligence/ 的模块是否互相引用正确

**结果: 通过（附警告）**

### mcp/server.js 的 require 路径验证：

| require 路径 | 解析目标 | 文件是否存在 |
|---|---|---|
| `../layers/L3-ARCHITECTURE/code-intelligence/mcp-server` | code-intelligence MCP 服务器 | 存在 |
| `../adapters
| `../adapters/shared/core-bridge` | 核心桥接模块 | 存在 |
| `../adapters/shared/memory-loader` | 记忆加载器 | 存在 |
| `../layers/L2-ENGINE/change-manager/change-lifecycle` | 变更生命周期 | 存在 |

### code-intelligence/mcp-server.js 的 require 路径验证：

| require 路径 | 解析目标 | 文件是否存在 |
|---|---|---|
| `./code-analyzer` | 代码分析器 | 存在 |
| `./blast-radius` | 影响半径计算 | 存在 |

### adapters/shared/ 内部引用验证：

| 文件 | require 路径 | 是否存在 |
|---|---|---|
| gate-checker.js | `./core-bridge` | 存在 |

**所有 require 路径均解析成功，无断链。**

**警告**: mcp/server.js 第 47-48 行使用 `require('path').join(p.projectDir, '.devflow/changes', p.changeName)` 动态拼接路径，依赖运行时传入的 projectDir 参数，无法静态验证。若 projectDir 无效或 .devflow/changes/ 目录不存在，运行时会报错。

---

## 1.7 bin/ 目录下是否还残留旧 .js/.py 脚本

**结果: 通过**

bin/ 目录下仅有 `README.md` 一个文件，无任何 .js/.py 脚本残留。

---

## 1.8 .devflow/ 目录结构是否在 SKILL.md 或 init 中定义了完整创建流程

**结果: 警告**

### 定义位置：

1. **SKILL.md 第 426-437 行** -- 定义了 `.devflow/` 的产物结构：
   - STATE.md
   - memory/PROJECT_CONTEXT.md
   - memory/DECISIONS.md
   - memory/KNOWN_FAILURES.md
   - memory/LESSONS.md
   - memory/domain-skills/
   - `<req-id>/` 需求产物目录

2. **GO.md 第 68-83 行** -- 定义了初始化流程：
   - Step 1: 尝试读 `.devflow/STATE.md`，不存在则用模板创建
   - Step 4: 检查 `.devflow/memory/` 是否存在，不存在则创建目录并初始化基础文件

### 缺失项：

| 缺失内容 | 说明 |
|---|---|
| **无显式 mkdir 命令** | GO.md 仅说"创建目录并初始化基础文件"，未给出具体的 mkdir 命令或脚本 |
| **STATE.md 模板来源未明确** | GO.md 说"用模板创建"但未指定用哪个模板文件（templates/state.md 存在但未被显式引用） |
| **.devflow/changes/ 未在初始化流程中** | mcp/server.js 引用了 `.devflow/changes/` 路径，但 SKILL.md 和 GO.md 的初始化流程中未包含此目录的创建 |
| **.devflow/pipeline-state.json 未在 SKILL.md 定义** | phase-0-yc-strategy/orchestrator/_SKILL.md 大量使用 `.devflow/pipeline-state.json`，但 SKILL.md 的产物结构定义中未列出此文件 |
| **.devflow/escalations.log 未在 SKILL.md 定义** | orchestrator/_SKILL.md 写入 `.devflow/escalations.log`，但产物结构定义中未列出 |
| **无自动化初始化脚本** | scripts/ 下仅有 gate-check.sh，无 init 或 setup 脚本来自动创建 .devflow/ 目录结构 |

---

## 审查总结

| 审查项 | 结果 | 关键发现 |
|---|---|---|
| 1.1 L1/L2/L3 模块集合 | **警告** | 三层均存在，但 25/33 个模块为纯壳，L1 层 0 个有实现 |
| 1.2 壳模块检查 | **失败** | 25 个纯壳模块 + 1 个 SKILL.md 壳，命名不一致 (3个用 SKILL.md) |
| 1.3 空目录检查 | **通过** | 无空目录（排除 .git/） |
| 1.4 adapters 配置完整性 | **警告** | 5 个运行时均有配置，但格式不统一，缺验证规范 |
| 1.5 templates 引用检查 | **警告** | 2 个断链 (02-design.md, 03-tasks.md)，gsd-workflows 引用旧版路径 |
| 1.6 mcp/code-intelligence 互引 | **通过** | 所有 require 路径解析成功，动态路径依赖运行时 |
| 1.7 bin/ 残留脚本 | **通过** | 仅 README.md，无 .js/.py 残留 |
| 1.8 .devflow/ 创建流程 | **警告** | 结构已定义但缺自动化脚本，3 个运行时产物未在定义中 |

### 优先修复建议：

1. **[高] 修复断链模板引用**: 将 `templates/02-design.md` 和 `templates/03-tasks.md` 的引用修正为 `references/templates/02-design.md` 和 `references/templates/03-tasks.md`，或在 templates/ 下创建符号链接/副本
2. **[高] 更新 gsd-workflows 旧版路径**: 将 `~/.claude/get-shit-done/templates/` 替换为 v3 路径
3. **[中] 统一 SKILL.md 命名**: 将 debugging-workflow/SKILL.md、memory-compression/SKILL.md、graduation/SKILL.md 重命名为 _SKILL.md
4. **[中] 补充 .devflow/ 初始化脚本**: 在 scripts/ 下创建 init-devflow.sh 自动创建完整目录结构
5. **[中] 补全 .devflow/ 产物定义**: 在 SKILL.md 中增加 changes/、pipeline-state.json、escalations.log 的定义
6. **[低] 为壳模块补充实现**: 优先为 L2 层的 executor、wave-executor 等核心引擎模块补充实现文件
