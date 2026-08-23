---
name: real-time-review
preamble-tier: 2
version: 1.0.0
layer: L2-ENGINE
gate: G5.5
requires: [agent-comms, wave-executor]
provides: [spec-compliance-check, quality-quick-scan, boundary-check, review-report]
description: |
  Wave 实时审查 — Phase 4 每个 Wave 完成后自动执行轻量级审查。
  包括规格合规检查、代码质量快速扫描、变更边界检查。
  审查结果写入 .forgeos/<req-id>/reviews/，FAIL 级别问题可暂停 Wave 执行。
  参考: Superpowers Subagent-Driven Development 两阶段审查。
source: INTEGRATION-PLAN P1-1 — Superpowers two-stage review
dependencies:
  - agent-comms (审查结果通过消息板传播)
  - wave-executor (Wave 完成后触发)
  - vector-memory (搜索相关历史教训)
triggers:
  - Wave 完成后自动触发
  - 手动触发: /review wave <N>
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
external-inputs: [wave-summary, design-spec, task-list]
---

# Real-time Review — Wave 实时审查

> **核心问题**: 审查全部集中在 Phase 6，Phase 4 实施阶段没有中间审查点。问题累积到 Phase 6 才发现，返工成本高。
> **解决方案**: Phase 4 每个 Wave 完成后增加轻量级实时审查，尽早发现问题，减少 Phase 6 返工率 60%+。

---

## 1. 审查流程

### 1.1 触发时机

```
Phase 4 Wave N 完成
  │
  ├─→ Step 1: Spec Compliance Check (规格合规检查)
  ├─→ Step 2: Code Quality Quick Scan (代码质量快速扫描)
  ├─→ Step 3: Change Boundary Check (变更边界检查)
  └─→ Step 4: Decision (审查决策)
      ├─ PASS → 继续下一 Wave
      ├─ WARN → 通知用户，继续（标记 Phase 6 重点审查）
      └─ FAIL → 暂停，修复后重试
```

### 1.2 审查级别

| Wave 类型 | 审查级别 | 执行步骤 | 预估耗时 |
|-----------|---------|---------|---------|
| Wave 1 (基础层) | **Light** | 仅 Step 1 | ~30s |
| Wave 2-N (依赖层) | **Standard** | Step 1 + Step 2 | ~1min |
| 最后一个 Wave | **Full** | Step 1 + Step 2 + Step 3 | ~2min |
| 手动触发 | **Full** | Step 1 + Step 2 + Step 3 | ~2min |

### 1.3 审查级别决策树

```yaml
review_level:
  if wave_number == 1:
    level: LIGHT           # 基础层，通常无依赖
    steps: [spec_compliance]

  elif wave_number < total_waves:
    level: STANDARD         # 中间层，检查质量
    steps: [spec_compliance, quality_scan]

  else:  # last wave
    level: FULL             # 最终层，完整审查
    steps: [spec_compliance, quality_scan, boundary_check]

  # 特殊情况
  if task_count > 10:
    level: FULL             # 大 Wave 需要更严格审查
    reason: "Large wave (>10 tasks) requires full review"

  if user_triggered:
    level: FULL             # 用户主动触发总是 Full
```

---

## 2. Step 1: Spec Compliance Check (规格合规检查)

### 2.1 检查内容

比对实现 vs 设计文档，检查是否遗漏需求：

```markdown
## Spec Compliance Report

### 检查项

| # | 设计需求 | 实现状态 | 差异 |
|---|---------|---------|------|
| 1 | 用户登录 API (POST /api/auth/login) | ✅ 已实现 | - |
| 2 | JWT Token 返回 (24h 有效期) | ⚠️ 部分实现 | 有效期设为 1h，需确认 |
| 3 | 登录失败次数限制 (5次/15min) | ❌ 未实现 | 需补充速率限制 |
| 4 | Refresh Token 机制 | ❌ 未实现 | 需补充 |
```

### 2.2 检查方法

