# Phase 7: Canary灰度发布 + Phase 8: 知识归档

## Phase 7: Canary灰度发布

> **门控**: G7 (Release Gate) — 健康检查通过 → 通过
> **Layer**: Layer 1 (交互层)
> **适用模式**: Standard（可选）, Strict（必跑）
> **前置产物**: `07-release-report.md`

---

## ⚡ v3.2 交互流程（发布进度可视化）

**分批次上线协议（交互式监控）**:

```
=== Phase 7: Canary灰度发布 ===

📊 发布进度: Canary-2 进行中 (50%)

┌─────────────────────────────────────────────┐
│ Canary-1 (10%)  ████████████████ 100% ✅   │
│ Canary-2 (50%)  ████████████░░░░░ 80% 🔄   │
│ Production (100%)░░░░░░░░░░░░░░░░ 0% ⏳    │
└─────────────────────────────────────────────┘

健康检查:
✓ error_rate: 0.02% (阈值 < 0.5%)
✓ 响应时间: P99 = 230ms (阈值 < 500ms)
✓ 错误日志: 0 异常

─────────────────────────────

下一步: 全量发布到 100% 用户

  [A] 确认全量发布
  [B] 等待 5 分钟后再发布（延长观察）
  [C] 立即回滚（发现问题）

  请选择：
```

### 发布完成

```
✅ Phase 7 完成 — 全量发布成功

📊 发布总结
- 总耗时: 25 分钟
- 最高错误率: 0.03%
- 受影响用户: 100%
- 回滚次数: 0

已自动更新: health_checks, monitoring_alerts
```

**目标**: 分批次上线，实时健康检查，一键回滚。

---

## Phase 8: 知识归档

> **门控**: G8 (Archive Gate) — LESSONS.md 和 domain-skills 已更新 → 通过
> **Layer**: Layer 2+3
> **适用模式**: Fast（归档到LESSONS）, Lean（归档到LESSONS）, Standard（完整）, Strict（完整）
> **前置产物**: `.forgeos/memory/LESSONS.md`、`.forgeos/memory/domain-skills/`

---

### ⚡ v3.2 交互流程（归档进度可视化）

```
=== Phase 8: 知识归档 ===

📊 归档进度: 步骤 4/5 完成

┌─────────────────────────────────────────────┐
│ 遍历 Wave SUMMARY ████████████████ 100% ✅  │
│ LESSONS 去重      ████████████████ 100% ✅  │
│ 领域技能沉淀      ████████████████ 100% ✅  │
│ 更新 STATE.md     ████████████████ 100% ✅  │
│ 归档 COMMIT       ████████░░░░░░░░ 50% 🔄  │
└─────────────────────────────────────────────┘

─────────────────────────────

📝 LESSONS 总结:

共提取 5 条经验教训:

1. ⚡ token-retry-pattern — JWT 刷新 retry 策略可复用（高价值）
2. ⚡ file-upload-limit — 文件上传必须有大小限制（安全）
3. 💡 auth-flow — 前端 auth 状态管理用 Context API 足够（技术选型确认）
4. ⚠️ db-migration — 数据库迁移前必须先备份（风险提醒）
5. 💡 ui-testing — UI 测试用截图对比比 DOM 对比更可靠（测试技巧）

已沉淀到 memory:
- LESSONS.md: 5 条新增
- domain-skills/: 2 条新技能
  - token-retry-pattern
  - file-upload-limit

─────────────────────────────────────────────

✅ Phase 8 完成 — 知识归档全部完成

最终统计:
- 总 Wave: 3
- 总任务: 12
- 总测试: 60 (通过率 95%)
- 发现 Bug: 5 (全部修复)
- 新增 LESSONS: 5
- 新增 Domain Skills: 2

🎉 项目全流程完成！

已更新:
- .forgeos/<req-id>/ — 所有产物
- .forgeos/STATE.md — 项目状态
- .forgeos/memory/LESSONS.md — 经验教训
- .forgeos/memory/domain-skills/ — 领域技能

请确认或输入 /commit 提交最终变更：
```

**目标**: 每个项目结束后沉淀知识，让下次迭代受益。LearningWorkflow自进化闭环。

---

**关联文件**:
- `references/gate-rules.md` — G7/G8 门控详情
- `GO.md` — Step 12 入口（快速参考）
