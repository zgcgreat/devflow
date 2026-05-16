# devflow-kit Stage: A-Architect（架构梳理）

> **阶段定位**：建立或更新项目级架构文档
> **前置条件**：无（可随时执行）
> **后置产物**：`.devflow-kit/system-architecture.md`

## Skill元信息

```yaml
name: stage-a-architect
version: 1.0.0
description: devflow-kit可选命令 - 架构梳理与文档化
author: devflow-kit
dependencies:
  - stage-a-architect
```

## 输入

- `.devflow-kit/CONTEXT.md`
- `.devflow-kit/需求LOG.md`（如存在）
- `.devflow-kit/archive/*/02-design.md`（抽样读取§9段）
- `src/` 顶层结构
- `package.json` / 依赖文件

## 输出

- `.devflow-kit/system-architecture.md`（新建或更新）

## 入口门禁

无（可选命令，随时可执行）

## 执行流程

### Step 1: 扫描项目结构

```bash
# 列出src顶层目录
ls -la src/

# 查看依赖
cat package.json | jq '.dependencies'
# 或
cat requirements.txt
# 或
cat go.mod
```

**记录**：
- 模块列表
- 技术栈
- 依赖关系

### Step 2: 读取历史ADR

从 `.devflow-kit/archive/*/02-design.md` 的 `## 9. 架构沉淀建议` 段提取：

```markdown
grep -r "## 9" .devflow-kit/archive/*/02-design.md
```

**汇总**：
- 已引入的新模式
- 公共组件/工具
- 架构决策

### Step 3: 生成system-architecture文档

**⚠️ 强制规则**：输出前必须先读取模板文件 `templates/system-architecture.md`。

按模板生成 `.devflow-kit/system-architecture.md`：
- **必须包含模板所有6个章节**（§1-§6）
- **所有 `<...>` 占位符必须替换为实际值**
- **不得省略任何章节**

#### §1 项目概述

- 项目名称、类型
- 技术栈摘要
- 核心业务域

#### §2 模块清单 + 依赖规则

**模块表格**：
| 模块路径 | 职责 | 依赖模块 | 被依赖模块 |
|---|------|---|-----------|

**依赖规则**：
- 上层模块可依赖下层
- 禁止循环依赖
- 跨模块调用必须通过公开API

#### §3 ADR列表

**架构决策记录**：
| ADR编号 | 标题 | 状态 | 关联需求 |
|---|------|---|---------|
| ADR-001 | 使用PostgreSQL | Accepted | REQ-001 |
| ADR-002 | Redis缓存策略 | Accepted | REQ-003 |

**每个ADR链接到详细文档**：`.devflow-kit/adr/NNN-title.md`

#### §4 跨模块契约

**API契约**：
- 模块间调用的接口定义
- 事件总线主题列表
- Schema变更流程

**示例**：
```markdown
### UserService → NotificationService

**调用方式**: HTTP POST /api/notifications
**请求体**:
```json
{
  "userId": "string",
  "title": "string",
  "content": "string"
}
```
**响应**: 201 Created
```

#### §5 基础设施

- 数据库：PostgreSQL 14
- 缓存：Redis 7
- 消息队列：RabbitMQ 3
- 部署：Kubernetes

#### §6 编码规范

- 命名约定
- 目录结构
- 测试要求
- 日志规范

### Step 4: 识别架构问题

**常见问题**：
- 🔴 循环依赖
- 🔴 模块职责不清
- 🟡 缺少公共抽象
- 🟡 重复代码

**输出**：
```markdown
## 架构问题清单

**🔴 Critical**:
1. user-service 和 order-service 互相调用（循环依赖）
   - 建议: 引入event bus解耦

**🟡 Major**:
1. 日期处理逻辑分散在5个文件
   - 建议: 抽取到 src/utils/date.ts
```

### Step 5: 用户Review

输出架构文档和问题清单，等待用户确认。

**询问**：
```markdown
✅ 架构梳理完成

发现以下问题：
- 🔴 Critical: 1个
- 🟡 Major: 2个

是否立即修复？
1. ✅ 是，创建需求修复Critical问题
2. ⚠️ 只记录，稍后处理
3. ↩️ 重新扫描（我可能漏了某些模块）
```

### Step 6: 根据用户选择执行

**选项1**：创建新需求修复Critical问题
- 路由到 0-confirm
- 需求描述："修复架构Critical问题：循环依赖"

**选项2**：仅记录
- 将问题清单追加到 `.devflow-kit/system-architecture.md` 末尾
- 标记为「待优化」

**选项3**：重新扫描
- 回到Step 1，扩大扫描范围

## 自检清单

- ⏳ **已读取模板文件** `templates/system-architecture.md`
- ⏳ 模块清单完整（覆盖src/所有子目录）
- ⏳ 依赖关系准确（无遗漏）
- ⏳ ADR列表最新（包含所有历史决策）
- ⏳ 跨模块契约清晰
- ⏳ **产物包含模板所有6个章节**
- ⏳ **所有占位符已替换**
- ⏳ 架构问题已识别
- ⏳ 用户已review并确认

## 约束

- **禁止**编造不存在的模块
- **必须**基于实际代码扫描
- **必须**让用户确认问题清单
- ADR**必须**有明确的状态（Accepted/Superseded/Rejected）

## 触发下一步

- 用户选择修复 → 加载 `skills/stage-skills/stage-0-confirm/_SKILL.md`
- 用户选择记录 → 结束，返回主流程
- 用户选择重扫 → 重新执行本stage

## 错误处理

- 模块职责不清 → 读取模块代码确认
- ADR缺失 → 从历史需求中补充
- 依赖关系复杂 → 绘制依赖图辅助理解

