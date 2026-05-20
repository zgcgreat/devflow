---
name: phase-1b-discuss
preamble-tier: 2
version: 3.0-draft
description: |
  Decision capture engine that identifies implementation ambiguities from Phase 1 analysis,
  conducts interactive Q&A with the user, and generates CONTEXT.md as constraints for Phase 2.
  Use when: "discuss phase 1", "capture decisions", "clarify requirements", "decision gate". (devflow)
layer: L1-INTERACTION
source: get-shit-done /gsd-discuss-phase
dependencies:
  - context-engineering
triggers:
  - discuss phase 1
  - capture decisions
  - clarify requirements
  - decision gate
  - G2.5
token_budget: "~200K per execution agent"
---

# Phase 1b: 决策捕获（Discuss）

> **Layer**: L1-INTERACTION (交互层)  
> **前置产物**: `01-analysis.md` (Phase 1 通过 G2)  
> **后置产物**: `.devflow/<req-id>/CONTEXT.md`  
> **门控**: G2.5 — Decision Clarity Gate

## Preamble

### What I Am / What I'm Not

**I am**: The decision capture engine that turns ambiguous requirements into concrete implementation constraints. I identify grey areas in Phase 1 output, conduct interactive Q&A with the user, and produce CONTEXT.md for Phase 2 design.

**I'm not**: A requirement gathering tool (that's Phase 0/1), a technical design doc (that's Phase 2a), or a decision log (that's Phase 8 archive). My sole purpose is to eliminate ambiguity before design begins.

### Pre-Requisite Gate Checklist

Before starting discuss phase, verify ALL of the following:

- [ ] Phase 1 `01-analysis.md` exists and has passed G2 (Actionability Gate)
- [ ] At least one ambiguity area detected (≥3 technical selection ambiguities OR user explicitly requests `/discuss`)
- [ ] Project context available (`.devflow/memory/PROJECT_CONTEXT.md` or fallback to default assumptions)
- [ ] Team preferences available (`.devflow/memory/TEAM_PREFERENCES.md` or fallback to best practices)

**Gate Result**: `[PASS / FAIL]` — If any item FAILS, address before starting. This gate MUST pass for every new requirement.

### Key Principles

1. **Ambiguity Detection First**: Systematically scan Phase 1 output for underspecified technical decisions — don't rely on user to know what's missing
2. **Option-Based Q&A**: Present options with pros/cons, not yes/no questions. User decides; I facilitate.
3. **CONTEXT.md is Contract**: Every decision in CONTEXT.md becomes a constraint for Phase 2. Changes require explicit re-discussion.
4. **70% Rule**: Don't wait for 100% clarity. If ≥70% of key implementation decisions are captured, proceed with remaining items marked [NEEDS CLARIFICATION].

---

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
- `.devflow/memory/PROJECT_CONTEXT.md` — 项目背景
- `.devflow/memory/TEAM_PREFERENCES.md` — 团队偏好

## 输出

- `.devflow/<req-id>/CONTEXT.md` — 实现决策上下文
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

将用户决策写入 `.devflow/<req-id>/CONTEXT.md`:

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
- Project Context: `.devflow/memory/PROJECT_CONTEXT.md`
- Team Preferences: `.devflow/memory/TEAM_PREFERENCES.md`
```

### Step 3.5: PartyMode Output Gate 集成（仅当决策需 PartyMode 审议时）

当 Step 2 中某个歧义点涉及 ≥3 个技术维度交叉（如架构选型 + 性能 + 安全）或 Agent 置信度 <70% 时，调用 PartyMode (L2-ENGINE) 进行多 Agent 共识审议。

**PartyMode 调用契约**:

```
Phase 1b → PartyMode (Decision Type: Technical Architecture)
    │
    ├─ Step A: 提交问题陈述（含上下文 + 约束 + 成功标准）
    ├─ Step B: 等待 PartyMode consensus gate 验证
    ├─ Step C: 消费 PartyMode gate output
    │   │
    │   └─ Gate PASS → 将 consensus decision 写入 CONTEXT.md
    │          作为 [PARTYMODE-CONSENSUS] 标记的硬约束
    │   │
    │   └─ Gate FAIL → 执行 fallback protocol (FAILLVL-1→3)
    │          最终结果写入 CONTEXT.md 并标注 fallback level
    │
    └─ Step D: 将 PartyMode gate validation report 附加到 G2.5 gate check
