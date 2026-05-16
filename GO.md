# GO — Ultimate Workflow 统一路由器（v1.0）

> **AI指令**：
> 1. 本文件是路由入口，读完后按第三步路由表匹配用户意图
> 2. **第一条回复必须输出路由声明**（含选定的模式 Fast/Standard/Strict + 理由）
> 3. **所有产物必须保存到 `.ultimate-workflow/<req-id>/` 下**
> 4. **⚠️ 所有产物必须严格按模板输出**（见 references/RULES.md R13.9）
>
> 用户使用方式：`Use ultimate-workflow` 或 `@ultimate-workflow/GO.md` + 一句话需求

---

## 🧭 快速索引

| 需要... | 读取... |
|---|---------|
| 模式判定规则 | `references/mode-rules.md` |
| 入场检测流程 | `references/entry-check.md` |
| 阶段门验证 | `references/gate-rules.md` |
| Token预算 | `references/token-budget.md` |
| 完整规则集 | `references/RULES.md` |
| Stage Skills | `skills/stage-skills/` (位于 E:\LLM\skills\ultimate-workflow) |

---

## ⚡ 执行流程（7步）

```
1. 读取项目状态 (.ultimate-workflow/STATE.md)
2. 入场检测（brownfield必跑，read_file entry-check.md）
3. 路由匹配 → 确定目标 stage skill
4. 加载 Stage Skill（只加载当前需要的，不加载全部）
5. 模式确认（read_file mode-rules.md，强制停等用户）
6. 输出路由声明
7. 执行 stage skill（按其内部Step流程）
```

**关键检查点**：
- Step 2 未输出检测结果框 → **禁止进入 Step 3**
- 情况 D/E 未等用户确认 → **禁止继续**
- Step 4 stage skill 未加载 → **禁止输出路由声明**
- Step 5 模式推荐后 → **强制停等用户确认**
- Step 7 未读模板 → **禁止输出产物**

---

## Step 1 · 读取项目状态

1. 尝试读 `.ultimate-workflow/STATE.md`。不存在 → 用模板创建
2. 关注字段：`活跃 req` / `当前阶段` / `中断任务`
3. 如存在 `中断任务` 非空 → **优先级最高**，直接走恢复分支
4. **初始化记忆系统**（首次使用必跑）:
   - 检查 `.ultimate-workflow/memory/` 是否存在
   - **如不存在** → 创建目录并初始化基础文件：
     ```
     .ultimate-workflow/memory/
     ├── PROJECT_CONTEXT.md    # 项目背景（待填充）
     ├── DECISIONS.md          # 历史决策（空）
     ├── KNOWN_FAILURES.md     # 已知失败（空）
     └── journals/             # 会话日志目录
     ```
   - **如存在** → 加载 PROJECT_CONTEXT.md、DECISIONS.md、KNOWN_FAILURES.md
5. **多项目支持说明**：
   - Ultimate Workflow **支持多项目并行**，每个项目有独立的 `.ultimate-workflow/` 目录
   - 记忆系统按项目隔离，不会跨项目共享
   - 如需切换项目，只需切换到对应项目根目录即可

---

## Step 2 · 入场检测

**⚠️ 强制规则**：必须使用 `read_file` 工具读取 `entry-check.md` 并按其决策树执行。

**检测步骤**（按顺序执行，命中即停止）：
1. 检查是否有 ai_context_doc 字段 → 情况A
2. 检查 CONTEXT.md 是否存在 + 扫描时间 → 情况B/C
3. 检查其他AI上下文文档 → 情况D → **⚠️ 停等用户确认**
4. 检查是否 greenfield → 情况F（跳过）或E → **⚠️ 停等用户确认**

**必须输出检测结果框**：
```
┌─────────────────────────────────────────────┐
│  🔍 入场检测                                 │
├─────────────────────────────────────────────┤
│  检测结果：<情况 A/B/C/D/E/F>                 │
│  项目类型：<brownfield / greenfield>         │
│  上下文文档：<路径 或 "无">                   │
└─────────────────────────────────────────────┘
```

