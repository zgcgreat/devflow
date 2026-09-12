---
name: mcp-shrink
preamble-tier: 2
version: 1.0.0
layer: L2-ENGINE
gate: internal
requires: [caveman-shrink, surface-switch]
provides: [three-tier-tool-loading, tool-description-compression, phase-aware-loading]
description: |
  MCP 工具瘦身中间件 — 在 caveman-shrink 三级加载基础上增加 Phase 感知和工具描述压缩。
  Core (7 工具, ~2K tokens) 始终加载，Standard (15 工具, ~5K tokens) 按 Phase 匹配加载，
  All (36+ 工具, ~12K tokens) 用户显式请求时加载。工具描述压缩率 ≥ 70%。
  参考: caveman-shrink MCP 中间件 + Task Master 三级工具加载。
source: CHANGELOG v1.2.0 — caveman-shrink + Task Master three-tier loading
dependencies:
  - caveman-shrink (基础三级加载)
  - surface-switch (运行时模式切换)
  - token-monitor (Token 预算触发压缩)
triggers:
  - Session 启动
  - Phase 转换
  - Token 使用率 > 70%
  - /forgeos:surface 切换
allowed-tools:
  - Read
  - Write
  - Edit
external-inputs: [mcp-tools, phase-context]
---

# MCP Shrink — MCP 工具瘦身中间件

> **核心问题**: MCP 工具描述占用大量 Token（12K+），且多数工具在当前 Phase 不需要。
> **解决方案**: 三级工具加载 + Phase 感知 + 工具描述压缩，减少 MCP Token 消耗 70%+。

---

## 1. 三级工具加载策略

### 1.1 工具分级

| 级别 | 工具数 | Token 占用 | 加载条件 | 适用场景 |
|------|--------|-----------|---------|---------|
| **Core** | 7 | ~2K | 始终加载 | 所有 Phase |
| **Standard** | 15 | ~5K | Phase 匹配时加载 | 日常开发 |
| **All** | 36+ | ~12K | 用户显式请求 | 完整功能 |

### 1.2 Core 级别（始终加载）

```yaml
core:
  file_ops:
    - read_file          # 读取文件
    - write_file         # 写入文件
    - edit_file          # 精确替换
    - glob               # 文件搜索
  execution:
    - bash               # Shell 命令
  search:
    - grep               # 内容搜索
  navigation:
    - list_dir           # 目录列表
```

### 1.3 Standard 级别（按 Phase 匹配）

```yaml
standard:
  # 继承 core
  development:
    - create_file        # 创建文件
    - find_files         # 递归搜索
  task_management:
    - task_create        # 创建任务
    - task_update        # 更新任务
    - task_list          # 列出任务
    - task_next          # 下一个任务
  agent:
    - agent_spawn        # 派生子 Agent
    - skill_invoke       # 调用 Skill
```

### 1.4 Phase 感知加载矩阵

| Phase | 加载级别 | 额外工具 | 说明 |
|-------|---------|---------|------|
| Phase 0-1 | Core | - | 策略/分析阶段，基础工具足够 |
| Phase 2 | Standard | - | 设计阶段需要创建文件 |
| Phase 3 | Standard | task_* | 任务规划需要任务管理 |
| Phase 4 | Standard | agent_spawn, skill_invoke | 实施阶段需要 Agent 派生 |
| Phase 5 | Standard | bash (test runner) | 测试阶段需要运行命令 |
| Phase 6 | Standard | - | 审查阶段 |
| Phase 7 | Core | - | 灰度发布，最小工具集 |
| Phase 8 | Core | - | 归档，最小工具集 |

### 1.5 All 级别（完整工具集）

```yaml
all:
  # 继承 standard
  browser:
    - mcp__playwright__*   # 浏览器自动化
  document:
    - mcp__pdf__*          # PDF 处理
    - mcp__xlsx__*         # Excel 处理
  cloud:
    - connect_cloud_service # 云连接
  search_extended:
    - conversation_search   # 历史对话搜索
  automation:
    - automation_update     # 定时任务
  # ... 全部 MCP 工具
```

---

## 2. 工具描述压缩

### 2.1 压缩级别

| 级别 | 压缩率 | 规则 | 示例 |
|------|--------|------|------|
| **full** | 0% (原始) | 保留完整描述 | `"Searches the codebase for patterns using ripgrep. Supports full regex syntax..."` |
| **shrink** | ~50% | 保留核心功能，移除描述性修饰 | `"rg search: regex pattern, glob filter"` |
| **ultra** | ~75% | 仅保留工具名 + 关键参数 | `"grep [pattern] [glob] → content/files/count"` |
| **extreme** | ~90% | 工具名→别名映射 | `"grep → 内容搜索"` |

### 2.2 压缩规则

```yaml
compression_rules:
  # 始终保留
  preserve:
    - tool_name           # 工具名
    - required_params     # 必需参数
    - return_type         # 返回类型

  # 按级别移除
  shrink:
    remove:
      - examples          # 示例代码
      - edge_cases        # 边界情况说明
      - long_descriptions # 详细描述 → 一句话摘要
    keep:
      - core_description  # 核心功能描述（一句话）
      - param_types       # 参数类型

  ultra:
    remove:
      - all_descriptions  # 所有描述
      - optional_params   # 可选参数
    keep:
      - tool_name
      - required_params
      - param_types

  extreme:
    remove:
      - everything_except_name
    keep:
      - tool_name
      - alias_mapping     # 工具名 → 简短别名
```

