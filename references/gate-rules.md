# 阶段门验证规则

> 本文件是 GO.md 第四步的详细展开，由 GO.md 按需加载。

## 阶段依赖关系图

```
0-confirm ──► 1-analysis ──► 2-design ──► [2a-ui-design] ──► 3-task
    │              │              │              │            │
    ▼              ▼              ▼              ▼            ▼
00-requirements.md  01-analysis.md  02-design.md  02a-ui-design.md  03-tasks.md

                          ▼
                     4-dev ──► 5-test ──► 6-review ──► 7-integration
                          │           │             │              │
                          ▼           ▼             ▼              ▼
                     *-dev-log.md  05-test-report.md  06-code-review.md  07-release-checklist.md
```

**依赖规则**：
- 每个阶段必须依赖前一阶段的产物
- 2a-ui-design 仅前端项目需要，依赖 2-design
- Fast 模式可跳过 0~3 阶段，直接进入 4-dev（需满足条件）

---

## 阶段门验证表

| 路由目标 | 必须存在的前置产物 | 缺失时处理 |
|---|-------------------|---|
| 1-analysis | `.devflow-kit/<id>/00-requirements.md` | 先走 0-confirm |
| 2-design | `00-requirements.md` + `01-analysis.md` | 先补缺失的阶段 |
| 2a-ui-design | 上面 + `02-design.md` | 先走 2-design |
| 3-task | `00` + `01` + `02`（前端项目 + `02a`） | 先补缺失的阶段 |
| 4-dev | 上面 + `03-tasks.md` | 先走 3-task；Fast 模式例外 |
| 5-test | `03-tasks.md` + `04-dev-log.md` | 先走 4-dev |
| 6-review | `05-test-report.md` | 先走 5-test |
| 7-integration | `06-code-review.md` | 先走 6-review |

---

## Fast 模式例外

Fast 模式允许跳过 0-confirm 到 3-task 之间的产物，但必须满足：

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

| 事项 | 说明 |
|---|------|
| 需求范围最终确认 | 00-requirements.md 签字 |
| 技术栈或架构方向锁定 | 02-design.md ## 0 段 |
| 新依赖、schema / migration、删除文件 | 显式确认 |
| CI/CD、部署、生产发布、不可逆操作 | Strict 模式必须确认 |
| 接受 Critical review 发现而不修复 | 显式确认 |
| 模式升级 / 降级 | 用户确认后执行 |
