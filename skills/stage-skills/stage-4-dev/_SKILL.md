# devflow-kit Stage: 4-Dev（开发执行）

> **阶段定位**：在fresh context中执行单个任务
> **前置条件**：03-tasks.md 已完成，用户指定task id
> **后置产物**：代码实现 + `04-dev-log.md`

## Skill元信息

```yaml
name: stage-4-dev
version: 1.0.0
description: devflow-kit工作流第4阶段 - 按任务执行开发
author: devflow-kit
dependencies:
  - executing-plans
  - testing-suite
  - karpathy-rules  # 12条编码行为准则
```

## 输入

- `.devflow-kit/<req-id>/03-tasks.md`
- 要执行的 task id（用户指定，如 T03）
- `.devflow-kit/<req-id>/02-design.md`（必读 `## 0. 技术栈选定` + `## 0.5 既有架构对齐`）
- `.devflow-kit/CONTEXT.md`
- `.devflow-kit/lessons-learned.md`

## 输出

- 代码文件（按任务的write_files）
- `.devflow-kit/<req-id>/04-dev-log.md`

## 入口门禁

**必须满足以下条件之一**：

1. **正式流程**：存在 `.devflow-kit/<req-id>/03-tasks.md`，且包含指定的task
2. **单点调用**：用户提供临时最小TASK（必须包含7字段：id/name/read_files/write_files/action/verify/done）

**前端项目额外检查**：
```markdown
IF task涉及UI文件 (.tsx/.css/.vue等) AND 缺 02a-ui-design.md:
  输出: "规则 R2.7 触发：4-dev 缺少 02a-ui-design.md。本次先回到 2a-ui-design 补齐。"
  STOP
```

**禁止AI自行编造临时TASK**，缺字段必须反问或回到3-task生成正式产物。

## 执行流程

### Step 0: 扫描可用前置产物

**⚠️ 强制规则**：必须先扫描所有可能的前置产物，根据实际存在情况决定读取策略。

#### 0.1 扫描主流程产物

| 产物文件 | 存在性 | 优先级 | 提取内容 |
|---|--------|---|----------|
| 03-tasks.md | ✅/❌ | 🔴 必须 | 任务定义（id/name/read_files/write_files/action/verify/done） |
| 02-design.md | ✅/❌ | 🟡 建议 | 技术栈选定、既有架构对齐 |
| CONTEXT.md | ✅/❌ | 🟡 建议 | 编码规范、既有抽象 |
| lessons-learned.md | ✅/❌ | 🟡 建议 | 开发教训、常见bug |
| 01-analysis.md | ✅/❌ | 🟢 可选 | AC列表（用于验证实现） |

**扫描结果输出**：
```markdown
✅ 检测到 03-tasks.md → 提取任务T03
✅ 检测到 02-design.md → 提取技术栈：Vue3 + TypeScript
✅ 检测到 CONTEXT.md → 提取编码规范：PascalCase组件名
✅ 检测到 lessons-learned.md → 提取开发教训：2条
```

#### 0.2 分级读取策略

**🔴 必须读取**（缺失会阻塞流程）：
- **03-tasks.md**：提供任务定义，是开发的核心依据
  - 如果缺失 → 报错或要求用户提供临时TASK（必须包含7字段）

**🟡 建议读取**（缺失采用降级策略）：
- **02-design.md**：提供技术栈和既有架构对齐
  - 如果缺失 → 从package.json推断技术栈
- **CONTEXT.md**：提供编码规范和既有抽象
  - 如果缺失 → 使用通用命名约定
- **lessons-learned.md**：提供历史开发教训
  - 如果缺失 → 使用通用最佳实践

**🟢 可选读取**（补充信息）：
- **01-analysis.md**：提供AC列表
  - 如果存在 → 用于验证实现是否满足AC

#### 0.3 降级策略

**如果某个产物不存在**：

1. **02-design.md 缺失**：
   ```
   ⚠️ 警告：缺少02-design.md，无法获取技术栈
   → 降级方案：从package.json推断技术栈
   → 提醒：建议在dev-log中注明技术选型理由
   ```

