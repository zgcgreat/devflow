# 插件系统

> **状态**: Draft
> **版本**: v3.0-draft
> **创建日期**: 2026-05-20

## 概述

devflow v3.0 提供可扩展的插件系统，支持扩展 Phase、Gate、Agent、Template 和 Command，具备沙箱隔离和签名验证。

## 插件类型

| 类型 | 说明 | 扩展点 |
|------|------|--------|
| Phase 扩展 | 添加新 Phase | L1-INTERACTION Phase 注册表 |
| Gate 增强 | 增强质量门控 | gate-rules.md 规则链 |
| Agent 扩展 | 添加新角色 | L2-ENGINE Agent 池 |
| Template 包 | 添加新模板 | templates/ 目录 |
| Command 工具 | 添加新命令 | GO.md 命令路由表 |

## 命令

```bash
/devflow plugins install <plugin>   # 安装插件
/devflow plugins enable <name>      # 启用插件
/devflow plugins list --enabled     # 查看已启用插件
/devflow plugins create <name>      # 创建新插件
```

## 插件结构

```
plugins/<plugin-name>/
  _SKILL.md          ← 插件入口（标准 SKILL.md 格式）
  manifest.json      ← 插件元数据（名称、版本、权限、签名）
  templates/         ← 插件提供的模板
  references/        ← 插件提供的参考文档
```

## 安全机制

- **沙箱隔离**: 插件只能访问其声明的资源和工具
- **签名验证**: 插件 manifest.json 包含数字签名，安装时验证
- **权限声明**: 插件必须在 manifest.json 中声明所需工具和文件访问权限
- **审核日志**: 插件操作记录到 `.devflow/memory/PLUGIN-AUDIT.md`

## 插件生命周期

1. **安装**: 下载 → 验证签名 → 注册到插件表
2. **启用**: 加载 _SKILL.md → 注入扩展点 → 激活
3. **运行**: 按需调用，受沙箱约束
4. **禁用**: 卸载扩展点 → 保留数据
5. **卸载**: 清理扩展点 + 数据
