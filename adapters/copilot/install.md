# GitHub Copilot 安装指南

## 安装步骤

### 1. 复制指令文件

```bash
# 将指令文件复制到 .github/ 目录
cp adapters/copilot/copilot-instructions.md .github/copilot-instructions.md
```

### 2. 验证安装

在 VS Code 中打开项目，确认 Copilot Chat 能响应 devflow-evo 相关指令。

## 限制

Copilot 无原生 hook 机制：
- 阶段门禁需手动检查
- 记忆系统需手动读取
- 无状态栏支持

## 卸载

```bash
rm .github/copilot-instructions.md
```
