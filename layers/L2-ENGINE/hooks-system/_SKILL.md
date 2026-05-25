---
name: hooks-system
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: [pipeline-state, phase-transition-hooks]
provides: [context-monitor, prompt-guard, phase-transition-hooks, tool-execution, chain-trigger, config-validation, scale-adaptive-defaults, session-active]
description: Runtime hooks system with chain-triggering, config validation, and scale-adaptive defaults. Extends GSD hooks with cascade support and Conductor lifecycle hooks.
source: GSD hooks (context-monitor, prompt-guard, phase-boundary) + conductor lifecycle hooks + scale-domain-adaptive integration
dependencies:
  - token-compression-v2
  - caveman-shrink
  - scale-domain-adaptive
  - conductor-revert
triggers:
  - session start
  - phase transition
  - context threshold
  - tool execution
  - hook cascade (chain-trigger)
---

# Hooks System — 运行时钩子系统

## 核心能力

借鉴 GSD（Get Shit Done）的运行时钩子系统，在 DevFlow 的关键生命周期节点自动执行监控、检查、清理动作。

## 设计理念

DevFlow 目前是一个**响应式系统**——AI 在 Phase 转换时主动触发压缩、归档、检查。但有些动作需要在**运行时自动触发**：

- Token 消耗超过阈值 → 自动触发压缩（不等 Phase 转换）
- 用户 Prompt 包含敏感信息 → 自动脱敏
- Phase 边界 → 自动保存检查点
- 工具调用异常 → 自动降级/重试

## 钩子类型

### 1. Context-Monitor（上下文监控钩子）

在 token 消耗达到阈值时自动触发压缩。

| 阈值 | 触发动作 | 压缩级别 |
|------|---------|---------|
| **> 50%** | 记录日志，预告压缩风险 | 无 |
| **> 70%** | 触发 `caveman-shrink` ultra 压缩 | ultra |
| **> 85%** | 触发 `memory-compression` 归档压缩 | extreme |
| **> 95%** | 触发 `output-compression` extreme + 通知用户 | extreme |

```
Context-Monitor Hook:
  │
  ├── 每 100 轮对话检查一次 context 使用量
  ├── > 70%: caveman-shrink → ultra
  │         → 记录到 dev-log
  │         → 通知用户："上下文使用 75%，已自动压缩记忆文件"
  │
  ├── > 85%: memory-compression → extreme
  │         → 归档 LESSONS.md / DOMAIN-SKILLS
  │         → 通知用户："上下文使用 88%，已归档历史记忆"
  │
  └── > 95%: output-compression → extreme + caveman extreme
            → 仅保留关键词+代码
            → 通知用户："上下文使用 97%，进入极简模式"
```

### 2. Prompt-Guard（Prompt 防护钩子）

对用户输入进行实时检查和处理。

| 检查项 | 触发条件 | 动作 |
|-------|---------|------|
| **敏感信息检测** | 包含邮箱/手机号/API Key 模式 | 脱敏处理 |
| **Prompt Injection** | 包含 system prompt 覆盖指令 | 标记警告 |
| **超长输入** | 输入 > 10K tokens | 自动压缩 |
| **多语言混用** | 中英文混用 | 统一翻译为当前会话语言 |

```
Prompt-Guard Hook:
  │
  ├── 用户输入 → 正则扫描
  │   ├── 检测邮箱模式 (xxx@xxx.xxx) → 脱敏为 ●●●@●●●.●●●
  │   ├── 检测 API Key 模式 (sk-...) → 脱敏为 sk-****
  │   ├── 检测系统指令注入 (system:/!/) → 标记警告
  │   └── 输入长度 > 10K tokens → 自动压缩到 10K
  │
  └── 处理后输入 → 进入正常 Phase 流程
```

### 3. Phase-Transition（Phase 转换钩子）

在 Phase 之间自动执行检查点保存、上下文快照、资源释放。

