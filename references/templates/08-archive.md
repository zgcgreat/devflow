# ARCHIVE: <req-id>

- **Req ID**: <id>
- **template-version**: `v1.0.0`
- **关联**: `@.devflow/<req-id>/`（全部产物）、`.devflow/memory/LESSONS.md`、`.devflow/memory/domain-skills/`、`.devflow/state.json`
- **归档时间**: <YYYY-MM-DD HH:mm>

---

<!-- 必填段落清单
1. 归档清单
2. LESSONS 提名与去重结果
3. Domain Skills 晋升
4. TEMPORARY 清理记录
5. 状态归档与 G8 自检
-->

> ⚠️ **模板强制规则（R13.9）**：
> - 本文件包含 **5 个必填段落**，不得省略或改写
> - 所有 `<...>` 占位符必须替换为实际值
> - 遗漏任何段落 = 产物不完整，必须补齐

**必填段落清单**（输出前逐项确认）：
```
□ 归档清单
□ LESSONS 提名与去重结果
□ Domain Skills 晋升
□ TEMPORARY 清理记录
□ 状态归档与 G8 自检
```

---

## 归档清单

> 本 req 全部产物盘点（位于 `.devflow/<req-id>/`），逐项标注存在性与完整性。

| 产物 | 用途 | 状态 |
|------|------|------|
| `00-strategy.md` | 战略评估 | ✅/❌ |
| `01-analysis.md` | 需求分析 + AC | ✅/❌ |
| `01b-context.md` | 决策捕获上下文 | ✅/❌/➖（未启用） |
| `02-design.md` | 方案设计 | ✅/❌ |
| `02a-variants.md` | 设计变体对比与选择 | ✅/❌/➖（未启用） |
| `03-tasks.md` | 任务拆分 | ✅/❌ |
| `04-wave-logs.md` | Wave 执行日志汇总 | ✅/❌ |
| `05-test-report.md` | 测试报告 | ✅/❌ |
| `06-review.md` | 三层对抗审查报告 | ✅/❌ |
| `07-canary.md` | 灰度发布报告 | ✅/❌/➖（未启用） |
| `08-archive.md` | 本归档报告 | ✅ |

## LESSONS 提名与去重结果

> 提名来源: Phase 4 失败任务 / Wave SUMMARY / Phase 6 审查报告；规则: append-only，L-XXX 递增编号，去重合并。

| 提名 | 类别 (FAILURE/SUCCESS/INSIGHT/PATTERN) | 处理结果 |
|------|----------------------------------------|----------|
| <L-NNN · 标题> | <类别> | <新增 / 与 L-XXX 去重合并 / 拒绝（原因）> |

- **新增条目**: <N 条>（写入 `.devflow/memory/LESSONS.md`）
- **去重合并**: <N 条>

## Domain Skills 晋升（≥3 次阈值核验）

> 晋升阈值: 同模式 ≥3 次（跨 wave / 跨 req）。低于 3 次标记 `[NEEDS MORE DATA]`。

| 模式 | 出现次数 | 阈值核验 | 处理结果 |
|------|----------|----------|----------|
| <模式名> | <N> | ≥3 ✅/❌ | <创建/更新 `.devflow/memory/domain-skills/<name>.md` / `[NEEDS MORE DATA]`> |

- **新增 domain-skill**: <文件名列表；无写"无">
- **更新 domain-skill**: <文件名列表；无写"无">

## TEMPORARY 清理记录

> 清理规则: 会话临时笔记清除；保留跨会话价值信息；>7 天条目归档到 `.bak.md`。

| 条目 | 处理 |
|------|------|
| <条目描述> | <清除 / 保留（理由） / 归档到 .bak.md> |

- **清除**: <N 条>；**保留**: <N 条>；**归档**: <N 条>

## 状态归档与 G8 自检

- **状态文件**: `.devflow/state.json` 已写入归档完成标记（total_waves=<N>, tasks_succeeded=<N>, tasks_failed=<N>, lessons_nominated=<N>）
- **G8 自检**:
  - [ ] 归档报告（本文件）已生成且五段完整
  - [ ] LESSONS.md 提名 ≥1 条/P1-P0 失败任务（或无失败任务）
  - [ ] domain-skills 晋升均通过 ≥3 次阈值核验
  - [ ] TEMPORARY 清理已完成
  - [ ] 状态归档已完成
- **用户确认**: <用户于 <时间> 确认归档完成>

---

> 本文件是 Phase 8 主产物；`.devflow/memory/LESSONS.md` 与 `.devflow/memory/domain-skills/` 是沉淀目标而非门控产物。
