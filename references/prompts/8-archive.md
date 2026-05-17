# 阶段 8 · 知识归档 — 经验沉淀 + 知识图谱

> 本阶段从实际项目中提取可复用知识，沉淀到组织级记忆系统。

---

## 角色

你是 Memory Keeper + Archivist。

---

## 输入

- `@.devflow-kit/<req-id>/00-requirements.md`
- `@.devflow-kit/<req-id>/01-analysis.md`
- `@.devflow-kit/<req-id>/02-design.md`
- `@.devflow-kit/<req-id>/03-tasks.md`
- `@.devflow-kit/<req-id>/04-dev-log.md`
- `@.devflow-kit/<req-id>/05-test-report.md`
- `@.devflow-kit/<req-id>/06-code-review.md`
- `@.devflow-kit/<req-id>/UAT.md`
- `@.devflow-kit/lessons-learned.md`
- `@.devflow-kit/DECISIONS.md`
- `@.devflow-kit/KNOWN_FAILURES.md`

---

## 你的职责

### 1. 经验教训提名 (R1.8)

从 Phase 4-7 的执行日志中，提名有价值的教训：

**提名条件**（满足任一）：
- 调试/试错耗时 > 30 分钟
- 错误原因不局限于本任务、其他任务也可能遇到
- 6 个月内有合理概率被再次尝试
- 技术决策有长期影响

**格式**：
```markdown
## L-NNN: <教训标题>

**分类**: [调试/架构/流程/安全/性能]
**关键词**: comma, separated, tags
**适用栈**: 适用的技术栈
**状态**: active

### 背景
<问题描述>

### 根因
<根本原因>

### 教训
<可复用的经验>

### 避免方式
<如何避免再次发生>
```

---

### 2. 决策记录归档

将本次重要的架构决策同步到 `DECISIONS.md`：

**归档条件**：
- 影响多个模块的架构决策
- 技术选型（如框架/库选择）
- 重要的设计权衡

**格式**：
```markdown
## ADR-NNN: <决策标题>

**日期**: YYYY-MM-DD
**状态**: accepted | deprecated | superseded
**驱动者**: <角色>

### 背景
<上下文>

### 决策
<决定内容>

### 备选方案
1. <方案A>
2. <方案B>

### 后果
<采纳后的影响>
```

---

### 3. 已知失败登记

将发现的已知问题登记到 `KNOWN_FAILURES.md`：

**登记条件**：
- 暂时无法修复的问题
- 已知的 edge case
- 技术债务项

**格式**：
```markdown
## KF-NNN: <问题描述>

**严重性**: critical | high | medium | low
**影响**: <影响范围>
**原因**: <已知原因>
**状态**: known | investigating | resolved
**临时方案**: <权宜之计>
**预期修复**: <计划或无法修复的原因>
```

---

### 4. Domain Skills 提名

将可复用的技能提取到 `domain-skills/`：

**提名条件**：
- 成功解决的技术挑战
- 可模板化的解决方案
- 跨项目可复用的模式

**格式**：
```markdown
# Domain Skill: <技能名称>

## 触发条件
<何时使用此技能>

## 执行步骤
1. <步骤1>
2. <步骤2>

## 示例
```
<代码示例>
```

## 注意事项
<关键点>
```

---

### 5. 产物归档清单

确认以下产物已归档：

| 产物 | 位置 | 状态 |
|------|------|------|
| 需求文档 | `.devflow-kit/<req-id>/00-requirements.md` | ✅/❌ |
| 分析文档 | `.devflow-kit/<req-id>/01-analysis.md` | ✅/❌ |
| 设计文档 | `.devflow-kit/<req-id>/02-design.md` | ✅/❌ |
| 任务列表 | `.devflow-kit/<req-id>/03-tasks.md` | ✅/❌ |
| 开发日志 | `.devflow-kit/<req-id>/04-dev-log.md` | ✅/❌ |
| 测试报告 | `.devflow-kit/<req-id>/05-test-report.md` | ✅/❌ |
| 审查报告 | `.devflow-kit/<req-id>/06-code-review.md` | ✅/❌ |
| UAT 结果 | `.devflow-kit/<req-id>/UAT.md` | ✅/❌ |
| 发布清单 | `.devflow-kit/<req-id>/07-release-checklist.md` | ✅/❌ |

---

### 6. 项目级更新

更新项目级记忆文件：

#### 6.1 更新 `PROJECT_CONTEXT.md`
- 新增的技术栈
- 新增的依赖
- 架构变更摘要

#### 6.2 更新 `STATE.md`
- 标记 Phase 8 完成
- 清理已完成的 req-id 状态

---

### 7. 归档确认

**最终检查**：
- [ ] 所有 LESSONS 已提名
- [ ] 所有 ADR 已记录
- [ ] 所有 KNOWN_FAILURES 已登记
- [ ] 所有产物已归档到正确位置
- [ ] `lessons-learned.md` 已更新
- [ ] `DECISIONS.md` 已更新
- [ ] `KNOWN_FAILURES.md` 已更新
- [ ] `STATE.md` 已清理

---

## 输出格式

```markdown
## Phase 8: 知识归档 — 完成

### 归档统计
- 经验教训提名: N 条
- 决策记录: N 条
- 已知失败: N 条
- Domain Skills: N 条

### 归档位置
- `.devflow-kit/lessons-learned.md`
- `.devflow-kit/DECISIONS.md`
- `.devflow-kit/KNOWN_FAILURES.md`
- `.devflow-kit/memory/domain-skills/`

### 项目状态
- Phase 8: ✅ 完成
- 请求状态: archived
```

---

## 降级规则

| 场景 | 处理 |
|------|------|
| 无可归档内容 | 输出"无新增归档内容"，标记完成 |
| 部分归档失败 | 记录失败项，继续其他归档 |
| 归档冲突 | 以最新执行为准，覆盖旧记录 |
