# 03a-implementation-plan

- **Req ID**: <id>
- **关联**: `@.devflow-kit/<id>/03-tasks.md`、`@.devflow-kit/<id>/02-design.md`、`@.devflow-kit/CONTEXT.md`
- **作者**: AI（Tech Lead 角色）+ 人工 review
- **用途**: 在任务拆分后、开发前，提供完整的技术实施方案
- **触发条件**: Standard/Strict 模式，或用户明确要求"详细设计"
- **保存位置**: `.devflow-kit/<req-id>/03a-implementation-plan.md`
- **核心原则**: 先设计后编码，所有技术决策在写代码前确认

---

## 一、整体架构设计

### 1.1 技术方案概述

**核心思路**：用 200-300 字描述整体技术实现方案

**技术选型**：
- 前端框架：React/Vue/Angular（如适用）
- 后端框架：Spring Boot/Express/FastAPI（如适用）
- 数据库：PostgreSQL/MySQL/MongoDB（如适用）
- 中间件：Redis/RabbitMQ/Elasticsearch（如适用）

**架构决策**：
- 决策1：xxx（理由：xxx）
- 决策2：xxx（理由：xxx）

### 1.2 系统调用链路

**主流程调用链**：
```
客户端 → API Gateway → Controller → Service → Repository → Database
                                    ↓
                                  Redis (缓存)
                                    ↓
                                 RabbitMQ (异步)
```

**关键路径说明**：
1. 步骤1：xxx
2. 步骤2：xxx
3. 步骤3：xxx

**异常处理策略**：
- 场景1：xxx → 降级方案：xxx
- 场景2：xxx → 降级方案：xxx

### 1.3 API 接口设计（如涉及）

#### 接口清单

| 方法 | 路径 | 说明 | 权限 | 优先级 |
|---|------|---|------|---|
| POST | `/api/xxx` | 创建资源 | Authenticated | P0 |
| GET | `/api/xxx/:id` | 查询详情 | Authenticated | P0 |
| PUT | `/api/xxx/:id` | 更新资源 | Owner | P1 |
| DELETE | `/api/xxx/:id` | 删除资源 | Admin | P2 |

#### 接口详情示例

**POST /api/notifications**

**请求头**：
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "userId": "uuid-string",
  "title": "通知标题",
  "content": "通知内容",
  "type": "info|warning|error",
  "channels": ["inapp", "email", "push"]
}
```

**成功响应（201 Created）**：
```json
{
  "code": 200,
  "data": {
    "id": "uuid-string",
    "userId": "uuid-string",
    "title": "通知标题",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "创建成功"
}
```

**错误响应（400 Bad Request）**：
```json
{
  "code": 400,
  "error": "VALIDATION_ERROR",
  "message": "参数验证失败",
  "details": [
    { "field": "userId", "issue": "必填字段" },
    { "field": "title", "issue": "最大长度255字符" }
  ]
}
```

**业务规则**：
- 速率限制：每用户每分钟最多 10 次请求
- 幂等性：支持重试，相同 request_id 不重复创建
- 权限控制：只能为自己创建通知

---

## 二、数据层设计

### 2.1 数据库表结构变更

#### DDL（表结构定义）

```sql
-- 新增表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 索引
  CONSTRAINT idx_notifications_user_created 
    UNIQUE (user_id, created_at DESC)
);

-- 索引优化
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
```

#### DML（数据迁移）

```sql
-- 历史数据迁移（如需要）
INSERT INTO notifications (user_id, title, content, created_at)
SELECT id, 'Welcome', 'Welcome to the platform', NOW()
FROM users
WHERE created_at > '2024-01-01';

