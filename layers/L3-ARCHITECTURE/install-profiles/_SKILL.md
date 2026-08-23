---
name: install-profiles
version: 3.0.0
layer: L3-ARCHITECTURE
gate: internal
requires: []
provides: [configured-profile, enabled-modules]
description: Pre-configured installation profiles for different project types and team sizes
source: ForgeOS adapters + superpowers templates
dependencies:
  - provider-gateway
triggers:
  - project initialization
  - ForgeOS install
external-inputs: [project-type, team-size]
---

# Install Profiles — 安装配置文件

## 预置 Profile

### solo-dev (独立开发者)
```yaml
profile: solo-dev
description: Single developer, fast iteration
phases:
  skip: [phase-1b, phase-2a]  # 跳过讨论和散弹设计
  mode: fast
compression: lite
model_strategy: economy  # 优先使用经济型模型
verification: [format, implement]  # 只做两层验证
memory: [DECISIONS.md, LESSONS.md]  # 最小记忆集
```

### small-team (3-5 人团队)
```yaml
profile: small-team
description: Small team, balanced process
phases:
  skip: [phase-2a]  # 跳过散弹设计
  mode: standard
compression: lite
model_strategy: balanced
verification: [format, implement, test, review]
memory: [DECISIONS.md, LESSONS.md, KNOWN_FAILURES.md, PATTERNS.md]
```

### enterprise (大型团队)
```yaml
profile: enterprise
description: Large team, full process with compliance
phases:
  skip: []  # 不跳过任何阶段
  mode: strict
compression: ultra
model_strategy: premium
verification: [format, implement, test, review, deploy]
memory: [DECISIONS.md, LESSONS.md, KNOWN_FAILURES.md, PATTERNS.md, API_CONTRACTS.md, PROJECT_CONTEXT.md]
compliance: true
audit_trail: true
```

### prototype (原型验证)
```yaml
profile: prototype
description: Quick prototype, minimal process
phases:
  skip: [phase-1-5whys, phase-1b, phase-2a, phase-6, phase-7]
  mode: fast
compression: none
model_strategy: economy
verification: [implement]
memory: [DECISIONS.md]
```

### maintenance (维护模式)
```yaml
profile: maintenance
description: Bug fixes and minor improvements
phases:
  skip: [phase-0, phase-1-5whys, phase-2, phase-2a]
  start_at: phase-3  # 直接从任务规划开始
  mode: fast
compression: lite
model_strategy: balanced
verification: [implement, test]
memory: [KNOWN_FAILURES.md, LESSONS.md]
```

## 安装流程

```bash
# 交互式安装
node install.js /path/to/project --interactive

# 指定 profile
node install.js /path/to/project --profile small-team

# 指定运行时
# AI 按 install-profiles 指令配置项目，profile=solo-dev, runtime=claude-code

# 自定义
# AI 按 install-profiles 指令配置项目，profile=small-team, phases-skip=phase-2a, compression=ultra
```

## 与 adapters 集成

安装时根据 `--runtime` 参数，自动生成对应的适配器配置：

```bash
# AI 按 install-profiles 指令生成 Claude Code 配置，profile=solo-dev
# → .claude/hooks.json, .claude/settings.json, CLAUDE.md

# 生成 Cursor 配置
node install.js . --profile small-team --runtime cursor
# → .cursor/rules/ForgeOS.mdc
```

## Error Taxonomy (Install Profiles 专属)

| Level | Name | Action | Impact |
|-------|------|--------|--------|
| P0 | PROFILE_MISMATCH | 安装了错误 profile → 确认项目类型和团队规模后重新选择 | 流程不匹配，Phase 跳过逻辑错误 |
| P1 | RUNTIME_NOT_FOUND | 指定 runtime 的适配器配置无法生成 → 降级到通用配置 + 警告 | 部分功能缺失（hooks/rules 未生效） |
| P2 | PHASE_SKIP_CONFLICT | profile 跳过 Phase 但用户手动触发 → 允许执行，标注"非 profile 推荐" | 非阻塞，流程偏移 |
| P3 | MEMORY_SET_INCOMPLETE | profile 定义的 memory 文件缺失 → 自动创建空模板 | 非阻塞，首次运行自动补齐 |

## Boundary Conditions (Install Profiles)

| Condition | Action | Rationale |
|-----------|--------|-----------|
| project-type 无法识别 | 交互式询问，默认 solo-dev | 避免错误 profile 导致流程不适配 |
| team-size > 20 | 强制使用 enterprise profile | 大团队需完整流程（审计/合规） |
| profile 包含 skip: phase-4/phase-5 | 拒绝，这两个 Phase 不可跳过 | 构建/测试是底线，跳过将导致质量失控 |
| 同时指定 --profile 和自定义参数 | 自定义参数覆盖 profile 默认值 | 用户显式意图优先于预设 |
