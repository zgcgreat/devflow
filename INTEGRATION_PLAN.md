# devflow 增强集成方案

**目标**: 以devflow为主，集成其他两个项目的优势特性  
**时间**: 2026-05-17

---

## 📊 可集成特性清单

### 来自 supercorp-ultimate (高优先级)

| 特性 | 价值 | 集成难度 | 优先级 |
|------|------|---------|--------|
| **1. Team-Skills记忆系统** | ⭐⭐⭐⭐⭐ | 低 | P0 |
| **2. 37个产物模板** | ⭐⭐⭐⭐⭐ | 低 | P0 |
| **3. 入场检测协议** | ⭐⭐⭐⭐ | 中 | P1 |
| **4. Token自动监控** | ⭐⭐⭐⭐ | 中 | P1 |
| **5. 钩子系统** | ⭐⭐⭐ | 中 | P2 |
| **6. 规则系统** | ⭐⭐⭐ | 低 | P2 |

---

### 来自 unified-platform (高优先级)

| 特性 | 价值 | 集成难度 | 优先级 |
|------|------|---------|--------|
| **1. 多项目管理** | ⭐⭐⭐⭐⭐ | 中 | P0 |
| **2. 插件系统** | ⭐⭐⭐⭐⭐ | 高 | P0 |
| **3. 安全编码规范(R7)** | ⭐⭐⭐⭐ | 低 | P1 |
| **4. 渐进式披露机制** | ⭐⭐⭐⭐ | 低 | P1 |

---

## 🎯 Phase 1: P0特性集成（立即执行）

### 1.1 Team-Skills记忆系统（来自supercorp-ultimate）

#### 为什么需要？

devflow当前只有基础memory/目录，缺少：
- ❌ 记忆索引和健康监控
- ❌ 决策记录(ADR)标准化
- ❌ 已知失败模式库
- ❌ Session关闭检查清单

#### 集成方案

**步骤1: 复制11个记忆文件**

```bash
# 从supercorp-ultimate复制到devflow
cp supercorp-ultimate/memory-index.yaml devflow/.devflow/
cp supercorp-ultimate/PROJECT_CONTEXT.md devflow/.devflow/memory/
cp supercorp-ultimate/CURRENT_STATE.md devflow/.devflow/memory/
cp supercorp-ultimate/DECISIONS.md devflow/.devflow/memory/
cp supercorp-ultimate/KNOWN_FAILURES.md devflow/.devflow/memory/
cp supercorp-ultimate/LEARNING_BACKLOG.md devflow/.devflow/memory/
cp supercorp-ultimate/TEAM_PREFERENCES.md devflow/.devflow/memory/
cp supercorp-ultimate/USER_PROFILE.md devflow/.devflow/memory/
cp supercorp-ultimate/AGENT_NOTES.md devflow/.devflow/memory/
cp supercorp-ultimate/SESSION_CLOSE_CHECKLIST.md devflow/.devflow/memory/
cp supercorp-ultimate/VERIFICATION_BASELINE.md devflow/.devflow/memory/
```

**步骤2: 更新SKILL.md引用**

在SKILL.md的Phase 8归档章节添加：

```markdown
### Phase 8: 知识归档（增强版）

**使用Team-Skills记忆系统**:

1. **更新memory-index.yaml**
   - 记录本次Session状态
   - 更新健康度指标

2. **沉淀到对应文件**:
   - 技术决策 → DECISIONS.md (ADR格式)
   - 踩坑经验 → KNOWN_FAILURES.md
   - 待学习项 → LEARNING_BACKLOG.md
   - 项目状态 → CURRENT_STATE.md

3. **Session关闭检查**:
   - 参考SESSION_CLOSE_CHECKLIST.md
   - 确保所有产物完整
   - 标记未完成事项
```

**步骤3: 集成LearningWorkflow**

将Team-Skills与SEP的LearningWorkflow结合：

```markdown
LearningWorkflow + Team-Skills 协同:

1. Wave执行失败 → 提取教训
2. 写入 LEARNING_BACKLOG.md
3. LearningWorkflow分析 → 生成LESSONS.md
4. 重要教训 → KNOWN_FAILURES.md
5. 下次Wave启动 → 自动加载相关教训
```

**预期收益**:
- ✅ 记忆系统结构化（11个文件各司其职）
- ✅ 决策可追溯（ADR标准格式）
- ✅ 避免重复踩坑（KNOWN_FAILURES库）
- ✅ Session连续性（CURRENT_STATE追踪）

---

### 1.2 37个产物模板（来自supercorp-ultimate）

#### 为什么需要？

