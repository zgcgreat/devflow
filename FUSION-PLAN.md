# ForgeOS × ForgeOS 融合方案

> **定位**: 这不是"二选一",而是让两个项目各自发挥最长板:
> - **ForgeOS = 行为契约层** — AI 的"宪法"(运行时检测、强制约束、Phase清单、门控自检)
> - **ForgeOS = 执行内核层** — JS 引擎(PhaseEngine、CLI、测试套件、集成编排)

---

## 🏗️ 融合架构:三层模型

```
┌─────────────────────────────────────────────┐
│  L3: CLI / 分发层 (ForgeOS)                  │
│  forge-os init/status/party/mem              │
│  package.json + npm install -g               │
│  13项完整性测试                               │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  L2: JS 内核层 (ForgeOS)                     │
│  lib/phase-engine.js — PhaseEngine          │
│  lib/party-arbiter.js — PartyArbiter        │
│  lib/task-planner.js — TaskPlanner          │
│  lib/memory.js — Memory 4层持久化           │
│  domains/hooks/gate-check.js               │
│  harnesses/install.js — 跨IDE安装编排       │
└──────────────┬──────────────────────────────┘
               │ (驱动/消费)
┌──────────────▼──────────────────────────────┐
│  L1: 行为契约层 (ForgeOS 迁移过来)          │
│  SKILL.md — 三级运行时检测 + 强制规则清单     │
│  GO.md — 路由器模式(先判定后执行)            │
│  references/gate-rules.md — 声明式门控       │
│  references/mode-rules.md — 模式判定表       │
│  references/entry-check.md — 入场检测        │
└─────────────────────────────────────────────┘
```

### 层级职责

| 层 | 来源 | 核心职责 | 运行时需求 |
|---|------|---------|-----------|
| **L1: 行为契约** | ForgeOS | AI 该怎么做(Skill + Router) | 零依赖(纯 Markdown) |
| **L2: JS 内核** | ForgeOS | 能做什么(可执行引擎) | Node.js |
| **L3: CLI/分发** | ForgeOS | 怎么安装/运行 | npm |

---

## 📋 具体融合改动清单

### 一、SKILL.md 强化 (ForgeOS → ForgeOS)

**当前问题**: ForgeOS SKILL.md(87行)缺少 ForgeOS SKILL.md(286行)的核心行为定义:
- ❌ 三级运行时检测(L0/L1/L2)
- ❌ 11条强制 AI 行为约束
- ❌ Phase最小执行清单对比表(Fast/Lean vs Standard/Strict)
- ❌ 门控自检模板
- ❌ 按需加载指南([必须]/[推荐])

**融合改动**: SKILL.md 从"文件树 + 模式判定表"扩展为:

```
行1-15:    frontmatter (name, version v3.2.2)
行16-45:   三级运行时检测 (L0/L1/L2,降级规则"不报错不阻塞")
行46-70:   11条强制行为约束 (R1-R11,精简陈述)
行71-85:   Phase管线 ASCII图 + 四档模式表
> 第86行达到测试限制(100行)
```

**超出的内容拆到**:
- `docs/behavior-rules.md` — R1-R11详细规则(从 forgeos SKILL.md 迁移)
- `docs/runtimes.md` — L0/L1/L2三级运行时检测完整说明
- `docs/cli-reference.md` — CLI命令详情(已存在,待补充 ForgeOS 适配器)

### 二、GO.md 路由器升级 (保留现有结构 + ForgeOS 路由增强)

**当前 GO.md**: 1,280行,含 Phase 0-8 完整交互流程
**FlowGO 优势**: Step 0.5→Step 12 的顺序判定逻辑 + "先输出路由声明"铁律

**融合改动**:
1. 保留 GO.md 作为"AI指令入口",但把核心流程精简到 ~400行
2. Phase 0-8 的详细交互流程移到 `docs/phases/` (已在 P1-4 完成拆分)
3. 在 GO.md 头部加入 Step 0.5→Step 12 的路由决策链(从 ForgeOS GO.md 迁移)
4. 引用 `references/gate-rules.md` 做门控声明,不再重复描述

