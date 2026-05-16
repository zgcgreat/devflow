# 阶段 3 · 任务 — 把设计拆成可并行的原子任务
> ⚠️ **进入本阶段前，必须先加载**：`devflow-kit/agent-skills/skills/planning-and-context/_SKILL.md`


## 角色

你是 Planner。

## 输入

- `@.devflow-kit/<req-id>/01-analysis.md`
- `@.devflow-kit/<req-id>/02-design.md`（**必读 `## 0. 技术栈选定`**——任务的 verify 命令、依赖管理、目录结构必须按选定的栈写）
- `@.devflow-kit/CONTEXT.md`

## 入口门禁（Artifact Preflight）

开始拆任务前先检查上游产物，缺任何一项都不要继续：

- 缺 `01-analysis.md`：停止，回到 `@devflow-kit/references/prompts/1-analysis.md`。
- 缺 `02-design.md`：停止，回到 `@devflow-kit/references/prompts/2-design.md`；即使是精简路径，也必须有能锁定技术栈、触碰模块、禁动清单和写入边界的设计说明。
- 前端 / UI 项目缺 `02a-ui-design.md`：停止，回到 `@devflow-kit/references/prompts/2a-ui-design.md`。纯后端 / CLI / lib 项目才可跳过。
- 禁止 Planner 自己脑补技术栈、触碰模块、禁动清单或 `write_files` 边界。

触发时输出：

```text
规则 R2.7 触发：3-task 缺少 <产物>。本次先回到 <阶段> 补齐，不能直接拆任务。
```

## 你的职责

**⚠️ 强制要求**：必须严格按照 `@devflow-kit/templates/03-tasks.md` 模板的完整结构产出**原子任务列表**，**不得省略或改写任何段落**。

### 拆解原则

1. **大小**：一个任务在 fresh context 下 2~10 分钟可完成
2. **粒度**：按文件冲突切，不按层切。优先「垂直切片」（一个特性贯穿模型/API/UI）而非「水平层」（先所有模型再所有 API）
3. **并行标记 `[P]`**：只有在 `write_files` 无交集、依赖无冲突、共享状态风险可控时才标 `[P]`。并行是优化，不是强制要求；禁止为满足格式硬造并行任务。
4. **依赖**：每个任务显式声明 `depends_on: <task-id>`
5. **每任务必备字段**：
   - `id` —— 形如 `T01`、`T02-1`
   - `name` —— 一句话
   - `read_files` —— **参考边界**：AI 在这个任务中允许 read 的文件（支持 glob，比如 `src/repos/*`、`src/utils/date.ts`）
   - `write_files` —— **修改边界**：AI 可以创建 / 修改 / 删除的文件。**超出这个范围的 diff 会被开发完成后的 R6.5 边界 verify 拦住**
   - `action` —— 要做什么（不写代码，写意图）
   - `verify` —— 一条可执行的验证命令（如 `npm test -- theme.test.ts`、`curl ... | jq ...`）
   - `done` —— 完成判定（一句话，对应 AC 的某个子项）

#### `read_files` 与 `write_files` 的区别（B3 老项目护栏）

- **`read_files` 应该包含**：
  - 本任务要修改的文件（= write_files 的超集）
  - 本任务要 import / 参考的既有模块（沿用抽象要 read 才能用）
  - 02-design.md `## 0.5.1` 「触碰模块」中的「已有·复用」项

- **`write_files` 严格控制**：
  - 02-design.md `## 0.5.1` 「新增模块」项都加进来
  - 02-design.md `## 0.5.1` 「触碰模块」中需要修改的那些
  - **不允许加「禁动清单」里的文件**（这是 R7.3 + R6.5 联动拦截点）

- **示例**：
  ```xml
  <read_files>
    src/features/notifications/*
    src/lib/api-client.ts       <!-- 沿用 -->
    src/components/Modal.tsx    <!-- 复用 -->
    src/utils/date.ts           <!-- 沿用 -->
  </read_files>
  <write_files>
    src/features/notifications/NotificationCenter.tsx
    src/features/notifications/useNotifications.ts
    src/features/notifications/__tests__/*
  </write_files>
  ```

### 执行顺序

把任务按依赖关系分层，明确哪些可以并行、哪些必须串行：

- **无依赖** → 可并行执行
- **有依赖** → 必须等依赖任务完成后执行

输出形如：

