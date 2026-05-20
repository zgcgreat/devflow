# GO — Devflow v3 统一路由器

> **AI指令**：
> 1. 本文件是 v3 路由入口，读完后按第四步路由表匹配用户意图
> 2. **第一条回复必须输出路由声明**（含选定的模式 Fast/Standard/Strict + 理由）
> 3. **所有产物必须保存到 `.devflow/<req-id>/` 下**
> 4. **⚠️ 所有产物必须严格按模板输出**（见 references/RULES-v3.md R19）
>
> 用户使用方式：`Use devflow` 或 `@devflow/SKILL.md` + 一句话需求

---

## ⚡ v3 执行流程（12步）

```
Layer 1: 交互层 ()
Step 1 · 读取项目状态 (.devflow/STATE.md)
Step 2 · 入场检测 (entry-check.md, brownfield/greenfield)
Step 3 · GitNexus可选检测 (detect → prompt → grep fallback)

Layer 1 → Layer 3: 战略评估 + 需求澄清
Step 4 · Phase 0: YC六问战略评估 (stop-on-G1)
Step 5 · Phase 1: 5 Whys需求追问

Layer 3: 架构层 ()
Step 6 · Phase 2: 方案设计 (DAG路由 + Provider选择)
Step 7 · Phase 2a: 设计枪战 (前端/UI项目必跑, 4-6变体)

Layer 3 → Layer 2: 任务拆分 + Wave执行
Step 8 · Phase 3: 任务拆分 (拓扑排序 + 依赖图)
Step 9 · Phase 4: 实施 (Wave并行 + LearningWorkflow自进化)

Layer 3: 质量保障
Step 10 · Phase 5: 测试 (浏览器QA + 交叉波测试矩阵)
Step 11 · Phase 6: 三层对抗审查 (Blind/Edge/Auditor)

Layer 1: 集成归档
Step 12 · Phase 7-8: Canary发布 + 知识归档
```

---

## 🔍 快速索引

| 需要... | 读取... |
|---------|---------|
| v3架构设计 | `V3-ARCHITECTURE.md` |
| 模式判定规则 | `references/mode-rules.md` |
| 入场检测流程 | `references/entry-check.md` |
| 阶段门验证 | `references/gate-rules.md` |
| Token预算 | `references/token-budget.md` |
| v3规则集 R1-R20 | `references/RULES-v3.md` |
| Delta Specs 差量规范 | `references/delta-specs.md` |
| Stage Skills | `skills/stage-skills/` |
| **L1 Phase 0-8 Skills** | `layers/L1-INTERACTION/README.md` + `layers/L1-INTERACTION/phase-*/*_SKILL.md` |
| **L2 LearningWorkflow** | `layers/L2-ENGINE/learning-workflow/_SKILL.md` |
| **L2 Wave Executor** | `layers/L2-ENGINE/wave-executor/_SKILL.md` |
| **L2 PartyMode** | `layers/L2-ENGINE/party-mode/_SKILL.md` |
| **L3 DAG Router** | `layers/L3-ARCHITECTURE/dag-router/_SKILL.md` |
| **L3 Provider Gateway** | `layers/L3-ARCHITECTURE/provider-gateway/_SKILL.md` |
| **L3 Agent Isolation** | `layers/L3-ARCHITECTURE/agent-isolation/_SKILL.md` |
| **L3 Parallel Engine** | `layers/L3-ARCHITECTURE/parallel-engine/_SKILL.md` |

---

## Step 1 · 读取项目状态

1. 尝试读 `.devflow/STATE.md`。不存在 → 用模板创建
2. 关注字段：`活跃req` / `当前阶段` / `中断任务`
3. 如存在 `中断任务` 非空 → **优先级最高**，直接走恢复分支
4. **初始化记忆系统**（首次使用必跑）:
   - 检查 `.devflow/memory/` 是否存在
   - **如不存在** → 创建目录并初始化基础文件：
     ```
     .devflow/memory/
     ├── PROJECT_CONTEXT.md    # 项目背景（待填充）
     ├── DECISIONS.md          # 历史决策（空）
     ├── KNOWN_FAILURES.md     # 已知失败（空）
     ├── LESSONS.md            # LearningWorkflow教训库 ⭐v3新增
     └── domain-skills/        # 领域技能沉淀 ⭐v3新增
         ```
   - **如存在** → 加载 PROJECT_CONTEXT.md、DECISIONS.md、KNOWN_FAILURES.md、LESSONS.md
5. **多项目支持**: 每个项目独立 `.devflow/` 目录，记忆系统按项目隔离

---

## Step 2 · 入场检测

