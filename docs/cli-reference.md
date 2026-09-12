---
name: devflow-cli-reference
version: 3.3.0
description: DevFlow CLI 命令完整参考手册
---

# DevFlow CLI 命令参考

> 来源：`bin/devflow.js` 实际实现。完整版见 [SKILL.md](../SKILL.md)。

## Phase 管线

```bash
devflow init --mode [fast|lean|standard|strict]    # 初始化管线
devflow status                                     # 当前状态
devflow phase [--next|--gate G3]                   # 阶段操作
```

## 记忆系统

```bash
devflow mem --save "内容" [--tags a,b]             # 保存记忆
devflow mem --search <关键词>                       # 搜索记忆
devflow mem --stats                                 # 统计信息
devflow mem --forget [--older N]                    # 遗忘过期条目
```

## Party 仲裁

```bash
devflow party --scenario "场景名"                   # Demo 评分
devflow party --role <角色1> <方案1> [--role ...]   # 手动评分
```

## 任务规划

```bash
devflow task --describe "描述" [--visualize]        # DAG 分解
```

## 代码工具

```bash
devflow code --symbol <名称>                        # 符号查询
devflow code --scan <目录>                          # 目录扫描
```

## 压缩引擎 (Caveman)

```bash
devflow caveman --file <路径> [--level level]       # 文件压缩
devflow caveman --compress <文本>                   # 文本压缩
# level: lite | full | ultra | wenyan
```

## 门控 & 健康

```bash
devflow gates --phase <N>                           # 门控检查
devflow install [--target <name>] [--dry-run]       # 安装到运行时 (--list 查看目标)
devflow install --list                              # 列出安装目标与状态
devflow install --uninstall [--target <name>]       # 卸载
devflow doctor                                      # 健康检查
devflow help                                        # 帮助信息
```
