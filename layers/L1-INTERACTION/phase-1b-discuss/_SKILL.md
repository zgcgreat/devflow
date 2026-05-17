# Phase 1b: 决策捕获（Discuss）

> **Layer**: L1-INTERACTION (SuperCorp 交互层)  
> **前置产物**: `01-analysis.md` (Phase 1 通过 G2)  
> **后置产物**: `.ultimate-workflow/<req-id>/CONTEXT.md`  
> **门控**: G2.5 — Decision Clarity Gate

## Skill元信息

```yaml
name: phase-1b-discuss
version: 3.0-draft
layer: L1-INTERACTION
source: get-shit-done /gsd-discuss-phase
dependencies:
  - context-engineering
v3_upgrade:
  decision_capture: true
  context_generation: true
```

## 触发条件

**自动触发**（满足任一）:
- Phase 1输出的AC包含≥3个技术选型歧义
- 检测到未明确的实现细节（API设计/数据存储/错误处理/UI布局）
- 用户明确要求"/discuss"模式

**手动触发**:
```
/discuss phase 1
```

## 输入

- `01-analysis.md` — Phase 1需求分析文档
- `.ultimate-workflow/memory/PROJECT_CONTEXT.md` — 项目背景
- `.ultimate-workflow/memory/TEAM_PREFERENCES.md` — 团队偏好

## 输出

- `.ultimate-workflow/<req-id>/CONTEXT.md` — 实现决策上下文
- 决策捕获结果报告

---

## 执行流程

### Step 1: 识别灰色地带

扫描`01-analysis.md`，标记未明确的技术决策点：

**常见歧义领域**:
1. **API设计**: REST vs GraphQL vs gRPC
2. **数据存储**: localStorage vs IndexedDB vs SessionStorage
3. **状态管理**: Redux vs Context API vs Zustand
4. **错误处理**: 立即提示 vs 静默重试 vs 降级方案
5. **UI布局**: 单列 vs 双列 vs 响应式
6. **认证方式**: JWT vs Session vs OAuth
7. **部署策略**: SSR vs CSR vs SSG

**检测逻辑**:
```javascript
const ambiguities = detectAmbiguities(analysisDoc);
// 示例输出:
// [
//   {area: "API设计", question: "使用REST还是GraphQL?", options: ["REST", "GraphQL"]},
//   {area: "数据存储", question: "客户端存储用localStorage还是IndexedDB?", options: ["localStorage", "IndexedDB"]},
//   {area: "错误处理", question: "API失败时如何处理?", options: ["立即提示", "静默重试"]}
// ]
```

### Step 2: 交互式问答

对每个歧义点，向用户提问：

```markdown
## 待确认的实现细节

我已识别出以下需要您确认的技术决策点：

---

### 1. API设计风格

**选项A**: RESTful API
- ✅ 优点: 标准化、缓存友好、易于理解、生态成熟
- ❌ 缺点: 过度获取/获取不足问题、多个端点

**选项B**: GraphQL
- ✅ 优点: 精确获取、强类型、单一端点、自文档化
- ❌ 缺点: 学习曲线、缓存复杂、N+1查询风险

**您的选择?** 
- [A] RESTful API
- [B] GraphQL
- [C] 其他（请说明）

---

### 2. 客户端数据存储

**选项A**: localStorage
- ✅ 优点: 简单易用、持久化存储、兼容性好
- ❌ 缺点: 同步阻塞、容量限制(5MB)、仅字符串

**选项B**: IndexedDB
- ✅ 优点: 异步非阻塞、大容量(250MB+)、支持对象存储
- ❌ 缺点: API复杂、需要polyfill、调试困难

**您的选择?**
- [A] localStorage
- [B] IndexedDB
- [C] 混合方案（session用localStorage，离线数据用IndexedDB）

---

### 3. 错误处理策略

**选项A**: 立即提示
- ✅ 优点: 用户即时反馈、透明度高
- ❌ 缺点: 频繁弹窗干扰体验

**选项B**: 静默重试 + 最终提示
- ✅ 优点: 用户体验流畅、减少干扰
- ❌ 缺点: 用户不知道后台在重试

**您的选择?**
- [A] 立即提示（Toast通知）
- [B] 静默重试（最多3次，指数退避）
- [C] 混合方案（关键操作立即提示，背景任务静默重试）

---

### 4. UI布局风格

**选项A**: 单列表单
- ✅ 优点: 简洁、聚焦、移动端友好
- ❌ 缺点: 垂直空间占用大

**选项B**: 双列表单
- ✅ 优点: 信息密度高、桌面端效率高
- ❌ 缺点: 移动端需适配

**您的选择?**
- [A] 单列居中
- [B] 双列布局
- [C] 响应式（桌面双列，移动单列）

---

请逐一回答以上问题，或告诉我哪些可以按默认值处理。
```