| Phase 转换 | 执行动作 |
|-----------|---------|
| **Phase N → N+1** | 保存当前 Phase 的 SUMMARY → `devflow/<req-id>/SUMMARY_N.md` |
| **Phase 3 → 4** | 冻结任务 DAG，创建不可变快照 |
| **Phase 4 → 5** | 释放 CodeGraph 索引缓存，保存构建产物清单 |
| **Phase 6 → 7** | 冻结审查报告，创建回滚点 |
| **Phase 8** | 触发 LESSONS 沉淀 + domain-skills 生成 |

```
Phase-Transition Hook:
  │
  ├── Phase 4 → 5 (实施→测试):
  │   ├── 保存构建产物清单
  │   ├── 释放 CodeGraph watch 句柄（节省资源）
  │   └── 记录 [checkpoint][wave:N][task:X]
  │
  ├── Phase 6 → 7 (审查→发布):
  │   ├── 冻结审查报告 → IMMUTABLE_REVIEW.md
  │   ├── 创建回滚点（git stash / snapshot）
  │   └── 准备 Canary 发布清单
  │
  └── Phase 8 (归档):
      ├── 触发 LearningWorkflow（LESSONS 去重+沉淀）
      ├── 生成 domain-skills（高频模式→可复用技能）
      └── 清理临时文件（SUMMARY_N.md 归档后）
```

### 4. Tool-Execution（工具执行钩子）

在工具调用前后执行审计、计时、重试逻辑。

| 钩子点 | 检查项 | 动作 |
|-------|-------|------|
| **Before** | 工具调用预算 | > 预算限制 → 预警 |
| **After (Success)** | 执行时间 | > 阈值 → 记录慢调用 |
| **After (Error)** | 错误类型 | 可重试错误 → 指数退避重试 |
| **After (Timeout)** | 超时 | 降级到替代方案 |

```
Tool-Execution Hook:
  │
  ├── Before: 检查工具调用次数
  │   ├── glob > 10次/轮 → 警告："glob 调用频繁，考虑改用 codegraph_search"
  │   └── read_file > 20次/轮 → 警告："文件读取过多，考虑启用 codegraph_context"
  │
  ├── After (Error): 错误分类
  │   ├── Edit 匹配失败 → 重新读取文件 → retry 1次
  │   ├── Bash 超时 → 降级为更小命令
  │   └── MCP 连接失败 → 降级为本地替代
  │
  └── After (Success): 性能审计
      └── 记录工具调用耗时 → 慢调用报告
```

## 链式触发 (Chain-Trigger)

钩子之间支持级联触发,形成自动化的运行时响应链。

### 触发规则

```
链式触发协议:

1. 单钩子触发多钩子 (One-to-Many):
   context-monitor > 70%  →  [
     1. caveman-shrink → ultra 压缩
     2. surface-switch → ultra 模式
     3. tool-execution → audit_all 启用
   ]

2. 多钩子串联 (Many-to-Many):
   phase-transition Phase 6→7  →  [
     1. phase-transition: 保存回滚点
     2. conductor-revert: 注册回滚入口
     3. context-monitor: 切换到 strict 模式
   ]

3. 终止规则:
   - hook A 执行失败 → hook B 仍可执行 (并行链)
   - hook A 返回 fatal → 中断后续链 (串行链)
   - 用户手动 /dfevo:hooks pause → 暂停所有链
```

### 链式触发配置

```yaml
# .dfevo/hooks.yaml - chain 配置
hooks:
  chain:
    enabled: true
    # 上下文膨胀链式触发
    context-cascade:
      - trigger: "context-monitor > 70%"
        actions:
          - "caveman-shrink → ultra"
          - "surface-switch → ultra"
          - "notify: '上下文75%,已自动压缩'"
        mode: parallel  # 并行执行,任一失败不影响其他

    # Phase 6→7 回滚链式触发
    phase6-to-7-cascade:
      - trigger: "phase-transition Phase 6→7"
        actions:
          - "phase-transition: save_rollback_point"
          - "conductor-revert: register_rollback_entry"
          - "context-monitor: switch_to_strict"
        mode: serial  # 串行执行,任一失败中断

    # Phase 8 归档链式触发
    archive-cascade:
      - trigger: "phase-transition Phase 8"
        actions:
          - "phase-transition: lessons_persist"
          - "phase-transition: domain_skills_generate"
          - "context-monitor: disable"
        mode: serial
```

