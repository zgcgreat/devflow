# 源项目未贡献内容分析 — 可借鉴项全景图

> **生成时间**: 2026-05-17  
> **分析范围**: mega-workflow, caveman, get-shit-done, devflow-kit, supercorp-ultimate  
> **目标**: 识别各项目中尚未被整合到 ultimate-workflow 但有高借鉴价值的内容

---

## 📊 总览排名：最有价值的20项未贡献内容

按"适合借鉴到ultimate-workflow的程度"排序：

| 排名 | 来源项目 | 内容 | 核心单行价值 |
|------|---------|------|-------------|
| 1 | get-shit-done | Graduation 毕业聚类提升 | LearningWorkflow闭环关键缺环 |
| 2 | devflow-kit | Systematic Debugging全套(~1000行) | 填补最大空白——调试方法论 |
| 3 | caveman | Cavecrew子代理体系(5文件) | 三代理委托架构，产出压缩~40% |
| 4 | get-shit-done | Discuss Assumptions Mode (假设模式) | 大幅降低context gathering交互成本 |
| 5 | mega-workflow | Review Specialists(7文件) | 按技术领域划分的专家子agent并行审查 |
| 6 | mega-workflow | Superpowers Skills(15+ Skills) | 微观工程技能填补操作空白 |
| 7 | caveman | Python压缩管线(6文件) | detect→compress→validate完整流水线 |
| 8 | devflow-kit | Memory增强文件(6文件) | 记忆系统完整性补充 |
| 9 | supercorp-ultimate | Agents SPECIALISTS.md (214行) | Phase 6之上加技术专家审查层 |
| 10 | get-shit-done | Seeds种子自动浮现 | from-scratch需求管理机制 |
| 11 | mega-workflow | MCP Server + Provider抽象(60+文件) | AI服务化接口+跨平台适配 |
| 12 | mega-workflow | Memory System (8未追踪文件) | 完整的团队记忆系统 |
| 13 | get-shit-done | Context Budget + MCP Audit | token经济性深度工程实践 |
| 14 | get-shit-done | Gates Taxonomy (四类门控分类学) | 工作流验证系统设计框架 |
| 15 | supercorp-ultimate | Gate Conditions + Emergency Mode | 生产事故应急响应机制 |
| 16 | mega-workflow | GSD Workflows (~80个命令定义) | 项目生命周期全操作覆盖 |
| 17 | mega-workflow | Parallel Execution (200K fresh context) | Phase 2并行开发模式说明 |
| 18 | devflow-kit | Dispatching Parallel Agents (~183行) | 并行调试效率提升 |
| 19 | caveman | Eval Suite评测体系(4-5文件) | 双基线度量+tiktoken精确计数 |
| 20 | supercorp-ultimate | Schema Definition (446行) | STATE.md/PROGRESS.md可编程解析 |

---

## 🔵 一、get-shit-done — P0级贡献(最被低估的项目)

### P0: Graduation 毕业聚类提升系统

**完整路径**: `E:/LLM/skills/get-shit-done/get-shit-done/workflows/graduation.md`
**行数**: ~196行

**核心价值**: 在phase过渡时自动扫描最近N个阶段的LEARNINGS.md文件，使用Jaccard相似度对recurring items进行聚类。当某类问题在多个phase出现达到阈值时，向开发者呈现"升级候选"—可以将知识点提升到PROJECT.md或PATTERNS.md中成为项目级知识。

**为什么是LearningWorkflow闭环的关键缺环**: ultimate-workflow的LearningWorkflow负责提取LESSONS(记录教训)，但缺少自动发现跨phase模式并提升的能力。Graduation填补了"记录教训→识别规律→提升到项目级知识"的完整闭环。特别是Jaccard相似度聚类和HITL(Human-in-the-Loop)确认流程的设计非常精妙。

**与LearningWorkflow的关系**:
```
当前: Phase 4 → LESSONS.md(失败教训) → 下次Wave启动加载
待补充: Phase 4+5+6 → LEARNINGS → Graduation聚类 → 项目级PATTERNS.md
```

---

### P0: Discuss Assumptions Mode (假设模式)

