# CONTEXT — 项目共享上下文

> 本文件**跨 req 长期累积**。每个 req 在 ANALYSIS 阶段会向这里追加术语和决策。
> 目标：为 AI 提供项目级的「域语言 + 默认偏好」，省去重复解释。

---

> ⚠️ **模板强制规则（R13.9）**：
> - 本文件包含 **15 个必填段落**，不得省略或改写
> - 所有 `<...>` 占位符必须替换为实际值
> - 遗漏任何段落 = 产物不完整，必须补齐

**必填段落清单**（输出前逐项确认）：
```
□ 项目概要
□ 项目地图（多项目必填）
□ 项目结构
□ 结构说明表
□ 技术栈
□ 域语言（术语表）
□ 已锁决策
□ 默认偏好
□ 前端结构（如有）
□ 后端结构（如有）
□ 共享契约（如有）
□ 既有抽象索引
□ 禁动清单
□ 技术债（如有）
□ intel-scan 元数据
```

---

## 项目概要

<3~5 句话讲清楚项目是什么、给谁、为什么存在。>

## 项目地图（多项目 / 前后端同目录必填）

> 先记录仓库拓扑，再记录技术栈。前端、后端、共享包在同一工作目录时，必须分别列出，避免 AI 只看到其中一端。

| 子项目 | 类型 | 根路径 | 主要信号 | 运行 / 验证命令 | 备注 |
|---|---|---|---|---|---|
| `<web>` | `frontend` | `<frontend/ 或 apps/web/>` | `<package.json + vite.config.ts>` | `<npm run dev / npm test>` | `<React SPA / Next App>` |
| `<api>` | `backend` | `<backend/ 或 apps/api/>` | `<pyproject.toml / go.mod / package.json>` | `<pytest / npm test / go test>` | `<FastAPI / NestJS / Go API>` |
| `<shared>` | `shared` | `<packages/types/>` | `<package.json>` | `<npm test>` | `<共享类型 / SDK>` |

## 项目结构（AI 导航必填）

> 这里不是摘要，而是给 AI 改代码前快速定位用的目录地图。必须保留前端、后端、共享包、配置、测试、脚本等关键目录；不重要的生成物可省略。每行写清楚“这个目录负责什么”，不要只贴树。

```text
<repo-root>/
├── <frontend/>                 # 前端应用：页面、组件、路由、样式入口
│   ├── src/
│   │   ├── pages|app|routes/    # 路由与页面组织
│   │   ├── components/          # 可复用 UI 组件
│   │   ├── features/            # 按业务域组织的前端功能
│   │   ├── hooks/               # 自定义 hooks
│   │   ├── lib|services/         # API client、请求封装、浏览器端服务
│   │   ├── stores|state/         # 状态管理
│   │   └── styles|theme/         # 全局样式、tokens、主题
│   ├── public/                  # 静态资源
│   └── <vite|next|nuxt config>   # 前端构建配置
├── <backend/>                  # 后端应用：API、业务逻辑、数据访问
│   ├── src|app/
│   │   ├── routes|controllers/   # HTTP 路由 / Controller
│   │   ├── services/             # 应用服务 / 业务编排
│   │   ├── domain|models/        # 领域模型
│   │   ├── repositories|dao|db/   # 数据访问
│   │   ├── middleware/           # 中间件
│   │   └── config/               # 配置读取与环境适配
│   └── tests/                   # 后端测试
├── <packages|shared/>           # 前后端共享类型、SDK、工具
├── <migrations|prisma|alembic/>  # 数据库 schema / migration
├── <scripts/>                   # 本地脚本 / 运维脚本
└── <docs|.devflow-kit/>               # 项目文档与 flow-kit 产物
```

### 结构说明

| 路径 | 类型 | 作用 | 改动风险 |
|---|---|---|---|
| `<frontend/src/components/>` | frontend | `<UI 基础组件>` | `<中：影响多个页面>` |
| `<frontend/src/lib/api.ts>` | frontend | `<统一 API client>` | `<高：禁止绕过>` |
| `<backend/src/services/>` | backend | `<业务编排层>` | `<中>` |
| `<backend/src/repositories/>` | backend | `<数据访问层>` | `<高：涉及 schema / 查询>` |
| `<packages/types/>` | shared | `<前后端共享契约>` | `<高：改动会影响两端>` |

## 技术栈（团队级默认 / 已锁定）

> 这里写**全项目共用**的栈。每次 req 的 `02-design.md ## 0` 会读此处作为默认；如果某次 req 用了不同的栈（例如临时加个 Python 服务），那次 02-design.md ## 0 会显式覆盖。

