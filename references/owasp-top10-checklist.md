# OWASP Top 10 安全检查清单

> ForgeOS Phase 6 安全审查专用检查清单。
> 基于 OWASP Top 10 (2021) 标准，逐项检查。
> 来源: gstack /cso + INTEGRATION-PLAN P1-3。

---

## A01: Broken Access Control — 访问控制失效

- [ ] 所有 API 端点有权限检查（认证 + 授权）
- [ ] 用户只能访问自己的资源（水平越权防护）
- [ ] 普通用户无法访问管理功能（垂直越权防护）
- [ ] CORS 配置正确，未使用 `Access-Control-Allow-Origin: *`
- [ ] API 路径不暴露内部 ID（使用 UUID 或间接引用）
- [ ] 删除操作有二次确认
- [ ] 速率限制已配置
- 发现: <自动填充>

---

## A02: Cryptographic Failures — 加密失效

- [ ] 敏感数据传输使用 HTTPS（无 HTTP 混合）
- [ ] 密码使用 bcrypt/argon2 哈希（非 MD5/SHA1）
- [ ] JWT 密钥强度 ≥ 256 位
- [ ] 敏感数据加密存储（PII、金融数据、健康数据）
- [ ] 不在 URL 中传递敏感参数
- [ ] 加密算法使用当前推荐（非 DES/3DES/RC4）
- [ ] TLS 版本 ≥ 1.2
- 发现: <自动填充>

---

## A03: Injection — 注入

- [ ] 所有数据库查询使用参数化查询（非字符串拼接）
- [ ] 用户输入经过验证和清理
- [ ] ORM/查询构建器正确使用
- [ ] HTML 输出经过转义（XSS 防护）
- [ ] SQL 查询无动态表名/列名拼接
- [ ] 命令执行无用户输入拼接
- [ ] 文件路径无目录遍历漏洞
- 发现: <自动填充>

---

## A04: Insecure Design — 不安全设计

- [ ] 威胁建模已完成（参见 STRIDE 分析）
- [ ] 安全需求和用户故事已定义
- [ ] 限流和降级策略已设计
- [ ] 失败安全（fail-secure）模式已实现
- [ ] 业务逻辑限制已实现（如转账金额上限）
- [ ] 多步骤操作有防重放保护
- 发现: <自动填充>

---

## A05: Security Misconfiguration — 安全配置错误

- [ ] 默认密码已修改
- [ ] 不必要的功能/端口已关闭
- [ ] 错误信息不泄露内部细节（堆栈跟踪、SQL 语句）
- [ ] 安全头已配置（CSP, X-Frame-Options, HSTS）
- [ ] 目录列表已禁用
- [ ] 云存储权限最小化
- [ ] 开发环境与生产环境隔离
- 发现: <自动填充>

---

## A06: Vulnerable and Outdated Components — 易受攻击和过时的组件

- [ ] 依赖版本无已知 CVE 漏洞
- [ ] 定期运行 `npm audit` / `pip audit` / `cargo audit`
- [ ] 不使用已弃用的库/框架版本
- [ ] 依赖锁定文件存在（package-lock.json / poetry.lock）
- [ ] 容器镜像使用官方基础镜像 + 最新补丁
- 发现: <自动填充>

---

## A07: Identification and Authentication Failures — 身份识别和认证失败

- [ ] 密码策略合理（长度 ≥ 8，复杂度要求）
- [ ] 暴力破解防护已实现（锁定/延迟/CAPTCHA）
- [ ] 会话管理安全（HttpOnly, Secure, SameSite Cookie）
- [ ] 会话过期和注销正确实现
- [ ] 多因素认证（MFA）已支持或可扩展
- [ ] OAuth/OIDC 集成安全（state 参数, PKCE）
- 发现: <自动填充>

---

## A08: Software and Data Integrity Failures — 软件和数据完整性失败

- [ ] CI/CD 管道有完整性校验
- [ ] 第三方 CDN 资源使用 SRI (Subresource Integrity)
- [ ] 自动更新有签名验证
- [ ] 反序列化安全（类型白名单）
- [ ] 数据库迁移有完整性检查
- 发现: <自动填充>

---

## A09: Security Logging and Monitoring Failures — 安全日志和监控失败

- [ ] 所有认证事件已记录（成功 + 失败）
- [ ] 所有访问控制失败已记录
- [ ] 敏感操作已审计（创建/修改/删除）
- [ ] 日志不包含敏感数据（密码/Token）
- [ ] 日志集中存储且不可篡改
- [ ] 异常行为告警已配置
- 发现: <自动填充>

---

## A10: Server-Side Request Forgery (SSRF) — 服务端请求伪造

- [ ] URL 输入经过白名单验证
- [ ] 不允许请求内部网络地址（10.x, 172.16-31.x, 192.168.x）
- [ ] 外部请求使用专用出口（非内网通道）
- [ ] 重定向限制（不跟随用户控制的 302）
- [ ] 云元数据端点不可访问（169.254.169.254）
- 发现: <自动填充>

---

## 检查结果汇总模板

```markdown
# OWASP Top 10 检查结果

**项目**: {project_name}
**日期**: {YYYY-MM-DD}
**审查者**: {security-reviewer}

## 通过率

| 项 | 通过 | 未通过 | 不适用 | 通过率 |
|----|------|--------|--------|--------|
| A01 | {n} | {n} | {n} | {percent}% |
| A02 | {n} | {n} | {n} | {percent}% |
| ... | ... | ... | ... | ... |
| **总计** | **{n}** | **{n}** | **{n}** | **{percent}%** |

## 高风险发现

| # | OWASP 项 | 发现 | 严重度 | 建议 |
|---|---------|------|--------|------|
| 1 | A03 | SQL 拼接在 user-search.ts:42 | CRITICAL | 改用参数化查询 |
| 2 | A07 | 无暴力破解防护 | HIGH | 添加速率限制 |

## 低风险发现

| # | OWASP 项 | 发现 | 严重度 | 建议 |
|---|---------|------|--------|------|
| 1 | A05 | 缺少 CSP 头 | MEDIUM | 添加 Content-Security-Policy |
```
