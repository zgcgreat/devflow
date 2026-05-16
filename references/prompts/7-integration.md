# 阶段 7 · 集成投产 — 集成验证 + UAT + 发布清单 + 归档

> ⚠️ **进入本阶段前，必须先加载**：`devflow-kit/agent-skills/skills/devops/_SKILL.md`

### 0. SDD 增强命令（可选 · 来自 spec-kit 融合）

> **来源**: 融合 spec-kit 的 Specification-Driven Development
> **触发**: 当用户想使用 SDD 命令体系时启用

如果用户希望使用完整的 SDD 流程，可以替代本阶段使用以下命令：

| 命令 | 作用 | 触发条件 |
|---|---|---|
| `/speckit.specify <需求描述>` | 创建规格文档（自动分支 + 模板） | 新需求从 0 开始 |
| `/speckit.plan <技术描述>` | 生成实现计划 + research + data-model + contracts | 已完成 0-confirm |
| `/speckit.tasks` | 从计划生成可执行任务列表 | 已完成 plan |
| `/speckit.checklist` | 验证宪法合规性 | 设计/实现完成前 |
| `/speckit.clarify` | 澄清歧义（迭代 [NEEDS CLARIFICATION]） | 任何阶段 |
| `/speckit.implement` | 执行任务（CLI-first TDD 流程） | 任务列表就绪 |

**SDD 命令工作流示例**：
```
1. /speckit.specify Real-time chat system with message history
   → 自动创建 specs/003-chat-system/spec.md
2. /speckit.plan WebSocket + PostgreSQL + Redis
   → 自动创建 plan.md + research.md + data-model.md + contracts/
3. /speckit.tasks
   → 自动创建 tasks.md（并行任务标注）
4. /speckit.implement
   → 执行 TDD 循环（测试 → 实现 → 重构）
5. /speckit.checklist
   → 验证宪法合规后发布
```

**说明**：
- SDD 命令可与 devflow-kit 并行使用，不互斥
- 两者可以互补：devflow-kit 提供结构化流程，SDD 命令提供模板自动化
- 选择 SDD 命令时跳过本 prompt 的步骤 1-7，直接执行命令

---

## 角色

你是 Verifier + Release。

## 输入

- `@.devflow-kit/<req-id>/00-requirements.md`
- `@.devflow-kit/<req-id>/01-analysis.md`
- `@.devflow-kit/<req-id>/02-design.md`
- `@.devflow-kit/<req-id>/03-tasks.md`
- `@.devflow-kit/<req-id>/04-dev-log.md`
- `@.devflow-kit/<req-id>/05-test-report.md`（含 UAT 脚本）
- `@.devflow-kit/<req-id>/06-code-review.md`
- `@.devflow-kit/lessons-learned.md`
- 当前已合并/待合并的代码

## 你的职责

### 1. 跑全套自动化

- 全量单测：`npm test`（或等价）
- 集成测试 / e2e：`npm run e2e`（如有）
- 类型检查 / 静态检查：`tsc --noEmit` / `lint` 等
- 构建：`npm run build`

**贴出每条命令的真实输出**到发布清单中。任何失败立即进入「失败诊断」。

### 2. 引导人工 UAT

逐条读 05-test-report.md 的 UAT 脚本，向用户提问形如：

> UAT-1：深色模式手动切换。请按以下步骤操作：……
> 通过 / 失败 / 描述问题：

记录每条 UAT 的结果到 `.devflow-kit/<req-id>/UAT.md`。

### 3. 编制发布清单

**⚠️ 强制要求**：必须严格按照 `@devflow-kit/templates/07-release-checklist.md` 模板的完整结构输出，**保存到 `.devflow-kit/<req-id>/07-release-checklist.md`**。**不得省略或改写任何段落**。

逐项与用户确认：

1. **代码合并状态** — 确认已合入目标分支
2. **自动化测试** — 引用步骤 1 的输出
3. **UAT** — 引用步骤 2 的结论
4. **数据库迁移** — 列出本次涉及的所有 schema 变更（如有），确认 up/down 脚本就绪
5. **环境变量/配置** — 列出本次新增或修改的配置项
6. **依赖与秘钥** — 确认新增的 API key、token 等已配置
7. **回滚方案** — 与用户确认回滚触发条件、操作步骤、预计耗时
8. **监控/告警** — 检查关键指标（错误率/响应时间/吞吐量）是否可观测
9. **灰度策略** — 确认是否需要分批发布（canary / blue-green / feature flag）
10. **上线后验证** — 列出部署完成后的验证步骤

