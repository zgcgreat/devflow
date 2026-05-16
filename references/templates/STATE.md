# STATE — 跨会话项目状态

> `.devflow-kit/STATE.md` — DevFlow Kit 的跨会话状态文件。Standard / Strict 流程必须维护；Fast 模式可按需创建。

---

> ⚠️ **模板强制规则（R13.9）**：
> - 本文件包含 **8 个必填段落**，不得省略或改写
> - 所有 `<...>` 占位符必须替换为实际值
> - 遗漏任何段落 = 产物不完整，必须补齐

**必填段落清单**（输出前逐项确认）：
```
□ 1. 当前位置
□ 2. 入场扫描状态
□ 3. 阶段进度（Fast/Standard/Strict）
□ 4. 恢复步骤
□ 5. 阻塞与待决策
□ 6. 决策日志
□ 7. 横向命令状态
□ 8. 健康检查
```

---

## 1. 当前位置

| 字段 | 值 |
|---|---|
| **活跃 Req** | `<req-id>` 或 `无` |
| **模式** | `Fast / Standard / Strict` |
| **当前阶段** | `confirm / analysis / design / ui-design / task / dev / test / review / integration / none` |
| **阶段状态** | `not_started / in_progress / waiting_user_confirmation / completed / blocked / skipped` |
| **用户确认时间** | `YYYY-MM-DD HH:mm` 或 `—`（仅 `waiting_user_confirmation` 状态需要记录） |
| **上次完成阶段** | `<phase>` 或 `none` |
| **下一阶段** | `<phase>` 或 `none` |
| **当前 Task** | `<T03>` 或 `—` |
| **中断任务** | `<task-id>` 或 `无` |

**语义约定**：

- `当前阶段` 表示 Agent 当前正在处理、等待确认或阻塞的阶段。
- `阶段状态` 表示当前阶段的状态，不再用”当前阶段”隐含完成/未完成。
- `阶段状态` 状态转换：
  - `waiting_user_confirmation` → 用户回复 Y → `completed`，同时填写 `用户确认时间`
  - `waiting_user_confirmation` → 用户指出修改 → `in_progress`，清空 `用户确认时间`
  - `completed` → 进入下一阶段时，`当前阶段` 变为新阶段，`阶段状态` 变为 `in_progress`
- `上次完成阶段` 用于恢复时判断最近可信产物。
- `下一阶段` 是建议的下一步，不代表已经进入。

---

## 2. 入场扫描状态

| 字段 | 值 |
|---|---|
| **项目类型** | `greenfield / brownfield / 未知` |
| **扫描状态** | `未开始 / 进行中 / 已完成 / 已跳过` |
| **扫描时间** | `YYYY-MM-DD HH:mm` 或 `—` |
| **上下文文档** | `CONTEXT.md / AGENTS.md / CLAUDE.md / none` |
| **跳过原因** | `用户选择跳过 / greenfield 无需扫描 / 已有上下文文档 / —` |

进入 Standard / Strict 的新需求前必须确认本节。brownfield 项目未完成扫描时，必须让用户选择扫描、指定现有上下文文档或明确跳过。

---

## 3. 阶段进度

> **状态符号**：`✅` = 已完成 / `⏳` = 进行中 / `❌` = 阻塞 / `⏭️` = 跳过 / `➖` = 不适用

### Fast

| 阶段 | 状态 | 产物 / 证据 |
|---|---|---|
| 短任务说明 | `[ ]` | 聊天摘要或dev-log |
| 修改 | `[ ]` | diff |
| 窄验证 | `[ ]` | 命令输出 / 手动检查 |
| 结果证据 | `[ ]` | 最终说明 |

### Standard

