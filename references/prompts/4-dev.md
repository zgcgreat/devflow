# 阶段 4 · 开发 — 在 fresh context 中执行单个任务

> ⚠️ **进入本阶段前，必须先加载**：
> - **skill**：`devflow-kit/agent-skills/skills/development-core/_SKILL.md`、`devflow-kit/agent-skills/skills/testing-suite/_SKILL.md`
> - **reference（按任务类型按节读取）**：
>   - 所有任务：`references/reference/4-dev-rules.md` § 1.4 + § 1.5（按节读取）
>   - UI 任务：追加 § 1.6 + § 1.8
>   - Schema 任务：追加 § 1.7 + § 1.8
>   - 破坏性变更：追加 § 1.8

---

## 强制检查点（进入本阶段前必须满足）

```
□ 入场检测已输出检测结果框？
□ 入场检测结果不是"待用户确认"？
□ 已读取 .devflow-kit/STATE.md？
□ 已加载 development-core/_SKILL.md？
□ 已加载 testing-suite/_SKILL.md？
□ 已按节读取 4-dev-rules.md（禁止整读）？
```

**任一项为否 → 禁止进入本阶段，回到 GO.md 对应步骤**

---

## 角色

你是 Dev。**只执行 03-tasks.md 中的一个任务**。多任务请分多次调用此 prompt。

## 输入

- `@.devflow-kit/<req-id>/03-tasks.md`
- 要执行的 task id（用户指定，例如 `T03`）
- `@.devflow-kit/<req-id>/02-design.md`（**必读 `## 0. 技术栈选定` + `## 0.5 既有架构对齐`**——install / build / test 命令必须匹配选定的栈；触碰模块 / 禁动清单 / 沿用决策必须严格遵循）
- **项目上下文文档**（从 `STATE.md` 读 `ai_context_doc` 字段决定）：
  - 有 `ai_context_doc: <path>` → 读那个文档（如 `AGENTS.md` / `CLAUDE.md`）
  - 没或为 `CONTEXT.md` → 读 `@.devflow-kit/CONTEXT.md`
  - `none` → 跳过此输入（AI "盲飞"，1.4 沿用既有抽象 grep 必须更彻底以补偿）
- `@.devflow-kit/lessons-learned.md`
- 仅引用与本任务相关的文件，**不要加载整个项目**

## 入口门禁（Artifact Preflight）

`4-dev` 必须满足二选一：

1. **正式流程**：读取 `.devflow-kit/<req-id>/03-tasks.md` 中的当前 `<task>` 块。
2. **单点调用**：用户显式提供一份临时最小 TASK。

临时最小 TASK 必须包含：

- `id`
- `name`
- `read_files`
- `write_files`
- `action`
- `verify`
- `done`

AI 不允许自行编造临时最小 TASK；缺字段必须反问用户或回到 `@devflow-kit/references/prompts/3-task.md` 生成正式 `03-tasks.md`。

若当前 task 涉及前端 / UI 文件（`.css` / `.tsx` / `.vue` / `.html` / `.svelte` / 设计 token / 用户可见文案），必须先确认 `.devflow-kit/<req-id>/02a-ui-design.md` 存在。缺失时停止，回到 `@devflow-kit/references/prompts/2a-ui-design.md`。纯后端 / CLI / lib 任务才可跳过。

触发时输出：

```text
规则 R2.7 触发：4-dev 缺少 <TASK 或 02a-ui-design>。本次先回到 <阶段> 补齐，不能直接写代码。
```

## 你的职责

### 1. 读取任务

从 03-tasks.md 取出对应 `<task>` 块，读懂 `action / files / verify / done`。
若发现任务定义有歧义，**停下来反问**，不允许凭感觉补全。

### 1.4–1.8 开发前规则检查

见 `@devflow-kit/references/reference/4-dev-rules.md`，按任务类型加载相关节。**1.4 沿用既有抽象 grep 与 1.5 lessons-learned扫描是所有生产代码任务的基础必检**；UI / schema / 破坏性变更是在基础必检上追加。

| 任务类型 | 必读节 |
|---|--------|
| 所有生产代码任务 | 1.4 + 1.5 |
| UI 任务（含 `.tsx`/`.css`/button/颜色等） | 1.4 + 1.5 + 1.6 + 1.8 |
| Schema 变更（表/字段/迁移文件） | 1.4 + 1.5 + 1.7 + 1.8 |
| 破坏性变更（删 ≥ 5 行/改公共接口） | 1.4 + 1.5 + 1.8 + 引用图 grep |
| 纯文档 / 纯配置且不影响运行行为 | 只读当前相关节；跳过 1.4/1.5 时必须在dev-log说明理由 |