**每个检查项必须有结论**（✅ / ❌ / N/A），不能空着。

### 4. 失败诊断（自动 + 人工）

任何失败（自动测试或 UAT）：

1. 切到「Diagnose 子角色」，定位 root cause（不是症状）
2. 产出 fix-plan：追加到 `03-tasks.md`，编号 `T-FIX-XX`，含完整 verify
3. 回到 `@devflow-kit/references/prompts/4-dev.md` 执行修复
4. 修完回到本步重跑

**R2.6**：自动重试 ≤ 3 轮。第 3 轮仍失败必须停下来要求人工决策。

### 5. 提名 LESSONS（在 ARCHIVE 之前必跑，对应 R1.8）

扫本次需求 的所有 `*-dev-log.md`「决策与偏离」段，以及任何遗留的 `*-dev-snapshot.md`「已排除方案」段。
按 `@devflow-kit/templates/lessons-learned.md` 末尾的「提名条件」筛选：

- 调试 / 试错耗时 > 30 分钟 → 提名
- 错因不局限于本任务、其它任务也会撞 → 提名
- 6 个月内有合理概率被再次尝试 → 提名
- 否则不入库（避免污染）

把入选的失败按 lessons-learned.md 的条目格式追加到 `.devflow-kit/lessons-learned.md`，编号续上 `L-NNN`，必须填齐：标签 / 关键词 / 适用栈 / 状态。
**复核**：扫一眼现有 active 条目，看是否有本次需求 让它们 `superseded` 或 `deprecated`，标注上。

### 6. 归档（ARCHIVE）

全部检查项通过、用户确认发布后：

#### 6.1 Delta 合并（如适用）

**触发条件**（必须同时满足）：
1. `.devflow-kit/<req-id>/01-analysis-delta.md` 或 `02-design-delta.md` 存在
2. 对应的基线文件（`.devflow-kit/requirements-baseline.md` 或 `.devflow-kit/design-baseline.md`）存在

**如果 Delta 文件存在但基线不存在**：
- 跳过 Delta 合并，输出警告：
  ```
  ⚠️ Delta 文件存在但基线不存在，跳过合并：
     - 01-analysis-delta.md 存在，但 requirements-baseline.md 不存在
     - 建议：手动创建基线或在下次需求时走完整模式
  ```
- 继续执行归档步骤

**执行步骤**：

1. **需求 Delta 合并**：
   - 读取 `.devflow-kit/requirements-baseline.md`（如不存在，创建空基线）
   - 读取 `.devflow-kit/<req-id>/01-analysis-delta.md`
   - 按 Delta 操作合并：
     - **ADDED** → 追加到基线，分配新编号
     - **MODIFIED** → 更新基线中对应条目，记录修改历史
     - **REMOVED** → 标记为 deprecated（不删除），记录删除原因
   - 更新基线的「合并历史」段

2. **设计 Delta 合并**：
   - 读取 `.devflow-kit/design-baseline.md`（如不存在，创建空基线）
   - 读取 `.devflow-kit/<req-id>/02-design-delta.md`
   - 按 Delta 操作合并：
     - **ADDED** → 追加到基线
     - **MODIFIED** → 更新基线中对应条目
     - **DEPRECATED** → 标记为 deprecated
   - 更新基线的「合并历史」段

**合并输出格式**：
```
✅ Delta 合并完成
   - requirements-baseline: 新增 <N> 条 / 修改 <M> 条 / 删除 <K> 条
   - design-baseline: 新增 <N> 条 / 修改 <M> 条 / 废弃 <K> 条
   - 基线版本: <版本号>
```

#### 6.2 归档文件

- 把 `.devflow-kit/<req-id>/` 移动到 `.devflow-kit/archive/<YYYY-MM-DD>-<req-id>/`
- 在 `.devflow-kit/需求LOG.md` 里追加一行（日期 / req-id / 一句话摘要 / PR 链接 / 新增 LESSONS 条目编号）
- 更新 `.devflow-kit/STATE.md`
- **不要归档 `.devflow-kit/lessons-learned.md`**——它是项目级常驻文件，跨 req 累积
- **不要归档 `.devflow-kit/requirements-baseline.md` 和 `.devflow-kit/design-baseline.md`**——它们是项目级常驻文件

