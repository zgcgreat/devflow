# ForgeOS v3.2.2 深度审计报告

> 审计日期: 2026-08-29
> 审计范围: 全项目（443 个 md + 203 个 js，排除 sources/ 外部副本）
> 审计方法: 源码通读 + 实跑测试 + 脚本化断裂引用扫描（自写 linkcheck，双基准解析）
> 结论: **架构设计正确，但存在 5 处致命实现缺陷 + 6 处假测试；16/16 测试通过率不具备质量保证能力**

---

## 〇、结论先行

| 维度 | 评级 | 说明 |
|------|------|------|
| 架构设计 | 🟢 良好 | 三层 + Phase/Gate 状态机设计自洽，单源派生（gate-check ← phase-engine）是正确的架构决策 |
| 逻辑正确性 | 🔴 有致命缺陷 | 5 处会导致功能不工作或门控被绕过 |
| 描述清晰度 | 🟡 中等 | 三套命名体系并存，6 个 Phase 引用了不存在的文档 |
| 测试有效性 | 🔴 失效 | 16/16 通过，但其中 5 项是文本 grep 或恒真断言 |
| 仓库卫生 | 🟡 中等 | 数量声明属实，品牌残留已清理，但有外部副本与临时目录 |

---

## 一、致命问题（功能不工作 / 门控可绕过）

### F1. `checkGate()` 相位映射错误 + 静默放行 🔴

`adapters/shared/core-bridge.js:76`

```js
const requiredGate = `G${targetPhase}`;   // 字符串拼接出 gate id
const rule = gateRules[requiredGate];
if (!rule) return { passed: true, missingArtifacts: [], reason: 'No gate rule defined' };  // :79 零校验放行
```

Phase id 与 Gate id **不是**简单的 `G` + 数字关系，拼接必然出错：

| targetPhase | 拼出的 gate | 实际应为 | 后果 |
|---|---|---|---|
| 0 | G0 | G0 | ✅ 碰巧正确 |
| 1 | G1 | G1 + G2 | ⚠️ 漏检 G2 |
| **1.5** | **"G1.5"** | **G2.5** | 🔴 **规则不存在 → 直接 `passed:true`，零校验放行** |
| 2 | G2 | G3 | 🔴 校验了 Phase 1 的门 |
| 2.5 | "G2.5" | G3.5 | 🔴 校验了 Phase 1b 的门 |
| 3 | G3 | G4 | 🔴 校验了 Phase 2 的门 |
| 4~6 | G4~G6 | G5~G7 | 🔴 全部错位一位 |
| **7** | **G7** | **G7.5** | 🔴 校验了 Phase 6 的门 |
| 8 | G8 | G8 | ✅ 碰巧正确 |

**影响面**：`adapters/` 是 7 个 IDE 集成层（claude-code / cursor / copilot / gemini-cli / codex / universal / shared）的公共门控入口。这意味着 **AI 在这些 IDE 里跑 ForgeOS 时，除 Phase 0/8 外的所有门控都在校验错误的门**，Phase 1.5 更是完全不设防。

**修复**：改为按 `phaseAfter` 反查，而非字符串拼接：
```js
const gate = GATES.filter(g => g.phaseAfter === targetPhase);
if (!gate.length) return { passed: false, reason: `未知 Phase: ${targetPhase}` };
```

---

### F2. `--phase` 是死参数 🔴

`lib/phase-engine.js`：

- `:8` 用法注释公开宣称：`node lib/phase-engine.js --phase 0 --mode standard`
- `:301` `parseArgs()` 确实解析了：`if (args[i] === '--phase') opts.phase = parseFloat(args[++i]);`
- `:318–372` `main()` 中 **无任何 `opts.phase` 分支**

按文档调用 `node lib/phase-engine.js --phase 0 --mode standard`，实际行为是：命中 `:343` 的 `opts.mode` 分支 → `setMode()` → **重置 currentPhase**（`:127-128` startPhaseMap）→ 打印"模式设为 STANDARD，从 Phase 0 开始"。用户以为自己切换到了 Phase 0，实际是被 setMode 副作用带到了起点。`--phase` 完全无效。

**修复**：补 `opts.phase` 分支，或删除 `:8` 与 `:301` 的声明。

---

### F3. 模式自动判定 `detectMode()` 完全不存在 🔴

SKILL.md:52-55 与 GO.md:119-123 都明确定义了四档阈值：

