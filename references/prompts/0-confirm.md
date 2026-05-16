# 阶段 0 · Confirm — 把模糊想法变成一份需求确认书

> ⚠️ **进入本阶段前，必须先加载**：
> - **skill**：`devflow-kit/agent-skills/skills/idea-refine/_SKILL.md`、`devflow-kit/agent-skills/skills/development-core/_SKILL.md`
> - **reference（前端项目按节读取）**：`references/reference/ui-aesthetics.md` § 调性（用于展示调性卡片）

---

## 强制检查点（进入本阶段前必须满足）

```
□ 入场检测已输出检测结果框？
□ 入场检测结果不是"待用户确认"？
□ 已读取 .devflow-kit/STATE.md（如存在）？
□ 已加载 idea-refine/_SKILL.md？
□ 已加载 development-core/_SKILL.md？
```

**任一项为否 → 禁止进入本阶段，回到 GO.md 对应步骤**

---

## 角色

你是产品/技术对接人。你的任务**不是**立刻写需求，而是先**反问到清楚**。

## 输入

- 用户一句话（可能很模糊，例如"加个深色模式"）
- 已有项目（如有）：`@README.md`、`@.devflow-kit/`

## 你的职责

0.5 **宪法初始化**（首次使用必跑，已有则跳过）：

   > **来源**: 融合 spec-kit SDD 体系 — 项目宪法是所有设计和实现的最高约束

   检查 `.devflow-kit/constitution.md` 是否存在：

   - **不存在** → 使用 `@devflow-kit/templates/spec-constitution-template.md` 创建：
     1. 读取模板
     2. 根据项目类型填充「项目特定约束」段（技术栈要求、安全要求、性能标准）
     3. 其他段落保留模板原样（9 条核心原则不可修改）
     4. 保存到 `.devflow-kit/constitution.md`
     5. 告知用户：
        ```
        📜 已创建项目宪法 .devflow-kit/constitution.md
           - 包含 9 条核心原则（库优先 / CLI 接口 / 测试先行 / 集成测试 / 可观测性 / 版本管理 / 简单性 / 反抽象 / 宪法优先级）
           - 所有后续设计和实现受此宪法约束
           - 如需修改原则，走修订流程（文档化理由 → 审核 → 兼容性评估）
        ```
   - **存在** → 告知用户沿用已有宪法，不重新创建

   **宪法约束范围**：
   - 0-confirm → 宪法不影响需求表述
   - 1-analysis → 宪法不影响需求分析
   - **2-design → 必须经过 Constitution Gate 检查**
   - 3-task → 任务拆分对齐宪法约束
   - 4-dev → 实现必须符合宪法原则 III（测试先行）
   - 7-integration → 发布前复验宪法合规

1. **自动生成 req-id**（用户**不需要**提供）：
   - 从用户描述提取核心关键词，转成 kebab-case（小写、短横线分隔、英文）
   - 长度 2~4 个词。例：「设计陪诊网站」→ `companion-platform`；「加个深色模式」→ `dark-mode`；「订单超时退款」→ `order-timeout-refund`
   - 检查 `.devflow-kit/<id>/` 不存在，若冲突自动加序号 `<id>-2`、`<id>-3`
   - 在反问的第一条消息里向用户**显式声明**：
     ```
     ✅ 自动生成 req-id：`<id>`（不满意请告诉我新的，否则继续。）
     ```
   - 用户没纠正就照用，**不要等确认**

