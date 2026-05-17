# 职责划分：Templates / Skills / Rules

> 本文档澄清 SuperCorp Ultimate 项目中 `templates/`、`skills/`、`rules/` 三个目录的职责边界和相互关系。

---

## 概览

| 目录 | 本质 | 内容 | 更新频率 |
|------|------|------|----------|
| `templates/` | **产出物模板** | 文档、会议、项目、验证报告的Markdown模板 | 低（按需更新） |
| `skills/` | **可执行技能** | _SKILL.md格式，定义执行流程和检查清单 | 中（按Phase更新） |
| `rules/` | **强制约束** | Iron Laws、Gate Conditions、Schema定义 | 高（固定不变） |

---

## templates/ — 产出物模板库

### 职责
提供**文档产出物**的标准模板，确保项目文档格式一致。

### 内容分类

#### 1. 项目管理模板
| 模板 | 用途 | 关键段落 |
|------|------|----------|
| `requirements.md` | 需求文档 | Why/What/AC/边界 |
| `roadmap.md` | 路线图 | 里程碑/时间线/依赖 |
| `milestone.md` | 里程碑 | 目标/验收标准/风险 |
| `retrospective.md` | 回顾会议 | 做得好/需改进/行动计划 |

#### 2. 技术文档模板
| 模板 | 用途 | 关键段落 |
|------|------|----------|
| `SPEC.md` | 技术规格 | Overview/API/Data Model |
| `AI-SPEC.md` | AI规格 | 能力边界/Prompt策略/失败处理 |
| `UI-SPEC.md` | UI规格 | Layout/Components/States |
| `DEBUG.md` | 调试指南 | 症状/根因/修复 |

#### 3. 验证模板
| 模板 | 用途 | 关键段落 |
|------|------|----------|
| `UAT.md` | 用户验收测试 | 场景/步骤/预期结果 |
| `SECURITY.md` | 安全审计 | 威胁建模/漏洞/修复 |
| `VALIDATION.md` | 验证报告 | 检查项/结果/签名 |

#### 4. 其他模板
| 模板 | 用途 |
|------|------|
| `state.md` | 状态文件模板 |
| `summary-*.md` | 会议纪要模板（minimal/standard/complex） |
| `codebase/` | 代码库结构模板 |
| `research-project/` | 研究项目模板 |
| `context.md` | 上下文模板 |
| `user-profile.md` | 用户画像模板 |
| `project.md` | 项目概述模板 |
| `discovery.md` | 技术调研模板 |
| `discussion-log.md` | 讨论记录模板 |

### 关键原则
- **只提供模板，不执行逻辑**
- 模板是 Markdown 文件，可直接填充
- 每个模板都有明确的"关键段落"清单
- 模板变更需要用户确认

---

## skills/ — 可执行技能库

### 职责
提供**可执行的技能模块**，每个 skill 包含完整的执行流程、自检清单和约束规则。

### 内容分类

#### Phase 1: 核心方法论
| Skill | 用途 | 触发条件 |
|-------|------|----------|
| `systematic-debugging/` | 四阶段调试方法论 | 遇到bug或问题时 |
| `tdd/` | TDD红绿重构流程 | 开发阶段选择TDD时 |
| `thinking-models/` | 推理模型（Fault Tree等） | 需要分析根因时 |
| `caveman/` | 7级Token压缩模式 | Token接近限制时 |

#### Phase 2: 代码审查
| Skill | 用途 | 触发条件 |
|-------|------|----------|
| `gstack-review/` | 深度代码审查框架 | 代码审查阶段 |

#### Phase 3: Stage执行
| Skill | 用途 | 触发条件 |
|-------|------|----------|
| `stage-skills/` | 15个Stage执行技能 | 按Phase调用 |

### 关键原则
- **每个skill都有 _SKILL.md 入口文件**
- Skill包含：执行流程 → 自检清单 → 约束 → 错误处理
- Skill可被SKILL.md主入口按需加载
- Skill之间可能有依赖关系（如tdd依赖systematic-debugging）

