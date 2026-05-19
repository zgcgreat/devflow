---
name: l3-architecture-index
version: 3.0-draft
description: |
  L3 Architecture layer index and protocol document for Mega-Workflow.
  Layer 3 负责全局协调、路由、和 Agent 上下文管理。 (devflow)
layer: L3-ARCHITECTURE
---

# L3-ARCHITECTURE — Mega-Workflow 架构层

> Layer 3 负责全局协调、路由、和 Agent 上下文管理。
> **状态**: v3.0 Protocol Implementation Complete (三个核心模块已落地)

---

## 目录结构

```
L3-ARCHITECTURE/
├── _SKILL.md          ← 本文件 (协议文档 + pseudocode)
├── README.md          ← 架构层总览
├── dag-router/
│   └── _SKILL.md      ✅ Kahn topological sort + wave classification + worktree assignment
├── provider-gateway/
│   └── _SKILL.md      ✅ Multi-provider routing + fallback chain + cost awareness
├── agent-isolation/
│   └── _SKILL.md      ✅ ~200K budget per agent + 6-module loading order + cross-agent channels
├── parallel-engine/
│   └── _SKILL.md      ✅ Wave N 并行编排引擎 + 协调点生成 + 错误恢复协议
└── memory-manager/    (stub — bin/memory-system.js 存在但未集成)
```

---

## 核心职责 (Protocol Spec)

| 模块 | 职责 | 输入 | 输出 | 实现状态 |
|------|------|------|------|---------|
| **dag-router** | 任务依赖分析 → Topological Sort | Task List (Phase 3) | Wave-PLAN.md | ✅ Completed |
| **provider-gateway** | 按任务类型选模型 + fallback chain | WAVE-PLAN.md type labels | Provider assignment table | ✅ Completed |
| **agent-isolation** | ~50K/~200K context 隔离 | WAVE-PLAN.md + provider table | Per-agent isolated context | ✅ Completed |
| **parallel-engine** | Wave N 并行编排 + 错误恢复 | WAVE-PLAN.md + Provider table | Parallel Execution Plan | ✅ Completed |
| **memory-manager** | LESSONS/Domain Skills 管理 | Phase 完成结果 | 经验沉淀 | ⏳ Stub (via L1 Phase 8) |

| 模块 | 职责 | 输入 | 输出 | 当前实现方式 |
|------|------|------|------|-------------|
| **dag-router** | 任务依赖分析 → Topological Sort | Task List (Phase 3) | Wave 分组建议 | `phase-3-task-plan/_SKILL.md` Step 2 |
| **provider-gateway** | 按任务类型选模型 | Phase / Task Type | Model/Provider 选择 | R10 规则 + Phase Skills 内联路由 |
| **agent-isolation** | ~50K/~200K context 隔离 | 全局 Context | Agent 专用 Context | R7 规则 + Phase Skills Agent 定义 |
| **parallel-engine** | Wave N 并行编排 | DAG (Phase 3 输出) | 并行执行计划 | L2 wave-executor 伪代码 + L1 Phase 4 协调 |
| **memory-manager** | LESSONS/Domain Skills 管理 | Phase 完成结果 | 经验沉淀 | L1 Phase 8 + memory/LESSONS.md |

---

## DAG 路由规则 (Kahn Algorithm)

```python
# pseudocode — 完整实现在 layers/L2-ENGINE/wave-executor/_SKILL.md
def kahn_topological_sort(tasks):
    """tasks: List[Task{id, deps[]}] → returns List[Wave]"""
    in_degree = {t.id: len(t.deps) for t in tasks}
    waves = []
    remaining = set(tasks)
    while remaining:
        ready = [t for t in remaining if in_degree[t.id] == 0]
        if not ready:
            raise CycleError("DAG contains cycle")
        waves.append(ready)  # ← Wave N = ready tasks (并行执行)
        remaining -= set(ready)
        for t in remaining:
            if any(r.id in t.deps for r in ready):
                in_degree[t.id] -= 1
    return waves
```

---

## Provider 智能选择 (Rule-based)

| 任务类型 | 推荐 Provider | 规则引用 |
|----------|-------------|---------|
| 创意/设计 | 高创造力模型 | R10.1, Phase 2 _SKILL.md |
| 编码实现 | 高代码能力模型 | R10.2, Phase 4 _SKILL.md |
| 代码审查 | 高分析能力模型 | R10.3, Phase 6 review |
| 信息检索 | 高检索能力模型 | R10.4, Phase 1 _SKILL.md |

---

## Agent 上下文隔离 (R7)

| Agent | 上下文上限 | 触发 Phase | 实现文件 |
|-------|-----------|-----------|---------|
| Orchestrator | ~50K tokens | All Phases | GO.md (路由声明) |
| Research | ~200K tokens | Phase 1-2 | phase-1-5whys/_SKILL.md, phase-2-design/_SKILL.md |
| Execution | ~200K tokens | Phase 4 | phase-4-build/_SKILL.md |

---

## 记忆管理 (Phase 8 + LESSONS)

### 沉淀内容 → 文件位置

| 内容 | 文件路径 | 触发阶段 |
|------|---------|---------|
| **LESSONS** | `memory/LESSONS.md` | Phase 7+ 每 Wave 结束前 |
| **Domain Skills** | `memory/domain-skills/<name>/SKILL.md` | LESSON 引用 ≥ 3 次 |
| **DECISIONS** | `memory/DECISIONS.md` | 关键架构决策时 |
| **KNOWN_FAILURES** | `memory/KNOWN_FAILURES.md` | Phase 6 审查发现 |
| **Wave Summary** | `memory/SUMMARY-WAVE-{N}.md` | Wave N 完成后 |

### 跨波注入协议 (R15)
Phase N+1 启动前 → 读取 SUMMARY-WAVE-{N} + LESSONS 中相关条目 → 注入 Execution Agent context (≤5 skills, ~200K tokens)