### 三、门控系统统一 (解决现有不一致)

**当前问题**:
| 文件 | G2命名 | G7.5 | G8 | gate-after值 |
|------|--------|------|----|-------------|
| `references/gate-rules.md` | G2.5 | ✅存在 | ✅存在 | phaseAfter=1.5 |
| `lib/phase-engine.js` | G2.5 | ✅存在 | ✅存在 | phaseAfter=1.5 |
| `domains/hooks/gate-check.js` | **G2** | ❌缺失 | ❌缺失 | phase=1 |

**融合改动**:
1. `gate-check.js` 统一改为 `G2.5` 命名(对齐 gate-rules.md 和 phase-engine.js)
2. `gate-check.js` 补全 G7.5、G8 检查
3. `gate-check.js` 增加 `type: 'manual'/'auto'` 字段(对齐 gate-rules.md 的"必须人工确认的门")
4. 创建 `docs/gate-unification.md` 记录门控命名规则

### 四、适配器设计统一 (ForgeOS → ForgeOS)

**ForgeOS 优势**: "一次编写,处处运行" — adapters/shared/ + 各运行时仅处理配置差异

**当前问题**: ForgeOS 的 adapters/ 目录(5个IDE适配器)各自独立实现较多

**融合改动**:
1. 提取 adapters/ 公共逻辑到 `adapters/shared/` (从 ForgeOS 迁移)
2. 各 IDE 适配器只保留运行时配置差异处理
3. Hook 三层降级架构(L1:Markdown → L2:JS Script → L3:Chain-Trigger)引入 ForgeOS

### 五、Phase 文档去重 (ForgeOS 按需加载 + ForgeOS docs/phases/)

**当前状态**:
- `layers/L1-INTERACTION/phase-N-*/*_SKILL.md` — ~54个 SKILL.md,每Phase一个
- `docs/phases/phase-*.md` — 刚才 P1-4 拆分的 Phase 指南(7个文件)
- `GO.md` Step 4-12 — Phase 流程 ASCII 示例 (~600行)

**融合改动**:
1. `layers/L1-INTERACTION/phase-N-*/_SKILL.md` → **只保留产物模板**,删除流程描述
2. `docs/phases/phase-*.md` → Phase 执行指南(包含交互流程+产物示例)
3. GO.md 不再展开 Phase 流程,改引用 `docs/phases/phase-*.md`
4. SKILL.md 中加入**按需加载指南**(ForgeOS 模式):每个Phase标注[必须]/[推荐]文件

### 六、Hook 系统升级 (三层降级架构)

```
┌─────────────────────────────────────┐
│ L3: Chain-Trigger (链式触发)         │
│ hooks/lib/chain.js                   │
│ Gate 通过后自动触发后续 Hook          │
├─────────────────────────────────────┤
│ L2: JS Script (Node.js Hook)         │
│ hooks/scripts/format-typecheck.js    │
│ hooks/scripts/security-scan.js       │
│ hooks/scripts/cost-tracker.js        │
├─────────────────────────────────────┤
│ L1: Markdown Hook (零运行时)          │
│ references/markdown-hooks.yaml       │
│ AI 按 YAML 指令执行                   │
└─────────────────────────────────────┘
```

当前 ForgeOS hooks/ 只有单层(`hooks.json` + `markdown-hooks.yaml`)。融合 ForgeOS 后补全 L2 JS Script 层(14个脚本从 ForgeOS hooks/scripts/ 迁移)。

### 七、版本对齐