2. **架构级变更检测**（必跑 · 决定是否要先跑 A-architect 而非直接走 需求流程）：

   **目的**：单个需求 视角窄，无法一致地处理"拆服务 / 换数据库 / 换鉴权方案"这类**跨模块、影响 ADR**的变更。这类变更应该**先在 ARCHITECTURE 层达成共识**再开 req，否则 02-design.md § 0.5 的"既有架构对齐"会自相矛盾。

   #### 2.1 判定标准（命中**任一**即触发）

   AI 用判断而非纯关键词匹配。命中条件：

   1. **影响项目级模块结构**：新增 / 拆分 / 合并 / 删除一个项目级模块（如"把 user-service 拆成 auth + profile"、"加个独立的 notification-service"）
   2. **影响 ADR**：与 system-architecture.md § 3 已有 ADR 冲突或要新增不可逆决策（如"换 Postgres 为 CockroachDB"、"引入 Kafka 替代当前的内存队列"、"改 REST 为 GraphQL"）
   3. **改公共契约**：跨模块的 API 风格 / 事件总线协议 / Schema 主键策略变更
   4. **影响容量边界**：明确触发 system-architecture.md § 6 的预警阈值（如"支持 10× 并发 / 引入读写分离 / 上 CDN"）
   5. **跨服务编排**：容器化 / 上云 / 多区域 / 多租户化等基础设施级动作

   **明确不算架构级**（避免误判）：

   - 在既有架构内加一个新 feature / 业务模块（如"加用户档案页"、"加导出功能"——走正常 需求流程）
   - 在既有抽象上加一个适配器（如"接入新的支付通道"——走 req，02-design.md § 9.1 记新增抽象即可）
   - bug 修复 / UI 改版 / 文案改动 / 配置调整

   #### 2.2 命中后停下来反问

   ```
   🏛️ 检测到本次描述涉及**项目级架构变更**：
      - 命中信号：<例：要改 system-architecture.md § 2 模块清单（拆 user-service）+ 影响 ADR-002（鉴权方案）>

   这种规模建议**先**跑架构梳理工作流，再回来开 req：

   选项：
   1. ✅ 先跑 `@A-architect`（推荐 · 重审受影响 ADR + 更新模块图，再开 req 才在对齐基础上展开）
   2. ⚠️ 我清楚架构层影响，**继续 0-confirm**（02-design.md § 0.5 / § 9 你会显式声明对 ADR-NNN 的影响）
   3. ↩️ 这其实是 需求级局部改造不是项目级（请说明理由，我重判）

   请回复 1/2/3。无人工确认前我不进步骤 3 之后的反问（避免在 ADR 不清的情况下开始追问需求细节）。
   ```

   **各选项后续动作**：

   - **选 1**：暂停本工作流，引导用户跑 `@devflow-kit/references/prompts/A-architect.md`。完成后用户回来重新跑 `@devflow-kit/references/GO.md` + 同样意图，那时 system-architecture.md 已就绪，本步会通过。**已生成的 req-id 暂留**，A-architect 完成后复用
   - **选 2**：继续步骤 3。但**强制**：在 00-requirements.md 末尾加一段「## 架构层影响声明」列出本次需求 会冲击哪些 ADR / 模块边界（这段会在 2-design § 0.5 被读到）
   - **选 3**：用户给出"这其实只是 X"的解释，AI 重新判断。如果合理则继续；如果用户解释牵强，AI **可以坚持**（"我仍判定为架构级，理由：…，请你选 1 或 2"）

   #### 2.3 system-architecture.md 不存在的特殊处理

   如果检测到架构级变更但 `.devflow-kit/system-architecture.md` 不存在（项目从未跑过 A-architect）：

   - 选项 1 改为："✅ 先跑 `@A-architect` 建立项目级架构文档（**这是首次建立 · 一次性投资**）"
   - 选项 2 不变
   - 加一行警告："⚠️ 没有 system-architecture.md 的情况下做架构级变更，决策无处沉淀，下次再来这部分讨论又得重做"

   #### 2.4 没命中就跳过

   90% 的 req 都不是架构级。本步不命中就直接进步骤 3，不打扰用户。

3. **前端项目识别**（关键词触发）：

   描述里包含以下任一关键词 → 判定为**前端项目**：
   - 网站 / 网页 / 页面 / web / website / landing
   - app / 应用 / 移动端 / 小程序
   - dashboard / 后台 / 管理界面 / 面板
   - 界面 / UI / 前端 / 设计稿
   - 用户端 / 客户端 / GUI

   非前端项目（CLI / 后端 API / lib / SDK）跳过步骤 4，直接进步骤 5。

4. **视觉调性预选**（仅前端项目，**独立一条消息，等用户回复后再进下一步**）：

   **红线：本步不出其他问题。只列调性卡片 + 推荐，用户选定后才开启反问。**

   ### 源优先级（按顺序尝试）

   1. **如装了 `ui-ux-pro-max`**（uipro CLI）→ **优先用它**：
      ```bash
      python3 src/ui-ux-pro-max/scripts/search.py "<项目关键词>" --domain style
      python3 src/ui-ux-pro-max/scripts/search.py "<项目关键词>" --domain product
      ```
      从 67 styles 里选出 **9 个最匹配项目类型**的，按下面的标准卡片格式呈现。
      优势：后期 2a-ui-design 能联动调调色板（161 palettes）/ 字体（57 pairings）/ 图表（25 charts）。
   2. **没装 uipro** → 回退到 flow-kit 内置基线：加载 `@devflow-kit/references/reference/ui-aesthetics.md` 的「调性」一节，按其末尾的「给 AI 在 0-confirm 阶段展示用的标准模板」呈现 9 张调性卡片。

   ### 呈现要求（两条路径都适用）

   - 项目名 + 一句话业务描述
   - 9 张卡片（编号 + 名称 + 关键词 + 3 个参考产品）
   - **必给 1 首选 + 1 备选**，理由结合业务（禁止"任选都行"）
   - **显式排除**明显不合适的 1~3 个 + 理由
   - 末尾一句：`请回复数字（如 "6"）或描述你想要的感觉，选定后我再问其他问题。`

   ### 例外（可跳过本步，直接锁定）

   - 用户描述里已包含强偏好："参考 Notion" / "像 Headspace 那样" / "走极简风" → 直接锁定对应调性，跳过卡片，告诉用户"锁定为 X，你可以调整"后进入步骤 5

   ### 选定后

   - 写入 00-requirements.md 的 `视觉调性` 字段（前端项目必填）
   - 会**继承到 2a-ui-design**，2a 不再让用户重选调性
   - **进入步骤 5**（反问）

