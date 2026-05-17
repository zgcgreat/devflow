---
name: ultimate-workflow
version: 3.0-draft
description: |
  Ultimate AI programming workflow v3.0 — zero-config, zero-threshold, zero-dependency.
  Three-layer pyramid: SuperCorp (interaction) + SEP (engine) + Mega-Workflow (architecture).

  Use when: (1) Starting any dev task, (2) User says "use ultimate-workflow" or "v3",
  (3) Need structured workflow with auto-routing, learning evolution, and parallel execution.

  Core: Load this file once → read GO.md for routing → execute layered pipeline.
  GitNexus optional: detect → install prompt → grep fallback if missing.

Architecture: Skill in E:\LLM\skills\ultimate-workflow, projects only get .ultimate-workflow/ artifacts.
---

# Ultimate Workflow v3.0 — 终极融合工作流系统

> **零配置 · 零门槛 · 零依赖**  
> 三层架构：SuperCorp(交互层) → SEP(引擎层) → Mega-Workflow(架构层)  
> GitNexus 可选检测，不装不影响流程。

## 🚀 三步启动

```
1. AI加载本 SKILL.md          ← 一次读取
2. 用户说一句话需求             ← "帮我做个登录页"
3. AI自动 GO.md 路由并执行    ← Layer 1 → Layer 2 → Layer 3
```

---

## 🏗️ 三层架构总览

### Layer 1: 交互层 (SuperCorp) — 零门槛入口

Phase 0-8 全流程，Markdown Skill 驱动：

| Phase | 名称 | 核心能力 |
|-------|------|---------|
| 0 | YC六问战略评估 | 尖锐问题验证需求真伪 |
| 1 | 需求追问 (5 Whys) | 穷追模糊表述 |
| 2 | 方案设计 | DAG路由 + Provider选择 |
| 2a | **设计枪战** ⭐ | 4-6方案变体生成，用户选最优 |
| 3 | 任务拆分 | 拓扑排序 + 依赖图 |
| 4 | 实施 | Wave并行执行 |
| 5 | 测试 | 浏览器QA + 交叉波测试 |
| 6 | **三层对抗审查** ⭐ | Blind Hunter / Edge Case Hunter / Acceptance Auditor |
| 7 | **Canary灰度集成** ⭐ | 分批次上线 + 自动回滚 |
| 8 | 知识归档 | LESSONS nomination + Domain Skills Promotion |

### Layer 2: 引擎层 (SEP) — 持续进化核心

| 组件 | 能力 |
|------|------|
| **GSD六命令闭环** | wave并行 + 拓扑排序 + 原子提交 |
| **LearningWorkflow** ⭐ | 失败教训提取 → LESSONS沉淀 → 跨波经验注入 |
| **PartyMode共识** | 多Agent讨论，投票达成共识 |
| **Token压缩引擎** | 4级(lite/full/ultra/extreme)，最高~90%节省 |

### Layer 3: 架构层 (Mega-Workflow) — 企业级编排

| 组件 | 能力 |
|------|------|
| **DAG依赖路由** | Topological sort (Kahn算法)，依赖感知并行 |
| **Provider智能网关** ⭐ | 多模型按需路由：创意→高创造，编码→高代码，审查→高分析 |
| **Agent上下文隔离** ⭐ | Orchestrator(~50K) / Research(~200K) / Execution(~200K)，防context rot |
| **并行执行引擎** | ~4.4x-5x 加速比 |
| **MCP集成** | 编辑器直连 |

---

## ⭐ v3.0 五大独有能力

### 1. LearningWorkflow 自动进化 (来自 SEP)

系统越用越强。每次 Phase 执行后：
- 提取失败教训 → 写入 `memory/LESSONS.md`
- 沉淀领域技能 → `memory/domain-skills/`
- Wave N+1 启动时自动加载相关经验（跨波上下文读取协议）

### 2. Provider 智能路由 (来自 Mega-Workflow)

