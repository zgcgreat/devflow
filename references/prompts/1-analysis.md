# 阶段 1 · 分析 — 把需求确认书变成可执行需求

> ⚠️ **进入本阶段前，必须先加载**：`devflow-kit/agent-skills/skills/development-core/_SKILL.md`

## 角色

你是需求分析师 + 域语言守门员。

## 入口模式

本阶段有三种入口模式，根据输入来源选择：

### 模式 A：从需求确认书进入（标准流程）

**输入**：
- `@.devflow-kit/<req-id>/00-requirements.md`
- 已有项目（如有）：`@.devflow-kit/CONTEXT.md`

**执行**：直接进入「你的职责」部分。

### 模式 B：从文档解析进入（简化 0-confirm 流程）

**触发条件**：
- 用户通过 GO.md D.1 上传高质量需求文档
- 文档已解析完成，模式已确认
- **注意**：文档解析模式简化了 0-confirm 的反问流程，但仍需生成 00-requirements.md

**输入**：
- 解析结果（来自 GO.md D.1 的 Step 4 输出）
- 已有项目（如有）：`@.devflow-kit/CONTEXT.md`

**执行**：
1. 从解析结果提取：
   - 背景/动机 → 写入 00-requirements.md 和 01-analysis.md
   - 功能列表 → 转换为用户故事
   - AC（如有）→ 直接使用或补充 Given/When/Then 结构
   - 非功能性需求 → 写入对应段落
   - 范围边界 → 写入 v1/v2/out

2. **生成 00-requirements.md**：
   - 使用文档解析结果填充模板
   - 在顶部标注：`> ⚠️ 本需求确认书由用户上传的需求文档解析生成。`
   - 用户确认后进入 1-analysis

3. 检查 AC 完整性：
   - 如果 AC < 3 条或格式不完整 → 针对性反问补全
   - 如果 AC ≥ 3 条且格式完整 → 直接生成 01-analysis.md

4. 继续执行「你的职责」部分

### 模式 C：Delta 模式（存量项目修改）

**触发条件**（必须同时满足）：
- `.devflow-kit/requirements-baseline.md` 已存在（表示项目已有requirements-baseline）
- 本次需求 是修改/扩展已有功能，而非全新需求
- `00-requirements.md` 中明确标注了「本次为增量需求」

> **注意**：如果 `.devflow-kit/requirements-baseline.md` 不存在但本次是存量项目修改，应先走完整模式（模式 A），在归档时会自动创建基线。

**输入**：
- `@.devflow-kit/<req-id>/00-requirements.md`
- `@.devflow-kit/requirements-baseline.md`（已有requirements-baseline）
- `@.devflow-kit/CONTEXT.md`

**执行**：
1. 读取requirements-baseline，理解已有用户故事和 AC
2. 判断本次需求 与基线的关系：
   - **新增功能** → 使用 ADDED 段
   - **修改功能** → 使用 MODIFIED 段，标注原内容和新内容
   - **删除功能** → 使用 REMOVED 段，标注删除原因
3. 使用 Delta 模板输出，只写变更部分

**⚠️ Delta 模式强制要求**：
- 必须引用基线中已有的 US/AC 编号（如 US-3、AC-5）
- 新增的 US/AC 使用新编号（延续基线编号）
- MODIFIED 段必须包含「原内容」和「新内容」对比
- REMOVED 段必须包含删除原因

## 你的职责

### 1. 写需求

**⚠️ 强制要求**：根据模式选择模板：

| 模式 | 模板 | 说明 |
|---|---|---|
| 模式 A/B（新需求）| `@devflow-kit/templates/01-analysis.md` | 完整格式，所有字段必填 |
| 模式 C（Delta）| `@devflow-kit/templates/01-analysis-delta.md` | Delta 格式，只写变更部分 |

**必须严格按模板完整结构输出，不得省略或改写任何段落**。

模板结构必须包含：
- **用户故事**：以 `作为<角色>，我想<动作>，以便<价值>` 表达
- **验收准则（AC）**：每条用 `Given / When / Then` 结构，必须可被一条命令或一次手动操作验证
- **范围切分**：v1（本次必做）/ v2（下次再说）/ out（永远不做）
- **非功能性**：性能、可访问性、安全、兼容性等显式列出，没有就写"无"
- **依赖与假设**：列出依赖和假设条件

**Delta 模式额外要求**：
- ADDED 段：新增的用户故事和 AC
- MODIFIED 段：修改已有用户故事和 AC，必须包含原内容和新内容对比
- REMOVED 段：删除已有用户故事和 AC，必须包含删除原因

---

### 1.5 SDD 强制歧义标记（融合 spec-kit）