5. **反问**：用户选定调性后（或非前端项目跳过步骤 4 后），用结构化提问把"为什么 / 给谁 / 解决什么 / 何时算完"问清楚。每轮最多 3 个问题，等用户回答再继续。
   - **不允许与调性卡片同屏呈现**（以免信息超载）

6. **影响面判定**：
   - 是否需要新增/修改 `01-analysis.md`？
   - 是否触及架构（需要更新 `02-design.md` / 新增 ADR）？
   - 是否影响现有 AC？

7. **范围排除**：明确写出**这次不做什么**。

8. **生成 00-requirements.md**：**⚠️ 强制要求**：必须严格按照 `@devflow-kit/templates/00-requirements.md` 模板的完整结构输出，填好后保存到 `.devflow-kit/<req-id>/00-requirements.md`（id 来自步骤 1）。**不得省略或改写任何段落**。

9. **路径建议**：模式已在路由声明中由用户确认。此处基于影响面判定，在已确认的模式下建议具体走哪些阶段：

   ```
   📍 已确认模式：<模式>（路由声明时已选）
   📍 建议路径：<具体要走哪些阶段，用 → 连接>
      理由：<为什么走/跳过某些阶段>

   典型路径参考（Standard 模式）：
   - 完整：0-confirm → 1-analysis → 2-design → 3-task → 4-dev → 5-test → 6-review → 7-integration
   - 中等（需求已有增量）：1-analysis(增量) → 3-task → 4-dev → 5-test → 6-review → 7-integration
   - 跳设计（纯 bugfix）：3-task → 4-dev → 5-test → 6-review → 7-integration

   Fast 模式：短任务说明 → 修改 → 窄验证 → 结果证据
   Strict 模式：完整流程 + 安全/迁移/回滚检查 + 独立 review

   是否同意此路径？[Y/n]
   ```

## 输出

- `.devflow-kit/<req-id>/00-requirements.md`（**必须严格按模板格式输出**）
- 一段路径建议（在已确认模式下建议具体阶段），并询问用户确认
- **更新 `.devflow-kit/STATE.md`**：
  - `活跃 Req` 改为 `<req-id>`
  - `当前阶段` 设为 `confirm`
  - `阶段状态` 设为 `waiting_user_confirmation`
  - `上次完成阶段` 设为 `confirm`
  - `下一阶段` 设为建议路径中的下一阶段
  - `模式` / `判定理由` / `判定时间` 填入
  - 在「阶段进度」清单中打钩 `需求确认 → 00-requirements.md`

## 约束（来自 RULES.md）

- 不允许跳过反问直接出方案
- 不允许凭空假设未确认的需求点
- 不允许在 00-requirements.md 里写实现细节（那是 设计 的事）

## 自检（产出前自查）

### 产物输出前强制检查

```
□ 我已读取 templates/00-requirements.md 模板？
□ 产物包含模板所有段落？
□ 占位符已替换为实际值？
```

**任一项为否 → 禁止输出产物**

### 内容完整性检查

| 检查项 | 通过标准 | 不通过处理 |
|---|----------|---|
| Why / What / 影响面 / 范围排除 / 验收线 | 全部包含 | 补齐缺失段落 |
| 「本次不做」 | 至少 1 条 | 补充范围排除 |
| 路径建议 | 有理由，非默认全跑 | 补充理由 |
| 实现细节 | 无（如"用 Redux"） | 删除，移到设计阶段 |
| 架构级变更 | 步骤 2 已跑，用户选 2 → 有「架构层影响声明」段 | 补充声明 |
| STATE.md | 已更新 | 更新后再输出 |

### 自检命令

```
□ 产物包含 Why/What/影响面/范围排除/验收线？ → 是/否
□ 至少 1 条「本次不做」？ → 是/否
□ 没有实现细节？ → 是/否
□ STATE.md 已更新？ → 是/否
```

## 阶段完成声明（必须输出）

```
✅ 需求确认 完成
📝 产物：.devflow-kit/<req-id>/00-requirements.md
📊 STATE.md 阶段进度已更新：[x] 需求确认 → 00-requirements.md

请确认需求确认书内容：
- Why: <一句话背景>
- What: <一句话目标>
- 影响面: <列出影响范围>
- 本次不做: <列出排除项>

确认后回复 Y 继续，或指出需要修改的地方。
```

> ⚠️ **关键阶段**：需求确认是关键阶段，必须等用户回复后才能进入下一阶段。

## 触发下一步

00-requirements.md 经用户确认后，根据路径建议进入：
- `@devflow-kit/references/prompts/1-analysis.md`（影响需求时）
- `@devflow-kit/references/prompts/3-task.md`（直接拆任务时）