- **仓库形态**: <单体 / 前后端同目录 / monorepo / 多服务>
- **语言/运行时**: <例如 TypeScript + Node 20；Python 3.11>
- **前端框架**: <如有；写根路径，例如 `frontend/` 使用 Vite + React>
- **后端框架**: <如有；写根路径，例如 `backend/` 使用 FastAPI>
- **共享包 / 契约**: <如 OpenAPI / tRPC / packages/types / 未发现>
- **数据库**: <如有>
- **测试**: <例如 frontend: vitest + playwright；backend: pytest>
- **构建/部署**: <例如 frontend: Vite + Vercel；backend: Docker + Railway>
- **栈卡片编号**（来自 `@devflow-kit/references/reference/tech-stacks.md`）: <如 5 FastAPI + React>

## 域语言（术语表）

| 术语 | 定义 |
|---|---|
| <例：物化级联> | <一个课程/小节被首次落地到文件系统时触发的连锁状态变化> |
| ……  | …… |

> 加新术语时只在右列写定义，不解释来历。

## 已锁决策

按时间倒序追加：

- `[YYYY-MM-DD]` <决策内容> — 来自 `@.devflow-kit/<req-id>/02-design.md`
- ……

## 默认偏好（AI 在缺省时按此决策）

- 命名风格：<例 camelCase 函数 + PascalCase 组件 + kebab-case 文件>
- 错误处理：<例 不抛异常给 UI，统一返回 Result 类型>
- 状态管理：<例 React Context 优先，Redux 仅在跨远距离共享时考虑>
- 测试策略：<例 行为驱动 > 实现细节；不允许用 spy 屏蔽真实 IO>
- 建议提交信息格式：<例 `<type>(<req-id>): <subject>`>

## 子项目结构

### 前端结构（如有）

- **根路径**：`<frontend/ 或 apps/web/>`
- **入口**：`<src/main.tsx / app/layout.tsx / pages/_app.tsx>`
- **路由**：`<app router / pages router / react-router / vue-router>`
- **样式系统**：`<Tailwind / CSS Modules / Sass / theme.ts / tokens.css>`
- **UI 组件库**：`<shadcn/ui / MUI / AntD / Chakra / 自研>`
- **状态管理**：`<Context / Zustand / Redux / TanStack Query / SWR>`
- **表单与校验**：`<react-hook-form / zod / yup / 未发现>`
- **数据请求入口**：`<src/lib/api.ts / generated client / fetch wrapper>`
- **测试与预览**：`<Vitest / RTL / Playwright / Storybook>`
- **前端风险提示**：<SSR/hydration、SEO、a11y、响应式、bundle size、浏览器兼容等>

### 后端结构（如有）

- **根路径**：`<backend/ 或 apps/api/>`
- **入口**：`<src/main.ts / app/main.py / cmd/server/main.go>`
- **路由 / Controller**：`<src/routes / controllers / routers>`
- **Service / Domain**：`<src/services / domain>`
- **数据访问**：`<Repository / ORM client / DAO / raw SQL>`
- **配置**：`<env / config module>`
- **测试**：`<pytest / jest / go test / integration tests>`
- **后端风险提示**：<auth、schema、权限、并发、队列、外部集成等>

### 共享契约 / 包（如有）

| 名称 | 路径 | 用途 | 被谁引用 |
|---|---|---|---|
| `<types>` | `<packages/types/>` | `<前后端共享类型>` | `<frontend, backend>` |
| `<api-client>` | `<packages/api-client/>` | `<生成客户端>` | `<frontend>` |

## 既有抽象索引（来自 I-intel-scan · 防 AI 重复实现 · B5 老项目护栏）

> intel-scan 自动 grep 出来的项目级抽象。每个需求 4-dev 1.4 步骤会查这里。多子项目时按「子项目 / 路径 / 入口符号」记录，避免只沿用后端或只沿用前端。

### HTTP 客户端

| 子项目 | 路径 | 入口符号 | 使用方式 |
|---|---|---|---|
| `<frontend>` | `<src/lib/api-client.ts>` 或 `未发现` | `<apiClient / fetchJson>` | `<import { apiClient } from '@/lib/api-client'>` |
| `<backend>` | `<src/lib/http.ts>` 或 `未发现` | `<httpClient / externalApi>` | `<用于调用外部服务>` |

### 数据库访问