**完整路径**: `E:/LLM/skills/get-shit-done/get-shit-done/workflows/discuss-phase-assumptions.md`
**行数**: ~675行（含完整workflow）

**核心价值**: discuss-phase有两种模式—默认"访谈式问答"和创新"假设模式"。在假设模式中，Claude先深度分析代码库（读5-15个相关文件），然后主动提出实现假设（每个包含证据、错误后果、置信度），用户只需要确认或纠正—通常只需2-4轮交互而非访谈模式的15-20轮。

**适合借鉴原因**: ultimate-workflow的Phase 1b Discuss主要采用问答式歧义捕获，缺少假设模式这一高效变体。假设模式特别适合已有清晰代码模式的成熟项目场景。其置信度标注(Confident/Likely/Unclear)、证据引用(文件路径)、错误后果说明的设计可立即增强discuss-phase的灵活性。

---

### P1: Seeds 种子自动浮现系统

**完整路径**: `E:/LLM/skills/get-shit-done/get-shit-done/workflows/plant-seed.md`
**配套命令**: `E:/LLM/skills/get-shit-done/commands/gsd/capture.md` (seed子模式)

**核心价值**: "前瞻性想法捕获"概念模型。将未来可能需要的想法记录为结构化种子文件，定义触发条件(trigger_when)，在new-milestone时自动匹配并浮现。比传统deferred items优越—保留"为什么重要"(WHY)和"何时浮现"(WHEN)。

**适合借鉴原因**: ultimate-workflow有Phase 1b Discuss的`<deferred>` section但只有静态记录能力。Seeds引入的是自动触发机制—当用户进入新Milestone/Phase时，与当前范围匹配的seed自动呈现给开发者，形成"想法池→自动浮现→采纳为任务"的完整生命周期。

---

### P1: Context Budget + MCP Audit

**完整路径**: `E:/LLM/skills/get-shit-done/get-shit-done/references/context-budget.md`
**行数**: ~86行

**核心价值**: 
1) 根据当前模型的context window大小(<500k vs >=500k)自适应调整subagent output读取深度(frontmatter-only vs full-body)
2) 上下文退化四级(PEAK/GOOD/DEGRADING/POOR)和对应行为策略
3) **独特洞察**: MCP Tool Schema Cost—每个启用的MCP server每轮注入tool schema，重型server每轮消耗20k+ tokens。提出"Phase前MCP审计"四步检查清单

**适合借鉴原因**: ultimate-workflow的Provider Gateway有路由逻辑但没有context-aware prompt enrichment机制。Context Budget的按context window缩放策略和MCP schema cost审计是token经济性方面的深度工程实践，可补充到token-budget.md或provider-gateway中。

---

### P1: Gates Taxonomy (四类门控分类学)

**完整路径**: `E:/LLM/skills/get-shit-done/get-shit-done/references/gates.md`
**行数**: ~71行

**核心价值**: 定义四种标准gate类型及其选择启发式：
- **Pre-flight Gate**: 操作前验证前置条件
- **Revision Gate**: 产出质量评估+迭代修订循环(带iteration cap)
- **Escalation Gate**: 无法自动解决的议题升级给人(安全阀)
- **Abort Gate**: 终止操作防止损害或浪费资源

**适合借鉴原因**: ultimate-workflow的Wave Executor有checkpoint protocol但缺少统一的gate分类体系。gates.md提供了一种设计原则级的框架—任何验证点都可归类到这四种门之一，选择逻辑是"先pre-flight→后产出用revision→无法自动解决则escalate→继续会损害则abort"。

---

## 🟢 二、devflow-kit — Systematic Debugging (最大单一价值遗漏)

### P0: Systematic Debugging全套 (~1000行)

这是devflow-kit中最为成熟和实战验证的技能体系，包含了调试"宪法"—填补了ultimate-workflow在"发现问题→定位原因→验证修复"全链路上的方法论空白。目前工作流中有开发(Wave执行)、测试、审查三个阶段，但没有专门针对调试阶段的指导。

