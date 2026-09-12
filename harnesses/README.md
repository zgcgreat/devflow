# DevFlow Harness 安装器

把 DevFlow 安装到各 AI 编码运行时。

## 可用目标

| 目标 | 宿主 | 安装方式 | 落点 |
|---|---|---|---|
| `workbuddy` | WorkBuddy | `bundle` 整目录复制 | `~/.workbuddy/skills/devflow` |
| `claude` | Claude Code | `bundle` 整目录复制 | `~/.claude/skills/devflow` |
| `dsh`（别名 `deepseek-harness`） | DeepSeek Harness | `junction` 链接到本仓库 | `~/.agents/skills/devflow` |
| `cursor` / `copilot` / `codex` / `gemini-cli` | 各自 | `manual` 手动安装 | 见 `adapters/<宿主>/install.md` |

三种 kind 的语义：

- **`bundle`** —— 整目录复制。装完即冻结为副本，源码后续改动**不会**同步，需要重装。
- **`junction`** —— 建立指向本仓库的链接。源码改动实时生效，不需要重装。
  DSH Desktop 下链接名必须是 `devflow`（目录名即技能名，DSH 不读 frontmatter 之外的目录约定）。
- **`manual`** —— 该宿主的配置布局未经核实，安装器**拒绝猜测路径**，只给出适配器文档位置。
  这修掉了旧版"传 `--target cursor` 却静默装到 WorkBuddy"的行为。

## 安装

```bash
# 默认安装到 WorkBuddy
node harnesses/install.js

# 指定目标
node harnesses/install.js --target claude
node harnesses/install.js --target dsh

# 只打印计划，不做任何写入
node harnesses/install.js --dry-run --target workbuddy

# 目标目录已存在但没有 DevFlow 安装状态文件（来源不明）时，需显式确认
node harnesses/install.js --target workbuddy --force
```

## 查看与卸载

```bash
node harnesses/install.js --list          # 所有目标 + 安装状态
node harnesses/install.js --status        # 读取当前目标的安装记录
node harnesses/install.js --uninstall --target dsh
node harnesses/install.js --uninstall --dry-run
```

## 状态追踪

每次 `bundle` 安装后写入 `.devflow-install-state.json`（位于目标目录的**父目录**，
避免污染技能目录内容），记录版本、安装时间与完整文件清单：

```json
{
  "version": "3.3.0",
  "target": "bundle",
  "installedAt": "2026-09-12T13:00:00.000Z",
  "files": ["SKILL.md", "GO.md", "..."]
}
```

该清单有两个用途：

1. **增量更新** —— 重新安装会覆盖同名文件，并删除"上次装过、本次源里已不存在"的陈旧文件。
2. **安全闸门** —— 只有存在该文件（证明目标目录是 DevFlow 装出来的）时才允许删除文件；
   否则拒绝覆盖与卸载。链接（junction）目标卸载时**只删链接**，绝不递归删除其指向的真实内容。

## 历史 bug（v3.3.0 及以前，已修复）

| 症状 | 影响 |
|---|---|
| 复制清单硬编码 19 个文件，**不含 `lib/ bin/ layers/ references/ personas/ rules/`** | 而 `SKILL.md` 要求 AI 按需加载 `layers/L1-INTERACTION/phase-*/_SKILL.md` 与 `lib/phase-engine.js` —— 重跑一次会把可用安装降级成残缺安装 |
| `TARGETS` 只有 `workbuddy`，但 `HELP`/`README`/`cli-reference` 三处宣称支持 `cursor\|claude` | 传 `--target cursor` 会**静默**装到 WorkBuddy |
| `bin/devflow.js` 用 `execSync` 拼接字符串转发参数，未做引号处理 | 含空格/引号的参数被拆词 |