| 文件 | 当前版本 | 统一后 |
|------|---------|--------|
| package.json | v3.2.2 ✅ | v3.2.2 (不变) |
| SKILL.md frontmatter | v3.2.2 ✅ | v3.2.2 (不变,已在 P1-5 修复) |
| GO.md 标题 | "ForgeOS v1.0" → "ForgeOS v3.2.2" ✅ | 已在 P1-5 修复 |
| SKILL.md 正文行9 | `# ForgeOS v3.2.2` ✅ | (已在 P1-5 修复) |

**版本对齐已完成(见 P1-5)**。融合方案中无需改动。

---

## 📊 融合前后对比

| 维度 | 纯 ForgeOS | 纯 ForgeOS | 融合后 |
|------|-------------|-----------|--------|
| AI行为约束 | ✅ 11条强制规则 | ❌ 缺失 | ✅ 迁移到 SKILL.md |
| JS可执行引擎 | ❌ 无 | ✅ PhaseEngine/Gates/CLI | ✅ 保留 |
| 零运行时降级 | ✅ L0级Markdown | ❌ 依赖Node.js | ✅ L0级Markdown + CLI fallback |
| 测试覆盖 | ❌ 无 | ✅ 13项通过 | ✅ 扩展到20+项 |
| Hook 降级 | ✅ Markdown/JS/Chain三层 | ⚠️ 单层 | ✅ 补全L2 JS层 |
| CLI命令 | ✅ 4个(init/setup/help/upgrade) | ✅ 15个(init/status/mem/party...) | ✅ 合并,保留15+ |
| 适配器设计 | ✅ "一次编写处处运行" | ⚠️ 各独立实现 | ✅ shared/ 提取公共逻辑 |
| Phase文档重复 | ⚠️ L1层分散 | ⚠️ layers/L1 + docs/phases + GO.md | ✅ 按需加载去重 |
| SKILL.md行数 | 286行(较臃肿) | 87行(<100测试通过) | ~95行(精炼后) |

---

## 🚀 实施优先级

### Phase A — 立即实施 (不破坏现有功能)
| # | 改动 | 工作量 | 影响面 |
|---|------|--------|-------|
| A1 | SKILL.md 补充运行时检测(L0/L1/L2)段 | 30min | 仅SKILL.md |
| A2 | SKILL.md 补充强制规则(R1-R11精简版) | 30min | 仅SKILL.md |
| A3 | gate-check.js 统一命名(G2→G2.5),补全G7.5/G8 | 30min | gate-check.js + test |
| A4 | SKILL.md 行数验证(确保<100行) | 5min | 无 |

### Phase B — 短期实施 (重构现有内容)
| # | 改动 | 工作量 | 影响面 |
|---|------|--------|-------|
| B1 | GO.md 精简到400行,引用docs/phases/ | 2h | GO.md + docs/phases/ |
| B2 | layers/L1-INTERACTION/*_SKILL.md 去流程化 | 1h | 54个_SKILL.md |
| B3 | SKILL.md 加入按需加载指南 | 1h | SKILL.md |
| B4 | adapters/shared/ 提取公共逻辑 | 2h | adapters/ |

### Phase C — 中期实施 (新增架构)
| # | 改动 | 工作量 | 影响面 |
|---|------|--------|-------|
| C1 | hooks/scripts/ 补全14个JS Script(Hook L2层) | 半天 | hooks/ |
| C2 | 扩展测试到20+项(CI集成、Hook验证) | 1天 | test/ |
| C3 | chain-trigger.js (Hook L3层) | 半天 | hooks/lib/ |

---

## 🎯 融合原则

1. **L1(行为契约)保持纯Markdown** — AI读SKILL.md就能工作,不依赖Node.js
2. **L2/L3(JS内核/CLI)由ForgeOS提供** — PhaseEngine、门控验证、CLI命令
3. **声明式优先于命令式** — gate-rules.md 说"什么条件下跳过",不说"怎么检查"
4. **渐进式披露** — [必须] / [推荐] 标注,Phase相关才加载
5. **不报错不阻塞** — L0环境降级到Markdown模式,不强制JS运行时