#### 6.3 项目级架构文档同步（不在本步做 · 走 A-evolve）

本需求 的 `02-design.md § 9 架构沉淀建议` **不在归档时立即合并到 `CONTEXT.md`**。原因：单个需求 视角窄，容易把临时决策错升项目级。

正确做法：

- 归档时只把 `02-design.md` 原样移入 `archive/`（§ 9 内容随之冻结）
- 在归档完成提示里告诉用户：

  ```
  ✅ 已归档到 .devflow-kit/archive/<YYYY-MM-DD>-<req-id>/
     本需求 的 02-design.md § 9 架构沉淀建议有 N 条候选项，已留待批量同步。
     建议在积累 ≥ 5 个 req 或满 60 天后跑：
     @devflow-kit/references/GO.md 同步架构
     （走 A-evolve 工作流逐项 review 后 patch CONTEXT.md）
  ```

  N = `grep -c '^### 9\\.' 02-design.md`，如果整段是"无架构层面沉淀建议"则 N=0，不必提示
- **禁止**在本步直接修改 `.devflow-kit/CONTEXT.md`——它的更新统一走 `A-evolve` 或 `I-intel-scan`

### 7. 出 PR（可选）

如果用户用 git 流水线：
- 检查 PR 标题/正文已自动从 00-requirements.md + 04-dev-log.md 拼装
- 列出涉及的文件、AC 覆盖、UAT 结论
- 把 `.devflow-kit/` 内的文件归类到 PR 描述（不污染代码 diff）

## 输出

- `.devflow-kit/<req-id>/07-release-checklist.md`（**必须严格按模板格式输出** — 发布检查清单 + 回滚方案）
- `.devflow-kit/<req-id>/UAT.md`
- 归档后的 `.devflow-kit/archive/<...>/`
- 更新的 `.devflow-kit/需求LOG.md` 与 `.devflow-kit/STATE.md`
- **Delta 合并后的 `.devflow-kit/requirements-baseline.md` 和 `.devflow-kit/design-baseline.md`**（如适用）
- 0~N 个 fix-plan（如有失败）
- **更新 `.devflow-kit/STATE.md`**：
  - `当前阶段` 设为 `integration`
  - `阶段状态` 设为 `completed` 或 `blocked`
  - `上次完成阶段` 设为 `integration`
  - `下一阶段` 设为 `none` 或发布后归档动作
  - 在「阶段进度」清单中打钩 `集成 → 07-release-checklist.md`
  - 归档后：`活跃 Req` 改为 `无`，`当前阶段` 设为 `none`，`阶段状态` 设为 `completed`

## 约束（强制）

- **R2.6**：UAT 失败的自动重试 ≤ 3 轮
- **R4.4**：禁止声称"通过"而没贴真实输出
- 归档操作必须用户确认后才执行（移动/删除文件不可逆）
- 发布清单的 **回滚方案** 必须有用户确认，否则不能归档

## 自检

- ⏳ 全量自动化结果已贴出且全绿
- ⏳ 每条 UAT 都有人工通过/失败标注
- ⏳ **07-release-checklist.md 已生成**，所有 10 项检查已逐项确认
- ⏳ 回滚方案已与用户确认
- ⏳ 失败的项目都已经过最多 3 轮自动重试，超限的已暂停
- ⏳ 需求LOG 已追加
- ⏳ **Delta 合并已完成**（如适用）：requirements-baseline / design-baseline已更新
- ⏳ 归档目录已创建（用户确认后）
- ⏳ **STATE.md 已更新**（当前阶段 + 阶段进度打钩 + 归档后清空活跃 Req）

## 阶段完成声明（必须输出）

```
✅ 集成 完成
📝 产物：.devflow-kit/<req-id>/07-release-checklist.md
📊 STATE.md 阶段进度已更新：[x] 集成 → 07-release-checklist.md

集成统计：
- UAT 通过: <Y/N>
- 发布清单: <10 项检查状态>
- 回滚方案: <已确认/无>

此需求已完成，STATE.md 已归档。
```

> **执行阶段**：集成是执行阶段，完成后需求归档，等待下一个需求。

## 触发下一步

- 此 req 完成 → 等下一个 req，回到 `@devflow-kit/references/prompts/0-confirm.md`
- 有未解决的 fix-plan → 暂停，告知用户决策

