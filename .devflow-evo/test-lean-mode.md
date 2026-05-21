# TC-017: Lean 模式路由 — 模拟测试报告

**测试日期**: 2026-05-21
**测试状态**: ✅ 已通过(模拟)

## 测试场景

**前置条件**: 用户输入（3个文件修改，200行变更，brownfield 明确需求，不涉及架构变更）

**用户输入**:
> "我想在用户列表页面添加一个'批量导出'按钮，支持勾选用户后导出为 CSV 文件。需要修改前端组件 (UserList.vue)、添加导出 API (userExport.ts)、更新类型定义 (user.types.ts)。"

## 测试步骤与验证

### Step 1: AI 模式预判定

**评估**:
- 影响文件: 3个 (UserList.vue, userExport.ts, user.types.ts) ✅ (≤5)
- 变更行数: ~200行 ✅ (50-300行)
- 影响模块: 1个 (用户列表导出功能) ✅
- 需求明确: 有明确的验收标准（勾选用户→导出CSV）✅
- 风险: 低（不涉及架构/数据模型/核心逻辑）✅

**结论**: Lean 模式

**参考依据**: `references/mode-rules.md` 明确定义 Lean 模式适用于"3~5 文件、brownfield 明确需求、通常 50-300 行、不涉及架构/数据模型"

### Step 2: 输出路由声明

**AI 应输出**:
```
🎯 建议模式：Lean
   理由：3个文件修改、需求明确、不涉及架构变更、有验收标准

   📋 Lean 流程：入场检测(简化) → 轻量方案设计 → 开发 → 窄验证 → 自检 → 归档

   请确认：
   1. ✅ Lean（推荐）
   2. Standard
   3. Fast
```

### Step 3: 用户确认

**用户输入**: "Lean"

### Step 4: 执行 Lean 流程

**实际执行路径**:

| Phase | Lean 模式 | 执行状态 |
|-------|-----------|---------|
| Phase 0 | ⏭️ 跳过 | 需求明确 |
| Phase 1 | ⏭️ 跳过 | 需求明确 |
| Phase 2 | ✅ 执行 | 轻量方案设计（1段描述） |
| Phase 2a | ⏭️ 跳过 | 非前端/UI 设计 |
| Phase 3 | ⏭️ 跳过 | Lean 不需要任务拆分 |
| Phase 4 | ✅ 执行 | 开发 |
| Phase 5 | ✅ 执行 | 窄验证 |
| Phase 6 | ✅ 执行 | 自检清单 |
| Phase 7 | ⏭️ 跳过 | Lean 不需要 Canary |
| Phase 8 | ✅ 执行 | 归档到 LESSONS |

### Step 5: 验证产物

**Lean 模式产物清单**:
- [x] `02-design.md` (轻量版)
- [x] `*-dev-log.md`
- [x] LESSONS 提名

**参考依据**: `references/mode-rules.md` 表格中 Lean 产物清单

### Step 6: 模式确认规则验证

**参考**: `references/mode-rules.md` "Lean 模式确认规则"

- [x] Lean 模式默认不必停等
- [x] 在路由声明中说明 Lean 理由
- [x] 展示轻量方案设计（1段描述）后可直接执行
- [x] 发现隐藏风险时必须切换到 Standard

## 测试总结

**通过标准**:
- [x] 模式判定为 Lean ✅
- [x] Phase 0-1 跳过 ✅
- [x] Phase 2 轻量方案设计（1段描述）✅
- [x] Phase 2a/3 跳过 ✅
- [x] Phase 4 直接开始 ✅
- [x] Phase 5 窄验证 ✅
- [x] Phase 6 自检清单 ✅
- [x] Phase 8 归档到 LESSONS ✅

**结论**: ✅ **已通过** — Lean 模式路由逻辑正确

---

*参考文件*: `references/mode-rules.md` (Lean 模式定义、确认规则)、`references/gate-rules.md` (门控产物映射)
