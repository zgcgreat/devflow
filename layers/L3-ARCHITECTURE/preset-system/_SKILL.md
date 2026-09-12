---
name: preset-system
preamble-tier: 1
version: 1.0.0
layer: L3-ARCHITECTURE
gate: internal
implementation: spec-only
requires: [skil-md]
provides: [preset-loading, phase-override, rule-addition, agent-addition]
description: |
  Preset 扩展系统 — 用户定制 Phase 模板的预设机制。
  提供 minimal/standard/enterprise 三种默认预设，支持自定义 YAML 覆盖。
  参考: Spec-Kit Extension/Preset 系统。
source: CHANGELOG v1.3.0 — Spec-Kit Extension/Preset
dependencies:
  - skil-md (Phase 流程主文件)
  - cli (DevFlow setup 集成)
triggers:
  - Session 启动时加载
  - /devflow:setup 配置
  - PROJECT_CONSTITUTION.md 中的 preset 字段
---

# Preset System — 预设扩展系统

> **核心问题**: 不同项目需要不同的 Phase 流程严格度，但当前只能全局配置。
> **解决方案**: Preset 系统允许用户通过 YAML 文件定制 Phase 行为、规则和 Agent。

---

## 1. Preset 文件格式

```yaml
# .devflow/presets/my-team.yaml
name: my-team-preset
description: 我团队的定制预设
version: 1.0.0

# Phase 行为覆盖
overrides:
  phase-0:
    skip: false
    push_back: true              # 启用推回轮次
  phase-2a:
    variants: 3                  # 减少设计变体数量 (默认 4-6)
    taste_memory: true           # 启用品味记忆
  phase-4:
    assumption_declaration: true # 启用假设声明
    change_boundary_check: true  # 启用变更边界检查
    wip_checkpoint: true         # 启用 WIP 自动保存
    real_time_review: standard   # 实时审查级别: light/standard/full
  phase-5:
    browser_qa: true             # 启用浏览器 QA
  phase-6:
    owasp_stride: true           # 启用 OWASP/STRIDE 审计
    red_flags: true              # 启用 Red Flags 检查
  phase-8:
    vector_memory_sync: true     # 启用向量记忆同步

# 额外规则
rules:
  additional:
    - "所有 API 必须有 OpenAPI 文档"
    - "数据库迁移必须有 rollback 脚本"
    - "所有 PR 必须经过至少 1 人审查"
  disabled:
    - R14                        # 禁用某条规则

# 额外 Agent
agents:
  additional:
    - name: db-migration-reviewer
      phase: P6
      description: "数据库迁移审查专家"
  disabled:
    - performance-reviewer       # 禁用某个 Agent

# Hook 配置
hooks:
  additional:
    - name: custom-linter
      type: pre_tool_use
      script: scripts/custom-linter.js
  disabled:
    - console-log-check          # 禁用 console.log 检查

# Token 配置
token:
  budget: 200000
  compression_threshold: 0.7
```

---

## 2. 默认预设

### 2.1 minimal — 个人项目/原型

```yaml
name: minimal
description: 最小预设 — 适合个人项目和快速原型

overrides:
  phase-0:
    skip: true                   # 跳过 Phase 0
  phase-1:
    skip: true                   # 跳过 Phase 1 讨论
  phase-2a:
    skip: true                   # 跳过设计枪战
  phase-3:
    simplified: true             # 简化任务拆分
  phase-4:
    assumption_declaration: false
    change_boundary_check: false
    wip_checkpoint: false
    real_time_review: light
  phase-5:
    browser_qa: false
  phase-6:
    owasp_stride: false
    red_flags: false
  phase-7:
    skip: true                   # 跳过灰度发布
  phase-8:
    simplified: true             # 简化归档

rules:
  disabled: [R14, R29, R30, R31]

hooks:
  disabled: [console-log-check, security-scan]
```

### 2.2 standard — 团队项目（默认）

```yaml
name: standard
description: 标准预设 — 适合团队项目，平衡速度和质量

overrides:
  phase-0:
    push_back: true
  phase-2a:
    variants: 4
    taste_memory: true
  phase-4:
    assumption_declaration: true
    change_boundary_check: true
    wip_checkpoint: true
    real_time_review: standard
  phase-5:
    browser_qa: true
  phase-6:
    owasp_stride: true

rules: {}
hooks: {}
```

### 2.3 enterprise — 企业项目

```yaml
name: enterprise
description: 企业预设 — 全量 Phase + 最严格审查

overrides:
  phase-0:
    push_back: true
    require_evidence: true       # 要求证据支持
  phase-2a:
    variants: 6
    taste_memory: true
    accessibility_check: true
  phase-4:
    assumption_declaration: true
    change_boundary_check: true
    wip_checkpoint: true
    real_time_review: full
  phase-5:
    browser_qa: true
    visual_regression: true
  phase-6:
    owasp_stride: true
    red_flags: true
    red_team: true               # 启用红队审查
  phase-7:
    canary_required: true        # 强制灰度发布
  phase-8:
    vector_memory_sync: true
    graduation_required: true

rules:
  additional:
    - "所有 API 必须有 OpenAPI 文档"
    - "数据库迁移必须有 rollback 脚本"
    - "所有 PR 必须经过至少 2 人审查"
    - "生产部署必须有监控告警"
```

---

## 3. 加载机制

### 3.1 加载顺序

```
Session 启动:
  │
  ├─→ 1. 加载默认 standard 预设
  ├─→ 2. 检查 .devflow/presets/ 目录
  │   ├─ 存在 → 加载用户自定义预设
  │   └─ 不存在 → 使用默认
  ├─→ 3. 检查 PROJECT_CONSTITUTION.md 中的 preset 字段
  │   └─ 有指定 → 覆盖当前预设
  ├─→ 4. 合并所有预设（后者覆盖前者）
  └─→ 5. 输出: 最终 Phase 行为配置
```

### 3.2 合并规则

```yaml
merge_rules:
  # overrides: 深度合并（嵌套字段逐层覆盖）
  overrides: deep_merge

  # rules.additional: 追加（不覆盖默认规则）
  rules.additional: append

  # rules.disabled: 追加
  rules.disabled: append

  # agents.additional: 追加
  agents.additional: append

  # agents.disabled: 追加
  agents.disabled: append

  # hooks: 追加
  hooks: append

  # token: 覆盖
  token: override
```

---

## 4. CLI 集成

```bash
# 初始化时选择预设
npx devflow init --preset minimal

# 切换预设
npx devflow setup --preset enterprise

# 列出可用预设
npx devflow help --presets

# 自定义预设
# 将 .yaml 文件放到 .devflow/presets/ 目录
```

---

## 5. 与 PROJECT_CONSTITUTION 的关系

```
优先级（高→低）:
  1. PROJECT_CONSTITUTION.md (用户项目约束)
  2. Custom Preset (.devflow/presets/*.yaml)
  3. Default Preset (minimal/standard/enterprise)
  4. CONSTITUTION.md (流程宪法)

规则:
  - 项目宪法 > 预设 > 流程宪法
  - 预设只能覆盖行为，不能覆盖硬规则
  - 矛盾时项目宪法优先
```

---

## 6. 降级策略

| 场景 | 降级行为 |
|------|---------|
| 预设文件格式错误 | 忽略自定义预设，使用默认 |
| 预设文件不存在 | 使用 standard 默认 |
| 预设与项目宪法冲突 | 项目宪法优先 |
| 未知预设名称 | 提示可用预设，回退到 standard |
