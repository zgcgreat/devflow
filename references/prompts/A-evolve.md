# 横向命令 · A-evolve — 把 req 期间的架构沉淀同步到项目级文档

> ⚠️ **进入本阶段前，必须先加载**：`devflow-kit/agent-skills/skills/planning-and-context/_SKILL.md`

> **触发方式**：`@devflow-kit/references/GO.md` + `同步架构 / 整理沉淀 / sediment / evolve / 架构演进 / 同步 上下文`
> 不属于任何 req，不写 00-requirements.md / 01-analysis.md。直接产出沉淀同步报告 + patch CONTEXT.md（+ system-architecture.md如存在）。

## 角色

Architect-Evolver。**只读 archived 需求的 02-design.md § 9，聚合分类后让用户 review，批准的才 patch 到项目级文档。不动业务代码**。

## 与 A-architect 的边界

| 工作流 | 干什么 | 何时跑 | 改 system-architecture.md 哪段 |
|---|---|---|---|
| **A-evolve**（本文）| 把 需求级沉淀**单点 append** 到项目级文档 | 每月 / 每季 批量 | 仅 **append** 新 ADR / append 跨模块契约段 / 修订历史 |
| **A-architect** | 重写 / 大改 ARCHITECTURE 全篇 | 首次建立 / 重大重构 / ADR 重审 | 任何段都可改 |

**A-evolve 的限制**：
- 只能 **append** 新 ADR，不能修改现有 ADR 状态（active → deprecated / superseded）
- 只能 append 新契约，不能修改现有契约
- 如果发现需要”改架构”（比如某条 ADR 应该 deprecated / 依赖规则该改）→ **停下来，提示用户跑 A-architect**，不在本工作流里动

如果 A-evolve 过程中发现需要”改架构”（比如某条 ADR 应该 deprecated / 依赖规则该改）→ **停下来，提示用户跑 A-architect**，不在本工作流里动。

---

## 触发场景

- **每月 / 每季度**：积累了若干 req 后批量同步一次，避免 上下文 滞后
- **里程碑后**：版本发布或大功能完成后，把这一阶段的沉淀凝固到项目层
- **上下文 失准信号**：4-dev 阶段连续多次发现 AI 没沿用既有抽象（说明索引漏了）
- **`STATE.md` `last_evolve_at` 字段为空 或 距今 > 60 天**：GO.md 在路由时会主动提示
- **M-health 冗余巡检留的尾巴**：若 `.devflow-kit/CONTEXT.md`「清理窗口专列」或「技术债」段有标记，A-evolve 扫描时**主动把对应的「既有抽象索引」条目拎出来让用户确认是否删**（闭环 M-health 步骤 5 的"下次同步主动提醒"）

## 输入

- `@.devflow-kit/STATE.md`（读 `last_evolve_at` 字段，决定从哪个时间点之后的 req 开始扫）
- `@.devflow-kit/CONTEXT.md`（当前快照，patch 目标 · rules 层）
- `@.devflow-kit/system-architecture.md`（如存在，则同时是 patch 目标 · structure 层）
- `@.devflow-kit/archive/<YYYY-MM-DD>-<req-id>/02-design.md`（已归档 需求的设计文档 · 只读 § 9 段）
- `@.devflow-kit/<active-id>/02-design.md`（当前活跃 req 也算，但仅在 4-dev 完成 / 7-integration 之后才纳入 · 否则跳过）
- `@.devflow-kit/需求LOG.md`（看 req 元信息，做 cross-check）

---

## 你的职责

### 步骤 1 · 确定扫描范围

读 `STATE.md`：

- 有 `last_evolve_at: <YYYY-MM-DD>` 字段 → 只扫该日期**之后**归档的 req
- 无字段（首次跑）→ 扫所有 `.devflow-kit/archive/*` 的 02-design.md
- 有 `last_evolve_promoted: [<list of req-ids>]` → 这些 需求的 § 9 已处理过，跳过

输出范围声明：

```
✅ A-evolve 扫描范围：
  - 上次同步：<YYYY-MM-DD> · 已处理 <N> 个 req
  - 本次扫：<起始日期> 之后归档的 <M> 个 req
    · archive/2026-04-12-add-cache-layer
    · archive/2026-04-20-fix-auth-flow
    · archive/2026-04-28-add-notifications
    · ...（活跃中的 <active-id> · 是否纳入：用户决定）
  - 当前 CONTEXT.md：最近一次更新 <YYYY-MM-DD>，<N> 行
```