**⚠️ 关键约束**：情况 B/C/D/E **必须等待用户回复**，不得自动继续。

**情况 D 提示文案**（标准化）：
```markdown
🔍 检测到本项目已有以下 AI 上下文文档：
- `<文件名>` (<大小>)
- `<文件名>` (<大小>)

ultimate-workflow 默认用 `.ultimate-workflow/CONTEXT.md` 作为单一源。请选择：
1. 跑项目扫描，综合现有文档 + 代码扫描，生成 `.ultimate-workflow/CONTEXT.md`（推荐）
2. 以现有文档为准（告诉我哪个），跳过扫描
3. 跳过扫描，直接进 0-confirm（不推荐 · AI 会"盲飞"）

请选 1/2/3。
```

---

## Step 3 · 路由表

### A. 用户意图路由

| 用户说 | 需求状态 | Stage Skill | 依赖 Skills |
|---|---|---|---|
| 有新想法想做件事 | 无活跃req | `stage-0-confirm` | brainstorming, writing-plans |
| 恢复中断任务 | 有中断任务 | 按R1.5重启 | - |
| 不要进入workflow | - | 直接做，跳过 | - |
| 健康检查 | - | `stage-m-health` | code-quality |
| evolve/architect | - | `stage-a-evolve` 或 `stage-a-architect` | design-and-architecture |
| 纯技术问题 | - | 直接回答 | - |
| 上传文档/PRD | - | 文档解析模式 → 00-requirements | writing-plans |
| 修复Bug | - | `stage-debug` | systematic-debugging |

### B. 可选命令

| 用户说 | Stage Skill | 说明 |
|---|---|---|
| "换个方案" | `stage-2-design` | 触发新ADR |
| "architect" | `stage-a-architect` | 架构梳理 |
| "扫描代码" | `stage-i-intel-scan` | 入场扫描 |
| "我的需求变了" | `stage-0-confirm` | 归档旧Req，重新确认 |
| "继续" | 下一阶段stage skill | 按R1.5执行 |
| "caveman extreme" | 通信压缩 | 只保留关键词+代码片段 |

### C. 阶段门验证

**⚠️ 强制规则**：必须使用 `read_file` 工具读取 `gate-rules.md`。

核心规则：缺前置产物 → 不允许直接进入，必须先补跑缺失阶段。

**阶段依赖**：`0→1→2→[2a]→3→[3a]→4→5→6→7`

**可选阶段**:
- **[2a] UI设计**: 仅前端/UI项目需要（task涉及UI文件时触发）
- **[3a] 实施计划**: 复杂项目建议使用（多任务并行、需详细时间规划）

---

## Step 4 · 加载Stage Skill

**⚠️ 渐进式披露原则**：只加载当前路由匹配的 Stage Skill，不加载全部。

**加载规则**：
1. 根据 Step 3 路由表确定目标 Stage
2. **输出加载声明**（必须包含以下信息）：
   ```markdown
   📦 正在加载 Stage Skill: <stage-name>
   - Skill路径: skills/stage-skills/<path>/_SKILL.md
   - 依赖Skills: <dependency-list 或 "无">
   - 本阶段目标: <简要描述>
   ```
3. 只加载该 Stage 的 _SKILL.md（不要加载其他 Stage）
4. 如声明 dependencies，先加载依赖 Skills
5. 如 Stage Skill 不可用，降级到 Prompt 文件

**路径模板**：
```
主流程: skills/stage-skills/stage-{0|1|2|2a|3|3a|4|5|6|7}-*/_SKILL.md
可选命令: skills/stage-skills/stage-{a|m|i}-*/_SKILL.md
```

