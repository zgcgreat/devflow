# 阶段门验证规则 (v3.2) ⭐v3.2

> 本文件是 GO.md 第四步的详细展开，由 GO.md 按需加载。
> **版本**: v3.2 — 选择题交互模式 + Lean 模式例外规则

## 阶段依赖关系图

```
Phase 0 ──► Phase 1 ──► Phase 1b ──► Phase 2 ──► Phase 2a ──► Phase 3
  │            │            │             │            │            │
  ▼            ▼            ▼             ▼            ▼            ▼
G0:Strategy  G1:5Whys   G2.5:Discuss  G3:Design   G3.5:Shotgun  G4:TaskPlan
  │            │            │             │            │            │
  ▼            ▼            ▼             ▼            ▼            ▼
00-strategy  01-analysis  01b-context  02-design   02a-variants  03-tasks

                                  ▼
                          Phase 4 ──► Phase 5 ──► Phase 6 ──► Phase 7 ──► Phase 8
                              │           │           │           │           │
                              ▼           ▼           ▼           ▼           ▼
                          G5:Build    G6:Test    G7:Review   G7.5:Canary  G8:Archive
                              │           │           │           │           │
                              ▼           ▼           ▼           ▼           ▼
                       04-wave-logs  05-test-report  06-review  07-canary  08-archive
```

**依赖规则**：
- 每个阶段必须依赖前一阶段的产物
- Phase 1b (G2.5) 决策捕获为 Phase 2 的关键前置
- Phase 2a (G3.5) 设计枪战可选，仅复杂设计需要
- Phase 7 (G7.5) Canary 门控为全量发布的硬性前置
- Fast 模式可跳过 Phase 0~3，直接进入 Phase 4（需满足条件）
- Lean 模式可跳过 Phase 0~2a，进入 Phase 2 轻量方案设计或直接 Phase 4 ⭐v3.1

---

## 阶段门验证表

> 下表「必须存在的前置产物」指**进入该 Phase 前需具备的上游产物**（即上一阶段输出）。
> 上方依赖图下行（如 `G1 → 01-analysis`）表示该 Gate 的**本阶段产物**，输入/输出语义不同，二者不冲突。

| 路由目标 | Gate | 必须存在的前置产物 | 缺失时处理 |
|---------|------|-------------------|---|
| Phase 1 (5 Whys) | G1 | `00-strategy.md` | 先走 Phase 0 |
| Phase 1b (Discuss) | G2.5 | `00-strategy.md` + `01-analysis.md` | 先补 Phase 1 |
| Phase 2 (Design) | G3 | `01-analysis.md` + `01b-context.md` | 先补 Phase 1b |
| Phase 2a (Shotgun) | G3.5 | `02-design.md` | 先走 Phase 2 |
| Phase 3 (Task Plan) | G4 | `00` + `01` + `01b` + `02`（+ `02a` 如有） | 先补缺失阶段 |
| Phase 4 (Build) | G5 | 上面 + `03-tasks.md`（Standard/Fast/Lean 模式无此产物时不要求） | Fast 模式例外；Standard/Lean 直接进入 |
| Phase 5 (Test) | G6 | `03-tasks.md` + `04-wave-logs.md` | 先走 Phase 4 |
| Phase 6 (Review) | G7 | `05-test-report.md` | 先走 Phase 5 |
| Phase 7 (Canary) | G7.5 | `06-review.md` | 先走 Phase 6 |
| Phase 8 (Archive) | G8 | `07-canary.md` | 先走 Phase 7 |

---

## Fast 模式例外

Fast 模式允许跳过 Phase 0 到 Phase 3 之间的产物，但必须满足：

1. AI 已在路由声明中明确判定为 Fast 模式
2. 改动确实 ≤ 2 文件、< 50 行、低风险
3. 用户未反对该判定
4. **必须提供 verify 命令**

**Fast 模式路由声明必须包含**：
```
✅ 模式：Fast
✅ 改动范围：<文件列表>
✅ verify 命令：<具体命令>
✅ 预期结果：<通过标准>
```

---

## Lean 模式例外 ⭐v3.1

Lean 模式允许跳过 Phase 0 到 Phase 2a 之间的产物，但必须满足：

1. AI 已在路由声明中明确判定为 Lean 模式
2. 改动确实 3~5 文件、50-300 行、不涉及架构/数据模型
3. 用户未反对该判定
4. **必须提供轻量方案设计（1段描述）**

**Lean 模式允许的 Phase 跳过**：

| Phase | 产物 | Lean 行为 |
|-------|------|----------|
| Phase 0 (YC六问) | `00-strategy.md` | ⏭️ 跳过 |
| Phase 1 (5 Whys) | `01-analysis.md` | ⏭️ 跳过 |
| Phase 1b (Discuss) | `01b-context.md` | ⏭️ 跳过 |
| Phase 2 (Design) | `02-design.md` | ✅ 轻量版（1段方案描述，非完整设计文档） |
| Phase 2a (Shotgun) | `02a-variants.md` | ⏭️ 跳过 |
| Phase 3 (Task Plan) | `03-tasks.md` | ⏭️ 跳过（Lean 直接开发） |
| Phase 4 (Build) | 开发日志 | ✅ 直接开始 |
| Phase 5 (Test) | 测试 | ✅ 窄验证 |
| Phase 6 (Review) | 审查 | ✅ 自检清单 |
| Phase 7-8 | 归档 | ✅ 归档到 LESSONS |

**Lean 模式路由声明必须包含**：
```
✅ 模式：Lean
✅ 改动范围：<文件列表，3~5个>
✅ 轻量方案：<1段描述，说明改什么、怎么改>
✅ verify 命令：<具体命令>
✅ 预期结果：<通过标准>
```

**Lean → Standard 升级条件**（命中任一即升级）：
- 实际改动文件数 > 5
- 涉及架构/数据模型变更
- 需求模糊需要追问
- 用户要求更严格的审查

---

## 用户显式跳过例外

用户说"跳过设计" / "不要写需求" → 允许跳过，但 AI 必须在路由声明中记录：
- 跳过了什么
- 跳过的原因
- 后续阶段发现问题时不得以"没走过设计"为借口

---

## 必须人工确认的门

| 事项 | Gate | 说明 |
|------|------|------|
| 需求范围最终确认 | G2 | `01-analysis.md` 范围签字 |
| 决策覆盖率确认 | G2.5 | `01b-context.md` 覆盖率 ≥ 70% |
| 技术栈或架构方向锁定 | G3 | `02-design.md` ADR 段 |
| 设计变体选择 | G3.5 | 用户选择加权评分最高的变体 |
| 新依赖、schema / migration、删除文件 | G5 | 显式确认 |
| CI/CD、部署、生产发布、不可逆操作 | G7.5 | Strict 模式必须确认 |
| 接受 Critical review 发现而不修复 | G7 | 显式确认 |
| 模式升级 / 降级 | any | 用户确认后执行 |

> 自动门控（无需人工确认，满足条件即过）：G0 / G1 (5Whys 完成) / G4 (TaskPlan) / G6 (AC 覆盖率 ≥ 90%) / G8 (归档完成)。
