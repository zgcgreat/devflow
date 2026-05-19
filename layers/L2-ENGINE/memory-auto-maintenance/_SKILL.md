---
name: memory-auto-maintenance
version: 3.0-draft
layer: L2-ENGINE
description: Automatic memory file maintenance — deduplication, archival, freshness checks, and size management
source: devflow LESSONS + caveman + context-rot-prevention
dependencies:
  - memory-compression
  - context-rot-prevention
triggers:
  - phase 8 archive
  - periodic check
  - memory size threshold
---

# Memory Auto Maintenance — 记忆自动维护

## 维护任务

### 1. 去重
- 扫描 LESSONS.md 中重复的教训
- 扫描 DECISIONS.md 中重复的决策
- 合并相同主题的条目

### 2. 归档
- 超过 30 天的日常记录归档到 MEMORY.md
- 归档后删除日常文件
- 保留最近 7 天的日常文件

### 3. 新鲜度检查
- 集成 context-rot-prevention 的过期检查
- 标记需要验证的条目

### 4. 大小管理
- 记忆总大小 > 50K → 触发 lite 压缩
- 记忆总大小 > 100K → 触发 ultra 压缩
- 单个文件 > 20K → 拆分为子文件

### 5. 一致性检查
- 验证记忆中引用的路径是否存在
- 验证记忆中引用的模块是否仍存在
- 移除悬空引用

## 执行时机

| 触发 | 频率 | 执行的维护任务 |
|------|------|-------------|
| Phase 8 Archive | 每次归档 | 全部 5 项 |
| Phase 0 Start | 每次新需求 | 新鲜度 + 一致性 |
| 超过 30 天 | 自动 | 归档 + 去重 |
| 大小超阈值 | 即时 | 大小管理 |

## CLI

```bash
# 全面维护
node memory-maintenance.js maintain /path/to/project

# 仅检查
node memory-maintenance.js check /path/to/project

# 仅归档
node memory-maintenance.js archive /path/to/project --days 30
```