devflow缺少实际模板文件，AI需要从零生成产物。

#### 集成方案

**步骤1: 复制templates目录**

```bash
# 完整复制templates目录
cp -r supercorp-ultimate/templates/ devflow/templates/
```

**步骤2: 分类整理**

```
devflow/templates/
├── phase-templates/          # Phase相关模板
│   ├── strategy.md           ← Phase 0
│   ├── requirements.md       ← Phase 1
│   ├── research.md           ← Phase 2
│   ├── spec.md               ← Phase 2a
│   ├── milestone.md          ← Phase 3
│   ├── verification-report.md ← Phase 5
│   └── retrospective.md      ← Phase 8
│
├── agent-prompts/            # Agent提示词模板
│   ├── ceo-prompt.md
│   ├── architect-prompt.md
│   ├── developer-prompt.md
│   └── ...
│
├── codebase/                 # 代码模板
│   ├── nextjs-starter/
│   ├── react-component/
│   └── api-endpoint/
│
├── research-project/         # 研究项目模板
│   ├── market-analysis.md
│   ├── competitor-analysis.md
│   └── ...
│
└── utilities/                # 工具模板
    ├── README.md
    ├── DEBUG.md
    ├── SECURITY.md
    └── ...
```

**步骤3: 更新SKILL.md引用**

在每个Phase说明中添加模板引用：

```markdown
### Phase 0: 战略评估

**使用模板**: `templates/phase-templates/strategy.md`

AI基于模板生成STRATEGY.md，确保：
- YC六问法完整回答
- 风险评分表格化
- 推荐模式明确
```

**预期收益**:
- ✅ 产物标准化（统一格式）
- ✅ AI效率提升（无需从零生成）
- ✅ 质量一致性（模板保证完整性）

---

### 1.3 多项目管理（来自unified-platform）

#### 为什么需要？

专业用户同时管理多个项目，需要工作区概念。

#### 集成方案

**步骤1: 创建工作区结构**

```bash
mkdir -p devflow/.ultimate-workspace/projects
touch devflow/.ultimate-workspace/active-project.txt
```

**步骤2: 创建config.yaml模板**

```yaml
# .ultimate-workspace/config.yaml
version: "3.0"
workspace_name: "My Projects"
created_at: "2026-05-17T10:00:00Z"

projects: []

settings:
  auto_switch: true
  max_projects: 10
  cleanup_archived: true
  archived_retention_days: 30
```

**步骤3: 添加管理命令到SKILL.md**

在SKILL.md横向命令章节后添加：

```markdown
---

## 📂 多项目管理

### 常用命令

| 命令 | 功能 |
|------|------|
| `/workspace init` | 初始化工作区 |
| `/projects list` | 列出所有项目 |
| `/projects new <name>` | 创建新项目 |
| `/projects switch <id>` | 切换项目 |
| `/projects archive <id>` | 归档项目 |
| `/workspace stats` | 工作区统计 |

### 工作流程

**创建第一个项目**:
```
/workspace init
/projects new "每日简报应用"
```

**创建第二个项目**:
```
/projects new "电商平台"
```

**切换项目**:
```
/projects switch 每日简报应用
```

**查看统计**:
```
/workspace stats
```

### 状态同步

切换项目时自动：
1. 保存当前项目状态到 `.ultimate-workspace/projects/<id>.yaml`
2. 加载目标项目状态
3. 更新 `active-project.txt`
4. 恢复记忆系统（PROJECT_CONTEXT、CURRENT_STATE等）

### 跨项目知识共享

可选配置：
```yaml
knowledge_sharing:
  enabled: true
  share_decisions: true
  share_best_practices: true
  share_failures: true
```

启用后，KNOWN_FAILURES.md和DECISIONS.md在工作区内共享。
```

**步骤4: 创建项目元数据模板**

```yaml
# .ultimate-workspace/projects/template.yaml
id: "<project-id>"
name: "<project-name>"
description: ""
created_at: ""
updated_at: ""

status: "active"  # active | inactive | archived
phase: 0
progress: 0

tech_stack: []

stats:
  total_sessions: 0
  total_time_minutes: 0
  phases_completed: []
  gates_passed: []
  bugs_found: 0
  bugs_fixed: 0

tags: []

team: []
```

**预期收益**:
- ✅ 支持多项目并行开发
- ✅ 项目间快速切换
- ✅ 状态自动同步
- ✅ 知识跨项目复用

---

### 1.4 插件系统（来自unified-platform）

#### 为什么需要？

允许社区扩展功能，形成生态系统。

#### 集成方案

**步骤1: 创建插件目录结构**

