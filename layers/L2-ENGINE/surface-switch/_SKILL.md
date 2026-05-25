---
name: surface-switch
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: [session-active]
provides: [runtime-mode-switch, skill-cluster-toggle]
description: Runtime skill cluster switching — dynamically swap tool sets and compression levels mid-session, inspired by GSD /gsd:surface
source: GSD /gsd:surface + devflow /caveman mode
dependencies:
  - caveman-shrink
  - token-compression-v2
  - hooks-system
triggers:
  - /dfevo:surface command
  - context threshold auto-switch
---

# Surface Switch — 运行时技能簇切换

## 核心能力

借鉴 GSD 的 `/gsd:surface` 运行时开关能力，允许用户在**会话进行中**动态切换工具集、压缩级别和工作模式，无需重启 session。

## 设计理念

DevFlow 目前通过 `mode-rules.md` 在 Session 启动时**一次性**判定模式（Fast/Lean/Standard/Strict）。但实际开发中，需求复杂度会动态变化：

- 实施阶段很顺利 → 从 Strict 降级到 Standard
- 遇到复杂 bug → 从 Standard 升级到 Strict
- 需要快速原型 → 临时切换到 Lite 模式
- 需要完整审计 → 临时升级到 Audit 模式

Surface Switch 允许运行时动态切换，**平滑过渡**，不丢失上下文。

## 切换命令

### `/dfevo:surface` — 运行时模式切换

```
/dfevo:surface [mode]

可用模式:
  lite      — 极速模式，最小工具集，ultra 压缩
  standard  — 标准模式，标准工具集，lite 压缩
  strict    — 严格模式，全工具集，no 压缩
  audit     — 审计模式，全工具集 + caveman-review + 三层对抗
  extreme   — 极简模式，core 工具集，extreme 压缩

/dfevo:surface --show  — 显示当前模式与配置
/dfevo:surface --reset  — 恢复到 Session 启动时的初始模式
```

### 模式对比

| 模式 | 工具集 | 压缩级别 | CodeGraph | Hooks | 适用场景 |
|------|-------|---------|-----------|-------|---------|
| **lite** | core (~5) | ultra | skip | monitor only | 快速修复、小改动 |
| **standard** | standard (~15) | lite | enabled | full | 日常开发 |
| **strict** | all (~30+) | none | enabled | full | 大型 feature |
| **audit** | all + review | none | enabled + impact | full + review | 上线前审计 |
| **extreme** | core (~5) | extreme | skip | monitor only | Context > 95% |

## 切换流程

### 手动切换

```
用户: /dfevo:surface strict

AI:
🔄 模式切换: standard → strict

当前模式配置变更:
  ├── 工具集: 15 → 30+ 个 MCP 工具
  ├── 压缩级别: lite → none
  ├── CodeGraph: enabled → enabled + impact 分析
  ├── Hooks: full → full + review
  └── 预计 Context 增加: ~15K tokens

当前 Phase: Phase 4 (实施) — 切换不影响进行中的任务

✅ 模式已切换到 strict

📊 影响:
  - 更多工具描述将进入 context (~15K tokens)
  - CodeGraph impact 分析将启用
  - 审查报告将包含 caveman-review 一行评论
  - 压缩引擎将停止压缩（保持完整上下文）

⚠️ 提示: Context 预算 200K，当前使用 72K，切换后预计 ~87K

请确认或输入 /dfevo:surface --show 查看详细配置：
```

### 自动切换（Context 驱动）

```
Context-Monitor Hook 检测到 > 95%:
  │
  ├── 自动切换到 extreme 模式
  ├── 通知用户："上下文使用 97%，自动切换到 extreme 模式"
  ├── 释放 CodeGraph watch 句柄
  ├── 仅保留 core 工具描述
  └── 输出启用 extreme 压缩
```

### 平滑过渡

```
切换时保留:
  ├── Phase 状态（不重置）
  ├── 任务列表状态（不重置）
  ├── 已完成的 Wave 记录
  ├── LESSONS.md / DECISIONS.md
  └── CodeGraph 索引（不重建）

切换时重置:
  ├── 工具集（卸载/加载）
  ├── 压缩级别（调整）
  ├── Hooks 配置（重载）
  └── 输出格式（调整 verbosity）
```

## 与 GSD /gsd:surface 对比

