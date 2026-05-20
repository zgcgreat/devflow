---
name: phase-5-test
description: Phase 5 测试阶段 — 测试策略制定、测试用例执行、覆盖度验证与 Bug 修复循环
preamble-tier: 2
version: 3.0-draft
layer: L1-INTERACTION
phase: 5
requires: [g5-gate-decision, wave-summaries, code-commits]
provides: [test-report, coverage-metrics, bug-fix-commits, g6-gate-decision]
source: 交互层 Phase 5 + 引擎层 QA
dependencies:
  - writing-plans
gate: G6
triggers:
  - "运行测试"
  - "验证功能"
  - "test phase"
  - "单元测试"
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
---

# Phase 5: 测试 (浏览器 QA + 交叉波测试矩阵)

> **Layer**: L1-INTERACTION (交互层) → Layer 3 QA 介入
> **前置产物**: `03-tasks.md` Phase 4 所有 Wave 完成
> **后置产物**: `.specs/test/05-test-results.md` (标准化路径,统一命名为 `05-test-results.md`)
> **门控**: G5-PHASE5 — Test Quality Gate（通过才能进入 Phase 6 审查）

## 输入

- `03-tasks.md` — 原始任务列表 + Verify 命令
- Phase 4 生成的所有代码变更
- LESSONS.md — 过往测试经验（重点关注失败的验证场景）

## 输出

- `05-test-results.md` — 测试报告,包含:
  - 功能测试用例执行结果
  - 边界条件测试覆盖度
  - 交叉波测试矩阵分析
  - 回归测试完整性检查
  - 遗留问题清单（含严重等级）

## 执行流程

### Step 0: 触发式参考加载（flow-kit 测试金字塔）

> 来源: `references/flow-kit-reference/test-pyramid.md` — 5 轮测试操作手册。
> **触发条件**: Phase 5 需要执行测试验证（所有 Wave 完成后）。
> **跳过条件**: 无（Phase 5 固定执行本步）。

**加载流程**:

1. **读取 `references/flow-kit-reference/test-pyramid.md`** — 5 轮测试的完整操作手册:
   - **第 1 轮: 功能测试** — AC 覆盖、边界条件、异常路径
   - **第 2 轮: 性能测试** — 响应时间/吞吐/并发/资源泄漏
   - **第 3 轮: 安全测试** — OWASP Top 10/XSS/CSRF/SQL 注入/鉴权
   - **第 4 轮: 兼容性测试** — 浏览器/OS/分辨率/移动端
   - **第 5 轮: 可观测性测试** — 日志/指标/追踪/告警

2. **使用适用矩阵（适用矩阵见 test-pyramid.md）** — 按项目类型匹配测试轮次:
   | 项目类型 | 必测轮次 | 选测轮次 |
   |----------|---------|---------|
   | 前端 SaaS | 功能 + 兼容 + 安全 | 性能 + 可观测性 |
   | 后端 API | 功能 + 安全 + 性能 | 可观测性 |
   | CLI/SDK | 功能 | 性能 |

3. **按轮次顺序执行** — 每轮测试输出到 `05-test-results.md` 的对应段落。

---

### Step 1: 加载前置上下文

1. 读取 `03-tasks.md`,提取所有 AC(验收标准)→ 转化为测试用例
2. 读取 Phase 4 的 `.specs/waves/wave-{N}/SUMMARY.md` (标准化路径) → 确认所有代码变更范围
3. 读取 LESSONS.md → 加载历史失败场景到测试计划中

> **修复 (2024-05-17)**: WAVE-N-SUMMARY.md 引用统一为 `.specs/waves/wave-{N}/SUMMARY.md`,与 Wave Executor 写入路径一致。

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

### Step 5: G5-PHASE5 门控检查

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| AC 覆盖率 | ≥ 90% AC 有对应测试用例 | 补充遗漏 AC 的测试 |
| Verify 通过率 | Phase 4 所有 verify 重新执行通过 | 回滚失败的代码变更 |
| 边界测试 | ≥ 3 个边界场景已验证 | 追加边界测试用例 |
| 回归测试 | Wave N+1 依赖模块已回归 | 补充回归测试 |
| 遗留问题清单 | 所有已知问题已记录并分级 | Critical 项必须修复 |

### Step 6: Post-Wave File Existence Verification

Before declaring Phase 5 complete, verify the output artifact exists:

```bash
# Verify Phase 5 output file was created
if [ -f ".specs/test/05-test-results.md" ] && [ "$(wc -l < .specs/test/05-test-results.md)" -gt 10 ]; then
    echo "PASS: Phase 5 output artifact verified (.specs/test/05-test-results.md, $(wc -l < .specs/test/05-test-results.md) lines)"
else
    echo "FAIL: Phase 5 output artifact missing or empty"
    exit 1
fi

# Validate test content has summary indicators
grep -qE "PASS|FAIL|✓|✗" ".specs/test/05-test-results.md" || {
    echo "WARN: No PASS/FAIL indicators found in test results"
}
```