| 模式 | SKILL.md 阈值 | GO.md 阈值 |
|------|---|---|
| Fast | ≤2 文件, <50 行 | ≤2 文件, <50 行, 低风险, 需求明确 |
| Lean | ≤5 文件, <300 行 | ≤5 文件, <300 行, brownfield 明确需求 |
| Standard | ≤10 文件, <500 行 | ≤10 文件, <500 行, 常规 feature |
| Strict | >3 模块 / 架构变更 | 高风险 / 架构变更 / 数据模型变更 |

**全项目 grep `detectMode` / `detect-mode`：0 命中。**

后果：SKILL.md 的 `[R2] 按模式匹配 Phase 路径` 与 GO.md 的 `Step 0.5 模式预判定` 都要求 AI "评估文件数与行数来判定模式"，但没有任何代码提供这个能力。模式只能靠用户手工 `setMode()` 或 `forge-os init --mode`。**文档承诺了一个未实现的能力。**

**修复**：二选一 —— (a) 实现 `detectMode(files, lines, risk)` 并对外暴露；(b) 把文档改为"模式由用户显式指定"，删除阈值表格。当前状态是"文档说有、代码没有"，是典型的描述与实现脱节。

---

### F4. 产物目录约定分裂，导致门控必然 FAIL 🔴

三套互相矛盾的约定同时存在：

| 出处 | 约定 |
|------|------|
| `GO.md:6` | **"所有产物必须保存到 `.forgeos/<req-id>/` 下"** |
| `phase-4-build/_SKILL.md:47`、`phase-5-test/_SKILL.md:29`、`phase-6-review/reviewer/_SKILL.md:277-329`、`phase-8-archive/_SKILL.md:47`、`L2-ENGINE/executor/_SKILL.md`（20+ 处） | 写 `.specs/waves/`、`.specs/tasks/`、`.specs/test/` |
| `forge-os init`（`bin/forge-os.js:50-85`） | 只创建 `.forgeos/memory/` + `.forgeos/outputs/`，**从不创建 `.specs/`** |

而两个 gate checker 查的目录还不一样：

- `domains/hooks/gate-check.js:73-83` `findArtifact()` —— 只查 `.forgeos/` 根 + 一层子目录
- `adapters/shared/gate-checker.js:55-58` —— 查 `.specs/`、`.specs/test/`、`.specs/reviews/`、`.specs/waves/`

**故障链**：AI 严格按 Phase 4/5/6/8 的 _SKILL.md 执行 → 产物写进 `.specs/` → `gate-check.js` 在 `.forgeos/` 下找不到 → **门控永远 FAIL** → 管线卡死。反过来若写进 `.forgeos/`，则 adapters 层 checker 找不到。

**修复**：统一为 `.forgeos/`，把 `adapters/shared/gate-checker.js` 的候选路径改为 `.forgeos/<req-id>/`，并把所有 `.specs/` 引用批量替换（仅 13 个文件）。

---

### F5. Phase 0 有两个目录，引擎只有一个 🔴

```
layers/L1-INTERACTION/phase-0-strategy/_SKILL.md      (87 行) phase: 0, gate: G0
layers/L1-INTERACTION/phase-0-yc-strategy/_SKILL.md   (89 行) phase: 0, gate: G0
```

- 两者 frontmatter 都声明 `phase: 0` 和 `gate: G0`
- `phase-0-yc-strategy` 声明 `dependencies: [phase-0-strategy]` —— 概念上是**串联**的两步
- 但 `lib/phase-engine.js:43` 只有**一个** Phase 0，名字是 `'YC六问战略评估'`
- `SKILL.md:108-109` 把它们列为**两行**（"0 Strategy" 与 "0-yc YC六问"）
- `GO.md:72` 说 "Phase 0: YC六问"
- `layers/L1-INTERACTION/README.md:12` 说 `phase-0-yc-strategy/  # YC六问战略评估 ⭐v3入口`

**歧义**：AI 加载 Phase 0 时该读哪个？是两个子步骤还是一个 Phase？引擎没有 Phase 0.5，无法表达"两步"。

**修复**：明确二选一 —— 若是一个 Phase，删除或合并其中一个目录；若是两步，在 PHASES 中补一条（如 id 0.5），并让 gate 体系能表达。

---

## 二、逻辑瑕疵

### L1. `currentGateClosed()` 用 `find` 导致 G2 漏检（**当前无影响，属潜伏地雷**）

`lib/phase-engine.js:210`

```js
const gatePhaseAfter = GATES.find(g => g.phaseAfter === phase.id);
```

