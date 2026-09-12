# Phase 4: 实施 (Wave并行执行)

> **门控**: G5 (Build Gate) — Wave全部完成且测试通过 → 通过
> **Layer**: Layer 2 (引擎层)
> **适用模式**: Fast/Lean（直接开始）, Standard（完整）, Strict（完整）
> **前置产物**: `04-wave-logs.md`

---

## ⚡ v3.2 交互流程（进度可视化）

**Wave 执行进度面板**（每 Wave 开始/进行中/完成时更新）

```
=== Phase 4: 实施 ===

📊 总进度: Wave 2/3 | 任务 5/12

┌─────────────────────────────────────────────┐
│ Wave 1: 基础建设   ████████████████ 100% ✅  │
│ Wave 2: 核心功能   ████████░░░░░░░░ 50% 🔄  │
│ Wave 3: 完善优化   ░░░░░░░░░░░░░░░░ 0% ⏳  │
└─────────────────────────────────────────────┘

当前执行: Wave 2, 任务 T5 (Token 管理模块)
⏱️ 已耗时: 28分钟 | 预计剩余: 20分钟

─────────────────────────────

最近完成:
✓ T4: 实现用户登录页面 — 3 个测试全部通过
✓ T5: 实现 Token 管理模块 — 2 个测试通过, 1 个失败, 修复中...

⚡ LearningFlow 提名: token-retry-pattern → LESSONS.md
```

### Heartbeat检查点协议（每 Wave 完成时自动输出）

格式: `[checkpoint][wave:N][task:X]`

每Wave完成后输出：

```
[checkpoint][wave:3][task:all-done]
✓ Wave 3完成: 3个任务全部通过验证
⚡ LearningFlow提名: auth-module-pattern → LESSONS.md
   (JWT刷新逻辑的retry策略可复用到其他API调用)

📊 总进度: Wave 3/3 | 任务 12/12 — 实施完成 ✅

请确认或输入 /lessons 查看提名经验：
```

**目标**: 透明化执行过程，用户可随时了解状态。LearningWorkflow自动提取可复用模式到 LESSONS.md。

---

**关联文件**:
- `references/gate-rules.md` — G5 门控详情
- `GO.md` — Step 9 入口（快速参考）
