# Token 预算估算

> 本文件是 GO.md 的参考文档，按需加载。

## 典型 Token 成本表

按一个中等规模 req，前端项目，5 个 task 估算：

| 阶段 | 完整模式 | 极简模式 | 单点调用 |
|---|----------|---|----------|
| 0 + 1 + 2 + 2a + 3（规划链） | ~42k - 62k | ~30k - 45k | 按需 |
| 4 × 5 task（实施） | ~125k - 300k | ~125k - 300k | 单 task ~25k - 60k |
| 5（测试） | ~30k - 80k | ~20k - 50k | ~30k |
| 6（review） | ~25k - 50k | ~15k - 25k | ~25k |
| 7（集成归档） | ~20k - 40k | ~15k - 25k | ~20k |
| **总计** | **~240k - 530k** | ~205k - 445k | 选什么跑什么 |

---

## 真实成本影响因子

| 因子 | 影响 |
|---|------|
| 前端项目 | +20%（多 2a-ui-design 阶段） |
| 涉及 schema 变更 | +5~10%（多 schema 验证） |
| task 数 < 3 | -30%（建议走单点调用） |
| task 数 > 10 | +50%（建议拆 milestone） |

---

## 用户首轮路由后输出格式

```
✅ Token 预算估计：
   - 本次 req 规模：<small / medium / large>
   - 默认模式预估：~XXk - YYk tokens
   - 已选挡位：完整 / 极简 / 单点

✅ 是否继续？或换挡位？
   1. 完整（推荐 500+ 行 / 团队项目）
   2. 极简（100~500 行 · 非 UI 项目可跳 2a）
   3. 单点（只跑某一阶段）
   4. 不走 devflow-kit（< 50 行代码）
```

---

## 何时不必跑预算估算

- Fast 模式的小改动
- 用户已显式指定模式（如"快速加个字段"）
- 恢复中断任务（走重启协议）
- 横向命令（L-restyle / M-health）

---

## 文件加载预算

### 基础预算策略

**基础预算**：200行/轮（首轮加载reference）

**动态调整规则**：

1. **🔴 必须读取的产物**：不计入预算
   - 前置产物中的核心依赖（如01-需求分析的AC列表、02-方案设计的技术栈）
   - 模板文件（必须整读以确保格式正确）
   - Stage Skill本身（_SKILL.md全文）

2. **🟡 建议读取的产物**：计入预算，允许超额50%（最多300行）
   - 上下文文档（技术栈、编码规范）
   - lessons-learned（历史教训）
   - 参考文档的关键章节

3. **🟢 可选读取的产物**：仅在预算充足时读取
   - STATE.md（如已有中断任务则必读）
   - 辅助文档（system-architecture、design-baseline等）

### 智能筛选指南

**原则**：按需读取关键段落，而非全文照搬

