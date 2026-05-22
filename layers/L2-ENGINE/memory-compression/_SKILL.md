---
name: memory-compression
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: []
provides: [compressed-file, original-backup]
description: >
  Compress natural language memory files (CLAUDE.md, todos, preferences) into caveman format
  to save input tokens. Preserves all technical substance, code, URLs, and structure.
  Compressed version overwrites the original file. Human-readable backup saved as FILE.original.md.
  Trigger: /caveman-compress FILEPATH or "compress memory file"
external-inputs: [memory-file-input]
---

# Caveman Compress — memory-compression

## Purpose

Compress natural language files (CLAUDE.md, todos, preferences) into caveman-speak to reduce input tokens. Compressed version overwrites original. Human-readable backup saved as `<filename>.original.md`.

## 压缩级别

| 级别 | 减少 | 适用场景 |
|------|------|---------|
| `lite` | ~40% | 需要保留可读性的归档文件 |
| `full` | ~65% | 常规压缩，默认级别 |
| `ultra` | ~75% | Phase 8 归档，追求极致节省 |
| `extreme` | ~90% | 上下文 >95% 时紧急压缩 |

> 完整 7 级（含 wenyan 系列）见 `token-compression-v2/_SKILL.md`。
> AI 输出压缩见 `output-compression/_SKILL.md`。

## Trigger

`/caveman-compress <filepath>` or when user asks to compress a memory file.

## Process

1. AI 直接按本文件的压缩规则执行压缩，无需外部脚本。

2. AI 读取目标文件，按压缩规则处理，输出覆盖原文件，备份为 `<filename>.original.md`。

3. 验证输出：
- 检测文件类型
- 压缩后验证内容完整性
- 如有错误：针对性修复（不复压）
- 最多重试 2 次
- 2 次后仍失败：报告错误，保留原文件不动

4. Return result to user

## Compression Rules

### Remove
- Articles: a, an, the
- Filler: just, really, basically, actually, simply, essentially, generally
- Pleasantries: "sure", "certainly", "of course", "happy to", "I'd recommend"
- Hedging: "it might be worth", "you could consider", "it would be good to"
- Redundant phrasing: "in order to" → "to", "make sure to" → "ensure", "the reason is because" → "because"
- Connective fluff: "however", "furthermore", "additionally", "in addition"

### Preserve EXACTLY (never modify)
- Code blocks (fenced ``` and indented)
- Inline code (`backtick content`)
- URLs and links (full URLs, markdown links)
- File paths (`/src/components/...`, `./config.yaml`)
- Commands (`npm install`, `git commit`, `docker build`)
- Technical terms (library names, API names, protocols, algorithms)
- Proper nouns (project names, people, companies)
- Dates, version numbers, numeric values
- Environment variables (`$HOME`, `NODE_ENV`)

### Preserve Structure
- All markdown headings (keep exact heading text, compress body below)
- Bullet point hierarchy (keep nesting level)
- Numbered lists (keep numbering)
- Tables (compress cell text, keep structure)
- Frontmatter/YAML headers in markdown files

### Compress
- Use short synonyms: "big" not "extensive", "fix" not "implement a solution for", "use" not "utilize"
- Fragments OK: "Run tests before commit" not "You should always run tests before committing"
- Drop "you should", "make sure to", "remember to" — just state the action
- Merge redundant bullets that say the same thing differently
- Keep one example where multiple examples show the same pattern

CRITICAL RULE:
Anything inside ``` ... ``` must be copied EXACTLY.
Do not:
- remove comments
- remove spacing
- reorder lines
- shorten commands
- simplify anything

Inline code (`...`) must be preserved EXACTLY.
Do not modify anything inside backticks.

If file contains code blocks:
- Treat code blocks as read-only regions
- Only compress text outside them
- Do not merge sections around code

## Pattern

Original:
> You should always make sure to run the test suite before pushing any changes to the main branch. This is important because it helps catch bugs early and prevents broken builds from being deployed to production.

Compressed:
> Run tests before push to main. Catch bugs early, prevent broken prod deploys.

Original:
> The application uses a microservices architecture with the following components. The API gateway handles all incoming requests and routes them to the appropriate service. The authentication service is responsible for managing user sessions and JWT tokens.

Compressed:
> Microservices architecture. API gateway route all requests to services. Auth service manage user sessions + JWT tokens.

## Boundaries

- ONLY compress natural language files (.md, .txt, .typ, .typst, .tex, extensionless)
- NEVER modify: .py, .js, .ts, .json, .yaml, .yml, .toml, .env, .lock, .css, .html, .xml, .sql, .sh
- If file has mixed content (prose + code), compress ONLY the prose sections
- If unsure whether something is code or prose, leave it unchanged
- Original file is backed up as FILE.original.md before overwriting
- Never compress FILE.original.md (skip it)

## Error Taxonomy (P0 → P3)

| Level | Name | Definition | Action | Execution Impact |
|-------|------|------------|--------|------------------|
| **P0** | BLOCKING | Code block or URL corrupted during compression | Restore from .original.md backup immediately | Compression blocked; original file preserved |
| **P1** | RECOVERABLE | Structure lost — heading hierarchy flattened or table broken | Targeted repair of affected section (do not recompress) | Minor data quality loss; recoverable |
| **P2** | WARNING | Over-compression — technical terms abbreviated beyond recognition | Flag for review; add to exclusion list | Continue; document in SUMMARY |
| **P3** | DEGRADATION | Backup .original.md missing or corrupted | Proceed with caution; flag for manual verification | Reduced safety net; higher risk |

**Severity Assignment Rules**:
- Default to P1 for any structural damage
- Escalate to P0 if code blocks or URLs are affected (never-modify rule violation)
- Never demote: once P0, only manual verification can clear

## Boundary Conditions

### When to Refuse Compression
- File is not natural language (.py, .js, .ts, .json, .yaml, .toml, .env) → refuse
- File already compressed (.original.md backup exists) → skip
- File contains >50% code by line count → compress only prose sections

### When to Use Conservative Compression
- File contains legal/compliance text → lite level only
- File is shared across team → warn that compression changes readability
- First time compressing → use lite or full, never extreme

### Degradation Path
1. lite → full → ultra → extreme (only when context > 95%)