### Step 7: 用户确认

> 格式参考: `CONSTITUTION.md` 规则 #8（用户确认协议）

📍 当前阶段: Phase 5 · Test — Test Results Review
🎯 本步目标: 确认测试通过率和遗留问题

**问题 1**: 测试结果是否符合预期？
[1] ✅ 全部通过/可接受 ← 推荐
[2] 有失败需要修复
[3] 查看测试详情

**问题 2**: AC 覆盖率是否达标（≥90%）？
[1] ✅ 覆盖率达标 ← 推荐
[2] 覆盖率不足，需要补充
[3] 查看覆盖率详情

**问题 3**: 遗留问题是否可以接受？
[1] ✅ 遗留问题可接受 ← 推荐
[2] 需要修复 Critical 项
[3] 查看遗留问题

**结果处理**:
- **全部通过** → 标记 Phase 5 completed，进入 Phase 6
- **有失败** → 创建修复 Task（T<NN>-fix），回退到 Phase 4

---

### 可执行命令示例

```bash
# Run verify commands from each wave's summary and check pass rate
for wave_summary in .specs/waves/wave-*/SUMMARY.md; do
    echo "=== $wave_summary ==="
    grep -A1 "verify:" "$wave_summary" || echo "  No verify commands found"
done

# Calculate AC coverage percentage (need ≥90%)
python -c "
import re
with open('03-tasks.md') as f:
    ac_count = len(re.findall(r'AC-\d+', f.read()))
test_count = sum(1 for line in open('05-test-results.md') if 'PASS' in line)
coverage = test_count / ac_count * 100 if ac_count else 0
print(f'AC Coverage: {coverage:.1f}% ({test_count}/{ac_count})')
assert coverage >= 90, f'Coverage {coverage:.1f}% below 90% threshold'
"

# Validate no Critical items in known issues list
python -c "
with open('05-test-results.md') as f:
    content = f.read()
issues = re.findall(r'\[Critical\]', content) if '遗留问题' in content else []
print(f'Known critical issues: {len(issues)}')
"

# Check all wave summaries have valid verify status
for f in .specs/waves/wave-*/SUMMARY.md; do
    grep -q "all verified" "$f" || echo "WARN: $f missing 'all verified' status"
done
```

---

## Error Taxonomy (Phase 5 Test 专属)

| Level | Name | Symptom | Recovery Action | Wave Impact |
|-------|------|---------|-----------------|-------------|
| P0 | AC_UNCOVERED | ≥10% AC lacks test case → G5-PHASE5 FAIL threshold exceeded | Generate missing test cases, re-execute Phase 4 verification | Blocks Phase 6 Review; return to Phase 4 for fixes |
| P1 | CROSS_WAVE_REGRESSION | Wave N+1 module breaks due to Wave N change | Isolate breaking commit, revert, create T-fix task | No cross-wave impact beyond Wave N-1 |
| P2 | EDGE_CASE_GAP | Missing boundary scenario (>3 confirmed gaps) | Add targeted test cases for null/empty/concurrent | Continue to Phase 6 with known gaps documented |
| P3 | TEST_FLAKY | Intermittent fail rate >5% in repeat runs | Flag as flaky, run 3x isolation test, defer if unresolved | No blocking; log as technical debt |

## Boundary Conditions (Phase 5 Test)

### Thresholds
- **AC Coverage**: ≥90% AC必须有对应测试用例（G5-PHASE5 FAIL if <90%）
- **Verify Re-run**: Phase 4所有verify命令必须重新执行通过（100% pass率）
- **Boundary Testing**: ≥3个边界场景已验证（空值/异常路径/并发/大文件）
- **Regression Scope**: Wave N+1依赖模块必须回归测试

### Timeout
- Standard test execution: ≤20 min per phase
- If exceeded: prioritize AC tests first, defer edge cases to Phase 6 known-gaps list

### Input Schema Validation
- [ ] Phase 4 all Waves completed with verified summaries
- [ ] `03-tasks.md` contains complete verify commands for all tasks
- [ ] WAVE-N-SUMMARY.md exists for each wave
- [ ] AC list from Phase 1/3 is extracted and ready for test case mapping

## Provider 路由

- Phase 5 → **高分析能力模型**（需要全面测试覆盖判断）

---

> **关联规则**: R2 (三档模式), R5 (测试纪律)
> **参考文件**: `references/RULES-v3.md` R1-R20, `references/prompts/5-test.md`
