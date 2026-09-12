# DevFlow 融合映射表

> 版本: 1.0.0 | 日期: 2026-05-27
> 本表记录 DevFlow 中每个文件/目录的来源（DevFlow / ECC / 新增）

---

## 一、根级文件

| DevFlow 路径 | 来源 | 原始路径 | 备注 |
|---------------|------|---------|------|
| `SKILL.md` | 融合新增 | DevFlow `SKILL.md` 基础 + ECC Agent增强 | 主入口 |
| `GO.md` | DevFlow | `devflow/GO.md` | 统一路由器 |
| `CONSTITUTION.md` | DevFlow | `devflow/layers/L1-INTERACTION/CONSTITUTION.md` | 工作流宪法 |
| `RULES.md` | DevFlow | `devflow/references/RULES-v3.md` | R1-R20 规则集 |
| `VERSION` | 新增 | — | `1.0.0` |
| `README.md` | 新增 | — | 待 M5 完成 |

---

## 二、layers/ (三层架构)

| DevFlow 路径 | 来源 | 原始路径 | 备注 |
|---------------|------|---------|------|
| `layers/L1-INTERACTION/` | DevFlow | `devflow/layers/L1-INTERACTION/` | 完整复制，Phase增强在M1完成 |
| `layers/L2-ENGINE/` | DevFlow | `devflow/layers/L2-ENGINE/` | 完整复制，✅ Hook桥接M2完成(gate-hook-bridge) |
| `layers/L3-ARCHITECTURE/` | DevFlow | `devflow/layers/L3-ARCHITECTURE/` | 完整复制，Harness路由在M7完成 |

---

## 三、agents/ (ECC 精选 Agent)

| DevFlow 路径 | 来源 | 原始路径 | 加载策略 | 映射Phase |
|---------------|------|---------|---------|----------|
| `agents/core/planner.md` | ECC | `ECC/agents/planner.md` | always | P0,P1,P1b,P3 | ✅ M1完成 |
| `agents/core/architect.md` | ECC | `ECC/agents/architect.md` | always | P1,P1b,P2,P2a | ✅ M1完成 |
| `agents/core/code-reviewer.md` | ECC | `ECC/agents/code-reviewer.md` | always | P6 | ✅ M1完成 |
| `agents/core/security-reviewer.md` | ECC | `ECC/agents/security-reviewer.md` | always | P5,P6 | ✅ M1完成 |
| `agents/core/build-error-resolver.md` | ECC | `ECC/agents/build-error-resolver.md` | always | P4 | ✅ M1完成 |
| `agents/core/code-explorer.md` | ECC | `ECC/agents/code-explorer.md` | always | P0,P2 | ✅ M1完成 |
| `agents/core/refactor-cleaner.md` | ECC | `ECC/agents/refactor-cleaner.md` | always | P6 | ✅ M1完成 |
| `agents/extended/python/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P5,P6 | ✅ M1完成 (4 Agent) |
| `agents/extended/go/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P5,P6 | ✅ M1完成 (2 Agent) |
| `agents/extended/rust/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P5,P6 | ✅ M1完成 (2 Agent) |
| `agents/extended/java/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P5,P6 | ✅ M1完成 (2 Agent) |
| `agents/extended/kotlin/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P5,P6 | ✅ M1完成 (2 Agent) |
| `agents/extended/flutter/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P5,P6 | ✅ M1完成 (2 Agent) |
| `agents/extended/cpp/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P5,P6 | ✅ M1完成 (2 Agent) |
| `agents/extended/swift/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P5,P6 | ✅ M1完成 (1 Agent) |
| `agents/extended/typescript/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P5,P6 | ✅ M1完成 (1 Agent) |
| `agents/extended/database/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P6 | ✅ M1完成 (1 Agent) |
| `agents/extended/network/` | ECC | `ECC/agents/` 子集 | on-demand | P4,P6 | ✅ M1完成 (1 Agent) |
| `agents/extended/performance/` | ECC | `ECC/agents/` 子集 | on-demand | P6 | ✅ M1完成 (1 Agent) |

> 核心Agent 7个 + 扩展Agent 21个 = 28个Agent，全部 M1 完成

---

## 四、skills/ (技能库)

| DevFlow 路径 | 来源 | 原始路径 | 备注 |
|---------------|------|---------|------|
| `skills/workflow/` | DevFlow | `devflow/skills/` | 完整复制 |
| `skills/engineering/` | DevFlow | `devflow/agent-skills/skills/` | 完整复制 |
| `skills/specialized/` | ECC | `ECC/skills/` 子集 | ✅ M3完成 — 6个安全Skill(security-review/scan/bounty-hunter, canary-watch, deployment-patterns, production-audit) |

---

## 五、hooks/ (Hook 适配)

