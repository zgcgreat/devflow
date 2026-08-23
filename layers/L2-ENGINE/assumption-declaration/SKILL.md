---
name: assumption-declaration
version: 1.0.0
layer: L2-ENGINE
description: Phase 4 Task 开始前的假设声明步骤
---

# Assumption Declaration — 假设声明

## 流程

Phase 4 每个 Task 开始前，执行假设声明：

1. **假设清单**：列出当前 Task 的技术假设
2. **不确定项**：标记不确定的假设，需要确认
3. **执行计划**：基于假设制定执行计划

## 假设声明模板

```markdown
## Task: {task-name}

### 假设声明
- [假设1] JWT token 有效期 24 小时 → 需确认: 是否需要 refresh token?
- [假设2] 数据库使用 PostgreSQL → 需确认: 是否支持 MySQL?
- [假设3] 用户表已有 email 字段 → 需确认: 是否已存在

### 不确定项
- refresh token 策略 → 需用户确认
- 密码哈希算法 → 假设 bcrypt, 需确认

### 执行计划
1. 先实现确认的假设项
2. 对不确定项预留接口
3. 后续迭代解决不确定项
```

---

> 假设声明与变更边界检查互相补充：假设声明确认"做什么"，变更边界检查确认"改变了什么"。

---

## 参考

Karpathy Skills: Think Before Coding / Surgical Changes