### Step 3: 生成CONTEXT.md

将用户决策写入 `.ultimate-workflow/<req-id>/CONTEXT.md`:

```markdown
# Implementation Context (Phase 1 Decisions)

> **生成时间**: 2026-05-17T10:30:00Z  
> **来源**: Phase 1b Discuss  
> **关联需求**: `<req-id>`

---

## API Design

- **Style**: RESTful
- **Versioning**: URL-based (`/api/v1/`)
- **Auth**: JWT in Authorization header
- **Content-Type**: `application/json`
- **Error Format**: 
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid email format",
      "details": [...]
    }
  }
  ```

## Data Storage

### Client-Side
- **Session Data**: localStorage (user preferences, theme)
- **Offline Cache**: IndexedDB (drafts, queued actions)
- **State Management**: React Context + useReducer
- **Persistence Strategy**: 
  - Auto-save drafts every 30s to IndexedDB
  - Sync to server on reconnect

### Server-Side
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (session store, rate limiting)
- **File Storage**: AWS S3 (user uploads)

## Error Handling

### User-Facing Errors
- **Validation Errors**: Inline form validation + Toast notification
- **Network Errors**: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- **Server Errors**: Show error boundary with retry button

### Background Tasks
- **Silent Retry**: Max 3 attempts, log failures to monitoring
- **Fallback**: Degrade gracefully (show cached data if available)

## UI Layout

### Login Page
- **Layout**: Single column, centered form (max-width: 400px)
- **Responsive**: Mobile-first, scales up for desktop
- **Animations**: Subtle fade-in on load

### Dashboard
- **Layout**: Sidebar navigation (250px) + main content area
- **Sidebar**: Collapsible on mobile (<768px)
- **Grid System**: CSS Grid with 12-column layout

## Authentication

- **Method**: JWT (access token 15min, refresh token 7days)
- **Storage**: HttpOnly cookie (refresh token), memory (access token)
- **Rotation**: Refresh token rotation on each use
- **Logout**: Invalidate both tokens server-side

## Performance Targets

- **LCP**: < 2.5s on 4G connection
- **FCP**: < 1.8s
- **CLS**: < 0.1
- **TTI**: < 3.5s

## Security Constraints

- **CORS**: Whitelist specific origins only
- **Rate Limiting**: 100 requests/min per IP
- **Input Validation**: Zod schema validation on all inputs
- **XSS Protection**: DOMPurify for all user-generated content

---

## Open Questions (Needs Clarification)

以下决策点尚未明确，需要在后续阶段确认：

1. **[NEEDS CLARIFICATION]** CDN选择（Cloudflare vs AWS CloudFront）
   - 影响: 静态资源分发速度、成本
   - 建议: 根据目标用户地理位置决定

2. **[NEEDS CLARIFICATION]** 日志聚合方案（ELK vs Datadog vs Sentry）
   - 影响: 监控能力、调试效率、成本
   - 建议: MVP阶段用Sentry，规模化后考虑ELK