**⚠️ 强制规则**：必须使用 `read_file` 工具读取 `entry-check.md` 并按其决策树执行。

**检测步骤**（按顺序执行，命中即停止）：
1. 检查是否有 ai_context_doc 字段 → 情况A
2. 检查 CONTEXT.md 是否存在 + 扫描时间 → 情况B/C
3. 检查其他AI上下文文档 → 情况D → **⚠️ 停等用户确认**
4. 检查是否 greenfield → 情况F（跳过）或E → **⚠️ 停等用户确认**

**必须输出检测结果框**：
```
┌─────────────────────────────────────────────┐
│  🔍 入场检测                                 │
├─────────────────────────────────────────────┤
│  检测结果：<情况 A/B/C/D/E/F>                 │
│  项目类型：<brownfield / greenfield>         │
│  上下文文档：<路径 或 "无">                   │
└─────────────────────────────────────────────┘
```

**⚠️ 关键约束**：情况 B/C/D/E **必须等待用户回复**，不得自动继续。

---

## Step 3 · GitNexus可选检测 (v3新增)

**触发条件**: Fast/Standard/Strict模式确认后执行（仅一次）

### 检测协议

```
Step 3.1: gitnexus --version
  ├─ ✅ 成功 → "GitNexus已就绪，启用高级代码理解"
  └─ ❌ 失败 → Step 3.2

Step 3.2: 一次性提示用户
┌─────────────────────────────────────┐
│ ⚠️ GitNexus 未检测到                 │
│                                     │
│ GitNexus提供增强代码理解能力          │
│ (调用链分析、依赖影响追踪)            │
│                                     │
│ [1] 现在安装（推荐）                  │
│ [2] 跳过本次会话                     │
│ [3] 永久跳过，使用grep降级            │
└─────────────────────────────────────┘

Step 3.3: 用户选择
  ├─ [1] 执行安装引导 → gitnexus --version → 回到 Step 3
  ├─ [2] 本次会话用 grep fallback
  └─ [3] 永久写入 STATE.md: gitnexus=persistent-off, 使用grep fallback

Step 3.4: Grep降级能力声明
  ┌─────────────────────────────────────┐
  │ 🔧 使用 Grep Fallback               │
  │ 文件搜索: ✅ glob+grep              │
  │ 调用链分析: ⚠️ grep -rn (可能不全)   │
  │ 依赖影响追踪: 🟡 静态分析(精度有限)    │
└─────────────────────────────────────┘
```

---

## Step 4 · Phase 0: YC六问战略评估

**Layer 1 → Layer 3**: 从交互层进入架构层

**强制规则**：必须输出6个尖锐问题，等用户全部回答后才通过 G1 (Plan Quality Gate)。

**YC六问清单**：
1. **痛点有多痛？** 用户在解决什么问题？不解决的代价是什么？
2. **现有方案有哪些？** 为什么它们不够好？
3. **你的独特优势是什么？** 为什么是你能做、别人做不了？
4. **怎么获客？** 用户从哪里来？获客成本多少？
5. **怎么赚钱？** 商业模式是什么？LTV/CAC比多少？
6. **2倍速验证** 如果明天资源翻倍，做什么能最快拿到结果？

**⚠️ stop-on-G1**: G1未通过（问题<4个有满意回答）→ 退回需求澄清，不进入 Phase 2。

**💰 Surface Budget设置（可选）**

Phase 0结束后，可设定Token预算上限：

```bash
/devflow budget set 300K              # 设定300K预算
/devflow budget preset medium         # 使用预设（small/medium/large/enterprise）
```

详见: `docs/SURFACE-BUDGET.md`

---

## Step 5 · Phase 1: 5 Whys需求追问

**Layer 1**: 交互层

使用 grill skill 或 5 Whys 方法穷追模糊表述：
- "用户说'要快'——多快？具体指标是什么？"
- "支持'多种支付方式'——列出来，每种的技术复杂度？"
- **目标**：需求精确到可执行程度，每个需求项有明确验收标准

---

## Step 5.5 · Phase 1b: 决策捕获（Discuss）⭐v3新增

**Layer 1 → Layer 2**: 从需求分析进入实现决策

**触发条件**（满足任一）:
- Phase 1输出的AC包含≥3个技术选型歧义
- 检测到未明确的实现细节（API设计/数据存储/错误处理/UI布局）
- 用户明确要求"/discuss"模式

**执行流程**:
1. **识别灰色地带**: 扫描`01-analysis.md`，标记未明确的技术决策点
2. **交互式问答**: 对每个歧义点向用户提问（提供选项+优缺点）
3. **生成CONTEXT.md**: 将用户决策写入 `.devflow/<req-id>/CONTEXT.md`
4. **输出决策报告**: 显示已确认决策数、未决项、下一步建议

