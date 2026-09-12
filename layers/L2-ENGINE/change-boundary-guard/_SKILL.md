---
name: change-boundary-guard
preamble-tier: 2
version: 1.0.0
layer: L2-ENGINE
gate: internal
requires: [wave-executor]
provides: [boundary-declaration, boundary-check, out-of-bounds-alert]
description: |
  变更边界检查 — Phase 4 Task 开始前声明变更范围，提交前比对实际修改文件。
  越界修改触发确认，防止意外影响其他模块。
  参考: Karpathy Skills Surgical Changes。
source: CHANGELOG v1.3.0 — Karpathy Skills surgical changes
dependencies:
  - wave-executor (Task 执行上下文)
  - real-time-review (Step 3 复用)
  - agent-comms (越界通知广播)
triggers:
  - Phase 4 Task 开始前（声明范围）
  - Phase 4 Task 完成后（比对检查）
  - Phase 4 Wave 实时审查 Full 级别
---

# Change Boundary Guard — 变更边界检查

> **核心问题**: Phase 4 Task 实施中，Agent 可能修改超出任务范围的文件，产生意外副作用。
> **解决方案**: Task 开始前声明变更范围，完成后比对实际修改，越界修改触发确认。

---

## 1. 变更边界声明协议

### 1.1 Task 开始前声明

每个 Phase 4 Task 开始前，声明预期修改的文件列表：

```markdown
## Task: auth-service-login

### 变更范围声明

**预期修改**:
- src/auth/login.service.ts    — 实现登录逻辑
- src/auth/login.controller.ts — 添加登录路由
- src/auth/auth.module.ts      — 注册 LoginService

**预期新增**:
- src/auth/login.service.spec.ts — 登录服务测试

**预期不修改**:
- src/auth/register.service.ts   — 注册逻辑不涉及
- src/shared/database.module.ts  — 数据库配置不变

**跨模块影响**: 无
```

### 1.2 声明格式

```yaml
boundary_declaration:
  task_id: "{task-id}"
  declared_modify: ["file1.ts", "file2.ts"]
  declared_create: ["file3.spec.ts"]
  declared_no_change: ["file4.ts"]  # 可选
  cross_module_impact: "none" | "low" | "high"
  declared_by: "{agent-name}"
  declared_at: "{timestamp}"
```

---

## 2. 变更边界检查

### 2.1 Task 完成后比对

```
Task 完成:
  │
  ├─→ git diff --name-only (获取实际修改文件列表)
  │
  ├─→ 比对: actual_files vs declared_modify + declared_create
  │
  ├─→ 分类:
  │   ├─ ✅ 在范围内 (declared_modify/declared_create)
  │   ├─ ⚠️ 越界修改 (未声明的文件)
  │   └─ 🔴 危险越界 (declared_no_change 中的文件被修改)
  │
  └─→ 输出: boundary_report.md
```

### 2.2 检查规则

| 检查项 | 规则 | 严重度 |
|--------|------|--------|
| 在范围内 | 文件在 declared_modify/declared_create 中 | ✅ PASS |
| 越界修改 | 文件未在声明中 | ⚠️ WARN |
| 危险越界 | 文件在 declared_no_change 中被修改 | 🔴 FAIL |
| 缺少声明 | 未做变更范围声明 | 🟡 INFO |

### 2.3 边界检查报告

```markdown
# Change Boundary Report — Task {task-id}

**声明范围**: {declared_count} 文件
**实际修改**: {actual_count} 文件

## 检查结果

| 文件 | 状态 | 说明 |
|------|------|------|
| src/auth/login.service.ts | ✅ 范围内 | 已声明 |
| src/auth/login.controller.ts | ✅ 范围内 | 已声明 |
| src/utils/helpers.ts | ⚠️ 越界 | 新增了 formatDate 函数 |
| src/shared/database.module.ts | 🔴 危险越界 | 声明不修改但被修改 |

## 越界分析

| 文件 | 修改类型 | 是否必要 | 建议 |
|------|---------|---------|------|
| src/utils/helpers.ts | 新增函数 | 必要 | 考虑移到 auth/utils.ts |
| src/shared/database.module.ts | 修改导入 | 不必要 | 回滚此修改 |

## 决策

- 越界修改: 2 处
- 危险越界: 1 处 (必须修复)
- 状态: [PASS/WARN/FAIL]
```

---

## 3. 越界处理

### 3.1 处理流程

```yaml
out_of_bounds_handling:
  warn:
    action: 提示确认
    options:
      - "确认必要" → 记录为合理越界
      - "回滚修改" → git checkout 恢复
      - "调整声明" → 更新变更范围声明
  
  fail:
    action: 必须修复
    options:
      - "回滚修改" → git checkout 恢复 (推荐)
      - "更新声明 + 用户确认" → 用户确认后才继续
```

### 3.2 Agent Comms 通知

越界修改通过消息板广播：

```markdown
# Agent Comms: Boundary Alert

**From**: change-boundary-guard
**To**: *
**Type**: error
**Priority**: high

**Subject**: Task {task-id} 越界修改

**Body**: 
  声明范围: {declared_files}
  实际修改: {actual_files}
  越界: {out_of_bounds_files}
  
  危险越界: {dangerous_files}
```

---

## 4. 配置

```json
{
  "change_boundary_guard": {
    "enabled": true,
    "require_declaration": true,
    "strict_mode": {
      "fast": false,
      "standard": true,
      "strict": true
    },
    "fail_on_dangerous_violation": true,
    "warn_on_undclared": true
  }
}
```

---

## 5. 与其他模块协作

| 模块 | 协作方式 |
|------|---------|
| real-time-review | Step 3 复用 boundary-check 逻辑 |
| agent-comms | 越界通知广播 |
| wave-executor | Task 上下文提供声明接口 |
| Phase 4 Build | Step 集成边界声明和检查 |