-- 数据清洗（如需要）
UPDATE notifications 
SET type = 'info' 
WHERE type IS NULL;
```

### 2.2 ORM 模型定义

```typescript
// Prisma schema 示例
model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String   @db.VarChar(255)
  content   String?
  type      String   @db.VarChar(20)
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([type])
  @@index([isRead], map: "idx_unread")
  @@map("notifications")
}
```

### 2.3 缓存策略

**缓存设计**：
- 缓存内容：用户未读通知列表
- 缓存键：`notif:unread:{userId}`
- TTL：300 秒
- 更新策略：写穿透（Write-through）+ 失效策略

**缓存伪代码**：
```typescript
async function getUnreadNotifications(userId: string) {
  const cacheKey = `notif:unread:${userId}`;
  
  // 1. 尝试从缓存读取
  let notifications = await redis.get(cacheKey);
  if (notifications) {
    return JSON.parse(notifications);
  }
  
  // 2. 缓存未命中，查数据库
  notifications = await db.notifications.findMany({
    where: { userId, isRead: false }
  });
  
  // 3. 写入缓存
  await redis.setex(cacheKey, 300, JSON.stringify(notifications));
  
  return notifications;
}
```

### 2.4 消息队列设计（如适用）

**队列配置**：
- 队列名称：`notifications.email`
- 消息格式：JSON
- 重试策略：最多 3 次，指数退避（1s, 5s, 30s）
- 死信队列：`notifications.email.dlx`

**消息体示例**：
```json
{
  "messageId": "uuid",
  "userId": "uuid",
  "notificationId": "uuid",
  "channel": "email",
  "payload": {
    "subject": "新通知",
    "body": "您有一条新消息"
  },
  "retryCount": 0,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 三、中间件与外部依赖

### 3.1 第三方服务集成

| 服务 | 用途 | SDK/库 | 配置项 | 容错策略 |
|---|------|---|--------|---|
| Redis | 缓存 | ioredis | `REDIS_URL` | 降级为直连数据库 |
| RabbitMQ | 异步消息 | amqplib | `AMQP_URL` | 消息持久化 + 本地队列缓冲 |
| SendGrid | 邮件发送 | @sendgrid/mail | `SENDGRID_API_KEY` | 失败重试 3 次 + 记录日志 |
| Elasticsearch | 全文搜索 | @elastic/elasticsearch | `ES_HOST` | 降级为数据库 LIKE 查询 |

### 3.2 环境变量配置

**新增环境变量**：

| 变量名 | 类型 | 必填 | 默认值 | 说明 | 示例 |
|---|------|---|--------|---|------|
| `REDIS_URL` | string | 是 | - | Redis 连接字符串 | `redis://localhost:6379` |
| `CACHE_TTL` | number | 否 | 300 | 缓存过期时间（秒） | `300` |
| `AMQP_URL` | string | 条件 | - | RabbitMQ 连接 | `amqp://localhost:5672` |
| `SENDGRID_API_KEY` | string | 条件 | - | 邮件服务密钥 | `SG.xxx` |
| `ES_HOST` | string | 条件 | - | ES 地址 | `http://localhost:9200` |

### 3.3 配置文件变更

**`.env.example` 追加**：
```bash
# === Notification Service ===
REDIS_URL=redis://localhost:6379
CACHE_TTL=300
AMQP_URL=amqp://localhost:5672
QUEUE_NAME=notifications
SENDGRID_API_KEY=sg.xxx
ES_HOST=http://localhost:9200
```

**`config/default.json` 追加**：
```json
{
  "notification": {
    "cache": {
      "ttl": 300,
      "prefix": "notif:"
    },
    "queue": {
      "name": "notifications",
      "prefetch": 10,
      "retryAttempts": 3,
      "backoffMultiplier": 5
    },
    "email": {
      "enabled": true,
      "provider": "sendgrid",
      "from": "noreply@example.com",
      "templateId": "d-xxx"
    }
  }
}
```

### 3.4 基础设施变更

**Docker Compose 新增服务**：
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
  
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: secret
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

volumes:
  redis-data:
  rabbitmq-data:
```

---

## 四、任务详细实施计划

### 任务 T01：<任务名称>

**目标**：用一句话说明本任务要完成什么

**前置依赖**：无 / T00 / T0X

#### 4.1.1 文件修改清单

| 文件路径 | 操作 | 说明 | 预估行数 |
|---|------|---|----------|
| `src/services/notification.service.ts` | 新增 | 核心业务逻辑 | ~150 |
| `src/controllers/notification.controller.ts` | 新增 | API 路由处理 | ~80 |
| `src/models/notification.model.ts` | 新增 | 数据模型定义 | ~50 |
| `src/__tests__/notification.test.ts` | 新增 | 单元测试 | ~100 |
| `.env.example` | 修改 | 添加环境变量 | +5 |

#### 4.1.2 核心实现逻辑

**类/函数签名**：
```typescript
interface CreateNotificationDTO {
  userId: string;
  title: string;
  content?: string;
  type: 'info' | 'warning' | 'error';
  channels?: Array<'inapp' | 'email' | 'push'>;
}

class NotificationService {
  async createNotification(dto: CreateNotificationDTO): Promise<Notification>;
  async getUnreadNotifications(userId: string): Promise<Notification[]>;
  async markAsRead(notificationId: string): Promise<void>;
}
```

**关键算法伪代码**：
```typescript
async function createNotification(dto: CreateNotificationDTO) {
  // 1. 参数验证
  validateDTO(dto);
  
  // 2. 业务校验
  await validateUserExists(dto.userId);
  
  // 3. 创建通知记录（事务）
  const notification = await db.transaction(async (tx) => {
    const record = await tx.notifications.create({ data: dto });
    
    // 4. 清除缓存
    await redis.del(`notif:unread:${dto.userId}`);
    
    // 5. 发布异步事件
    await queue.publish('notification.created', {
      notificationId: record.id,
      channels: dto.channels || ['inapp']
    });
    
    return record;
  });
  
  return notification;
}
```

**边界条件处理**：
- 用户不存在 → 抛出 `UserNotFoundException`
- 渠道为空 → 默认为 `['inapp']`
- 标题超过 255 字符 → 截断并记录警告日志

#### 4.1.3 单元测试要点

**测试用例清单**：
- ⏳ 正常创建通知（含所有字段）
- ⏳ 创建通知时缺少必填字段 → 抛出验证错误
- ⏳ 用户不存在时 → 抛出 `UserNotFoundException`
- ⏳ 并发创建通知 → 保证数据一致性
- ⏳ 缓存命中场景 → 不查数据库
- ⏳ 缓存未命中场景 → 查库并写缓存

**Mock 策略**：
- Mock `db.notifications.create` → 返回模拟数据
- Mock `redis.del` → 验证是否被调用
- Mock `queue.publish` → 验证消息格式

#### 4.1.4 验收标准

**功能验收**：
- ⏳ API 返回 201 状态码
- ⏳ 数据库正确插入记录
- ⏳ Redis 缓存被清除
- ⏳ 消息队列收到消息

**性能验收**：
- ⏳ P95 响应时间 < 200ms
- ⏳ 单次请求数据库查询 ≤ 3 次

**代码质量**：
- ⏳ 单元测试覆盖率 ≥ 80%
- ⏳ ESLint 无错误
- ⏳ TypeScript 类型检查通过

---

### 任务 T02：<任务名称>

> 按 T01 的格式继续，每个任务一个完整章节

---

## 五、风险与应对

### 5.1 技术风险

| 风险项 | 概率 | 影响 | 等级 | 缓解措施 |
|---|------|---|------|---|
| Redis 不可用导致性能下降 | 中 | 高 | 🟡 | 降级为直连数据库，增加监控告警 |
| 消息队列积压 | 低 | 高 | 🟡 | 设置队列长度告警，自动扩容消费者 |
| 数据库死锁 | 低 | 高 | 🔴 | 使用乐观锁，增加重试机制 |
| 第三方 API 限流 | 中 | 中 | 🟡 | 实现令牌桶限流，本地队列缓冲 |

### 5.2 兼容性风险

- **向后兼容**：新增字段有默认值，不影响现有代码
- **向前兼容**：旧版客户端访问新 API 返回友好错误
- **数据迁移**：提供回滚脚本，迁移前全量备份

### 5.3 回归测试清单

- ⏳ 核心功能 AC-1 至 AC-N 全部通过
- ⏳ 相关模块的现有测试无退化
- ⏳ 性能基准测试通过（对比基线）
- ⏳ 无障碍测试通过（前端项目，WCAG 2.1 AA）
- ⏳ 跨浏览器兼容测试（Chrome/Firefox/Safari/Edge）
- ⏳ 移动端响应式测试（iOS/Android）

---

## 六、部署与回滚

### 6.1 部署步骤

1. **准备阶段**：
   - ⏳ 备份数据库：`pg_dump -U postgres dbname > backup_$(date +%Y%m%d).sql`
   - ⏳ 检查环境变量已配置
   - ⏳ 确认依赖服务可用（Redis/RabbitMQ/ES）

2. **数据库迁移**：
   ```bash
   npx prisma migrate deploy
   npx prisma db seed  # 如需要
   ```

3. **应用部署**：
   ```bash
   # 蓝绿部署示例
   kubectl set image deployment/app app=new-image:tag
   kubectl rollout status deployment/app
   ```

4. **验证阶段**：
   - ⏳ 健康检查通过：`curl http://localhost:3000/health`
   - ⏳ 冒烟测试通过（核心功能快速验证）
   - ⏳ 监控指标正常（错误率 < 1%，P95 < 500ms）

### 6.2 回滚方案

**触发条件**：
- 错误率 > 5%
- P95 响应时间 > 2s
- 核心功能不可用

**回滚步骤**：
```bash
# 1. 切换回旧版本
kubectl rollout undo deployment/app

# 2. 回滚数据库（如需要）
psql -U postgres dbname < backup_20260115.sql

# 3. 清理新数据（如需要）
DELETE FROM notifications WHERE created_at > '2026-01-15';
```

**预计回滚时间**：5-10 分钟

---

## 七、后续优化建议

**性能优化**：
- 考虑引入 CDN 加速静态资源
- 数据库读写分离（读多写少场景）
- 热点数据预加载

**代码优化**：
- 提取公共工具函数到 `src/utils/`
- 考虑使用设计模式优化复杂逻辑（策略模式/工厂模式）

**监控告警**：
- 新增业务指标：通知发送成功率、队列积压数
- 设置告警阈值：错误率 > 1%、P95 > 500ms

---

## 使用说明

1. **何时填写**：在 `03-tasks.md` 完成后、`4-dev` 开始前
2. **谁来填写**：AI 自动生成初稿，技术负责人 review 确认
3. **如何使用**：
   - 开发人员严格按"任务详细实施计划"编码
   - Code Review 时对照"验收标准"检查
   - 测试人员参考"回归测试清单"
4. **如何更新**：开发过程中发现设计问题，立即暂停并更新本计划