```bash
mkdir -p devflow/.devflow/plugins
cat > devflow/.devflow/plugins/installed.json << EOF
{
  "version": "3.0",
  "plugins": []
}
EOF
```

**步骤2: 定义plugin.json标准**

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "",
  "author": {
    "name": "",
    "email": "",
    "url": ""
  },
  "license": "MIT",
  
  "ultimate_workflow": {
    "min_version": "3.0.0",
    "max_version": "4.0.0"
  },
  
  "type": "phase-extension",  // phase-extension | gate-enhancement | agent-extension | template-pack | command-tool
  
  "extends": {
    "phase": 9,
    "insert_after": 8
  },
  
  "dependencies": [],
  
  "files": {
    "skill": "SKILL.md",
    "agent": "agent.md",
    "template": "template.md"
  },
  
  "commands": [],
  "keywords": [],
  
  "repository": {
    "type": "git",
    "url": ""
  }
}
```

**步骤3: 添加插件命令到SKILL.md**

```markdown
---

## 🔌 插件系统

### 常用命令

| 命令 | 功能 |
|------|------|
| `/plugins search <keyword>` | 搜索插件市场 |
| `/plugins install <name>` | 安装插件 |
| `/plugins enable <name>` | 启用插件 |
| `/plugins disable <name>` | 禁用插件 |
| `/plugins update <name>` | 更新插件 |
| `/plugins uninstall <name>` | 卸载插件 |
| `/plugins list` | 列出已安装插件 |
| `/plugins create <name>` | 创建新插件 |

### 插件类型

1. **Phase扩展** - 添加新Phase（如Phase 9: 用户反馈）
2. **Gate增强** - 增强质量门控（如SAST/DAST检查）
3. **Agent扩展** - 添加新角色（如AI伦理顾问）
4. **Template包** - 添加新模板（如GDPR合规模板）
5. **Command工具** - 添加新命令（如性能分析器）

### 示例：安装安全审计插件

```
/plugins search security
/plugins install security-audit-plus
/plugins enable security-audit-plus
```

安装后：
- Gate 4增加SAST/DAST检查
- 新增 `/security scan` 命令
- 自动集成SonarQube、OWASP ZAP

### 开发插件

**创建新插件**:
```
/plugins create my-plugin
```

自动生成：
- plugin.json（元数据）
- SKILL.md（Skill定义）
- README.md（使用说明）

**测试插件**:
```
/plugins test ./my-plugin
```

**提交到市场**:
```
/plugins submit ./my-plugin
```

### 安全机制

- **沙箱隔离**: 插件运行在受限环境
- **权限声明**: 最小权限原则
- **签名验证**: 防止篡改
- **审核流程**: 官方市场审核

### 插件市场

未来规划：
- https://plugins.devflow.dev/
- 分类浏览
- 评分和评论
- 一键安装
```

**步骤4: 创建示例插件**

```bash
mkdir -p devflow/examples/plugins/custom-phase-9
```

创建完整的Phase 9插件示例（参考unified-platform/PLUGIN_SYSTEM.md）。

**预期收益**:
- ✅ 功能可扩展（社区贡献）
- ✅ 生态繁荣（插件市场）
- ✅ 定制化强（按需安装）
- ✅ 安全性高（沙箱隔离）

---

## 🎯 Phase 2: P1特性集成（本周完成）

### 2.1 入场检测协议（来自supercorp-ultimate）

#### 集成方案

在SKILL.md的Phase 0开头添加入场检测：

```markdown
### Phase 0: 战略评估

**入场检测（最优先）**:

```markdown
## 入场检测

**情况判定**: [A/B/C/D/E/F]
- A: greenfield新项目，无上下文
- B: greenfield有零星上下文
- C: brownfield有完整上下文
- D: brownfield待用户确认上下文
- E: brownfield上下文缺失
- F: 文档解析模式

**项目类型**: [greenfield/brownfield]
**入场扫描状态**: [已完成/待确认/已跳过]

**门控判定**:
- A/B/C → 自动进入下一阶段
- D/E → ⏸️ 暂停，等待用户确认
- F → 记录跳过原因，继续
```

**执行流程**:
1. 检测项目根目录是否有 `.devflow/`
2. 判断是greenfield还是brownfield
3. 根据情况选择入场策略
4. 必要时请求用户确认
```

**预期收益**:
- ✅ 智能识别项目类型
- ✅ 避免覆盖现有工作
- ✅ 提供合适的入场策略

---

### 2.2 Token自动监控（来自supercorp-ultimate）

#### 集成方案

在SKILL.md的Token管理章节增强：

```markdown
## 💰 Token管理策略（增强版）

