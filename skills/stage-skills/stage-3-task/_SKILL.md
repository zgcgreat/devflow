# devflow-kit Stage: 3-Task（任务拆分）

> **阶段定位**：将设计拆分为可并行的原子任务，并生成详细实施计划
> **前置条件**：02-design.md 已完成
> **后置产物**：`.devflow-kit/<req-id>/03-tasks.md` + `.devflow-kit/<req-id>/03a-implementation-plan.md`

## Skill元信息

```yaml
name: stage-3-task
version: 1.0.0
description: devflow-kit工作流第3阶段 - 任务拆分与并行规划
author: devflow-kit
dependencies:
  - writing-plans
```

## 输入

- `.devflow-kit/<req-id>/01-analysis.md`
- `.devflow-kit/<req-id>/02-design.md`（必读 `## 0. 技术栈选定` + `## 0.5.1 触碰模块`）
- `.devflow-kit/CONTEXT.md`

## 输出

- `.devflow-kit/<req-id>/03-tasks.md`
- `.devflow-kit/<req-id>/03a-implementation-plan.md` ⚠️ **必填**
- 更新 `.devflow-kit/STATE.md`

## 入口门禁

**必须检查以下产物，缺任何一项都停止**：

```markdown
IF 缺 01-analysis.md:
  输出: "规则 R2.7 触发：3-task 缺少 01-analysis.md。本次先回到 1-analysis 补齐。"
  STOP

IF 缺 02-design.md:
  输出: "规则 R2.7 触发：3-task 缺少 02-design.md。本次先回到 2-design 补齐。"
  STOP

IF 前端项目 AND 缺 02a-ui-design.md:
  输出: "规则 R2.7 触发：3-task 缺少 02a-ui-design.md。本次先回到 2a-ui-design 补齐。"
  STOP
```

## 执行流程

### Step 1: 扫描可用前置产物

**⚠️ 强制规则**：必须先扫描所有可能的前置产物，根据实际存在情况决定读取策略。

#### 1.1 扫描主流程产物

| 产物文件 | 存在性 | 优先级 | 提取内容 |
|---|--------|---|----------|
| 01-analysis.md | ✅/❌ | 🔴 必须 | AC列表、非功能需求 |
| 02-design.md | ✅/❌ | 🔴 必须 | 技术栈选定、触碰模块、禁动清单 |
| CONTEXT.md | ✅/❌ | 🟡 建议 | 编码规范、既有抽象 |
| lessons-learned.md | ✅/❌ | 🟡 建议 | 任务拆分教训、verify命令最佳实践 |
| STATE.md | ✅/❌ | 🟢 可选 | 当前进度、中断任务 |

**扫描结果输出**：
```markdown
✅ 检测到 01-analysis.md → 提取AC列表：8个
✅ 检测到 02-design.md → 提取技术栈：Vue3 + TypeScript
✅ 检测到 CONTEXT.md → 提取编码规范：PascalCase组件名
❌ 未检测到 lessons-learned.md → 使用通用最佳实践
```

#### 1.2 分级读取策略

**🔴 必须读取**（缺失会阻塞流程）：
- **01-analysis.md**：提供AC列表，确保任务覆盖所有需求
  - 如果缺失 → 报错并引导回stage-1-analysis
- **02-design.md**：提供技术栈和架构决策，决定任务粒度
  - 如果缺失 → 报错并引导回stage-2-design

**🟡 建议读取**（缺失采用降级策略）：
- **CONTEXT.md**：提供编码规范和既有抽象
  - 如果缺失 → 使用通用命名约定，在任务中明确说明
- **lessons-learned.md**：提供历史任务拆分教训
  - 如果缺失 → 使用通用拆解原则，建议在完成后补充经验

**🟢 可选读取**（补充信息）：
- **STATE.md**：进度跟踪
  - 如果存在 → 从断点续传
  - 如果缺失 → 从头开始

#### 1.3 降级策略

**如果某个产物不存在**：

1. **CONTEXT.md 缺失**：
   ```
   ⚠️ 警告：缺少CONTEXT.md，无法获取项目编码规范
   → 降级方案：使用通用命名约定（PascalCase组件、camelCase函数）
   → 提醒：建议在任务中明确命名风格
   ```