2. **CONTEXT.md 缺失**：
   ```
   ⚠️ 警告：缺少CONTEXT.md，无法获取编码规范
   → 降级方案：使用通用命名约定（PascalCase组件、camelCase函数）
   → 询问用户："是否需要先运行 I-intel-scan 生成上下文？"
   ```

3. **lessons-learned.md 缺失**：
   ```
   ℹ️ 提示：缺少lessons-learned.md，使用通用开发最佳实践
   → 提醒：建议在完成后将本次经验追加到lessons-learned.md
   ```

#### 0.4 信息提取摘要

**输出格式**：
```markdown
### Step 0 输出：前置信息摘要

**已提取的关键信息**：

1. **任务层面**（来自03-任务拆分）：
   - 任务ID：T03
   - write_files范围：src/features/notifications/*
   - verify命令：npm test -- notifications

2. **技术层面**（来自02-方案设计）：
   - 技术栈：Vue3 + TypeScript
   - 既有抽象：ApiClient, validation.ts

3. **经验层面**（来自lessons-learned）：
   - 教训1：上次忘记添加错误处理
   - 教训2：TDD能有效减少bug

**下一步**：基于上述信息执行开发任务
```

### Step 1: 读取任务

从 03-tasks.md 取出对应 `<task>` 块，理解：
- `action` - 要做什么
- `read_files` - 允许读取的文件
- `write_files` - 允许修改的文件边界
- `verify` - 验证命令
- `done` - 完成判定

**如有歧义，停下来反问，不允许凭感觉补全**

### Step 2: 开发前规则检查

根据任务类型加载 `4-dev-rules.md` 对应节：

| 任务类型 | 必读节 |
|---|--------|
| 所有生产代码 | 1.4（沿用既有抽象grep）+ 1.5（lessons-learned扫描） |
| UI任务 | + 1.6（UI反模式）+ 1.8（破坏性变更） |
| Schema变更 | + 1.7（Schema规范）+ 1.8 |
| 破坏性变更 | + 1.8 + 引用图grep |

**禁止整读4-dev-rules.md**，只grep需要的节。

#### Karpathy 编码行为准则

**同时应用 `karpathy-rules` 中的 12 条编码准则**：

1. **编码前先思考** - 不假设、不隐藏困惑、暴露权衡
2. **简单优先** - 最少代码解决问题
3. **精准修改** - 只改必须改的
4. **目标驱动执行** - 定义成功标准、循环验证
5. **只让模型做判断** - 不要做非语言工作
6. **Token预算** - 快超预算时总结重开
7. **暴露冲突** - 不要平均两个矛盾的模式
8. **写入前先阅读** - 先理解现有代码
9. **测试验证意图** - 不只是验证行为
10. **检查点** - 每步后总结
11. **匹配约定** - 服从代码库风格
12. **失败要大声** - 不确定要暴露

> 💡 这些规则使错误率从 41% 降至 3%。

### Step 3: TDD优先（默认开启）

按 RED → GREEN → REFACTOR 顺序：

1. **RED**：先写测试（明确输入+期望输出）
2. **GREEN**：写刚好能通过的实现
3. **REFACTOR**：重构不改变语义

**例外**：纯文档/纯配置任务可跳过TDD，但需在dev-log说明理由。

### Step 4: 实现代码

**严格约束**：
- **只修改** write_files 范围内的文件
- **只读取** read_files 范围内的文件
- **禁止**越权修改其他文件

**沿用既有抽象**（1.4规则）：
```bash
# grep项目中已有的类似实现
grep -r "HttpClient" src/lib/
grep -r "useState" src/hooks/
```

优先复用既有抽象，引入新库必须有充分理由。

### Step 5: 执行verify

按任务的 `<verify>` 命令执行，**贴出真实输出**到dev-log。

如果verify有多个步骤（build → test → lint），按顺序跑，每步一行。

**verify未通过禁止标记完成**（R2.4）。

### Step 6: Self-review（生产代码必跑）

#### 6a. brooks-lint（如已安装）

```bash
cd <workspace> && /brooks-review
```

将输出贴到dev-log「6维自查」段。