Phase 1 同时挂 G1（`:81`）与 G2（`:82`），`find` 只返回首个 → G2 永不被检查。

**但**：经 grep 确认 `currentGateClosed()` **在全项目无任何调用点**，是死代码；且 `domains/hooks/gate-check.js` 用 `GATES.forEach()` 遍历全部 12 门，G2 覆盖正常。

**结论**：当前无实际危害，但一旦有人启用这个函数就会踩坑。建议改 `filter` + 遍历，或删除死代码。

### L2. `hasPendingManualGates()` 与模式无关 → 恒定误报

`:218-223` 遍历**全部** 12 个门，不按当前模式过滤。Lean 模式下 Phase 7 被跳过，G7.5 永远不可能通过 → `status().pendingManualGate` 恒报 G2，是噪音。

### L3. 模式为 null 时两套分支不一致

- `nextPhase():161` 直取 `this.state.mode`（null → `canSkip` 全 false → 走 **11 个** Phase 的 strict 路径）
- `activePhases():194` 与 `status()` 默认 `'standard'`（**10 个** Phase）

未 `init` 就 `--next`，进度分母（status 算 10）与导航序列（nextPhase 走 11）错位。

### L4. 测试污染用户真实状态

`test/all.js` 中 `new PhaseEngine()` 以 `process.cwd()` 为工作区，`setMode()` 触发 `_saveState()`（`:129`）→ **覆写用户真实的 `.forgeos/state.json`**。跑一次测试，正在进行的管线被重置为 fast/Phase 4。

**修复**：测试改用临时目录（构造时注入 workspace 参数，或 `process.chdir(tmpdir)`）。

### L5. `phase` 命令未列入 HELP

`bin/forge-os.js:115` 实现了 `phase`，`docs/cli-reference.md:16` 有文档，但 `:28-47` 的 HELP 文本**遗漏**（HELP 列了 11 条，CMDS 有 12 条）。用户 `forge-os help` 看不到这个命令。

---

## 三、测试有效性 —— 16/16 的含金量

实跑结果：`16 通过, 0 失败`。但逐项检查后，**至少 5 项不具备守卫能力**：

| 测试名 | 行号 | 实际断言 | 问题 |
|---|---|---|---|
| 宪法完整性 — **8 条规则** | `:96-104` | `count >= 7` | CONSTITUTION.md 实际有 **12** 条（`## 1`–`## 12`）。断言恒真，标题还写错了数字 |
| 门控完整性 — G0-G8 | `:110` | detail 输出 "11 个门控" | 实际 12 门（G2 走 extraGates），口径不一致 |
| PhaseEngine — 门控顺序一致 | `:120-135` | `expectedSequence` 显式**省略 G2** | 正则只抽 `gate:` 不抽 `extraGates`，G2 结构性不可见；注释自认"G2 is extraGates on Phase 1" |
| CLI 集成 — `--help` **可执行** | `:149-152` | `forgeOS.includes('init')` | 名为"可执行"，实为**源码文本 grep**，从不 spawn CLI |
| install.js 存在且**可解析** | `:192-193` | `includes('TARGETS') && includes('parseArgs')` | 同样是文本匹配，非真正 require 解析 |

### doctor 的 10 项检查全是 `existsSync`

`bin/forge-os.js:275-286` —— 10 项检查**全部**只验证文件是否存在，不验证可加载/可执行/内容正确。

更糟的是 `:287`：

```js
checks.forEach(c => console.log(`  ${c.check() ? 'OK' : '  '} ${c.name}`));
```

失败时渲染为**两个空格**，与 `OK` **等宽** → 失败项在终端上看起来像缩进空白，**极易误读为全部通过**。应改为 `❌ FAIL`。

---

## 四、描述清晰度问题

### N1. 三套 Phase 命名体系并存

| 引擎 id | 文档名 | 目录名 | docs 文件名 |
|---|---|---|---|
| 0 | 0 / 0-yc | phase-0-strategy **+** phase-0-yc-strategy | phase-0-strategy.md |
| 1 | 1 | phase-1-5whys | phase-1-analysis.md |
| 1.5 | 1b | phase-1b-discuss | （无） |
| 2 | 2 | phase-2-design | phase-2-design.md |
| 2.5 | 2a | phase-2a-shotgun | （无） |
| 3 | 3 | phase-3-task-plan | phase-3-**tasks**.md |
| 4-7 | 4-7 | phase-N-* | phase-N-*.md |
| 8 | 8 | phase-8-archive | （合并在 phase-7-canary-archive.md） |

