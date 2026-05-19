# Layer 2: 引擎层 (引擎层) — Learning-Enabled Execution Core

## GSD六命令闭环 + LearningWorkflow自进化 + Wave并行执行

此目录封装 引擎层 的核心引擎能力，为 Phase 4-8 提供运行时执行力和自动进化。

### 文件结构

```
L2-ENGINE/
├── README.md              ← 本文件
├── learning-workflow/     # ⭐LearningWorkflow自进化核心
│   ├── _SKILL.md
│   └── graduation/        # Graduation跨Phase聚类提升 (v3.1新增)
│       └── SKILL.md
├── debugging-workflow/    # Systematic Debugging方法论 (v3.1新增)
│   ├── SKILL.md
│   ├── root-cause-tracing.md
│   ├── defense-in-depth.md
│   └── condition-based-waiting.md
├── party-mode/            # PartyMode多Agent共识机制
│   └── SKILL.md
├── wave-executor/         # Wave并行执行器 + Kahn拓扑排序
│   └── _SKILL.md
├── GSDFlow                # (stub — 通过 Phase 3-4 prompts 间接实现)
├── Token Compressor       # (stub — R6 规则定义, 通过 token-manager.js 运行时调用)
└── Wave Summary           # 见 `layers/L1-INTERACTION/phase-4-build/_SKILL.md` Step 3
```

### ⭐ LearningWorkflow 自进化核心 (v3独有)

#### 触发时机

每个Wave完成后，Phase 4执行完毕时自动触发。

#### 执行流程

```
Wave完成 → LearningWorkflow.run()
  │
  ├─ Step 1: 扫描本Wave所有task的执行日志
  │   ├─ 成功的task → 提取模式/技巧 → Best Practices
  │   └─ 失败的task → 提取根因 → LESSONS.md条目
  │
  ├─ Step 2: LESSONS提名
  │   ├─ [NEW] 全新发现的教训
  │   ├─ [UPDATE] 已有条目，补充新证据
  │   └─ [DEPRECATE] 已过时的教训 (标记reason)
  │
  ├─ Step 3: Domain Skills Promotion
  │   ├─ 高频复用的Best Practices → domain-skills/{domain}.md
  │   ├─ 每个skill包含: 触发条件 + 执行步骤 + 注意事项
  │   └─ 去重: 同类skill合并，保留最优版本
  │
  └─ Step 4: 跨波经验注入 (仅对后续Wave)
      ├─ Wave N+1启动时 → 读取domain-skills/
      ├─ 匹配当前task上下文 → 注入相关领域经验
      └─ 输出: "LearningFlow注入: {skill-name} → {reason}"
```

#### LESSONS.md 模板

```markdown
# Lessons Learned

## [NEW] token-refresh-retry-pattern (2026-05-17)
**Wave**: 3 | **Task**: auth-module
**场景**: JWT token过期后自动刷新
**失败根因**: 并发刷新导致token竞争
**解决方案**: 使用single-flight模式，确保同时只有一个刷新请求
**复用性**: ⭐⭐⭐⭐ 可复用到所有API调用场景

## [UPDATE] file-upload-size-limit (2026-05-17)
**Wave**: 2 → **Updated in Wave**: 3
**变更**: 从"手动验证"升级为"前端+后端双重校验"
```

#### Domain Skills Promotion 协议

```
domain-skills/
├── auth.md           # 认证相关最佳实践
│   ├── trigger: "auth-*", "login", "token"
│   ├── skill: JWT single-flight pattern
│   └── note: token刷新时加锁防并发竞争
├── file-upload.md    # 文件上传最佳实践
├── api-design.md     # API设计最佳实践
└── database.md       # 数据库操作最佳实践
```

### Wave执行器 + Kahn拓扑排序

#### Wave分配算法

基于DAG依赖图的Kahn算法：

```python
def kahn_topological_sort(tasks):
    """
    tasks: List of Task{ id, deps[] }
    returns: List of Waves, each wave = list of parallel tasks
    """
    in_degree = {t.id: len(t.deps) for t in tasks}
    waves = []
    remaining = set(tasks)

    while remaining:
        # 找出所有入度为0的节点（可立即执行）
        ready = [t for t in remaining if in_degree[t.id] == 0]
        if not ready:
            raise CycleError("DAG contains cycle")

        waves.append(ready)
        remaining -= set(ready)

        # 更新入度
        for t in remaining:
            if any(r.id in t.deps for r in ready):
                in_degree[t.id] -= 1

    return waves
```

#### Wave并行执行协议

```
[checkpoint][wave:N][task:X]
✓ task-A completed (parallel, no deps)
⏳ task-B waiting for task-A dependency
→ task-C started (parallel with A, no shared deps)
```

### Layer 2 ↔ Layer 3 协作协议

| L2组件 | L3支持 | 协作点 |
|--------|--------|--------|
| Wave Executor | DAG Router | DAG输出 → Wave分配输入 |
| LearningWorkflow | Agent Isolation | Learning提取在Execution Agent ~200K context中运行 |
| Token Compressor | Provider Gateway | 压缩级别影响Provider成本计算 |
| Party Mode | Specialist Pool | 共识任务 → 分派给对应专家角色 |

### Layer 2 ↔ Layer 1 协作协议

| L2组件 | L1对应Phase | 协作方式 |
|--------|------------|---------|
| Wave Executor | Phase 4 | Wave执行结果 → Phase完成通知 |
| LearningWorkflow | Phase 8 | LESSONS提名 → Phase 8归档 |
| Token Compressor | 所有Phase | 全生命周期Token优化 |
| GSDFlow | Phase 1-6 | GSD闭环覆盖需求→集成全流程 |