根据任务类型自动选择最佳模型：
- **创意类** (设计/文案) → 高创造力模型
- **编码类** (Phase 4) → 高代码能力模型
- **审查类** (Phase 6) → 高分析能力模型
- **搜索类** (Phase 1) → 高检索能力模型
- **简单任务** → lite 模型节省成本

### 3. 分层 Agent 上下文隔离 (来自 Mega-Workflow)

每层Agent有独立新鲜上下文窗口，避免 context rot：
- **Orchestrator**: ~50K tokens 全局上下文
- **Research Agent**: ~200K tokens Phase 1/2 纯新鲜上下文
- **Execution Agent**: ~200K tokens Phase 4 Wave级新鲜上下文

### 4. 设计枪战变体生成 (来自 SuperCorp)

Phase 2a 自动生成 4-6 个设计方案变体：
- 每个标注优缺点和风险评估
- AI 推荐最优选项并说明理由
- 用户选择或组合 → 最终方案
- 防决策疲劳

### 5. Canary 灰度发布 (来自 SuperCorp)

Phase 7 分批次上线：10% → 50% → 100%
- 每批间隔自动健康检查
- 异常自动回滚
- 零停机部署

---

## 🔄 v3.0 执行管线

```
用户输入（一句话需求）
        │
        ▼
┌──────────────────────┐     Layer 1: SuperCorp 交互层
│ Phase 0: YC六问      │ ← 战略评估，6个尖锐问题
│ Phase 1: 5 Whys追问  │ ← 消除模糊表述
└──────────┬───────────┘
           │ 通过 G1 (Plan Quality)
           ▼
┌──────────────────────┐     Layer 1 → Layer 2: 决策捕获 ⭐v3新增
│ Phase 1b: Discuss    │ ← 技术选型确认 + CONTEXT.md生成
└──────────┬───────────┘
           │ 通过 G2.5 (Decision Clarity)
           ▼
┌──────────────────────┐     Layer 3: Mega-Workflow 架构层
│ Phase 2: 方案设计    │ ← DAG路由 + Provider选择
│ Phase 2a: 设计枪战   │ ← 4-6变体生成，用户选最优 ⭐
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     Layer 3 → Layer 2
│ Phase 3: 任务拆分    │ ← DAG拓扑排序 + 依赖图
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     Layer 2: SEP 引擎层
│ Phase 4: 实施        │ ← Wave并行 + Learning自进化 ⭐
│                  ↑    │ ← PartyMode共识（复杂任务）
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     Layer 3: Mega-Workflow QA
│ Phase 5: 测试        │ ← 浏览器QA + 交叉波测试矩阵
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     Layer 1: SuperCorp 对抗审查 ⭐
│ Phase 6: 三层审查    │ ← Blind Hunter / Edge Case / Auditor
└──────────┬───────────┘
           │ 通过 G5 (Integration)
           ▼
┌──────────────────────┐     Layer 1: SuperCorp Canary ⭐
│ Phase 7: Canary发布  │ ← 10%→50%→100% + 自动回滚
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     Layer 2+3: 知识沉淀
│ Phase 8: 归档        │ ← LESSONS → Domain Skills
└──────────────────────┘
```

---

## 🔧 GitNexus 可选检测协议

**何时触发**: Stage 1 (分析) 和 Stage 6 (审查)

```
检测: gitnexus --version
  ├─ ✅ 成功 → 启用高级代码理解（调用链/依赖追踪）
  └─ ❌ 失败 → 弹出一次性提示：

  ┌─────────────────────────────────────┐
  │ ⚠️ GitNexus 未检测到                 │
  │                                     │
  │ GitNexus提供增强代码理解能力          │
  │                                     │
  │ [1] 现在安装（推荐）                 │
  │ [2] 跳过本次会话                    │
  │ [3] 永久使用 grep 降级              │
  └─────────────────────────────────────┘

降级能力:
  ✅ 文件搜索 (glob+grep)
  ⚠️ 调用链分析 (grep -rn)
  🟡 依赖影响追踪 (静态分析)
```

---

## 🎯 模式判定（三档）