### Skill结构规范
```markdown
# Skill Name

## Skill元信息
name, version, description, dependencies

## 输入
需要什么信息或产物

## 输出
生成什么产物

## 执行流程
Step 1: ...
Step 2: ...

## 自检清单
- ⏳ 检查项1
- ⏳ 检查项2

## 约束
必须遵守的规则

## 触发下一步
完成后路由到哪里
```

---

## rules/ — 强制约束库

### 职责
定义**不可违反的规则**和**状态文件Schema**。

### 内容

#### 1. devflow-rules.md — 14维规则体系
定义开发流程的14个维度规则：
- R1: 需求获取（入场检测R1.11）
- R2: 需求分析（AC标准）
- R3: 方案设计（技术选型）
- R4: 任务拆分（原子化）
- R5: 代码执行（TDD优先）
- R6: **Iron Law：禁止无根因修复**
- R7: 测试验证（5轮测试）
- R8: 代码审查（3轮审查）
- R9: 集成发布（蓝绿部署）
- R10: 架构守护（架构一致性）
- R11: 性能守护（性能基准）
- R12: 安全守护（OWASP Top 10）
- R13: 监控守护（可观测性）
- R14: **Karpathy编码准则**

#### 2. caveman-rules.md — Token压缩规则
7级压缩强度（从lite到extreme），自动触发阈值：
- **Level 0 (lite)**: Token > 50% — 摘要非关键段落
- **Level 1**: Token > 60% — 移除重复示例
- **Level 2**: Token > 70% — 启用wenyan-lite模式
- **Level 3 (full)**: Token > 80% — 切换wenyan模式
- **Level 4**: Token > 85% — 强制清窗警告
- **Level 5 (ultra)**: Token > 90% — 暂停新输入
- **Level 6 (extreme)**: Token > 95% — 仅保留紧急工具

#### 3. gate-conditions.md — 质量门条件
5道质量门的触发条件和通过标准：
- **CG (Confirm Gate)**: 需求确认门
- **QG (Quality Gate)**: 质量门
- **TG (Transition Gate)**: 阶段转换门
- **Phase 0→1**: CEO+CFO联合确认
- **Release Gate**: 发布门

#### 4. schema.md — 状态文件Schema
定义所有状态文件的结构：
- STATE.md schema
- PROGRESS.md schema
- DECISIONS.md schema
- memory-index.yaml schema

### 关键原则
- **规则是不可违反的**
- 规则变更需要所有相关方同意
- 规则是最低标准，可以叠加更严格的标准
- Iron Law和Karpathy准则是核心，不可妥协

---

## 相互关系

### 加载顺序
```
SKILL.md (主入口)
  ↓
按需加载 skills/ (执行流程)
  ↓
rules/ (验证约束)
  ↓
templates/ (填充产出)
```

### 依赖关系图
```
templates/ ──────────────────────► 产出物
    ▲                                 │
    │                                 ▼
    │                            skills/
skills/ ──► 执行流程 ──► 验证 ◄──────┘
    │
    ▼
rules/ ──► 强制约束
```

### 使用场景

| 场景 | 使用的目录 |
|------|-----------|
| 新项目初始化 | templates/project.md + rules/schema.md |
| 需求分析 | skills/stage-1-analysis/ + templates/requirements.md |
| 开发阶段 | skills/tdd/ + rules/devflow-rules.md |
| 代码审查 | skills/gstack-review/ + rules/devflow-rules.md |
| Token告警 | rules/caveman-rules.md |
| 阶段转换 | rules/gate-conditions.md |

---

## 决策记录

### Q: templates/ 和 skills/ 有什么区别？

**A:** 
- `templates/` 是**文档模板**，定义文档的结构和段落
- `skills/` 是**可执行技能**，定义操作流程和检查清单

**类比：**
- templates/ = 表格模板（告诉你表格长什么样）
- skills/ = 操作手册（告诉你怎么填表）

### Q: rules/ 和 skills/ 有什么区别？

**A:**
- `rules/` 定义**不可违反的约束**（Iron Law、安全红线）
- `skills/` 定义**推荐的操作流程**（可以因地制宜）

**类比：**
- rules/ = 交通法规（禁止闯红灯）
- skills/ = 驾驶指南（建议换挡时机）

---

## 来源

本职责划分文档由 SuperCorp Ultimate 整合团队创建。
