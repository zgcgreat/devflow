# 进阶主题 — DevFlow v3.2.3

本文档深入讲解 DevFlow 的核心高级特性。适合已掌握基本使用、希望优化工作流的高级用户和架构师。

> **v3.2.3 审计修复**: L2 Error Taxonomy + Boundary Conditions 覆盖率 100%，requires 0 断裂，健康度 88/100

## 📋 内容索引

| 主题 | 说明 |
|------|------|
| [LearningWorkflow自进化](#learningworkflow自进化) | LESSON沉淀 → Domain Skills → 跨波注入 |
| [DAG并行路由](#dag并行路由) | Kahn拓扑排序 + 4级并行度 |
| [Provider智能网关](#provider智能网关) | 6任务类型选择矩阵 + 指数退避降级链 |
| [Agent上下文隔离](#agent上下文隔离) | ~200K Token预算 + Wave边界轮转 |
| [Delta-Specs差量规范](#delta-specs差量规范) | Brownfield场景Token节约76-87% |
| [Hooks系统](#hooks系统) | 运行时钩子 + Chain-Trigger级联 |
| [Surface Switch运行时切换](#surface-switch运行时切换) | 5种技能簇平滑过渡 |
| [Caveman-Shrink压缩引擎](#caveman-shrink压缩引擎) | MCP工具组三级加载，70-76% context节省 |
| [CodeGraph-Bridge本地知识图谱](#codegraph-bridge本地知识图谱) | SQLite+FTS5+Auto-Sync |
| [Conductor-Revert回滚协议](#conductor-revert回滚协议) | Git-aware 四阶段精准回滚 |
| [Scale-Domain-Adaptive动态规划](#scale-domain-adaptive动态规划) | 项目规模→Phase深度的自动映射 |

---

## LearningWorkflow自进化

### 三阶段流程

```
LESSON沉淀（每Wave完成时） → Domain Skills生成（≥3频率触发） → 跨波注入（Wave N+1开始前）
```

### LESSON价值分级

| 标记 | 含义 | 处理优先级 |
|------|------|-----------|
| ⚡ **高价值** | 可复用到其他模块/项目的模式 | 优先合并为Domain Skill |
| 💡 **技术选型确认** | 用户选择的技术方案，后续项目可直接引用 | 归档到DECISIONS.md |
| ⚠️ **风险提醒** | 发现但未及时修复的问题 | 标注KNOWN_FAILURES |
| 📝 **常规记录** | 流程执行中的普通发现 | 30天后清理 |

### Domain Skills生成规则

触发条件：同一主题（关键词匹配或语义聚类）出现 ≥3 条不同 LESSON。

```
示例：
LESSON-1: "JWT刷新逻辑需要retry策略" [token-retry-pattern, ⚡]
LESSON-2: "API调用的超时重试应该用指数退避" [api-retry-pattern, ⚡]
LESSON-3: "文件上传大文件需要chunk重试" [upload-retry-pattern, ⚡]

→ 聚类分析：都涉及"retry策略"
→ 频率检测：3条 ⚡级别 → 触发Domain Skills生成
→ Domain Skill: "retry-strategy-pattern.md" — 综合最佳实践
```

### 跨波注入协议

Wave N+1 开始执行前，从 LESSONS/Domain Skills 中检索相关经验并注入到当前 Wave 的上下文：

```python
# 伪代码：检索逻辑
related_lessons = search_lessongs(
    keywords=get_wave_keywords(wave_n_plus_1),
    min_severity="medium",
    max_results=5
)
if related_lessons:
    inject_context(f"Relevant LESSONS: {'|'.join(related_lessons)}")
```

---

## DAG并行路由

### Kahn拓扑排序实现逻辑

```python
def kahn_topological_sort(tasks, dependencies):
    """
    tasks: 原子任务列表
    dependencies: {task_id: [dependent_task_ids]}
    
    返回: Wave分配结果 [{wave_num: N, tasks: [...]}]
    """
    in_degree = {t: len(deps) for t, deps in dependencies.items()}
    zero_in = [t for t, d in in_degree.items() if d == 0]
    
    waves = []
    wave_num = 1
    while zero_in:
        waves.append({
            "wave": wave_num,
            "tasks": zero_in[:],  # 同一Wave可并行执行
            "parallelism": len(zero_in)  # 记录并行度等级
        })
        
        next_zero = []
        for task in zero_in:
            # 移除已处理任务的依赖关系
            for other_task, deps in dependencies.items():
                if task in deps:
                    deps.remove(task)
                    if len(deps) == 0 and other_task not in next_zero:
                        next_zero.append(other_task)
        
        zero_in = next_zero
        wave_num += 1
    
    # 检测循环依赖
    if len(zero_in) < len(tasks):
        raise CycleError("DAG contains cycle")
    
    return waves
```

### 4级并行度

| 等级 | 定义 | 示例 |
|------|------|------|
| **L0: 无依赖** | Wave内所有任务可立即并行 | 初始化项目结构 + 配置路由同时启动 |
| **L1: 波内并行** | 同一Wave内的任务通过独立Agent并行 | T4和T5在同一Wave中并发执行 |
| **L2: 跨波有序** | Wave间按序执行，上下文传递 | Wave N完成 → Wave N+1开始 |
| **L3: 全量串行** | 所有任务依赖前一个（退化为单波） | 简单脚本修改 |

### 降级策略

DAG构建失败时（循环依赖检测），自动回退到线性序列：

```
原始DAG: T1→T2, T3→T4, T2→T4 (循环)
回退方案: [T1,T3] → [T2] → [T4]  (手动打破循环)
```

---

## Provider智能网关

### 6任务类型选择矩阵（完整版）

| Phase | 任务类型 | 推荐能力维度 | 具体模型特征 |
|-------|---------|-------------|-------------|
| 0-1 | 理解+分析 | 高检索 + 广域知识 | 训练数据覆盖广泛的文档/代码库 |
| 2-2a | 创意设计 | 高创造力 + 审美敏感度 | 擅长类比推理和跨域映射 |
| 3 | 逻辑编排 | 强推理 + 约束满足 | 优秀的条件判断和依赖推理 |
| 4 | 代码生成 | 高代码能力 + 语法精度 | 训练数据中高质量代码比例高 |
| 5 | 测试编写 | 细心严谨 + 边界感知 | 对corner case的识别能力强 |
| 6 | 对抗审查 | 高分析 + 批判型思维 | 擅长发现不一致和逻辑漏洞 |
| 7-8 | 集成归档 | 标准能力即可 | 常规文本处理，模型差异小 |

### 指数退避降级链

```python
# Provider不可用时的自动重试策略
def call_provider_with_fallback(provider, task, max_retries=3):
    delays = [5, 10, 20]  # seconds
    
    for attempt in range(max_retries):
        try:
            result = provider.call(task)
            return result
        except ProviderError as e:
            if attempt < max_retries - 1:
                delay = delays[attempt]
                log(f"Provider failed, retrying in {delay}s...")
                wait(delay)
            else:
                raise FallbackToDefaultProvider()
```

---

## Agent上下文隔离

### Token预算分配

| Agent角色 | 预算上限 | 内容 |
|-----------|---------|------|
| DAG-Router | ~20K | 依赖分析 + Wave计划 |
| Wave Executor | ~30K | Wave状态管理 + Heartbeat |
| Phase Skill (每个) | ~50K | 当前Phase的指令上下文 |
| PartyMode Agent (每个) | ~150K | 任务执行详情 |

### Wave边界轮转

```
Wave 1: Agent A完成 T1, T2 → 输出SUMMARY-1
         ↓
Wave 2: Agent A释放，Agent B启动读取SUMMARY-1 + LESSONS
         → 完成T3, T4 → 输出SUMMARY-2
```

**关键约束**: Agent不可跨Wave保留未序列化的中间状态（如内存中的变量）。所有跨波上下文必须通过文件（SUMMARY.md / LESSONS.md）传递。

---

## Delta-Specs差量规范

### Brownfield场景Token优化策略

| 策略 | Token节省 | 适用场景 |
|------|----------|---------|
| **全量重新生成** | baseline | 代码变更过大或整个模块重构 |
| **Delta-Specs** | 76-87% | 小改动、功能新增、Bug修复 |
| **引用已有spec** | ~95% | spec覆盖的未变文件（直接链接，不重新生成） |

### 执行流程

```
git diff → symbol影响分析 → 识别变更文件
    ↓
对每个变更文件:
  ├─ 有旧spec? → diff diff(old_spec, new_code) → 增量spec
  └─ 无旧spec? → 全量生成新spec
    ↓
所有未变文件 → 引用已有spec路径（不重新生成）
```

---

## Hooks系统

### 内置钩子详细规格

| 钩子 | 触发器 | 可配置的参数 | 默认行为 |
|------|--------|------------|---------|
| context-monitor | Token使用量超过阈值 | threshold(K), action(compress/notify) | ultra压缩 |
| prompt-guard | AI输出前 | mask_patterns, inject_detection | 脱敏+检测 |
| phase-transition | Phase切换前后 | checkpoint_file, save_context | 保存状态 |
| tool-execution | 工具调用完成 | log_level, retry_count | audit日志 |

### Chain-Trigger级联执行模式

| 模式 | 行为 | 适用场景 |
|------|------|---------|
| **parallel** | 所有回调同时触发 | 不依赖顺序的独立动作（如log+notify） |
| **serial** | 按定义顺序依次执行，前一个失败中断后续 | 有前置依赖的动作链（如save→compress→archive） |

### Chain-Trigger配置示例

```json
{
  "chain_triggers": [
    {
      "trigger": "context-monitor:threshold_reached",
      "then": [
        {"action": "caveman-shrink:compress_to", "params": ["ultra"]},
        {"action": "surface-switch:set_mode", "params": ["lite"]}
      ],
      "mode": "parallel",
      "description": "Token超限 → 自动压缩 + 降级模式"
    },
    {
      "trigger": "phase-transition:entering_phase_4",
      "then": [
        {"action": "hooks-system:checkpoint", "params": ["phase-3-summary"]},
        {"action": "learning-workflow:inject", "params": ["lessongs"]}
      ],
      "mode": "serial",
      "description": "进入实施阶段 → checkpoint + LESSON注入"
    }
  ]
}
```

---

## Surface Switch运行时切换

### 5种表面模式的完整规格

| 模式 | 工具集 | 压缩级别 | Token影响 | 适用场景 |
|------|--------|---------|----------|---------|
| **lite** | core tools only | lite | ~30%节省 | 简单任务、成本敏感 |
| **standard** | 完整工具集 | full | baseline | 默认模式、常规任务 |
| **strict** | + audit tools | ultra | ~75%节省 | 质量敏感、生产发布 |
| **audit** | + review agents | full | ~60%节省 | Phase 6对抗审查期间 |
| **extreme** | minimal set | extreme | ~90%节省 | Token极度紧张 |

### 平滑过渡协议

切换模式时：
1. 保存当前Phase的checkpoint
2. 保留已加载的工具状态（不清空上下文）
3. 按新模式的工具集增量加载/卸载
4. 输出 `[surface-switch] mode changed: X → Y` 确认

---

## Caveman-Shrink压缩引擎

### MCP工具组三级加载

| 级别 | 包含的MCP工具数 | Context节省 | 缺失的能力 |
|------|---------------|------------|-----------|
| **core** | ~5 | baseline | 无（基础能力） |
| **standard** | ~15 | ~70% | 高级分析工具 |
| **all** | ~30+ | ~76% | 无（全功能） |

### 压缩算法逻辑

```
原始上下文 = [指令 + Phase技能 + 工具列表 + 对话历史 + MCP描述]

压缩后 = [指令核心 + Phase关键步骤 + 已激活工具描述 + 最近5轮对话摘要]
         + [MCP工具: core/standard/all级别描述]
```

---

## CodeGraph-Bridge本地知识图谱

### SQLite+FTS5架构

```sql
-- 节点表（代码元素）
CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,        -- function, class, module, variable
    file_path TEXT NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    content TEXT,
    metadata JSONB
);

-- 边表（依赖关系）
CREATE TABLE edges (
    source_id TEXT REFERENCES nodes(id),
    target_id TEXT REFERENCES nodes(id),
    relation_type TEXT NOT NULL, -- calls, inherits, imports, depends_on
    weight REAL DEFAULT 1.0
);

-- FTS5全文索引
CREATE VIRTUAL INDEX nodes_fts ON nodes(content, metadata) USING fts5;

-- Auto-Sync: git diff后自动触发节点/边的增量更新
```

### 测试影响分析

```bash
# codegraph affected <file_or_symbol>
codegraph affected "src/auth/jwt.ts"
# 输出: 受影响的调用链和测试文件列表
# - src/auth/login.ts::login() calls jwt.verify()
# - src/auth/refresh.ts::refreshToken() depends on jwt.sign()
# - test files to run: tests/auth.spec.ts, tests/integration/jwt.test.ts
```

**效果**: 工具调用减少 **94%**（从每次调用MCP改为本地SQLite查询）

---

## Conductor-Revert回滚协议

### Git-aware 四阶段回滚

```
阶段1: 交互选择                    ← 用户选择回滚粒度
  ├─ Track级（整个req的所有变更）
  ├─ Phase级（特定Phase的产物+代码）
  └─ Task级（单个任务/文件的回滚）

阶段2: Git对账                     ← git diff / git log --oneline
  确认回滚范围的精确commit集合
  处理幽灵Commit（已合并但索引未更新）

阶段3: 计划确认                    ← plan.md状态同步
  输出回滚计划，等待用户确认

阶段4: 执行验证                    ← git revert + 重新测试
  执行回滚 → 验证Phase状态一致性
```

---

## Scale-Domain-Adaptive动态规划

### 项目规模→Phase深度的自动映射

| 模块数 | 领域信号 | Phase深度 | Token预算系数 |
|--------|---------|----------|-------------|
| <10 | 任意 | **Lite** | ×0.5 |
| 10-50 | saas / webapp | **Standard** | ×1.0（默认） |
| 50-200 | fintech / healthcare | **Enhanced** | ×1.5 |
| 200+ | iot / gamedev / embedded | **Advanced** | ×2.0 |

### 领域信号检测

```python
domain_signals = detect_domain_signals(
    file_extensions=scan_extensions(),      # .proto → iot, .uxf → design
    package_json_deps=analyze_deps(),       # @financial → fintech
    db_schema=check_schema(),               # insurance_policies → healthcare
    config_files=read_config()              # game_engine=unity → gamedev
)

phase_depth = map_scale_and_domain(len(modules), domain_signals)
```

---

## 附录：L2模块文件树（v3.2.2完整版）

```
layers/L2-ENGINE/
├── README.md                         # L2模块总览 + 协作协议
├── learning-workflow/                # LearningWorkflow自进化
│   └── _SKILL.md
├── wave-executor/                    # Wave并行执行器
│   └── _SKILL.md
├── party-mode/                       # 多Agent协同
│   └── _SKILL.md
├── caveman-shrink/                   # 通信压缩引擎
│   └── _SKILL.md
├── codegraph-bridge/                 # CodeGraph知识图谱桥接
│   └── _SKILL.md
├── hooks-system/                     # 运行时钩子系统
│   └── _SKILL.md
├── surface-switch/                   # 运行时技能簇切换
│   └── _SKILL.md
└── conductor-revert/                 # Conductor回滚协议（v3.2.2新增）
    └── _SKILL.md
```
