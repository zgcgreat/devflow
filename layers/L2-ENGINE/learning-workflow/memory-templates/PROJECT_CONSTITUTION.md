# 项目宪法 (Project Constitution)

> **本文件定义项目级技术约束和原则，所有 Phase 执行必须遵守。**
> 由项目团队编写和维护，DevFlow 在每个 Phase 开始时自动加载。
> 位置：`.devflow/PROJECT_CONSTITUTION.md`
> 与流程宪法 (`CONSTITUTION.md`, 仓库根) 分离，互不干扰。

---

## 📋 快速填写指南

> **首次使用**: 运行 `npx devflow setup` 可交互式生成此文件。
> **手动填写**: 删除不需要的段落，保留与项目相关的约束即可。
> **优先级**: 当项目宪法与流程宪法冲突时，以项目宪法为准（用户约束 > 流程规则）。

---

## 技术栈

### 前端
- 框架: <!-- 如: React 18+ / Vue 3+ / Svelte 5+ -->
- 语言: <!-- 如: TypeScript 5+ (strict mode) / JavaScript ES2022+ -->
- 状态管理: <!-- 如: Zustand / Pinia / Redux Toolkit -->
- 样式: <!-- 如: Tailwind CSS / CSS Modules / Styled Components -->
- 构建工具: <!-- 如: Vite / Next.js / Nuxt -->

### 后端
- 框架: <!-- 如: Node.js + Express / Fastify / Django / FastAPI -->
- 语言: <!-- 如: TypeScript 5+ / Python 3.11+ / Go 1.22+ -->
- 数据库: <!-- 如: PostgreSQL 15+ / MySQL 8+ / MongoDB 7+ -->
- ORM: <!-- 如: Prisma / SQLAlchemy / TypeORM / Drizzle -->
- API 风格: <!-- 如: RESTful / GraphQL / gRPC -->

### 基础设施
- 容器: <!-- 如: Docker + Docker Compose / Kubernetes -->
- CI/CD: <!-- 如: GitHub Actions / GitLab CI / Jenkins -->
- 监控: <!-- 如: Prometheus + Grafana / Datadog / Sentry -->
- 托管: <!-- 如: Vercel / AWS / GCP / Azure -->

---

## 代码质量标准

> 这些标准在 Phase 4 实施和 Phase 6 审查时自动检查。

- 类型检查: <!-- 如: TypeScript strict mode 必须开启 -->
- Linting: <!-- 如: ESLint 零 error, ≤5 warnings -->
- 测试覆盖率: <!-- 如: 行覆盖率 ≥ 80% / 无硬性要求 -->
- 函数最大长度: <!-- 如: ≤ 50 行 / ≤ 100 行 -->
- 文件最大长度: <!-- 如: ≤ 300 行 / ≤ 500 行 -->
- 圈复杂度: <!-- 如: ≤ 10 / ≤ 15 -->
- 命名规范: <!-- 如: 文件 kebab-case / 组件 PascalCase -->

---

## 测试要求

- 测试框架: <!-- 如: Vitest (单元/集成) + Playwright (E2E) -->
- 单元测试: <!-- 如: 所有纯函数和工具类 -->
- 集成测试: <!-- 如: API 端点 / 数据库操作 -->
- E2E 测试: <!-- 如: 核心用户流程 -->
- 测试命名: <!-- 如: should <expected behavior> when <condition> -->
- Mock 策略: <!-- 如: 优先使用真实依赖 / 仅 mock 外部服务 -->

---

## 禁止项

> 以下内容在 Phase 4 实施时自动检测，违反将标记为 P1 错误。

<!-- 删除不适用于本项目的条目，添加项目特有的禁止项 -->

- ❌ <!-- moment.js → 使用 dayjs -->
- ❌ <!-- `any` 类型 → 使用 `unknown` + 类型守卫 -->
- ❌ <!-- console.log 生产代码 → 使用 logger -->
- ❌ <!-- 直接 DOM 操作 → 使用框架状态驱动 -->
- ❌ <!-- 同步文件/网络操作 → 使用异步 API -->
- ❌ <!-- 内联样式 → 使用 CSS 类/Tailwind -->
- ❌ <!-- 硬编码密钥/密码 → 使用环境变量 -->

---

## API 规范

> 如项目不涉及 API 开发，可删除此段。

- 风格: <!-- 如: RESTful / GraphQL -->
- 版本: <!-- 如: URL 版本 /api/v1/ / Header 版本 -->
- 认证: <!-- 如: JWT Bearer Token / API Key / OAuth 2.0 -->
- 错误格式: <!-- 如: { error: string, code: string, details?: any } -->
- 分页: <!-- 如: cursor-based / offset-based -->
- 命名: <!-- 如: kebab-case URL / camelCase JSON 字段 -->

---

## 数据库规范

> 如项目不涉及数据库，可删除此段。

- 迁移: <!-- 如: 必须有 rollback 脚本 / 使用 Prisma Migrate -->
- 命名: <!-- 如: snake_case 表名和列名 -->
- 索引: <!-- 如: 查询频繁的字段必须有索引 -->
- 软删除: <!-- 如: 使用 deleted_at / 物理删除 -->
- 审计: <!-- 如: created_at + updated_at 必须存在 -->

---

## Git 规范

- 分支策略: <!-- 如: GitFlow / GitHub Flow / Trunk-Based -->
- Commit 格式: <!-- 如: Conventional Commits (<type>(<scope>): <subject>) -->
- 分支命名: <!-- 如: feature/<req-id>-<slug> / fix/<slug> -->
- PR 要求: <!-- 如: 必须通过 CI / 至少 1 人审核 -->
- 保护分支: <!-- 如: main/develop 禁止直接 push -->

---

## 安全要求

> Phase 5 测试和 Phase 6 安全审查时参考此段。

- 密码存储: <!-- 如: bcrypt (cost ≥ 12) / argon2id -->
- JWT 配置: <!-- 如: Access Token 15min + Refresh Token 7d -->
- CORS: <!-- 如: 仅允许指定域名 / 开发环境允许 localhost -->
- 输入验证: <!-- 如: 所有用户输入必须服务端验证 -->
- 敏感数据: <!-- 如: 日志禁止输出 PII / 环境变量存储密钥 -->
- 依赖安全: <!-- 如: npm audit 零 critical / 每周检查 -->

---

## 性能要求

- 页面加载: <!-- 如: 首屏 < 2s / LCP < 2.5s -->
- API 响应: <!-- 如: P95 < 500ms / P99 < 1s -->
- 并发: <!-- 如: 支持 1000 QPS / 无硬性要求 -->
- 包大小: <!-- 如: 首屏 JS < 200KB (gzipped) -->

---

## 文档要求

- API 文档: <!-- 如: OpenAPI/Swagger / 无要求 -->
- 架构文档: <!-- 如: ADR (Architecture Decision Records) -->
- 变更日志: <!-- 如: CHANGELOG.md (Keep a Changelog 格式) -->
- README: <!-- 如: 必须包含快速启动 + 环境要求 -->

---

## 项目特有约束

> 添加项目特有的约束，以上模板未覆盖的内容。

<!-- 示例:
- 本项目使用 monorepo (Turborepo)，所有包在 packages/ 下
- 设计系统使用公司内部组件库 @company/ui
- 部署仅允许内网环境，不可使用外部 SaaS
- 数据必须留在国内，不可跨境传输
-->

---

## 变更记录

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|---------|--------|
| <!-- YYYY-MM-DD --> | 1.0 | 初始版本 | <!-- 姓名 --> |