```

**PartyMode Output Gate 消费规则**:

| Gate 结果 | CONTEXT.md 写入格式 | G2.5 影响 |
|-----------|---------------------|-----------|
| PASS | `[PARTYMODE-CONSENSUS: decision + weighted_score]` | 该决策项标记为 ✅（已确认） |
| FAIL → LVL-1 解决 | `[PARTYMODE-CONSENSUS: decision + FALLBACK-LVL-1]` | 该决策项标记为 ✅（已确认） |
| FAIL → LVL-2 解决 | `[PARTYMODE-CONSENSUS: decision + FALLBACK-LVL-2]` | 该决策项标记为 ✅（已确认） |
| FAIL → LVL-3 解决 | `[PARTYMODE-CONSENSUS: decision + FALLBACK-LVL-3 + Architect override]` | 该决策项标记为 ✅（已确认） |
| FAIL（无 fallback） | `[PARTYMODE-NEEDS-CLARIFICATION: reason]` | 该决策项标记为 [NEEDS CLARIFICATION] |

**消费契约注释**（写入 CONTEXT.md 的 PartyMode 决策旁）:
```markdown
> **来源**: PartyMode Consensus Gate (G1:75% PASS | G2:7.4/10 PASS | G3:0 conflicts PASS | G4:4 rounds PASS)
> **Gate Validation**: `.devflow/<req-id>/partymode-gate-report.md`
```

**未通过 Gate 的决策不计入覆盖率**:
- `[PARTYMODE-NEEDS-CLARIFICATION]` 项在 G2.5 覆盖率计算中计为未决项
- 需回到 Step 2 进行二次追问或手动决策

---

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

- ✅ `.devflow/<req-id>/CONTEXT.md` ← 已生成
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

### 用户确认

> 格式参考: `CONSTITUTION.md` 规则 #8（用户确认协议）

📍 当前阶段: Phase 1b · Discuss — Decision Capture
🎯 本步目标: 确认 CONTEXT.md 中的技术决策是否合理

**问题 1**: 已确认决策是否覆盖关键实现细节（≥70%）？
[1] ✅ 覆盖率达标 ← 推荐
[2] 需要补充决策点
[3] 查看详细覆盖情况

**问题 2**: 未决项是否合理（≤30%）？
[1] ✅ 未决项可接受 ← 推荐
[2] 需要进一步确认
[3] 查看详细未决项

**问题 3**: 是否同意进入 Phase 2 设计？
[1] ✅ 同意，继续 Phase 2 ← 推荐
[2] 需要修改 CONTEXT.md
[3] 回退到 Phase 1
| **PartyMode Gate 集成** | 所有 PartyMode 审议的决策均已消费 gate output 并标记 | 未消费 gate result 的决策计为 [NEEDS CLARIFICATION] |
| **PartyMode Gate Report** | `.devflow/<req-id>/partymode-gate-report.md` 存在（如有 PartyMode 调用） | 缺失则回溯 PartyMode Step D |

### G2.5 Gate Check 最终验证模板

```markdown
## G2.5 Decision Clarity Gate — Final Validation

**Gate Result**: ✅ PASS / ❌ FAIL

### Gate Checks
| Gate | Condition | Actual | Result |
|------|-----------|--------|--------|
| G1: Decision Coverage | ≥70% key decisions confirmed | 8/11 = 73% | ✅ PASS |
| G2: Unresolved Items | All marked [NEEDS CLARIFICATION] | 3 items marked | ✅ PASS |
| G3: CONTEXT.md Integrity | File exists + valid format | Present | ✅ PASS |
| G4: User Confirmation | User explicitly confirmed | Y | ✅ PASS |
| G5: PartyMode Gate Integration | All PartyMode decisions consumed | 2 decisions, 2 consumed | ✅ PASS |
| G6: PartyMode Gate Report | Report exists (if PartyMode called) | Present | ✅ PASS |

### Unresolved Items (3)
1. [NEEDS CLARIFICATION] CDN 选择 — 影响: 静态资源分发 | 建议: 根据用户地域决定
2. [NEEDS CLARIFICATION] 日志聚合方案 — 影响: 监控能力 | 建议: MVP 用 Sentry
3. [NEEDS CLARIFICATION] CI/CD 平台 — 影响: 构建流程 | 建议: GitHub Actions

### PartyMode Decisions (2)
- [PARTYMODE-CONSENSUS] 状态管理: React Context + useReducer (Weighted Score: 8.1/10, Consensus: 85%)
- [PARTYMODE-CONSENSUS] API 设计: RESTful (Weighted Score: 7.6/10, Consensus: 75%)
  > Gate Validation: `.devflow/<req-id>/partymode-gate-report.md`

