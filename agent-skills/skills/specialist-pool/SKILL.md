---
name: specialist-pool
description: |
  代码审查专家角色池。根据改动规模和类型，自动选择合适的专家组合。
  触发: review、审查、代码检查
triggers:
  - review
  - 审查
  - 代码检查
  - specialist
---

# Specialist Pool — 专家角色池

> 复杂审查任务启用多专家协作。始终启用 Maintainability + Testing，其他按需。

---

## 快速索引

| 专家 | 触发条件 | 输出格式 |
|------|---------|---------|
| `api-contract` | SCOPE_API=true | JSON finding |
| `data-migration` | SCOPE_MIGRATIONS=true | JSON finding |
| `security` | SCOPE_AUTH=true 或大改动 | JSON finding |
| `performance` | SCOPE_BACKEND/FRONTEND=true | JSON finding |
| `maintainability` | **始终启用** | JSON finding |
| `testing` | **始终启用** | JSON finding |
| `red-team` | 大改动(>200行) 或 security发现CRITICAL | JSON finding |

---

## 通用输出 Schema

```json
{
  "severity": "CRITICAL|INFORMATIONAL",
  "confidence": 1-10,
  "path": "file.ts",
  "line": 123,
  "category": "specialist-name",
  "summary": "问题描述",
  "fix": "修复建议",
  "fingerprint": "path:line:specialist",
  "specialist": "specialist-name"
}
```

**无发现时输出：** `NO FINDINGS`

---

## 1. API Contract Specialist

**触发条件：** `SCOPE_API=true`

### 检查范围

| 类别 | 检查项 |
|------|--------|
| **Breaking Changes** | 移除响应字段、改变字段类型、添加必需参数、改变HTTP方法/状态码、重命名端点未做重定向、改变认证要求 |
| **Versioning Strategy** | 未版本升级就breaking change、混用版本策略、废弃端点无时间线、版本逻辑分散 |
| **Error Response Consistency** | 新端点错误格式不一致、错误响应缺少标准字段、状态码与错误类型不匹配、错误信息泄露内部细节 |
| **Rate Limiting & Pagination** | 新端点无限流、分页方式改变、页面大小/默认限制改变、缺少总数或下一页指示器 |
| **Documentation Drift** | OpenAPI未更新、README描述旧行为、示例请求/响应失效、新端点缺少文档 |
| **Backwards Compatibility** | 旧版本客户端是否兼容、移动应用无法强制更新、Webhook负载改变未通知、SDK需要更新 |

---

## 2. Data Migration Specialist

**触发条件：** `SCOPE_MIGRATIONS=true`

### 检查范围

| 类别 | 检查项 |
|------|--------|
| **Reversibility** | 能否无数据丢失回滚、是否有回滚迁移、 rollback是否真正撤销、rollback是否破坏当前代码 |
| **Data Loss Risk** | 删除仍有数据的列、改变截断数据的列类型、删除仍有代码引用的表、重命名列未更新所有引用、给有NULL值的列添加NOT NULL |
| **Lock Duration** | 大表ALTER TABLE未用CONCURRENTLY、添加索引未用CONCURRENTLY、多个可合并的ALTER、峰值时段schema变更 |
| **Backfill Strategy** | 新NOT NULL列无DEFAULT值、新列需要批量填充、缺少backfill脚本/任务、backfill一次更新所有行 |
| **Index Creation** | 生产表CREATE INDEX未用CONCURRENTLY、重复索引、新外键列缺少索引、可用部分索引却用全索引 |
| **Multi-Phase Safety** | 需与应用代码特定顺序部署的迁移、破坏当前运行代码的schema变更、假设部署边界的迁移、滚动部署期间混合新旧代码 |

---

## 3. Security Specialist

**触发条件：** `SCOPE_AUTH=true` 或 (`SCOPE_BACKEND=true` 且 diff > 100行)

### 检查范围

| 类别 | 检查项 |
|------|--------|
| **Input Validation at Trust Boundaries** | 用户输入未验证、查询参数直接用于DB/文件路径、请求体字段无类型检查/验证、上传文件无类型/大小/内容验证、Webhook负载无签名验证 |
| **Auth & Authorization Bypass** | 端点缺少认证中间件、授权检查默认allow而非deny、角色提升路径、越权访问(直接对象引用)、会话固定/劫持机会、Token/API key验证未检查过期 |
| **Injection Vectors** | 命令注入、模板注入、LDAP注入、SSRF、路径遍历、Header注入 |
| **Cryptographic Misuse** | 弱哈希算法、不可预测随机性、非常量时间比较、硬编码密钥/IV、密码哈希缺少salt |
| **Secrets Exposure** | 源码中的API key/token/password、日志中的secret、URL中的凭证、错误响应泄露敏感数据、明文存储PII |
| **XSS via Escape Hatches** | .html_safe, raw(), dangerouslySetInnerHTML, v-html, |safe, mark_safe() |
| **Deserialization** | 反序列化不可信数据、接受序列化对象无schema验证 |

---

## 4. Performance Specialist

**触发条件：** `SCOPE_BACKEND=true` 或 `SCOPE_FRONTEND=true`

### 检查范围

| 类别 | 检查项 |
|------|--------|
| **N+1 Queries** | 循环中遍历ORM关联未预加载、迭代中执行数据库查询、嵌套序列化触发懒加载、GraphQL逐字段查询 |
| **Missing Database Indexes** | WHERE子句列无索引、ORDER BY无索引、复合查询无复合索引、新外键列无索引 |
| **Algorithmic Complexity** | O(n²)或更差模式、重复线性搜索可哈希查找优化、循环中字符串拼接、重复排序/过滤 |
| **Bundle Size (Frontend)** | 已知重型依赖(moment.js, lodash full, jquery)、桶形导入、大静态资源未优化、缺少路由级代码分割 |
| **Rendering Performance (Frontend)** | Fetch瀑布流、不稳定引用导致不必要重渲染、缺少memo/useMemo/useCallback、布局抖动、缺少lazy loading |
| **Missing Pagination** | 列表端点无界返回结果、DB查询无LIMIT、响应嵌入完整嵌套对象 |
| **Blocking in Async Contexts** | 异步函数中同步I/O、事件循环处理器中sleep、CPU密集计算未offload主线程 |