**示例**：
```markdown
# 错误做法（浪费token）
整读 02-design.md（可能500+行）

# 正确做法（智能筛选）
1. 先读目录结构，定位关键章节
2. 只读 `## 0. 技术栈选定`（约30行）
3. 只读 `## 0.5.1 触碰模块`（约50行）
4. 其他章节按需读取
```

**常用筛选技巧**：
- 使用grep定位关键段落
- 优先读取标题、摘要、结论
- 跳过示例代码和冗长说明
- 缓存已读取内容，避免重复

### 分级预算参考

| Stage | 典型预算 | 说明 |
|---|---------|---|
| 0-confirm | 100行 | 简单需求确认 |
| 1-analysis | 200行 | 需读取多个前置产物 |
| 2-design | 300行 | 需读取tech-stacks参考 |
| 3-task | 200行 | 需读取AC列表+设计文档 |
| 4-dev | 150行 | 单任务执行，上下文少 |
| 5-test | 250行 | 需读取多轮测试结果 |
| 6-review | 200行 | 需读取代码+测试报告 |
| 7-integration | 300行 | 需合并多个产物 |

### 文件类型与加载策略

| 类型 | 路径 | 加载方式 |
|---|------|---|
| SPEC（项目产物）| `.devflow-evo/<id>/*.md` | 整读OK，但优先读取关键段落 |
| REFERENCE（查阅型）| `references/reference/*.md` | **禁止整读**，只读需要的节 |
| TEMPLATE / PROMPT | `templates|references/prompts/*.md` | 整读OK（必须确保格式正确） |
| STAGE SKILL | `skills/stage-skills/stage-*/*_SKILL.md` | 整读OK（执行逻辑所在） |

---

## 7级Token压缩策略（增强版）

### 压缩级别定义

| 级别 | 压缩率 | 适用场景 | 特点 | 示例 |
|------|--------|---------|------|------|
| **none** | 0% | 关键决策、安全警告、错误信息 | 绝不压缩，完整保留 | OAuth密钥管理、SQL注入警告 |
| **lite** | 20% | Phase 0战略评估、YC六问法 | 保留关键信息，移除冗余描述 | 战略决策理由 |
| **standard** | 40% | Phase 1需求分析、用户故事 | 结构化摘要，保留技术细节 | AC列表、用户故事 |
| **full** | 50% | Phase 2方案设计、ADR决策 | 保留架构决策和技术选型 | 技术栈对比、ADR |
| **ultra** | 70% | Phase 3任务拆分、依赖图 | 极简要点，仅核心逻辑 | 任务列表、ASCII图 |
| **extreme** | 90% | Phase 6代码审查、Bug报告 | 符号化表达，最大压缩率 | 审查意见、Bug描述 |
| **maximum** | 95% | 紧急清理、Token溢出 | 仅保留关键词 | 紧急情况下 |

### 自动选择规则

**基于Token使用率**:
```javascript
const usage = await tokenManager.check();

if (usage < 0.70) {
  level = 'none';      // 充足空间，不压缩
} else if (usage < 0.80) {
  level = 'lite';      // 轻度压缩
} else if (usage < 0.85) {
  level = 'standard';  // 标准压缩
} else if (usage < 0.90) {
  level = 'full';      // 完全压缩
} else if (usage < 0.95) {
  level = 'ultra';     // 超压缩
} else if (usage < 0.98) {
  level = 'extreme';   // 极限压缩
} else {
  level = 'maximum';   // 最大压缩（紧急）
}
```

**基于内容类型**:
- 安全相关 → none（绝不压缩）
- 关键决策 → lite（轻度压缩）
- 技术细节 → full（完全压缩）
- 任务列表 → ultra（超压缩）
- 审查意见 → extreme（极限压缩）

### 手动触发命令

用户可随时要求：
```
/token status     # 查看当前使用率和压缩级别
/token compress standard  # 手动切换到standard级别
/token clear      # 清空非必要上下文
```

### 压缩效果示例

**none级别**（0%压缩）:
```
WARNING: This SQL query is vulnerable to injection attacks.
You must use parameterized queries to prevent SQL injection.
Example: const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

**extreme级别**（90%压缩）:
```
⚠️ SQL注入风险 → 用参数化查询
例: pool.query('SELECT...WHERE id=$1', [userId])
```

### 各Phase推荐级别

| Phase | 推荐级别 | 原因 |
|-------|---------|------|
| Phase 0 | lite | 需要充分讨论，不宜过度压缩 |
| Phase 1 | standard | 需求细节重要，需保留上下文 |
| Phase 2 | full | 架构决策复杂，需详细记录 |
| Phase 3 | ultra | 任务列表可高度压缩 |
| Phase 4 | ultra | 代码实现，历史对话可压缩 |
| Phase 5 | ultra | 测试结果，结构化数据 |
| Phase 6 | extreme | 审查意见，要点式即可 |
| Phase 7 | ultra | 部署步骤，清单式 |
| Phase 8 | full | 经验教训，需保留细节 |