### Gate Approval
**G2.5 Status**: ✅ PASS — Proceed to Phase 2 with 3 unresolved items marked [NEEDS CLARIFICATION]
**Next Gate**: G2 (Phase 2 Actionability Gate)
```

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

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Discuss Impact |
|-------|------|------------|--------|----------------|
| **P0** | BLOCKING | User disagrees with a critical decision already in CONTEXT.md, or Phase 1 analysis has fundamental misreading of requirements | Rollback affected decisions from CONTEXT.md, re-run Step 1-2 for that area only | Blocks Phase 2 design until resolved |
| **P1** | RECOVERABLE | User unable to decide between options (says "whatever you think" for ≥2 consecutive questions) | Provide recommendation with rationale, mark as `[RECOMMENDED]`, proceed if user confirms or says no objection | Delays discussion but does not block; proceed after 3 attempts |
| **P2** | WARNING | Decision has low impact on architecture (e.g., specific CSS framework choice, minor naming convention) | Apply best practice default, document in CONTEXT.md with `[DEFAULT: best practice]` | No impact, proceed normally |
| **P3** | INFO | Question answered with non-standard response that needs interpretation | Re-phrase question once; if still ambiguous, use P2 default handling | No impact, continue |

**Severity Assignment Rules**:
- Default to P1 for any undecidable technical selection (API design, data storage, auth method)
- Escalate from P1→P0 only when user explicitly overrides a previously captured decision OR Phase 1 requirements changed materially since discussion
- Never demote: once P0 assigned, require explicit user confirmation before proceeding past G2.5

**Auto-Resolution Rules** (no user input needed):
- If question relates to project-specific concern with clear precedent in CONTEXT.md → auto-resolve with `[PREVIOUS DECISION: see CONTEXT.md line N]`
- If question is about external dependency version (e.g., "React 18 vs 19") with no breaking changes → auto-resolve with `[DEFAULT: latest stable LTS]`

---

## Boundary Conditions

### Discussion Depth Limits

| Parameter | Limit | Rationale |
|-----------|-------|-----------|
| Max decisions to capture per session | 15 items | Beyond 15 → user fatigue increases, diminishing returns on decision quality; if >15 detected, split into two sessions |
| Max options per question | 3 choices (A/B/C) | More than 3 options causes decision paralysis; group similar options or use follow-up questions |
| Max follow-up rounds per decision | 2 rounds | Round 1: present options → Round 2: if ambiguous, provide recommendation → Done |
| Total discussion time estimate | ~10-20 minutes for typical project | If exceeds 30 min, flag as P0 and suggest splitting requirement into sub-components |

### Decision Coverage Thresholds

| Metric | Threshold | Action if Below Threshold |
|--------|-----------|---------------------------|
| Key decisions captured | ≥70% of total | Allow proceeding to Phase 2 with remaining marked [NEEDS CLARIFICATION] |
| Critical area coverage | 100% (API design, data storage, auth) | Block Phase 2 until all critical areas resolved |
| User confirmation rate | ≥90% of captured decisions explicitly confirmed | If <90%, re-run undecided items with revised options |

### CONTEXT.md Validity Constraints

| Constraint | Rule | Validation |
|------------|------|------------|
| File location | Must be at `.devflow/<req-id>/CONTEXT.md` | Check existence before Phase 2 starts |
| Format compliance | Must include all sections from Step 3 template (API Design, Data Storage, Error Handling, etc.) | Phase 2 designer validates schema acceptance |
| Staleness | Max 7 days between discussion and Phase 2 start | If >7 days, re-verify critical decisions with user |

### Escalation Triggers

**Escalate to Orchestrator (skip normal flow) if**:
- User requests `/discuss` but Phase 1 has 0 ambiguities detected → phase skipping, proceed directly to Phase 2
- CONTEXT.md already exists for req-id → incremental update mode (preserve existing decisions, only modify changed areas)
- User provides contradictory decisions in different questions (e.g., "use REST" then "need GraphQL-like flexibility") → present conflict table, ask user to resolve
- Project context file missing AND team preferences file missing → proceed with best-practice defaults, document assumptions in CONTEXT.md under `[ASSUMPTIONS]` section

### Provider Routing

- Phase 1b → **高创造力模型** (需要引导用户思考多种可能性，推荐 Claude 3 Opus / GPT-4 Turbo)
- When user is non-technical → use model with better explanation capability, avoid jargon-heavy options
- For technical teams comfortable with trade-off analysis → any high-capability model suffices

---

## 参考文件

- `references/RULES-v3.md` R1-R20
- `references/prompts/1-analysis.md`
- `agent-skills/skills/context-engineering/SKILL.md`
