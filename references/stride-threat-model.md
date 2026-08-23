# STRIDE 威胁建模模板

> ForgeOS Phase 6 安全审查专用威胁建模模板。
> 基于 Microsoft STRIDE 框架，对系统数据流进行威胁分析。
> 来源: gstack /cso + INTEGRATION-PLAN P1-3。

---

## 1. 数据流图 (DFD)

```markdown
## 系统数据流图

### 外部实体

| 实体 | 描述 | 信任边界 |
|------|------|---------|
| User | 终端用户 | 外部 |
| Admin | 管理员 | 外部 |
| Third-party API | 外部服务 | 外部 |

### 处理过程

| 过程 | 描述 | 所在层 |
|------|------|--------|
| Auth Service | 认证服务 | 应用层 |
| API Gateway | API 网关 | 应用层 |
| Business Logic | 业务逻辑 | 应用层 |
| Data Access | 数据访问 | 数据层 |

### 数据存储

| 存储 | 描述 | 类型 |
|------|------|------|
| User DB | 用户数据库 | PostgreSQL |
| Cache | 缓存 | Redis |
| File Store | 文件存储 | S3 |

### 数据流

| # | 从 | 到 | 数据 | 协议 |
|---|-----|----|------|------|
| 1 | User | API Gateway | HTTP 请求 | HTTPS |
| 2 | API Gateway | Auth Service | 认证请求 | 内部 HTTP |
| 3 | Auth Service | User DB | 查询/写入 | SQL |
| 4 | API Gateway | Business Logic | 业务请求 | 内部 HTTP |
| 5 | Business Logic | User DB | CRUD | SQL |
| 6 | Business Logic | Cache | 读写 | Redis 协议 |
```

---

## 2. STRIDE 威胁分析

### S — Spoofing (欺骗)

> 冒充其他用户或系统身份

| # | 组件 | 威胁描述 | 影响 | 缓解措施 | 状态 |
|---|------|---------|------|---------|------|
| S1 | User → API Gateway | 攻击者伪造身份发送请求 | 高 | JWT 签名验证 + HTTPS | ✅ |
| S2 | Third-party API → Business Logic | 伪造回调通知 | 中 | Webhook 签名验证 | ⚠️ |
| S3 | Internal Service | 内部服务被冒充 | 高 | mTLS + 服务网格 | ❌ |

### T — Tampering (篡改)

> 未经授权修改数据

| # | 组件 | 威胁描述 | 影响 | 缓解措施 | 状态 |
|---|------|---------|------|---------|------|
| T1 | API Gateway → Business Logic | 请求参数被篡改 | 高 | 输入验证 + 签名 | ✅ |
| T2 | Business Logic → User DB | SQL 注入修改数据 | 高 | 参数化查询 + ORM | ✅ |
| T3 | User DB | 数据库被直接修改 | 高 | 访问控制 + 审计日志 | ⚠️ |
| T4 | Cache | 缓存数据被篡改 | 中 | Redis AUTH + 加密 | ✅ |

### R — Repudiation (抵赖)

> 否认执行了某个操作

| # | 组件 | 威胁描述 | 影响 | 缓解措施 | 状态 |
|---|------|---------|------|---------|------|
| R1 | User 操作 | 用户否认执行了敏感操作 | 中 | 不可篡改审计日志 | ❌ |
| R2 | Admin 操作 | 管理员否认修改了配置 | 高 | 管理操作审计 | ⚠️ |
| R3 | API 调用 | 第三方否认发送了请求 | 中 | 请求签名 + 日志 | ❌ |

### I — Information Disclosure (信息泄露)

> 未经授权访问数据

| # | 组件 | 威胁描述 | 影响 | 缓解措施 | 状态 |
|---|------|---------|------|---------|------|
| I1 | API Response | 响应包含敏感字段 | 高 | 字段过滤 + 序列化控制 | ✅ |
| I2 | User DB | 数据库被未授权查询 | 高 | 加密存储 + 访问控制 | ✅ |
| I3 | Error Message | 错误信息泄露内部细节 | 中 | 统一错误格式 | ⚠️ |
| I4 | Log | 日志包含敏感数据 | 高 | 日志脱敏 + 隐私过滤 | ❌ |
| I5 | Network | 网络传输被窃听 | 高 | HTTPS + TLS 1.3 | ✅ |

### D — Denial of Service (拒绝服务)

> 使系统或服务不可用

| # | 组件 | 威胁描述 | 影响 | 缓解措施 | 状态 |
|---|------|---------|------|---------|------|
| D1 | API Gateway | 大量请求耗尽资源 | 高 | 速率限制 + CDN | ⚠️ |
| D2 | Business Logic | 复杂查询耗尽 CPU | 中 | 查询超时 + 资源限制 | ✅ |
| D3 | User DB | 大量查询导致锁等待 | 中 | 连接池 + 读写分离 | ⚠️ |
| D4 | File Store | 大文件上传耗尽存储 | 中 | 文件大小限制 + 配额 | ✅ |

### E — Elevation of Privilege (权限提升)

> 获取超出授权范围的权限

| # | 组件 | 威胁描述 | 影响 | 缓解措施 | 状态 |
|---|------|---------|------|---------|------|
| E1 | User → Admin | 普通用户获取管理员权限 | 高 | RBAC + 最小权限 | ✅ |
| E2 | Horizontal | 用户 A 访问用户 B 的数据 | 高 | 资源所有权检查 | ✅ |
| E3 | API Key | 泄露的 API Key 被滥用 | 高 | Key 轮换 + 权限最小化 | ⚠️ |
| E4 | Container | 容器逃逸获取宿主权限 | 高 | 容器隔离 + 非 root 运行 | ✅ |

---

## 3. 威胁汇总

### 按状态统计

| 状态 | 数量 | 说明 |
|------|------|------|
| ✅ 已缓解 | {count} | 已实施有效缓解措施 |
| ⚠️ 部分缓解 | {count} | 有措施但不完善，需加强 |
| ❌ 未缓解 | {count} | 无缓解措施，需优先处理 |

### 按影响统计

| 影响 | 数量 | 威胁 ID |
|------|------|--------|
| 高 | {count} | {threat_ids} |
| 中 | {count} | {threat_ids} |
| 低 | {count} | {threat_ids} |

### 按类别统计

| STRIDE 类别 | 数量 | 最严重威胁 |
|------------|------|-----------|
| S (Spoofing) | {count} | {worst_threat} |
| T (Tampering) | {count} | {worst_threat} |
| R (Repudiation) | {count} | {worst_threat} |
| I (Information Disclosure) | {count} | {worst_threat} |
| D (Denial of Service) | {count} | {worst_threat} |
| E (Elevation of Privilege) | {count} | {worst_threat} |

---

## 4. 优先修复建议

### P0 (立即修复)

| 威胁 ID | 描述 | 建议修复 |
|---------|------|---------|
| {id} | {description} | {fix_suggestion} |

### P1 (本周修复)

| 威胁 ID | 描述 | 建议修复 |
|---------|------|---------|
| {id} | {description} | {fix_suggestion} |

### P2 (下个迭代)

| 威胁 ID | 描述 | 建议修复 |
|---------|------|---------|
| {id} | {description} | {fix_suggestion} |
