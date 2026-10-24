# DevFlow 宪法

> 跨域强制规则。所有 domain 模块和 Phase 必须遵守。这是 OS 的"硬约束层"。
> 谱系: DevFlow 统一进化引擎（当前版本见 VERSION / package.json）

## 1. 门控不可跳过

- 任何 Phase 转换必须通过 Gate 检查
- Gate FAIL → 执行失败处理动作，不得静默继续
- Fast/Lean 模式可跳过非必要 Gate，但必须声明跳过原因

## 2. 产物先于声称 (Verify Before Assertion)

- 禁止在运行验证之前声称任务完成
- 每个完成声明必须有关联的 verify 命令输出证据
- verify 命令必须实际执行并返回零退出码

## 3. 单任务单 Commit (Atomic Commit)

- 一个原子任务对应一个 commit，禁止混合多任务变更
- Commit 格式: `<type>(<req-id>): <task-id> <subject>`
- 未通过 verify 的任务不得提交

## 4. 失败时 Rollback 优先

- Verify 失败时先 rollback commit，再修复，再重试
- 不得在失败的代码基础上继续叠加修复
- 连续 3 次 P0 失败触发 Circuit Breaker，升级到专家审查

## 5. 层间依赖规则

- L1-INTERACTION 不得直接引用 L3-ARCHITECTURE 的模块
- L1 必须通过 L2-ENGINE 间接访问 L3
- 违反层间依赖的代码必须在 Code Review 阶段被拦截

## 6. Error Taxonomy 标准

| Level | Name | Response |
|-------|------|----------|
| P0 | BLOCKING | 停止执行，执行 recovery，不进入下一 Phase |
| P1 | RECOVERABLE | 修复后继续，条件性通过 Gate |
| P2 | WARNING | 记录并继续，Phase 完成前修复 |
| P3 | INFO | 标注为 tentative，后续迭代处理 |

## 7. 用户确认协议

- Phase 转换前必须向用户确认，使用多问题确认模式
- Hook 自动检查结果作为确认输入信号，最终决策权在人工
- Hook FAIL ≠ Gate FAIL，Hook 仅推荐

## 8. 记忆不可丢弃

- 每个决策写入 memory 域
- 跨会话加载时自动注入历史决策

## 9. Provider 路由

- 每个 Phase 声明推荐的模型类型
- Persona 的 model 字段由 Provider Gateway 统一调度

## 10. 触发式参考加载

- 参考文件按需加载，不是每个 Phase 都加载所有参考
- 触发条件必须在 Phase 的执行流程中明确声明

## 11. 安全防御底线

- 不引入硬编码密钥/密码/Token
- 不引入 SQL 拼接/命令注入
- 不引入 XSS/SSRF 路径
- 所有新 API 端点必须含认证检查
- 详见 `rules/prompt-defense-baseline.md`

## 12. 双维度自适应

- Scale 维度 (Lite/Standard/Enhanced/Advanced) 联合驱动加载策略
- TechStack 维度 (Python/Go/Rust/...) 触发扩展 Persona 加载
- Token 增幅硬性约束: Standard 模式 ≤ 30%
