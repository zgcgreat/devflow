# 阶段门验证规则 (v3.0)

> 本文件是 GO.md 第四步的详细展开，由 GO.md 按需加载。
> **版本**: v3.0 — 与 devflow Phase 0-8 和 G0-G8 Gate 编号体系对齐

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

---

## 阶段门验证表

| 路由目标 | Gate | 必须存在的前置产物 | 缺失时处理 |
|---------|------|-------------------|---|
| Phase 1 (5 Whys) | G1 | `.devflow/<id>/00-strategy.md` | 先走 Phase 0 |
| Phase 1b (Discuss) | G2.5 | `00-strategy.md` + `01-analysis.md` | 先补 Phase 1 |
| Phase 2 (Design) | G3 | `01-analysis.md` + `01b-context.md` | 先补 Phase 1b |
| Phase 2a (Shotgun) | G3.5 | `02-design.md` | 先走 Phase 2 |
| Phase 3 (Task Plan) | G4 | `00` + `01` + `01b` + `02`（+ `02a` 如有） | 先补缺失阶段 |
| Phase 4 (Build) | G5 | 上面 + `03-tasks.md` | 先走 Phase 3；Fast 模式例外 |
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

## 用户显式跳过例外

用户说"跳过设计" / "不要写需求" → 允许跳过，但 AI 必须在路由声明中记录：
- 跳过了什么
- 跳过的原因
- 后续阶段发现问题时不得以"没走过设计"为借口

---

## 必须人工确认的门

| 事项 | Gate | 说明 |
|------|------|------|
| 需求范围最终确认 | G1 | `01-analysis.md` 签字 |
| 决策覆盖率确认 | G2.5 | `01b-context.md` 覆盖率 ≥ 70% |
| 技术栈或架构方向锁定 | G3 | `02-design.md` ADR 段 |
| 设计变体选择 | G3.5 | 用户选择加权评分最高的变体 |
| 新依赖、schema / migration、删除文件 | G5 | 显式确认 |
| 测试覆盖率达标 | G6 | AC 覆盖率 ≥ 90% |
| CI/CD、部署、生产发布、不可逆操作 | G7.5 | Strict 模式必须确认 |
| 接受 Critical review 发现而不修复 | G7 | 显式确认 |
| 模式升级 / 降级 | any | 用户确认后执行 |
