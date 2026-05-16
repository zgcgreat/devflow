# devflow-kit Stage: 6-Review（代码审查）

> **阶段定位**：三轮审查确保代码质量、安全、业务正确性
> **前置条件**：05-test-report.md 已完成且通过
> **后置产物**：审查问题清单 + 修复记录

## Skill元信息

```yaml
name: stage-6-review
version: 1.0.0
description: devflow-kit工作流第6阶段 - 三轮代码审查
author: devflow-kit
dependencies:
  - verification-before-completion
  - security-and-performance
```

## 输入

- `.devflow-kit/<req-id>/01-analysis.md`（或Delta版）
- `.devflow-kit/<req-id>/02-design.md`（或Delta版）
- `.devflow-kit/<req-id>/03-tasks.md`
- `.devflow-kit/<req-id>/05-test-report.md`
- `git diff`（本次改动的完整diff）
- `.devflow-kit/CONTEXT.md`

## 输出

- 审查问题清单（按轮次分类）
- 修复记录
- 更新 `.devflow-kit/STATE.md`

## 入口门禁

```markdown
IF 缺 05-test-report.md:
  输出: "规则 R2.7 触发：6-review 缺少 05-test-report.md。本次先回到 5-test 补齐。"
  STOP

IF 测试报告结论为"不通过":
  输出: "⚠️ 测试未通过，禁止进入审查阶段。请先修复测试问题。"
  STOP
```

## 执行流程

### Step 1: 读取前置产物

**⚠️ 强制规则**：必须先读取以下文件，提取关键信息后才能开始审查。

#### 1.1 读取需求分析（AC基线）

从 `.devflow-kit/<req-id>/01-analysis.md` 提取：
- **AC列表**：所有验收标准（用于验证实现是否覆盖）
- **非功能需求**：性能/安全要求（用于审查是否达标）

**自检**：
- ⏳ 已读取01-analysis.md
- ⏳ 已提取所有AC列表（至少N个）
- ⏳ 已识别非功能需求

#### 1.2 读取方案设计

从 `.devflow-kit/<req-id>/02-design.md` 提取：
- **技术决策**：设计时的架构选择（用于验证实现是否遵循）
- **数据流/架构图**：预期的调用链（用于验证实现是否符合）
- **ADR列表**：架构决策记录（用于验证实现是否遵守）

**自检**：
- ⏳ 已读取02-design.md
- ⏳ 已提取技术决策清单
- ⏳ 已理解数据流/架构图

#### 1.3 读取任务拆分与dev-log

从 `.devflow-kit/<req-id>/03-tasks.md` 和所有 `*-dev-log.md` 提取：
- **任务列表**：所有task及其write_files范围
- **dev-log**：每个任务的实施过程、verify输出、6维自查结果

**自检**：
- ⏳ 已读取03-tasks.md
- ⏳ 已读取所有dev-log（T01~TN）
- ⏳ 已确认所有verify通过

#### 1.4 读取测试报告

从 `.devflow-kit/<req-id>/05-test-report.md` 提取：
- **测试结果**：各轮测试通过率
- **AC覆盖矩阵**：每个AC的测试状态
- **性能指标**：P50/P95/P99响应时间

**自检**：
- ⏳ 已读取05-test-report.md
- ⏳ 已确认测试结论为“通过”
- ⏳ 已提取性能指标

### Step 2: 第一轮：代码质量审查

**目标**：检查代码规范性、可维护性

**检查维度**：

| 维度 | 工具/方法 | 标准 |
|---|----------|---|
| 代码风格 | ESLint/Pylint/gofmt | 0错误，0警告 |
| 复杂度 | Cyclomatic Complexity | 函数复杂度 ≤ 10 |
| 重复代码 | SonarQube/CPD | 重复率 < 3% |
| 命名规范 | 人工审查 | 语义清晰，无缩写歧义 |
| 注释质量 | 人工审查 | 公共API有文档注释 |
| 文件长度 | wc -l | 单文件 ≤ 500行 |

**执行**：
```bash
# 前端项目
npm run lint
npx eslint src/ --max-warnings=0

# Python项目
pylint src/ --fail-under=8.0

# Go项目
golangci-lint run
```

**记录问题**：
```markdown
## 第一轮：代码质量审查

**ESLint结果**:
- 错误: 0
- 警告: 2
  - ⚠️ src/utils/helper.ts:45 - Unexpected console statement
  - ⚠️ src/components/Modal.tsx:12 - Missing return type

**复杂度分析**:
- 🔴 src/services/notification.service.ts: createNotification() 复杂度=15（超标）
  - 建议: 拆分为 validate/create/publish 三个函数

**重复代码**:
- 🟡 src/utils/date.ts 与 src/lib/time.ts 有30%重复
  - 建议: 合并到 src/utils/time.ts
```