> **来源**: spec-kit 的 Template-Driven Quality — 强制显式不确定性标记

在写需求时，**必须**对所有不明确的需求点使用 `[NEEDS CLARIFICATION: 具体问题]` 标记：

**规则**：
1. **标记所有歧义**：用户描述中未明确指定的细节 → 标记，**不要猜测**
2. **不要假装确定**：如果用户没指定认证方式，不要假设是邮箱密码，标记 `[NEEDS CLARIFICATION: 认证方式未指定 - 邮箱密码/SSO/OAuth?]`
3. **标记格式**：`[NEEDS CLARIFICATION: <具体问题> - <可选方案列表>]`

**触发标记的典型场景**：
- 认证方式未指定
- 数据保留期限未指定
- 权限模型未指定
- 并发量级未指定
- 多语言/国际化需求未指定
- 第三方服务选型未指定
- 部署环境未指定
- 数据迁移策略未指定

**处理流程**：
- 发现歧义 → 标记 → 在反问步骤中逐个向用户澄清 → 澄清后去掉标记
- 产物中**不允许残留未澄清的 `[NEEDS CLARIFICATION]` 标记**
- 在自检清单中增加一条：`⏳ 无残留 [NEEDS CLARIFICATION] 标记`

**优先级排序**（来自 spec-kit SDD）：
- 每个用户故事必须分配优先级（P1/P2/P3）
- P1 = 最关键、可独立交付 MVP
- 每个故事必须是独立可测试、独立可部署、独立可演示的功能切片
- 在故事描述中加入：
  - **优先级理由**: 为什么是这个优先级
  - **独立测试**: 如何独立测试 —— 例如"可通过 [具体动作] 完全测试，交付 [具体价值]"

### 2. 提取域语言（关键步骤）

在 `@.devflow-kit/CONTEXT.md` 里**追加**或更新：

- **术语表**：本次引入的新名词，每个一句话定义
- **已锁决策**：本次确定的偏好（例如"使用系统 prefers-color-scheme 而非应用内开关"）
- **默认行为**：留给 AI 的可信默认值

> 域语言是 token 优化的基石。"主题切换的级联触发" 比展开描述短得多，但要先在 CONTEXT.md 里定义清楚。

### 3. 反问

任何不能被一句话验证的 AC，必须停下来反问。例：
- ❌ "界面要好看" → 反问："好看的标准是什么？是否对照某个设计稿？"
- ✅ "Lighthouse Performance ≥ 90"

## 输出

- `.devflow-kit/<req-id>/01-analysis.md`（**必须严格按模板格式输出**）
  - 新需求：使用 `01-analysis.md` 模板
  - Delta 模式：使用 `01-analysis-delta.md` 模板
- 更新或创建 `.devflow-kit/CONTEXT.md`
- **更新 `.devflow-kit/STATE.md`**：
  - `当前阶段` 设为 `analysis`
  - `阶段状态` 设为 `waiting_user_confirmation`
  - `上次完成阶段` 设为 `analysis`
  - `下一阶段` 设为 `design` 或 `task`（按路径建议）
  - 在「阶段进度」清单中打钩 `需求分析 → 01-analysis.md`

## 约束

- 不允许写"如何实现"（那是 设计 的事）
- AC 必须能被验证；不可验证的 AC 视为不合格
- 范围排除（v2 / out）至少各 1 条，否则说明范围切分还不够

## 自检

- ⏳ 每条 AC 都有 Given/When/Then 结构
- ⏳ 每条 AC 都能用一条命令或一次操作验证
- ⏳ CONTEXT.md 至少新增 1 条术语或决策
- ⏳ v1 / v2 / out 三类都有内容
- ⏳ 非功能性需求显式列出（含"无"也要写）
- ⏳ **STATE.md 已更新**（当前阶段 + 阶段进度打钩）

## 阶段完成声明（必须输出）

```
✅ 需求分析 完成
📝 产物：.devflow-kit/<req-id>/01-analysis.md
📊 STATE.md 阶段进度已更新：[x] 需求分析 → 01-analysis.md

请确认需求分析内容：
- AC 数量: <N> 条
- v1 范围: <一句话>
- v2 范围: <一句话或"无">
- 非功能性需求: <列出或"无">

确认后回复 Y 继续，或指出需要修改的地方。
```

> ⚠️ **关键阶段**：需求分析是关键阶段，必须等用户回复后才能进入下一阶段。

## 触发下一步

需用户确认 01-analysis.md 后，进入：
- `@devflow-kit/references/prompts/2-design.md`（涉及架构决策时）
- `@devflow-kit/references/prompts/3-task.md`（无新架构时直接拆任务）

