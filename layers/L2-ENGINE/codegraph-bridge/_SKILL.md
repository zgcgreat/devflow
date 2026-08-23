---
name: codegraph-bridge
version: 3.0.0
layer: L2-ENGINE
gate: internal
requires: []
provides: [semantic-graph-index, affected-test-analysis, symbol-impact]
description: CodeGraph local knowledge graph bridge — integrates CodeGraph (SQLite+FTS5+Auto-Sync) as the default code intelligence, with GitNexus as fallback
source: CodeGraph + GitNexus fallback bridge
dependencies:
  - dag-router
  - token-compression-v2
triggers:
  - session start
  - Phase 2+
  - manual codegraph command
external-inputs: [project-root, codegraph-init]
---

# CodeGraph Bridge — 本地知识图谱桥接

## 核心能力

集成 [CodeGraph](https://github.com/colbymchenry/codegraph) 作为 **默认代码智能引擎**，替代/增强 GitNexus。

CodeGraph 提供 **94% 更少的工具调用、77% 更快的探索速度、100% 本地化** 的代码理解能力。

## 为什么需要 CodeGraph Bridge

### GitNexus 的局限

| 维度 | GitNexus | CodeGraph |
|------|---------|-----------|
| **部署** | MCP Server（需外部进程） | SQLite 本地文件 |
| **索引语言** | tree-sitter (部分) | 19+ 语言，tree-sitter 全量 |
| **搜索** | grep 增强 | FTS5 全文搜索 |
| **影响分析** | git-diff 符号分析 | 跨语言调用链追踪 |
| **自动更新** | 手动触发 | FSEvents/inotify/ReadDirectoryChangesW 自动 |
| **测试影响分析** | 需自定义脚本 | `codegraph affected` 内置 |
| **Framework 感知** | 有限 | 13+ Web 框架路由感知 |
| **Context 消耗** | 高（MCP 往返） | 低（本地 SQLite 查询） |

### CodeGraph 核心优势

1. **94% 减少工具调用** — 一次 `codegraph_explore` 替代 30-52 次 grep/glob/read
2. **FTS5 全文搜索** — 按名称/功能/关键词瞬间定位符号
3. **调用链追踪** — callers/callees 跨语言追踪（Python→Rust、TS→JS）
4. **测试影响分析** — `codegraph affected` 自动关联修改文件与测试
5. **Auto-Sync** — 文件修改后 2 秒自动同步，无需手动刷新
6. **Framework 路由感知** — Django/Flask/FastAPI/Express/Spring 等 13+ 框架

## 桥接架构

```
Phase 2+ 代码探索
  │
  ├── 有 .codegraph/ → CodeGraph 优先
  │   ├── codegraph_search — 符号搜索
  │   ├── codegraph_context — 任务上下文构建
  │   ├── codegraph_callers/callees — 调用链
  │   ├── codegraph_impact — 影响半径
  │   └── codegraph_affected — 测试影响分析
  │
  ├── 无 .codegraph/ 但有 GitNexus → GitNexus
  │   ├── gitnexus_call_chains
  │   ├── gitnexus_dependency_impact
  │   └── gitnexus_symbol_search
  │
  └── 两者都无 → grep fallback
      ├── glob + grep -rn
      └── 静态分析（精度有限）
```

## 初始化流程

### 自动初始化（首次使用）

```
Phase 2 开始执行时:
  1. 检查 .codegraph/ 是否存在
     ├── 存在 → CodeGraph 已就绪，使用 codegraph_search 等工具
     └── 不存在 → 提示用户是否初始化
         ├── 用户确认 → codegraph init -i → 索引完成 → 使用 CodeGraph
         └── 用户跳过 → GitNexus 或 grep fallback
```

### 手动初始化

```bash
# 在项目根目录执行
cd your-project
codegraph init -i

# 或全索引（非交互）
codegraph init --index
```

## 核心功能映射

### Phase 2 代码探索

```yaml
# CodeGraph 方式（推荐）
codegraph_context "用户登录模块的实现逻辑"
# 返回：entry_points + related_symbols + code_snippets
# Context 消耗: ~57K tokens, 0 次文件读取

# GitNexus 方式（fallback）
gitnexus_call_chains "login"
gitnexus_dependency_impact "AuthService"
# Context 消耗: ~70-90K tokens, 5-15 次文件读取
```

### Phase 3 影响分析

```yaml
# CodeGraph affected（推荐）
codegraph affected src/auth.ts src/api.ts
# 返回：受影响测试文件列表

# git diff 管道（CI 场景）
git diff --name-only HEAD | codegraph affected --stdin
```

### Phase 6 审查 — 符号影响追踪

```yaml
# 修改前检查影响半径
codegraph_impact UserService --depth 2
# 返回：所有直接/间接依赖 UserService 的模块
```

## 索引配置

```json
// .codegraph/config.json
{
  "version": 1,
  "languages": ["typescript", "javascript"],
  "exclude": ["node_modules/**", "dist/**", "build/**"],
  "frameworks": [],
  "maxFileSize": 1048576,
  "extractDocstrings": true,
  "trackCallSites": true
}
```

## Phase 集成

### Phase 2（方案设计）
- **codegraph_context** 构建任务上下文
- 替代 grep/glob 探索，减少 94% 工具调用

### Phase 3（任务拆分）
- **codegraph_impact** 分析修改影响半径
- **codegraph_affected** 关联测试文件

### Phase 4（实施）
- Auto-Sync 自动保持索引最新
- **codegraph_search** 快速定位符号

### Phase 6（审查）
- **codegraph_callers/callees** 调用链验证
- **codegraph_impact** 回归影响分析

## 降级策略

```
CodeGraph 优先:
  ├── Phase 2+: 始终优先使用 CodeGraph
  ├── CodeGraph 索引损坏 → codegraph init --force 重建
  ├── CodeGraph 未安装 → GitNexus fallback
  └── GitNexus 也失败 → grep + glob 降级

降级精度声明:
  ├── grep fallback: 文件搜索 ✅, 调用链 ⚠️, 影响分析 🟡
  ├── CodeGraph 本地: 文件搜索 ✅, 调用链 ✅, 影响分析 ✅
  └── GitNexus: 文件搜索 ✅, 调用链 ✅, 影响分析 ✅ (需外部 MCP)
```

## 效果基准（CodeGraph vs 无 CodeGraph）

| 代码库 | 无 CodeGraph | 有 CodeGraph | 改进 |
|--------|------------|-------------|------|
| VS Code | 52 工具调用, 1m37s | 3 工具调用, 17s | **94% 减少, 82% 加速** |
| Excalidraw | 47 工具调用, 1m45s | 3 工具调用, 29s | **94% 减少, 72% 加速** |
| Claude Code | 40 工具调用, 1m08s | 3 工具调用, 39s | **93% 减少, 43% 加速** |

> 数据来源: CodeGraph 官方基准测试，6 个真实代码库对比。

## 实现方式

```
layers/L2-ENGINE/codegraph-bridge/
├── _SKILL.md          # 本文件
└── integration.md     # GitNexus/CodeGraph/grep 三路切换流程
```

**AI 执行方式**：
1. Phase 2 开始时检查 `.codegraph/` 目录
2. 有 → 使用 codegraph_search/codegraph_context
3. 无 → 提示初始化或走 GitNexus/grep fallback

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
