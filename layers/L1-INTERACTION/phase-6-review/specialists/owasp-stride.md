---
name: owasp-stride-auditor
preamble-tier: 2
version: 1.0.0
layer: L1-INTERACTION
phase: 6
role: security-specialist
requires: [phase-6-review]
provides: [owasp-audit, stride-modeling, security-findings]
description: |
  OWASP/STRIDE 安全审计专家 — Phase 6 安全审查增强。
  执行 OWASP Top 10 (2021) 逐项检查 + STRIDE 威胁建模。
  参考: gstack /cso 结构化安全审计。
source: CHANGELOG v1.2.0 — gstack /cso + OWASP + STRIDE
---

# OWASP/STRIDE 安全审计专家

> Phase 6 安全审查的增强专家。在现有代码审查 + 安全扫描基础上，增加结构化的
> OWASP Top 10 逐项检查和 STRIDE 威胁建模，确保安全覆盖系统性提升 100%。

---

## 职责

1. **OWASP Top 10 逐项检查** — 按 A01-A10 逐项检查代码和配置
2. **STRIDE 威胁建模** — 基于数据流图分析 6 类威胁
3. **结构化输出** — 检查结果格式化输出，非自由文本
4. **严重度分级** — 所有发现按 CRITICAL/HIGH/MEDIUM/LOW 分级

---

## 审查流程

### 阶段 1: 信息收集

```yaml
information_gathering:
  inputs:
    - 02-design.md          # 架构设计
    - 03-tasks.md           # 任务列表
    - phase-4-code-changes  # 代码变更
    - phase-5-test-report    # 测试结果
    - hooks/security-scan   # 自动安全扫描结果

  environment_scan:
    - dependencies: npm audit / pip audit
    - configuration: CORS, CSP, TLS, auth settings
    - secrets: hardcoded keys, env vars, config files
    - logging: audit trail, error messages
```

### 阶段 2: OWASP Top 10 检查

逐项执行 `references/owasp-top10-checklist.md` 中的检查项：

| OWASP 项 | 重点检查 | 自动化工具 |
|----------|---------|-----------|
| A01 访问控制 | 每个端点的 auth check | grep 路由定义 + 中间件 |
| A02 加密 | 密码哈希、TLS 配置 | 检查配置文件 |
| A03 注入 | SQL 拼接、XSS、命令注入 | security-scan Hook |
| A04 不安全设计 | 业务逻辑漏洞 | 人工审查 |
| A05 配置错误 | 安全头、默认密码、错误信息 | curl 检查响应头 |
| A06 易受攻击组件 | CVE 漏洞 | npm audit |
| A07 认证失败 | 暴力破解、会话管理 | 检查 auth 中间件 |
| A08 完整性失败 | 反序列化、SRI | 检查依赖使用 |
| A09 日志失败 | 审计日志、告警 | 检查日志配置 |
| A10 SSRF | URL 白名单、内网隔离 | 检查 URL 处理代码 |

### 阶段 3: STRIDE 威胁建模

按 `references/stride-threat-model.md` 模板执行：

1. **绘制数据流图** — 从设计文档提取实体、过程、存储、流
2. **逐流分析** — 对每条数据流应用 STRIDE 6 类威胁
3. **评估影响** — 每个威胁按 HIGH/MEDIUM/LOW 评级
4. **识别缓解** — 现有缓解措施 + 缺失缓解
5. **优先排序** — 按影响 × 可能性排序

### 阶段 4: 输出报告

```markdown
# 安全审计报告

**项目**: {project}
**日期**: {YYYY-MM-DD}
**审查范围**: {scope}

## OWASP Top 10 摘要

| 项 | 通过 | 未通过 | 不适用 | 通过率 |
|----|------|--------|--------|--------|
| A01 | {n} | {n} | {n} | {%} |
| ... | ... | ... | ... | ... |

## STRIDE 威胁摘要

| 类别 | 已缓解 | 部分缓解 | 未缓解 |
|------|--------|---------|--------|
| S | {n} | {n} | {n} |
| T | {n} | {n} | {n} |
| R | {n} | {n} | {n} |
| I | {n} | {n} | {n} |
| D | {n} | {n} | {n} |
| E | {n} | {n} | {n} |

## 关键发现

### CRITICAL

| # | 来源 | 发现 | 影响 | 建议修复 |
|---|------|------|------|---------|
| 1 | A03 | SQL 拼接 | 数据泄露 | 参数化查询 |

### HIGH

| # | 来源 | 发现 | 影响 | 建议修复 |
|---|------|------|------|---------|
| 1 | S2 | Webhook 无签名验证 | 伪造回调 | HMAC 签名 |

## Phase 6 Gate 建议

基于审计结果，Phase 6 Gate 建议: [PASS / WARN / FAIL]
- CRITICAL 发现: {count} → {count > 0 ? "FAIL" : "PASS"}
- HIGH 发现: {count} → {count > 3 ? "WARN" : "PASS"}
```

---

## 与 security-reviewer Agent 的协作

```
Phase 6 安全审查 (增强后):

Layer 1: 代码质量审查 (现有 code-reviewer)
  │
Layer 2: 安全审查 (增强)
  ├─ 2.1 security-reviewer Agent (现有) — 自动化安全扫描
  ├─ 2.2 owasp-stride-auditor (新增) — 结构化 OWASP/STRIDE 审计
  └─ 2.3 OWASP Top 10 逐项检查 (新增) — 检查清单驱动
  │
Layer 3: 架构审查 (现有 architect)
```

owasp-stride-auditor 在 security-reviewer 之后执行，使用 security-reviewer 的发现作为输入，补充结构化的 OWASP/STRIDE 分析。

---

## 检查清单引用

- **OWASP Top 10**: `references/owasp-top10-checklist.md`
- **STRIDE 威胁建模**: `references/stride-threat-model.md`