2. **lessons-learned.md 缺失**：
   ```
   ⚠️ 警告：缺少lessons-learned.md，无法参考历史任务拆分教训
   → 降级方案：使用通用拆解原则（2-10分钟/任务）
   → 提醒：建议在完成后将本次经验追加到lessons-learned.md
   ```

#### 1.4 信息提取摘要

**输出格式**：
```markdown
### Step 1 输出：前置信息摘要

**已提取的关键信息**：

1. **需求层面**（来自01-需求分析）：
   - AC数量：<N>个
   - 非功能需求：<性能/安全要求>

2. **技术层面**（来自02-方案设计）：
   - 技术栈：<Vue3 + TypeScript>
   - 触碰模块：<src/features/notifications/*>
   - 禁动清单：<src/services/payment-service.ts>

3. **经验层面**（来自lessons-learned，如存在）：
   - 教训1：<任务粒度太大导致冲突>
   - 教训2：<verify命令必须可执行>

**下一步**：基于上述信息拆分任务
```

### Step 2: 拆解原则

按以下原则拆分任务：

1. **大小**：一个任务在 fresh context 下 2~10 分钟可完成
2. **粒度**：按文件冲突切，不按层切。优先「垂直切片」而非「水平层」
3. **并行标记 [P]**：只有 write_files 无交集、依赖无冲突时才标 [P]
4. **依赖**：每个任务显式声明 `depends_on: <task-id>`
5. **AC覆盖**：**必须确保每个AC都有对应的任务**（从Step 1.1提取的AC列表）

### Step 3: 生成任务XML

每个任务必须包含7个字段：

```xml
<task id="T01" parallel="true">
  <name>一句话描述</name>
  <read_files>
    src/xxx/*
    src/utils/yyy.ts
  </read_files>
  <write_files>
    src/features/zzz.ts
    src/features/__tests__/zzz.test.ts
  </write_files>
  <action>要做什么（不写代码，写意图）</action>
  <verify>npm test -- zzz.test.ts</verify>
  <done>完成判定（对应AC的某个子项）</done>
  <depends_on></depends_on>
</task>
```

**关键约束**：
- `read_files` = write_files 超集 + 需要import的既有模块
- `write_files` 严格在"触碰模块+新增模块"范围内
- **禁止**任何任务的write_files包含禁动清单文件
- `verify` 必须是可执行命令

### Step 4: 规划执行顺序

按依赖关系分层：

```markdown
第一批（可并行）: T01[P], T02[P]
第二批（可并行）: T03[P], T04[P]（依赖 T01）
第三批:           T05（依赖 T03, T04）
```

### Step 5: 读取模板并提取段落清单

**⚠️ 强制规则**：必须使用 `read_file` 工具读取模板文件。

```python
# 伪代码示例
read_file("flow/templates/03-tasks.md")
```

**从模板中提取必填段落清单**：
```
□ 任务列表（XML格式）
□ 执行顺序说明
□ 任务统计
□ 依赖关系图
□ AC覆盖检查
□ 阶段完成声明
```

**注意**：
- 所有6个段落都必须包含，不得省略
- 每个任务的XML块必须完整（7字段）

### Step 6: 生成产物并逐项核对

按模板生成 `.devflow-kit/<req-id>/03-tasks.md`：
- **必须包含模板所有6个段落**（见 Step 5 提取的清单）
- **所有 `<...>` 占位符必须替换为实际值**
- **每个任务必须有完整的7字段**（id/name/read_files/write_files/action/verify/done）

**生成后核对**：
```markdown
产物核对清单：
- ⏳ 任务列表 → 已包含（X个任务，XML格式）
- ⏳ 执行顺序说明 → 已包含（分批并行说明）
- ⏳ 任务统计 → 已包含（总数、可并行数）
- ⏳ 依赖关系图 → 已包含
- ⏳ AC覆盖检查 → 已包含（每个AC都有对应任务）
- ⏳ 阶段完成声明 → 已包含
```

**如果有缺失**：立即补齐，不得进入下一步。

### Step 7: 生成实施计划 ⚠️ **强制步骤**

**⚠️ 规则变更**：03a-implementation-plan.md 现为必填产物。

**执行步骤**：
1. 读取模板：`read_file("templates/03a-implementation-plan.md")`
2. 基于 03-tasks.md 生成详细实施计划
3. 保存为 `.devflow-kit/<req-id>/03a-implementation-plan.md`

