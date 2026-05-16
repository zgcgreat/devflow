# devflow-kit Stage: 2-Design（方案设计）

> **阶段定位**：将需求转化为可执行的技术设计
> **前置条件**：01-analysis.md 已完成
> **后置产物**：`.devflow-kit/<req-id>/02-design.md` + ADRs

## Skill元信息

```yaml
name: stage-2-design
version: 1.0.0
description: devflow-kit工作流第2阶段 - 技术设计与架构决策
author: devflow-kit
dependencies:
  - stage-a-architect
```

## 输入

- `.devflow-kit/<req-id>/01-analysis.md`（或Delta版）
- `.devflow-kit/<req-id>/00-requirements.md`
- `.devflow-kit/CONTEXT.md`（或ai_context_doc指定文档）
- `.devflow-kit/system-architecture.md`（如存在·brownfield项目）
- `.devflow-kit/design-baseline.md`（如存在·Delta模式）
- `references/reference/tech-stacks.md`（按节读取）

## 输出

- `.devflow-kit/<req-id>/02-design.md`
- `.devflow-kit/adr/<NNN>-<title>.md`（如有架构决策）
- 更新 `.devflow-kit/STATE.md`

## 入口门禁

```markdown
IF 缺 01-analysis.md:
  输出: "规则 R2.7 触发：2-design 缺少 01-analysis.md。本次先回到 1-analysis 补齐。"
  STOP

IF 前端项目 AND 缺 00-requirements.md 中的项目类型:
  警告: "未明确项目类型，UI设计可能不准确"
```

## 执行流程

### Step 1: 扫描可用前置产物

**⚠️ 强制规则**：必须先扫描所有可能的前置产物，根据实际存在情况决定读取策略。

#### 1.1 扫描主流程产物

| 产物文件 | 存在性 | 优先级 | 提取内容 |
|---|--------|---|----------|
| 01-analysis.md | ✅/❌ | 🔴 必须 | AC列表、非功能需求、依赖约束 |
| 00-requirements.md | ✅/❌ | 🟡 建议 | 模式判定 |
| CONTEXT.md | ✅/❌ | 🟡 建议 | 既有技术栈、编码规范 |
| system-architecture.md | ✅/❌ | 🟢 可选 | 既有架构、ADR |
| lessons-learned.md | ✅/❌ | 🟢 可选 | 设计教训 |

**扫描结果输出**：
```markdown
✅ 检测到 01-analysis.md → 提取AC列表：8个
✅ 检测到 00-requirements.md → 提取模式判定：Standard
✅ 检测到 CONTEXT.md → 提取技术栈：Vue3 + TypeScript
❌ 未检测到 system-architecture.md → 跳过架构对齐步骤
```

#### 1.2 分级读取策略

**🔴 必须读取**（缺失会阻塞流程）：
- **01-analysis.md**：提供AC列表，是设计的核心依据
  - 如果缺失 → 报错并引导回stage-1-analysis

**🟡 建议读取**（缺失采用降级策略）：
- **00-requirements.md**：提供模式判定，决定设计深度
  - 如果缺失 → 默认使用Standard模式
- **CONTEXT.md**：提供既有技术栈和编码规范
  - 如果缺失 → 从package.json推断技术栈

**🟢 可选读取**（补充信息）：
- **system-architecture.md**：提供既有架构和ADR
  - 如果缺失 → 跳过Step 0.5既有架构对齐
- **lessons-learned.md**：提供历史设计教训
  - 如果缺失 → 使用通用最佳实践

#### 1.3 降级策略

**如果某个产物不存在**：

1. **00-requirements.md 缺失**：
   ```
   ⚠️ 警告：缺少00-requirements.md，无法获取模式判定
   → 降级方案：默认使用Standard模式
   → 提醒：建议在产物中注明采用的设计深度
   ```

2. **CONTEXT.md 缺失**：
   ```
   ⚠️ 警告：缺少CONTEXT.md，无法获取既有技术栈
   → 降级方案：从package.json推断技术栈
   → 询问用户："是否需要先运行 I-intel-scan 生成上下文？"
   ```