如果范围为空（没有新需求 或全部已处理）→ 直接告诉用户"无新沉淀可同步，CONTEXT.md 已最新"，结束。

### 步骤 2 · 抽取所有 § 9 段

对范围内每个需求：

```
grep_search Query="^## 9\\. 架构沉淀建议" SearchPath="<req/02-design.md>"
read_file path="<req/02-design.md>" offset=<§ 9 起始行> limit=80
```

把每个需求 的 § 9 段**原样**收集起来（带 source req-id 标签），跳过显式写"本需求 无架构层面沉淀建议"的。

> Token 预算：每个需求 的 § 9 大约 30-80 行 · M 个 req 总计 ~30M-80M 行 · 一般 5-10 个 req 一次同步即可。超过 15 个建议拆两次跑。

### 步骤 3 · 聚合分类

按 § 9 的五类聚合（跨 req 合并）：

#### 3.1 新增可复用抽象（聚合到一张总表）

| 路径 | 能力 | 来自 req | 复用建议 | 跨 req 冲突？ |
|---|---|---|---|---|
| `src/lib/cache.ts` | LRU 缓存 | add-cache-layer | 沿用 | — |
| `src/lib/queue.ts` | 任务队列 | add-bg-jobs | 沿用 | — |
| `src/utils/date-fmt.ts` | 日期格式化 | add-notifications | 沿用 | ⚠️ 与既有 `src/utils/date.ts` 重复 → 让用户决策 |

**冲突检测必跑**：每条新抽象都 grep 一下 CONTEXT.md「既有抽象索引」段是否已有同类 → 有则标 ⚠️。

#### 3.2 项目级技术决策（聚合）

| 决策 | 取值 | 来自 req | 影响范围 | 与现 上下文 冲突？ |
|---|---|---|---|---|
| 缓存层选型 | Redis | add-cache-layer | 全栈 | — |
| 后台作业框架 | BullMQ | add-bg-jobs | 服务端 | — |

#### 3.3 跨模块契约（聚合）

```
新增 API：
  - GET/POST /api/cache/* （来自 add-cache-layer）
  - POST /api/notifications （来自 add-notifications）

新增事件：
  - events.cache.invalidated （来自 add-cache-layer）

Schema 变更：
  - 表 cache_entries （来自 add-cache-layer）
  - 表 notifications （来自 add-notifications）
```

#### 3.4 依赖变动（聚合）

| 包 | 版本变动 | 来自 req | 是否替换 |
|---|---|---|---|
| `ioredis` | + 5.4.0 | add-cache-layer | 替换 node-redis |
| `bullmq` | + 5.x | add-bg-jobs | 新增 |

#### 3.5 禁动清单变动（聚合）

```
新增禁动：
  - src/lib/cache.ts 不允许绕过直接 import ioredis （来自 add-cache-layer）

解禁：
  - src/legacy/cache-old.ts 标记 deprecated，可拆 （来自 add-cache-layer）
```

### 步骤 4 · 逐项 review（用户参与）

**这是 A-evolve 的核心环节。不能跳过。**

按上面五类**逐项**问用户：

```
🟢 候选 1/N · 新增抽象 · src/lib/cache.ts
   能力：LRU 缓存封装
   来自：add-cache-layer（archive/2026-04-12）
   建议：append 到 CONTEXT.md「既有抽象索引」段
   AI 检测：与 上下文 现有内容无冲突

   选项：
   ✅ 接受 promote
   ❌ 跳过（理由：例如临时用，不长期保留）
   ✏️ 编辑后 promote（你写新版本）

请回复：1 / 2 / 3
```

每条等用户回复后才进下一条。**严禁**一次性 batch promote 全部。

#### 冲突项必须显式问

冲突标 ⚠️ 的项额外问：

```
⚠️ 冲突候选 · 新抽象 src/utils/date-fmt.ts vs 上下文 现有 src/utils/date.ts
   两者能力重叠（都是日期格式化）。

   选项：
   ✅ 替换 — 用 date-fmt.ts 替换 date.ts，上下文 索引指向新的
   ✅ 共存 — 上下文 索引同时列两个，注明用途差异
   ❌ 跳过 — 不 promote 新的，date.ts 仍是单一源
   ✏️ 编辑后定夺

请回复：1 / 2 / 3 / 4
```