```
1. 读取设计文档 (02-design.md)
2. 提取功能需求列表
3. 对比 Wave N 实现的文件和代码
4. 标记每个需求的实现状态: ✅/⚠️/❌
5. 生成 compliance_report.md
```

### 2.3 合规检查模板

```markdown
# Spec Compliance Report — Wave {N}

**日期**: {YYYY-MM-DD}
**Wave**: {N}/{total}
**审查级别**: {Light/Standard/Full}

## 检查结果摘要

- ✅ 已实现: {count}/{total}
- ⚠️ 部分实现: {count}/{total}
- ❌ 未实现: {count}/{total}

## 详细检查

### ✅ 已实现项

| 需求 | 实现文件 | 备注 |
|------|---------|------|
| {requirement} | {file}:{line} | - |

### ⚠️ 部分实现项

| 需求 | 差异描述 | 建议 |
|------|---------|------|
| {requirement} | {difference} | {suggestion} |

### ❌ 未实现项

| 需求 | 原因 | 影响 | Phase 6 审查标记 |
|------|------|------|----------------|
| {requirement} | {reason} | {impact} | 🔴 重点审查 |

## 决策

- 整体状态: [PASS/WARN/FAIL]
- 未实现项处理: [立即修复 / 推迟到下一Wave / Phase 6 审查]
```

---

## 3. Step 2: Code Quality Quick Scan (代码质量快速扫描)

### 3.1 扫描规则

| 检查项 | 严重度 | 扫描方法 | 触发条件 |
|--------|--------|---------|---------|
| console.log 残留 | HIGH | grep `console\.log` | 生产代码中出现 |
| any 类型使用 | MEDIUM | grep `: any\b` | TypeScript 代码中出现 |
| 未处理错误 | HIGH | grep `catch\s*\(\w*\)\s*\{\s*\}` | 空catch块 |
| TODO/FIXME 遗留 | LOW | grep `TODO\|FIXME\|HACK\|XXX` | 代码注释中出现 |
| 硬编码密钥 | CRITICAL | grep `password\|secret\|api_key\|token` | 字符串字面量中出现 |
| 未使用的导入 | LOW | TypeScript compiler `noUnusedLocals` | 编译时检查 |
| 魔术数字 | LOW | 正则匹配裸数字常量 | 代码中出现未命名常量 |
| 过长函数 | MEDIUM | 行数统计 | 函数 > 50 行 |
| 过深嵌套 | MEDIUM | 缩进层级统计 | 嵌套 > 4 层 |

### 3.2 扫描执行

```bash
# 代码质量快速扫描脚本
# 扫描本 Wave 修改的文件

CHANGED_FILES=$(git diff --name-only HEAD~1)

for file in $CHANGED_FILES; do
  # console.log 残留
  if grep -n "console\.log" "$file" 2>/dev/null; then
    echo "🔴 HIGH: console.log found in $file"
  fi

  # any 类型
  if grep -n ": any\b" "$file" 2>/dev/null; then
    echo "🟡 MEDIUM: 'any' type used in $file"
  fi

  # 空 catch 块
  if grep -Pn "catch\s*\(\w*\)\s*\{\s*\}" "$file" 2>/dev/null; then
    echo "🔴 HIGH: Empty catch block in $file"
  fi

  # 硬编码密钥
  if grep -Pn "(password|secret|api_key|apikey|token)\s*[=:]\s*['\"][^'\"]{8,}['\"]" "$file" 2>/dev/null; then
    echo "🔴 CRITICAL: Hardcoded secret in $file"
  fi

  # TODO/FIXME
  if grep -n "TODO\|FIXME\|HACK\|XXX" "$file" 2>/dev/null; then
    echo "🟢 LOW: TODO/FIXME comment in $file"
  fi
done
```

### 3.3 质量扫描报告模板