| DevFlow 路径 | 来源 | 原始路径 | 备注 |
|---------------|------|---------|------|
| `hooks/hooks.json` | ECC改编 | `ECC/hooks/hooks.json` 精选 | 仅6个Hook，✅ M2完成 |
| `hooks/scripts/format-typecheck.js` | ECC | `ECC/scripts/hooks/stop-format-typecheck.js` | M2复制 |
| `hooks/scripts/console-log-check.js` | ECC | `ECC/scripts/hooks/check-console-log.js` | M2复制 |
| `hooks/scripts/security-scan.js` | ECC | `ECC/scripts/hooks/insaits-security-wrapper.js` | M2复制 |
| `hooks/scripts/context-monitor.js` | ECC | `ECC/scripts/hooks/ecc-context-monitor.js` | M2复制 |
| `hooks/scripts/compact-suggest.js` | ECC | `ECC/scripts/hooks/suggest-compact.js` | M2复制 |
| `hooks/scripts/cost-tracker.js` | ECC | `ECC/scripts/hooks/cost-tracker.js` | M2复制 |
| `hooks/checklist-fallback.md` | 新增 | — | 无运行时降级清单，✅ M2完成 |
| `hooks/lib/utils.js` | ECC | `ECC/scripts/lib/utils.js` | Hook共享工具库，M2补充 |
| `hooks/lib/session-bridge.js` | ECC | `ECC/scripts/lib/session-bridge.js` | 会话桥接库，M2补充 |
| `hooks/lib/resolve-formatter.js` | ECC | `ECC/scripts/lib/resolve-formatter.js` | 格式化器解析库，M2补充 |
| `hooks/lib/package-manager.js` | ECC | `ECC/scripts/lib/package-manager.js` | 包管理器检测库，M2补充 |
| `layers/L2-ENGINE/gate-hook-bridge/_SKILL.md` | 新增 | — | Gate-Hook协同桥接技能，✅ M2完成 |

---

## 六、rules/ (语言规则)

| DevFlow 路径 | 来源 | 原始路径 | 备注 |
|---------------|------|---------|------|
| `rules/common/` | ECC | `ECC/rules/common/` | ✅ M3完成 — 10个通用规则文件 |
| `rules/python/` | ECC | `ECC/rules/python/` | ✅ M3完成 — 6个Python规则文件(含fastapi) |
| `rules/typescript/` | ECC | `ECC/rules/typescript/` | ✅ M3完成 — 5个TypeScript规则文件 |

---

## 七、adapters/ (跨环境适配)

| DevFlow 路径 | 来源 | 备注 |
|---------------|------|------|
| `adapters/claude-code/` | ECC改编 | M5/M7完成，hooks.json+规则 |
| `adapters/cursor/` | ECC改编 | M7完成，规则映射 |
| `adapters/codex/` | ECC改编 | M7完成，agents.toml |
| `adapters/universal/` | DevFlow | M0创建基线，纯Markdown |

---

## 八、references/ (参考规范)

| DevFlow 路径 | 来源 | 原始路径 |
|---------------|------|---------|
| `references/` | DevFlow | `devflow/references/` 完整复制 |

---

## 九、memory/ (记忆系统)

| DevFlow 路径 | 来源 | 原始路径 |
|---------------|------|---------|
| `memory/` | DevFlow | `devflow/memory/` 完整复制 |

---

## 十、docs/ (融合文档)

| DevFlow 路径 | 来源 | 备注 |
|---------------|------|------|
| `docs/MERGE-MAP.md` | 新增 | 本文件 |
| `docs/AGENT-PHASE-MAP.md` | 新增 | ✅ M1完成 — 完整映射表+Token预算+技术栈检测 |
| `docs/TECH-STACK-DETECT.md` | 新增 | ✅ M3完成 — 技术栈检测指令(文件指纹+框架识别+加载决策) |
| `docs/DUAL-EVOLUTION.md` | 新增 | ✅ M4完成 — 双通道自进化(LESSONS+Agent-Eval融合) |
| `docs/ARCHITECTURE.md` | 新增 | ✅ M6完成 — 架构文档(三层+Gate-Hook+Agent+自进化) |
| `docs/CHANGELOG.md` | 新增 | ✅ M6完成 — 变更日志 |
| `docs/TOKEN-BUDGET.md` | 新增 | M4完成(暂缺，由AGENT-PHASE-MAP覆盖) |

---

## 融合统计

| 来源 | 文件数/目录数 | 备注 |
|------|-------------|------|
| DevFlow 完整复制 | ~320 md | layers/, skills/, references/, memory/ |
| ECC 精选复制 | ~70 md | 7核心Agent + 33扩展Agent + 6安全Skill + 21语言规则 + 10 Hook/lib |
| 融合新增 | ~12 md | SKILL.md, MERGE-MAP, AGENT-PHASE-MAP, TECH-STACK-DETECT, DUAL-EVOLUTION, ARCHITECTURE, CHANGELOG, gate-hook-bridge, checklist-fallback, README, hooks.json, adapters |
| **总计** | ~348 | 基线大小估算 ~25MB (DevFlow 18MB + ECC精选 5MB + 新增 2MB) |

> M1 完成后统计：7核心Agent + 21扩展Agent = 28个Agent，9个Phase增强段落，1个AGENT-PHASE-MAP