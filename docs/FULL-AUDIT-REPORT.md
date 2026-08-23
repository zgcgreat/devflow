# ForgeOS 全面检查报告

> 检查日期: 2026-06-19 | 检查维度: 5 大类 20+ 子项
> 目标: 从项目结构、代码质量、品牌一致性、逻辑自洽、文档完整性五方面全面审查

---

## 总览

| 维度 | 严重(P0) | 重要(P1) | 建议(P2) | 总问题 |
|------|---------|---------|---------|--------|
| 1. 项目结构完整性 | 2 | 3 | 6 | 11 |
| 2. 代码可执行性 | 2 | 1 | 1 | 4 |
| 3. 品牌/命名一致性 | 1 | 2 | 1 | 4 |
| 4. 核心文件逻辑自洽 | 1 | 2 | 2 | 5 |
| 5. 文档/引用完整性 | 0 | 2 | 3 | 5 |
| **合计** | **6** | **10** | **13** | **29** |

---

## 维度1: 项目结构完整性

### P0 — 严重

| # | 问题 | 影响 |
|---|------|------|
| 1.1 | **缺少 `VERSION` 文件** — MERGE-MAP 明确定义应含 `1.0.0`，但根目录无此文件 | npm 发包和版本识别失败 |
| 1.2 | **缺少 `RULES.md`** — MERGE-MAP 定义根目录应有此文件(来源 devflow/references/RULES-v3.md)，实际仅在 references/ 下 | SKILL.md 引用的 `docs/behavior-rules.md` 也不存在 |

### P1 — 重要

| # | 问题 | 影响 |
|---|------|------|
| 1.3 | **skills/workflow/ 和 skills/engineering/ 不存在** — 融合计划定义应从 devflow 复制 18+24 个技能，但 skills/ 下仅有 specialized/security/ | 用户缺少大量工程技能 |
| 1.4 | **personas/ 根目录缺少索引文件** — core/extended/cavecrew 均有内容，但 personas/ 本身无 README 或 _SKILL.md | AI 加载时无法找到入口 |
| 1.5 | **layers/L1-INTERACTION/CONSTITUTION.md 品牌名为 "devflow"** — 与根目录 CONSTITUTION.md ("ForgeOS") 不一致，内容差异大(10条 vs 8条) | 两套宪法规则冲突 |

### P2 — 建议

| # | 问题 | 说明 |
|---|------|------|
| 1.6 | `.forgeos/outputs` 为空目录 | 运行时输出目录，可保留 |
| 1.7 | `adapters/universal/` 仅含 README.md | 缺少零运行时适配的具体文件 |
| 1.8 | `domains/execution/` 仅含 _SKILL.md | 核心域但缺少实现 |
| 1.9 | `test/` 仅含 all.js 一个文件 | 融合计划提到 13 项测试，应有更多 |
| 1.10 | L2-ENGINE 28个子目录各仅1个 _SKILL.md | 技能目录过于单薄，缺少实现脚本 |
| 1.11 | `sources/` 根目录缺少 README | 17个源项目子目录但无索引 |

---

## 维度2: 代码可执行性

### P0 — 严重

| # | 问题 | 文件 | 原因 |
|---|------|------|------|
| 2.1 | **JS 语法错误** | `adapters/shared/core-bridge.js` | `G2.5` 不是合法 JS 标识符（含小数点），应用引号: `'G2.5'` |
| 2.2 | **JS 语法错误** | `adapters/shared/gate-checker.js` | 同上，`G2.5` 和 `G3.5` 未加引号 |
| 2.3 | **JS 语法错误** | `references/delta-spec-validator.js` | 字符串数组缺少闭合引号: `'[DEPRECATED]'` 后缺 `']` |

### P1 — 重要

| # | 问题 | 说明 |
|---|------|------|
| 2.4 | **package.json 无 dependencies** — 项目 require 了 `ajv`, `sql.js`, `@iarna` 等外部包，但 package.json 没有声明任何依赖 | npm install 无法安装所需依赖 |

### P2 — 建议

| # | 问题 | 说明 |
|---|------|------|
| 2.5 | `bin/forge-os.js` 使用 FLOWFORGE_ 前缀变量名 | `FLOWFORGE_SKILL`, `FLOWFORGE_GO` 等变量名应改为 `FORGEOS_` |

---

## 维度3: 品牌/命名一致性

### P0 — 严重

| # | 问题 | 数量 | 说明 |
|---|------|------|------|
| 3.1 | **"ForgeOS/forgeos" 品牌名残留** | ~366处, ~73文件 | 项目名为 ForgeOS，不应出现 FlowForge 品牌。最密集: docs/INTEGRATION-PLAN.md(~89), docs/CROSS-PROJECT-ANALYSIS.md(~101), 所有 Phase _SKILL.md 的 "FlowForge增强" 段落 |

### P1 — 重要

| # | 问题 | 数量 | 说明 |
|---|------|------|------|
| 3.2 | **"devflow/devflow" 旧品牌残留** | ~188处, ~84文件 | 最严重: layers/L1-INTERACTION/CONSTITUTION.md 标题为 "devflow", adapters/cursor/forgeos.mdcc 文件名本身为 devflow, references/prompts/ 全部通过 @forge-os/ 引用 |
| 3.3 | **"@forge-os/" 旧包名** | ~82处, ~18文件 | 全部在 references/prompts/ 下，应统一为 @forgeos/ |

### P2 — 建议

| # | 问题 | 说明 |
|---|------|------|
| 3.4 | `.devflow/` 旧路径残留7处(2个文件) | adapters/cursor/forgeos.mdcc(6处), docs/AUDIT-REPORT.md(1处历史记录) |