**常见歧义领域**:
- API设计: REST vs GraphQL vs gRPC
- 数据存储: localStorage vs IndexedDB vs SessionStorage
- 状态管理: Redux vs Context API vs Zustand
- 错误处理: 立即提示 vs 静默重试 vs 降级方案
- UI布局: 单列 vs 双列 vs 响应式
- 认证方式: JWT vs Session vs OAuth

**输出示例**:
```markdown
## 决策捕获结果

**耗时**: 5分钟  
**决策数**: 8项  
**未决项**: 3项（标记为[NEEDS CLARIFICATION]）

### 已确认决策
| # | 领域 | 决策 | 状态 |
|---|------|------|------|
| 1 | API设计 | RESTful API | ✅ |
| 2 | 数据存储 | localStorage + IndexedDB混合 | ✅ |
| 3 | 错误处理 | 立即提示 + 静默重试混合 | ✅ |

### 未决项
| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 1 | CDN选择 | 静态资源分发 | 根据用户地域决定 |

### 输出文件
- ✅ `.devflow/<req-id>/CONTEXT.md` ← 已生成
```

**门控G2.5**: Decision Clarity Gate
- 决策覆盖率 ≥70% → 通过
- 所有未决项标注[NEEDS CLARIFICATION] → 通过
- CONTEXT.md格式正确 → 通过

**⚠️ 关键约束**: CONTEXT.md将作为Phase 2方案设计的约束条件，确保设计方案符合用户偏好。

**可选增强: Spec-Driven Development (SDD)**

如果用户需求复杂或涉及架构变更，可启用SDD模式：

```bash
/devflow spec define "需求描述"    # 生成 specs/XXX/spec.md
/devflow spec plan "技术描述"      # 生成 specs/XXX/plan.md
/devflow spec tasks                # 生成 specs/XXX/tasks.md
```

SDD完成后自动生成CONTEXT.md，然后进入Phase 2。
详见: `docs/SDD-INTEGRATION.md`

---

## Step 6 · Phase 2: 方案设计 (Layer 3)

**架构层**: DAG路由 + Provider智能选择

### DAG路由决策

根据需求复杂度自动判定：

| 复杂度 | Wave数量 | 并行度 | 示例 |
|--------|---------|--------|------|
| 简单 | 1 Wave | 无依赖串行 | Bug修复、文案调整 |
| 中等 | 2-3 Waves | 波内并行 | CRUD功能、页面开发 |
| 复杂 | 4+ Waves | 波间依赖 + 波内并行 | 微服务拆分、架构重构 |

### Provider智能路由 (v3新增)

根据任务类型选择模型：

| Phase | 任务类型 | 推荐Provider/Model特性 |
|-------|---------|----------------------|
| Phase 0-1 | 理解+分析 | 高检索能力模型 |
| Phase 2-2a | 创意设计 | 高创造力模型 |
| Phase 3 | 逻辑编排 | 强推理模型 |
| Phase 4 | 代码生成 | 高代码能力模型 |
| Phase 5 | 测试编写 | 细心严谨型模型 |
| Phase 6 | 对抗审查 | 高分析+批判型模型 |
| Phase 7-8 | 集成归档 | 标准模型即可 |

---

## Step 7 · Phase 2a: 设计枪战 (v3新增)

**触发条件**: 前端/UI项目、task涉及UI文件时必跑；其他项目AI推荐。

### 执行流程

1. 基于Phase 2方案，生成 **4-6个设计变体**
2. 每个变体标注：
   - 核心设计理念 (1句)
   - 优点列表
   - 风险/成本评估
   - 适用场景
3. AI **推荐最优选项**并说明理由
4. 用户选择或组合 → 形成最终设计方案

**防决策疲劳**: AI推荐必须有明确依据，不列一堆让用户自己猜。

---

## Step 8 · Phase 3: 任务拆分 (Layer 3 → Layer 2)

**架构层 DAG + 引擎层 Wave Engine**: Kahn算法拓扑排序

### 执行流程

1. **DAG构建**: 基于设计文档，拆分成原子任务，建立依赖关系
2. **Kahn拓扑排序**: 输出无环执行序列
3. **Wave分配**: 依赖组 → 同一Wave；独立任务 → 不同Wave可并行
4. **输出Wave计划**: 每个Wave包含任务列表、依赖说明、负责人

### Wave计划模板

