---
name: l3-architecture-index
version: 3.2.2
layer: L3-ARCHITECTURE
gate: internal
requires: []
provides: [l3-module-registry, cross-layer-contracts]
description: |
  L3 Architecture layer index and protocol document for 架构层.
  Layer 3 负责全局协调、路由、和 Agent 上下文管理。 (DevFlow v3.2.2)
runtime-inputs: [l2-engine-output]
---

# L3-ARCHITECTURE — 架构层

> Layer 3 负责全局协调、路由、和 Agent 上下文管理。
> **状态**: v3.2.2 — 共 **13 个模块** 已落地（含 1 个已弃用；旧索引中的 `memory-manager` 实为幽灵条目，从未实现）。

---

## 目录结构（完整注册表）

```
L3-ARCHITECTURE/
├── _SKILL.md          ← 本文件 (协议文档 + 模块注册表)
├── README.md          ← 架构层总览
│
├── 【路由与编排 / Routing & Orchestration】
├── dag-router/        ✅ Kahn 拓扑排序 + Wave 分组 + worktree 分配
├── parallel-engine/   ✅ Wave N 并行编排引擎 + 协调点生成 + 错误恢复协议
├── agent-isolation/   ✅ ~200K budget/Agent + 6-module 加载顺序 + 跨 Agent 通道
├── provider-gateway/  ✅ 多 Provider 路由 + fallback chain + 成本感知
├── model-selection-strategy/ ✅ 任务类型→最优模型映射 + 降级链
│
├── 【代码智能 / Code Intelligence】
├── gitnexus-bridge/   ✅ GitNexus 深度代码分析桥接 (知识图谱: 44 node / 21 edge types)
├── blast-radius/      ✅ 变更影响分析引擎 (CodeGraph/AST) → Phase5/6 用
├── code-intelligence/ ⚠️ DEPRECATED → 已被 gitnexus-bridge 替代（保留仅供查阅）
│
├── 【记忆 / Memory】
├── vector-memory/     ✅ 向量记忆系统 (SQLite + HNSW 语义检索, BM25+Vector+RRF)
│
├── 【配置与扩展 / Config & Extension】
├── install-profiles/  ✅ 预配置安装 profile (solo-dev / small-team / enterprise ...)
├── preset-system/     ✅ 预设扩展系统 (minimal / standard / enterprise + 自定义 YAML)
├── layer-interfaces/  ✅ L1↔L2↔L3 层间接口契约 (降低耦合, 独立演进)
│
└── 【维护性 / Maintenance】
    └── dedup-cleanup/ 📋 去重清理计划 (stage-skills/ 已于 2026-05-22 删除)
```

> **幽灵条目说明**：旧索引将 `memory-manager` 标为 "stub — bin/memory-system.js 存在但未集成"。
> 经核查，该目录与 `bin/memory-system.js` **均不存在**；经验沉淀现由
> **`vector-memory`（向量语义检索）+ L1 Phase 8 + memory/LESSONS.md** 共同承担。
> 本索引不再保留该条目。

---

## 核心职责（模块注册表）

| 模块 | 类别 | 职责 | 输入 | 输出 | 状态 |
|------|------|------|------|------|------|
| **dag-router** | 路由编排 | 任务依赖分析 → Topological Sort | Task List (Phase 3) | Wave-PLAN.md | ✅ Completed |
| **parallel-engine** | 路由编排 | Wave N 并行编排 + 错误恢复 | WAVE-PLAN.md + Provider table | Parallel Execution Plan | ✅ Completed |
| **agent-isolation** | 路由编排 | ~50K/~200K context 隔离 | WAVE-PLAN.md + provider table | Per-agent isolated context | ✅ Completed |
| **provider-gateway** | 路由编排 | 按任务类型选模型 + fallback + 成本感知 | WAVE-PLAN.md type labels | Provider assignment table | ✅ Completed |
| **model-selection-strategy** | 路由编排 | 任务类型→最优模型 + 降级链 | task-type / runtime detection | model-assignment, fallback-chain | ✅ Completed |
| **gitnexus-bridge** | 代码智能 | GitNexus 知识图谱桥接 (替代旧 regex 分析) | code-analysis-request / git-diff | ast-results, call-chains, impact-analysis, dependency-graph | ✅ Completed |
| **blast-radius** | 代码智能 | 变更影响分析 (CodeGraph/AST) | git diff | impact-analysis, change-propagation, test-scope | ✅ Completed |
| **code-intelligence** | 代码智能 | ⚠️ **已弃用** | — | — | ⛔ DEPRECATED (→ gitnexus-bridge) |
| **vector-memory** | 记忆 | 向量记忆 (SQLite + HNSW) 语义检索 | lessons-data, execution-observations | semantic-search, hybrid-retrieval, memory-lifecycle | ✅ Completed |
| **install-profiles** | 配置扩展 | 按项目/团队预置安装 profile | project-type, team-size | configured-profile, enabled-modules | ✅ Completed |
| **preset-system** | 配置扩展 | 用户定制 Phase 模板的预设机制 | setup 配置 / PROJECT_CONSTITUTION | preset-loading, phase-override, rule/agent-addition | ✅ Completed |
| **layer-interfaces** | 配置扩展 | L1/L2/L3 层间接口契约 | cross-layer-call | interface-contract, coupling-report | ✅ Completed |
| **dedup-cleanup** | 维护性 | stage-skills/ & references/ 去重计划 | duplication-report | cleanup-plan, deduplicated-structure | 📋 Planned (stage-skills 已删除) |

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

> 更细粒度的「任务类型 → 首选模型 + 降级链」映射见 `model-selection-strategy/_SKILL.md`。

---

## Agent 上下文隔离 (R7)

| Agent | 上下文上限 | 触发 Phase | 实现文件 |
|-------|-----------|-----------|---------|
| Orchestrator | ~50K tokens | All Phases | GO.md (路由声明) |
| Research | ~200K tokens | Phase 1-2 | phase-1-5whys/_SKILL.md, phase-2-design/_SKILL.md |
| Execution | ~200K tokens | Phase 4 | phase-4-build/_SKILL.md |

---

## 记忆管理 (vector-memory + Phase 8 + LESSONS)

`memory-manager` 的规划职责已下沉到以下真实组件：

| 内容 | 文件路径 | 触发阶段 | 检索方式 |
|------|---------|----------|---------|
| **LESSONS** | `memory/LESSONS.md` | Phase 7+ 每 Wave 结束前 | `vector-memory` 语义检索 + 全文 |
| **Domain Skills** | `memory/domain-skills/<name>/SKILL.md` | LESSON 引用 ≥ 3 次 | 向量聚类 |
| **DECISIONS** | `memory/DECISIONS.md` | 关键架构决策时 | 全文 |
| **KNOWN_FAILURES** | `memory/KNOWN_FAILURES.md` | Phase 6 审查发现 | 向量检索 |
| **Wave Summary** | `memory/SUMMARY-WAVE-{N}.md` | Wave N 完成后 | 全文 |

### 跨波注入协议 (R15)
Phase N+1 启动前 → 读取 SUMMARY-WAVE-{N} + LESSONS 中相关条目 → 注入 Execution Agent context (≤5 skills, ~200K tokens)

> 语义级去重与相似性召回由 `vector-memory`（SQLite + HNSW, BM25+Vector+RRF 融合, 延迟 <100ms）承担，
> 替代旧 LESSONS.md 纯文本全文匹配，准确率提升 3x+。