SKILL.md:113 自己加了注 `docs/phases/phase-3-tasks.md (原名 phase-3-task-plan)` —— 说明作者知道对不上，但选择在文档里打补丁而非统一命名。

### N2. 产物名不一致

`phase-5-test/_SKILL.md:29` 声明后置产物为 `.specs/test/05-test-results.md`，而 `phase-engine.js:62` 定义 `output: '05-test-report.md'`。**同一产物两个名字**。

### N3. 6 个 Phase 引用了不存在的文档

见第六节断裂引用清单 N20-N26。

---

## 五、已验证正确（确认真实可用）

这部分是项目的**真正价值**所在，架构决策是对的：

- ✅ **状态机四模式路径全覆盖**：fast `[4,5,6]` / lean `[2,4,5,6,8]` / standard `[0,1,1.5,2,2.5,4,5,6,7,8]` / strict 全 11 项，`test/all.js:276-279` 用硬断言守护，无 null、无越界、无跳到不存在的 id
- ✅ **门控护卫方向正确**：`_verifyCurrentGate()` `:143-158` 取 `phase.gate + extraGates`，`filter(gid => !this.state.gates[gid])` 判空为通过；`:165` `if (!force)` 绕过逻辑**未写反**
- ✅ **产物先于声称真实生效**：`outputWritten()` `:229-231` 先 `fs.existsSync` 抛错，`:232-233` 才 `gatePassed()`，顺序正确（CONSTITUTION 原则 #2 落地）
- ✅ **单源派生架构干净**：`gate-check.js:20` require phase-engine，`:26-39` `buildGateMap()` 由 GATES+PHASES 派生并正确处理 `extraGates`，从根源消除了历史双源漂移；`:122` `require.main === module` 隔离 CLI
- ✅ **数量声明属实**：L2-ENGINE **32** 个、L3-ARCHITECTURE **18** 个、personas core **8** / extended **12** / cavecrew **3**、references/templates **26** 个 —— 与文档声明完全一致
- ✅ **品牌统一彻底**：`.forgeos/` 约定已全面落地；非 `docs/` 目录的品牌残留为 **0**；`.devflow/` 仅剩 `FULL-AUDIT-REPORT.md` 历史快照
- ✅ **L2/L3 无空壳**：全部模块 `_SKILL.md` 均 ≥30 行，无占位符
- ✅ **package.json bin 双入口正确**（`forge-os` / `forgeos` → `bin/forge-os.js`）

---

## 六、断裂引用清单（核心文件，已排除运行时/历史/外部副本）

全量扫描：443 个 md，原始命中 536 处，经「文件相对 + 根相对」双基准去重后 377 处，再排除 `.forgeos/`、`.claude/`、`.github/`、`.gemini/` 等运行时路径与 `docs/CHANGELOG`、`AUDIT-REPORT`、`MERGE-MAP` 等历史记录后，**核心文件真实断裂如下**：

| 引用位置 | 指向 | 问题 |
|---|---|---|
| `phase-0-yc-strategy/_SKILL.md:48` | `docs/phases/phase-0-yc-strategy.md` | 不存在 |
| `phase-0-yc-strategy/orchestrator/_SKILL.md:50` | 同上 | 不存在 |
| `phase-1-5whys/_SKILL.md:51` | `docs/phases/phase-1-5whys.md` | 实际名 `phase-1-analysis.md` |
| `phase-1b-discuss/_SKILL.md:44` | `docs/phases/phase-1b-discuss.md` | 不存在 |
| `phase-2-design/researcher/_SKILL.md:31` | `docs/phases/phase-2-researcher.md` | 不存在 |
| `phase-2a-shotgun/_SKILL.md:45` | `docs/phases/phase-2a-shotgun.md` | 不存在 |
| `phase-3-task-plan/_SKILL.md:45` | `docs/phases/phase-3-task-plan.md` | 实际名 `phase-3-tasks.md` |
| `phase-8-archive/_SKILL.md:59` | `docs/phases/phase-8-archive.md` | 不存在（合并在 phase-7-canary-archive.md） |
| `phase-8-archive/memory-keeper/_SKILL.md:41` | 同上 | 不存在 |
| `phase-5-test/_SKILL.md:29` | `.specs/test/05-test-results.md` | 目录约定错误（见 F4） |
| `adapters/README.md:110-112` | `hooks/session-start.js` / `statusline.js` / `user-prompt.js` | `hooks/` 下只有 `lib/` 与 `scripts/` |
| `adapters/universal/README.md:50`、`docs/ARCHITECTURE.md:85` | `hooks/checklist-fallback.md` | 实际在 `hooks/checklist-fallback.md`… 路径不一致 |
| `FUSION-PLAN.md:71,72,99` | `docs/behavior-rules.md` / `runtimes.md` / `gate-unification.md` | 规划文档，三个文件均未落地 |
| `docs/phases/phase-1-analysis.md:195` | `docs/SDD-INTEGRATION.md` | 不存在 |
| `L3-ARCHITECTURE/dedup-cleanup/_SKILL.md:46-50` | `flow-kit-reference/*` | 旧目录名残留 |
| `references/templates/*`、`skills/engineering/*` | `references/security-checklist.md` 等 | 6 处引用不存在的 checklist |

