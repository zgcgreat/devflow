# devflow-kit Stage: 7-Integration（集成发布）

> **阶段定位**：生成发布清单，准备上线
> **前置条件**：06-review审查通过
> **后置产物**：`.devflow-kit/<req-id>/07-release-checklist.md`

## Skill元信息

```yaml
name: stage-7-integration
version: 1.0.0
description: devflow-kit工作流第7阶段 - 集成发布与回滚方案
author: devflow-kit
dependencies:
  - devops
```

## 输入

- `.devflow-kit/<req-id>/` 全部产物
- `.devflow-kit/lessons-learned.md`
- `.devflow-kit/requirements-baseline.md` + `.devflow-kit/design-baseline.md`（Delta合并用）
- `git log`（本次改动的commit历史）

## 输出

- `.devflow-kit/<req-id>/07-release-checklist.md`
- 更新 `.devflow-kit/STATE.md`
- 归档当前需求到 `.devflow-kit/archive/<req-id>/`

## 入口门禁

```markdown
IF 缺 06-review审查结论 OR 审查结论为"不通过":
  输出: "规则 R2.7 触发：7-integration 需要审查通过。请先完成 6-review。"
  STOP
```

## 执行流程

### Step 1: 读取前置产物

**⚠️ 强制规则**：必须先读取以下文件，提取关键信息后才能汇总变更。

#### 1.1 读取需求分析（AC基线）

从 `.devflow-kit/<req-id>/01-analysis.md` 提取：
- **AC列表**：所有验收标准（用于验证发布前是否全部通过）
- **非功能需求**：性能/安全要求（用于验证是否达标）

**自检**：
- ⏳ 已读取01-analysis.md
- ⏳ 已提取所有AC列表

#### 1.2 读取测试报告与审查报告

从 `.devflow-kit/<req-id>/05-test-report.md` 和 `06-审查报告.md` 提取：
- **测试结果**：各轮测试通过率、AC覆盖矩阵
- **审查结论**：代码审查是否通过、遗留问题清单

**自检**：
- ⏳ 已读取05-test-report.md
- ⏳ 已读取06-审查报告.md
- ⏳ 已确认测试结论为“通过”
- ⏳ 已确认审查结论为“通过”或“有条件通过”

#### 1.3 读取dev-log

从所有 `*-dev-log.md` 提取：
- **任务列表**：所有task及其write_files范围
- **实施过程**：每个任务的修改内容
- **Diff边界验证**：确认无越界修改

**自检**：
- ⏳ 已读取所有dev-log（T01~TN）
- ⏳ 已确认所有verify通过
- ⏳ 已确认Diff边界验证通过（0越界）

#### 1.4 读取git log

```bash
git log --oneline --since="<需求开始日期>"
```

提取：
- **提交历史**：所有相关commit
- **文件变更统计**：新增/修改/删除的文件数

**自检**：
- ⏳ 已读取git log
- ⏳ 已列出所有变更文件

### Step 2: 汇总变更内容

从git log和dev-log中提取：

```markdown
## 变更汇总

**新增文件** (5个):
- src/features/notifications/*
- src/api/notifications/*

**修改文件** (3个):
- src/services/user-service.ts (+45行)
- src/components/Header.tsx (+12行)
- package.json (+2依赖)

**删除文件** (0个):
无

**数据库变更**:
- 新增表: notifications
- 新增索引: idx_notifications_user_id
- 数据迁移: 无

**配置变更**:
- 新增环境变量: REDIS_URL, AMQP_URL
- 新增配置项: notification.cache.ttl
```

### Step 2: 生成发布检查清单

**部署前检查**：

```markdown
## 发布检查清单

### 代码层面
- ⏳ 所有测试通过（单元/集成/E2E）
- ⏳ 代码审查通过（无🔴问题）
- ⏳ ESLint/静态检查通过
- ⏳ 依赖漏洞扫描通过（npm audit）
- ⏳ 构建成功（npm run build）

### 数据库层面
- ⏳ 迁移脚本已准备（prisma migrate）
- ⏳ 备份方案已确认
- ⏳ 回滚脚本已测试

### 配置层面
- ⏳ 环境变量已在生产环境配置
- ⏳ 配置文件已更新
- ⏳ 密钥/证书已轮换（如需要）

### 基础设施
- ⏳ 依赖服务可用（Redis/RabbitMQ/ES）
- ⏳ 监控告警已配置
- ⏳ 日志收集正常
- ⏳ CDN缓存已清理（如需要）

### 业务层面
- ⏳ AC全部通过
- ⏳ 性能指标达标（P95 < 200ms）
- ⏳ 无障碍测试通过（前端）
- ⏳ 跨浏览器测试通过（前端）
```

### Step 3: 制定发布步骤

**蓝绿部署示例**：

```markdown
## 发布步骤

### 阶段1: 准备（T-30分钟）
1. 通知团队即将发布
2. 确认回滚负责人
3. 检查监控面板正常

### 阶段2: 备份（T-10分钟）
```bash
# 数据库备份
pg_dump -U postgres dbname > backup_$(date +%Y%m%d_%H%M%S).sql