- **模式**：<Repository / DAO / 直接 ORM / Prisma client / Active Record / 其他>
- **路径**：`<src/repos/* 或 src/db/*>`
- **示例**：`<src/repos/UserRepo.ts:1 含 findById / findByEmail / save>`

### 状态管理

| 子项目 | 库 | 路径 | 示例 |
|---|---|---|---|
| `<frontend>` | `<zustand / redux / context-only / SWR / TanStack Query>` | `<src/stores/* 或 src/state/*>` | `<src/stores/userStore.ts:1 暴露 useUserStore>` |
| `<backend>` | `<N/A / server-side cache / DI container>` | `<路径或未发现>` | `<示例或未发现>` |

### 工具函数（utils / helpers）

| 工具类型 | 路径 | 入口符号 |
|---|---|---|
| 日期 | `<src/utils/date.ts>` 或 `未发现` | `formatDate / parseDate` |
| 字符串 | `<src/utils/string.ts>` 或 `未发现` | `slugify / truncate` |
| 校验 | `<src/utils/validation.ts>` 或 `未发现` | `validateEmail / validateUrl` |
| 存储 | `<src/utils/storage.ts>` 或 `未发现` | `safeStorage`（隐私模式兼容） |
| 错误 | `<src/utils/errors.ts>` 或 `未发现` | `AppError / NotFoundError` |

### 自定义 hooks（前端）

| 子项目 | 类别 | 路径 | 数量 |
|---|---|---|---|
| `<frontend>` | 数据 hooks（useFetch / useQuery） | `<src/hooks/data/*>` | <N> |
| `<frontend>` | UI hooks（useModal / useToast） | `<src/hooks/ui/*>` | <N> |
| `<frontend>` | 业务 hooks（useUser / useAuth） | `<src/hooks/*>` | <N> |

### 错误处理

- **前端**：`<src/components/ErrorBoundary.tsx>` 或 `未发现`
- **后端**：`<src/api/errorHandler.ts>` 或 `未发现`
- **通知**：`<toast 库：sonner / react-hot-toast / 自封装>`

### Schema / 迁移

- **工具**：<Prisma / Alembic / Knex / Flyway / Liquibase / Rails AR / 裸 SQL / 未引入>
- **路径**：`<prisma/schema.prisma 或 alembic/ 或 migrations/>`
- **建议**：<如未引入，标注「下次 schema 变更时建议引入 X」>

### 命名约定

- 文件命名：<例 kebab-case>
- 函数命名：<例 camelCase>
- 组件命名：<例 PascalCase>
- 测试文件：<例 `*.test.ts` 紧邻源码 / `__tests__/` 子目录>

### 禁动清单（AI 不许"顺手"碰）

> 这些是与新需求通常无关、改坏会出事的高风险模块。每个需求 的 DESIGN 0.5.1 会复用这清单。

- `<src/services/payment-service.ts>`（支付，改动需走金融合规）
- `<src/components/Layout.tsx>`（全局布局，改动影响所有页面）
- `<src/api/admin/*>`（管理后台，权限敏感）
- `<其他...>`

**清理窗口专列**（来自 `M-health` 步骤 2.5 冗余巡检 · 下次清理窗口一起 remove）：

- `<lodash>` · 未用依赖 · 2026-04-30 health 报告标记 · 不要再引入
- `<moment>` · 未用依赖 · 项目已迁 date-fns · 不要再 import

### 技术债（来自 M-health · 给 AI 在 2-design / 4-dev 时参考，别再加同类债）

> 只记 🟡 Scheduled 和 🟡 🔴 未处理项。🔴 Critical 已通过 health-fix req 处理中，不在此列。

| 债项 | 来源 | 首次发现 | 影响 | 计划处理 |
|---|---|---|---|---|
| `src/api/auth.ts` 与 `src/legacy/auth.ts` 38 行重复 | 2026-04-30 health · 2.5 冗余 | 2026-04-30 | AI 改一处时可能忘同步 | 2026-Q3 抽公共函数 |
| `UserService` 既接受 Email 又接受 username · 职责模糊 | 2026-04-30 health · R6 | 2026-04-30 | 新增用法易误用 | 待 user-service 重构 |

---

## intel-scan 元数据

- **last_intel_scan**: `<YYYY-MM-DD>`
- **scanner**: `prompts/I-intel-scan.md`
- **下次重扫建议**: `<触发条件：架构重构 / 框架升级 / 主要新增模块 / > 90 天>`

---

> 此文件长度建议 ≤ 300 行（含 intel-scan 自动填的字段）；超出时把陈旧条目归档到 `.devflow-kit/archive/CONTEXT-history.md`。