#### 6b. 内置6维快查（回退方案）

对照6个衰退风险逐一自查：

| # | 维度 | 自查问题 |
|---|------|---|
| R1 | Cognitive Overload | 新增代码是否全是顺序执行？有无深层嵌套？ |
| R2 | Change Propagation | 改动是否局限在write_files范围内？ |
| R3 | Knowledge Duplication | 核心逻辑是否有已在其他文件实现的？ |
| R4 | Accidental Complexity | 能否以更少的抽象实现相同功能？ |
| R5 | Dependency Disorder | 新增import方向是否符合模块分层？ |
| R6 | Domain Model Distortion | 改动是否语义匹配数据模型？ |

**标记规则**：🔴 Critical→必须修；🟡 Major→记入review；🟢 Minor→不阻塞

**每条自查需要grep+引用代码，禁止"认为没问题"**

### Step 7: Diff边界验证（R6.5强制）

```bash
cd <workspace>
git diff --name-only
```

**检查要点**：
- 所有改动文件都在当前task write_files范围内？
- 如果出现"顺手"多出的文件：
  1. 停下来
  2. 若属于当前task但未声明 → 更新03-tasks.md的write_files（需人工同意）
  3. 若不属于当前task → `git checkout -- <files>` 撤销

**输出示例**：
```markdown
✅ 越界检测（R6.5）：

✅ 03-tasks.md 声明的 write_files：
  - src/features/notifications/*

✅ 实际 diff 涉及：
  - src/features/notifications/NotificationCenter.tsx
  - src/features/notifications/useNotifications.ts

→ 0 越界 ✅
```

### Step 8: 读取模板并提取段落清单

**⚠️ 强制规则**：必须使用 `read_file` 工具读取模板文件（如存在）。

```python
# 伪代码示例
if template_exists("flow/templates/XX-dev-log.md"):
    read_file("flow/templates/XX-dev-log.md")
```

**从模板中提取必填段落清单**（6个章节）：
```
□ 1. 任务定义
□ 2. 实施过程
□ 3. Verify输出
□ 4. 6维自查
□ 5. Diff边界验证
□ 6. 建议Commit Message
```

**注意**：
- 所有6个章节都必须包含，不得省略
- Verify输出必须是真实执行结果
- 6维自查必须全部完成且无🔴问题

### Step 9: 生成dev-log并逐项核对

创建 `.devflow-kit/<req-id>/<task-id>-dev-log.md`：
- **必须包含所有6个章节**（见 Step 8 提取的清单）
- **所有占位符必须替换为实际值**
- **Verify输出必须是真实执行结果**

**生成后核对**：
```markdown
产物核对清单：
- ⏳ 1. 任务定义 → 已包含（read_files/write_files/action/verify）
- ⏳ 2. 实施过程 → 已包含（步骤清晰）
- ⏳ 3. Verify输出 → 已包含（真实执行结果）
- ⏳ 4. 6维自查 → 已包含（全部🟢）
- ⏳ 5. Diff边界验证 → 已包含（0越界）
- ⏳ 6. 建议Commit Message → 已包含
```

**如果有缺失**：立即补齐，不得进入下一步。

```markdown
# Task <id>: <name>

## 1. 任务定义
- read_files: ...
- write_files: ...
- action: ...
- verify: ...

## 2. 实施过程
- 步骤1: ...
- 步骤2: ...

## 3. Verify输出
```
<真实输出>
```

## 4. 6维自查
R1 🟢 ...
R2 🟢 ...
...

## 5. Diff边界验证
- 声明范围: ...
- 实际diff: ...
- 越界文件: 无 / 有（已处理）

## 6. 建议Commit Message
feat: <简短描述>

<body>
<详细说明>
```

### Step 10: 完整性自检

**检查是否充分利用了前置产物**：