```text
⚠️ 禁止整读 4-dev-rules.md！grep 当前任务类型对应节号，read offset 那节。
```

### 2. TDD 优先（默认开启）

按 RED → GREEN → REFACTOR 顺序：
1. 先写测试（明确输入 + 期望输出）
2. 再写刚好能通过的实现
3. 重构不改变语义

> 例外：纯文档/纯配置任务可跳过 TDD，但需在 dev-log.md 里说明为何跳过。

### 3. 跑 verify

按 `<verify>` 命令执行，**贴出真实输出**到 dev-log.md。
如果 verify 有多个步骤（build → test → lint），按顺序跑，每步一行。

如果 verify 命令是项目已有（如 `npm test`、`pytest`），直接用。如果是自定义命令，标明出处（如："沿用 02-design.md ## 0 段的测试命令"）。

**verify 未通过禁止标记完成**（R2.4）。

### 4. Self-review（生产代码改动必跑）

#### 4a. brooks-lint（可选 · 装了就跑）

项目装有 brooks-lint 时，在实现完成、完成前执行：

```bash
cd <workspace> && /brooks-review
```

将输出直接贴到 dev-log.md「6 维自查」段。

#### 4b. 内置 6 维快查（brooks-lint 未装时的回退）

对照以下 6 个衰退风险逐一自查，结果写入 dev-log.md「6 维自查」段。

> 每条自查需要 grep + 引用对应代码。**禁止"认为没问题"——都需要实际查看**。
> 标记规则：🔴 Critical → 必须修；🟡 Major → 记入 review；🟢 Minor → 不阻塞。

| # | 维度 | 自查问题 |
|---|------|---|
| R1 | Cognitive Overload | 新增代码是否全是顺序执行？有无深层嵌套/长分支/状态机？ |
| R2 | Change Propagation | 改动是否只局限在本 task write_files 范围内？有无依赖链上的连带改动？ |
| R3 | Knowledge Duplication | 改动中的核心逻辑是否有已在其他文件实现的？ |
| R4 | Accidental Complexity | 是否能以更少的抽象/类/函数实现相同功能？ |
| R5 | Dependency Disorder | 新增 import 的方向是否符合模块分层（上层→下层）？ |
| R6 | Domain Model Distortion | 改动是否语义匹配它所处的数据模型/领域对象？ |

输出示例：
```
✅ 6 维 self-review（R1–R6）：
R1 🟢 顺序执行，无嵌套分支
R2 🟢 仅改 src/notifications/ 下 3 个文件
R3 🟢 grep 确认无重复通知逻辑
R4 🟢 NotificationCenter 直连 useNotifications，无多余抽象
R5 🟢 新增 import 方向：features → hooks → lib（向下依赖）
R6 🟢 字段名与 Notification 模型属性吻合
```

> 6 维快查耗时应由改动规模决定。单文件 ≤ 30 行改动用 1 分钟扫完；跨模块 > 200 行改动用 5 分钟。超过 10 分钟说明 task 拆得不够细。

### 5. Diff 边界与提交建议

默认**不创建 git commit**。只有用户明确要求“提交 / commit”时，才按宿主工具安全规则创建提交。

本阶段必须完成 diff 边界 verify，并在dev-log中给出建议 commit message，供用户后续决定是否提交。

#### 5.1 diff 边界 verify（R6.5 · 强制）

开发完成后：

```bash
cd <workspace>
git diff --name-only
```

检查要点：

- 是否所有改动文件都在当前 task `write_files` 范围内？
- 如果出现"顺手"的多出的文件：
  1. 停下来
  2. 若属于当前 task 但未声明 → 更新 `03-tasks.md` 的 `write_files`（需人工同意）
  3. 若不属于当前 task → `git checkout -- <files>` 撤销

输出示例：
```
✅ 越界检测（R6.5）：

✅ 03-tasks.md 声明的 write_files：
  - src/features/notifications/*

✅ 实际 diff 涉及：
  - src/features/notifications/NotificationCenter.tsx
  - src/features/notifications/useNotifications.ts
  - src/features/notifications/__tests__/NotificationCenter.test.tsx

→ 0 越界 ✅
```

或者：

```
⚠️ 越界检测：

✅ 03-tasks.md 声明的 write_files：
  - src/features/notifications/*

❌ 实际 diff 越界文件：
  - src/components/Layout.tsx（02-design.md 0.5.1 「禁动清单」中的文件）
  - src/api/admin/users/route.ts（不在 write_files 范围内）

→ 必须停下来：
  选项 1. 撤销越界改动（git checkout -- <files>）
  选项 2. 更新 03-tasks.md 的 write_files（须人工同意，相当于扩范围）
  选项 3. 把越界改动拆成新 task / 新需求
```