3. **system-architecture.md 缺失**：
   ```
   ℹ️ 提示：缺少system-architecture.md，跳过既有架构对齐步骤
   → 提醒：建议先运行 A-architect 建立架构基线
   ```

#### 1.4 信息提取摘要

**输出格式**：
```markdown
### Step 1 输出：前置信息摘要

**已提取的关键信息**：

1. **需求层面**（来自01-需求分析）：
   - AC数量：<N>个
   - 非功能需求：<性能/安全要求>

2. **模式层面**（来自00-需求确认）：
   - 模式判定：<Fast/Standard/Strict>

3. **技术层面**（来自上下文）：
   - 技术栈：<Vue3 + TypeScript>
   - 既有抽象：<ApiClient, validation.ts>

4. **经验层面**（来自lessons-learned，如存在）：
   - 教训1：<上次设计过于复杂>

**下一步**：基于上述信息进行技术决策
```

### Step 1.5: 完整性自检

**检查是否充分利用了前置产物**：

- ⏳ 是否读取了01-analysis.md？
- ⏳ 是否从01中提取了所有AC列表？
- ⏳ 是否从00-需求确认中获取了模式判定（如存在）？
- ⏳ 是否参考了上下文中的既有抽象（如存在）？
- ⏳ 对于缺失的产物，是否采用了合理的降级策略？
- ⏳ 设计深度是否符合模式判定？
  - Fast：简化设计，减少ADR数量
  - Standard：平衡设计深度和效率
  - Strict：详细设计，完整ADR

**如果发现遗漏**：
→ 回到Step 1重新读取
→ 或在本阶段产物中注明"因缺少XX产物，采用YY假设"

### Step 2: 架构级变更预检

**目的**：拦截应走A-architect的需求

**判定标准**（命中任一条即触发）：
- 拆分/合并核心模块
- 更换数据库/消息队列
- 改变鉴权方案
- 引入新的架构模式

**已跑过0-confirm的跳过**：如果00-requirements.md有「架构层影响声明」段，直接跳Step 0。

**首次到这步**：
```markdown
IF 命中 AND .devflow-kit/system-architecture.md 存在:
  检查ADR是否冲突 → 提示在§1显式声明supersede关系
  
IF 命中 AND .devflow-kit/system-architecture.md 不存在:
  反问用户:
  "🏛️ 本次设计涉及项目级架构变更，但项目无system-architecture.md。
  
  选项：
  1. ✅ 先跑 A-architect 建立架构基线（推荐）
  2. ⚠️ 继续设计但强制在§1加「本设计同时奠定项目级ADR」
  3. ↩️ 这其实不是项目级（说明理由·我重判）
  
  请选 1/2/3。"
  
IF 未命中:
  直接进步骤0
```

### Step 0: 技术栈预选

**红线**：本步只列技术栈卡片+推荐，用户选定后才出ADR/架构图。

#### 例外（可跳过本步直接锁定）

- `CONTEXT.md` 已有「已锁技术决策」→ 直接读用
- 用户描述包含强偏好（"用Next" / "后端需Go"）→ 锁定后跳过
- 纯库/SDK/CLI项目 → 跳过本步，只需选语言

#### 常规路径

加载 `tech-stacks.md`，按「适用矩阵」过滤出 **5~6张最匹配**的卡片：

**输出格式**：
```markdown
根据需求分析，推荐以下技术栈：

1. **Next.js + TypeScript + PostgreSQL**（首选）
   - 适合：SSR应用、SEO要求高
   - 理由：AC中有SEO需求，团队熟悉React
   
2. **Vue 3 + Vite + MySQL**（备选）
   - 适合：SPA应用、快速开发
   - 理由：开发效率高，生态成熟

排除：
- Angular：学习曲线陡，不适合本项目规模
- MongoDB：AC要求强事务，关系型数据库更合适

请回复数字（如 "1"）或描述偏好，选定后我才出具体ADR与架构图。
```

**等待用户选定**，然后写入 `02-design.md` 的 `## 0. 技术栈选定` 段。

### Step 0.5: 既有架构对齐（brownfield必跑）

**触发条件**：`CONTEXT.md` 存在且非空。新创项目跳过。

#### 0.5.1 列出触碰的既有模块