#### 2.1 systematic-debugging/SKILL.md (~297行)
**核心价值**: 四阶段法(观察→分析→假设→验证)+"铁律"约束。包含真实世界影响数据(15-30分钟vs 2-3小时)。直接集成到Phase 4和Phase 5之间。

#### 2.2 root-cause-tracing.md (~170行)
**核心价值**: 根因追溯法—通过调用链回溯定位原始触发点。包含DOT图、真实案例(空字符串导致git init在源码目录创建.git)、栈追踪技术。填补"调试深度分析"关键环节。

#### 2.3 condition-based-waiting.md (~116行) + example文件(~159行)
**核心价值**: 条件等待策略，替代硬编码延迟。包含通用轮询函数实现+3个领域专用助手。真实影响：15个flaky测试从60%通过率提升到100%，执行时间减少40%。解决Wave并行执行中多Agent并发依赖时序关系问题。

#### 2.4 defense-in-depth.md (~123行)
**核心价值**: 四层验证框架—入口校验、业务逻辑校验、环境守卫、调试日志。确保bug"结构性不可能"重现。在Phase 4代码质量审查中可作为检查清单。

#### 2.5 find-polluter.sh (~64行)
**核心价值**: Bash脚本，二分查找定位污染测试。逐个运行测试文件找到第一个产生副作用的测试。可直接集成到bin/工具链中。

---

### P0: Memory增强文件(6个新维度, ~250行合计)

devflow-kit的记忆系统有6个文件未被PROVENANCE-REPORT追踪，它们覆盖了团队协作、用户画像、session管理、verification baseline等维度：

| 文件 | 行数 | 核心价值 |
|------|------|---------|
| memory/LEARNING_BACKLOG.md | ~40 | "发现但未实施"改进建议队列，status流转: proposed→ready_for_promotion→superseded |
| memory/SESSION_CLOSE_CHECKLIST.md | ~33 | 会话收尾检查清单—确保记忆感知session完成前状态持久化、条目元数据完整性 |
| memory/USER_PROFILE.md + TEAM_PREFERENCES.md | ~60 | 用户画像和团队偏好模板，分离设计(用户偏好不污染项目事实) |
| memory/AGENT_NOTES.md | ~30 | AI助手笔记—记录重复操作陷阱、仓库特定处理提醒、执行质量改进建议 |
| memory/VERIFICATION_BASELINE.md | ~33 | 验证基线—定义团队认可的验证命令和证据标准，记录已知盲点 |
| memory/memory-index.yaml | ~28 | 记忆索引—维护所有记忆文件的健康度指标、validator版本、learning_backlog统计 |

**为什么适合**: ultimate-workflow只有LESSONS.md。这6个补充维度覆盖了"Agent端学习"(AGENT_NOTES)、"用户偏好"(USER_PROFILE/TEAM_PREFERENCES)、"验证基线"(VERIFICATION_BASELINE)、"会话质量保障"(SESSION_CLOSE_CHECKLIST)等空白。

---

## 🟡 三、caveman — Cavecrew子代理体系 + Python压缩管线

### P0: Cavecrew子代理体系(5个核心文件, ~300行合计)

这是caveman最独特的设计—比ultimate-workflow的L2-ENGINE并行Agent更轻量、更可组合。定义了三个只读/最小变更子代理：

| 子代理 | 行数 | 核心价值 |
|--------|------|---------|
| cavecrew-investigator.md | 58行 | 只读代码定位器，输出格式`<path:line> - <symbol> - <note>`，按Defs/Refs/Callers分组 |
| cavecrew-builder.md | 48行 | 手术式单文件编辑，硬限制1-2个文件范围，4种终端状态(tiny-big/needs-confirm/ambiguous/regressed) |
| cavecrew-reviewer.md | 49行 | Diff/分支审查器，四级严重度体系(红色bug/黄色风险/蓝色瑕疵/问号疑问) |

**关键洞察**: 子代理输出被注入主上下文时压缩60%=主会话寿命延长数倍。与ultimate-workflow的Wave Executor中"最小变更Agent模板"高度互补。

---

### P1: Python压缩管线(6个文件, ~800行合计)