| 模式 | 触发条件 | 流程 |
|------|---------|------|
| **Fast** | ≤3文件、<50行、低风险 | 直接开发 → 窄验证 |
| **Standard** | 常规功能开发 | Phase 0→1→2→4→5→6 (跳过2a) |
| **Strict** | 高风险/生产敏感/架构变更 | Phase 0→1→2→2a→3→4→5→6→7→8 |

---

## 🔍 入场检测协议（增强版 - 6种情况判定）

**执行时机**: Phase 0战略评估开始前强制执行

### 入场检测结果框

```markdown
## 入场检测结果框

**情况判定**: [A/B/C/D/E/F]
- A: greenfield新项目，无上下文
- B: greenfield有零星上下文
- C: brownfield有完整上下文
- D: brownfield待用户确认上下文
- E: brownfield上下文缺失
- F: 文档解析模式

**项目类型**: [greenfield/brownfield]
**入场扫描状态**: [已完成/待确认/已跳过]

**上下文文档路径**:
- PROJECT_CONTEXT.md: [存在/缺失]
- CURRENT_STATE.md: [存在/缺失]
- DECISIONS.md: [存在/缺失]

**门控判定**:
- A/B/C → ✅ 自动进入下一阶段
- D/E → ⏸️ 暂停，等待用户确认
- F → 📝 记录跳过原因，继续
```

### 6种情况定义

| 情况 | 项目类型 | 上下文状态 | 处理方式 |
|------|---------|-----------|----------|
| A | greenfield | 无上下文 | 自动进入，初始化记忆系统 |
| B | greenfield | 零星上下文 | 自动进入，补充缺失文档 |
| C | brownfield | 完整上下文 | 自动进入，加载现有状态 |
| D | brownfield | 待确认 | ⏸️ 暂停，展示上下文摘要等待确认 |
| E | brownfield | 上下文缺失 | ⏸️ 暂停，请求用户提供上下文 |
| F | 任意 | 文档解析模式 | 记录跳过原因，继续执行 |

### 强制执行规则

1. **未输出入场检测结果框** → 禁止进入后续阶段
2. **brownfield项目检测结果为D/E** → 必须等用户回复
3. **检测结果为F时** → 必须注明跳过原因

### 示例输出

```
## 入场检测结果框

**情况判定**: C
**项目类型**: brownfield
**入场扫描状态**: 已完成

**上下文文档路径**:
- PROJECT_CONTEXT.md: ✅ 存在
- CURRENT_STATE.md: ✅ 存在
- DECISIONS.md: ✅ 存在

**门控判定**: ✅ 自动进入下一阶段

检测到brownfield项目，已有完整上下文，直接进入Phase 0战略评估。
```

**默认推荐 Standard**。AI根据技术复杂度、业务影响、数据敏感性自动评分推荐。

---

## 💬 命令格式

### 自然语言交互（推荐）

**最简单的方式**，直接说人话：
```
帮我做一个每日简报应用，整合Google Calendar和Notion
```

AI会自动：
1. 检测项目类型（greenfield/brownfield）
2. 执行入场检测
3. 进入Phase 0战略评估
4. 按管线逐步执行

---

### 明确命令格式（高级用户）

适合熟悉工作流的高级用户，提供更精确的控制。

#### 项目初始化

```bash
/unified new "项目名称" --tech React,Node.js,PostgreSQL
/unified new "电商平台" --mode Strict --template ecommerce
```

**参数说明**:
- `--tech`: 指定技术栈（逗号分隔）
- `--mode`: 执行模式（Fast/Standard/Strict）
- `--template`: 使用预置模板

#### 阶段控制

```bash
/unified discuss 1        # Phase 1: 需求分析
/unified plan 1           # Phase 2: 方案设计
/unified execute 1        # Phase 4: 实施开发
/unified verify 1         # Phase 5: 测试验证
/unified ship 1           # Phase 7: 交付部署
```

**阶段编号**:
- 0: 战略评估
- 1: 需求分析
- 2: 方案设计
- 2a: 设计枪战
- 3: 任务拆分
- 4: 实施开发
- 5: 测试验证
- 6: 代码审查
- 7: 交付部署
- 8: 知识归档