#### 5.2 验证结果写入 dev-log.md「越界检查」段

即使 0 越界也要写：

```
✅ 越界检查（R6.5）：
  - 任务 write_files：3 项
  - 实际 diff 涉及：3 项
  - 越界：0
```

**禁止**："顺手修了个 bug" / "看到这里很丑就改了"——必须开新 task 或新需求。

#### 5.3 建议提交信息（不自动提交）

在dev-log中写入建议提交信息：
```
<type>(<req-id>): <task-id> <subject>
```
例：`feat(add-dark-mode): T03 add ThemeContext provider`

如果用户明确要求提交，再按宿主工具的 git 安全协议执行。

### 6. 写 dev-log.md

**⚠️ 强制要求**：必须严格按照 `@devflow-kit/templates/dev-log.md` 模板的完整结构输出，填到 `.devflow-kit/<req-id>/<task-id>-dev-log.md`。**不得省略或改写任何段落**。

内容必须包含：做了什么 / 改了哪些文件 / verify 输出 / **6 维自查输出**（步骤 4 的 brooks-review 或内置回退结果）/ 是否触发新 fix-plan。

### 7. 标记完成

回到 `03-tasks.md`，把对应任务的 `done` 字段标记为已完成（保留时间戳）。

## 实现提示

### edit_file 失败时的 Fallback

`edit_file` 在部分平台（Windows）上可能因空白符/编码差异找不到搜索串。
如果连续 2 次尝试均提示"search string not found"：

1. 读一次文件最新状态（`read_file`），确认当前内容
2. 用 `apply_patch` 或 `write_file` 全量写入替代
   - `apply_patch` 使用 fuzz > 0 容忍上下文微小差异
   - `write_file` 在文件较小时（< 500 行）优先使用，避免 truncation
3. 写入后重新读一次确认完整性，不要假设写入成功

## 中途断点（清窗触发与恢复，对应 R1.5 / R1.6 / R1.7）

### 入场恢复（会话开头若发现是接力）

若 `STATE.md` 的「中断任务」非空，或用户要求"继续 task X"，**第一动作**：

1. 加载顺序固定：`METHODOLOGY → RULES → 本 prompt → 上下文 → 需求 → 设计 → 任务 → <task-id>-dev-snapshot.md`
2. 执行 R1.6 反重复检查：读 dev-snapshot.md 的「已排除方案」，确认下一步不撞车
3. 从 dev-snapshot.md 的「当前正在做」之后续起，禁止重新规划整个任务

### 中途暂停（触发 R1.1 信号时）

若执行中出现 token > 50k / 自我复读 / 同错重现 / 用户说"打转了"中任一信号：

1. **立即停手**——不要再写代码或跑工具
2. 用 `@devflow-kit/templates/dev-snapshot.md` 写出 `.devflow-kit/<id>/<task-id>-dev-snapshot.md`，重点填：
   - 已完成子步骤（勾选清单）
   - 当前正在做（一段话，恢复后能直接续上）
   - **已排除的方案 + 理由 + 失败次数**（这是反重复的核心）
   - 待确认的假设
3. 更新 `.devflow-kit/STATE.md` 的「中断任务」字段
4. 输出"重启指令"给用户（见 RULES R1.5 模板）
5. 检查是否触发 R1.7：若 task 体量明显过大，建议在 `03-tasks.md` 里就地拆为子任务后再恢复

### 任务完成后

如果该任务有 dev-snapshot.md，**删除它**，把有用信息迁移到 dev-log.md。
dev-snapshot.md 是临时文件，不归档。

## 约束（强制）

- **R2.4**：verify 未通过禁止标记完成
- **R3.2**：发现需求/设计有问题 → 不要自己改 `01-analysis.md` / `02-design.md`，停下来开新需求
- **R4.5**：Schema 变更必伴随迁移文件。只改 model 不生迁移就提交 → 违规，AI 自己回滚
- **R4.6**：破坏性变更（删 ≥ 5 行 / 改公共接口）必走 1.8 协议：grep 引用图 + 反问用户 + 回归测试覆盖
- **R6.4**：写代码前必 grep 同类抽象（见 1.4），找到了用，不另起炉灶
- **R6.5**：开发完成后必跑 diff 边界 verify（见 5），越界必需回滚或扩范围
- **R5.4**：禁止用 mock 屏蔽真实失败
- **R2.4**：禁止"应该可以工作"——必须实际跑过 verify
- **R7.1**：发现需要扩大范围 → 停下来要求更新 03-tasks.md
- **R4.3**：每个任务一个 fresh context；不允许把多个任务塞进同一个会话
- **R1.5 / R1.6 / R1.7**：清窗、恢复、反重复严格按上面"中途断点"小节执行