比已贡献的bin/token-manager.js更完整的记忆文件压缩流水线：

| 文件 | 行数 | 核心价值 |
|------|------|---------|
| compress.py | 255行 | 完整编排器—敏感路径拒绝、备份验证写入、重试+修复循环、最大500KB保护 |
| detect.py | 122行 | 文件类型检测器—自然语言/代码/配置分类，无扩展名启发式内容分析 |
| validate.py | 214行 | 压缩验证器—标题完整性、代码块逐字对比、URL完整性、列表项变化容忍度 |
| cli.py | ~60行 | 命令行接口和进度输出格式化 |
| SKILL.md | 112行 | 压缩规则手册—9类填充词、5种保护对象、结构化保持规则 |
| SECURITY.md | ~40行 | 安全说明—不压缩文件扩展名清单、敏感文件名模式 |

**适合原因**: Hook管理session生命周期→Token监控触发压缩→Python管线处理记忆文件持久化压缩，形成完整闭环。

---

### P1: JS轻量压缩器(compress.js, 119行)
**核心价值**: 纯Node.js文本压缩函数—零外部依赖，专为MCP tool description等safe string fields设计。可直接嵌入ultimate-workflow的Provider路由和Agent描述中减少上下文加载量。

---

## 🔴 四、mega-workflow — Review Specialists + Superpowers Skills

### P0: Review Specialists(7个专家子agent, ~350行合计)

**完整路径**: `E:/LLM/skills/mega-workflow/layer-5-gstack/review/specialists/`
- **security.md**(62行): Security Specialist—Input Validation, Auth Bypass, Injection Vectors, Crypto Misuse, Secrets Exposure
- **data-migration.md**(49行): Data Migration Specialist—Reversibility, Data Loss Risk, Lock Duration, Multi-Phase Safety
- **performance.md**(53行): Performance Specialist—N+1 Queries, Missing DB Indexes, Bundle Size, Rendering Performance
- **api-contract.md**(50行): API Contract Specialist—Breaking Changes, Versioning Strategy, Error Response Consistency
- **maintainability.md**(47行): Maintainability Specialist—Dead Code, Magic Numbers, Stale Comments, DRY Violations
- **testing.md**(50行): Testing Specialist—Test coverage gaps, missing edge cases
- **red-team.md**(46行): Red Team Review—对抗性分析，攻击Happy Path，找Silent Failures

**核心价值**: mega-workflow引入了按技术领域划分的专家子agent维度。与supercorp-ultimate的"思考角度对抗"(Blind/Edge/Acceptance)互补：前者关注"思考角度不同"，后者关注"技术领域专精"。融合后获得双重保障。

**触发条件设计**:
| 专家 | 触发条件 |
|------|---------|
| Red Team | diff>200行 或 security发现CRITICAL |
| API Contract | SCOPE_API=true |
| Data Migration | SCOPE_MIGRATIONS=true |
| Performance | Backend/Frontend scope |

---

### P1: Superpowers Skills(15+独立Skill, ~1500行合计)

**完整路径**: `E:/LLM/skills/mega-workflow/layer-4-superpowers/skills/`
覆盖最高频的微观工程任务：

| Skill | 核心价值 |
|-------|---------|
| systematic-debugging | 四阶段法+Iron Law: NO FIXES WITHOUT ROOT CAUSE |
| test-driven-development | RED-GREEN-REFACTOR循环+Testing Anti-patterns清单 |
| subagent-driven-development | Spec Reviewer/Implementer/Code Quality Reviewer三角色协作 |
| writing-plans | 计划质量检查 |
| using-git-worktrees | 并行开发分支管理 |
| verification-before-completion | 完成前验证清单 |
| dispatching-parallel-agents | 并行子agent调度上下文管理 |
| executing-plans | 计划执行偏差检测和纠正 |
| finishing-a-development-branch | 分支清理、rebase策略、PR准备 |
| requesting-code-review | 为review准备上下文和diff摘要 |
| brainstorming | AI辅助设计brainstorm工具链 |

---

