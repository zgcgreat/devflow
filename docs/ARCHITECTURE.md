# DevFlow 架构文档

> 版本: 3.3.1 | 日期: 2026-10-24 (更新于门控强制硬化)

---

## 1. 三层架构

DevFlow 继承 DevFlow 的三层架构，在 L2 引擎层增加了 Gate-Hook 桥接。

```
┌─────────────────────────────────────────┐
│  L1-INTERACTION  交互层                  │
│  Phase 0-8 Skills + 变体                 │
│  (用户交互、Gate确认、增强能力注入)        │
├─────────────────────────────────────────┤
│  L2-ENGINE  引擎层                       │
│  Wave Executor + LearningWorkflow        │
│  + Gate-Hook Bridge ← 新增              │
├─────────────────────────────────────────┤
│  L3-ARCHITECTURE  架构层                  │
│  DAG Router + Provider Gateway           │
│  + Agent Isolation + Parallel Engine     │
└─────────────────────────────────────────┘
```

### L1-INTERACTION (交互层)

负责用户交互和流程控制：

| Phase | 名称 | Gate | 核心 Agent | Hook |
|-------|------|------|-----------|------|
| Phase 0 | Strategy | G0 | planner, code-explorer | — |
| Phase 1 | 5-Whys | G1→G2 | planner | — |
| Phase 1b | Discuss | G2.5 | planner, architect | — |
| Phase 2 | Design | G3 | architect, code-explorer | — |
| Phase 2a | Shotgun | G3.5 | architect | — |
| Phase 3 | Task Plan | G4 | planner | — |
| Phase 4 | Build | **G5** | build-error-resolver | **format-typecheck + console-log-check** |
| Phase 5 | Test | **G6** | tdd-guide, security-reviewer | **security-scan** |
| Phase 6 | Review | **G7** | code-reviewer, refactor-cleaner, security-reviewer | **format-typecheck + security-scan** |
| Phase 7 | Canary | G7.5 | — | — |
| Phase 8 | Archive | G8 | — | — |

### L2-ENGINE (引擎层)

| 模块 | 来源 | 职责 |
|------|------|------|
| Wave Executor | DevFlow | 多 Wave 构建执行 |
| Learning Workflow | DevFlow | LESSONS 沉淀 + Domain Skills 晋升 |
| Gate-Hook Bridge | **新增** | Gate↔Hook 协同桥接 |

### L3-ARCHITECTURE (架构层)

| 模块 | 来源 | 职责 |
|------|------|------|
| DAG Router | DevFlow | Kahn 拓扑排序 + 4 级并行度 |
| Provider Gateway | DevFlow | 6 任务类型选择矩阵 |
| Agent Isolation | DevFlow | ~200K/Agent 预算 + Wave 轮转 |
| Parallel Engine | DevFlow | 并行任务调度 |
| GitNexus Bridge | DevFlow | 代码智能 (tree-sitter + graphDB) |

---

## 2. Gate-Hook 协同模型

```
Phase 4 → G5 Gate → [format-typecheck] + [console-log-check]
                     │           │
                     ├─ FAIL → Gate FAIL (硬阻断)
                     ├─ PASS → 人工确认
                     └─ ERROR → 降级 WARNING

Phase 5 → G6 Gate → [security-scan]
                     │           │
                     ├─ FAIL → Gate FAIL (硬阻断)
                     └─ PASS → 人工确认

Phase 6 → G7 Gate → [format-typecheck] + [security-scan]
                     │           │
                     ├─ FAIL → Gate FAIL (硬阻断)
                     └─ PASS → 人工确认
```

降级策略：无 Node.js 运行时时，Hook 退化为 `hooks/checklist-fallback.md` 中的 Markdown 检查清单，由 AI 自查替代。

详见 [`layers/L2-ENGINE/executor/_SKILL.md`](../layers/L2-ENGINE/executor/_SKILL.md)（Gate 桥接由 executor 内置）。

---

## 3. Agent 加载策略

### 核心 Agent (8个, 始终加载)

| Agent | 映射 Phase | Token 预算 |
|-------|-----------|-----------|
| planner | P0, P1, P1b, P3 | 2000 |
| architect | P1, P1b, P2, P2a | 2000 |
| code-reviewer | P6 | 2000 |
| security-reviewer | P5, P6 | 2000 |
| build-error-resolver | P4 | 2000 |
| code-explorer | P0, P2 | 2000 |
| refactor-cleaner | P6 | 2000 |
| tdd-guide | P5 | 2000 |

### 扩展 Agent (21个, 按需加载)

基于技术栈检测结果（见 TECH-STACK-DETECT.md），仅加载匹配的扩展 Agent。

全流程 Token 增幅 ≤ 30%。

详见 [AGENT-PHASE-MAP.md](AGENT-PHASE-MAP.md)。

---

## 4. 双通道自进化

```
通道A: 流程沉淀 (LESSONS)
  Wave SUMMARY → Phase 8 归档 → LESSONS.md → Domain Skills 晋升(≥3频率)

通道B: 模式提取 (Agent-Eval)
  日常开发 → learn-eval 质量门 → Learned Skills → evolve 聚类晋升
```

融合节点：Phase 8 归档时两个通道的产物合并审查。

详见 [DUAL-EVOLUTION.md](DUAL-EVOLUTION.md)。

---

## 5. 渐进式运行时

| 运行时环境 | 能力 |
|-----------|------|
| 仅 Markdown | Gate 人工确认 + Hook 检查清单自查 + Agent 推荐判断 |
| + Node.js | Hook 脚本自动执行 + Gate 自动阻断 + 格式化/安全自动化 |
| + Python | security-scan 完整模式 (OWASP 扫描) |
| + 完整环境 | 所有 Hook + Agent + Skill 全功能 |

---

## 6. 数据流

```
用户请求 → SKILL.md → GO.md 路由
  → Phase 0 (技术栈检测 + 策略) → G0 Gate
  → Phase 1 (根因分析) → G1/G2 Gate
  → Phase 1b (讨论决策) → G2.5 Gate
  → Phase 2 (设计) → G3 Gate
  → Phase 2a (Shotgun变体) → G3.5 Gate
  → Phase 3 (任务拆分) → G4 Gate
  → Phase 4 (构建 + Hook) → G5 Gate
  → Phase 5 (测试 + Hook) → G6 Gate
  → Phase 6 (审查 + Hook) → G7 Gate
  → Phase 7 (Canary) → G7.5 Gate
  → Phase 8 (归档 + 双通道自进化) → G8 Gate
```