### 自动监控机制

```javascript
// AI内部逻辑（伪代码）
const usage = await tokenManager.check();

if (usage > 0.85) {
  console.warn('⚠️ Token使用率超过85%');
  await tokenManager.compress('extreme');
  await clearContext();
  console.log('✅ 已压缩上下文，释放空间');
}
```

### 监控指标

| 指标 | 阈值 | 动作 |
|------|------|------|
| 使用率 > 70% | 警告 | 提示用户 |
| 使用率 > 85% | 自动压缩 | extreme级别 |
| 使用率 > 95% | 紧急清理 | 清除非必要上下文 |

### 压缩策略

根据使用率自动选择压缩级别：
- 70-80% → lite压缩
- 80-90% → full压缩
- 90-95% → ultra压缩
- >95% → extreme压缩

### 手动触发

用户可随时要求：
```
/token status     # 查看当前使用率
/token compress   # 手动压缩
/token clear      # 清空上下文
```
```

**预期收益**:
- ✅ 防止Token溢出
- ✅ 自动优化成本
- ✅ 支持更长对话

---

### 2.3 安全编码规范R7（来自unified-platform）

#### 集成方案

在SKILL.md的反幻觉规则后添加：

```markdown
---

## 🔐 安全编码规范（R7）

**核心原则**: 防止安全漏洞，保护用户数据。

### 1. 密钥管理（最高优先级）

**禁止做法**:
```javascript
// ❌ Hardcode密钥
const GOOGLE_CLIENT_SECRET = "GOCSPX-abc123...";
```

**正确做法**:
```javascript
// ✅ 从环境变量读取
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
```

### 2. Phase 2宪法强制要求

Architect必须在constitution.md中包含：
```markdown
## 安全要求
- ✅ 所有密钥必须从环境变量读取
- ✅ .env文件必须加入.gitignore
- ✅ 禁止hardcode任何敏感信息
```

### 3. Phase 6安全检查清单

Security Auditor必须检查：
```markdown
### 密钥管理
- [ ] 无hardcode密钥
- [ ] .env在.gitignore中
- [ ] 环境变量正确使用

### 输入验证
- [ ] 所有API端点有输入验证
- [ ] 使用参数化查询
- [ ] XSS防护到位
```

详见完整规范：[安全编码规范](references/RULES-v3.md R14)
```

**预期收益**:
- ✅ 防止密钥泄露
- ✅ 系统化安全检查
- ✅ 降低安全风险

---

### 2.4 渐进式披露机制（来自unified-platform）

#### 集成方案

在SKILL.md中添加：

```markdown
---

## ⚠️ 渐进式披露规则

**核心原则**: AI不应一次性加载所有信息，应按需加载。

### 加载策略

| 阶段 | 加载内容 | 不加载内容 |
|------|---------|----------|
| Phase 0 | office-hours + CEO/CFO | 其他Phase的Skills |
| Phase 1 | grill + PM | Phase 0/2+的Skills |
| Phase 2 | supercorp-start + Architect | Phase 0-1/3+的Skills |
| Phase 3 | supercorp-start + Planner | 其他Phase的Skills |
| Phase 4 | supercorp-execute + Developer | 其他Phase的Skills |
| Phase 5 | supercorp-execute + QA | 其他Phase的Skills |
| Phase 6 | review + Blind Hunter等 | 其他Phase的Skills |
| Phase 7 | supercorp-ship + DevOps | 其他Phase的Skills |
| Phase 8 | archive + Memory Keeper | 其他Phase的Skills |

### 执行流程

1. 读取 `.devflow/state.md` 确定当前Phase
2. 仅加载当前Phase相关的Skill和Agent
3. Phase切换时：
   - 卸载旧Phase的Skill
   - 加载新Phase的Skill
   - 更新state.md

### Token节省效果

- Phase 0: 仅加载2个Skill → 节省80%
- Phase 4: 仅加载1个Skill → 节省90%
- 平均节省: ~75% Token
```

**预期收益**:
- ✅ Token节省75%
- ✅ 支持更长对话
- ✅ 降低API成本

---

## 🎯 Phase 3: P2特性集成（本月完成）

### 3.1 钩子系统（来自supercorp-ultimate）

#### 集成方案

创建hooks/目录：

```bash
mkdir -p devflow/hooks
```

**预定义钩子**:

1. **pre-phase hook**: Phase开始前触发
2. **post-phase hook**: Phase完成后触发
3. **pre-wave hook**: Wave开始前触发
4. **post-wave hook**: Wave完成后触发
5. **session-close hook**: Session结束时触发

**示例**: `hooks/post-phase-6.sh`

```bash
#!/bin/bash
# Phase 6完成后自动执行
echo "✅ Phase 6审查完成"
echo "📊 生成审查报告..."
# 自动触发Gate 5检查
```

**在SKILL.md中注册**:

```markdown
### 钩子系统

