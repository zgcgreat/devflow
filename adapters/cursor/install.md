# Cursor 安装指南

## 前置条件

- Cursor IDE 已安装
- 项目已打开

## 安装步骤

### 1. 复制规则文件

```bash
# 将 .mdc 规则文件复制到 .cursor/rules/ 目录
cp adapters/cursor/devflow-evo.mdc .cursor/rules/devflow-evo.mdc
```

### 2. 验证安装

在 Cursor 中打开项目，开始新对话，确认 AI 助手能读取 `.devflow-evo/STATE.md`。

### 3. 自定义配置

编辑 `.cursor/rules/devflow-evo.mdc` 中的 `globs` 字段以匹配项目文件模式：

```yaml
globs:
  - "src/**"
  - ".devflow-evo/**"
```

## 限制

Cursor 不支持原生 hook 机制，以下功能需手动触发：
- 阶段门禁检查：手动运行 `node adapters/shared/gate-checker.js <phase>`
- 记忆加载：AI 助手在对话开始时自动读取
- 状态栏：不支持

## 卸载

```bash
rm .cursor/rules/devflow-evo.mdc
```