### P1: MCP Server + Provider抽象层(60+文件)
**完整路径**: `E:/LLM/skills/mega-workflow/layer-1-task-master/`
- **src/core/direct-functions/**(~45个函数): add-task, remove-task, update-task, expand-task等
- **src/providers/**(~19个Provider): openai.js, anthropic.js, gemini.js, azure.js, bedrock.js等
- **src/profiles/**(~15个Profile): cursor, windsurf, claude, cline, kiro, zed等

**适合借鉴**: MCP Server提供标准化AI Agent服务化接口。Provider抽象层和Profile体系是跨平台适配框架。

---

### P2: Memory System(8未追踪文件)
**完整路径**: `E:/LLM/skills/mega-workflow/layer-6-memory/memory/`
AGENT_NOTES.md, CURRENT_STATE.md, LEARNING_BACKLOG.md, SESSION_CLOSE_CHECKLIST.md, TEAM_PREFERENCES.md, USER_PROFILE.md, VERIFICATION_BASELINE.md, memory-index.yaml

**适合借鉴**: 完整的团队记忆系统，覆盖团队协作、用户画像、session管理、verification baseline。

---

### P2: GSD Workflows (~80个命令定义)
**完整路径**: `E:/LLM/skills/mega-workflow/layer-2-gsd/get-shit-done/workflows/`
new-project, plan-phase, execute-phase, verify-phase, remove-phase, insert-phase, discuss-phase(含9种mode), do, quick, fast, autonomous, code-review, eval-review, review, ship, pr-branch, graduation, debug, diagnose-issues, forensics, cleanup, audit-fix, sync-skills, docs-update

**适合借鉴**: 完整的项目生命周期操作命令库，可作为ultimate-workflow的"扩展技能包"。

---

## 🟣 五、supercorp-ultimate — 技术专家审查层 + Emergency Mode

### P0: Agents SPECIALISTS.md (214行)
**完整路径**: `E:/LLM/skills/supercorp-ultimate/agents/SPECIALISTS.md`

**核心价值**: Phase 6之上加第二层技术专家审查。定义了7个trigger-based specialist，每个有触发条件、关注焦点、输出schema：

| Specialist | Trigger | Key Focus |
|------------|---------|-----------|
| API Contract | SCOPE_API=true | Breaking changes, versioning, rate limiting |
| Data Migration | SCOPE_MIGRATIONS=true | Reversibility, data loss, lock duration |
| Security | Auth scope or diff>100 | Input validation, bypass vectors, injection |
| Performance | Backend/Frontend scope | N+1 queries, missing indexes, bundle size |
| Maintainability | Always | Dead code, magic numbers, DRY violations |
| Testing | Always | Negative-path tests, edge cases, isolation |
| Red Team | diff>200 or CRITICAL security | Adversarial analysis, trust boundary exploitation |

**JSON finding schema + combination strategy**(small/medium/large change=不同专家)是actionable engineering discipline。

---

### P1: Gate Conditions + Emergency Mode (170行)
**完整路径**: `E:/LLM/skills/supercorp-ultimate/rules/gate-conditions.md`

**核心价值**: 
- **Gate 2a(UI Gate)**: Designer+Human检查page list、component inventory、interaction spec
- **Close Gate**: CEO+Memory Keeper sign-off，所有artifacts归档、lessons记录、memory文件更新
- **Emergency Mode**: P0/P1紧急触发(关键词"紧急"/"critical"/"downtime")，跳过所有gate直入Phase 4，事后完成期限(24h验证/72h审查/1周LESSONS)

**适合借鉴**: 生产事故应急响应机制+闭环收尾纪律。

---

### P1: Agents CONSOLIDATION.md (193行)
**完整路径**: `E:/LLM/skills/supercorp-ultimate/agents/CONSOLIDATION.md`

**核心价值**: 系统分析减少14个agent角色到11 core+4 special-scenario，含per-phase loading matrix(8 phases)、合并策略(cfo→ceo, strategist→ceo, dba→architect)、special-scenario trigger rules。

---

### P2: Schema Definition (446行)
**完整路径**: `E:/LLM/skills/supercorp-ultimate/rules/schema.md`

**核心价值**: STATE.md/PROGRESS.md/DECISIONS.md/memory-index.yaml的正式YAML schema定义+验证规则。使这些文件可编程解析(stage-executor.js可读取phase numbers, progress percentages)。

---

## 📋 六、整合优先级建议

### Phase A: 立即整合(P0, 影响面最大)

| # | 内容 | 来源 | 目标位置 |
|---|------|------|---------|
| 1 | Graduation聚类提升 | get-shit-done | learning-workflow/_SKILL.md 中补充"跨phase模式识别→项目级知识提升"步骤 |
| 2 | Systematic Debugging全套 | devflow-kit | L2-ENGINE新增debugging-workflow/_SKILL.md，插入Phase 4和Phase 5之间 |
| 3 | Cavecrew子代理体系 | caveman | L2-ENGINE/party-mode补充subagent委托协议 |
| 4 | Discuss Assumptions Mode | get-shit-done | L1-INTERACTION/phase-1b-discuss/_SKILL.md 中增加"假设模式"变体 |
| 5 | Review Specialists(7个) | mega-workflow | L1-INTERACTION/phase-6-review/_SKILL.md 中增加技术专家子agent层 |

### Phase B: 短期整合(P1, 效率提升显著)

| # | 内容 | 来源 |
|---|------|------|
| 6 | Python压缩管线 | caveman |
| 7 | Memory增强文件(6维度) | devflow-kit / mega-workflow |
| 8 | Seeds种子自动浮现 | get-shit-done |
| 9 | Context Budget + MCP Audit | get-shit-done |
| 10 | Gates Taxonomy (四类门控) | get-shit-done |
| 11 | Superpowers Skills(精选5-8个) | mega-workflow |
| 12 | SPECIALISTS.md (7个trigger专家) | supercorp-ultimate |
| 13 | Emergency Mode + Close Gate | supercorp-ultimate |

### Phase C: 中期优化(P2, 锦上添花)

| # | 内容 | 来源 |
|---|------|------|
| 14 | MCP Server Provider抽象层 | mega-workflow |
| 15 | GSD Workflows(精选命令) | mega-workflow |
| 16 | Schema Definition | supercorp-ultimate |
| 17 | JS轻量压缩器 | caveman |
| 18 | Dispatching Parallel Agents | devflow-kit |

---

## 🔬 七、特别洞察：get-shit-done是最被低估的项目

PROVENANCE-REPORT仅记录了get-shit-done的3%贡献(上下文隔离+Checkpoint协议)，但实际有5个P0/P1级能力未被整合：

1. **Graduation聚类提升** — LearningWorkflow唯一缺环
2. **Discuss Assumptions Mode** — 交互成本降低80-90%
3. **Seeds自动浮现** — 全新需求管理机制
4. **Context Budget + MCP Audit** — token经济性深度实践
5. **Gates Taxonomy** — 验证系统设计框架

这5项的价值远超已整合的上下文隔离和Checkpoint协议。**建议优先整合get-shit-done而非mega-workflow**。

---

## 📐 八、与现有v3核心创新的互补关系

| v3核心创新 | 可补充的能力 | 来源项目 |
|------------|-------------|---------|
| LearningWorkflow自进化 | Graduation聚类提升(从教训到项目知识) | get-shit-done |
| Phase 1b Discuss | Assumptions Mode(假设模式降低交互轮次) | get-shit-done |
| DAG并行路由 | Dispatching Parallel Agents(并行调试) | devflow-kit / mega-workflow |
| Provider智能路由 | Context Budget + MCP Audit(tier自适应) | get-shit-done |
| Agent上下文隔离 | Cavecrew子代理委托协议 | caveman |
| Canary灰度发布 | Emergency Mode紧急回滚机制 | supercorp-ultimate |
| 双阶段Code Review | Review Specialists技术专家层(双重保障) | mega-workflow / supercorp-ultimate |

---

> **分析完成时间**: 2026-05-17T18:00:00Z  
> **分析人员**: 多Agent并行扫描 + 人工整理  
> **置信度**: 高（基于各Agent对项目完整遍历和逐文件对比）