**实施计划必须包含**：
- 整体架构设计
- 数据层设计（如涉及）
- 任务详细实施计划（每个任务的实现细节）
- 风险与应对
- 部署与回滚方案

### Step 8: 输出产物摘要，等待用户确认

**输出格式**：
```markdown
---
## ✅ Stage 3 (Task) 完成

### 产物清单
| 产物 | 状态 | 路径 |
|---|------|---|
| 任务拆分 | ✅ | `.devflow-kit/<req-id>/03-tasks.md` |
| 实施计划 | ✅ | `.devflow-kit/<req-id>/03a-implementation-plan.md` |

### 任务摘要
- 任务总数：X 个
- 可并行：Y 个
- 预估时间：Z 小时

### 关键决策
- 决策1：...
- 决策2：...

---
**请选择下一步：**
```

**提供选项按钮（按优先级排列）**：
- `[1] 确认，继续下一阶段` — 默认选项
- `[2] 查看产物详情` — 用户想看具体内容
- `[3] 需要修改` — 用户发现问题

**⚠️ 交互规则**：
1. 用户输入 `1` 或 `确认` → 进入下一阶段
2. 用户输入 `2` 或 `查看` → 输出产物内容，再次等待确认
3. 用户输入 `3` 或 `修改` → 提示用户输入具体修改内容
4. **必须等待用户确认后才能进入下一阶段**

### Step 9: 用户确认后更新项目状态

**用户确认通过后**：
```markdown
当前阶段: task
阶段状态: completed
上次完成阶段: task
下一阶段: dev
```

**用户要求修改**：
- 记录修改意见到 STATE.md 的「阻塞与待决策」
- 回到对应 Step 重新生成
- 修改后再次等待用户确认

### Step 10: 完整性自检

**检查是否充分利用了前置产物**：

- ⏳ 是否读取了所有存在的必需产物（01-需求分析 + 02-方案设计）？
- ⏳ 是否从01-需求分析中提取了所有AC列表？
- ⏳ 是否从02-方案设计中提取了技术栈和触碰模块？
- ⏳ 是否参考了CONTEXT.md中的编码规范（如存在）？
- ⏳ 是否参考了lessons-learned.md中的任务拆分教训（如存在）？
- ⏳ 对于缺失的产物，是否采用了合理的降级策略？
- ⏳ **每个AC都有对应的任务**（AC覆盖检查）？
- ⏳ 任务粒度是否符合模式判定？
  - Fast：粗粒度（1-3个任务）
  - Standard：中等粒度（3-8个任务）
  - Strict：细粒度（8+个任务）

**如果发现遗漏**：
→ 回到Step 1重新读取
→ 或在本阶段产物中注明"因缺少XX产物，采用YY假设"

## 约束

- **R2.3**：每个任务必须有可执行的verify，否则不允许进入DEV
- 任务粒度太大必须再拆
- 不允许「重构X模块」这种没有边界的任务
- 禁止Planner自己脑补技术栈、触碰模块、禁动清单

## 自检清单

- ⏳ **已读取模板文件** `templates/03-tasks.md`
- ⏳ **已读取模板文件** `templates/03a-implementation-plan.md`
- ⏳ **已读取所有前置产物**（01-需求分析 + 02-方案设计）
- ⏳ **已提取AC列表**（用于验证任务覆盖）
- ⏳ **已确保每个AC都有对应任务**（AC覆盖检查）
- ⏳ 已读取02-方案设计的技术栈和既有架构对齐
- ⏳ 任务数合理（Fast: 1-3个, Standard: 3-8个, Strict: 8+个）
- ⏳ 每个任务有完整的7字段（id/name/read_files/write_files/action/verify/done）
- ⏳ write_files不重叠或重叠部分明确说明
- ⏳ verify命令可执行且有意义
- ⏳ 任务间依赖关系清晰
- ⏳ 并行任务已标注
- ⏳ **产物包含模板所有段落**
- ⏳ **所有占位符已替换**
- ⏳ 03-tasks.md已生成
- ⏳ **03a-implementation-plan.md已生成** ⚠️ **必填**
- ⏳ STATE.md已更新

## 触发下一步

**用户确认通过后**，进入开发阶段：

→ 加载 `skills/stage-skills/stage-4-dev/_SKILL.md`

## 错误处理

- 任务定义有歧义 → 反问用户澄清
- write_files超出范围 → 重新调整任务边界
- verify命令不可执行 → 修正为正确命令