基于01-需求分析和CONTEXT.md，**grep出实际涉及的模块**：

```markdown
本次需求会触碰：
- `src/services/user-service.ts`（既有·来自grep "UserService"）
- `src/api/auth/*`（既有路由组·来自ls）
- `src/components/Modal.tsx`（既有·要复用）

会新增：
- `src/features/notifications/*`（新模块）
- `src/api/notifications/route.ts`（新路由）

不应该触碰但AI容易"顺手改"的：
- `src/services/payment-service.ts`（与本次无关，禁动）
- `src/components/Layout.tsx`（与本次无关，禁动）
```

#### 0.5.2 对齐既有抽象

| 本次需要 | 既有有没有？ | 决定 |
|---|-------------|---|
| 发HTTP请求 | `src/lib/api-client.ts` 有 | 沿用ApiClient |
| 状态管理 | package.json用zustand | 用现有store范式 |
| 表单校验 | `src/utils/validation.ts` 有 | 沿用 |
| 通知组件 | 没有 | 新建（理由：第一次有此需求）|

**禁止**："顺便引入X库"——必须写出为什么不用既有的才能引新。

#### 0.5.3 沿用模式 vs 引入新模式

```markdown
- 数据访问：**沿用** Repository模式（既有src/repos/*都是这风格）
- 错误处理：**沿用** 既有ErrorBoundary + toast通知
- API路由组织：**沿用** 既有src/api/<domain>/route.ts风格
- 通知存储：**引入新模式**（既有无对应抽象）→ 理由：通知是新业务域
```

引入新模式必须有充分理由。

#### 0.5.4 写入产物

将上面三段写入 `02-design.md` 的 `## 0.5 既有架构对齐` 段。

### Step 1: 技术决策

格式：`决策 → 备选 → 选择理由 → 取舍代价`

**示例**：
> 状态管理：选 React Context 而非 Redux。理由：状态量小（仅主题），引入Redux是过度工程。代价：跨远距离组件传递时性能不如选择器订阅，本场景不存在该问题。

**至少3个关键决策**。

### Step 1.5: Doubt反方审查（可选但推荐）

对§1中**非平凡**决策执行fresh-context反方审查：

**非平凡判定**：涉及分支逻辑/跨模块边界/类型系统无法验证的属性/影响面不可逆。

**执行路径**：
1. CLAIM - 挑出1~3条最关键决策
2. EXTRACT - 剥离推理过程，只给事实
3. DOUBT - adversarial视角审查，目标是证伪
4. RECONCILE - 分类为：契约误读/可行动/取舍/噪音

**审查通过后再进步骤2**。

### Step 2: 数据流/架构图

使用ASCII框图或文本调用链：

```
客户端 → API Gateway → Controller → Service → Repository → Database
                                    ↓
                                  Redis (缓存)
```

说明：
- 数据/事件从哪来、到哪去
- 关键状态机（如有）
- 边界（外部依赖、未触及模块）

### Step 3: ADR（架构决策记录）

凡是「以后可能被推翻」的决策，单独写ADR：

保存到 `.devflow-kit/adr/<NNN>-<title>.md`，结构：
- Context（背景）
- Decision（决策）
- Consequences（后果）

### Step 4: 风险

至少列3条：
- 实现风险
- 上线风险
- 长期债务

每条给缓解方案。

### Step 5: 不在范围内

显式列出**这次设计不解决但未来需要**的问题。

### Step 9: 架构沉淀建议

如果引入了"项目级有复用价值"的东西，记在§9。

以后A-evolve会扫这段批量同步到CONTEXT.md。

**没有就写**：`本需求无架构层面沉淀建议`。不要凑。

### Step 10: 读取模板并提取段落清单

**⚠️ 强制规则**：必须使用 `read_file` 工具读取模板文件。

```python
# 伪代码示例
read_file("templates/02-design.md")
```

**从模板中提取必填段落清单**：
```
□ 0. 技术栈选定
□ 0.5 既有架构对齐（brownfield）
□ 1. 技术决策
□ 2. 数据流/架构图
□ 3. ADR列表
□ 4. 风险
□ 5. 不在范围内
□ 9. 架构沉淀建议
```

**注意**：
- 所有8个段落都必须包含，不得省略
- brownfield项目必须有"0.5 既有架构对齐"段落
- "9. 架构沉淀建议"如无内容，填写"本需求无架构层面沉淀建议"

### Step 11: 生成产物并逐项核对

按模板生成 `.devflow-kit/<req-id>/02-design.md`：
- **必须包含模板所有8个段落**（见 Step 10 提取的清单）
- **所有 `<...>` 占位符必须替换为实际值**
- **ADR编号必须连续**

**生成后核对**：
```markdown
产物核对清单：
- ⏳ 0. 技术栈选定 → 已包含
- ⏳ 0.5 既有架构对齐 → 已包含（brownfield项目必填）
- ⏳ 1. 技术决策 → 已包含（至少3个）
- ⏳ 2. 数据流/架构图 → 已包含
- ⏳ 3. ADR列表 → 已包含（编号连续）
- ⏳ 4. 风险 → 已包含（至少2个）
- ⏳ 5. 不在范围内 → 已包含
- ⏳ 9. 架构沉淀建议 → 已包含
```

**如果有缺失**：立即补齐，不得进入下一步。

### Step 12: 更新记忆系统（DECISIONS.md）

**⚠️ 强制步骤**：设计完成后，必须将技术决策追加到记忆系统。

**执行步骤**：

1. 从 02-design.md 提取关键决策（技术栈、架构决策、ADR）

2. 追加到 `.devflow-kit/memory/DECISIONS.md`：

```markdown
## [YYYY-MM-DD] <req-id> 技术决策

### 技术栈
| 决策项 | 选择 | 理由 |
|---|------|---|
| <决策1> | <选择> | <理由> |
| <决策2> | <选择> | <理由> |

### 架构决策
| 决策项 | 选择 | 理由 |
|---|------|---|
| <决策1> | <选择> | <理由> |

### ADR
- ADR-XXX: <ADR标题>
```

3. 确认更新成功

### Step 13: 更新项目状态

```markdown
当前阶段: design
阶段状态: completed
上次完成阶段: design
下一阶段: task（或 2a-ui-design）
```

## 约束

- **角色红线 R3.1**：只产出设计，不写实现代码
- **禁止**自行决定技术栈，必须让用户从卡片中选择
- **禁止**跳过用户确认直接出ADR/架构图
- brownfield项目**必须**有禁动清单

## 自检清单

- ⏳ **已使用 read_file 读取模板文件** `templates/02-design.md`
- ⏳ **已从模板提取必填段落清单**（8个段落）
- ⏳ **已读取所有前置产物**（01-需求分析 + 00-需求确认 + 上下文）
- ⏳ **已提取所有AC列表**（用于验证设计覆盖）
- ⏳ **已识别非功能需求**（影响技术选型）
- ⏳ **已获取模式判定结果**（影响设计深度）
- ⏳ 技术栈选定有充分理由
- ⏳ 架构级变更预检已完成（Step 0₋）
- ⏳ 技术栈预选已输出5-6张卡片
- ⏳ 用户已确认技术栈
- ⏳ brownfield项目既有架构对齐已完成（含禁动清单）
- ⏳ 至少3个关键技术决策已记录
- ⏳ ADR已生成（编号连续）
- ⏳ Doubt反方审查已执行（如需要）
- ⏳ 数据流/架构图已生成
- ⏳ 至少2个风险已识别
- ⏳ **产物包含模板所有8个段落**（见 Step 11 核对清单）
- ⏳ **所有占位符已替换**
- ⏳ **生成后已逐项核对**（无缺失段落）
- ⏳ 02-design.md已生成
- ⏳ STATE.md已更新
- ⏳ **DECISIONS.md已更新**（技术决策已追加）

## 触发下一步

- 前端项目 → 加载 `skills/stage-skills/stage-2a-ui-design/_SKILL.md`
- 后端/CLI项目 → 加载 `skills/stage-skills/stage-3-task/_SKILL.md`

## 错误处理

- 技术栈选择不明确 → 继续反问直到锁定
- 既有抽象不清晰 → grep更多代码确认
- 用户要求跳过某章节 → 允许但记录原因