```
Wave N: <wave-name>
├─ [P0] task-A (无依赖，立即执行)
├─ [P1] task-B (无依赖，可并行)
└─ [P2] task-C (依赖task-A完成后开始)

预期耗时: ~X分钟 | 风险等级: 高/中/低 | 检查点: [checkpoint][wave:N]
```

---

## Step 9 · Phase 4: 实施 (Layer 2)

**引擎层 Engine Layer**: Wave并行执行 + LearningWorkflow自进化

### Wave执行流程

1. **加载Wave上下文**: Execution Agent获取~200K fresh context
2. **按依赖顺序执行**: 先无依赖任务(可并行)，再依赖任务
3. **每完成一个task**: TDD红绿重构 → 窄验证修复 → atom commit
4. **Wave完成**: heartbeat checkpoint → Wave SUMMARY生成 → LESSONS提名
5. **LearningWorkflow自进化** ⭐v3核心:
   - 提取失败教训 → `memory/LESSONS.md`
   - 沉淀领域技能 → `memory/domain-skills/`
   - 标记可用于后续Wave的经验

### Heartbeat检查点协议

格式: `[checkpoint][wave:N][task:X]`

每Wave完成后输出：
```
[checkpoint][wave:3][task:all-done]
✓ Wave 3完成: 3个任务全部通过验证
⚡ LearningFlow提名: auth-module-pattern → LESSONS.md
   (JWT刷新逻辑的retry策略可复用到其他API调用)
```

---

## Step 10 · Phase 5: 测试 (Layer 3)

**架构层 QA + Cross-Wave Strategy Matrix**

### 交叉波测试矩阵

| Wave | 测试类型 | 自动化 | 手动验证 |
|------|---------|--------|---------|
| Wave 1 (基础) | 单元测试 | ✅ | ⚠️ |
| Wave 2 (业务) | 集成测试 | ✅ | ⚠️ |
| Wave 3 (UI) | 浏览器QA + 截图对比 | ✅ | ✅ |
| Cross-Wave | E2E流程测试 | ✅ | ⚠️ |

### 质量门 G2 (Code Quality)

- 所有单元测试通过 ✅
- 集成测试通过率 ≥ 90% ✅
- 代码风格检查通过 ✅
- **不通过** → 退回Wave修复，重新进入测试循环

---

## Step 11 · Phase 6: 三层对抗审查 (Layer 1)

**三层对抗**: Blind Hunter / Edge Case Hunter / Acceptance Auditor 并行独立审查

### 三个审查员分工

| 审查员 | 关注点 | 典型问题 |
|--------|--------|---------|
| **Blind Hunter** | 盲点发现 | "什么场景下这个功能会静默失败？" |
| **Edge Case Hunter** | 边界条件 | "空数组/超长输入/并发冲突/时区差异？" |
| **Acceptance Auditor** | 需求对齐 | "是否覆盖了PRD的所有验收标准？" |

### 审查输出

```
┌─────────────────────────────────────────────┐
│ 🔍 Phase 6: 三层对抗审查结果                │
├─────────────────────────────────────────────┤
│ ✅ Blind Hunter:   发现2个中等风险          │
│    - R1: auth token过期未处理 (medium)      │
│    - R2: 文件上传大小限制缺失 (medium)       │
│ ✅ Edge Case:      发现3个低等风险          │
│    - L1: 空状态UI显示不一致 (low)           │
│    - L2: ...                                │
│ ✅ Acceptance:     全部通过 (12/12标准覆盖)  │
├─────────────────────────────────────────────┤
│ 结论: 修复R1/R2后可进入 Phase 7             │
└─────────────────────────────────────────────┘
```

---

## Step 12 · Phase 7-8: Canary发布 + 归档 (Layer 1)

### Phase 7: Canary灰度发布 (v3新增)

**分批次上线协议**:

| 批次 | 比例 | 健康检查间隔 | 异常回滚条件 |
|------|------|-------------|------------|
| Canary-1 | 10% | 5分钟 | error_rate > 1% |
| Canary-2 | 50% | 10分钟 | error_rate > 0.5% |
| Production | 100% | 持续监控 | error_rate > 0.1% |

### Phase 8: 知识归档 (Layer 2+3)

**LESSONS nomination → Domain Skills Promotion**:

```
Phase 8流程:
1. 遍历所有Wave SUMMARY，提名LESSONS
2. LESSONS去重 + cross-wave合并
3. 领域技能沉淀到 memory/domain-skills/
4. 更新 STATE.md (per-wave status tracking)
5. [commit-hash] → SUMMARY归档
```

---

## 🧭 路由表

### A. 用户意图路由