# 配置备份
cp .env .env.backup
```

### 阶段3: 部署（T=0）
```bash
# Kubernetes蓝绿部署
kubectl set image deployment/app app=new-image:v1.2.3
kubectl rollout status deployment/app --timeout=300s

# 或 Docker Compose
docker-compose up -d --no-deps app
```

### 阶段4: 验证（T+5分钟）
```bash
# 健康检查
curl http://localhost:3000/health

# 冒烟测试
npm run test:smoke

# 关键业务验证
curl http://localhost:3000/api/notifications | jq '.data | length'
```

### 阶段5: 观察（T+30分钟）
- 监控错误率 < 1%
- 监控P95响应时间 < 500ms
- 监控业务指标（通知发送量、用户活跃度）
```

### Step 4: 制定回滚方案

**触发条件**：
- 错误率 > 5%
- P95响应时间 > 2s
- 核心功能不可用
- 数据不一致

**回滚步骤**：

```markdown
## 回滚方案

### 触发条件
- 错误率 > 5% 持续5分钟
- P95 > 2s 持续10分钟
- 核心AC失败

### 回滚步骤
```bash
# 1. 切换回旧版本
kubectl rollout undo deployment/app

# 2. 验证回滚成功
kubectl rollout status deployment/app
curl http://localhost:3000/health

# 3. 回滚数据库（如需要）
psql -U postgres dbname < backup_20260115_143000.sql

# 4. 清理新数据（如需要）
DELETE FROM notifications WHERE created_at > '2026-01-15 14:30:00';
```

### 预计回滚时间
- 应用回滚: 2分钟
- 数据库回滚: 5分钟
- 总计: 7分钟

### 回滚后验证
- ⏳ 健康检查通过
- ⏳ 核心功能可用
- ⏳ 数据一致性检查
```

### Step 5: Delta模式特殊处理

如果是Delta模式，需要合并基线：

```markdown
## Delta合并说明

**requirements-baseline合并**:
- 将 01-analysis-delta.md 的变更合并到基线
- 生成新的requirements-baseline: `.devflow-kit/requirements-baseline.md`

**design-baseline合并**:
- 将 02-design-delta.md 的变更合并到基线
- 生成新的design-baseline: `.devflow-kit/design-baseline.md`

**命令**:
```bash
# AI自动执行合并逻辑
# 1. 读取基线
# 2. 应用Delta变更
# 3. 写回新基线
```
```

### Step 6: 生成lessons-learned

**⚠️ 强制步骤**：必须从本次需求中提取经验，写入两个位置：

#### 6.1 写入项目级 lessons-learned.md

追加到 `.devflow-kit/lessons-learned.md`：

```markdown
## L-NNN: <经验标题>

**标签**: `<tag1>` `<tag2>`
**来源**: <req-id> (<YYYY-MM-DD>)
**适用场景**: <何时使用此经验>

### 成功经验

✅ <经验 1：描述 + 效果>
✅ <经验 2>

### 踩坑记录

❌ <问题> → <解决方案>

### 代码模式

<如有可复用代码片段>
```

#### 6.2 写入 07-release-checklist.md

**⚠️ 强制规则**：07-release-checklist.md 必须包含 lessons-learned 段落。

```markdown
## lessons-learned

### 成功经验

1. ✅ <经验 1>
2. ✅ <经验 2>

### 踩坑记录

1. ❌ <问题> → <解决方案>

### 最佳实践

1. 📝 <实践 1>
2. 📝 <实践 2>

### 待优化

1. 🔧 <优化建议>
```

#### 6.3 经验提取来源

从以下产物提取：
- `02-design.md` 的 `§9 架构沉淀建议`
- `04-dev-log.md` 的 `关键决策` 和 `与设计的偏离`
- `05-test-report.md` 的测试教训
- `06-code-review.md` 的审查发现

### Step 7: 生成发布清单

**⚠️ 强制规则**：输出前必须先读取模板文件 `flow/templates/07-release-checklist.md`。

按模板生成 `.devflow-kit/<req-id>/07-release-checklist.md`，包含：
- **必须包含模板所有段落**（不得省略或改写）
- **所有 `<...>` 占位符必须替换为实际值**
- 变更汇总
- 发布检查清单
- 发布步骤
- 回滚方案
- Delta合并说明（如适用）
- lessons-learned

**自检**：输出前逐项核对模板强制规则（R13.9 / R13.10）

### Step 8: 归档当前需求

```bash
# 移动产物到archive
mv .devflow-kit/<req-id>/ .devflow-kit/archive/<req-id>/

# 更新项目状态
```

### Step 9: 更新项目状态

```markdown
当前阶段: integration
阶段状态: completed
上次完成阶段: integration
下一阶段: none（需求已完成）

阶段进度:
- ✅ 需求确认 → 00-requirements.md
- ✅ 需求分析 → 01-analysis.md
- ✅ 方案设计 → 02-design.md
- ✅ 任务拆分 → 03-tasks.md
- ✅ 开发执行 → 04-dev-log.md
- ✅ 测试验证 → 05-test-report.md
- ✅ 代码审查 → 06-review记录.md
- ✅ 集成发布 → 07-release-checklist.md
```