#### 横向命令（任何阶段可用）

```bash
/status                   # 查看当前进度和状态
/lessons                  # 查看经验教训
/review                   # 即时代码审查
/grill                    # 需求追问（5 Whys）
/diagnose                 # 问题诊断
/graphify                 # 依赖图谱（需GitNexus）
/token status             # 查看Token使用率
```

---

### 命令示例

**示例1: 创建新项目**
```
/unified new "任务管理APP" --tech Next.js,TypeScript,TailwindCSS --mode Standard
```

**示例2: 查看进度**
```
/status
```

输出:
```
📊 项目状态

当前阶段: Phase 4 - 实施开发
进度: 60% (3/5 Waves完成)

已完成:
✅ Phase 0: 战略评估
✅ Phase 1: 需求分析
✅ Phase 2: 方案设计
✅ Phase 3: 任务拆分
🔄 Phase 4: 实施开发 (Wave 3/5)

待完成:
⬜ Phase 5: 测试验证
⬜ Phase 6: 代码审查
⬜ Phase 7: 交付部署
⬜ Phase 8: 知识归档
```

**示例3: 需求追问**
```
/grill
```

AI启动5 Whys追问流程，挖掘真实需求。

---

### 命令 vs 自然语言

| 特性 | 自然语言 | 明确命令 |
|------|---------|----------|
| 学习成本 | 低 | 中 |
| 灵活性 | 高 | 中 |
| 精确度 | 中 | 高 |
| 适用人群 | 所有人 | 高级用户 |
| 推荐场景 | 日常使用 | 批量操作、脚本调用 |

**建议**: 优先使用自然语言，熟悉后再使用明确命令。

---

## 📦 架构说明

### Skill 位置（`E:\LLM\skills\ultimate-workflow`）

```
SKILL.md          ← 本文件，v3零配置入口（你正在读的）
GO.md             ← v3路由器，包含完整路由决策树和12步流程
V3-ARCHITECTURE.md ← 架构设计文档（三层金字塔详解）
layers/           ← 三层架构核心模块
  L1-INTERACTION/ ← SuperCorp交互层封装 (Phase 0-8)
  L2-ENGINE/      ← SEP引擎层封装 (GSD/Learning/Wave/Token)
  L3-ARCHITECTURE/← Mega-Workflow架构层 (DAG/Provider/Agent)
optional/         ← 可选工具链 (GitNexus检测 + Grep降级)
skills/stage-skills/ ← v1.0向后兼容的Stage Skills
references/       ← 规则集(R1-R20)、模板、门控规则
memory/           ← 记忆系统 (PROJECT_CONTEXT/DECISIONS/LESSONS等)
docs/             ← 扩展功能文档 (SDD/Surface Budget/多项目/插件)
```

### 项目产物（`<project>/.ultimate-workflow/`）

```
STATE.md                  ← 跨会话状态追踪
memory/
  PROJECT_CONTEXT.md      ← 项目背景
  DECISIONS.md            ← 历史决策(ADR风格)
  KNOWN_FAILURES.md       ← 已知失败模式
  LESSONS.md              ← LearningWorkflow教训库 ⭐新增
  domain-skills/          ← 领域技能沉淀 ⭐新增
<req-id>/                 ← 需求产物 (00-requirements→07-integration)
```

> **关键原则**: AI从 `E:\LLM\skills\ultimate-workflow` 读取逻辑，在项目中只生成 `.ultimate-workflow/` 产物。

---

## 🔌 扩展功能

### 多项目管理

**支持同时管理多个项目，快速切换，状态同步，知识共享**

```bash
/unified projects list              # 列出所有项目
/unified projects new "名称"        # 创建新项目
/unified projects switch <id>       # 切换项目
/unified projects info <id>         # 查看项目详情
/unified workspace stats            # 工作区统计
```

详见: `docs/MULTI-PROJECT-MANAGEMENT.md`

### 插件系统

