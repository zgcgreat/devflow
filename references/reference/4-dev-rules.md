# 4-dev 规则参考 — 开发前检查清单

> 被 `@devflow-kit/references/prompts/4-dev.md` 引用。按任务类型加载相关节，不要整读。

---

## 1.4 沿用既有抽象 grep（强制 · 对应 R6.4 / B5 老项目护栏）

> 写新代码前必须 grep 同类抽象。找到了用，找不到才另起。

### 1.4.1 grep 检查清单

针对本任务 `action` 中提到的每个能力，执行 grep。**禁止凭印象判断"项目里没有"**。

| 任务里的能力 | grep 命令模板 | 找到了怎么办 |
|---|---|---|
| HTTP 请求 | `grep -rn "axios\|fetch\|httpClient\|apiClient" src/` | 用既有客户端，禁直接 fetch |
| 日期格式化 | `grep -rn "format.*[Dd]ate\|date.*[Ff]ormat" src/utils src/lib` | import 用 |
| 状态管理 | 看 `package.json` zustand / redux / mobx | 用现有 store 范式 |
| Repository / DAO | `grep -rn "class.*Repository\|@Entity\|@Repository" src/` | 沿用模式 |
| 错误处理 | `grep -rn "ErrorBoundary\|errorHandler\|class.*Error" src/` | 沿用 |
| 自定义 hooks | `find src -name 'use*.ts*'` | 看有没有相似的 |

### 1.4.2 写入 dev-log.md「6 维自查」段

每条 grep **必须**贴入 `<task-id>-dev-log.md` 的「6 维自查」段：

```
✅ 沿用既有抽象 grep（R6.4）：
- HTTP 请求：找到 src/lib/api-client.ts:1（统一封装 axios）→ 沿用
- 日期格式化：找到 src/utils/date.ts:8（formatDate）→ 沿用
- 通知组件：未找到 → 新建（02-design.md 0.5.3 已批准）
```

**禁止**："项目里好像没有"——必须有 grep 命令和结果作证。

---

## 1.5 扫 lessons-learned.md（强制，对应 R1.8）

进入实现**之前**：

1. 用当前任务的 `files` 路径关键词、`action` 中的关键名词，grep `.devflow-kit/lessons-learned.md`
2. 对每条命中且 `状态: active` 的 `L-NNN`，在本次执行计划里写一行：
   - 「已查阅 L-NNN，本次方案与之差异是 X」 或
   - 「已查阅 L-NNN，本次确认仍适用，所以不会重试该方案」
3. 若计划做的事与某条 active 条目完全相同 → 停下来按 R1.6 回答"本次与上次的差异是什么"，不允许盲目重试
4. 若 `.devflow-kit/lessons-learned.md` 不存在 → 用 `@devflow-kit/templates/lessons-learned.md` 创建空骨架

---

## 1.6 UI 任务额外检查（仅当任务涉及任何用户可见 UI）

判定标准：任务的 `files` 包含 `.css` / `.scss` / `.tsx` / `.vue` / `.jsx` / `.html` / `.svelte`，或 `action` 含 button / 颜色 / 字体 / 卡片 / 布局 / 动画 / 主题 等关键词。

命中时，进入实现**之前**还必须：

1. 加载 `@.devflow-kit/<id>/02a-ui-design.md`（必须存在；不存在 → 停下来要求先跑 `@devflow-kit/references/prompts/2a-ui-design.md`）
2. 加载 `@devflow-kit/references/reference/ui-anti-patterns.md`，按当前任务的关键词 grep 相关章节
3. 加载 `@devflow-kit/references/reference/frontend-engineer-rules.md`（**第 1 + 第 2 + 第 10 节必读**），其他节按输出类型按需读：
   - 任务是做交互原型 → 补读第 6.1
   - 任务是做幻灯片 / 演示 → 补读第 6.2
   - 任务是做仪表盘 / 数据可视化 → 补读第 6.3
   - 任务有动画 / 交互动效 → 补读第 4 节 + 第 6.4
   - 任务涉及多变体 / 实时调参 → 补读第 5 节（Tweaks 面板）
4. 对每条命中的"强制禁忌"，在执行计划里**显式声明**：
   - 「已知 X 是禁忌（来自 anti-patterns / frontend-rules），本任务不涉及」 或
   - 「已知 X 是禁忌，本任务采用 Y 替代」
5. **Token 来源单一**：颜色 / 字体 / 间距 / 圆角 / 动效必须从 02a-ui-design.md frontmatter 派生的 CSS variables / theme 文件中取。**禁止**在组件代码里硬编码颜色或字号（frontend-rules 第 2.1 节）
6. **React 三条硬规则马上写入计划**（仅 React 任务）：禁 `const styles` / 跨文件用 `Object.assign(window, ...)` / 禁 `scrollIntoView`（frontend-rules 第 1.1–1.3）
7. 实现完成后再扫一遍 anti-patterns + frontend-rules 第 10 节交付清单（self-review），写入 dev-log.md

