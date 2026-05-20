# Devflow v3.0 — 完整文件清单

> **统计时间**: 2026-05-17
> **总文件数**: 256
> **总大小**: ~2.5 MB
> **路线图**: Phase A–F 全部完成 ✅

---

## 目录架构

```
devflow-evo/
├── SKILL.md                          # v3 零配置入口 (20KB)
├── GO.md                             # v3 12步路由器 (20KB)
├── V3-ARCHITECTURE.md                # 三层架构设计 (15KB)
├── USER-MIGRATION-GUIDE.md           # v1→v3 迁移指南 (6KB)
├── PERFORMANCE-BENCHMARK.md          # 性能基准对比 (5KB)
├── INTEGRATION_PLAN.md               # 整合计划 (20KB)
├── FINAL_OPTIMIZATION_CHECKLIST.md   # 最终优化清单 (16KB)
├── README.md / README.en.md          # 项目说明 (11KB)
├── LICENSE                           # MIT (1KB)
│
├── layers/                           # ★ v3 三层架构核心
│   ├── L1-INTERACTION/               #   交互层 — Phase 0-8
│   │   ├── README.md
│   │   ├── phase-0-yc-strategy/_SKILL.md    (2.9KB)
│   │   ├── phase-1-5whys/_SKILL.md          (2.7KB)
│   │   ├── phase-1b-discuss/_SKILL.md       (10KB)
│   │   ├── phase-2-design/_SKILL.md         (2.9KB)
│   │   ├── phase-2a-shotgun/_SKILL.md       (3.8KB)
│   │   ├── phase-3-task-plan/_SKILL.md      (3.2KB)
│   │   ├── phase-4-build/_SKILL.md          (3.6KB)
│   │   ├── phase-5-test/_SKILL.md           (3.2KB)
│   │   ├── phase-6-review/_SKILL.md         (8.7KB)
│   │   ├── phase-7-canary/_SKILL.md         (4.9KB)
│   │   └── phase-8-archive/_SKILL.md        (6.6KB)
│   │
│   ├── L2-ENGINE/                  #   引擎层 — 引擎层
│   │   ├── README.md
│   │   ├── learning-workflow/_SKILL.md      (8.9KB)
│   │   ├── party-mode/_SKILL.md             (4.6KB)
│   │   └── wave-executor/_SKILL.md          (6.8KB)
│   │
│   └── L3-ARCHITECTURE/             #   架构层 — 架构层
│       ├── README.md
│       ├── _SKILL.md                        (4.7KB)
│       ├── dag-router/_SKILL.md             (7.0KB)
│       ├── provider-gateway/_SKILL.md       (8.1KB)
│       ├── agent-isolation/_SKILL.md        (8.0KB)
│       └── parallel-engine/_SKILL.md        (16KB)
│
├── references/                       # 规则、模板、参考文档
│   ├── RULES-v3.md                    # v3规则集 R1-R20 (10KB)
│   ├── RULES.md                       # v1规则集 (21KB, 保留兼容)
│   ├── SECURITY.md                    # 安全编码规范 (10KB)
│   ├── caveman-rules.md              # 7级Token压缩 (9KB)
│   ├── delta-specs.md                # 差量规范 (7KB)
│   ├── PROGRESSIVE-DISCLOSURE.md     # 渐进式披露 (5KB)
│   ├── entry-check.md                # 入场检测 (11KB)
│   ├── gate-rules.md                 # 阶段门规则 (3KB)
│   ├── mode-rules.md                 # 模式判定 (11KB)
│   ├── token-budget.md              # Token成本模型 (7KB)
│   ├── user-interaction-guidelines.md (5KB)
│   ├── prompts/                      # 15个Phase Prompt (v1保留)
│   ├── reference/                    # 技术参考 (前端/UI/测试金字塔等)
│   └── templates/                    # 25个产物模板
│
├── skills/                           # 独立Skills (向后兼容v1)
│   ├── stage-skills/                 #   17个Stage Skills (v1兼容)
│   ├── brainstorming/                #   头脑风暴
│   ├── dispatching-parallel-agents/  #   并行Agent调度
│   ├── executing-plans/              #   计划执行
│   ├── finishing-a-development-branch/ # 分支收尾
│   ├── install-devflow-evo/              #   DevFlow安装
│   ├── karpathy-rules/               #   Karpathy编程准则
│   ├── manage-memory/                #   记忆管理
│   ├── receiving-code-review/        #   接收Code Review
│   ├── requesting-code-review/       #   请求Code Review
│   ├── subagent-driven-development/  #   SubAgent驱动开发
│   ├── systematic-debugging/         #   系统化调试
│   ├── test-driven-development/      #   TDD
│   ├── thinking-models/              #   思维模型
│   ├── using-git-worktrees/          #   Git Worktree
│   ├── using-superpowers/            #   Superpowers使用
│   ├── verification-before-completion/ # 完成前验证
│   ├── writing-plans/                #   编写计划
│   └── writing-skills/               #   Skill编写指南
│
├── agent-skills/                     # 23个专家Agent Skills
│   └── skills/                       #   api-design, debugging, security, tdd...
│
├── bin/                              # 6个可执行脚本
│   ├── init.js                       #   初始化
│   ├── hook-manager.js              #   Hook管理
│   ├── memory-system.js             #   记忆系统
│   ├── stage-executor.js            #   Stage执行器
│   ├── token-manager.js             #   Token管理
│   └── external-adapter.js          #   外部适配器
│
├── hooks/                            # 3个Hook脚本
│   ├── session-start.js             #   会话启动
│   ├── statusline.js                #   状态栏
│   └── user-prompt.js               #   用户Prompt处理
│
├── memory/                           # 跨会话记忆系统
│   ├── PROJECT_CONTEXT.md
│   ├── DECISIONS.md
│   ├── KNOWN_FAILURES.md
│   ├── LESSONS.md                    # ★ 自进化教训库
│   ├── LEARNING_BACKLOG.md
│   ├── domain-skills/               # ★ 领域技能沉淀
│   └── ...
│
├── optional/                         # 可选工具链
│   └── gitnexus-detector.md         #   GitNexus检测协议
│
├── templates/                        # 30+项目模板
│   ├── spec.md, requirements.md, research.md...
│   ├── codebase/ (架构/约定/测试等)
│   └── research-project/ (5个研究模板)
│
├── docs/                             # 设计文档
│   ├── FUSION_PLAN.md
│   └── SDD-INTEGRATION.md
│
└── adapters/                         # 外部适配器
```