### 2.3 压缩示例

```yaml
# 原始描述 (~200 tokens)
grep_original: >
  Search the codebase for patterns using ripgrep. Supports full regex syntax.
  Filter with glob patterns or file types. Use -A/-B for surrounding lines.
  Use output_mode for different formats: content (matching lines), files_with_matches
  (file paths only), count (match counts). Defaults to files_with_matches.

# shrink (~100 tokens, 50% 节省)
grep_shrink: >
  rg search: regex pattern, glob filter, type filter.
  output_mode: content|files|count. -A/-B context lines.

# ultra (~50 tokens, 75% 节省)
grep_ultra: >
  grep [pattern] [glob] [type] → content|files|count, -A/-B context

# extreme (~20 tokens, 90% 节省)
grep_extreme: >
  grep → 内容搜索
```

---

## 3. 配置

### 3.1 工具分级配置

```json
{
  "mcp_shrink": {
    "tiers": {
      "core": {
        "tools": ["read_file", "write_file", "edit_file", "glob", "bash", "grep", "list_dir"],
        "max_tokens": 2000,
        "compression": "shrink"
      },
      "standard": {
        "tools": ["create_file", "find_files", "task_create", "task_update", "task_list", "task_next", "agent_spawn", "skill_invoke"],
        "max_tokens": 5000,
        "compression": "shrink"
      },
      "all": {
        "tools": ["*"],
        "max_tokens": 12000,
        "compression": "full"
      }
    },
    "phase_mapping": {
      "0": "core",
      "1": "core",
      "2": "standard",
      "3": "standard",
      "4": "standard",
      "5": "standard",
      "6": "standard",
      "7": "core",
      "8": "core"
    },
    "compression_triggers": {
      "token_50pct": "shrink",
      "token_70pct": "ultra",
      "token_90pct": "extreme"
    },
    "auto_actions": {
      "token_70pct": "surface-switch lite",
      "token_90pct": "surface-switch extreme"
    }
  }
}
```

### 3.2 环境变量

```
TASK_MASTER_TOOLS=core|standard|all     # 工具级别覆盖
MCP_SHRINK_COMPRESSION=full|shrink|ultra|extreme  # 压缩级别覆盖
MCP_SHRINK_PHASE=0-8                    # Phase 感知加载
```

---

## 4. 与 caveman-shrink 的关系

```
MCP Shrink 是 caveman-shrink 的增强版:

caveman-shrink (现有):
  - 三级工具加载 (core/standard/all)
  - TASK_MASTER_TOOLS 环境变量
  - 模式判定 (Fast/Standard/Strict)

mcp-shrink (新增增强):
  - 继承 caveman-shrink 三级加载
  + Phase 感知自动加载 (Phase 0-8 矩阵)
  + 工具描述压缩 (full/shrink/ultra/extreme)
  + Token 阈值自动触发压缩升级
  + surface-switch 集成 (运行时切换)

层级关系:
  caveman-shrink (基础) → mcp-shrink (增强) → surface-switch (运行时切换)
```

---

## 5. 与 surface-switch 集成

```
surface-switch 模式切换时自动调整 MCP 工具:

/forgeos:surface lite
  → MCP Shrink: core 工具集 + ultra 压缩
  → Token 占用: ~1K

/forgeos:surface standard
  → MCP Shrink: standard 工具集 + shrink 压缩
  → Token 占用: ~5K

/forgeos:surface strict
  → MCP Shrink: all 工具集 + full 压缩
  → Token 占用: ~12K

/forgeos:surface extreme
  → MCP Shrink: core 工具集 + extreme 压缩
  → Token 占用: ~0.5K
```

---

## 6. 降级策略

| 场景 | 降级行为 |
|------|---------|
| caveman-shrink 不可用 | 回退到默认工具加载 |
| Phase 信息不可用 | 使用 Standard 级别 |
| 压缩配置缺失 | 使用 shrink 级别 |
| Token 信息不可用 | 不自动触发压缩升级 |
| surface-switch 不可用 | 仅静态加载，无运行时切换 |

---

## 7. 性能基准

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| Core 级别 Token 占用 | ≤ 2K | 统计工具描述总 Token |
| Standard 级别 Token 占用 | ≤ 5K | 同上 |
| 工具描述压缩率 | ≥ 70% (ultra) | (original - compressed) / original |
| Phase 转换延迟 | < 100ms | 切换工具集耗时 |
| 现有功能无损失 | 100% | 所有工具仍可调用 |

---

## 8. 与其他模块协作

| 模块 | 协作方式 |
|------|---------|
| caveman-shrink | 基础三级加载，MCP Shrink 在此基础上增强 |
| surface-switch | 运行时模式切换触发工具集和压缩级别调整 |
| token-monitor | Token 阈值触发自动压缩升级 |
| token-compression-v2 | MCP Shrink 是 L0 中间件层，token-compression 是 L3 调度层 |
| hooks-system | Session 启动时触发工具加载 |