---

## 5. Maintainability Specialist

**触发条件：** **始终启用**（每个review都检查）

### 检查范围

| 类别 | 检查项 |
|------|--------|
| **Dead Code & Unused Imports** | 赋值但未读取的变量、定义但未调用的函数、引用后不再使用的import、注释掉的代码块 |
| **Magic Numbers & String Coupling** | 裸数字字面量、作为查询过滤/条件的错误消息字符串、硬编码URL/端口/主机名、跨文件重复字面量 |
| **Stale Comments & Docstrings** | 代码改变后注释描述旧行为、引用已完成工作的TODO/FIXME、参数列表不匹配的docstring、ASCII图与代码流程不匹配 |
| **DRY Violations** | 3+行相似代码块重复、复制粘贴模式、测试文件中重复的配置/设置逻辑、可变成查找表/Map的条件链 |
| **Conditional Side Effects** | 分支条件遗漏副作用、日志消息声称的动作被条件跳过、状态转换一个分支更新相关记录而另一个不更新、只在成功路径触发的事件 |
| **Module Boundary Violations** | 访问另一个模块内部实现、controller/view直接DB查询应走service/model、通过接口通信的紧耦合 |

---

## 6. Testing Specialist

**触发条件：** **始终启用**（每个review都检查）

### 检查范围

| 类别 | 检查项 |
|------|--------|
| **Missing Negative-Path Tests** | 处理错误/拒绝/无效输入的新代码路径无对应测试、守卫子句无测试、try/catch错误分支无失败路径测试、权限/认证检查只测了"允许"未测"拒绝" |
| **Missing Edge-Case Coverage** | 边界值：零、负数、最大整数、空字符串、空数组、nil/null/undefined、单元素集合(循环中off-by-one)、Unicode和特殊字符、并发访问模式 |
| **Test Isolation Violations** | 测试共享可变状态(类变量、全局单例、未清理的DB记录)、顺序依赖测试、依赖系统时钟/时区/语言环境、真实网络调用未stub/mock |
| **Flaky Test Patterns** | 时序依赖断言(sleep, setTimeout, waitFor)、无序结果排序断言、依赖外部服务的测试、无种子控制的随机测试数据 |
| **Security Enforcement Tests Missing** | controller中auth/authz检查未测试"未授权"情况、限流逻辑未测试实际阻塞、输入清理未测试恶意输入、CSRF/CORS配置无集成测试 |
| **Coverage Gaps** | 新公共方法/函数零测试覆盖、现有测试只覆盖旧行为不覆盖新分支、从多处调用但只间接测试的工具函数 |

---

## 7. Red Team Specialist

**触发条件：** diff > 200行 **或** security specialist发现CRITICAL findings。**在其他专家之后运行**。

### 分析方法

这不是检查表审查，而是**对抗性分析**。

你的工作是找到其他专家**遗漏**的内容。像攻击者、混沌工程师、敌对QA测试员一样思考。

#### 1. 攻击 Happy Path
- 10倍正常负载时会发生什么？
- 两个请求同时命中同一资源会发生什么？
- 数据库慢(>5s查询时间)会发生什么？
- 外部服务返回垃圾数据会发生什么？

#### 2. 找到静默失败
- 吞掉异常的错误处理(catch-all只log)
- 可部分完成的操作(处理了5项中的3项然后崩溃)
- 留下不一致状态的状态转换
- 失败不提醒的后台任务

#### 3. 利用信任假设
- 前端验证但后端不验证
- 内部API调用无认证("只有我们的代码调用它")
- 假设存在但未验证的配置值
- 从用户输入构建文件路径/URL未清理

#### 4. 破坏边界情况
- 最大可能输入大小会发生什么？
- 零项、空字符串、null值会发生什么？
- 首次运行(无现有数据)会发生什么？
- 用户100ms内点击两次会发生什么？

#### 5. 找到其他专家遗漏的内容
- 审查每个专家的发现。他们的类别之间有什么差距？
- 寻找跨类别问题(如既是性能问题也是安全问题的)
- 寻找集成边界上的问题(两个系统交汇处)
- 寻找只在特定部署配置中显现的问题

---

## 专家组合策略

### 小改动 (<50行)
- **始终启用：** maintainability + testing
- **按需：** api-contract (如涉及API), performance (如涉及查询)

### 中等改动 (50-200行)
- **始终启用：** maintainability + testing + performance
- **按需：** api-contract, data-migration, security

### 大改动 (>200行)
- **始终启用：** 所有专家
- **最后运行：** red-team (综合所有其他专家发现)

---

## 输出示例

```json
{"severity":"CRITICAL","confidence":9,"path":"auth/login.ts","line":45,"category":"security","summary":"Missing rate limiting on login endpoint allows brute force","fix":"Add rate limit middleware: 5 attempts per minute per IP","fingerprint":"auth/login.ts:45:security","specialist":"security"}

{"severity":"INFORMATIONAL","confidence":7,"path":"utils/parser.ts","line":23,"category":"maintainability","summary":"Magic number 100 used as max retry count","fix":"Extract to named constant MAX_RETRIES","fingerprint":"utils/parser.ts:23:maintainability","specialist":"maintainability"}
```