3. **[NEEDS CLARIFICATION]** CI/CD平台（GitHub Actions vs GitLab CI vs Jenkins）
   - 影响: 构建速度、集成复杂度、成本
   - 建议: GitHub Actions（与代码库同平台）

---

## Decision Rationale

### Why REST over GraphQL?
- Team familiarity with REST patterns
- Simpler caching strategy (HTTP cache)
- Easier debugging with browser devtools
- Lower learning curve for new team members

### Why localStorage + IndexedDB hybrid?
- Session data is small and simple → localStorage sufficient
- Offline drafts can be large → IndexedDB better suited
- Separation of concerns makes code cleaner

### Why silent retry for background tasks?
- Improves UX by reducing interruption
- Most network issues are transient
- Logging ensures we can debug persistent failures

---

## References

- Phase 1 Analysis: `01-analysis.md`
- Project Context: `.ultimate-workflow/memory/PROJECT_CONTEXT.md`
- Team Preferences: `.ultimate-workflow/memory/TEAM_PREFERENCES.md`
```

### Step 4: 输出决策捕获报告

```markdown
## 决策捕获结果

**耗时**: 5分钟  
**决策数**: 8项  
**未决项**: 3项（标记为[NEEDS CLARIFICATION]）

### 已确认决策

| # | 领域 | 决策 | 状态 |
|---|------|------|------|
| 1 | API设计 | RESTful API | ✅ |
| 2 | 数据存储 | localStorage + IndexedDB混合 | ✅ |
| 3 | 错误处理 | 立即提示 + 静默重试混合 | ✅ |
| 4 | UI布局 | 响应式（桌面双列，移动单列） | ✅ |
| 5 | 认证方式 | JWT (HttpOnly cookie) | ✅ |
| 6 | 性能目标 | LCP < 2.5s, FCP < 1.8s | ✅ |
| 7 | 安全约束 | CORS白名单 + Rate Limiting | ✅ |
| 8 | 状态管理 | React Context + useReducer | ✅ |

### 未决项

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 1 | CDN选择 | 静态资源分发 | 根据用户地域决定 |
| 2 | 日志聚合方案 | 监控能力 | MVP用Sentry |
| 3 | CI/CD平台 | 构建流程 | GitHub Actions |

### 输出文件

- ✅ `.ultimate-workflow/<req-id>/CONTEXT.md` ← 已生成
- 📊 决策报告 ← 本章节

### 下一步

CONTEXT.md将作为Phase 2方案设计的约束条件，确保设计方案符合用户偏好。

---

**⚠️ 门控检查**: 
- [x] 决策覆盖率 ≥80% (8/11 = 73%，接近阈值)
- [x] 未决项已标注[NEEDS CLARIFICATION]
- [x] CONTEXT.md格式正确

**G2.5门控状态**: ✅ 通过（允许进入Phase 2，但需在Phase 2中澄清未决项）
```

---

## G2.5 门控规则

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| 决策覆盖率 | ≥70%的关键实现细节已确认 | 继续追问剩余项 |
| 未决项标记 | 所有未决项标注[NEEDS CLARIFICATION] | 阻止进入Phase 2 |
| CONTEXT.md完整性 | 文件存在且格式正确 | 重新生成 |
| 用户确认 | 用户回复Y或继续 | 停等用户输入 |

---

## Provider 路由

- Phase 1b → **高创造力模型**（需要引导用户思考多种可能性）
- 推荐Provider: Claude 3 Opus / GPT-4 Turbo

---

## 向后兼容

| v1.0 产物 | Discuss处理 |
|-----------|-------------|
| 无CONTEXT.md | 自动生成，填充合理默认值 |
| 已有CONTEXT.md | 增量更新，保留历史决策 |
| Fast模式 | 跳过Discuss，使用默认决策 |

---

## 参考文件

- `references/RULES-v3.md` R1-R20
- `references/prompts/1-analysis.md`
- `agent-skills/skills/context-engineering/SKILL.md`