---

## 维度4: 核心文件逻辑自洽性

### P0 — 严重

| # | 问题 | 说明 |
|---|------|------|
| 4.1 | **两套 CONSTITUTION.md 冲突** — 根目录版(8条"ForgeOS宪法")与 layers/L1-INTERACTION/ 版(10条"devflow工作流宪法")内容不同且品牌名冲突 | 规则3"单任务单Commit"和规则4"失败时Rollback优先"在ForgeOS版中被替换为"优先使用现有文件"和"每一次实施都是新子Agent"，两个版本语义矛盾 |

### P1 — 重要

| # | 问题 | 说明 |
|---|------|------|
| 4.2 | **CONSTITUTION 条数不一致** — 融合计划定义12条统一宪法，根目录版8条，L1版10条，均非12条 | 宪法条目缺失: Provider路由、触发式参考加载、安全防御底线、双维度自适应等 |
| 4.3 | **phase-engine.js 门控与 gate-rules.md 定义可能不同步** — G2 门控在 phase-engine.js 的 PHASES 数组中缺失(Phase 1→Phase 1.5 之间无 G2)，但 GATES 数组也无 G2 | G2 被跳过，Phase 1 直接到 G2.5，逻辑正确但命名跳跃可能引起困惑 |

### P2 — 建议

| # | 问题 | 说明 |
|---|------|------|
| 4.4 | SKILL.md "强制行为约束"标注"来自 ForgeOS" | 应改为"来自 ForgeOS"或移除来源标注 |
| 4.5 | GO.md 仍含 `/forgeos:setup` 命令引用 | 应改为 `/forgeos:setup` |

---

## 维度5: 文档/引用完整性

### P1 — 重要

| # | 问题 | 说明 |
|---|------|------|
| 5.1 | **SKILL.md 引用的 `docs/behavior-rules.md` 不存在** — R8-R11 指向此文件但文件缺失 | 行为约束 R8-R11 内容无处可查 |
| 5.2 | **SKILL.md 引用的 `references/mode-rules.md` 存在但未在 SKILL.md 按需加载矩阵中列出** | 引用断裂风险 |

### P2 — 建议

| # | 问题 | 说明 |
|---|------|------|
| 5.3 | docs/ 下文档密集(~15个)但无导航索引 | AI 和用户难以快速定位 |
| 5.4 | `references/prompts/` 下18个prompt文件全使用 @forge-os/ 包名 | 品牌不一致，但不影响功能 |
| 5.5 | `docs/MERGE-MAP.yaml` 中部分条目标注为"暂缺"或"待完成" | 需更新完成状态 |

---

## 修复优先级建议

### 立即修复 (P0, 6项)

| 优先级 | 问题 | 修复方案 | 工作量 |
|--------|------|---------|--------|
| 🔴1 | JS语法错误(3个文件) | G2.5→'G2.5', 修复引号缺失 | 5min |
| 🔴2 | 缺少VERSION文件 | 创建 VERSION 文件含 `3.2.2` | 1min |
| 🔴3 | 缺少RULES.md | 从 references/RULES-v3.md 复制/链接到根目录 | 5min |
| 🔴4 | 两套CONSTITUTION冲突 | 统一为12条ForgeOS宪法，删除L1版 | 30min |
| 🔴5 | skills/workflow+engineering缺失 | 从flowforge源项目复制 | 15min |
| 🔴6 | ForgeOS品牌残留 | 全局替换 FlowForge→ForgeOS | 30min |

### 近期修复 (P1, 10项)

| 优先级 | 问题 | 修复方案 | 工作量 |
|--------|------|---------|--------|
| 🟡1 | package.json无dependencies | 添加 ajv/sql.js 等声明 | 10min |
| 🟡2 | devflow/devflow品牌残留 | 全局替换 | 45min |
| 🟡3 | @forge-os/旧包名 | 替换为@forgeos/ | 20min |
| 🟡4 | docs/behavior-rules.md缺失 | 创建R8-R11内容 | 15min |
| 🟡5 | personas/缺索引 | 创建README.md | 10min |
| 🟡6 | L1-CONSTITUTION品牌名错误 | 删除或重写 | 15min |
| 🟡7 | CONSTITUTION条数不完整 | 补充到12条 | 20min |
| 🟡8 | bin/forge-os.js变量名FLOWFORGE_ | 重命名为FORGEOS_ | 5min |
| 🟡9 | references/prompts/模式引用缺失 | 补充到SKILL.md | 5min |
| 🟡10 | .devflow/旧路径残留 | 替换为.forgeos/ | 5min |

### 后续优化 (P2, 13项)

- 统一所有"来自ForgeOS"标注为"来自ForgeOS"或移除
- 创建docs/导航索引
- 完善adapters/universal/零运行时适配
- 补充test/测试用例
- 完善L2-ENGINE各模块的实现
- 创建domains/execution/实现文件
- 创建sources/README.md
- 更新MERGE-MAP.yaml完成状态
- GO.md命令引用品牌统一
- references/prompts/包名统一

---

## 结论

ForgeOS 项目在架构设计层面**成熟完整**（M0-M7 验收 96% 通过），但在**落地执行层面**存在 29 个问题需要修复。最严重的是：

1. **3个JS语法错误**导致核心模块无法加载
2. **两套宪法冲突**导致行为规则不一致
3. **大量品牌残留**（FlowForge/devflow 共 ~550 处）影响项目身份识别

建议按 P0→P1→P2 顺序修复，P0 6 项可在 1-2 小时内完成。
