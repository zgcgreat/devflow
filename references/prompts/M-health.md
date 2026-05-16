# 横向命令 · M-health — 代码库health-check
> ⚠️ **进入本阶段前，必须先加载**：`devflow-kit/agent-skills/skills/code-quality/_SKILL.md`、`devflow-kit/agent-skills/skills/security-and-performance/_SKILL.md`

> **可选工具依赖**：步骤 2.5 冗余巡检需要以下工具（未安装时使用内置回退）：
> - [brooks-lint](https://github.com/hyhmrright/brooks-lint) — 健康仪表板 + 6 维诊断
> - [jscpd](https://github.com/kucherenko/jscpd) — 重复代码检测
> - [knip](https://github.com/webpro/knip) — JS/TS 未用导出/依赖
> - [vulture](https://github.com/jendrikseipp/vulture) — Python 死代码
> - [staticcheck](https://staticcheck.io/) — Go 死代码/未用

> **触发方式**：`@devflow-kit/references/GO.md` + `健康检查 / health / 体检 / 技术债扫描 / 巡检`
> 不属于任何 req，不写 00-requirements.md / 01-analysis.md。直接产出健康报告。

## 角色

Maintenance Engineer。**只产健康报告 + 改造建议清单，不直接改代码**。

## 触发场景

- **周期性**：每月 / 每季度跑一次（建议放进 cron / GitHub Actions）
- **里程碑前**：版本发布前 / 季度复盘 / 年终总结
- **接手陌生项目**：第一周必跑，了解整体健康度
- **重构决策**：决定要不要重构某模块前，先体检

## 输入

- 仓库根（不限单一 req）
- `@.devflow-kit/CONTEXT.md`（含技术栈 + 团队偏好）
- `@.devflow-kit/lessons-learned.md`（已记录的失败教训）
- 最近 N 次的 `archive/<date>-<name>/` 归档（看历史趋势）
- 当前 git log 最近 30 天

## 你的职责

### 步骤 1 · 选模式（按场景）

| 场景 | 推荐命令 | 输出深度 |
|---|---|---|
| 快速体检（5~10 分钟）| `/brooks-health` | 4 维仪表板 + 综合分（0-100） |
| 完整审计（30 分钟+）| `/brooks-sweep` | 6 维 + 6 测试维度 + 架构图 + 技术债 + 自动修复安全项 |
| 单维深挖 | `/brooks-audit` 或 `/brooks-debt` 或 `/brooks-test` | 单维度详细报告 |

**选择优先级**：
- 第一次跑 → `/brooks-sweep`（一次拿全貌）
- 周期性 → `/brooks-health`（轻量 · 看趋势）
- 拿到 health 报告后想深挖 → 对应单维命令

### 步骤 2 · 装了 brooks-lint

```
/brooks-sweep            # 全面扫
```

或：

```
/brooks-health           # 健康仪表板
```

工具会输出：
- **综合健康分（0-100）** — 与上次对比
- **6 维生产代码风险** — 每维 🔴/🟡/🟢 数量分布
- **6 维测试代码风险** — 同上
- **架构 Mermaid 图** — 红/黄/绿色码 + 循环依赖
- **技术债优先级矩阵** — Pain × Spread

把工具输出**原样**贴入 `.devflow-kit/health/<YYYY-MM-DD>-HEALTH.md`。

### 步骤 2.5 · 冗余巡检（brooks-lint 没覆盖的维度 · 装/未装都要跑）

**为什么单独一步**：brooks-lint 的 R3 Knowledge Duplication 是**概念级**（同决策多处表达），靠 AI 读 diff 定性判断。本步补 4 个**字面级 + 死代码级**维度：重复代码块 / 死代码 / 未用导出 / 未用依赖。两者互补。

#### 2.5.1 语言检测

读 `.devflow-kit/CONTEXT.md`「技术栈」段 + 扫清单文件定主语言：

| 清单文件 | 语言 |
|---|---|
| `package.json` | JavaScript / TypeScript |
| `pyproject.toml` / `requirements.txt` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `pom.xml` / `build.gradle` | Java / Kotlin |
| `composer.json` | PHP |
| `Gemfile` | Ruby |

多语言仓库逐个扫。

#### 2.5.2 调工具（首选）

| 维度 | 全语言 | TS/JS | Python | Go | Rust |
|---|---|---|---|---|---|
| 字面重复块 | `npx jscpd src/` | 同左 | 同左 | 同左 | 同左 |
| 未用导出 / 孤立文件 | — | `npx knip` 或 `npx ts-prune` | `vulture src/` | `deadcode ./...` | `cargo +nightly udeps` |
| 未用依赖 | — | `npx depcheck` | `deptry` | `go mod tidy -v` (diff) | `cargo udeps` |
| 死代码 / 不可达 | — | ESLint `no-unreachable` | `vulture` | `staticcheck -checks U1000` | `cargo clippy -- -W dead_code` |

**执行策略**：

1. **优先 `jscpd`**（全语言 · 5 分钟出结果）：`npx jscpd src/ --min-lines 5 --min-tokens 50 --reporters json --output .devflow-kit/health/tmp/`
2. **再跑语言原生工具**（按上表任选 1-2 个）
3. 工具未装 → 提示用户：`ℹ️ 需要跑《<cmd>》，是否授权自动 npx / pip install？`（2 次拒绝 → 进 2.5.3）

#### 2.5.3 Fallback：AI grep 抓样（精度低，明标）

用户不肯装工具的退路：

- **重复块**：抽样 10 个最近改动的源文件，对每个文件抓的 ≥ 5 行连续逻辑块，用 `grep_search FixedStrings=true` 查同仓内其他出现
- **未用导出**：`grep_search Query="^export "` 拼符号后，反向查每个名字在其他文件中的引用数，0 次就是候选
- **死代码**：只抽检、判定明显的卡 bug（如 `if false` / `return` 后的语句 / 永负分支）
- **未用依赖**：按主语言的清单文件逐条 grep 引用次数（0 次为候选）

在报告里显示标记：`⚠️ 内置 fallback 检测 · 精度低 · 漏报率高 · 建议下次装 jscpd / knip / vulture / staticcheck 拿标准结果`。

#### 2.5.4 严重度分级

| 分类 | 标准 |
|---|---|
| 🔴 **Critical** | ≥ 20 行重复块出现在 ≥ 3 处 · 被跨模块调用的公共导出无引用 · 死分支导致业务规则静默失效（参考 `regression-demos/brooks-lint-paths.md` R6 案例）|
| 🟡 **Major** | 5-19 行重复块 · 明显未使用的 public export · `package.json` / `pyproject.toml` 顶层未用依赖 |
| 🟢 **Minor** | < 5 行重复 · 未使用的内部辅助函数 · 注释掉的死代码 · 孤立文档 |

#### 2.5.5 边界（避免误报）

- **测试文件不算未用**：`*.test.ts` / `*_test.go` / `tests/` 里的导出在源代码里无引用是正常的
- **公共 API 导出需人工确认**：lib / SDK 项目的 `index.ts` / `__init__.py` 导出供外部用，表面看似"未用"。标 🟡候选 + 注"需确认是公共 API"，不自动列 Critical
- **跨模块"重复块"常见假阳性**：模板化 CRUD / 单测 setup 常长得类似，如果背后语义不同 → 不算冷败，留 🟢提示
- **与 6-review R3 协作**：本步是字面级 + 死代码级；6-review R3 是概念级（决策多处表达）。**两者不互代替**

### 步骤 3 · 未装 brooks-lint（内置回退）

AI 自己按 6+6 维度过一遍主仓库的 `src/` / `lib/` / `app/` 目录（按项目结构选）：

#### 3.1 生产代码 6 维抽样

随机抽 5 个最近改动频繁的模块（用 `git log --pretty=format: --name-only | sort | uniq -c | sort -rn | head -5`），每个按 6 维（R1~R6，见 `@devflow-kit/references/prompts/6-review.md` 第 2.1 节）打分。

#### 3.2 测试 6 维抽样

随机抽 5 个测试文件，按 T1~T6（见 `@devflow-kit/references/prompts/5-test.md` 第 1.4 节）打分。

#### 3.3 架构图

AI 用 grep + import 分析画一个简化 Mermaid 依赖图，标出循环依赖（如有）。

#### 3.4 综合分（自评）

每维度命中数 → 扣分（🔴 -10 / 🟡 -3 / 🟢 -1），从 100 起扣，得到自评分。**明确标注「内置回退评分」**。

### 步骤 4 · 输出健康报告

使用 `@devflow-kit/templates/health-check.md` 模板，**⚠️ 强制要求**：必须严格按模板完整结构输出，写入 `.devflow-kit/health/<YYYY-MM-DD>-HEALTH.md`。**不得省略或改写任何段落**。

必须填齐：综合分、6 维生产代码风险、6 维测试代码风险、架构图、冗余巡检、技术债优先级、行动建议、与上次对比、反哺记录。工具输出可原样贴入对应段；未装工具时必须标明“内置回退”。

### 步骤 5 · 反哺到 flow-kit 工件

- 🔴 Critical → 自动开新需求（编号如 `health-fix-2026-q1`），AI 进入 `0-confirm` 流程产 00-requirements.md
- 🟡 Scheduled → 追加到 `.devflow-kit/CONTEXT.md` 的「技术债」段
- 🟢 Monitored → 追加到 `.devflow-kit/lessons-learned.md`（用 `观察` 类型 entry）
- 综合分趋势 → 长期保留在 `.devflow-kit/health/` 目录，可画图
- **冗余巡检特殊处理**：
  - 🔴 未用导出 / 死分支 → 合并到 health-fix req（不单开）
  - 🟡 重复块 → 记 `.devflow-kit/CONTEXT.md`「技术债」段，标"待抽公共函数"
  - 🟡 未用依赖 → **写到 CONTEXT.md「禁动清单」段**（标"下次清理窗口移除"），避免 AI 再次为已被移除的库写代码
  - 🟢 关联 `A-evolve` 下次同步时**主动提醒**：有 M 条没用的导出在 CONTEXT.md「既有抽象索引」里还列着，建议清理

## 输出

- `.devflow-kit/health/<YYYY-MM-DD>-HEALTH.md`（必产，**必须严格按 `@devflow-kit/templates/health-check.md` 模板完整结构输出**）
- 0~N 个新需求 提案（仅 Critical 项）
- CONTEXT.md / lessons-learned.md 的追加（自动）

## 约束

- **不直接改代码**（与 6-review 同 R3.3 约束）
- **不开多个 fix 变更**：所有 Critical 合并成 1 个 health-fix req，避免 PR 爆炸
- **基线对比强制**：第二次跑起，必须与上次报告对比；不允许"看起来没变化"

## 自检

- ⏳ 选了正确的模式（首次 sweep / 周期 health / 单维深挖）
- ⏳ 装了 brooks-lint 走工具输出，未装走内置回退并明确标注
- ⏳ **步骤 2.5 冗余巡检已跑**：jscpd + 语言原生工具（装了）或 fallback grep（未装 · 已标 ⚠️ 精度低）
- ⏳ 综合分有「与上次对比」段
- ⏳ Critical 项已生成 health-fix req 提案
- ⏳ 未用依赖已写进 CONTEXT.md「禁动清单」（避免 AI 再次使用）
- ⏳ 报告归入 `.devflow-kit/health/` 目录

## 触发下一步

- 有 🔴 Critical → 用户选「现在修」 → `@devflow-kit/references/prompts/0-confirm.md` 开 health-fix req
- 全部 🟡/🟢 → 报告归档，提示用户「下次巡检建议日期：1 个月后」