> 说明：`skills/engineering/**` 与 `skills/workflow/**` 中的大量断裂（如 `agent-skills/skills/...`、`reference/finance.md`）源自外部项目副本的示例文本，非 ForgeOS 本体缺陷。

---

## 七、仓库卫生

| 项 | 实测 | 评价 |
|---|---|---|
| `sources/` 外部副本 | 17 个项目、258 文件、**2.9M** | 占全仓 9.2M 的 **31%**。多为部分摘抄（ECC 1.7M、superpowers 413K）。建议移出或标注为 reference |
| L1 层混入外部副本 | `gsd-workflows` **420K**、`superpowers-skills` **52K** | 🔴 二者位于 `layers/L1-INTERACTION/` 下却**无 `_SKILL.md`**，不属于 Phase 体系，污染层级语义 |
| 临时目录 | `_e2e` `_e2e_test` `_e2e2` `_proj` `_verify` `_verify_fast` 共 45 文件 / 62K | 已被 `.gitignore` 覆盖，但未从工作树删除 |
| 品牌残留 | 非 docs 区域 **0** 处 | ✅ 干净。docs 中的 FlowForge/DevFlow 均为 CHANGELOG / MERGE-MAP 的历史溯源记录，合理 |

---

## 八、修复优先级建议

### P0（阻塞正确性，必须修）
1. **F1** `core-bridge.js:76` 改用 `phaseAfter` 反查，堵住 Phase 1.5 零校验放行
2. **F4** 统一产物目录为 `.forgeos/`，替换 13 个文件中的 `.specs/`，并同步 `adapters/shared/gate-checker.js` 的候选路径
3. **F2** 补 `opts.phase` 分支或删除 `:8`/`:301` 的虚假声明
4. **F3** 实现 `detectMode()` 或把文档改为"模式需显式指定"

### P1（消除误导）
5. **F5** 二选一统一 Phase 0
6. 修复 3.2 节 5 项假测试：宪法测试改为断言 12 条、CLI 测试改为真实 spawn 子进程、门控序列测试纳入 `extraGates`
7. `bin/forge-os.js:287` doctor 失败渲染改为 `❌ FAIL`（当前是等宽空格，形同通过）
8. 补 16 处核心断裂引用

### P2（健壮性与卫生）
9. **L4** 测试改用临时目录，停止污染 `.forgeos/state.json`
10. **L2** `hasPendingManualGates()` 按模式过滤
11. **L1** `currentGateClosed()` 改 `filter` 或删除死代码
12. **L5** HELP 文本补 `phase` 命令
13. 将 `layers/L1-INTERACTION/gsd-workflows` + `superpowers-skills` 移到 `sources/`
14. 从工作树删除 6 个临时目录

---

## 附：审计方法

1. 通读 `SKILL.md`、`GO.md`、`lib/phase-engine.js`、`bin/forge-os.js`、`domains/hooks/gate-check.js`、`adapters/shared/core-bridge.js`
2. 实跑 `node test/all.js`（16/16 通过，但逐项核查断言有效性）
3. 自写 linkcheck 脚本扫描 443 个 md：正则同时匹配 `[x](path)` 与反引号路径，采用「文件相对 + 根相对」双基准解析，仅当两者都失败才判定断裂（避免根相对路径被误判）
4. grep 校验：`detectMode` 全项目命中数、品牌残留分类统计、`.specs/` vs `.forgeos/` 引用分布
5. `du` / `find` 统计 sources 与临时目录体积占比

---

## 九、修复执行状态（2026-08-29 已全量落地）

> 全部 P0/P1/P2 已修复并经回归验证。测试由 16/16（含 5 项假测试）→ **21/21 真实通过**。

