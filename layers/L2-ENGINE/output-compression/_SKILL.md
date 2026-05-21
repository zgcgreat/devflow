---
name: output-compression
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: [response-context]
provides: [compressed-output, clarity-exception]
description: >
  AI output compression — compresses all AI responses during high-compression phases.
  Supports 7 intensity levels from lite to wenyan-ultra. Auto-clarity ensures
  technical accuracy is preserved. Triggers in Phase 4-5 (ultra), Phase 6-7 (lite).
source: caveman skills/caveman (7 levels) + superpowers Karpathy rules
dependencies:
  - token-compression-v2
  - memory-compression
---

# Output Compression — AI 输出压缩

## Purpose

在 Phase 4-5 高消耗阶段压缩 AI 输出，减少 ~75% token，保持 100% 技术准确性。
压缩的是 AI 的"嘴巴"，不是"脑子"。

## 7 级压缩模式

| 级别 | 减少 | Phase | 说明 |
|------|------|-------|------|
| `lite` | ~40% | Phase 6-7 | 去填充词，保留完整句式 |
| `full` | ~65% | Phase 5 | 经典 caveman，片段 OK |
| `ultra` | ~75% | Phase 4 | 缩写+箭头，代码不变 |
| `wenyan-lite` | ~70% | Phase 8 | 半文言文 |
| `wenyan-full` | ~80% | Phase 8 | 全文言文 |
| `wenyan-ultra` | ~90% | Phase 8 | 极限文言文 |
| `extreme` | ~90% | Phase 4-5 高峰 | 仅关键词+代码 |

## 自动触发

```
Phase 变更时:
  ├── Phase 0→1: 无压缩（需求确认需要完整描述）
  ├── Phase 1→2: 无压缩（5 Whys 需要展开分析）
  ├── Phase 2→3: lite（需求确认，去除填充词）
  ├── Phase 3→4: full（任务明确，AI 回复压缩）
  ├── Phase 4→5: ultra（构建阶段，AI 回复大幅压缩）
  ├── Phase 5→6: full（测试阶段，AI 回复保持压缩）
  ├── Phase 6→7: lite（审查需还原细节）
  └── Phase 7→8: ultra（归档，AI 回复压缩到极致）
```

## 自动降级（Auto-Clarity）

以下场景自动退回到 lite 或正常输出：

| 场景 | 降级到 | 原因 |
|------|--------|------|
| Security warnings | lite | "Drop table `users`" 可能有歧义 |
| Irreversible action | lite | "Delete all rows in `users`" |
| Multi-step sequence | lite | 顺序/因果需要清晰 |
| Compression creates ambiguity | normal | 压缩本身导致技术歧义 |
| User asks to clarify | normal | 用户要求展开 |

## 压缩规则（与 memory-compression 一致）

### Remove
- Articles: a, an, the
- Filler: just, really, basically, actually
- Pleasantries: "Sure", "Happy to", "I'd recommend"
- Hedging: "It might be worth", "You could consider"
- Connective fluff: however, furthermore, additionally

### Preserve EXACTLY
- Code blocks, inline code, URLs, file paths
- Commands, API names, library names
- Technical terms, version numbers
- Error strings (exact match)

### Compress
- Short synonyms: "fix" not "implement a solution for"
- Fragments OK: "Run tests before commit" not "You should run tests"
- Arrows for causality: X → Y
- Drop "you should", "make sure to"

## 示例

### Phase 4 (ultra)

> Normal: "The authentication module has a potential null pointer exception when the user object is not properly initialized before the token validation step."
>
> Ultra: "Auth: user null → NPE in token validation. Add init guard."

### Phase 8 (wenyan-ultra)

> Normal: "Lessons learned: The database migration script failed due to a schema mismatch between the development environment and the staging environment. Future migrations should include a pre-flight check."
>
> Wenyan-ultra: "DB migration fail. Schema mismatch: dev vs staging. Pre-flight check needed."

## 与 token-compression-v2 的关系

- output-compression 压缩 **AI 输出文本**
- token-compression-v2 管理 **上下文压缩策略**
- memory-compression 压缩 **记忆文件**
- 三者共享同一套压缩规则，但作用对象不同

## Boundaries

- 仅压缩 AI 输出，不压缩用户输入
- Phase 0-3 不压缩（需求确认需要完整描述）
- Phase 6 不压缩（审查需要还原细节）
- Phase 8 extreme 仅用于归档摘要
- 代码块永远不变