**可用钩子**:
- `pre-phase-*`: Phase前执行
- `post-phase-*`: Phase后执行
- `pre-wave-*`: Wave前执行
- `post-wave-*`: Wave后执行
- `session-close`: Session结束时

**自定义钩子**:
在 `hooks/` 目录创建脚本，自动检测并执行。
```

**预期收益**:
- ✅ 自动化流程
- ✅ 可扩展性强
- ✅ 减少人工操作

---

### 3.2 规则系统（来自supercorp-ultimate）

#### 集成方案

创建rules/目录：

```bash
mkdir -p devflow/rules
```

**预定义规则**:

1. **devflow-rules.md**: 开发流程规则
2. **coding-standards.md**: 编码规范
3. **security-rules.md**: 安全规则
4. **quality-gates.md**: 质量门控规则

**示例**: `rules/devflow-rules.md`

```markdown
# 开发流程规则

## R1: 设计先行
- 必须先有设计文档，才能开始编码
- 重大变更必须有ADR

## R2: TDD强制
- Phase 4必须遵循TDD
- RED → GREEN → REFACTOR

## R3: 代码审查
- 所有代码必须经过Phase 6审查
- Critical问题必须修复
```

**在SKILL.md中引用**:

```markdown
### 规则系统

**核心规则**:
- R1: 设计先行
- R2: TDD强制
- R3: 代码审查
- R4: 安全第一
- R5: 文档同步

违反规则时，AI必须提醒用户并要求确认。
```

**预期收益**:
- ✅ 规范化开发流程
- ✅ 提高代码质量
- ✅ 减少低级错误

---

## 📋 实施清单

### Phase 1: P0特性（立即执行）

- [ ] 1.1 Team-Skills记忆系统
  - [ ] 复制11个记忆文件
  - [ ] 更新SKILL.md引用
  - [ ] 集成LearningWorkflow

- [ ] 1.2 37个产物模板
  - [ ] 复制templates目录
  - [ ] 分类整理
  - [ ] 更新SKILL.md引用

- [ ] 1.3 多项目管理
  - [ ] 创建工作区结构
  - [ ] 创建config.yaml模板
  - [ ] 添加管理命令
  - [ ] 创建项目元数据模板

- [ ] 1.4 插件系统
  - [ ] 创建插件目录
  - [ ] 定义plugin.json标准
  - [ ] 添加插件命令
  - [ ] 创建示例插件

### Phase 2: P1特性（本周完成）

- [ ] 2.1 入场检测协议
- [ ] 2.2 Token自动监控
- [ ] 2.3 安全编码规范R7
- [ ] 2.4 渐进式披露机制

### Phase 3: P2特性（本月完成）

- [ ] 3.1 钩子系统
- [ ] 3.2 规则系统

---

## 🎯 预期效果

### 集成前 vs 集成后

| 维度 | 集成前 | 集成后 |
|------|--------|--------|
| **记忆系统** | 基础memory/ | 11个结构化文件 |
| **产物模板** | 无 | 37个标准化模板 |
| **多项目管理** | ❌ | ✅ 工作区+切换 |
| **插件系统** | ❌ | ✅ 5种类型 |
| **入场检测** | ❌ | ✅ 6种情况判定 |
| **Token监控** | 手动 | 自动监控+压缩 |
| **安全规范** | 基础 | R7完整规范 |
| **渐进式披露** | ❌ | ✅ 节省75% Token |
| **钩子系统** | ❌ | ✅ 5种钩子 |
| **规则系统** | ❌ | ✅ 5条核心规则 |

### 能力提升

- ✅ **核心能力**: 从12/14 → 14/14 (100%)
- ✅ **零配置**: 保持真正零配置
- ✅ **扩展性**: 插件系统支持无限扩展
- ✅ **专业性**: Team-Skills记忆系统达到企业级
- ✅ **安全性**: R7规范覆盖主要安全风险

---

## 🚀 下一步行动

1. **立即执行**: Phase 1的4个P0特性
2. **本周完成**: Phase 2的4个P1特性
3. **本月完成**: Phase 3的2个P2特性
4. **测试验证**: 在实际项目中全面测试
5. **发布v3.1**: 集成所有特性后的稳定版本

---

**集成完成后，devflow将成为真正的终极工程平台！**
