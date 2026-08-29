---
name: phase-5-test
description: Phase 5 测试阶段 — 测试策略制定、测试用例执行、覆盖度验证与 Bug 修复循环
preamble-tier: 2
version: 3.0.0
layer: L1-INTERACTION
phase: 5
requires: [g5-gate-decision, wave-summaries, code-commits]
provides: [test-report, coverage-metrics, bug-fix-commits, g6-gate-decision, all-tests-passed]
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

# Phase 5: 测试 (QA + 交叉波测试矩阵)

> **前置产物**: Phase 4 所有 Wave 完成
> **后置产物**: `.forgeos/test/05-test-report.md`
> **门控**: G6 — Test Quality Gate

## 输入

- `03-tasks.md` — 原始任务列表 + Verify 命令
- Phase 4 生成的所有代码变更
- LESSONS.md — 过往测试经验

## 输出

- `05-test-report.md` — 功能测试 + 边界条件 + 交叉波矩阵 + 回归测试 + 遗留问题

## 执行流程

详见 `docs/phases/phase-5-test.md`

**步骤摘要**:
1. **Step 0**: 触发式参考加载 — 加载 `references/test-pyramid.md` (5轮测试)
2. **Step 1**: 加载前置上下文 — AC→测试用例 + Wave SUMMARY + LESSONS
3. **Step 2**: 功能测试执行 — 每个 AC 生成并执行测试用例
4. **Step 3**: 交叉波测试矩阵 — Wave N↔N+1 依赖回归检查
5. **Step 4**: 边界条件测试 — 空值/异常路径/并发/大文件
6. **Step 5**: G6 门控检查
7. **Step 5.5**: 浏览器 QA (v1.1, 仅前端项目) — Playwright e2e + 截图对比 + Bug 报告
8. **Step 6**: 产物验证 — 05-test-report.md 存在且含 PASS/FAIL 标记
9. **Step 7**: 用户确认

> **测试金字塔适用矩阵**:
> | 项目类型 | 必测轮次 | 选测轮次 |
> |----------|---------|---------|
> | 前端 SaaS | 功能+兼容+安全 | 性能+可观测性 |
> | 后端 API | 功能+安全+性能 | 可观测性 |
> | CLI/SDK | 功能 | 性能 |

## G6 门控检查

### Step 1: Hook 自动检查 (推荐, L1+)

| Hook | 类型 | 检查内容 |
|------|------|---------|
| security-scan | stop | OWASP 安全扫描 (注入/SSRF/敏感数据) |
| context-monitor | advisory | 上下文预算状态 |

> L0 环境: 参照 `hooks/checklist-fallback.md` 手动检查

### Step 2: 人工决策 (最终)

| 检查项 | 通过条件 | 失败处理 |
|--------|---------|----------|
| AC 覆盖率 | ≥90% | 补充遗漏 AC 测试 |
| Verify 通过率 | 100% pass | 回滚失败代码变更 |
| 边界测试 | ≥3 场景已验证 | 追加边界测试 |
| 回归测试 | Wave N+1 依赖模块已回归 | 补充回归测试 |
| 遗留问题 | 所有已知问题已记录分级 | Critical 必须修复 |

> Hook FAIL ≠ Gate FAIL。Hook 仅推荐，最终决策权在人工确认。

**Gate G6.5** (浏览器 QA, 仅前端):
- Strict/Audit: P0+P1 阻断
- Standard: 仅 P0 阻断
- Fast: 跳过

## Error Taxonomy

| Level | Name | Recovery | Impact |
|-------|------|----------|--------|
| P0 | AC_UNCOVERED (≥10% AC 缺测试) | 生成缺失测试, 回 Phase 4 | Blocks Phase 6 |
| P1 | CROSS_WAVE_REGRESSION | Isolate breaking commit, revert, T-fix | No cross-wave |
| P2 | EDGE_CASE_GAP (>3 gaps) | Add targeted tests | Continue with gaps documented |
| P3 | TEST_FLAKY (>5% intermittent) | Flag flaky, 3x isolation test | No blocking |

## Boundary Conditions

| Threshold | Value |
|-----------|-------|
| AC Coverage | ≥90% |
| Verify Re-run | 100% pass |
| Boundary Testing | ≥3 scenarios |
| Test Timeout | ≤20 min per phase |

## 安全审查 (ForgeOS增强)

- OWASP Top 10 测试用例覆盖
- 认证/授权绕过测试
- 输入验证边界测试
- 依赖安全扫描 (npm audit / pip audit)

## ForgeOS 增强

**Persona**: tdd-guide (always) + security-reviewer (always) + 技术栈Agent (on-demand)
**Hook**: phase-transition (L0), context-monitor (L0+L1), security-scan (L0+L1)