| 编号 | 修复项 | 改动文件 | 验证 |
|------|--------|----------|------|
| F1 | `checkGate()` 改用 `phaseAfter` 反查（`getGateByPhaseAfter`），堵住 Phase 1.5 零校验放行与全相位错位 | `adapters/shared/core-bridge.js` | 11 相位映射全对；Phase 1.5 由"静默放行"→"正确阻断" |
| F4 | 产物目录统一 `.specs/`→`.forgeos/`（13 文件批量替换）；`gate-checker.js` 候选路径改为 `.forgeos/` 并支持 `<req-id>/` 子目录；修正 `05-test-results.md`→`05-test-report.md` 命名 | `adapters/shared/gate-checker.js`、`adapters/shared/core-bridge.js`、`domains/hooks/gate-check.js`、12 个 `_SKILL.md` | 两个 checker 对三层深度产物一致；`.specs/` 活代码残留 = 0 |
| F2 | `phase-engine.js` main() 补 `opts.phase` 分支，让 `--phase` 真正生效 | `lib/phase-engine.js` | `--phase 8` 正确跳到 Phase 8 |
| F3 | 实现 `detectMode()`（四档阈值与 SKILL.md/GO.md 对齐）+ 导出 `MODE_THRESHOLDS` + CLI `--detect-mode` | `lib/phase-engine.js` | fast/lean/standard/strict 阈值实测正确 |
| F5 | 明确 Phase 0 为单一 Phase（`phase-0-yc-strategy` 标注为 v3 战略入口别名，非独立 Phase）；同步 SKILL.md / L1-README / GO.md | `phase-0-yc-strategy/_SKILL.md`、`SKILL.md`、`GO.md`、`layers/L1-INTERACTION/README.md` | 命名歧义消除 |
| 假测试 | 宪法断言 12 条、CLI 改为真实 `child_process.spawn`、门控序列纳入 `extraGates`、install 改真实 require、doctor 失败渲染 `❌ FAIL` | `test/all.js`、`bin/forge-os.js` | 5 项假测试全部转为有效断言 |
| 断裂引用 | 16 处核心断裂修复：Phase 文档重定向到已存在文件、skills 路径 `agent-skills/skills/*`→`skills/engineering/*`、hooks/README 旧脚本描述改为历史迁移说明、根相对路径补 `.forgeos/` 前缀、L2/L3 内部引用加 `layers/` 前缀 | 16 个 md | 真实断裂 70→22（残留均为命令示例与外部副本引用，合理） |
| L4 | `PhaseEngine` 构造支持注入 `workspace` 参数；测试改临时目录，停止污染真实 `.forgeos/state.json` | `lib/phase-engine.js`、`test/all.js` | 实跑后项目根 `.forgeos/` 未被创建 |
| L2 | `hasPendingManualGates()` 按模式过滤（仅报本模式跳过后仍待确认的人工门） | `lib/phase-engine.js` | fast→G5 / lean→G3 / standard·strict→G2 正确 |
| L1 | `currentGateClosed()` 改 `filter` 遍历全部后续门，消除 G2 漏检地雷 | `lib/phase-engine.js` | 死代码活性化且正确 |
| L3 | `state.mode` 统一归一为 `this.mode`；未初始化时两分支一致 | `lib/phase-engine.js` | 模式 null 时分母/序列对齐 |
| L5 | HELP 文本补 `phase` 命令 | `bin/forge-os.js` | `forge-os help` 显示 12 条命令 |
| 仓库卫生 | `layers/L1-INTERACTION/gsd-workflows` + `superpowers-skills` 移入 `sources/`，同步 3 处引用；删除 6 个临时目录 | `sources/`、`domains/execution/_SKILL.md`、`references/RULES-v3.md`、`references/templates/README.md` | L1 层无外部副本；临时目录清零 |
| 文档门控 | GO.md Phase 表门控编号修正（Phase 0=G0、Phase 5=G6 等），新增回归测试守护文档与引擎一致 | `GO.md`、`test/all.js` | 21/21 含文档一致性断言 |

**回归结果**：`node test/all.js` → **21 通过 / 0 失败**；`node bin/forge-os.js doctor` 输出干净无横幅污染；`node bin/forge-os.js code` 仍可用（修复了 `code-explorer.js` 缺失的 `require.main` 守卫）。

**未提交**：工作树已修改（63 modified + 29 renamed + 1 untracked 审计报告），尚未 commit。如需要可一键提交。
