# 渐进式披露规则 (Progressive Disclosure)

> 本规则从 unified-platform 适配，优化大规模项目中的 Reference 加载策略，避免一次性加载所有内容导致 Token 浪费。

---

## 核心原则

**按需加载，不过早披露。**

- AI 不应在 Phase 开始时加载所有可能的 Reference
- 应根据当前 Phase 和具体任务类型，按需加载相关文件
- Token 预算紧张时，优先加载高价值 Reference

---

## Phase 加载策略

### Phase 0: 战略评估

| 加载内容 | 不加载内容 |
|---------|-----------|
| SKILL.md (入口) | Phase 2+ 的 Architecture/Security 规则 |
| GO.md (路由) | 具体的测试/审查规则 |
| LESSONS.md (相关历史) | 多项目管理文档 |

**加载优先级**:
1. `SKILL.md` — 确认当前模式
2. `GO.md` — 路由决策
3. `references/mode-rules.md` — 模式判定

---

### Phase 1: 需求分析

| 加载内容 | 不加载内容 |
|---------|-----------|
| `grill/` (需求追问) | Phase 4+ 的实现规则 |
| `references/RULES.md` R1-R3 | 测试覆盖率规则 |
| `L1-INTERACTION/phase-1-5whys/_SKILL.md` | Phase 1 追问流程 |

**加载优先级**:
1. `L1-INTERACTION/phase-1-5whys/_SKILL.md` → Grill (Phase 1)
2. `references/RULES.md` (R1-R3 状态管理/阶段门/角色红线)
3. `templates/requirements.md`

---

### Phase 2: 方案设计

| 加载内容 | 不加载内容 |
|---------|-----------|
| `references/RULES.md` R1-R7 | Phase 4+ 的 TDD 规则 |
| `references/SECURITY.md` (架构阶段) | 测试覆盖率要求 |
| `references/gate-rules.md` (G2) | 具体的代码审查项 |

**加载优先级**:
1. `references/RULES.md` (全量或按节)
2. `references/SECURITY.md` (架构设计阶段)
3. `references/gate-rules.md`

---

### Phase 3: 任务拆分

| 加载内容 | 不加载内容 |
|---------|-----------|
| `references/RULES.md` R1-R9 | Phase 6 的审查规则 |
| `references/entry-check.md` | 具体的 XSS/SQL 防护 |
| `L1-INTERACTION/phase-3-task-plan/_SKILL.md` | Phase 3 任务拆分流程 |

---

### Phase 4: 实施开发

| 加载内容 | 不加载内容 |
|---------|-----------|
| `references/RULES.md` R4-R5 (提交/测试) | Phase 6 审查规则 |
| `references/caveman-rules.md` (按需) | 全量安全文档 |
| Phase 对应的 Bundle 规则 | 其他 Phase 规则 |

**Token 预算紧张时**:
- 优先加载 `RULES.md` R4-R5
- caveman 压缩按需启用

---

### Phase 5: 测试验证

| 加载内容 | 不加载内容 |
|---------|-----------|
| `references/RULES.md` R5 (测试纪律) | Phase 4 的实现规则 |
| `references/gate-rules.md` (G5) | Phase 6 审查规则 |
| 测试金字塔文档 | 全量提交规则 |

---

### Phase 6: 代码审查

| 加载内容 | 不加载内容 |
|---------|-----------|
| `references/RULES.md` R6 (反幻觉) | Phase 4 实现细节 |
| `references/SECURITY.md` (安全检查) | Phase 2 架构设计 |
| `references/gate-rules.md` (G6) | Phase 0-1 需求文档 |

**加载优先级**:
1. `RULES.md` R6 (Critical)
2. `SECURITY.md` (Phase 6 安全审查清单)
3. `gate-rules.md` G6

---

### Phase 7: 集成发布

| 加载内容 | 不加载内容 |
|---------|-----------|
| `references/RULES.md` R4 (提交规则) | Phase 4-5 开发/测试规则 |
| `references/gate-rules.md` (G7) | Phase 6 审查细节 |
| Canary 发布流程 | 详细的测试用例 |

---

### Phase 8: 知识归档

| 加载内容 | 不加载内容 |
|---------|-----------|
| `references/RULES.md` R1.8 (经验扫描) | Phase 4-7 执行规则 |
| LESSONS.md 模板 | 提交规范 |
| 全量 RULES.md (归档参考) | — |

---

## Reference 按节读取规则

### 禁止整读的文件

| 文件 | 读取方式 |
|------|---------|
| `RULES.md` | 按 R1-R14 分节读取 |
| `SECURITY.md` | 按具体需求读对应节 |
| `gate-rules.md` | 按 Phase 读对应 Gate |

### 可以整读的文件（<150行）

| 文件 | 原因 |
|------|------|
| `entry-check.md` | 仅有 111 行 |
| `mode-rules.md` | 内容精简 |
| `token-budget.md` | 简短参考 |

---

## 加载声明格式

每次 Phase 进入时，AI 应在路由声明中列出：

```
已加载 Reference:
- references/RULES.md [R1-R3] (状态管理/阶段门/角色红线) — 45行
- templates/requirements.md — 示例声明
Token 预算: ~1200 / 1500 remaining
```

---

## 降级策略

| 场景 | 行为 |
|------|------|
| Token 使用率 > 85% | 停等用户，选择性卸载低优先级 Reference |
| Reference 文件 > 150 行 | 必须按节读取，禁止整读 |
| Phase 内重复加载同一文件 | 检查是否已缓存，避免重复 |

---

## 快速查询表

| 需要查... | 去哪里 |
|----------|--------|
| 当前 Phase 该做什么 | SKILL.md → Phase 概述 |
| 状态管理规则 | RULES.md → R1 |
| 阶段门条件 | gate-rules.md → 对应 Gate |
| 安全编码规范 | SECURITY.md → 按节 |
| Token 压缩 | caveman-rules.md → 按级别 |
| 测试纪律 | RULES.md → R5 |
| 提交格式 | RULES.md → R4 |
