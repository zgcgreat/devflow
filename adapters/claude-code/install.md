# Claude Code 安装指南

## 前置条件

- Claude Code CLI 已安装并登录
- Node.js >= 18

## 安装步骤

### 1. 复制配置文件

```bash
# 将 hooks 和 settings 复制到项目 .claude/ 目录
cp adapters/claude-code/hooks.json .claude/hooks.json
cp adapters/claude-code/settings.json .claude/settings.json
```

### 2. 设置环境变量

在 `.env` 或 shell profile 中添加：

```bash
export DevFlow_HOME="$(pwd)/path/to/devflow"
```

### 3. 验证安装

```bash
# 测试 bridge 是否可用
node $DevFlow_HOME/adapters/shared/core-bridge.js detect-runtime
# 应输出: claude-code

# 测试状态读取
node $DevFlow_HOME/adapters/shared/core-bridge.js read-state .
```

### 4. CLAUDE.md 注入

在项目根目录的 `CLAUDE.md` 中添加：

```markdown
## Devflow Integration

This project uses devflow v3.0 workflow. Current phase is tracked in `.devflow/STATE.md`.

- Use `/df:status` to check current phase
- Use `/df:next` to advance to next phase
- Gate checks are enforced automatically
```

## 卸载

```bash
rm .claude/hooks.json .claude/settings.json
# 从 CLAUDE.md 中移除 Devflow Integration 段落
```