## 配置校验 (Config Validation)

`.dfevo/hooks.yaml` 启动时自动校验,确保阈值和配置一致。

### 校验规则

```yaml
# 校验规则定义
validation_rules:
  # 阈值递增约束
  threshold_order:
    - field: "context-monitor.thresholds"
      rule: "warn < compress < archive < extreme"
      error: "阈值必须严格递增"

  # 范围约束
  range_constraints:
    - field: "context-monitor.check_interval"
      min: 10
      max: 500
      error: "检查间隔必须在 10-500 轮之间"
    - field: "tool-execution.max_glob_calls"
      min: 1
      max: 100
      error: "glob 调用上限必须在 1-100 之间"
    - field: "tool-execution.max_retries"
      min: 0
      max: 5
      error: "最大重试次数必须在 0-5 之间"

  # 依赖约束
  dependency_rules:
    - if: "phase-transition.enabled = true"
      then: "phase-transition.save_summary = true"
      error: "启用 phase-transition 时必须启用 save_summary"
    - if: "chain.enabled = true"
      then: "至少定义一个 chain 配置"
      error: "启用链式触发时必须定义至少一个 chain"

  # Scale 一致性约束
  scale_consistency:
    - if: "scale-domain-adaptive detected"
      then: "hooks 配置与 scale 等级一致"
      error: "hooks 配置与 Scale 等级不匹配,已自动覆盖"
```

### 校验流程

```
Phase 0 (启动) 配置加载:

1. 尝试加载 .dfevo/hooks.yaml
   ├── 存在 → 校验规则
   │   ├── 校验通过 → 使用配置
   │   └── 校验失败 → 警告 + 使用默认值 + 记录 dev-log
   └── 不存在 → 使用 scale-domain-adaptive 默认值

2. Scale 感知的默认值覆盖:
   ├── Lite → hooks_defaults_by_scale.lite
   ├── Standard → hooks_defaults_by_scale.standard
   ├── Enhanced → hooks_defaults_by_scale.enhanced
   └── Advanced → hooks_defaults_by_scale.advanced

3. 用户手动配置优先级:
   .dfevo/hooks.yaml > scale 默认值 > 硬编码默认值
```

## Scale 自适应默认值

与 `scale-domain-adaptive` 深度集成,根据项目规模自动调整钩子行为。

### 默认值映射

```yaml
# 已在上文 "Phase 粒度映射" 章节定义
# hooks_defaults_by_scale 完整映射:
#   lite: 低频次 + 宽松阈值 + 最小 checkpoint
#   standard: 标准频率 + 标准阈值 + 正常 checkpoint
#   enhanced: 高频次 + 严格阈值 + 详细 checkpoint
#   advanced: 最高频次 + 最严格阈值 + 完整 checkpoint
```

### 运行时动态调整

```
/dfevo:scale enhanced 执行时:

1. scale-domain-adaptive 切换 Scale 等级
2. hooks-system 自动重新加载 hooks_defaults_by_scale.enhanced
3. 变更通知:
   - "Scale 切换为 Enhanced"
   - "Context-Monitor: 100→80 轮检查间隔"
   - "Phase-Transition: checkpoint 详细程度 normal→detailed"
   - "Tool-Execution: audit_all 未→已启用"
4. 如果当前 context > 65%,自动触发 caveman-shrink ultra
```

## 钩子配置模板

```yaml
# .devflow/hooks.yaml (可选配置)
hooks:
  context-monitor:
    enabled: true
    check_interval: 100  # 每 100 轮检查
    thresholds:
      warn: 50
      compress: 70
      archive: 85
      extreme: 95

  prompt-guard:
    enabled: true
    mask_email: true
    mask_api_key: true
    max_input_tokens: 10000

  phase-transition:
    enabled: true
    save_summary: true
    create_checkpoint: true
    release_resources: true

  tool-execution:
    enabled: true
    max_glob_calls: 10
    max_read_file_calls: 20
    auto_retry: true
    max_retries: 1
```