| 特性 | GSD | DevFlow |
|------|-----|-------------|
| **运行时切换** | `/gsd:surface` | `/dfevo:surface` ✅ |
| **模式数量** | MVP / Full / Audit | lite / standard / strict / audit / extreme ✅ |
| **工具集切换** | ✅ | ✅ |
| **压缩级别切换** | ✅ | ✅ |
| **平滑过渡** | ✅（保留 session state） | ✅（保留 Phase/任务/LESSONS） |
| **自动降级** | 无 | ✅（Context > 95% → extreme） |
| **模式预览** | 无 | ✅（切换前显示影响分析） |

## 命令参考

### `/dfevo:surface` — 切换模式

```
/dfevo:surface lite      → 极速模式
/dfevo:surface standard  → 标准模式
/dfevo:surface strict    → 严格模式
/dfevo:surface audit     → 审计模式
/dfevo:surface extreme   → 极简模式
/dfevo:surface --show    → 显示当前模式
/dfevo:surface --reset   → 恢复初始模式
```

### `/dfevo:compress` — 手动压缩

```
/dfevo:compress lite     → lite 压缩
/dfevo:compress full     → full 压缩
/dfevo:compress ultra    → ultra 压缩
/dfevo:compress extreme  → extreme 压缩
/dfevo:compress wenyan-lite  → 文言文 lite
/dfevo:compress wenyan-ultra → 文言文 extreme
/dfevo:compress --status → 查看当前压缩级别
```

### `/dfevo:budget` — 预算管理

```
/dfevo:budget set 300K   → 设定 300K 预算
/dfevo:budget preset small → 使用预设
/dfevo:budget preset medium → 使用预设
/dfevo:budget preset large → 使用预设
/dfevo:budget preset enterprise → 使用预设
/dfevo:budget status     → 查看当前预算使用情况
```

## 与 hooks-system 的协同

```
Session 启动
  → hooks-system: 加载 context-monitor (50%/70%/85%/95% 阈值)
  → context-monitor: 监控中

Context > 95%
  → context-monitor 触发
  → surface-switch: 自动 extreme 模式
  → caveman-shrink: 核心工具集
  → output-compression: extreme 压缩

用户: /dfevo:surface strict
  → surface-switch: 切换到 strict
  → caveman-shrink: 加载全部工具集
  → hooks-system: 启用 review hook
  → context-monitor: 继续监控（阈值不变）
```

## 实现方式

```
layers/L2-ENGINE/surface-switch/
├── _SKILL.md          # 本文件
└── mode-configs.md    # 各模式详细配置（工具集、压缩、Hook）
```

**AI 执行方式**：
1. 接收 `/dfevo:surface [mode]` 命令
2. 读取当前模式，计算切换影响（Context 预算）
3. 展示变更预览，等用户确认
4. 执行切换：卸载旧工具集 → 加载新工具集 → 调整压缩 → 重载 Hooks
5. 记录到 dev-log

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Execution Impact |
|-------|------|------------|--------|------------------|
| **P0** | BLOCKING | Core operation fails with unrecoverable state corruption | Halt, rollback to last checkpoint, escalate | Blocks dependent operations |
| **P1** | RECOVERABLE | Operation fails but state remains consistent | Retry 3x with exponential backoff (1s→2s→4s); if still fails → document, mark NEEDS_WORK | No cross-skill impact |
| **P2** | WARNING | Operation succeeds with quality degradation | Document in SUMMARY, do NOT block execution | Continue normally |
| **P3** | DEGRADATION | Operation timeout or resource exhaustion | Cancel current sub-operation, mark PARTIAL_PASS, log to heartbeat | Cancels current op; next cycle may proceed |

**Severity Assignment Rules**:
- Default to P1 for any operation failure
- Escalate to P0 if state corruption detected or dependent operations affected
- Never demote: once P0, only manual override can clear

## Boundary Conditions

### When to Escalate Immediately
- Operation produces corrupted output → halt and rollback
- Dependency unavailable and no fallback → halt, report missing dependency

### When to Skip Operation
- Input preconditions not met → skip, log reason, proceed to next step
- Already completed in current session → skip (idempotency)

### Degradation Path
1. Full operation → 2. Retry with backoff → 3. Fallback/skip → 4. Halt and report
