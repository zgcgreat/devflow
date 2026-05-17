# Phase 5: 测试 (浏览器 QA + 交叉波测试矩阵)

> **Layer**: L1-INTERACTION (SuperCorp 交互层) → Layer 3 QA 介入
> **前置产物**: `03-tasks.md` Phase 4 所有 Wave 完成
> **后置产物**: `.ultimate-workflow/<req-id>/05-test-report.md`
> **门控**: G5 — Test Quality Gate（通过才能进入 Phase 6 审查）

## Skill元信息

```yaml
name: phase-5-test
version: 3.0-draft
layer: L1-INTERACTION (协调), L3-ARCHITECTURE (QA)
source: SuperCorp Phase 5 + Mega-Workflow QA
dependencies:
  - writing-plans
v3_upgrade:
  cross_wave_matrix: true (Wave N tests → Wave N+1 coverage check)
```

## 输入

- `03-tasks.md` — 原始任务列表 + Verify 命令
- Phase 4 生成的所有代码变更
- LESSONS.md — 过往测试经验（重点关注失败的验证场景）

## 输出

- `05-test-report.md` — 测试报告，包含：
  - 功能测试用例执行结果
  - 边界条件测试覆盖度
  - 交叉波测试矩阵分析
  - 回归测试完整性检查
  - 遗留问题清单（含严重等级）

## 执行流程

### Step 1: 加载前置上下文

1. 读取 `03-tasks.md`，提取所有 AC（验收标准）→ 转化为测试用例
2. 读取 Phase 4 的 `WAVE-N-SUMMARY.md` → 确认所有代码变更范围
3. 读取 LESSONS.md → 加载历史失败场景到测试计划中

### Step 2: 功能测试执行

为每个 AC 生成并执行测试用例：

```markdown
### Test Case: <AC ID>
**前置条件**: ...
**操作步骤**: ...
**期望结果**: ...
**实际结果**: ...
**状态**: PASS/FAIL
**失败详情**: (如失败)
```

验证命令按 `03-tasks.md` 中的 verify 字段执行。

### Step 3: 交叉波测试矩阵分析

检查 Phase 4 各 Wave 之间的依赖关系：

| Wave N | Wave N+1 依赖 | 回归风险 | 需要重新测试的模块 |
|--------|--------------|---------|------------------|
| W1 (DB Schema) | W2 (API) | 高 | API 端点参数校验 |
| W2 (API) | W3 (Frontend) | 中 | Frontend 数据绑定 |

### Step 4: 边界条件测试

- **空值/Null**: 所有输入字段的边界值
- **异常路径**: API 错误码、网络超时、数据库连接失败
- **并发场景**: 多用户同时操作同一资源
- **大文件**: 文件上传的大小限制边界

### Step 5: G5 门控检查

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| AC 覆盖率 | ≥ 90% AC 有对应测试用例 | 补充遗漏 AC 的测试 |
| Verify 通过率 | Phase 4 所有 verify 重新执行通过 | 回滚失败的代码变更 |
| 边界测试 | ≥ 3 个边界场景已验证 | 追加边界测试用例 |
| 回归测试 | Wave N+1 依赖模块已回归 | 补充回归测试 |
| 遗留问题清单 | 所有已知问题已记录并分级 | Critical 项必须修复 |

### Step 6: 输出完成声明，停等用户确认

- **全部通过** → 标记 Phase 5 completed，进入 Phase 6
- **有失败** → 创建修复 Task（T<NN>-fix），回退到 Phase 4

## Provider 路由

- Phase 5 → **高分析能力模型**（需要全面测试覆盖判断）

---

> **关联规则**: R2 (三档模式), R5 (测试纪律)
> **参考文件**: `references/RULES-v3.md` R1-R20, `references/prompts/5-test.md`
