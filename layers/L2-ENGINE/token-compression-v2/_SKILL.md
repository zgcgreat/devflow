---
name: token-compression-v2
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: []
provides: [compressed-context, budget-report]
description: Enhanced token compression with tiered strategies, auto-trigger on phase transitions, and context budget management
source: caveman-compress + GSD context-budget + superpowers Karpathy rules
dependencies:
  - memory-compression
  - executor
triggers:
  - phase transition
  - context window threshold
  - manual compress command
external-inputs: [context-data, compression-trigger]
---

# Token Compression v2 — 分级压缩引擎

## 核心升级

在现有 caveman-compress 基础上增加三级能力：

### 1. 分级压缩策略（7 级，整合 caveman 全部模式）

| 级别 | 目标 | 触发条件 | 压缩方法 | 输出示例 |
|------|------|---------|---------|---------|
| `lite` | 减少 40% | 常规使用 | 移除冗余词汇、合并短句 | "Component re-renders because new ref each render. Use `useMemo`." |
| `full` | 减少 65% | Phase 5 | 片段 OK，短同义词 | "New obj ref each render. Inline prop = new ref = re-render. `useMemo`." |
| `ultra` | 减少 75% | Context > 80%, Phase 4 | 缩写+箭头，代码不变 | "Inline obj prop → new ref → re-render. `useMemo`." |
| `wenyan-lite` | 减少 70% | Phase 8 | 半文言文，保留语法 | "組件頻重繪，以每繪新生對象參照故。以 useMemo 包之。" |
| `wenyan-full` | 减少 80% | Phase 8 归档 | 全文言文 | "物出新參照，致重繪。useMemo .Wrap之。" |
| `wenyan-ultra` | 减少 90% | Phase 8 极简 | 极限文言文 | "新參照→重繪。useMemo Wrap。" |
| `extreme` | 减少 90% | Context > 95% | 仅关键词+代码 | "inline obj → new ref → re-render. `useMemo`." |

> 完整 7 级压缩规则详见 `layers/L2-ENGINE/output-compression/_SKILL.md`（AI 输出压缩）。
> memory-compression 使用 lite/full/ultra/extreme 四级。

### 2. 自动触发机制

```
Phase 变更时:
  ├── Phase 0→1: 无压缩（初始阶段需要完整上下文）
  ├── Phase 1→2: lite 压缩（需求已确认，移除填充词）
  ├── Phase 2→3: lite 压缩（设计完成，保留技术术语）
  ├── Phase 3→4: ultra 压缩（任务明确，大幅压缩上下文）
  ├── Phase 4→5: ultra 压缩（构建阶段，上下文消耗最大）
  ├── Phase 5→6: lite 压缩（测试阶段需还原细节）
  ├── Phase 6→7: lite 压缩（审查需完整上下文）
  └── Phase 7→8: ultra 压缩（归档阶段，保留摘要即可）
```

### 3. Context Budget 管理

```
总预算: 200K tokens (模型上下文窗口)

分配:
├── System Prompt:    10K (5%)
├── Skills/Rules:     20K (10%)
├── Memory:           30K (15%)  ← 压缩目标
├── 当前 Phase 上下文: 80K (40%)
├── 代码/文件内容:     40K (20%)
└── 缓冲区:           20K (10%)
```

## 与 caveman-compress 的关系

- caveman-compress 是底层压缩引擎
- token-compression-v2 是调度层，决定何时压缩、压缩到什么级别
- 两者协同：v2 调用 caveman 的 CLI 工具执行实际压缩

## Phase 集成

### Phase 3 (Task Plan) — 预算规划

在任务规划阶段，预估每个 Wave 的 context 消耗：

```yaml
wave_budget:
  wave_1:
    estimated_context: 60K
    compression_needed: lite
    files_to_compress: [DECISIONS.md, LESSONS.md]
  wave_2:
    estimated_context: 90K
    compression_needed: ultra
    files_to_compress: [DECISIONS.md, LESSONS.md, PATTERNS.md]
```

### Phase 4 (Build) — 自动压缩

在每个 Wave 开始时：
1. 评估当前 context 使用量
2. 如超过 80%，触发 ultra 压缩
3. 如超过 95%，触发 extreme 压缩
4. 记录压缩操作到 dev-log

### Phase 8 (Archive) — 归档压缩

归档时对记忆文件执行最终压缩，为下一轮需求保留精炼摘要。

## 实现方式

```
layers/L2-ENGINE/token-compression-v2/
├── _SKILL.md          # 本文件（零脚本，AI 按指令执行压缩）
└── (压缩策略详见下方各级别描述)
```

## Karpathy 规则集成

来自 superpowers 的 Karpathy 规则：

1. **代码 > 注释** — 代码本身应自解释，注释只在解释"为什么"时存在
2. **删除 > 精简** — 如果一段文本删掉不影响理解，就删掉
3. **示例 > 描述** — 用代码示例替代文字描述
4. **结构 > 内容** — 良好的结构比内容更重要

应用方式：在 ultra/extreme 级别压缩时，优先保留代码块和结构，移除描述性文本。

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