**判定**：
- 🔴 Critical → 必须修复才能继续
- 🟡 Major → 记入问题清单，建议修复
- 🟢 Minor → 不阻塞，可选修复

### Step 3: 第二轮：安全审查

**目标**：检查安全漏洞、权限控制

**检查维度**：

| 维度 | 检查项 | 方法 |
|---|--------|---|
| SQL注入 | 拼接SQL语句 | grep + 人工审查 |
| XSS攻击 | 未转义的用户输入 | grep innerHTML/document.write |
| 权限控制 | 越权访问 | 审查API鉴权逻辑 |
| 敏感数据 | 明文存储密码/密钥 | grep password/secret/token |
| 依赖漏洞 | npm/pip包漏洞 | npm audit / pip-audit |
| CSRF防护 | 表单无token | 审查POST请求 |
| 速率限制 | API无限流 | 审查中间件配置 |

**执行**：
```bash
# 依赖漏洞扫描
npm audit
# 或
pip-audit

# SAST静态分析（如已安装）
semgrep scan
# 或
sonar-scanner
```

**记录问题**：
```markdown
## 第二轮：安全审查

**依赖漏洞**:
- 🔴 high: lodash < 4.17.21 - Prototype Pollution
  - 修复: npm install lodash@4.17.21
  
**SQL注入风险**:
- 🟡 src/repos/user.repo.ts:23 - 使用字符串拼接
  ```typescript
  // ❌ 危险
  const sql = `SELECT * FROM users WHERE name = '${name}'`;
  
  // ✅ 安全
  const sql = 'SELECT * FROM users WHERE name = $1';
  await db.query(sql, [name]);
  ```

**权限控制**:
- ✅ 所有API都有JWT鉴权
- ✅ 敏感操作有角色检查
- 🟡 DELETE /api/notifications/:id 缺少owner检查
  - 建议: 增加 `if (notification.userId !== currentUser.id) throw Forbidden`
```

**判定**：
- 🔴 Critical → 必须立即修复（安全漏洞）
- 🟡 Major → 上线前必须修复
- 🟢 Minor → 可后续优化

### Step 4: 第三轮：业务逻辑审查

**目标**：验证AC覆盖、边界条件、异常处理

**检查维度**：

| 维度 | 检查项 | 方法 |
|---|--------|---|
| AC覆盖 | 每个AC都有对应实现 | 对照01-analysis.md |
| 边界条件 | 空值/极值/并发 | 审查测试用例 |
| 异常处理 | try-catch覆盖 | grep错误处理 |
| 日志记录 | 关键操作有日志 | grep console.log/logger |
| 事务一致性 | 多步操作有事务 | 审查数据库操作 |
| 幂等性 | 重试不重复执行 | 审查唯一键/去重逻辑 |

**执行**：
逐一对比AC和实现：

```markdown
## 第三轮：业务逻辑审查

**AC覆盖检查**:

| AC ID | 实现位置 | 测试覆盖 | 判定 |
|---|---------|---|------|
| AC-1 | notification.service.ts:45 | ✅ 单元测试 | ✅ |
| AC-2 | notification.controller.ts:23 | ✅ 集成测试 | ✅ |
| AC-3 | notification.repo.ts:67 | ⚠️ 缺边界测试 | 🟡 |
| AC-4 | cache.middleware.ts:12 | ✅ 性能测试 | ✅ |

**边界条件**:
- 🟡 AC-3缺少"用户ID不存在"的测试
  - 建议: 增加 test('should throw when user not found')

**异常处理**:
- ✅ 所有DB操作有try-catch
- 🟡 MQ发布失败只记录日志，无重试
  - 建议: 增加指数退避重试机制

**事务一致性**:
- ✅ 通知创建使用事务
- ✅ 缓存失效在事务内
```

**判定**：
- 🔴 Critical → AC未实现或有严重bug
- 🟡 Major → 边界条件缺失或异常处理不完善
- 🟢 Minor → 日志/注释可优化

### Step 4: 汇总问题清单

将三轮审查的问题汇总：

```markdown
## 审查问题汇总

**🔴 Critical（必须修复）**:
1. [R1] createNotification() 复杂度过高（15 > 10）
2. [R2] lodash存在高危漏洞
3. [R3] AC-3未完全实现

**🟡 Major（建议修复）**:
1. [R1] 日期工具有重复代码
2. [R2] DELETE接口缺少owner检查
3. [R2] SQL拼接有风险
4. [R3] 缺少边界条件测试
5. [R3] MQ发布无重试机制

**🟢 Minor（可选优化）**:
1. [R1] 2个ESLint警告
2. [R3] 部分函数缺少JSDoc
```

