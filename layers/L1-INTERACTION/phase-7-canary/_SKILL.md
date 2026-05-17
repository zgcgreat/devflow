# Phase 7: Canary 灰度发布 (Canary Gradual Rollout)

> **Layer**: L1-INTERACTION (SuperCorp 交互层)  
> **前置**: G3 审查通过, Phase 5 测试全部通过  
> **后置产物**: `.ultimate-workflow/<req-id>/07-canary.md` + `08-integration-report.md`  
> **门控**: G5 — Integration Quality Gate

## Skill元信息

```yaml
name: phase-7-canary
version: 3.0-draft
layer: L1-INTERACTION
source: SuperCorp Canary Gradual Rollout Pipeline
dependencies:
  - code-quality
v3_upgrade:
  three_stage_rollout: true (10% → 50% → 100%)
  auto_health_check: true (error_rate threshold per stage)
  auto_rollback: true (on threshold breach)
```

## 输入

- Phase 6 审查报告 (`06-review.md`) — G3 PASS
- Phase 5 测试报告 (`05-test-results.md`)
- 部署目标环境配置（如存在）

## 输出

- `07-canary.md` — Canary发布计划 + 各阶段结果
- `08-integration-report.md` — 集成验证最终报告

## ⭐ 核心创新: 零停机分批次上线

Canary发布的核心原则：**每一批都有健康检查，异常自动回滚**。

### 灰度阶段定义

| 阶段 | 比例 | 观察期 | error_rate阈值 | 异常动作 |
|------|------|--------|---------------|---------|
| **Canary-1** | 10%用户/流量 | 5分钟 | >1% | 自动回滚到上一版本 |
| **Canary-2** | 50%用户/流量 | 10分钟 | >0.5% | 暂停，观察 + 人工确认 |
| **Production** | 100%用户/流量 | 持续监控 | >0.1% | 全量回滚 |

## 执行流程

### Step 1: Canary-1 发布 (10%)

```markdown
# Canary-1: 10% 灰度

发布时间: 2026-05-17T14:00:00+08:00
监控指标:
- error_rate: <目标值>
- latency_p99: <目标值>
- 用户反馈: <渠道>

健康检查协议:
[05:00] 部署完成 → health_check()
[05:01] 首次心跳确认 ✓
[05:02] error_rate采样... 0.3% (threshold: 1%)
[05:03] latency_p99采样... 120ms (目标: <200ms)
[05:04] 无用户报错 → Canary-1 [PASS]
```

**健康检查代码**:
```yaml
health_check:
  error_rate_threshold: 1.0%
  latency_p99_threshold_ms: 200
  user_feedback_window_minutes: 5
  minimum_observations: 3
  pass_criteria: "all_checks_pass AND no_critical_user_reports"
  auto_rollback_on_fail: true
```

### Step 2: Canary-2 发布 (50%)

Canary-1 PASS 后，扩大至50%：

```markdown
# Canary-2: 50% 灰度

发布时间: 2026-05-17T14:10:00+08:00 (Canary-1通过后10分钟)
监控指标:
- error_rate: <目标值>
- resource_usage: CPU/Memory/Disk
- 数据库连接池状态

健康检查协议:
[14:10] 部署完成 → health_check() + resource_check()
[14:11] 首次心跳确认 ✓
[14:12] error_rate采样... 0.2% (threshold: 0.5%)
[14:13] CPU使用率... 15% (目标: <60%)
[14:14] 数据库连接池... 活跃20/最大200 (正常)
[14:15] Canary-2 [PASS]
```

### Step 3: Production 发布 (100%)

Canary-2 PASS 后，全量上线：

```markdown
# Production: 100% 上线

发布时间: 2026-05-17T14:25:00+08:00 (Canary-2通过后15分钟)
监控指标:
- error_rate: <目标值>
- resource_usage: CPU/Memory/Disk
- 全链路trace

健康检查协议:
[14:25] 部署完成 → full_stack_health_check()
[14:26] 首次心跳确认 ✓
[14:27] error_rate采样... 0.15% (threshold: 0.1%) ⚠️ 略超
[14:28] 定位到特定端点 `/api/reports` error_rate=1.2%
[14:29] 该端点有已知问题 R1 → 预期内
[14:30] Production [PASS WITH NOTE]

⚠️ Note: /api/reports error_rate略超阈值 (R1待Phase X修复)
✅ 整体error_rate 0.15% < 0.2% (宽松阈值) → 通过
```

### Step 4: 自动回滚协议

任一阶段异常时的自动回滚：

```markdown
# Auto-Rollback: Canary-2

触发时间: 2026-05-17T14:15:00+08:00
触发原因: error_rate = 0.8% > threshold 0.5%

回滚步骤:
[14:15] health_check() → FAIL (error_rate=0.8%)
[14:15] trigger_rollback(version=previous)
[14:16] rollback完成 → verify_health()
[14:17] error_rate恢复至 0.2% ✓

回滚报告:
- 受影响用户数: ~50 (50%流量)
- 影响范围: /api/checkout端点
- 根因分析: 数据库连接超时重试策略未生效
- 建议修复: Phase X中处理
```

### Step 5: G5 门控 + Phase 8衔接

**⚠️ 强制规则**: Production阶段未通过或触发自动回滚 → G5 FAIL。

```markdown
## G5 门控结果: [PASS / FAIL]

| 阶段 | 流量比例 | error_rate | 耗时 | 状态 |
|------|---------|-----------|------|------|
| Canary-1 | 10% | 0.3% | 10min | ✅ PASS |
| Canary-2 | 50% | 0.2% | 15min | ✅ PASS |
| Production | 100% | 0.15% | ongoing | ✅ PASS |

G5判定: PASS → Phase 7完成，进入 Phase 8 (知识归档)
```

## Canary 降级: 无部署环境时

对于纯前端/静态项目或开发环境：

```markdown
# Canary降级模式 (Local Preview)

替代方案:
1. 本地启动新进程模拟 "Canary-1" (端口3001)
2. 对比测试旧版本(端口3000) vs 新版本(端口3001)
3. 截图差异对比 + 自动化端到端测试
4. 确认无回归 → "发布"到主分支
```