> 装了 [impeccable](https://impeccable.style) 的项目可以用 `npx impeccable detect <files>` 自动化此扫描，仍需在 dev-log.md 里贴输出。

---

## 1.7 数据库 Schema 任务额外检查（涉及表 / 字段变更必跑 · 对应 R4.5）

> 这是 AI 开发最高频的事故源——改了 ORM model 没生迁移，跑起来报"表/字段不存在"。本段强制堵住。

**判定标准**：任务的 `action` 含「**新增表 / 加字段 / 改字段类型 / 加索引 / 加外键 / 重命名表/列 / 删表/列**」等关键词，或 `files` 涉及：

- ORM model：`models/*.py` / `*Model.ts` / `entity/*.java` / `*.entity.ts` / `schema.prisma` / `*.gorm.go`
- 迁移目录：`migrations/*` / `db/migrate/*` / `alembic/versions/*` / `prisma/migrations/*`
- DDL：`*.sql`（含 `CREATE TABLE` / `ALTER TABLE` 等）

命中时，进入实现**之前**必须

1. **schema diff → 执行计划**
   在执行计划里列出本次产生的 schema 变更：
   ```
   Schema diff（R4.5）：
   - 新增表：notifications（id, user_id, title, body, read_at, created_at）
   - 索引：notifications.user_id + 复合索引 (user_id, created_at DESC)
   - 回滚：DROP TABLE notifications CASCADE
   ```

2. **生成迁移文件**
   - Prisma：`npx prisma migrate dev --name add_notifications`
   - Alembic：`alembic revision --autogenerate -m "add_notifications"`
   - 纯 SQL：在 `migrations/` 下生成 `<timestamp>_<name>.up.sql` + `.down.sql`
   - 生成后**必须验证**迁移文件存在（`ls migrations/ | tail -5`）

3. **检测 DB 凭据 → 反问用户**
   ```
   grep -rn "DATABASE_URL\|DB_HOST\|DB_CONNECTION\|host=.*port=" .env* config/ docker-compose.yml
   ```
   - 找到凭据 → 反问用户「已检测到数据库凭据，是否现在执行迁移？」选项：
     1. 现在执行（AI 跑迁移命令）
     2. 只生成 SQL，稍后手动跑
     3. 先看 SQL 内容再决定
   - 未找到凭据（local dev 无配置）→ 生成 SQL + 在 `dev-log.md`「数据库迁移」段显式提醒用户手动在 local / dev / staging / prod 各环境执行

4. **迁移文件写入 dev-log.md「数据库迁移」段**
   ```
   ✅ 数据库迁移（R4.5）：
   - 迁移文件：migrations/20250315_add_notifications.up.sql
   - 回滚文件：migrations/20250315_add_notifications.down.sql
   - 凭据状态：找到 DATABASE_URL（来自 .env.local）→ 已反问用户「是否执行」
   - 用户选择：先看 SQL 再决定（已贴入下方）
   ```

5. **可逆性确认**
   - 生成的 down / rollback 文件必须存在
   - 改字段名/类型必须 include 数据迁移 SQL（`UPDATE ... SET new_col = old_col`）
   - 删字段：先用若干周期 `ALTER TABLE ... ALTER COLUMN ... DROP DEFAULT` + 应用层双写 做灰度
   - 删表：必须 double-check 无生产数据依赖，否则规划分期下线

本步生成的迁移文件，5-test 第 4 轮「4.2 数据迁移测试」会再验证一次（在生产数据快照上预演）。所以这里生成的文件必须能被 trace（路径要写进 dev-log.md）。

---

## 1.8 破坏性变更高门槛（强制 · 对应 R4.6 / B4 老项目护栏）

> 删错代码 / 改坏公共接口是**老项目最高频真事故**。本段强制堵住。

**判定标准**：命中以下**任一**条件：

1. **删除既有代码** ≥ 5 行（不算空行 / 注释）
2. **改公共导出**：导出函数 / 类 / 接口的签名变更（参数 / 返回值 / 类型）
3. **改公共 API**：HTTP / GraphQL / gRPC 路由或 schema 变更
4. **删除文件**或重命名导出符号

命中时，进入实现**之前**必须经以下三步：

### 第一步 · grep 引用图

针对要删除的每个路径 / 符号 / API 路由：

```
# 删除文件引用图
grep -rn "from '\.\./path/to/target'" src/

# 删除导出符号引用图
grep -rn "import.*{.*TargetSymbol" src/

# API 路由引用图（OpenAPI / Swagger / 前端调用点）
grep -rn "/api/v1/notifications" src/
```

引用图结果贴入 dev-log.md「破坏性变更」段。

### 第二步 · 反问用户

```
⚠️ 破坏性变更检测（R4.6）：
  变更类型：删除 src/lib/legacy-parser.ts（被 5 个文件引用）
  引用图：已贴入dev-log.md
  选项：
  1. 删除 → 同步更新所有调用点 + 生成 codemod
  2. 保留兼容 → 加 @deprecated 标记，删除推迟到下个里程碑
```

### 第三步 · 回归检查

确保删除/改动的路径有测试覆盖（`grep -rn "legacy-parser" __tests__/` → 至少 1 条用例）。

### 非破坏性边界（**不需要**走 1.8）

以下虽然也算删除/改动，但风险极低，**可以直接改**：

- 删纯实现细节（private / 非导出函数、局部变量），且 < 5 行
- 改测试文件（`__tests__/` / `*.spec.*` / `*.test.*`）
- 类型放宽（`any → string` 不是破坏性，`string → any` 是）
- 热路径编译（不触发旧逻辑的任何改动）