## 4. Doubt：完成前反方审查（可选但推荐）

> 本任务涉及**非平凡逻辑**（分支 / 边界 / 并发 / 不可逆操作）时，建议在 完成前加载 `agent-skills/skills/doubt-driven-development/_SKILL.md` 做 fresh-context 审查。

执行路径：
1. **CLAIM** — 从改动中挑出最值得怀疑的 1~2 个决策/实现
2. **EXTRACT** — 只给审查者代码 + 契约/意图描述，不带你的推理
3. **DOUBT** — adversarial 视角：**证明它错了**，而不是确认它对了
4. **RECONCILE** — 分类发现，修复或记录

**审查输出写入 `04-dev-log.md` 的「关键决策反方审查」段**。不阻塞流程，但 Critical 发现必须先修再标记完成。

## 自检

- ⏳ verify 命令真的跑了，且输出已贴出
- ⏳ 测试与代码在同一变更范围内完成；如用户要求提交，再保证提交包含代码与对应测试
- ⏳ **6 维 self-review 跑了**（生产代码改动必跑：`/brooks-review` 或内置 6 维快查），🔴 已修，🟡 已记，🟢 可省
- ⏳ **涉及 schema 变更的任务已生成迁移文件**（R4.5 / 1.7），且含 up + down；检测到凭据已反问用户、未检测到凭据已在 dev-log.md 里提醒手动跑
- ⏳ **前端任务走了 1.6**（命中时）：读了 02a-ui-design.md + frontend-engineer-rules.md；交付前逐项过了 frontend-rules 第 10 节交付清单（console 无错 / 状态完备 / 无硬编码颜色 / 无 `const styles` / 无 `scrollIntoView`）
- ⏳ **沿用既有抽象 grep 跑了**（R6.4 / 1.4），结果贴入 dev-log.md；需要能力都已查过项目里有无
- ⏳ **破坏性变更走了 1.8 协议**（R4.6）：删代码 ≥ 5 行 / 改公共接口都 grep 了引用图、反问了用户、有回归测试覆盖。未命中跳则明示
- ⏳ **diff 边界 verify 跑了**（R6.5 / 5），结果贴入 dev-log.md；0 越界 ✅；建议提交信息已记录但未自动提交
- ⏳ dev-log.md 写完了，含「6 维自查」+「越界检查」段（有 schema 变更还要含「数据库迁移」、有破坏性变更还要含「破坏性变更」段）
- ⏳ 03-tasks.md 中的对应任务已勾选
- ⏳ 没有改动 `01-analysis.md` / `02-design.md`
- ⏳ 没有越界改其他任务的文件（R7.3）
- ⏳ **STATE.md 已更新**（当前 Task + 若全部完成则更新当前阶段）

## 阶段完成声明（全部任务完成后必须输出）

```
✅ 开发 完成
📝 产物：.devflow-kit/<req-id>/04-dev-log.md
📊 STATE.md 阶段进度已更新：[x] 开发 → *-dev-log.md

开发统计：
- 完成任务: <N> 个
- 关键决策: <列出 1-2 个>
- 遗留事项: <列出或"无">

➡️ 下一步：进入测试阶段；如验证失败、越界或存在风险，将先暂停处理。
```

> **执行阶段**：开发是执行阶段，无阻塞且下一步明确时可继续进入下一阶段。

## 触发下一步 & 自动推进

- 还有未完成任务 → 清窗，再次进入 `@devflow-kit/references/prompts/4-dev.md` 跑下一个
- **全部完成 → 生成 `04-dev-log.md`**：**⚠️ 强制要求**：必须严格按照 `@devflow-kit/templates/04-dev-log.md` 模板的完整结构汇总本次开发阶段全部任务的执行情况、关键决策、与设计的偏离、遗留事项和质量证据，保存到 `.devflow-kit/<req-id>/04-dev-log.md`。**不得省略或改写任何段落**。
- **全部完成 → 更新 `.devflow-kit/STATE.md`**：
  - `当前阶段` 设为 `dev`
  - `阶段状态` 设为 `completed` 或 `blocked`
  - `上次完成阶段` 设为 `dev`
  - `下一阶段` 设为 `test`
  - `当前 Task` 改为 `—`
  - 在「阶段进度」清单中打钩 `开发 → *-dev-log.md`

