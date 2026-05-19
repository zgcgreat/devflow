# 多项目管理规范

> **来源**: unified-platform  
> **集成位置**: `.devflow/workspace/`  
> **核心价值**: 支持同时管理多个项目，快速切换，状态同步，知识共享

---

## 🎯 核心概念

### 工作区 (Workspace)

**定义**: 包含多个项目的顶级目录

**结构**:
```
workspace/
├── .ultimate-workspace/          # 工作区配置
│   ├── config.yaml               # 工作区全局配置
│   ├── active-project.txt        # 当前活跃项目ID
│   └── projects/                 # 项目索引
│       ├── project-a.yaml
│       ├── project-b.yaml
│       └── project-c.yaml
│
├── project-a/                    # 项目A
│   └── .devflow/
│       ├── state.md
│       ├── memory/
│       └── ...
│
├── project-b/                    # 项目B
│   └── .devflow/
│       ├── state.md
│       ├── memory/
│       └── ...
│
└── project-c/                    # 项目C
    └── .devflow/
        ├── state.md
        ├── memory/
        └── ...
```

### 项目 (Project)

**定义**: 独立的开发单元，有自己的上下文、记忆、状态

**项目配置文件**: `.ultimate-workspace/projects/<project-id>.yaml`

```yaml
# 项目A配置示例
id: "project-a"
name: "电商平台后端"
path: "./project-a"
created_at: "2026-05-17T10:00:00Z"
last_active: "2026-05-17T14:30:00Z"
status: "active"  # active | archived | completed

tech_stack:
  - Node.js
  - Express
  - PostgreSQL
  - Prisma

current_phase: 4
current_wave: 2
budget: 500K
used_budget: 285K

tags:
  - backend
  - ecommerce
  - production

metadata:
  owner: "张三"
  priority: "high"
  deadline: "2026-06-30"
```

---

## 🔧 命令体系

### 1. 列出所有项目

```bash
/unified projects list
```

**输出**:
```markdown
## 工作区项目列表

**当前活跃项目**: project-a (电商平台后端)

| ID | 名称 | 状态 | 阶段 | 预算使用 | 最后活跃 |
|----|------|------|------|---------|---------|
| A | 电商平台后端 | 🟢 Active | Phase 4 | 285K/500K (57%) | 2小时前 |
| B | 用户管理系统 | 🟡 Paused | Phase 2 | 45K/100K (45%) | 昨天 |
| C | 数据分析平台 | ⚪ Archived | Phase 8 | 180K/200K (90%) | 1周前 |

**总计**: 3个项目 (2活跃, 1归档)
```

### 2. 创建新项目

```bash
/unified projects new "项目名称" --tech React,Node.js --budget 300K
```

**执行流程**:
1. 生成项目ID（自动编号或用户指定）
2. 创建项目目录结构
3. 初始化记忆系统
4. 注册到工作区索引
5. 自动切换到新项目

**输出**:
```markdown
## ✅ 新项目创建成功

**项目名称**: 每日简报应用  
**项目ID**: project-d  
**路径**: `./project-d`  
**技术栈**: React, Node.js  
**初始预算**: 300K  

**已创建文件**:
- ✅ `.devflow/state.md`
- ✅ `.devflow/memory/PROJECT_CONTEXT.md`
- ✅ `.devflow/memory/DECISIONS.md`
- ✅ `.devflow/memory/KNOWN_FAILURES.md`

**已注册到工作区**: `.ultimate-workspace/projects/project-d.yaml`

**自动切换**: 现在活跃项目为 `project-d`

**下一步**: 
- `/unified discuss` 开始需求分析
- 或直接输入自然语言需求
```

### 3. 切换项目

```bash
/unified projects switch project-b
```

**执行流程**:
1. 保存当前项目状态（checkpoint）
2. 加载目标项目上下文
3. 更新 `active-project.txt`
4. 显示项目摘要