## 与 GSD Hooks 对比

| 特性 | GSD | DevFlow |
|------|-----|-------------|
| **context-monitor** | ✅ JS 文件，自动检测 | ✅ Hook 定义，AI 执行 |
| **prompt-guard** | ✅ JS 文件，脱敏扫描 | ✅ Hook 定义，AI 执行 |
| **phase-boundary** | ✅ Shell 脚本，阶段切换 | ✅ Hook 定义，Phase 转换 |
| **session-state** | ✅ Shell 脚本，状态管理 | ✅ STATE.md + Phase-Transition Hook |
| **graphify-update** | ✅ JS，图更新 | ✅ CodeGraph Auto-Sync |
| **零脚本化** | ❌ 依赖 14 个 JS/Shell 文件 | ✅ 纯指令式，零脚本 |
| **链式触发** | ❌ 独立钩子 | ✅ chain 配置,并行/串行模式 |
| **配置校验** | ❌ 运行时静默失败 | ✅ Phase 0 启动时校验,阈值/范围/依赖约束 |
| **Scale 自适应** | ❌ 固定配置 | ✅ hooks_defaults_by_scale,运行时动态调整 |
| **Revert 联动** | ❌ 无 | ✅ Phase 6→7 自动注册回滚入口 |

## Phase 集成

### Phase 0（启动）
- 加载钩子配置 `.devflow/hooks.yaml`
- 启用 context-monitor + prompt-guard

### Phase 4-5（实施→测试）
- 启用 phase-transition hooks（checkpoint 保存）
- 启用 tool-execution hooks（慢调用审计）

### Phase 8（归档）
- 触发 phase-transition hooks（LESSONS 沉淀 + domain-skills 生成）
- 禁用 context-monitor（不再需要压缩）
- 链式归档: lessons_persist → domain_skills_generate → context-monitor: disable

## 实现方式

```
layers/L2-ENGINE/hooks-system/
├── _SKILL.md          # 本文件
└── hooks-reference.md # 各钩子详细触发条件与动作
```

**AI 执行方式**：
1. 按 hooks.yaml 配置读取阈值和开关
2. 在对应触发点自动执行钩子逻辑
3. 钩子动作记录到 dev-log

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Execution Impact |
|-------|------|------------|--------|------------------|
| **P0** | BLOCKING | Hook chain causes infinite loop (>10 sequential triggers) | Break loop immediately, disable offending hook, log to dev-log | Hook system halted for current event |
| **P1** | RECOVERABLE | Phase transition hook fails (e.g., checkpoint save fails) | Retry 3x with exponential backoff (1s→2s→4s); if still fails → skip hook, proceed with transition | Transition proceeds without hook side-effect |
| **P2** | WARNING | Hook execution exceeds time budget (e.g., context monitor >5s) | Log slow execution, skip remaining hooks in chain for this event | Reduced hook coverage for current event |
| **P3** | DEGRADATION | Hook configuration malformed (invalid hooks.yaml) | Use defaults, log warning, proceed | Operate with default hook settings |

**Severity Assignment Rules**:
- Default to P1 for any hook execution failure
- Escalate to P0 if infinite loop detected or state corruption occurs
- Never demote: once P0, only manual hook re-enable can clear

## Boundary Conditions

### When to Escalate Immediately
- Hook execution causes infinite loop (detected by >10 sequential triggers) → break loop, disable hook chain
- Phase transition hook fails critically → halt transition, keep current Phase, report

### When to Skip Hook
- No hooks registered for current event → skip silently
- Hook marked as disabled → skip, log reason
- Phase transition in progress → queue hook, execute after transition completes

### Degradation Path
1. Full hook chain → 2. Skip non-critical hooks → 3. Disable failing hook → 4. Halt hook system
