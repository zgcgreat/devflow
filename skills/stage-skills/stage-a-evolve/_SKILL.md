# devflow-kit Stage: A-Evolve（架构演进）

> **阶段定位**：从历史需求中提取架构级经验，同步到上下文
> **前置条件**：`.devflow-kit/system-architecture.md` 存在
> **后置产物**：更新的 `.devflow-kit/CONTEXT.md` + `.devflow-kit/system-architecture.md`

## Skill元信息

```yaml
name: stage-a-evolve
version: 1.0.0
description: devflow-kit可选命令 - 架构演进与经验沉淀
author: devflow-kit
dependencies:
  - planning-and-context
```

## 输入

- `.devflow-kit/STATE.md`
- `.devflow-kit/CONTEXT.md`
- `.devflow-kit/system-architecture.md`
- `.devflow-kit/archive/<req-id>/02-design.md` 的 `§ 9` 段（仅扫last_evolve_at之后的需求）

## 输出

- 更新的 `.devflow-kit/CONTEXT.md`
- 更新的 `.devflow-kit/system-architecture.md`
- 更新 `.devflow-kit/STATE.md` 的 `last_evolve_at`

## 入口门禁

```markdown
IF 缺 .devflow-kit/system-architecture.md:
  输出: "⚠️ 项目无system-architecture文档，请先执行 @A-architect 建立架构基线。"
  STOP
```

## 执行流程

### Step 1: 读取上次演进时间

从 `.devflow-kit/STATE.md` 读取 `last_evolve_at`：

```markdown
last_evolve_at: 2026-01-10T14:30:00Z
```

如不存在，设为项目创建时间。

### Step 2: 扫描归档需求

找出 `last_evolve_at` 之后归档的所有需求：

```bash
# 列出归档目录
ls -la .devflow-kit/archive/

# 过滤出last_evolve_at之后的需求
# （按目录名或文件修改时间）
```

**对每个需求**：
- 读取 `.devflow-kit/archive/<req-id>/02-design.md` 的 `## 9. 架构沉淀建议` 段
- **禁止**读取§9以外的内容（避免越界）

### Step 3: 提取架构级经验

从§9段中提取：

**新模式/抽象**：
```markdown
REQ-005 §9:
- 引入 Repository 模式统一数据访问
- 新增 src/repos/ 目录
- 所有模块应通过 Repository 访问数据库
```

**公共组件**：
```markdown
REQ-008 §9:
- 抽取 ApiClient 到 src/lib/api-client.ts
- 提供统一的HTTP请求封装
- 支持自动重试、超时、错误处理
```

**架构决策**：
```markdown
REQ-012 §9:
- 决定使用事件总线解耦模块
- 新增 RabbitMQ 依赖
- 模块间通信改为异步事件
```

### Step 4: 合并到上下文

**⚠️ 强制规则**：如存在 `.devflow-kit/CONTEXT.md`，必须先读取再追加。

将提取的经验追加到 `.devflow-kit/CONTEXT.md`：
- **必须保持原有结构完整**
- **不得覆盖已有章节**
- **所有占位符必须替换为实际值**

```markdown
## 架构演进记录（2026-01-15）

### 新增模式
- Repository模式：统一数据访问层（来自REQ-005）
- 事件总线：模块间异步通信（来自REQ-012）

### 新增公共组件
- ApiClient：HTTP请求封装（来自REQ-008）
- DateUtils：日期处理工具（来自REQ-010）

### 架构决策
- 使用PostgreSQL作为主数据库（来自REQ-001）
- Redis缓存策略：写穿透+失效（来自REQ-003）
```

### Step 5: 更新system-architecture

**⚠️ 强制规则**：必须先读取 `.devflow-kit/system-architecture.md`，再按模板结构更新。

**§2 模块清单**：
- 新增模块加入表格
- 更新依赖关系

**§3 ADR列表**：
- 新增ADR加入列表
- 标记已Supersede的ADR

**§4 跨模块契约**：
- 新增API契约
- 更新事件主题列表

**示例**：
```markdown
### 新增模块（来自REQ-005）
| src/repos/* | 数据访问层 | db | user-service, order-service |

### 新增ADR
| ADR-005 | Repository模式 | Accepted | REQ-005 |
```

### Step 6: 识别架构债务

从历史需求中识别未解决的问题：

**常见问题**：
- 🔴 技术债：临时方案未重构
- 🟡 缺失抽象：重复代码未抽取
- 🟢 优化建议：性能可提升

**输出**：
```markdown
## 架构债务清单

**🔴 Critical**:
1. REQ-003的缓存降级方案是临时的，需完善
   - 建议: 实现本地缓存+远程缓存双层策略

**🟡 Major**:
1. 3个需求都提到了日期处理，但未抽取公共工具
   - 建议: 创建 src/utils/date.ts
```

### Step 7: 用户Review

输出演进报告：

```markdown
✅ 架构演进完成

**本次同步**：
- 扫描需求数: 8个
- 提取经验: 5条
- 新增模块: 2个
- 新增ADR: 3个

**架构债务**：
- 🔴 Critical: 1个
- 🟡 Major: 2个

是否立即处理债务？
1. ✅ 是，创建需求修复Critical债务
2. ⚠️ 只记录，稍后处理
3. ↩️ 查看详细信息
```

### Step 8: 根据用户选择执行

**选项1**：创建需求修复
- 路由到 0-confirm
- 需求描述："修复架构债务：<具体问题>"

**选项2**：仅记录
- 将债务清单追加到 `.devflow-kit/system-architecture.md` 末尾
- 标记为「待优化」

**选项3**：查看详情
- 展示完整的演进报告和债务详情

### Step 9: 更新项目状态

```markdown
last_evolve_at: 2026-01-15T10:30:00Z
```

## 自检清单

- ⏳ **已读取CONTEXT.md和system-architecture.md**（如存在）
- ⏳ 只扫描了last_evolve_at之后的需求
- ⏳ 只读取了§9段，未越界
- ⏳ **CONTEXT.md已更新**（新增经验，结构完整）
- ⏳ **system-architecture.md已更新**（模块/ADR/契约）
- ⏳ 架构债务已识别
- ⏳ 用户已review并确认
- ⏳ last_evolve_at已更新

## 约束

- **禁止**读取§9以外的DESIGN内容
- **禁止**越界扫描未归档的需求
- **必须**更新last_evolve_at
- 架构债务**必须**分级（🔴🟡🟢）

## 触发下一步

- 用户选择修复 → 加载 `skills/stage-skills/stage-0-confirm/_SKILL.md`
- 用户选择记录 → 结束，返回主流程

## 错误处理

- §9段为空 → 跳过该需求
- 经验冲突 → 提示用户选择保留哪个
- 债务过多 → 优先处理🔴 Critical