| 阶段 | 状态 | 产物 | 开始时间 | 完成时间 | 确认规则 |
|---|---|---|---|---|---|
| 需求确认 | `✅` | `00-requirements.md` | `—` | `—` | 必须等用户确认 |
| 需求分析 | `⏳` | `01-analysis.md` | `—` | `—` | 必须等用户确认 |
| 方案设计 | `⏳` | `02-design.md` | `—` | `—` | 必须等用户确认 |
| UI 设计 | `➖` | `02a-ui-design.md` | `—` | `—` | 前端 / UI 必须等用户确认 |
| 任务拆分 | `⏳` | `03-tasks.md` | `—` | `—` | 无阻塞可继续 |
| 开发 | `⏳` | `04-dev-log.md` + 任务级记录 | `—` | `—` | 无阻塞可继续 |
| 测试 | `⏳` | `05-test-report.md` | `—` | `—` | 无阻塞可继续 |
| 审查 | `⏳` | `06-code-review.md` | `—` | `—` | Critical 必须停等 |
| 集成 | `⏳` | `07-release-checklist.md` | `—` | `—` | 发布 GO 必须确认 |

### Strict 附加项

| 阶段 | 状态 | 产物 | 触发条件 |
|---|---|---|---|
| 安全审查 | `[ ] / N/A` | `安全审查报告.md` | 安全敏感改动 |
| 迁移方案 | `[ ] / N/A` | `迁移方案.md` | schema / 数据迁移 |
| 回滚方案 | `[ ] / N/A` | `回滚方案.md` | 生产或不可逆风险 |

---

## 4. 恢复步骤

会话压缩、清窗、用户说“继续 / 下一阶段 / 执行 Txx”时：

1. 读取本文件。
2. 确认 `活跃 Req`、`模式`、`当前阶段`、`阶段状态`、`上次完成阶段`、`下一阶段`。
3. 检查入场扫描状态；brownfield 未完成则先处理扫描。
4. 读取 `上次完成阶段` 和 `当前阶段` 对应产物。
5. 如果 `中断任务` 非空，读取 `<task-id>-dev-snapshot.md`，从断点继续。
6. 输出恢复摘要，不假装从未中断。

恢复摘要格式：

```text
🔄 会话恢复摘要
- 恢复自：<STATE.md + 产物文件>
- 活跃 Req：<req-id>
- 模式：<Fast/Standard/Strict>
- 当前阶段：<phase>（<阶段状态>）
- 上次完成阶段：<phase>
- 当前任务：<Task ID 或 —>
- 下一步：<具体动作>
```

---

## 5. 阻塞与待决策

| 项 | 类型 | 详情 | 待谁 | 自 |
|---|---|---|---|---|
| | `bug / 决策 / 范围 / 权限 / 风险` | | `用户 / AI` | |

---

## 6. 决策日志

> 最近 10 条，倒序。

```text
[YYYY-MM-DD] <一句话决策> — <来源文件或用户确认>
```

---

## 7. 横向命令状态

> GO.md / 各 prompt 会读这里决定要不要主动提示。

```yaml
# 老项目入场扫描 / AI 上下文文档替代
ai_context_doc: CONTEXT.md      # 或 AGENTS.md / CLAUDE.md / 用户指定路径 / none
last_intel_scan: YYYY-MM-DD    # 上次跑 I-intel-scan 的日期；为空表示从未跑
                               # GO.md 第二步会按 90 天阈值提醒重扫

# 架构演进
last_architect_at: YYYY-MM-DD  # 上次跑 A-architect 的日期；首跑后填
last_evolve_at: YYYY-MM-DD     # 上次跑 A-evolve 的日期；用于过滤扫描范围
last_evolve_promoted:          # 上次 A-evolve 已处理的 req-id 列表，避免重扫
  - <req-id-1>
  - <req-id-2>

# health-check
last_health_at: YYYY-MM-DD     # 上次跑 M-health 的日期
last_health_score: <N>         # 上次综合分（用于本次对比）
```

字段含义：

- 读这块只为**决定要不要在 GO.md 路由时主动提醒**（如"距上次 evolve 已 60 天，建议同步"）
- 不影响主流程，缺字段就当未跑过对应工作流
- 各横向工作流跑完会自己更新这里

---

## 8. 健康检查

```text
□ 活跃 Req 的必需产物齐全
□ 当前阶段和阶段状态语义一致
□ brownfield 入场扫描已完成或用户已明确跳过
□ 没有未记录的阻塞项
□ 没有验证失败却标记完成的阶段
```
