---
name: caveman-shrink
version: 3.2.0
layer: L2-ENGINE
gate: internal
requires: [mcp-tools, tool-group-config]
provides: [compressed-tool-descriptions, reduced-context-window]
description: MCP tool/group-level compression engine — shrinks tool descriptions and group metadata from context, reducing 70-76% context consumption
source: claude-task-master TASK_MASTER_TOOLS + GSD context-budget + caveman compression
dependencies:
  - token-compression-v2
  - output-compression
triggers:
  - session start
  - tool group switch
  - context window > 70%
---

# Caveman Shrink — MCP 中间件压缩引擎

## 核心能力

在 `token-compression-v2`（AI 输出/记忆压缩）基础上，增加 **MCP 工具/工具组级别** 的压缩层，在工具描述进入 context 之前就将其瘦身。

## 设计理念

Claude Code / Cursor 等 agent 在启动时会加载大量 MCP 工具描述。默认情况下，每个 MCP 工具的完整 schema（description、parameters、properties）都会进入 system prompt / context，造成 **70-76%** 的无意义 context 消耗。

Caveman Shrink 通过 `TASK_MASTER_TOOLS` 环境变量控制工具组加载，配合压缩后的工具描述，实现**中间件级**上下文优化。

## 工具组分级配置

### 三级加载模式

| 模式 | 环境变量 | 工具数量 | Context 节省 | 适用场景 |
|------|---------|---------|-------------|---------|
| `core` | `TASK_MASTER_TOOLS=core` | ~5 | ~76% | Fast/Lean 模式 |
| `standard` | `TASK_MASTER_TOOLS=standard` | ~15 | ~55% | Standard 模式 |
| `all` | `TASK_MASTER_TOOLS=all` | ~30+ | baseline | Strict 模式 |

### 压缩规则

| 压缩级别 | 规则 | 示例 |
|---------|------|------|
| **完整** | 原始 tool description | `"List all files and directories in the given path..."` |
| **shrink** | 保留核心功能名，移除描述性修饰 | `"list files in path"` |
| **ultra** | 仅保留工具名 + 关键参数 | `"ls [path]"` |
| **extreme** | 工具名→别名映射（仅 AI 内部理解） | `"ls → 文件列表"` |

### 自动触发条件

```
Session 启动时:
  ├── 读取 mode-rules.md 判定模式
  ├── Fast/Lean → TASK_MASTER_TOOLS=core
  ├── Standard → TASK_MASTER_TOOLS=standard
  └── Strict → TASK_MASTER_TOOLS=all

Context > 70%:
  ├── 当前工具描述长度 > 200 字符 → shrink
  ├── 当前工具描述长度 > 500 字符 → ultra
  └── Context > 90% → extreme（仅保留工具名映射）
```

## 工具组定义（TASK_MASTER_TOOLS）

### core 模式（必需工具）

```yaml
core:
  - read_file        # 读取文件内容
  - write_file       # 写入/覆盖文件
  - edit_file        # 精确字符串替换
  - bash             # 执行 Shell 命令
  - glob             # 文件模式搜索
```

### standard 模式（core + 常用工具）

```yaml
standard:
  # 继承 core
  - grep             # 文本内容搜索
  - find_files       # 递归文件搜索
  - list_dir         # 列出目录内容
  - create_file      # 创建新文件
  - task_create      # 创建任务
  - task_update      # 更新任务
  - task_list        # 列出任务
  - skill_invoke     # 调用 Skill
  - agent_spawn      # 派生子 Agent
```

### all 模式（standard + 全部工具）

```yaml
all:
  # 继承 standard
  - mcp__playwright__*       # 浏览器自动化
  - mcp__pdf__*              # PDF 处理
  - mcp__xlsx__*             # Excel 处理
  - mcp__pdfkit-py__*        # PDF 高级操作
  - automation_update        # 定时任务管理
  - connect_cloud_service    # 云连接
  - conversation_search      # 历史对话搜索
  # ... 全部工具
```

## 与 token-compression-v2 的关系

| 层级 | 模块 | 压缩对象 | 节省效果 |
|------|------|---------|---------|
| **L0: 中间件层** | caveman-shrink | MCP 工具描述 | 70-76% |
| **L1: 输入层** | memory-compression | 记忆文件内容 | 40-60% |
| **L2: 输出层** | output-compression | AI 回复文本 | 40-90% |
| **L3: 上下文调度** | token-compression-v2 | 全局上下文预算 | 调度优化 |

**协同流程**：
```
Session 启动
  → caveman-shrink: 按模式加载工具组（节省 70-76%）
  → token-compression-v2: 根据 Phase 自动触发压缩级别
  → 运行中: memory-compression 定期压缩记忆文件
  → 输出时: output-compression 压缩 AI 回复
```

## Phase 集成

### Phase 0-1（需求阶段）
- 加载 `core` 模式
- 仅需 read_file、bash、glob 即可读取项目状态

### Phase 2-3（设计阶段）
- 切换到 `standard` 模式
- 需要 grep、find_files、agent_spawn 进行探索

### Phase 4-5（实施阶段）
- 保持 `standard` 模式
- Context 消耗高峰期，启用 ultra 压缩

### Phase 6-8（审查归档）
- 按需切换 `all` 模式
- Phase 8 归档时恢复 extreme 压缩

## 实现方式

```
layers/L2-ENGINE/caveman-shrink/
├── _SKILL.md          # 本文件（零脚本，AI 按指令执行）
└── tool-groups.md     # 工具组定义参考
```

**AI 执行方式**：
1. Session 启动时读取 `mode-rules.md` 判定模式
2. 按对应模式加载工具组，忽略未加载工具的详细描述
3. Context > 70% 时自动降级压缩级别

## 效果基准

| 场景 | 原始 Context | Shrink 后 | 节省 |
|------|------------|----------|------|
| core 模式 | ~15K | ~3.5K | 76% |
| standard 模式 | ~25K | ~11K | 56% |
| all 模式 | ~40K | ~40K | 0% |

> 与 claude-task-master 的 `TASK_MASTER_TOOLS` 环境变量方案对齐，确保跨 agent 兼容。