**示例**：路由到 `stage-0-confirm` → 加载 `skills/stage-skills/stage-0-confirm/_SKILL.md`

---

## Step 5 · 模式确认

**⚠️ 强制规则**：必须使用 `read_file` 工具读取 `mode-rules.md`（如Step 2未读）。

**必须输出**（采用 stage-0-confirm 优化后的格式）：
```markdown
🎯 建议模式：<Standard / Strict>
   理由：<简要说明为什么是这个模式>

   📋 <模式> 完整流程：
   <流程步骤简述>
   
   产物：<关键产物列表>

   其他可选模式：
   - Fast — ≤3 文件、<50 行、低风险
   - Strict — 高风险/生产敏感/架构或数据影响
   
   请确认或选择其他模式：
   1. ✅ <建议模式>（推荐）
   2. Fast
   3. Strict
```

**⚠️ 强制停等**：输出后**必须等待用户确认**才能进入 Step 6。

---

## Step 6 · 输出路由声明

**模板**：
```markdown
🎯 路由声明

阶段: <stage-name>
Mode: <Fast/Standard/Strict>
Stage Skill: <path>
入口门禁: 通过
自检清单: 待执行
```

**自检清单**：
- ✅ 已读 STATE.md
- ✅ **已 read_file entry-check.md**
- ✅ **入场检测按决策树执行**（情况 D/E/C 已等待用户确认）
- ✅ 路由匹配正确
- ✅ Stage Skill已加载
- ✅ 模式已确认
- ✅ 路由声明已输出

---

## Step 7 · 执行Stage Skill

Stage Skill按 **其内部定义的Step流程** 执行（非GO.md的7步）：
1. 入口门禁检查
2. 执行Step 1-N（见stage skill的「# 执行流程」章节）
3. 产物输出前 read_file 模板
4. 执行自检清单
5. 更新 STATE.md
6. 路由到下一阶段

---

## 🔗 规格生成集成（spec-kit）

在 stage-0-confirm 中：
1. 检测 `specs/` 目录是否存在
   - 存在 → 导入 spec-kit 生成的 PRD/Plan/Tasks
   - 不存在 → 调用 `/speckit.specify` 生成
2. 补充 Brainstorming 澄清环节
3. 更新 `.ultimate-workflow/memory/DECISIONS.md`

---

## 🔄 OpenSpec 变更管理集成

在 stage-7-integration 中：
1. 创建 `openspec/changes/[req-id]/`
   - proposal.md (来自 specs/spec.md)
   - design.md (来自 .ultimate-workflow/[req-id]/02-design.md)
   - tasks.md (来自 specs/tasks.md)
2. 执行 `/opsx:archive` 归档
3. 更新 openspec/specs/ 主规格

---

## 🕸️ GitNexus 代码理解集成

在 stage-1-analysis 和 stage-6-review 中：
1. 调用 `gitnexus analyze` 更新索引
2. PreToolUse hook 增强文件搜索:
   - 查询调用链: "哪些函数调用了 auth.verify()?"
   - 查询依赖: "修改 user.ts 会影响哪些模块?"
3. PostToolUse hook 检测代码变更:
   - 如果提交后未 reindex → 提醒用户

---

## 💬 caveman 压缩级别

支持多级通信压缩：
```
/caveman lite      # 专业但简洁
/caveman full      # 经典 caveman（默认）
/caveman ultra     # 极致压缩
/caveman extreme   # 只保留关键词+代码片段
```

适用于：
- 快速状态同步
- Token 预算紧张时
- 专家用户高效沟通

---

## 版本

v1.0 - Ultimate Workflow 终极融合版
- 整合 spec-kit(规格) + devflow-kit(流程) + superpowers(纪律)
- 整合 OpenSpec(变更管理) + GitNexus(代码理解) + agent-skills(专业能力)
- 统一入口 GO.md 自动路由
- 跨会话记忆系统
- 7阶段流程 + 横向命令