**可扩展Phase、Gate、Agent、Template、Command，沙箱隔离，签名验证**

```bash
/unified plugins install <plugin>   # 安装插件
/unified plugins enable <name>      # 启用插件
/unified plugins list --enabled     # 查看已启用插件
/unified plugins create <name>      # 创建新插件
```

**插件类型**:
- Phase扩展: 添加新Phase
- Gate增强: 增强质量门控
- Agent扩展: 添加新角色
- Template包: 添加新模板
- Command工具: 添加新命令

详见: `docs/PLUGIN-SYSTEM.md`

## 🎯 使用示例

### 场景1: 开发新功能
```
Use ultimate-workflow.
帮我做一个用户登录功能，支持邮箱密码和JWT认证
```

### 场景2: Fast模式修复
```
Use ultimate-workflow. Fast模式: 修复settings页面按钮文案typo
```

### 场景3: 架构重构（Strict模式）
```
Use ultimate-workflow. Strict模式。
把单体应用拆分成微服务，先做用户模块
```

### 场景4: 健康检查
```
Use ultimate-workflow. 健康检查
```

---

## 📖 文档导航

| 需要... | 读取... |
|---------|---------|
| v3架构设计 | `V3-ARCHITECTURE.md` |
| 统一路由入口 | `GO.md` (Step 1-12) |
| 规则集 R1-R20 | `references/RULES-v3.md` |
| 模式判定 | `references/mode-rules.md` |
| 入场检测 | `references/entry-check.md` |
| 门控验证 | `references/gate-rules.md` |
| Token压缩 | `references/caveman-rules.md` |
| 安全规范 | `references/SECURITY.md` |
| Stage Skills | `skills/stage-skills/` (向后兼容) |
| 快速上手 | `SKILL.md`「三步启动」 |

---

## ⚡ 渐进式披露规则

> ⚠️ **核心原则**: AI 不应一次性加载所有信息，应按需加载以节省 Token。

### 执行流程

1. **读取 state.md 确定当前 Phase**
2. **仅加载当前 Phase 相关的 Skill 和 Agent**
3. **Phase 切换时卸载旧 Skill，加载新 Skill**
4. **Token > 70% 时自动升级压缩级别**

### Phase → Skill 加载映射

