---
name: adapter-bridge
version: 3.0.0
layer: L2-ENGINE
description: Unified runtime bridge that adapts devflow-evo hooks, skills, and configurations to multiple AI coding runtimes (Claude Code, Cursor, Copilot, Codex, Gemini CLI, Windsurf, Kilo, etc.)
source: get-shit-done Sync Runtime Bridge
triggers:
  - runtime detection
  - adapter configuration
  - multi-runtime setup
---

# Adapter Bridge — 多运行时统一桥接层

## 核心原理

借鉴 GSD Sync Runtime Bridge 的零子进程设计，devflow-evo 的核心能力（阶段路由、门禁检查、记忆管理、Token 压缩）应能被任何 AI 编码运行时调用。

**设计目标**: 一次编写，处处运行 — 核心逻辑在 `adapters/shared/` 中，各运行时适配器仅处理配置格式差异。

## 运行时适配矩阵

| 运行时 | 配置位置 | Hook 机制 | 技能加载 | 状态栏支持 |
|--------|---------|----------|---------|-----------|
| Claude Code | `.claude/settings.json` + `.claude/hooks.json` | Node.js hooks (SessionStart/UserPromptSubmit) | CLAUDE.md + skills/ | statusline.js |
| Cursor | `.cursor/rules/` | `.mdc` 规则文件 | project rules | 无原生 |
| Copilot | `.github/copilot-instructions.md` | 无 hook | instructions 文件 | 无 |
| Codex | `codex.yaml` / `AGENTS.md` | config.toml hooks | agents/ 规则 | 无 |
| Gemini CLI | `.gemini/GEMINI.md` | 扩展 hooks | extensions/ | 无 |
| Windsurf | `.windsurf/rules/` | `.mdc` 规则文件 | project rules | 无 |
| Kilo | `kilo.yaml` | hooks 配置 | skills/ | 无 |

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
│   ├── devflow-evo.mdc        # .mdc 规则文件模板
│   └── install.md
├── copilot/               # GitHub Copilot 适配
│   ├── copilot-instructions.md  # instructions 模板
│   └ install.md
├── codex/                 # OpenAI Codex 适配
│   ├── codex.yaml         # Codex 配置模板
│   └── install.md
└── gemini-cli/            # Gemini CLI 适配
│   ├── GEMINI.md          # Gemini 扩展模板
│   └── install.md
```

## 核心桥接逻辑 (shared/core-bridge.js)

```javascript
// 统一入口 — 所有运行时适配器调用此模块
// 功能: 阶段路由、状态读取、记忆加载、Token 压缩级别查询

const bridge = {
  // 读取项目状态
  readState(projectDir) {
    // 解析 .devflow-evo/STATE.md
    // 返回: { phase, mode, progress, gateStatus }
  },

  // 门禁检查
  checkGate(projectDir, targetPhase) {
    // 检查目标阶段的前置条件是否满足
    // 返回: { passed, missingArtifacts, reason }
  },

  // 加载记忆
  loadMemory(projectDir) {
    // 加载 memory/ 下所有模板文件
    // 返回: { projectContext, decisions, knownFailures, lessons }
  },

  // 获取当前压缩级别
  getCompressionLevel(projectDir) {
    // 读取 .devflow-evo/config.yaml 中的 caveman.level
    // 返回: 'lite' | 'full' | 'ultra' | 'extreme'
  },

  // 运行时检测
  detectRuntime() {
    // 检测当前运行环境
    // 返回: 'claude-code' | 'cursor' | 'copilot' | 'codex' | 'gemini-cli' | 'unknown'
  }
};
```

## 安装流程

1. `install-devflow-evo` 技能新增运行时选择步骤
2. 根据选择生成对应适配器配置
3. 将 shared/ 核心逻辑链接到运行时配置
4. 验证配置生效

## 与现有 hooks 的关系

现有 `hooks/` 目录下的 3 个 Claude Code hooks 保持不变。新增 `adapters/` 是对它们的抽象和扩展：
- `hooks/session-start.js` → `adapters/shared/core-bridge.js` + `adapters/claude-code/hooks.json`
- `hooks/statusline.js` → `adapters/shared/core-bridge.js` + statusline 适配
- `hooks/user-prompt.js` → `adapters/shared/core-bridge.js` + 各运行时规则注入

## 未来扩展

- Windsurf/Kilo/Void 等: 新增 `adapters/<runtime>/` 目录
- MCP 模式: 通过 MCP Server 暴露 bridge API，运行时无需本地配置