## 自检清单

- ⏳ **已读取模板文件** `flow/templates/07-release-checklist.md`
- ⏳ **已读取所有前置产物**（01需求分析/05测试报告/06审查报告/dev-log/git log）
- ⏳ **已提取AC列表**（用于验证发布前全部通过）
- ⏳ 发布检查清单完整（代码/数据库/配置/基础设施/业务）
- ⏳ 发布步骤清晰可执行
- ⏳ 回滚方案完整（触发条件+步骤+预计时间）
- ⏳ Delta模式已合并基线（如适用）
- ⏳ **产物包含模板所有段落**
- ⏳ **所有占位符已替换**
- ⏳ lessons-learned已追加
- ⏳ 需求已归档到archive
- ⏳ STATE.md已更新

## 约束

- **禁止**没有回滚方案就发布
- **禁止**跳过冒烟测试
- **必须**备份数据库后再部署
- Delta模式**必须**合并基线

## 触发下一步

需求已完成，等待下一个需求。

### Step 8: 更新记忆系统（强制执行）

**⚠️ 强制规则**：每个需求完成后，必须更新记忆系统。

#### 8.1 检查记忆系统是否存在

```python
# 伪代码
if exists(".devflow-kit/memory/"):
    print("✅ 检测到记忆系统，开始更新...")
else:
    print("ℹ️ 未检测到记忆系统，跳过更新")
    print("💡 提示：运行 `Use manage-memory` 初始化记忆系统")
    return
```

#### 8.2 更新 CURRENT_STATE.md

**提取本次需求的关键信息**：
- 需求ID和名称
- 完成时间
- 主要变更内容
- 下一步建议

**更新格式**：
```markdown
# Current State

**最后更新**: YYYY-MM-DD HH:mm:ss

## 当前焦点
<下一个待开发的需求 或 "无">

## 最近完成
- ✅ <本次需求名称> (<req-id>) - YYYY-MM-DD
  - 主要功能：<简要描述>
  - 关键决策：<如有>

## 待解决问题
- <从06-code-review.md提取的遗留问题>

## 下一步
- <建议的下一个需求>
```

#### 8.3 追加 DECISIONS.md（如有新决策）

**从 02-design.md 和 06-code-review.md 提取重要决策**：

```markdown
## [YYYY-MM-DD] <决策标题>

**背景**: <为什么做这个决策>

**决策**: <具体决策内容>

**理由**: <为什么选这个方案>

**影响**: <对未来的影响>

**来源**: `.devflow-kit/<req-id>/02-design.md`
```

#### 8.4 追加 KNOWN_FAILURES.md（如有新失败模式）

**从 05-test-report.md 和 06-code-review.md 提取失败模式**：

```markdown
## [YYYY-MM-DD] <失败模式标题>

**现象**: <出了什么问题>

**根因**: <根本原因是什么>

**解决方案**: <如何修复>

**预防措施**: <如何避免再次发生>

**来源**: `.devflow-kit/<req-id>/05-test-report.md`
```

#### 8.5 创建会话日志

**在 `.devflow-kit/memory/journals/` 下创建日志文件**：

文件名格式：`YYYY-MM-DD-<req-id>.md`

```markdown
# Session Journal: <req-id>

**日期**: YYYY-MM-DD
**需求**: <需求名称>
**模式**: <Fast/Standard/Strict>
**耗时**: <总耗时>

## 阶段记录
- 0-confirm: <开始时间> → <结束时间>
- 1-analysis: <开始时间> → <结束时间>
- ...

## 关键决策
- <决策1>
- <决策2>

## 遇到的问题
- <问题1> → <解决方案>
- <问题2> → <解决方案>

## 经验教训
- <教训1>
- <教训2>

## 产物清单
- 00-requirements.md
- 01-analysis.md
- ...
```

#### 8.6 输出更新摘要

```markdown
🧠 **记忆系统已更新**

✅ CURRENT_STATE.md - 已更新当前状态
✅ DECISIONS.md - 已追加 X 个新决策
✅ KNOWN_FAILURES.md - 已追加 Y 个新失败模式
✅ journals/YYYY-MM-DD-<req-id>.md - 已创建会话日志

💡 **下次会话时**，AI会自动读取这些记忆，无需重复沟通。
```

## 错误处理

- 发布失败 → 立即执行回滚
- 回滚失败 → 联系运维团队紧急处理
- 数据不一致 → 从备份恢复
- lessons-learned缺失 → 补充后再归档

## 自检清单

- ⏳ **已使用 read_file 读取模板** `templates/07-release-checklist.md`
- ⏳ **07-release-checklist.md 包含 lessons-learned 段落**
- ⏳ **项目级 lessons-learned.md 已追加**（L-NNN 格式）
- ⏳ **经验从 02-design/04-dev-log/05-test/06-review 提取**
- ⏳ DECISIONS.md 已更新
- ⏳ KNOWN_FAILURES.md 已更新（如有）
- ⏳ STATE.md 已更新
- ⏳ 会话日志已创建