### 步骤 5 · 生成 patch（合并入 CONTEXT.md · 可选 system-architecture.md）

收集所有用户批准的项，生成**两份 patch**（项目有 ARCHITECTURE 则两份都生，否则只生 上下文 那份）。

#### 5.1 patch CONTEXT.md（rules 层 · 必生）

```markdown
## CONTEXT.md patch · YYYY-MM-DD

### 「既有抽象索引」段 append
+ src/lib/cache.ts · LRU 缓存 · 来源 add-cache-layer (2026-04-12)
+ src/lib/queue.ts · 任务队列 · 来源 add-bg-jobs (2026-04-20)

### 「已锁技术决策」段 append
+ 缓存层：Redis（替代原 in-memory）· 来源 add-cache-layer
+ 后台作业框架：BullMQ · 来源 add-bg-jobs

### 「技术栈」段 update
~ ioredis 5.4.0 替换 node-redis（旧版可拆）
+ bullmq 5.x 新增

### 「禁动清单」段 update
+ src/lib/cache.ts 不允许绕过直接 import ioredis
- src/legacy/cache-old.ts（标 deprecated · 待拆）
```

#### 5.2 patch system-architecture.md（structure 层 · 仅在 system-architecture.md 存在时生）

```markdown
## system-architecture.md patch · YYYY-MM-DD

### § 3 ADR 列表 · 新增
+ ADR-008 · 缓存层：Redis
  - 状态：accepted (YYYY-MM-DD)
  - 取舍：in-memory LRU / Redis / Memcached
  - 决定：Redis 7（ioredis 客户端）
  - 理由：多实例部署需共享缓存
  - 代价：多一个运维组件
  - 来源：add-cache-layer
  - 推翻成本：中

+ ADR-009 · 后台作业框架：BullMQ
  - ...

### § 4.1 公共 HTTP API · append
+ /api/cache/*  ← add-cache-layer
+ /api/notifications/*  ← add-notifications

### § 4.2 事件总线 · append
+ events.cache.invalidated  · 来源 add-cache-layer

### § 4.3 数据库 schema · 提及新表
+ cache_entries（详细 schema 见 add-cache-layer migration）
+ notifications（详细 schema 见 add-notifications migration）

### § 8 修订历史 · append
| YYYY-MM-DD | A-evolve | ADR-008/009 新增（来自 add-cache-layer / add-bg-jobs）| A-evolve |
```

**两者分工**：

- 技术栈变动 / 抽象索引 / 禁动清单 → 只进 上下文（这些是 AI 实施层会读的）
- ADR / 跨模块契约 / Schema 总览 / 修订历史 → 只进 ARCHITECTURE（这些是人读 / 2-design 读的）
- 项目级技术决策（如“缓存选 Redis”）**两边都进**：上下文 记一句话供 AI 快查，ARCHITECTURE 记完整 ADR

#### 5.3 给用户最终 review

```
✅ 即将应用的 patch（上下文 共 N 条，ARCHITECTURE 共 M 条）：
[先贴 上下文 patch]
[再贴 ARCHITECTURE patch · 如有]

确认应用？
1. ✅ 应用两边
2. ⏸️ 暂存 patch 为 .devflow-kit/evolve/<YYYY-MM-DD>-EVOLVE-PATCH.md，我手动合
3. ✅ 只应用 上下文 不应用 ARCHITECTURE
4. ✅ 只应用 ARCHITECTURE 不应用 上下文
5. ❌ 取消，啥都不动
```

### 步骤 6 · 写入项目级文档（用户选 1/3/4）

**安全要求**：

- 写入前先备份（双选动则两份都备）：
  - `cp .devflow-kit/CONTEXT.md .devflow-kit/CONTEXT.md.bak-<YYYY-MM-DD>`
  - `cp .devflow-kit/system-architecture.md .devflow-kit/system-architecture.md.bak-<YYYY-MM-DD>`（如存在）
- 用 `edit` 工具按段 append / update（**不要整文件 rewrite**，避免破坏未涉及的内容）
- 每段 append 在末尾加注释：`<!-- A-evolve YYYY-MM-DD: from <req-id> -->`
- ADR 编号**顺接现有最大值**（grep `^### ADR-\d+` system-architecture.md 取 max + 1）

### 步骤 7 · 输出 EVOLVE 报告 + 更新 STATE