**输出**:
```markdown
## 🔄 项目切换完成

**从**: project-a (电商平台后端)  
**到**: project-b (用户管理系统)

**项目摘要**:
- 当前阶段: Phase 2 (方案设计)
- 已完成Wave: 0/3
- 预算使用: 45K/100K (45%)
- 最后活跃: 昨天 15:30

**已加载上下文**:
- ✅ `state.md` (Phase 2进行中)
- ✅ `memory/PROJECT_CONTEXT.md`
- ✅ `memory/DECISIONS.md` (12条决策)
- ✅ `memory/LESSONS.md` (3条经验)

**恢复进度**: 继续Phase 2方案设计...
```

### 4. 查看项目详情

```bash
/unified projects info project-a
```

**输出**:
```markdown
## 项目详情: project-a

**基本信息**:
- 名称: 电商平台后端
- 创建时间: 2026-05-17
- 所有者: 张三
- 优先级: High
- 截止日期: 2026-06-30

**技术栈**: Node.js, Express, PostgreSQL, Prisma

**当前状态**:
- 阶段: Phase 4 (实施)
- Wave: 2/5
- 预算: 285K/500K (57%)
- 风险等级: 🟡 Medium

**记忆系统**:
- PROJECT_CONTEXT.md: 156行
- DECISIONS.md: 23条决策
- LESSONS.md: 8条经验
- KNOWN_FAILURES.md: 2条失败记录

**最近活动**:
- 2小时前: Wave 2 Task 3完成
- 4小时前: Wave 2 Task 2完成
- 昨天: Wave 1全部完成

**标签**: #backend #ecommerce #production
```

### 5. 归档项目

```bash
/unified projects archive project-c
```

**执行流程**:
1. 检查项目状态（是否完成）
2. 生成最终报告
3. 压缩历史产物（可选）
4. 标记为archived
5. 从活跃列表移除

**输出**:
```markdown
## 📦 项目归档完成

**项目**: project-c (数据分析平台)  
**状态**: active → archived  

**最终报告**:
- 总耗时: 3天
- 总预算: 180K/200K (90%)
- 完成阶段: Phase 8 (归档)
- 产出物: 12个文件, 3个模块

**记忆沉淀**:
- LESSONS.md: 15条经验 → 已提取到全局知识库
- Domain Skills: 3个领域技能 → 已推广

**归档位置**: `.ultimate-workspace/archived/project-c/`

**注意**: 项目仍可恢复，使用 `/unified projects restore project-c`
```

### 6. 工作区统计

```bash
/unified workspace stats
```

**输出**:
```markdown
## 工作区统计

**总体概览**:
- 项目总数: 5
- 活跃项目: 2
- 归档项目: 2
- 已完成项目: 1

**资源使用**:
- 总预算: 1.5M
- 已使用: 850K (57%)
- 剩余: 650K

**按技术栈分布**:
| 技术栈 | 项目数 | 占比 |
|--------|--------|------|
| React | 3 | 60% |
| Node.js | 4 | 80% |
| PostgreSQL | 2 | 40% |

**按状态分布**:
| 状态 | 项目数 |
|------|--------|
| 🟢 Active | 2 |
| 🟡 Paused | 1 |
| ⚪ Archived | 2 |

**最近活跃**:
1. project-a: 2小时前 (Phase 4)
2. project-b: 昨天 (Phase 2)
3. project-d: 3天前 (Phase 1)
```

### 7. 跨项目知识共享

```bash
/unified knowledge share --from project-a --to project-b --topic "JWT认证"
```

**执行流程**:
1. 从源项目提取相关知识
2. 格式化为目标项目可用格式
3. 注入到目标项目记忆系统
4. 记录共享日志

