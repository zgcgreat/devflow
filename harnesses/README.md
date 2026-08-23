# ForgeOS Harness 适配器

将 forge-os 安装到各 AI 编码运行时。

## 安装

```bash
# 默认安装到 WorkBuddy (./.workbuddy/skills/forge-os/)
node harnesses/install.js --target workbuddy

# 安装到 Cursor IDE (./.cursor/rules/forge-os-*.mdc)
node harnesses/install.js --target cursor

# 安装到 Claude Code (~/.claude/rules/forge-os/)
node harnesses/install.js --target claude

# 模拟安装
node harnesses/install.js --dry-run --target cursor
```

## 卸载

```bash
node harnesses/install.js --uninstall --target cursor
node harnesses/install.js --uninstall --target workbuddy
```

## 查看可用目标

```bash
node harnesses/install.js --list
```

## 状态追踪

每次安装后生成 `.forge-os-install-state.json`，记录版本、安装时间、文件数。
支持增量更新：重新执行安装会覆盖旧文件。