### Step 5: 修复验证

对每个🔴和🟡问题：
1. 开发者修复
2. 重新运行相关测试
3. 确认问题已解决

**记录修复**：
```markdown
## 问题修复记录

**🔴 Critical**:
- ✅ R1-1: createNotification() 已拆分为3个函数，复杂度降至8
- ✅ R2-1: lodash已升级到4.17.21，npm audit通过
- ✅ R3-1: AC-3已补充边界测试，测试通过

**🟡 Major**:
- ✅ R1-2: 日期工具已合并
- ✅ R2-2: DELETE接口已增加owner检查
- ✅ R2-3: SQL已改为参数化查询
- ⏳ R3-2: 边界测试待补充（排期下周）
- ⏳ R3-3: MQ重试机制待实现（排期下周）
```

### Step 6: 读取模板并提取段落清单

**⚠️ 强制规则**：必须使用 `read_file` 工具读取模板文件。

```python
# 伪代码示例
read_file("templates/06-审查报告.md")
```

**从模板中提取必填段落清单**：
```
□ 三轮审查结果汇总
□ 问题清单及修复状态
□ 审查结论
```

**注意**：
- 所有3个段落都必须包含，不得省略
- 每轮审查必须有量化数据
- 审查结论必须明确（通过/有条件通过/不通过）

### Step 7: 生成审查报告并逐项核对

按模板生成 `.devflow-kit/<req-id>/06-审查报告.md`：
- **必须包含模板所有3个段落**（见 Step 6 提取的清单）
- **所有 `<...>` 占位符必须替换为实际值**
- **🔴问题必须全部修复**

**生成后核对**：
```markdown
产物核对清单：
- ⏳ 三轮审查结果汇总 → 已包含（代码质量/安全/业务逻辑）
- ⏳ 问题清单及修复状态 → 已包含（Critical/Major/Minor）
- ⏳ 审查结论 → 已包含（通过/有条件通过/不通过）
```

**如果有缺失**：立即补齐，不得进入下一步。

**判定标准**：
- ✅ **通过**：无🔴问题，🟡问题≤3个且有修复计划
- ⚠️ **有条件通过**：无🔴问题，🟡问题>3个但不阻塞核心功能
- ❌ **不通过**：存在🔴问题未修复

**输出**：
```markdown
## 审查结论

**结论**: ✅ 通过

**理由**:
- 无Critical问题
- 3个Major问题已全部修复
- 2个Minor问题已排期优化

**下一步**: 进入 7-integration 阶段
```

### Step 8: 更新项目状态

```markdown
当前阶段: review
阶段状态: completed
上次完成阶段: review
下一阶段: integration
```

## 自检清单

- ⏳ **已使用 read_file 读取模板文件** `templates/06-审查报告.md`
- ⏳ **已从模板提取必填段落清单**（3个段落）
- ⏳ **已读取所有前置产物**（01需求分析/02方案设计/03任务拆分/05测试报告/dev-log）
- ⏳ **已提取AC列表**（用于验证覆盖）
- ⏳ 三轮审查全部完成（代码质量/安全/业务逻辑）
- ⏳ 所有🔴问题已修复
- ⏳ 🟡问题有明确的修复计划或接受理由
- ⏳ AC覆盖100%
- ⏳ **产物包含模板所有3个段落**（见 Step 7 核对清单）
- ⏳ **所有占位符已替换**
- ⏳ **生成后已逐项核对**（无缺失段落）
- ⏳ 审查问题清单已记录
- ⏳ 修复验证已通过
- ⏳ STATE.md已更新

## 约束

- **禁止**跳过任何一轮审查
- **禁止**🔴问题未修复就声称通过
- **必须**每轮审查有量化数据（不只是"检查了"）
- Strict模式**必须**执行SAST静态分析

## 触发下一步

**输出审查报告后，必须等待用户确认**：

```markdown
代码审查完成，结果如下：
- 🔴 Critical: X个（已修复/未修复）
- 🟡 Major: X个（已修复/接受风险）
- 🟢 Minor: X个

请确认或选择：
1. ✅ 审查通过，进入集成发布（7-integration）
2. 🔧 有问题需要修复，回到开发（4-dev）
3. ⚠️ 接受风险，继续发布（说明理由）
```

- 用户确认审查通过 → 加载 `skills/stage-skills/stage-7-integration/_SKILL.md`
- 审查不通过 / 用户要求修复 → 回到 stage-4-dev 修复问题

## 错误处理

- 发现新bug → 记录问题，评估是否阻塞
- AC实现有误 → 回到4-dev修正
- 安全漏洞 → 立即修复，不得延期
- 审查意见分歧 → 提交团队讨论，记录决策

