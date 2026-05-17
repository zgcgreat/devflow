# RULES v3.0 — 终极工作流规则集 (R1-R20)

> **版本**: v3.0-draft  
> **创建日期**: 2026-05-17  
> **融合来源**: devflow-kit RULES.md + Mega-Workflow R1-R15 + SuperCorp Phase Rules + Karpathy Coding Principles  
> **适用范围**: ultimate-workflow 全流程 Phase 0-8

---

## R1 · PRD 驱动

- **R1.1** 无 PRD 不开发：Phase 3+ 必须有正式 `00-requirements.md`
- **R1.2** PRD 必须包含：需求背景、验收标准（AC）、范围排除项、影响范围分析
- **R1.3** PRD 版本管理：每次重大变更追加版本号，保留历史 PRD
- **R1.4** PRD 确认门控（G1）：Phase 0 YC 六问通过后自动生成 PRD，需用户显式确认
- **R1.5** Brownfield 项目必须在 PRD 中标注既有依赖和不可修改区域

## R2 · 三档模式自动判定

- **R2.1** Fast 模式：单文件改动 < 50 行，或用户说"快"
- **R2.2** Standard 模式：默认模式，跑完整 Phase 流程
- **R2.3** Strict 模式：关键任务、Breaking Change、多模块联动时自动升级
- **R2.4** 模式降级/升级必须显式声明触发信号和裁剪内容（见 GO.md「模式降级评估」）
- **R2.5** 降级前暂停询问用户，升级前反问用户确认

## R3 · 入场检测（Brownfield 必跑）

- **R3.1** 进入任何需求相关阶段前必须输出入场检测结果框
- **R3.2** 检测结果框包含：情况判定（A/B/C/D/E/F）、项目类型、上下文文档路径
- **R3.3** Brownfield 检测结果为"待用户确认"（情况 D/E）→ 禁止继续，等用户回复
- **R3.4** Greenfield 项目自动跳过入场检测并标注原因

## R4 · Stage 门禁（前置产物强制）

- **R4.1** Phase N+1 进入前必须验证 Phase N 的产物文件存在且非空
- **R4.2** 缺上游产物必须回退生成，禁止伪造"已满足"
- **R4.3** Verify 未通过禁止标记阶段完成
- **R4.4** 前端/UI 任务缺 `02a-ui-design.md` 禁止进入 DEV（纯后端可跳过 2a）
- **R4.5** Phase 6 审查 Critical 项必须修复或显式接受后才能进入 Phase 7

## R5 · 渐进式披露（Token 优化）