```markdown
# Quality Quick Scan Report — Wave {N}

**日期**: {YYYY-MM-DD}
**扫描文件数**: {count}

## 发现摘要

| 严重度 | 数量 |
|--------|------|
| CRITICAL | {count} |
| HIGH | {count} |
| MEDIUM | {count} |
| LOW | {count} |

## 详细发现

### CRITICAL

| # | 文件:行号 | 检查项 | 内容 |
|---|---------|--------|------|
| 1 | auth.ts:42 | 硬编码密钥 | `const apiKey = "sk-abc..."` |

### HIGH

| # | 文件:行号 | 检查项 | 内容 |
|---|---------|--------|------|
| 1 | login.ts:15 | console.log | `console.log("User logged in")` |
| 2 | auth.ts:28 | 空 catch 块 | `catch (e) {}` |

### MEDIUM

| # | 文件:行号 | 检查项 | 内容 |
|---|---------|--------|------|
| 1 | types.ts:5 | any 类型 | `const data: any = ...` |

## 自动修复建议

| # | 检查项 | 自动修复 | 状态 |
|---|--------|---------|------|
| 1 | console.log | 替换为 logger | 建议修复 |
| 2 | any 类型 | 替换为 unknown + 类型守卫 | 建议修复 |
```

---

## 4. Step 3: Change Boundary Check (变更边界检查)

### 4.1 检查逻辑

比对修改文件列表 vs 任务声明的文件范围，标记越界修改：

```
Task 声明范围: ["src/auth/login.ts", "src/auth/types.ts"]
实际修改文件: ["src/auth/login.ts", "src/auth/types.ts", "src/utils/helpers.ts"]
                                                    ↑ 越界修改！

检查结果:
  ✅ src/auth/login.ts — 在范围内
  ✅ src/auth/types.ts — 在范围内
  ⚠️ src/utils/helpers.ts — 越界修改！请确认是否必要
```

### 4.2 边界检查报告

```markdown
# Change Boundary Report — Wave {N}

**声明范围**: {declared_files}
**实际修改**: {actual_files}

## 检查结果

| 文件 | 状态 | 说明 |
|------|------|------|
| src/auth/login.ts | ✅ 范围内 | - |
| src/auth/types.ts | ✅ 范围内 | - |
| src/utils/helpers.ts | ⚠️ 越界 | 新增了 formatDate 工具函数 |

## 越界修改分析

| 文件 | 修改类型 | 是否必要 | 建议 |
|------|---------|---------|------|
| src/utils/helpers.ts | 新增函数 | 必要 | login.ts 需要日期格式化，但应考虑放到 auth/utils.ts |

## 决策

- 越界修改: {count} 处
- 必要越界: {count} 处
- 不必要越界: {count} 处
- 整体状态: [PASS/WARN/FAIL]
```

---

## 5. Step 4: Decision (审查决策)

### 5.1 决策矩阵

| 条件 | 决策 | 后续动作 |
|------|------|---------|
| 所有步骤 PASS | **PASS** | 继续下一 Wave |
| 有 WARN 但无 FAIL | **WARN** | 通知用户 + 标记 Phase 6 重点 |
| 有 FAIL (CRITICAL/HIGH) | **FAIL** | 暂停执行，修复后重试 |
| Spec 缺失项 > 30% | **FAIL** | 需求覆盖不足，需补充实现 |

### 5.2 决策输出

```markdown
## 📋 Wave {N} Real-time Review Decision

**审查级别**: {Light/Standard/Full}
**决策**: {PASS/WARN/FAIL}

### 审查结果

| 步骤 | 状态 | 详情 |
|------|------|------|
| Spec Compliance | ✅ PASS | 3/4 已实现，1 部分实现 |
| Quality Scan | ⚠️ WARN | 2 HIGH (console.log), 1 MEDIUM (any type) |
| Boundary Check | ✅ PASS | 1 越界修改（必要） |

### Phase 6 标记

- 🔴 重点审查: JWT 有效期实现（与设计不一致）
- 🟡 关注: console.log 清理

### 后续动作

→ [PASS/WARN] 继续下一 Wave
→ [FAIL] 暂停执行，修复以下问题:
  1. {issue_1}
  2. {issue_2}
```

### 5.3 消息板通知

审查完成后，通过 Agent Comms 消息板广播结果：

