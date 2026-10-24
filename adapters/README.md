---
name: adapter-bridge
version: 3.0.0
layer: L2-ENGINE
description: Unified runtime bridge that adapts DevFlow hooks, skills, and configurations to multiple AI coding runtimes (Claude Code, Cursor, Copilot, Codex, Gemini CLI, Windsurf, Kilo, etc.)
source: get-shit-done Sync Runtime Bridge
triggers:
  - runtime detection
  - adapter configuration
  - multi-runtime setup
---

# Adapter Bridge — 多运行时统一桥接层

## 核心原理

借鉴 GSD Sync Runtime Bridge 的零子进程设计，DevFlow 的核心能力（阶段路由、门禁检查、记忆管理、Token 压缩）应能被任何 AI 编码运行时调用。

**设计目标**: 一次编写，处处运行 — 核心逻辑在 `adapters/shared/` 中，各运行时适配器仅处理配置格式差异。

## 运行时适配矩阵

| 运行时 | 配置位置 | Hook 机制 | 技能加载 | 状态栏支持 |
|--------|---------|----------|---------|-----------|
| Claude Code | `.claude/settings.json`（hooks 段） | Node.js hooks (SessionStart/UserPromptSubmit) | CLAUDE.md + skills/ | statusline.js |
| Cursor | `.cursor/rules/` | `.mdc` 规则文件 | project rules | 无原生 |
| Copilot | `.github/copilot-instructions.md` | 无 hook | instructions 文件 | 无 |
| Codex | `codex.yaml` / `AGENTS.md` | config.toml hooks | agents/ 规则 | 无 |
| Gemini CLI | `.gemini/GEMINI.md` | 扩展 hooks | extensions/ | 无 |
| DeepSeek Harness | `$DSH_HOME/profiles/web/cordis.patch.yml` | Cordis 插件 (`ctx.tools.guard`) + Skill 目录 | `.agents/skills/` | 无（用 session projection） |
| Windsurf | `.windsurf/rules/` | `.mdc` 规则文件 | project rules | 无 |
| Kilo | `kilo.yaml` | hooks 配置 | skills/ | 无 |

> **DeepSeek Harness 是唯一提供代码级门控拦截的宿主**：它的 Cordis 插件可以用
> `ctx.tools.guard()` 同步拒绝工具调用，而其余宿主只能靠提示词约束模型。
> 详见 `deepseek-harness/README.md`。

## 适配器文件结构

```
adapters/
├── README.md              # 本文件
├── shared/                # 运行时无关的核心逻辑
│   ├── core-bridge.js     # 统一入口：阶段路由、状态读取、记忆加载
│   ├── gate-checker.js    # 门禁检查（从 gate-check.sh 升级）
│   └── memory-loader.js   # 记忆系统加载
├── claude-code/           # Claude Code 适配
│   ├── settings.json      # settings 模板
│   ├── hooks.json         # hooks 注册模板
│   └── install.md         # 安装指南
├── cursor/                # Cursor 适配
│   ├── devflow.mdc        # .mdc 规则文件模板
│   └── install.md
├── copilot/               # GitHub Copilot 适配
│   ├── copilot-instructions.md  # instructions 模板
│   └ install.md
├── codex/                 # OpenAI Codex 适配
│   ├── codex.yaml         # Codex 配置模板
│   └── install.md
├── gemini-cli/            # Gemini CLI 适配
│   ├── GEMINI.md          # Gemini 扩展模板
│   └── install.md
└── deepseek-harness/      # DeepSeek Harness 适配
    ├── cordis.patch.yml   # Cordis 插件挂载行（并入 profile patch 层）
    ├── install.md         # 安装指南（Skill junction + 插件挂载）
    └── README.md          # 两套扩展机制说明
```

> `deepseek-harness/` 与其余适配器同构：只有配置模板与安装文档，**不含运行时代码**。
> 真正的门控插件在独立包 `dsh-devflow` 中，独立版本线，避免与多宿主技能绑定发布。

## 核心桥接逻辑 (shared/)

三个已实现的公共模块，所有运行时适配器通过 `require('../shared/core-bridge')` 调用：

### core-bridge.js — 统一入口

| API | 说明 | 返回 |
|-----|------|------|
| `detectRuntime()` | 检测当前 AI 编码环境 | `'claude-code'` / `'cursor'` / ... / `'unknown'` |
| `findProjectDir()` | 向上查找含 `.devflow/` 的项目根 | `string \| null` |
| `readState(dir)` | 解析 state.json | `{ phase, mode, progress, rawContent }` |
| `checkGate(dir, targetPhase)` | 门禁检查 | `{ passed, missingArtifacts, reason }` |
| `loadMemory(dir)` | 加载记忆系统 | `{ projectContext, decisions, knownFailures, lessons }` |
| `getCompressionLevel(dir)` | Caveman 压缩级别 | `'lite'` / `'full'` / `'ultra'` / `'extreme'` |

### gate-checker.js — 门禁检查器

| API | 说明 |
|-----|------|
| `checkGate(dir, gateId)` | 检查单个门控 (G0-G8) |
| `checkAllGates(dir)` | 批量检查所有门控 |
| `getNextGate(dir)` | 获取当前 Phase 的下一个门控 |

### memory-loader.js — 记忆加载器

| API | 说明 |
|-----|------|
| `loadForPhase(dir, phase)` | 按 Phase 增量加载记忆 |
| `loadLessonsOnly(dir)` | 只加载 LESSONS.md |
| `getMemoryTokenBudget(dir, max)` | 估算记忆 Token 预算 |

**CLI 用法**:
```bash
node adapters/shared/core-bridge.js detect-runtime   # 运行时检测
node adapters/shared/core-bridge.js read-state .     # 读取项目状态
node adapters/shared/gate-checker.js check G5        # 检查 G5 门控
node adapters/shared/gate-checker.js next            # 下一个门控
node adapters/shared/memory-loader.js load 4         # 加载 Phase 4 记忆
node adapters/shared/memory-loader.js budget         # Token 预算
```

## 安装流程

1. `install-DevFlow` 技能新增运行时选择步骤
2. 根据选择生成对应适配器配置
3. 将 shared/ 核心逻辑链接到运行时配置
4. 验证配置生效

## 与 hooks 的关系（迁移已完成）

> **历史记录**：原 `hooks/` 下 3 个 Claude Code 专用 hook 已抽象进 `adapters/`，
> 旧文件均已移除。下表为当时的映射关系，**请勿再按旧路径引用**。

| 旧路径（已删除） | 迁移后 |
|---|---|
| `hooks/session-start.js` | `adapters/shared/core-bridge.js` + `adapters/claude-code/hooks.json` |
| `hooks/statusline.js` | `adapters/shared/core-bridge.js` + statusline 适配 |
| `hooks/user-prompt.js` | `adapters/shared/core-bridge.js` + 各运行时规则注入 |

当前 `hooks/` 目录仅保留**运行时无关的通用脚本**（`hooks/scripts/`、`hooks/lib/`）
以及 `hooks/hooks.json`、`hooks/markdown-hooks.yaml`。

## 未来扩展

- Windsurf/Kilo/Void 等: 新增 `adapters/<runtime>/` 目录
- MCP 模式: 通过 MCP Server 暴露 bridge API，运行时无需本地配置