| 用户说 | 需求状态 | Phase/Stage | 依赖 |
|--------|---------|-------------|------|
| 有新想法想做件事 | 无活跃req | Phase 0 (YC六问) | brainstorming, writing-plans |
| 恢复中断任务 | 有中断任务 | 按R1.5重启 | - |
| 不要进入workflow | - | 直接做，跳过 | - |
| 健康检查 | - | `stage-m-health` | code-quality |
| evolve/architect | - | `stage-a-evolve`/`architect` | design-and-architecture |
| 纯技术问题 | - | 直接回答 | - |
| 上传文档/PRD | - | 文档解析 → Phase 2 | writing-plans |
| 修复Bug | - | Fast模式 → Phase 4 | systematic-debugging |

### B. 可选命令

| 用户说 | Phase | 说明 |
|--------|-------|------|
| "换个方案" | Phase 2a | 触发新设计变体 |
| "architect" | `stage-a-architect` | 架构梳理 |
| "扫描代码" | `stage-i-intel-scan` | 入场扫描 |
| "我的需求变了" | Phase 0+1 | 归档旧Req，重新确认 |
| "继续" | 下一阶段Phase | 按顺序执行 |
| "caveman extreme" | - | 通信压缩到最简 |

### C. 阶段门验证

**核心规则** (R4): 缺前置产物 → 不允许直接进入，必须先补跑缺失阶段。

**阶段依赖**: `0→1→2→[2a]→3→4→5→6→7→8`

**可选阶段**:
- **[2a] 设计枪战**: 仅前端/UI项目需要（task涉及UI文件时触发）
- **[3] 任务拆分**: 复杂项目建议使用（多任务并行、需详细时间规划）

---

## 📋 模式确认

**⚠️ 强制规则**：必须使用 `read_file` 工具读取 `mode-rules.md`。

**输出模板**：
```
🎯 建议模式：<Standard / Strict>
   理由：<简要说明为什么是这个模式>

   📋 <模式> 完整流程：
   <流程步骤简述>

   产物：<关键产物列表>

   其他可选模式：
   - Fast — ≤3 文件、<50 行、低风险
   - Strict — 高风险/生产敏感/架构或数据影响

   请确认或选择其他模式：
   1. ✅ <建议模式>（推荐）
   2. Fast
   3. Strict
```

**⚠️ 强制停等**：输出后**必须等待用户确认**才能继续。

---

## 🎯 路由声明模板

完成所有前置步骤后，输出：

```markdown
🎯 v3 路由声明

架构层: Layer 1(交互) → Layer 3(架构) → Layer 2(引擎)
阶段: Phase <N>
Mode: <Fast/Standard/Strict>
入口门禁: GitNexus=<检测状态> | 入场=<检测结果> | G1(Phase0)=<通过/未通过>
自检清单: 待执行
```

---

## 🔄 v1.0 向后兼容

| v1.0 特性 | v3.0 处理 |
|-----------|----------|
| Stage Skills (`skills/stage-skills/`) | 保留，内部重新路由到三层架构 |
| 记忆系统 (`memory/`) | 保留并扩展 LESSONS + domain-skills |
| Token压缩 (/caveman) | 保留，统一4级支持(lite/full/ultra/extreme) |
| spec-kit集成 (Phase 2输入) | 保留，PRD桥接 |
| OpenSpec集成 (Phase 8归档) | 保留，proposal/design/tasks接口 |
| `references/gate-rules.md` | 保留 + R4升级 |
| `references/mode-rules.md` | 保留 |
| `references/entry-check.md` | 保留 |
| `.devflow/` 产物 | **零改动**，v3直接读取 |

---

## 版本

### v3.0-draft (2026-05-17)
- **三层架构路由**: Layer 1 → Layer 3 → Layer 2 决策树
- **12步执行流程**: Step 1(状态) → Step 2(入场) → Step 3(GitNexus) → Phase 0-8
- **GitNexus可选检测协议**: detect → prompt → grep fallback (Step 3)
- **Phase 2a设计枪战路由**: 前端/UI必跑，其他推荐 (Step 7)
- **Provider智能路由**: 按任务类型选模型 (Step 6)
- **LearningWorkflow自进化触发点**: Phase 4每个Wave完成时自动运行
- **跨波上下文读取协议**: Wave N SUMMARY → predicates → LESSONS → 注入 N+1
- **20条规则集集成**: R1-R20全量生效

### v1.0 (previous)
- 整合 devflow-kit + superpowers + OpenSpec + GitNexus + caveman
- GO.md统一路由 + Stage Skills按需加载
- 跨会话记忆系统 + Token优化支持