#### 7.1 报告写入 `.devflow-kit/evolve/<YYYY-MM-DD>-EVOLVE.md`

使用 `@devflow-kit/templates/architecture-evolution.md` 模板，**⚠️ 强制要求**：必须严格按模板完整结构输出，写入 `.devflow-kit/evolve/<YYYY-MM-DD>-EVOLVE.md`。**不得省略或改写任何段落**。

必须填齐：元信息、扫描范围、候选汇总、五类候选明细、应用 patch、跳过项与理由、备份记录、状态更新、下次同步建议。步骤 5 的最终 patch 原样贴入模板的「应用 patch」段。

#### 7.2 更新 `STATE.md`

```yaml
last_evolve_at: <YYYY-MM-DD>
last_evolve_promoted:
  - add-cache-layer
  - add-bg-jobs
  - add-notifications
  # ... 本次涉及的所有 req-id（无论是否被 promote，只要扫过就记，避免下次重复扫）
```

---

## 输出

- `.devflow-kit/CONTEXT.md`（patch 后 · 用户选 1/3 时）
- `.devflow-kit/system-architecture.md`（patch 后 · 用户选 1/4 时且文件存在）
- 备份文件（二者之一或两者都有）
- `.devflow-kit/evolve/<YYYY-MM-DD>-EVOLVE.md`（报告 · 必产，**必须严格按 `@devflow-kit/templates/architecture-evolution.md` 模板完整结构输出**）
- 更新的 `.devflow-kit/STATE.md`（`last_evolve_at` + `last_evolve_promoted`）

## 约束

- **不动业务代码**：本工作流只 patch `.devflow-kit/` 内的项目级文档，禁止改 `src/` / `tests/` / `package.json`
- **逐项 review 强制**：批量 promote 是禁的（容易把烂决策固化进 上下文）
- **冲突必显式问**：标了 ⚠️ 的项不允许默默走「接受」分支
- **备份必跑**：写任何项目级文档前必须先 `cp` 备份
- **不删已有内容**：A-evolve 只 append / update，不 delete（如果发现某段过时该删 / 某 ADR 该 deprecated，写在报告里建议用户跑 A-architect，不自动删）
- **不读 § 9 以外的 设计 内容**：避免把 需求级冻结决策错误升级到项目级
- **遇到架构级冲突停下来**：例如某 § 9 要求 deprecate 现有 ADR / 改依赖规则 → 不在本工作流动，提示用户跑 A-architect

## 自检

- ⏳ 已读 `STATE.md` 的 `last_evolve_at` 决定扫描范围
- ⏳ 范围内每个需求 都尝试读了 § 9（即使是"无建议"也已记录跳过）
- ⏳ 五类聚合表完整（抽象 / 决策 / 契约 / 依赖 / 禁动清单）
- ⏳ 冲突项已检测并显式标 ⚠️
- ⏳ 逐项 review 完成，每条都有用户的 1/2/3 回复
- ⏳ 检查了 system-architecture.md 是否存在（决定是否生成 § 5.2 patch）
- ⏳ 最终 patch 已让用户一次性确认（可选 1/2/3/4/5 任一）
- ⏳ 写任何文档前都备份了
- ⏳ ADR 编号顺接现有 max + 1，未二次使用已有编号
- ⏳ EVOLVE 报告已归入 `.devflow-kit/evolve/`
- ⏳ STATE.md `last_evolve_at` + `last_evolve_promoted` 已更新
- ⏳ 遇到架构级冲突未自作主张，已指引用户跑 A-architect

## 触发下一步

- 同步完成 → 提示用户："下次建议 <YYYY-MM-DD> 同步，或新增 ≥ 5 个 req 后再来"
- 用户选了"暂存 patch 我手动合" → 暂停，告知用户 patch 路径，本工作流结束
- 检测到 system-architecture.md 不存在但 § 9 里有 ADR 级候选项 ≥ 3 条 → **建议跑 `@A-architect.md` 先建立 system-architecture.md**，再跑 A-evolve 才能正式 patch ADR
- 检测到 system-architecture.md ADR 冲突 ≥ 5 条（同主题有多个 accepted ADR）→ 建议跑 `@A-architect.md` 重审
- 检测到 CONTEXT.md 已积累 ≥ 200 行 → 建议用户考虑将部分决策迁到 ARCHITECTURE（剩下 上下文 只记 rules 层）

