---
name: forge-os-cli-reference
version: 3.2.2
description: ForgeOS CLI 命令完整参考手册
---

# ForgeOS CLI 命令参考

> 来源：`bin/forge-os.js` 实际实现。完整版见 [SKILL.md](../SKILL.md)。

## Phase 管线

```bash
forge-os init --mode [fast|lean|standard|strict]    # 初始化管线
forge-os status                                     # 当前状态
forge-os phase [--next|--gate G3]                   # 阶段操作
```

## 记忆系统

```bash
forge-os mem --save "内容" [--tags a,b]             # 保存记忆
forge-os mem --search <关键词>                       # 搜索记忆
forge-os mem --stats                                 # 统计信息
forge-os mem --forget [--older N]                    # 遗忘过期条目
```

## Party 仲裁

```bash
forge-os party --scenario "场景名"                   # Demo 评分
forge-os party --role <角色1> <方案1> [--role ...]   # 手动评分
```

## 任务规划

```bash
forge-os task --describe "描述" [--visualize]        # DAG 分解
```

## 代码工具

```bash
forge-os code --symbol <名称>                        # 符号查询
forge-os code --scan <目录>                          # 目录扫描
```

## 压缩引擎 (Caveman)

```bash
forge-os caveman --file <路径> [--level level]       # 文件压缩
forge-os caveman --compress <文本>                   # 文本压缩
# level: lite | full | ultra | wenyan
```

## 门控 & 健康

```bash
forge-os gates --phase <N>                           # 门控检查
forge-os install [--target workbuddy|cursor|claude]  # 安装适配
forge-os doctor                                      # 健康检查
forge-os help                                        # 帮助信息
```