```markdown
# Agent Comms: Review Notification

**From**: real-time-review
**To**: *
**Type**: notify
**Priority**: {high/medium/low}
**Wave**: {N}

**Subject**: Wave {N} Review — {PASS/WARN/FAIL}

**Body**: 
  Spec Compliance: ✅ 3/4
  Quality Scan: ⚠️ 2 HIGH, 1 MEDIUM
  Boundary Check: ✅ 1 out-of-bounds (necessary)
  
  Phase 6 Focus: JWT validity period implementation

**Action Required**: {none/fix issues before next wave}
```

---

## 6. 与 Phase 6 的关联

### 6.1 审查结果积累

每个 Wave 的实时审查结果累积到 `.forgeos/<req-id>/reviews/`:

```
.forgeos/<req-id>/reviews/
├── wave-1-compliance.md
├── wave-1-quality.md
├── wave-1-boundary.md
├── wave-1-decision.md
├── wave-2-compliance.md
├── wave-2-quality.md
├── wave-2-boundary.md
├── wave-2-decision.md
└── review-summary.md        # 所有 Wave 审查汇总
```

### 6.2 Phase 6 参考

Phase 6 审查时，自动加载实时审查汇总：

```markdown
# Review Summary — Phase 6 Reference

## 整体统计

| Wave | Spec | Quality | Boundary | Decision |
|------|------|---------|----------|----------|
| 1 | ✅ 3/4 | ⚠️ 2H 1M | ✅ | WARN |
| 2 | ✅ 4/4 | ✅ 0H 0M | ✅ | PASS |
| 3 | ⚠️ 2/4 | ⚠️ 1H 2M | ⚠️ 2 OOB | WARN |

## Phase 6 重点审查项

🔴 JWT validity period (Wave 1 — spec 不一致)
🔴 Empty catch block in auth.ts (Wave 1 — HIGH quality)
🟡 Out-of-bounds: utils/helpers.ts (Wave 3 — evaluate)
```

---

## 7. Gate G5.5 定义

```
Gate G5.5: Phase 4 Wave 间审查门控

位置: Wave N 完成后 → Wave N+1 开始前
检查: 实时审查结果

规则:
  - 所有 Wave 的 Decision 为 PASS 或 WARN → Gate PASS
  - 任一 Wave 的 Decision 为 FAIL → Gate FAIL (需修复)
  - 无审查结果 → Gate PASS (降级模式，非 Strict 模式下)

降级:
  - real-time-review 不可用 → 跳过 G5.5，直接进入下一 Wave
  - 仅在 Strict/Audit 模式下 G5.5 是强制的
```

---

## 8. 配置

```json
{
  "real_time_review": {
    "enabled": true,
    "default_level": "standard",
    "strict_mode_levels": {
      "fast": "light",
      "standard": "standard",
      "strict": "full",
      "audit": "full"
    },
    "quality_scan_rules": {
      "console_log": "high",
      "any_type": "medium",
      "empty_catch": "high",
      "hardcoded_secrets": "critical",
      "todo_fixme": "low"
    },
    "boundary_check": {
      "enabled": true,
      "allow_necessary_out_of_bounds": true
    },
    "fail_threshold": {
      "critical_count": 1,
      "high_count": 3
    }
  }
}
```

---

## 9. 降级策略

| 场景 | 降级行为 |
|------|---------|
| 审查不可用 | 跳过实时审查，直接进入下一 Wave |
| 设计文档不存在 | 跳过 Spec Compliance 检查 |
| Git 不可用 | 跳过 Boundary Check |
| Token 预算不足 | 降级为 Light 级别 |
| Phase 非 Strict 模式 | G5.5 为 advisory（不阻断） |

---

## 10. 与其他模块协作

| 模块 | 协作方式 |
|------|---------|
| Agent Comms | 审查结果通过消息板广播 |
| Wave Executor | Wave 完成后触发审查 |
| Vector Memory | 搜索相关历史教训辅助审查 |
| Token Monitor | 审查过程受 Token 预算控制 |
| Phase 6 Review | 实时审查结果作为 Phase 6 输入 |
| Change Boundary Guard | Step 3 复用 boundary-check 逻辑 |
