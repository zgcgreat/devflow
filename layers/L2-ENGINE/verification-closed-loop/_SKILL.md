---
name: verification-closed-loop
version: 3.0-draft
layer: L2-ENGINE
gate: internal
requires: [change-applied]
provides: [verification-passed, verification-failed-report]
description: Closed-loop verification ensuring every change is validated end-to-end: spec → implement → test → verify → deploy → monitor
source: superpowers Karpathy rules + GSD verify-phase + OpenSpec verify 3D
dependencies:
  - change-manager
  - executor
triggers:
  - post-build verification
  - pre-deploy gate
  - canary health check
---

# Verification Closed Loop — 验证闭环

## 核心原则

**Karpathy Rule**: "If it's not tested, it doesn't exist."

devflow-evo 的验证闭环确保每个变更从规格到部署的完整验证链：

```
Spec ←→ Implement ←→ Test ←→ Verify ←→ Deploy ←→ Monitor
  │                                              │
  └──────────── 反馈回路 ────────────────────────┘
```

## 五层验证

| 层级 | 名称 | 执行时机 | 验证内容 | 失败处理 |
|------|------|---------|---------|---------|
| L1 | **格式验证** | Phase 2 设计后 | Spec 格式、Schema 合规、命名规范 | 阻断推进 |
| L2 | **实现验证** | Phase 4 每个任务后 | 代码编译、Lint、类型检查 | 阻断下一个任务 |
| L3 | **测试验证** | Phase 5 全量测试 | 单元/集成/E2E、覆盖率 ≥ 90% | 阻断 Phase 6 |
| L4 | **审查验证** | Phase 6 Review 后 | 三维验证 (Completeness/Correctness/Coherence) | 需修复后重审 |
| L5 | **部署验证** | Phase 7 Canary 期间 | 健康检查、指标对比、回滚阈值 | 自动回滚 |

## 验证闭环流程

### Phase 4 → 5: 实现验证

```
每个 task 完成后:
  1. 编译检查 (tsc / cargo build / go build)
  2. Lint 检查 (eslint / ruff / clippy)
  3. 类型检查 (tsc --noEmit)
  4. 单元测试 (关联的 test 文件)
  5. 如全部通过 → 标记 task 为 verified
  6. 如有失败 → 标记 task 为 failed，记录错误
```

### Phase 5: 测试验证

```
全量测试:
  1. 单元测试: npm test / pytest / cargo test
  2. 集成测试: 特定 CI 环境运行
  3. E2E 测试: Playwright / Cypress
  4. 覆盖率检查: ≥ 90% AC 覆盖
  5. 性能基线: 无回归
  6. 安全扫描: SAST / dependency audit
```

### Phase 6 → 7: 审查验证

```
三维验证 (复用 change-manager verifyChange):
  Completeness:
    - 所有 tasks 完成 ✓
    - 所有需求有代码对应 ✓
    - 所有 AC 有测试覆盖 ✓
  
  Correctness:
    - 实现匹配规格意图 ✓
    - 边界情况处理 ✓
    - 错误处理完整 ✓
  
  Coherence:
    - 设计决策反映在代码中 ✓
    - 模式一致性 ✓
    - API 契约一致 ✓
```

### Phase 7: 部署验证 (Canary)

```
Canary 部署:
  1. 部署到 canary 环境
  2. 等待 5 分钟 (或配置时长)
  3. 检查健康指标:
     - 错误率 < 基线 * 1.5
     - P99 延迟 < 基线 * 1.2
     - CPU/内存 < 阈值
  4. 如健康 → 全量发布
  5. 如不健康 → 自动回滚 + 记录 LESSON
```

## 验证结果记录

```yaml
# .devflow-evo/<reqId>/05-test-report.md 中的验证摘要
verification:
  timestamp: 2026-05-19T16:00:00
  layers:
    format: { status: passed, checks: 12, failed: 0 }
    implementation: { status: passed, tasks: 8, verified: 8 }
    test: { status: passed, unit: 45, integration: 12, e2e: 3, coverage: 92.3% }
    review: { status: passed, completeness: passed, correctness: passed, coherence: warning }
    deployment: { status: pending, canary: not_started }
  overall: passed_with_warnings
  actions:
    - "Fix aria-label warning from coherence check"
    - "Proceed to canary deployment after fix"
```

## CI/CD 集成指南

### GitHub Actions 示例

```yaml
# .github/workflows/devflow-evo-verify.yml
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: L1 Format Check
        run: |
          # AI 按验证闭环指令逐项核对：
          # 1. Spec 格式合规（YAML frontmatter 完整）
          # 2. Schema 合规（字段类型正确）
          # 3. 命名规范（kebab-case 文件名）
      - name: L2 Implementation Check
        run: |
          # AI 逐项核对：
          # 1. 编译检查 (tsc / cargo build / go build)
          # 2. Lint 检查 (eslint / ruff / clippy)
          # 3. 类型检查 (tsc --noEmit)
      - name: L3 Test Check
        run: |
          # AI 逐项核对：
          # 1. 单元/集成/E2E 测试全部通过
          # 2. AC 覆盖率 ≥ 90%
```

### Pre-commit 示例

```bash
# .husky/pre-commit
# AI 按 L2 实现验证清单快速核对：
# 1. 编译是否通过？
# 2. Lint 是否无错？
# 3. 关联测试是否通过？
```
