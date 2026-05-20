# devflow 工作流宪法

> 本文件定义所有 Phase 必须遵守的强制性规则。各 Phase `_SKILL.md` 只需定义**差异化规则**，不再重复以下内容。
> 加载方式：每个 Phase skill 的上下文应自动包含本文件内容。

---

## 1. 门控不可跳过 (Gate Imperative)

- 任何 Phase 转换必须通过 Gate 检查
- Gate 检查使用标准三列表格：`| 检查项 | 通过条件 | 失败处理 |`
- Gate FAIL 时必须执行失败处理中指定的动作，不得静默继续
- 任何 Phase 都不得在 Gate 未通过的情况下进入下一 Phase

## 2. Verify 先于声明 (Evidence Before Assertion)

- 禁止在运行验证命令之前声称任务完成
- 每个完成声明必须有对应的 verify 命令输出作为证据
- "看起来完成了"、"应该没问题" 不构成有效证据
- verify 命令必须实际执行并返回零退出码

## 3. 单任务单 Commit (Atomic Commit)

- 一个原子任务对应一个 commit，禁止混合多任务变更
- Commit 格式：`<type>(<req-id>): <task-id> <subject>`
- Commit 不得包含无关文件的修改
- 未通过 verify 的任务不得提交

## 4. 失败时 Rollback 优先 (Rollback First on Failure)

- Verify 失败时先 rollback commit，再修复，再重试
- 不得在失败的代码基础上继续叠加修复
- Rollback 必须恢复到最后一个 verify 通过的状态
- 连续 3 次 P0 失败触发 Circuit Breaker，升级到专家审查

## 5. 层间依赖规则 (Layer Dependency Contract)

- L1-INTERACTION 不得直接引用 L3-ARCHITECTURE 的模块
- L1 必须通过 L2-ENGINE 的 core-bridge.js 间接访问 L3
- 违反层间依赖的代码必须在 Code Review 阶段被拦截

## 6. Error Taxonomy 标准 (Standard Error Classification)

所有 Phase 的错误分为四级，定义如下：

| Level | Name | Meaning | Response Pattern |
|-------|------|---------|-----------------|
| P0 | BLOCKING | 阻塞性错误，无法继续 | 停止执行，执行 recovery action，不进入下一 Phase |
| P1 | RECOVERABLE | 严重错误，有 workaround | 修复后继续，条件性通过 Gate |
| P2 | WARNING | 警告，不阻塞但需记录 | 记录并继续，Phase 完成前修复 |
| P3 | INFO | 信息提示，无需立即行动 | 标注为 tentative，后续迭代处理 |

## 7. Boundary Conditions 标准格式

所有 Phase 的 Boundary Conditions 必须包含以下子节：

```
### Thresholds
- **参数名**: 值（说明）

### Timeout
- 操作类型: ≤X min（超时处理）

### Input Schema Validation
- [ ] 前置产物检查项
```

## 8. 用户确认协议 (User Confirmation Protocol)

Phase 转换前必须向用户确认，使用多问题确认模式：

```
📍 当前阶段: Phase N · Name — Subtitle
🎯 本步目标: 确认 {objective}

---
**问题 1**: {question}
[1] ✅ {推荐选项} ← 推荐
[2] {替代选项}

**问题 2**: {question}
[1] ✅ {推荐选项} ← 推荐
[2] {替代选项}

**问题 N**: 是否同意进入下一阶段？
[1] ✅ 同意，继续 Phase N+1 ← 推荐
[2] 需要修改后重试
[3] 回退到 Phase N-1

请逐个回复，如 "1, 1, 1"
```

确认后需二次验证：
```
✅ 收到你的选择：
- 问题 1：{选项}
- 问题 2：{选项}

**确认以上选择：**
[1] ✅ 确认无误，继续 ← 推荐
[2] 需要修改
```

## 9. Provider 路由 (Model Routing)

每个 Phase 应声明推荐的模型类型：

| Phase | 推荐模型类型 | 理由 |
|-------|------------|------|
| 0 | 通用模型 | 创意捕获，不需要高分析能力 |
| 1 | 高分析模型 | 根因分析和需求拆解 |
| 2 | 高创造力模型 | 架构设计需要创造力 |
| 3 | 高分析模型 | DAG 分析和依赖判断 |
| 4 | 高代码模型 | 执行编码任务 |
| 5 | 高分析模型 | 全面测试覆盖判断 |
| 6 | 高分析模型 | 代码审查需要细致分析 |
| 7 | 通用模型 | 部署和监控 |

## 10. 触发式参考加载 (Triggered Reference Loading)

- 参考文件按需加载，不是每个 Phase 都加载所有参考
- 使用 `references/flow-kit-reference/` 下的参考文件
- 触发条件必须在 Phase 的执行流程中明确声明
- 无关参考文件的加载会浪费 token，必须避免

---

## 宪法生效范围

本宪法适用于 devflow v3.0 的 L1-INTERACTION 层所有 Phase skills（Phase 0-8 + YC/Shotgun/Discuss 变体）。L2-ENGINE 和 L3-ARCHITECTURE 层的模块遵循各自的层内规则。
