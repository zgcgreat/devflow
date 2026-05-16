# devflow-kit Stage Orchestrator（阶段编排器）- DEPRECATED

> ⚠️ **已废弃**：GO.md 直接管理路由，不再需要 orchestrator
> 
> **保留原因**：参考设计，未来可能重新启用
>
> **当前架构**：SKILL.md → GO.md → Stage Skill（直接）

## 阶段映射表

| 阶段 | Stage Skill | Prompt文件 | 模板文件 | 状态 |
|---|-------------|---|---------|---|
| 0-confirm | `stage-0-confirm` | `references/prompts/0-confirm.md` | `templates/00-requirements.md` | ✅ |
| 1-analysis | `stage-1-analysis` | `references/prompts/1-analysis.md` | `templates/01-analysis.md` | ✅ |
| 2-design | `stage-2-design` | `references/prompts/2-design.md` | `templates/02-design.md` | ✅ |
| 2a-ui-design | `stage-2a-ui-design` | `references/prompts/2a-ui-design.md` | `templates/02a-ui-design.md` | ✅ |
| 3-task | `stage-3-task` | `references/prompts/3-task.md` | `templates/03-tasks.md` | ✅ |
| 3a-plan | `stage-3a-plan` | `references/prompts/3a-plan.md` | `templates/03a-implementation-plan.md` | ✅ |
| 4-dev | `stage-4-dev` | `references/prompts/4-dev.md` | - | ✅ |
| 5-test | `stage-5-test` | `references/prompts/5-test.md` | `templates/05-test-report.md` | ✅ |
| 6-review | `stage-6-review` | `references/prompts/6-review.md` | - | ✅ |
| 7-integration | `stage-7-integration` | `references/prompts/7-integration.md` | `templates/07-release-checklist.md` | ✅ |

## 可选命令

| 命令 | Stage Skill | 说明 | 状态 |
|---|-------------|---|------|
| A-architect | `stage-a-architect` | 架构梳理 | ✅ |
| A-evolve | `stage-a-evolve` | 架构演进 | ✅ |
| M-health | `stage-m-health` | 健康检查 | ✅ |
| I-intel-scan | `stage-i-intel-scan` | 入场扫描 | ✅ |

## 使用指南

### 方式1：通过GO.md路由（推荐）

用户输入需求 → GO.md解析意图 → 路由到对应阶段prompt → prompt加载对应stage skill

**示例**：
```markdown
用户: "实现用户通知功能"

GO.md 路由到: stage-0-confirm
  ↓ 加载: agent-skills/skills/stage-0-confirm/_SKILL.md
  ↓ 执行: 需求澄清 + 模式判定
  ↓ 产物: .devflow-kit/REQ-001/00-requirements.md
```

### 方式2：直接调用stage skill

适用于跳过前面阶段，直接进入某阶段：

```markdown
用户: "/stage 3-task"

→ 直接加载: agent-skills/skills/stage-3-task/_SKILL.md
→ 执行入口门禁检查
→ 如缺前置产物，提示补齐
```

## Stage Skill结构规范

每个stage skill必须包含：

```markdown
# devflow-kit Stage: X-Name

## Skill元信息
name, version, description, dependencies

## 输入
必需的前置产物

## 输出
本阶段生成的产物

## 入口门禁
前置产物检查逻辑

## 执行流程
Step 1, Step 2, ... Step N

## 自检清单
生成后的检查项

## 约束
本阶段的强制规则

## 触发下一步
完成后路由到哪里

## 错误处理
常见错误的处理方式
```

## 依赖管理

Stage skill可以依赖其他skill：

```yaml
dependencies:
  - brainstorming             # 通用skill
  - executing-plans     # 通用skill
  - stage-2-design       # 其他stage（少见）
```

**加载顺序**：先加载dependencies，再加载stage本身

## 状态管理

所有stage共享 `.devflow-kit/STATE.md`：

```markdown
当前阶段: task
阶段状态: completed
上次完成阶段: design
下一阶段: dev

阶段进度:
- ✅ 需求确认 → 00-requirements.md
- ✅ 需求分析 → 01-analysis.md
- ✅ 方案设计 → 02-design.md
- ✅ 任务拆分 → 03-tasks.md
- ⏳ 开发执行
- ⏳ 测试验证
- ⏳ 代码审查
- ⏳ 集成发布
```

**每个stage完成后必须更新此文件**

## 优势

### 相比纯prompt方案

1. **模块化** - 每个stage独立维护，易于测试
2. **可复用** - 其他项目可直接引用特定stage
3. **版本控制** - 每个stage有独立版本号
4. **依赖管理** - 显式声明依赖，避免遗漏
5. **降低认知负担** - AI每次只关注一个stage的逻辑

### 对弱AI友好

- ✅ 结构化的执行流程（Step 1-N）
- ✅ 明确的入口/出口检查
- ✅ 自检清单强制执行质量检查
- ✅ 错误处理指导
- ✅ 避免阅读超长GO.md

## 迁移策略

### 阶段1：双轨运行（当前）
- 保留原有prompt文件
- 新增stage skills
- GO.md同时支持两种模式

### 阶段2：逐步迁移
- 将prompt中的核心逻辑迁移到stage skill
- prompt仅保留路由和元信息
- 测试验证

### 阶段3：完全切换
- 删除冗余的prompt逻辑
- 统一使用stage skills
- GO.md简化为纯路由器

## 示例：完整执行流程

```markdown
1. 用户输入: "实现用户通知功能"

2. GO.md 解析:
   - 意图: 新需求
   - 路由: stage-0-confirm

3. 加载 stage-0-confirm:
   - 读取: agent-skills/skills/stage-0-confirm/_SKILL.md
   - 加载依赖: brainstorming, writing-plans

4. 执行 stage-0-confirm:
   - Step 1: 读取项目状态
   - Step 2: 入场检测
   - Step 3: 需求澄清
   - Step 4: 模式判定 → Standard
   - Step 5: 生成 00-requirements.md
   - Step 6: 更新项目状态

5. 路由到下一阶段:
   - 读取项目状态 → 下一阶段: analysis
   - 加载: stage-1-analysis

6. 重复步骤3-5，直到所有阶段完成
```

## 注意事项

1. **不要重复逻辑** - stage skill和prompt不要有重复的执行逻辑
2. **保持幂等性** - 同一stage多次执行应产生相同结果
3. **明确边界** - 每个stage的职责要清晰，不越权
4. **文档同步** - stage skill更新后，同步更新GO.md的说明
5. **向后兼容** - 新增stage时，确保不影响现有流程