- ⏳ 是否读取了03-tasks.md中的任务定义？
- ⏳ 是否从02-方案设计中提取了技术栈（如存在）？
- ⏳ 是否参考了上下文中的既有抽象（如存在）？
- ⏳ 是否参考了lessons-learned中的开发教训（如存在）？
- ⏳ 对于缺失的产物，是否采用了合理的降级策略？
- ⏳ write_files范围是否明确？
- ⏳ verify命令是否可执行？
- ⏳ 是否严格遵循TDD流程（如适用）？
- ⏳ 6维自查是否完成且无🔴问题？
- ⏳ Diff边界验证是否通过（R6.5）？

**如果发现遗漏**：
→ 回到Step 0重新读取
→ 或在本阶段产物中注明"因缺少XX产物，采用YY假设"

### Step 11: 更新项目状态

**如果这是最后一个任务**：
```markdown
当前阶段: dev
阶段状态: completed
上次完成阶段: dev
下一阶段: test
```

### Step 12: 路由到下一个任务或下一阶段

**检查是否还有未执行的任务**：

1. 读取 `03-tasks.md`，检查所有任务的 `status` 字段
2. 如果存在 `status="pending"` 的任务：
   - **如果是 [P] 标记的并行任务**：
     ```markdown
     ✅ T01 完成。
     
     🔄 **检测到可并行任务**：
     - T02[P]（与T01无依赖冲突）
     - T03[P]（与T01无依赖冲突）
     
     💡 **建议**：可以立即执行 T02 或 T03，无需等待确认。
     
     请指定下一个任务ID（如 "T02"），或说 "继续" 自动选择下一个。
     ```
   - **如果是顺序任务**：
     ```markdown
     ✅ T01 完成。
     
     ➡️ **下一步**：T02（依赖 T01，现已满足）
     
     正在加载 T02 任务定义...
     ```
     → 自动加载下一个任务，无需用户确认
   
3. 如果所有任务都已完成：
   ```markdown
   ✅ 所有任务完成！
   
   📊 **任务统计**：
   - 总任务数：X
   - 已完成：X
   - 并行任务：Y个
   
   ➡️ **进入测试阶段**（stage-5-test）
   ```
   → 加载 `flow/stage-skills/stage-5-test/_SKILL.md`

### Step 13: 更新记忆系统（最后一个任务完成后）

**⚠️ 条件触发**：仅当所有任务完成时执行。

**执行步骤**：

1. 从 dev-log 提取实现决策

2. 追加到 `.devflow-kit/memory/DECISIONS.md`：n
```markdown
### 实施决策

| 决策项 | 选择 | 理由 |
|---|------|---|
| <决策1> | <选择> | <理由> |
```

3. 如遇到失败模式，追加到 `.devflow-kit/memory/KNOWN_FAILURES.md`

## 自检清单

完成后逐项检查：n
- ⏳ **已使用 read_file 读取模板文件**（如存在）
- ⏳ **已从模板提取必填段落清单**（6个章节）
- ⏳ 只修改了write_files范围内的文件
- ⏳ verify命令执行通过
- ⏳ 6维自查全部完成（至少🟢）
- ⏳ Diff边界验证通过（0越界）
- ⏳ **dev-log包含所有6个章节**（见 Step 9 核对清单）
- ⏳ **所有占位符已替换**
- ⏳ **生成后已逐项核对**（无缺失章节）
- ⏳ dev-log已生成
- ⏳ 建议commit message已提供
- ⏳ **最后一个任务完成后：DECISIONS.md已更新**

## 约束

- **R2.4**：verify未通过禁止标记完成
- **R6.5**：越界文件必须撤销或更新任务定义
- **只执行一个任务**，多任务分多次调用此stage
- **禁止**一次性执行多个任务
- **禁止**跳过self-review

## 触发下一步

- 还有未执行的任务 → 等待用户指定下一个task id
- 所有任务完成 → 加载 `flow/stage-skills/stage-5-test/_SKILL.md`

## 错误处理

- **verify失败** → 分析原因（代码bug/测试错误/环境问题），修复后重新执行
- **任务定义有误** → 暂停，回到3-task修正任务定义
- **越界文件** → 立即撤销（git checkout），不得提交
- **6维自查发现🔴** → 必须修复后才能继续
- **依赖skill缺失** → 提示用户安装或跳过
- **缺必需输入** → 反问用户补充
