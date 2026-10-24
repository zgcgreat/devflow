---
name: devflow-cli-reference
version: 3.3.1
description: DevFlow CLI 命令完整参考手册
---

# DevFlow CLI 命令参考

> 来源：`bin/devflow.js` 实际实现。完整版见 [SKILL.md](../SKILL.md)。

## 通用旗标

```bash
devflow --version                                  # 输出版本号（等价 -v）
devflow --help                                     # 输出帮助（等价 -h / devflow help）
```

## Phase 管线

```bash
devflow init [--mode fast|lean|standard|strict]    # 初始化管线
devflow status                                     # 当前状态
devflow phase [--next|--gate G3]                   # 阶段操作（详见下方子命令）
devflow phase --status                             # Phase 详情（进度/门控/产出）
devflow phase --list                               # Phase 管线总览
devflow phase --mode <fast|lean|standard|strict>   # 设置模式（重置起始 Phase）
devflow phase --set <N> [--force]                  # 切换到指定 Phase（0/1/1.5/2/2.5/3-8）
devflow phase --next [--force]                     # 推进到下一阶段（受门控护卫）
devflow phase --gate <G3>                          # 标记门控通过
devflow phase --output <文件>                       # 记录产物并通过门控
```

> **`init` 模式自动判定**：未指定 `--mode` 时按项目规模自动调用 `detectMode()`；空目录（greenfield：0 文件 0 行且非 brownfield）自动判为 STANDARD — 从零开始必跑 Phase 0。初始化会创建记忆骨架（含 `domain-skills/` 子目录，用于领域技能沉淀）与项目宪法。

> **`phase --set` 门控语义**：前向跳跃会校验途经所有门控（当前 Phase 之后、目标 Phase 之前），任一未通过即拒绝；经用户确认后可加 `--force` 显式跳过 —— 强制跳过会记录到 state.json 的 `skips` 数组（含 from/to/at/越过的门控清单），供审计追溯，并须在路由声明的『前置裁剪』中标注。

> **`phase --output` 产物校验**：产物路径必填、文件必须存在且为普通文件，且文件名必须等于当前 Phase 的预期产物名（如 `02-design.md`），否则拒绝。

## 模式判定

```bash
devflow detect [--files N] [--lines N] [--modules N] [--risk low|medium|high]
               [--brownfield] [--arch-change] [--data-change]
# 按规模/风险输出建议模式与命中规则；devflow phase --mode <模式> 应用结果
```

## 任务规划

```bash
devflow task --describe "描述" [--visualize]        # DAG 分解
devflow task --file <tasks.json> [--json]          # 加载并校验已有任务计划
devflow task [--describe ... | --file ...] --save <文件>   # 保存任务计划
devflow task [--describe ... | --file ...] --json   # 以 JSON 输出（含 Wave/DAG/mermaid）
```

> **`task --file` 校验流程**：依赖完整性（引用不存在的任务 id 直接报错）→ 环检测（成环时报出环上任务链）→ Kahn 拓扑排序 → 按 deps 最长依赖深度重算 Wave。输入中的 wave 字段缺失/非法会被重算覆盖，以保证依赖永远落在更早的 Wave。

## 记忆系统

```bash
devflow mem --save "内容" [--tags a,b]             # 保存记忆
devflow mem --search <关键词>                       # 搜索记忆
devflow mem --recent                                # 最近记忆
devflow mem --stats                                 # 统计信息
devflow mem --forget [--older N]                    # 遗忘过期条目
```

## Party 仲裁

```bash
devflow party --scenario "场景名"                   # Demo 评分
devflow party --role <角色1> <方案1> [--role ...]   # 手动评分
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
