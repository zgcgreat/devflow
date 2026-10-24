# Claude Code 安装指南

## 前置条件

- Claude Code CLI 已安装并登录
- Node.js >= 18

## 安装步骤

### 1. 合并配置文件

把 `settings.json` 里的 hooks 配置段合并进你已有的 `.claude/settings.json`（与 `README.md` Installation 一致）。
**不要整文件覆盖** —— `.claude/settings.json` 中通常已有你的其他配置。

注意：Claude Code 不读取 `.claude/hooks.json`，`hooks.json` 仅作为 hook 映射参考，无需复制到 `.claude/`。

### 2. 设置环境变量

在 `.env` 或 shell profile 中添加：

```bash
export DEVFLOW_HOME="$(pwd)/path/to/devflow"
```

### 3. 验证安装

```bash
# 测试 bridge 是否可用
node $DEVFLOW_HOME/adapters/shared/core-bridge.js detect-runtime
# 应输出: claude-code

# 测试状态读取
node $DEVFLOW_HOME/adapters/shared/core-bridge.js read-state .
```

### 4. CLAUDE.md 注入

在项目根目录的 `CLAUDE.md` 中添加：

```markdown
## DevFlow Integration

This project uses devflow v3.0 workflow. Current phase is tracked in `.devflow/state.json`.

- Use `/df:status` to check current phase
- Use `/df:next` to advance to next phase
- Gate checks are enforced automatically
```

## 卸载

```bash
# 从 .claude/settings.json 中移除合并进去的 DevFlow hooks 配置段
# 从 CLAUDE.md 中移除 DevFlow Integration 段落
```
