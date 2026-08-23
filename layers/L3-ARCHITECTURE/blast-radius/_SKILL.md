---
name: blast-radius
preamble-tier: 1
version: 1.0.0
layer: L3-ARCHITECTURE
gate: internal
requires: [vector-memory, dag-router]
provides: [impact-analysis, change-propagation, test-scope-recommendation]
description: |
  Blast Radius Engine — 变更影响分析引擎。
  基于 CodeGraph/AST 分析，预测代码变更的传播范围和影响等级。
  用于 Phase 5 测试范围确定和 Phase 6 审查影响分析。
  参考: GitNexus Blast Radius Analysis。
source: INTEGRATION-PLAN 6.1 — GitNexus knowledge graph + Blast Radius
dependencies:
  - vector-memory (历史变更影响模式)
  - dag-router (DAG 依赖图)
triggers:
  - Phase 5 测试范围确定
  - Phase 6 审查影响分析
  - 手动: /impact <file-path>
---

# Blast Radius Engine — 变更影响分析

> **核心问题**: 代码变更可能影响其他模块，但缺乏系统性的影响分析，导致测试覆盖不足。
> **解决方案**: Blast Radius Engine 基于代码知识图谱和 AST 分析，预测变更传播范围和影响等级。

---

## 1. 影响分析流程

```
代码变更 (git diff)
  │
  ├─→ Step 1: 识别变更点
  │   ├─ 修改的函数/类/接口
  │   ├─ 新增/删除的导出
  │   └─ 变更的配置/数据结构
  │
  ├─→ Step 2: 依赖图遍历
  │   ├─ 直接引用 (import/use)
  │   ├─ 间接引用 (传递依赖)
  │   └─ 接口实现 (implements/extends)
  │
  ├─→ Step 3: 影响分级
  │   ├─ 🔴 高置信度直接影响 → 必须测试
  │   ├─ 🟡 中置信度间接影响 → 推荐测试
  │   └─ 🟢 低置信度可能影响 → 可选测试
  │
  └─→ Step 4: 输出
      ├─ impact-report.md
      ├─ test-recommendations.md
      └─ review-focus-areas.md
```

---

## 2. 集成点

| Phase | 工具 | 用途 |
|-------|------|------|
| Phase 0 | `context` | Brownfield 入场检测，理解代码结构 |
| Phase 2 | `impact` | 设计方案的影响分析 |
| Phase 4 | `context` + `search` | 编码时的代码搜索和理解 |
| Phase 5 | `impact` | 测试范围确定 (Blast Radius) |
| Phase 6 | `impact` | 审查时的影响分析 |

---

## 3. 测试范围推荐

### 3.1 Phase 5 测试范围确定

```markdown
## Blast Radius Test Recommendations

### 🔴 必须测试 (高置信度直接影响)

| 文件 | 原因 | 测试类型 |
|------|------|---------|
| src/auth/login.service.ts | 直接修改 | 单元测试 |
| src/auth/login.controller.ts | 调用修改函数 | 集成测试 |
| tests/auth/login.spec.ts | 对应测试文件 | 更新测试 |

### 🟡 推荐测试 (中置信度间接影响)

| 文件 | 原因 | 路径 |
|------|------|------|
| src/auth/register.service.ts | 共享数据库模型 | login.service → UserModel → register.service |
| src/api/middleware/auth.guard.ts | 依赖认证结果 | login.service → AuthService → auth.guard |

### 🟢 可选测试 (低置信度可能影响)

| 文件 | 原因 | 路径 |
|------|------|------|
| src/shared/logger.ts | 被修改函数引用 | login.service → logger |
```

---

## 4. 降级策略

| 场景 | 降级行为 |
|------|---------|
| GitNexus MCP 不可用 | 基于 git diff + grep 的简化影响分析 |
| 无 AST 解析能力 | 仅分析 import/require 依赖 |
| 知识图谱为空 | 仅分析直接引用（不追溯间接依赖） |

---

## 5. 与 Auto-generated Repo Skills 集成

```
Phase 0 入场检测:
  1. 调用 GitNexus 分析代码库结构
  2. 识别功能区域 (auth, payment, search, ...)
  3. 为每个区域生成专属技能描述
  4. 写入 .forgeos/memory/domain-skills/

格式:
  .forgeos/memory/domain-skills/
  ├── auth.md         # 认证区域技能
  │   ├── trigger: "auth-*", "login", "token"
  │   ├── key-files: ["src/auth/", "tests/auth/"]
  │   └── patterns: ["JWT", "session", "OAuth"]
  ├── payment.md
  └── search.md
```