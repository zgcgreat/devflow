# 01B-CONTEXT: <req-id> — Implementation Context (Phase 1b Decisions)

- **Req ID**: <id>
- **template-version**: `v1.0.0`
- **关联**: `@.devflow/<req-id>/01-analysis.md`
- **Generated**: <YYYY-MM-DD HH:mm> | Source: Phase 1b

---

<!-- 必填段落清单
1. API Design — Style / Versioning / Auth / Error Format
2. Data Storage — Client + Server (DB / Cache / File Storage)
3. Error Handling — User-Facing / Network / Background retry
4. UI Layout — Login / Dashboard / Grid
5. Authentication — Method / Storage / Rotation
6. Performance Targets — LCP / FCP / CLS / TTI
7. Security Constraints — CORS / Rate Limiting / XSS
8. Open Questions (NEEDS CLARIFICATION)
9. Decision Rationale
-->

> ⚠️ **模板强制规则（R13.9）**：
> - 本文件包含 **9 个必填段落**，不得省略或改写
> - 所有 `<...>` 占位符必须替换为实际值
> - 遗漏任何段落 = 产物不完整，必须补齐

**必填段落清单**（输出前逐项确认）：
```
□ API Design — Style / Versioning / Auth / Error Format
□ Data Storage — Client + Server (DB / Cache / File Storage)
□ Error Handling — User-Facing / Network / Background retry
□ UI Layout — Login / Dashboard / Grid
□ Authentication — Method / Storage / Rotation
□ Performance Targets — LCP / FCP / CLS / TTI
□ Security Constraints — CORS / Rate Limiting / XSS
□ Open Questions (NEEDS CLARIFICATION)
□ Decision Rationale
```

> 说明：本文件是 **Phase 1b 决策捕获产物**，作为 Phase 2 方案设计的约束条件；与项目级共享上下文 `.devflow/memory/CONTEXT.md`（跨 req 累积的域语言与默认偏好）不是同一个文件。

---

## API Design — Style / Versioning / Auth / Error Format

- **Style**: <REST / GraphQL / gRPC / 混合，来自用户选择>
- **Versioning**: <URL 前缀 / Header / 无版本>
- **Auth**: <鉴权挂在哪一层>
- **Error Format**: <统一错误响应结构>

## Data Storage — Client + Server (DB / Cache / File Storage)

- **Client**: <localStorage / IndexedDB / SessionStorage / 无>
- **Server DB**: <选型 + 理由>
- **Cache**: <选型或"无">
- **File Storage**: <对象存储 / 本地 / 无>

## Error Handling — User-Facing / Network / Background retry

- **User-Facing**: <立即提示 / 静默降级>
- **Network**: <重试策略与次数>
- **Background retry**: <队列 / 定时重试 / 无>

## UI Layout — Login / Dashboard / Grid

- **Login**: <单列 / 居中卡片>
- **Dashboard**: <布局决策>
- **Grid**: <单列 / 双列 / 响应式>

## Authentication — Method / Storage / Rotation

- **Method**: <JWT / Session / OAuth>
- **Storage**: <Cookie / localStorage / 内存>
- **Rotation**: <刷新策略>

## Performance Targets — LCP / FCP / CLS / TTI

- **LCP**: <指标或"无">
- **FCP**: <指标或"无">
- **CLS**: <指标或"无">
- **TTI**: <指标或"无">

## Security Constraints — CORS / Rate Limiting / XSS

- **CORS**: <允许来源策略>
- **Rate Limiting**: <限流策略或"无">
- **XSS**: <转义 / CSP 策略>

## Open Questions (NEEDS CLARIFICATION)

> 所有未决项必须标注 `[NEEDS CLARIFICATION]`，不允许静默留空。无未决项写"无"。

- `[NEEDS CLARIFICATION]` <问题 1 — 影响范围与建议默认值>
- `[NEEDS CLARIFICATION]` <问题 2>

## Decision Rationale

> 逐项记录：问题 → 选项（A/B/C）→ 用户选择 → 决定理由。决策覆盖率 ≥70%，关键领域（API / 数据存储 / 认证）100% 覆盖。

| # | 决策点 | 选项 | 用户选择 | 理由 |
|---|--------|------|----------|------|
| 1 | <决策点> | <A/B/C> | <X> | <理由 / [RECOMMENDED] / [DEFAULT: ...]> |

---

> 本文件为契约：Phase 2 方案设计必须消费本文件的全部已确认决策（PartyMode 集成检查项 5）。
