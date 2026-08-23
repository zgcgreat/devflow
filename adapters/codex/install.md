# OpenAI Codex 安装指南

## 安装步骤

### 1. 复制配置文件

```bash
# 复制 codex.yaml 到项目根目录
cp adapters/codex/codex.yaml codex.yaml
```

### 2. 设置环境变量

```bash
export ForgeOS_HOME="$(pwd)/path/to/forgeos"
```

### 3. 验证安装

```bash
codex --config codex.yaml "check forgeos status"
```

## 限制

Codex sandbox 模式下文件系统访问受限，可能需要调整 sandbox 配置。

## 卸载

```bash
rm codex.yaml
```