**输出**:
```markdown
## 📤 知识共享完成

**从**: project-a (电商平台后端)  
**到**: project-b (用户管理系统)  
**主题**: JWT认证

**共享内容**:
- DECISIONS.md: 3条相关决策
- LESSONS.md: 2条相关经验
- Code Snippets: 5个代码片段

**已注入到 project-b**:
- ✅ `memory/DECISIONS.md` (+3条)
- ✅ `memory/LESSONS.md` (+2条)
- ✅ `references/jwt-auth-examples.md` (新建)

**共享日志**: `.ultimate-workspace/knowledge-share-log.md`
```

---

## 🔄 状态同步机制

### 自动保存Checkpoint

**触发条件**:
- 切换项目前
- Session关闭时
- 每完成一个Wave后
- 用户手动触发 `/checkpoint save`

**Checkpoint内容**:
```yaml
checkpoint:
  timestamp: "2026-05-17T14:30:00Z"
  project_id: "project-a"
  phase: 4
  wave: 2
  task: "task-2-3"
  budget_used: 285K
  files_modified:
    - "src/api/auth.ts"
    - "tests/auth.test.ts"
  git_commit: "abc123"
  summary: "Wave 2 Task 3完成，JWT刷新逻辑实现"
```

### 状态恢复

**切换项目时自动执行**:
1. 读取 `active-project.txt`
2. 加载对应项目的 `state.md`
3. 恢复Phase/Wave/Task状态
4. 加载记忆系统文件
5. 显示恢复提示

---

## 💾 自动备份策略

### 本地备份

**频率**: 每次Checkpoint时  
**位置**: `.ultimate-workspace/backups/<project-id>/<timestamp>/`  
**保留**: 最近10个备份

### 云端备份（可选）

**配置**: `.ultimate-workspace/config.yaml`

```yaml
backup:
  enabled: true
  provider: "github"  # github | gitlab | s3
  frequency: "daily"  # hourly | daily | weekly
  retention_days: 30
```

---

## 🌐 跨项目知识共享

### 全局知识库

**位置**: `.ultimate-workspace/global-knowledge/`

**结构**:
```
global-knowledge/
├── patterns/              # 设计模式
│   ├── jwt-auth.md
│   ├── rate-limiting.md
│   └── caching-strategy.md
├── lessons/               # 通用经验
│   ├── api-error-handling.md
│   └── performance-optimization.md
└── snippets/              # 代码片段
    ├── react-hooks.md
    └── express-middleware.md
```

### 自动提取机制

**触发条件**:
- 项目归档时
- LESSONS.md达到10条以上
- 用户手动触发 `/knowledge extract`

**提取规则**:
1. 识别通用性经验（非项目特定）
2. 去重（与现有全局知识对比）
3. 格式化（统一模板）
4. 分类存储
5. 建立索引

---

## ⚠️ 注意事项

### 1. 避免并发冲突

**规则**: 同一时间只能有一个活跃项目

**实现**: 
- `active-project.txt` 作为锁文件
- 切换项目时自动释放旧锁
- 检测到冲突时提示用户

### 2. 预算隔离

**规则**: 每个项目独立预算，不共享

**例外**: 可通过 `/budget transfer` 在项目间转移预算

### 3. 记忆系统隔离

**规则**: 每个项目有独立的记忆系统

**共享**: 通过显式的知识共享命令，而非自动同步

### 4. Git仓库管理

**推荐**: 每个项目独立Git仓库

**备选**: 单仓库多目录（monorepo），需配置 `.gitignore`

---

## 📖 最佳实践

1. **合理命名项目**: 使用清晰的名称和ID
2. **定期归档**: 完成的项目及时归档
3. **善用标签**: 便于搜索和过滤
4. **知识共享**: 主动提取和分享经验
5. **备份策略**: 重要项目启用云端备份
6. **预算监控**: 定期检查各项目预算使用情况

---

## 🔗 参考文件

- `docs/MULTI-PROJECT-MANAGEMENT.md` (详细规范)
- `.ultimate-workspace/config.yaml` (配置示例)
- `templates/project-template.yaml` (项目模板)