---

## 按层级文件统计

| 层级 | 文件数 | 核心大小 | 说明 |
|------|--------|---------|------|
| **L1 交互层** | 12 | ~49KB | Phase 0-8 + 1b讨论 + README |
| **L2 引擎层** | 4 | ~25KB | LearningWorkflow + PartyMode + WaveExecutor |
| **L3 架构层** | 6 | ~45KB | DAG + Provider + Isolation + Parallel + README |
| **References** | ~55 | ~250KB | 规则/Prompt/模板/参考 |
| **Skills** | ~60 | ~400KB | Stage Skills + 独立Skills |
| **Agent Skills** | ~25 | ~250KB | 23个专家角色 |
| **bin/hooks** | 9 | ~70KB | 自动化脚本 |
| **Memory** | 11 | ~8KB | 跨会话记忆 |
| **Templates** | 35 | ~250KB | 项目/产物模板 |
| **Docs** | 2 | ~20KB | 设计文档 |
| **Entry** | 7 | ~100KB | SKILL.md/GO.md/README等 |
| **总计** | **256** | **~2.5MB** | |

---

## v3.0 新增/重大改动文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `SKILL.md` | 重写 | v3零配置入口，三层架构感知 |
| `GO.md` | 重写 | v3 12步路由器，快速索引表 |
| `V3-ARCHITECTURE.md` | 新增 | 三层架构设计文档 |
| `USER-MIGRATION-GUIDE.md` | 新增 | v1→v3迁移指南 |
| `PERFORMANCE-BENCHMARK.md` | 新增 | 性能基准对比 |
| `layers/L1-INTERACTION/phase-*-SKILL.md` | 新增 | 10个Phase Skill |
| `layers/L1-INTERACTION/phase-1b-discuss/_SKILL.md` | 新增 | PartyMode讨论阶段 |
| `layers/L2-ENGINE/learning-workflow/_SKILL.md` | 新增 | 自进化引擎 |
| `layers/L2-ENGINE/party-mode/_SKILL.md` | 新增 | 多Agent共识 |
| `layers/L2-ENGINE/wave-executor/_SKILL.md` | 新增 | Wave并行执行器 |
| `layers/L3-ARCHITECTURE/dag-router/_SKILL.md` | 新增 | DAG依赖路由 |
| `layers/L3-ARCHITECTURE/provider-gateway/_SKILL.md` | 新增 | Provider智能网关 |
| `layers/L3-ARCHITECTURE/agent-isolation/_SKILL.md` | 新增 | Agent上下文隔离 |
| `layers/L3-ARCHITECTURE/parallel-engine/_SKILL.md` | 新增 | 并行编排引擎 |
| `references/delta-specs.md` | 新增 | 差量规范 |
| `references/token-budget.md` | 新增 | Token成本模型 |
| `references/RULES-v3.md` | 新增 | v3规则集 R1-R20 |

---

**v3.0 路线图: Phase A ✅ → B ✅ → C ✅ → D ✅ → E ✅ → F ✅ — 全部完成**
