# Gemini CLI 安装指南

## 安装步骤

### 1. 复制扩展文件

```bash
# 复制 GEMINI.md 到 .gemini/ 目录
cp adapters/gemini-cli/GEMINI.md .gemini/GEMINI.md
```

### 2. 验证安装

```bash
gemini "what is the current devflow phase?"
```

## 限制

Gemini CLI 无原生 hook 支持。使用 `node adapters/shared/core-bridge.js` 手动获取状态。

## 卸载

```bash
rm .gemini/GEMINI.md
```
