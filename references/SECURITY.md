# 安全编码规范

> 本规范整合自 OWASP Top 10 2023、NIST guidelines 和行业最佳实践。所有 Phase 涉及安全相关内容时必须遵循。

---

## 目录

1. [密钥管理](#1-密钥管理)
2. [输入验证](#2-输入验证)
3. [认证与授权](#3-认证与授权)
4. [SQL注入防护](#4-sql注入防护)
5. [XSS防护](#5-xss防护)
6. [CSRF防护](#6-csrf防护)
7. [安全工具](#7-安全工具)

---

## 1. 密钥管理

### 最高优先级：永不硬编码

#### ❌ 绝对禁止

```javascript
// Hardcode 密钥 - 零容忍！
const GOOGLE_CLIENT_SECRET = "GOCSPX-abc123...";
const NOTION_TOKEN = "secret_xxx";
const DB_PASSWORD = "password123";
const API_KEY = "sk-live-xxxxx";
```

#### ✅ 正确做法

```javascript
// 从环境变量读取
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_PASSWORD = process.env.DB_PASSWORD;

// 启动时检查（生产环境必须）
if (!GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
}
```

### 配置文件规范

**.env** (必须加入 .gitignore):

```bash
# API Keys
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=notion_secret_xxx

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Secrets
JWT_SECRET=your_jwt_secret_min_32_chars
SESSION_SECRET=your_session_secret
```

**.gitignore** (必须包含):

```gitignore
# 环境变量文件
.env
.env.local
.env.production
.env.*.local

# 密钥文件
*.pem
*.key
credentials.json
service-account.json
```

### 生产环境

| 环境 | 密钥存储方案 |
|------|-------------|
| AWS | AWS Secrets Manager / Parameter Store |
| GCP | Secret Manager |
| Azure | Azure Key Vault |
| 自托管 | HashiCorp Vault |
| 本地开发 | .env 文件（不提交）|

---

## 2. 输入验证

### 原则：永远不要信任用户输入

#### 所有输入必须验证

```javascript
// ❌ 危险：直接使用用户输入
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ 安全：验证 + 参数化
const userId = parseInt(userIdStr, 10);
if (isNaN(userId) || userId < 1) {
  throw new ValidationError('Invalid user ID');
}
const query = 'SELECT * FROM users WHERE id = $1';
```

### 验证函数模板

```javascript
// 字符串验证
function sanitizeString(input, maxLength = 255) {
  if (typeof input !== 'string') throw new ValidationError('Must be string');
  return input.trim().slice(0, maxLength);
}

// 邮箱验证
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) throw new ValidationError('Invalid email');
  return email.toLowerCase().trim();
}

// URL验证
function validateUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new ValidationError('URL must use HTTP or HTTPS');
    }
    return parsed.toString();
  } catch {
    throw new ValidationError('Invalid URL');
  }
}

// 数字范围验证
function validateNumber(num, min, max) {
  const n = Number(num);
  if (isNaN(n)) throw new ValidationError('Must be a number');
  if (n < min || n > max) throw new ValidationError(`Must be between ${min} and ${max}`);
  return n;
}
```

### API 输入验证清单

| 端点类型 | 必须验证 |
|---------|---------|
| GET | URL参数格式、范围 |
| POST | Body字段类型、长度、格式 |
| PUT/PATCH | Body字段类型、长度、格式 |
| DELETE | 资源是否存在、权限 |
| 文件上传 | 文件类型、大小、MIME |

---

## 3. 认证与授权

### JWT Token 安全

```javascript
// ❌ 危险：存储在 localStorage
localStorage.setItem('jwt_token', token);

// ✅ 安全：HttpOnly Cookie
res.cookie('jwt_token', token, {
  httpOnly: true,    // 禁止 JavaScript 访问
  secure: true,      // 仅 HTTPS
  sameSite: 'strict', // CSRF 防护
  maxAge: 3600000    // 1小时过期
});
```

### 会话管理

```javascript
// 会话超时
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟

// 定期刷新 token
setInterval(async () => {
  if (isAuthenticated()) {
    await refreshToken();
  }
}, 15 * 60 * 1000); // 每15分钟
```

### 权限控制

```javascript
// 角色定义
const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

// 权限检查
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// 使用
app.delete('/api/users/:id', 
  requirePermission('users:delete'),
  deleteUser
);
```

---

## 4. SQL注入防护

### 参数化查询是唯一选择

```javascript
// ❌ 危险：字符串拼接
const query = `SELECT * FROM users WHERE name = '${name}'`;

// ✅ 安全：参数化查询
const query = 'SELECT * FROM users WHERE name = $1';
const result = await pool.query(query, [name]);
```

### ORM 使用规范

```javascript
// ✅ Prisma (推荐)
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// ✅ Sequelize
const user = await User.findOne({
  where: { id: userId }
});

// ❌ 危险：裸 SQL 字符串
const user = await sequelize.query(
  `SELECT * FROM users WHERE id = ${userId}`
);
```

### NoSQL 注入防护

```javascript
// MongoDB
// ❌ 危险：直接使用用户输入作为查询键
const query = { [userInput]: value }; // 用户可以注入 $where, $gt 等

// ✅ 安全：白名单字段
const allowedFields = ['username', 'email', 'createdAt'];
if (!allowedFields.includes(field)) {
  throw new ValidationError('Invalid field');
}
const query = { [field]: value };
```

---

## 5. XSS防护

### 输出编码

```javascript
// ❌ 危险：直接渲染
element.innerHTML = userInput;

// ✅ 安全：使用 textContent
element.textContent = userInput;

// React (自动转义，但需注意 dangerouslySetInnerHTML)
return <div>{userInput}</div>; // ✅ 安全
return <div dangerouslySetInnerHTML={{ __html: userInput }} />; // ❌ 危险
```

### HTML 净化

```javascript
// 使用 DOMPurify
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href', 'title'],
  // 必须指定协议
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
});
```

### CSP Header

```javascript
// Express
import helmet from 'helmet';

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'strict-dynamic'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // 仅开发环境
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.example.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
}));
```

---

## 6. CSRF防护

### Token 验证

```javascript
// 生成 CSRF Token
const csrfToken = crypto.randomBytes(32).toString('hex');

// 存储在 session 或 Cookie
session.csrfToken = csrfToken;

// 验证请求
function validateCsrf(req, res, next) {
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
}
```

### SameSite Cookie

```javascript
res.cookie('session_id', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' // Lax | Strict
});
```

### CORS 配置

```javascript
// Express CORS
import cors from 'cors';

const corsOptions = {
  origin: function (origin, callback) {
    // 白名单
    const whitelist = ['https://example.com', 'http://localhost:3000'];
    if (whitelist.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
```

---

## 7. 安全工具

### 开发阶段集成

| 工具 | 用途 | 命令 |
|------|------|------|
| **eslint-plugin-security** | 静态代码分析 | `npm install --save-dev eslint-plugin-security` |
| **snyk** | 依赖漏洞扫描 | `snyk test` |
| **npm audit** | NPM 包安全检查 | `npm audit` |
| **OWASP ZAP** | 动态安全测试 | `docker run -t owasp/zap2docker-stable zap-baseline.py -t https://example.com` |

### Git Hooks

```javascript
// pre-commit 检查
// .husky/pre-commit
#!/bin/sh
npm audit --production --audit-level=high
npx eslint src/**/*.js --max-warnings=0
```

### 依赖更新

```bash
# 定期更新依赖
npm outdated
npm update

# 检查漏洞
npm audit fix
snyk monitor
```

---

## Phase 6 安全审查清单

Security Auditor 在 Phase 6 必须检查：

```markdown
## 安全审计项

### 密钥管理
- [ ] 无 hardcode 密钥
- [ ] .env 在 .gitignore 中
- [ ] 环境变量正确使用
- [ ] 生产环境使用 Secrets Manager

### 输入验证
- [ ] 所有 API 端点有输入验证
- [ ] 使用参数化查询
- [ ] XSS 防护到位
- [ ] 文件上传类型/大小限制

### 认证授权
- [ ] JWT 使用 HttpOnly Cookie
- [ ] Token 刷新机制
- [ ] Session 超时设置
- [ ] 权限控制严格

### 数据安全
- [ ] 敏感数据加密存储
- [ ] 日志不记录敏感信息
- [ ] HTTPS 强制
- [ ] CORS 配置严格
```

---

## 常见安全陷阱

| 陷阱 | 错误做法 | 正确做法 |
|------|---------|---------|
| 密钥硬编码 | `const key = "xxx"` | `process.env.KEY` |
| SQL 拼接 | `` `${id}` `` | `'$1', [id]` |
| XSS | `innerHTML = input` | `textContent = input` |
| JWT 存储 | `localStorage` | `HttpOnly Cookie` |
| CORS | `origin: *` | 白名单域名 |
| 文件上传 | 无限制 | 类型/大小/MIME 验证 |