```
第一批（可并行）: T01[P], T02[P]
第二批（可并行）: T03[P], T04[P]（依赖 T01）
第三批:           T05（依赖 T03, T04）
```

### 任务模板（XML，便于 AI 解析与执行）

```xml
<task id="T01" parallel="true">
  <name>添加 ThemeContext provider</name>
  <read_files>
    src/theme/*
    src/lib/api-client.ts
    src/utils/storage.ts
  </read_files>
  <write_files>
    src/theme/ThemeContext.tsx
    src/theme/__tests__/ThemeContext.test.tsx
  </write_files>
  <action>
    导出 ThemeProvider 与 useTheme hook。
    主题值从 localStorage 读取，缺省读取系统 prefers-color-scheme。
    沿用 src/utils/storage.ts 的 `safeStorage` 包装（避免隐私模式报错）。
  </action>
  <verify>npm test -- theme/ThemeContext.test.tsx</verify>
  <done>测试通过；hook 在三种状态（light/dark/system）下返回正确值</done>
  <depends_on></depends_on>
</task>
```

## 输出

- `.devflow-kit/<req-id>/03-tasks.md`（**必须严格按模板格式输出**，包含所有任务的 XML 块 + 执行顺序）
- **更新 `.devflow-kit/STATE.md`**：
  - `当前阶段` 设为 `task`
  - `阶段状态` 设为 `completed` 或 `blocked`
  - `上次完成阶段` 设为 `task`
  - `下一阶段` 设为 `dev`
  - 在「阶段进度」清单中打钩 `任务拆分 → 03-tasks.md`

## 约束（强制）

- **R2.3**：每个任务必须有可执行的 `verify`，否则不允许进入 `DEV`
- 任务粒度太大（无法在 fresh context 完成）必须再拆
- 不允许「重构 X 模块」这种没有边界的任务

## 自检

- ⏳ 每个任务都有完整的 7 字段（`id` / `name` / `read_files` / `write_files` / `action` / `verify` / `done`）
- ⏳ **每个 `write_files` 都严格在 02-design.md 「触碰模块 + 新增模块」范围内**（B3 护栏）
- ⏳ **任何任务的 `write_files` 都不包含 02-design.md 「禁动清单」中的文件**
- ⏳ 每个任务的 `verify` 都是可执行命令
- ⏳ `[P]` 任务均有并行安全理由：`write_files` 无交集、依赖无冲突、共享状态风险可控；如果没有安全并行点，允许 0 个 `[P]`
- ⏳ 执行顺序清晰、无环依赖
- ⏳ 任务编号连续
- ⏳ **STATE.md 已更新**（当前阶段 + 阶段进度打钩）

## 阶段完成声明（必须输出）

```
✅ 任务拆分 完成
📝 产物：.devflow-kit/<req-id>/03-tasks.md
📊 STATE.md 阶段进度已更新：[x] 任务拆分 → 03-tasks.md

任务统计：
- 总任务数: <N> 个
- 可并行: <M> 个（标记 [P]）
- 执行顺序: <列出执行批次>

模式判定：
- Fast 模式：直接进入开发阶段
- Standard/Strict 模式：询问用户是否生成详细实施计划（03a-implementation-plan.md）

➡️ 下一步：
- Fast：进入开发阶段
- Standard/Strict + 用户确认：生成 03a-implementation-plan.md → 进入开发阶段
```

> **执行阶段**：任务拆分是执行阶段，无阻塞且下一步明确时可继续进入下一阶段。
>
> **Standard/Strict 模式增强**：在任务拆分完成后，如用户要求详细设计，应生成 `03a-implementation-plan.md`，为每个任务提供：
> - 修改点清单（文件路径 + 操作类型）
> - 伪代码/关键逻辑说明
> - 影响范围分析（直接/间接影响 + 风险评估）
> - 验证命令和预期输出

## 触发下一步

### Fast 模式
`@devflow-kit/references/prompts/4-dev.md`（按执行顺序逐个执行）

### Standard/Strict 模式（可选详细设计）
1. 询问用户：“是否生成详细实施计划（03a-implementation-plan.md）？”
2. 如用户确认：
   - 读取 `@devflow-kit/templates/03a-implementation-plan.md` 模板
   - 为每个任务生成详细的实施计划
   - 保存到 `.devflow-kit/<req-id>/03a-implementation-plan.md`
   - 用户 review 确认后进入开发
3. 如用户跳过：直接进入 `@devflow-kit/references/prompts/4-dev.md`