| Phase | 必须加载 | 可选加载 | 必须卸载 |
|-------|---------|---------|---------|
| **Phase 0** | SKILL.md, GO.md | entry-check.md | - |
| **Phase 1** | + rules/RULES.md | 5-whys.md, personas/CEO.md | Phase 0 特定规则 |
| **Phase 2** | + rules/RULES.md | design/*.md, personas/Architect.md | Phase 1 追问规则 |
| **Phase 2a** | + rules/RULES.md | ui-*.md | Phase 2 设计规则 |
| **Phase 3** | + rules/RULES.md | task-template.md | Phase 2a UI规则 |
| **Phase 4** | + rules/RULES.md, dev-*.md | personas/Developer.md | Phase 3 拆分规则 |
| **Phase 5** | + rules/RULES.md, test-*.md | personas/QA.md | Phase 4 开发规则 |
| **Phase 6** | + rules/RULES.md, review-*.md | personas/Reviewer.md | Phase 5 测试规则 |
| **Phase 7** | + rules/RULES.md, deploy-*.md | personas/DevOps.md | Phase 6 审查规则 |
| **Phase 8** | + rules/RULES.md, archive-*.md | - | Phase 7 部署规则 |

### Token 监控触发条件

| Token 使用率 | 动作 |
|-------------|------|
| < 50% | 不压缩，正常加载 |
| 50-70% | 提示：建议使用 `lite` 压缩 |
| 70-85% | 强制：自动切换到 `full` 压缩 |
| 85-90% | 警告：切换到 `ultra` 压缩 |
| > 90% | 暂停：强制 `extreme` 压缩，等待人工确认 |

### 正确 vs 错误示例

#### ❌ 错误：一次性加载全部

```
加载：SKILL.md + GO.md + V3-ARCHITECTURE.md + RULES.md + ... (全部)
结果：Token 消耗 ~80%，剩余上下文不足
```

#### ✅ 正确：按 Phase 渐进加载

```
Phase 0: SKILL.md + GO.md + entry-check.md (约 ~15% Token)
Phase 1: + RULES.md + 5-whys.md (约 +20% Token)
Phase 4: + dev-*.md + Developer persona (按需加载)
```

---

## 🌟 v3.0 vs 对比

| 维度 | v1.0 | SEP | SuperCorp | Mega-Workflow | **v3.0** |
|------|------|-----|-----------|---------------|----------|
| 配置要求 | 低 | 中(npm) | 极低 | 高 | **零** |
| 门槛 | 低 | 高 | 极低 | 中 | **极低** |
| 功能覆盖 | ~60% | ~70% | ~60% | ~95% | **~98%** |
| 自学习进化 | ❌ | ✅ | ❌ | ❌ | **✅** |
| Agent隔离 | ❌ | ❌ | ❌ | ✅ | **✅** |
| Provider路由 | ❌ | ❌ | ❌ | ✅ | **✅** |
| Token压缩 | ~50% | ~75% | ~70% | ~80% | **~90%** |
| 设计变体 | ❌ | ❌ | ✅ | ❌ | **✅** |
| Canary发布 | ❌ | ❌ | ✅ | ❌ | **✅** |
| 对抗审查 | ❌ | ❌ | ✅ | ❌ | **✅** |
| 并行执行 | ❌ | ✅ | ❌ | ~4.4x | **~5x+** |
| GitNexus | 必选 | 可选 | ❌ | ❌ | **可选+降级** |

---

## 📋 v3.0 规则集摘要 (R1-R20)

| 编号 | 规则 | 说明 |
|------|------|------|
| R1 | PRD驱动 | 无PRD不开发 |
| R2 | 三档模式 | Fast/Standard/Strict自动判定 |
| R3 | 入场检测 | brownfield必跑，stop-on-D/E |
| R4 | Stage门禁 | 缺前置产物不允许进入 |
| R5 | 渐进式披露 | 只加载当前Stage Skill |
| R6 | Token压缩 | 默认full，可选ultra/extreme |
| R7 | Agent隔离 | Research/Execution各自~200K fresh |
| R8 | Wave并行 | DAG拓扑排序，依赖感知执行 |
| R9 | LearningWorkflow | Phase完成→LESSONS沉淀→跨波注入 |
| R10 | Provider路由 | 按任务类型选模型 |
| R11 | GitNexus可选 | detect→prompt→grep fallback |
| R12 | 三层对抗审查 | Blind/Edge/Auditor并行 |
| R13 | Canary发布 | 10%→50%→100%，异常回滚 |
| R14 | 设计枪战 | Phase 2a必跑(前端/UI) |
| R15 | 跨波上下文读取 | Wave N SUMMARY → N+1注入 |
| R16 | 原子提交 | 每Wave一个commit，可追溯 |
| R17 | Heartbeat检查点 | [checkpoint][wave:N][task:X] |
| R18 | Domain Skills Promotion | LESSONS→domain-skills/持久化 |
| R19 | 产物模板强制 | 所有输出严格按模板 |
| R20 | 向后兼容 | v1.0产物零改动迁移 |

---

## 版本历史

### v3.0-draft (2026-05-17)
- **三层金字塔架构**: SuperCorp(交互) + SEP(引擎) + Mega-Workflow(架构)
- **五大独有能力**: LearningWorkflow自进化 / Provider路由 / Agent隔离 / 设计枪战 / Canary发布
- **零配置入口**: 加载SKILL.md → 一句话需求 → 自动执行
- **GitNexus可选检测**: detect → prompt → grep fallback
- **20条规则集**: R1-R20，覆盖全流程
- **向后兼容**: v1.0产物零改动迁移

### v1.0 (previous)
- 整合 devflow-kit + superpowers + OpenSpec + GitNexus + caveman
- GO.md统一路由 + Stage Skills按需加载
- 跨会话记忆系统 + Token优化支持