- **R5.1** 只加载当前 Stage Skill，不预加载后续阶段文件
- **R5.2** Reference 按节读取：禁止整读 > 500 行的 reference 文件，用 grep 定位节起始行 + read offset/limit
- **R5.3** Token 预算控制：进入任何阶段的首轮消息，加载的 reference/* 总行数 ≤ 150 行（Standard）/ ≤ 100 行（Strict）
- **R5.4** Phase 0 → R1-R9；Phase 1 → + R10-R12；Phase 2 → + R13-R15；Phase 3+ → 全部加载

## R6 · Token 压缩策略

- **R6.1** Full 压缩（默认）：wenyan-style 文言压缩，保留结构
- **R6.2** Ultra 压缩：上下文 > 100K tokens 时触发，压缩率 ~75%
- **R6.3** Extreme 压缩：上下文 > 180K tokens 时触发，压缩率 ~90%，仅保留关键决策点
- **R6.4** 压缩后必须校验可逆性：能无损还原到原始信息

## R7 · Agent 上下文隔离

- **R7.1** Orchestrator 上下文 ~50K tokens（承载路由声明 + 阶段状态）
- **R7.2** Research/Execution Agent 各自 ~200K fresh context，会话隔离不共享记忆
- **R7.3** Agent 间手调用标准化消息格式（见 CLOSED-LOOP-LOGGING.md heartbeat/handoff protocol）
- **R7.4** 换角色必须清窗或重置上下文

## R8 · Wave 并行执行（DAG 拓扑排序）

- **R8.1** Phase 3+ 的任务按依赖关系构建 DAG，用 Kahn 算法做拓扑排序
- **R8.2** 无依赖任务分配到同一 Wave 并行执行，Worker 数 ≤ CPU 核心数
- **R8.3** Wave N 完成后生成 SUMMARY-WAVE-{N}.md，注入到 Phase N+1 的 Agent context
- **R8.4** Wave 内任务失败 → 停止该 Wave 剩余任务 → 记录 LESSON → 回滚未合并改动
- **R8.5** Heartbeat 检查点格式：`[checkpoint][wave:N][task:X]`

## R9 · LearningWorkflow（自进化）

- **R9.1** Phase 完成后必须从 LESSONS.md 中加载相关经验到当前工作 context
- **R9.2** Phase 7+ 阶段结束前必须提名新 LESSON 条目（格式：L-NNN）
- **R9.3** Domain Skills Promotion：同一 LESSON 被引用 ≥ 3 次 → 持久化到 `memory/domain-skills/`
- **R9.4** 跨波上下文读取：Wave N+1 Execution Agent 启动前必须读取 SUMMARY-WAVE-{N} + LESSONS 中相关条目

## R10 · Provider 路由（模型选择）

- **R10.1** 按任务类型选模型/Provider（详见本条 R10.2-R10.4）
- **R10.2** Research Agent → 推理能力强的 model；Execution Agent → 编码速度快的 model
- **R10.3** Phase 2a UI Design → 需要视觉理解能力的 model
- **R10.4** Phase 6 Review → 需要严格逻辑的 model

## R11 · Delta Specs 差量规范（Brownfield 并行）

- **R11.1** Brownfield 修改已有项目时，优先用 delta spec（`changes/<feature>/delta-spec.md`）而非重写完整文档
- **R11.2** Delta markers: `[ADDED]` / `[MODIFIED]`（保留原文上下文+diff块）/ `[REMOVED]`（附删除理由）/ `[RENAMED]`
- **R11.3** 多人并行修改同一条目 → MERGE_CONFLICT，prompt user resolve；不同条目 → auto-merge
- **R11.4** Greenfield 首次创建 spec → Full Spec（delta spec 收益有限）
- **R11.5** Delta spec 完整定义见 `references/delta-specs.md`

## R12 · GitNexus 可选检测

- **R12.1** `gitnexus --version` → 成功则启用增强代码理解；失败则引导安装或走 grep fallback
- **R12.2** Grep Fallback：文件搜索用 glob + grep，调用链分析用 grep -rn，依赖影响用静态分析
- **R12.3** GitNexus 未安装时的降级能力矩阵见 V3-ARCHITECTURE.md「Grep Fallback 能力矩阵」

## R13 · 双阶段审查（Phase 6）

- **R13.1** Stage A: Acceptance Auditor spec compliance check → NOT_PASS → 退回 Phase 3/4
- **R13.2** Stage B (仅当 Stage A PASS): Blind Hunter + Edge Case Hunter 并行 code review
- **R13.3** Critical 项必须修复或显式接受，否则禁止进入 Phase 7
- **R13.4** 审查报告格式见 `layers/L1-INTERACTION/phase-6-review/_SKILL.md`

## R14 · Canary 发布（Phase 7）

- **R14.1** 三阶段灰度：10% → 50% → 100%，每阶段自动健康检查
- **R14.2** 异常指标超过阈值 → 自动回滚 + 记录 LESSON
- **R14.3** 发布前必须确认 Phase 6 审查项全部关闭

## R15 · 设计枪战（Phase 2a，前端/UI 必跑）

- **R15.1** 产出 4-6 个设计变体（跨 layout / interaction / visual complexity）
- **R15.2** AI 推荐带可维护性评分（基于组件复用率、CSS 复杂度、无障碍覆盖率）
- **R15.3** 用户选择后固化最终方向到 `02a-ui-design.md`
- **R15.4** Brownfield 项目必走视觉语汇对齐（观察现有设计系统，输出对比报告）

## R16 · 跨波上下文注入

- **R16.1** Wave N SUMMARY → Phase N+1 Agent context 自动注入
- **R16.2** LESSONS deduplication：同名 LESSON 条目合并，仅保留最新版本
- **R16.3** Cross-wave Context Reading Protocol（见 MEMORY-MANAGER.md）

## R17 · 原子提交规范

- **R17.1** 每 Wave 一个 commit，commit message 格式：`<type>(<req-id>): <task-id> <subject>`
- **R17.2** Commit type：feat / fix / refactor / test / docs / chore
- **R17.3** 代码改动必须伴随测试改动（R5.2）
- **R17.4** Bug 修复必须伴随回归测试（R5.3）

## R18 · Heartbeat 检查点协议

- **R18.1** 格式：`[checkpoint][wave:N][task:X]`
- **R18.2** 每完成一个 task 输出 heartbeat，记录状态和产物路径
- **R18.3** 连续 2 个 heartbeat 失败 → 触发 Investigator specialist（见 ROLE-DISPATCH.md）

## R19 · Domain Skills Promotion

- **R19.1** LESSONS → `memory/domain-skills/` 持久化（频率 ≥ 3 次触发）
- **R19.2** Domain Skill 格式：YAML frontmatter + Markdown implementation steps
- **R19.3** Cross-wave injection：Wave N+1 Agent 加载时自动 include 相关 domain skills（≤ 5 skills, ~200K tokens）

## R20 · 产物模板强制

- **R20.1** 输出任何产物前必须先读取对应模板文件（`templates/*.md`）
- **R20.2** 产物必须包含模板所有必填段落，不得省略或改写结构
- **R20.3** 占位符（如 `<req-id>`、`<task-id>`）必须替换为实际值
- **R20.4** 模板校验失败 → 立即补齐后再标记完成，禁止声称"已完成"但产物不完整
- **R20.5** 产物文件长度 ≤ 500 行（多数 < 200 行），超过则拆 `-a.md` / `-b.md`

## R21 · 向后兼容

- **R21.1** v3.0 产物零改动可迁移到 v1.0 流程使用
- **R21.2** `.devflow-kit/` 目录结构保持与 devflow-kit 兼容
- **R21.3** STATE.md 状态机枚举（not_started / in_progress / waiting_user_confirmation / completed / blocked / skipped）保持不变

---

## 违规处理

检测到自己即将违反任一规则时，先输出：

```
规则 R{编号} 触发：<原因>。需要人工决策。
```

然后停下等待，**禁止"自我授权"绕开规则**。

---

## AI 常见违规行为速查

| 违规行为 | 触发规则 | 正确做法 |
|----------|----------|----------|
| 未输出入场检测结果框就进入路由 | R3.1 / R3.2 | 先输出检测结果框 |
| Brownfield 情况 D/E 自行跳过 | R3.3 | 停等用户确认 |
| 未加载 skill 就输出路由声明 | R5.1 | 先加载所有 skill |
| 未读模板就输出产物 | R20.1 | 先读取模板文件 |
| 产物遗漏模板段落 | R20.2 | 包含所有必填段落 |
| Verify 未通过就标记完成 | R4.3 | verify 必须通过 |
| 整读 reference 文件 | R5.2 | 按节读取 |
| 悄悄扩大范围 | R7.1（Scope） | 先停下更新任务拆分 |
| 自行决定模式降级 | R2.5 | 询问用户确认 |
| Wave task 连续失败无 heartbeat | R18.3 | 触发 Investigator specialist |

---

## 规则演进历史

- **v3.0-draft (2026-05-17)**: 初始版本，融合 devflow-kit + mega-workflow + supercorp
- **R1-R9**: 流程基础（PRD → 模式判定 → 入场检测 → 门禁 → Token 优化 → Agent 隔离 → DAG → LearningWorkflow → Provider）
- **R10-R21**: 执行保障（Delta Specs → GitNexus → 审查 → Canary → 设计枪战 → 跨波注入 → 原子提交 → Heartbeat → Domain Skills → 模板强制 → 向后兼容）

