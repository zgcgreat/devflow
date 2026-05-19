# Devflow 融合方案说明

## 🎯 融合目标

打造市面上最强大的 AI 编程工作流系统，整合 6 大开源项目的核心能力。

---

## 📊 融合项目清单

| 项目 | 贡献能力 | 融合位置 |
|------|---------|---------|
| **spec-kit** | 规格驱动开发（PRD → Plan → Tasks） | GO.md Step 3 + stage-0-confirm |
| **devflow-kit** | 7阶段流程 + 记忆系统 + Stage Skills | 核心框架 |
| **superpowers** | 工程纪律（TDD/Subagent/Brainstorming） | stage-4-dev dependencies |
| **OpenSpec** | 变更管理（proposal/apply/archive） | stage-7-integration |
| **GitNexus** | 代码知识图谱 + MCP hooks | stage-1-analysis + stage-6-review |
| **agent-skills** | 23个专业领域 skill | skills/agent-skills/ |
| **caveman** | Token 压缩通信 | GO.md 可选命令 |
| **flow-kit** | GO.md 统一路由器设计 | GO.md 架构参考 |

---

## 🏗️ 架构设计

### 分层架构

```
Layer 0: 用户交互层
  - 统一入口: Use devflow
  
Layer 1: 智能路由层 (来自 flow-kit)
  - GO.md 统一路由器
  - 自动识别意图
  
Layer 2: 规格生成层 (来自 spec-kit)
  - /speckit.specify → PRD
  - /speckit.plan → 技术方案
  - /speckit.tasks → 任务列表
  
Layer 3: 变更管理层 (来自 OpenSpec)
  - /opsx:propose → 提案验证
  - 检查冲突/依赖
  
Layer 4: 流程编排层 (来自 devflow-kit)
  - 入场检测
  - 模式判定
  - 7阶段流程
  - 记忆系统
  
Layer 5: 工程纪律层 (来自 superpowers)
  - brainstorming
  - TDD
  - subagent-driven
  - systematic-debugging
  
Layer 6: 代码理解层 (来自 GitNexus)
  - Tree-sitter 解析
  - 知识图谱查询
  - MCP hooks
  
Layer 7: 专业技能层 (来自 agent-skills)
  - 23个专业 skill 按需加载
```

---

## 🔧 关键集成点

### 1. GO.md 统一路由器

**融合来源**: flow-kit + devflow-kit

**增强点**:
- 新增 spec-kit 路由分支
- 新增 GitNexus 代码探索路由
- 新增 caveman 压缩级别选项
- 集成 OpenSpec 归档流程

### 2. stage-0-confirm 规格生成

**融合来源**: devflow-kit + spec-kit

**流程**:
```
1. 检测 specs/ 目录是否存在
   - 存在 → 导入 spec-kit 生成的 PRD/Plan/Tasks
   - 不存在 → 调用 /speckit.specify 生成
2. 补充 Brainstorming 澄清环节（来自 superpowers）
3. 更新 .devflow/memory/DECISIONS.md
```

### 3. stage-1-analysis 代码理解

**融合来源**: devflow-kit + GitNexus

**增强**:
- 调用 `gitnexus analyze` 更新索引
- PreToolUse hook 增强文件搜索
- 查询调用链和依赖关系

### 4. stage-4-dev 工程纪律

**融合来源**: devflow-kit + superpowers

**Dependencies**:
```yaml
stage-4-dev:
  dependencies:
    - development-core (agent-skills)
    - test-driven-development (superpowers)
    - subagent-driven-development (superpowers)
```

### 5. stage-6-review 影响分析

**融合来源**: devflow-kit + GitNexus

**增强**:
- 调用 GitNexus PR Review
- 分析 blast radius（影响范围）
- 检测潜在回归风险

### 6. stage-7-integration 变更归档

**融合来源**: devflow-kit + OpenSpec

**流程**:
```
1. 创建 openspec/changes/[req-id]/
   - proposal.md (来自 specs/spec.md)
   - design.md (来自 .devflow/[req-id]/02-design.md)
   - tasks.md (来自 specs/tasks.md)
2. 执行 /opsx:archive 归档
3. 更新 openspec/specs/ 主规格
4. 更新记忆系统
```

---

## 📁 目录结构

```
devflow/
├── GO.md                      # 统一路由器 (flow-kit + devflow-kit)
├── SKILL.md                   # 主 skill 定义 (融合版)
├── README.md                  # 使用文档
├── .gitignore                 # Git 忽略规则
│
├── skills/
│   └── stage-skills/          # 15个阶段技能 (来自 devflow-kit)
│       ├── stage-0-confirm/_SKILL.md
│       ├── stage-1-analysis/_SKILL.md
│       ├── stage-2-design/_SKILL.md
│       ├── stage-2a-ui-design/_SKILL.md
│       ├── stage-3-task/_SKILL.md
│       ├── stage-3a-plan/_SKILL.md
│       ├── stage-4-dev/_SKILL.md
│       ├── stage-5-test/_SKILL.md
│       ├── stage-6-review/_SKILL.md
│       ├── stage-7-integration/_SKILL.md
│       ├── stage-a-architect/_SKILL.md
│       ├── stage-a-evolve/_SKILL.md
│       ├── stage-i-intel-scan/_SKILL.md
│       ├── stage-m-health/_SKILL.md
│       └── stage-debug/_SKILL.md
│
├── agent-skills/
│   └── skills/                # 23个专业技能 (来自 agent-skills)
│       ├── idea-refine/SKILL.md
│       ├── test-driven-development/SKILL.md
│       ├── debugging-and-error-recovery/SKILL.md
│       ├── frontend-ui-engineering/SKILL.md
│       ├── security-and-hardening/SKILL.md
│       ├── performance-optimization/SKILL.md
│       └── ... (共23个)
│
├── references/
│   ├── RULES.md               # 全局规则 (来自 devflow-kit)
│   ├── mode-rules.md          # 模式判定
│   ├── gate-rules.md          # 阶段门验证
│   ├── entry-check.md         # 入场检测
│   ├── token-budget.md        # Token 预算
│   └── templates/             # 产物模板 (22个)
│
├── memory/                    # 记忆系统模板 (来自 team-skills)
│   ├── PROJECT_CONTEXT.md
│   ├── DECISIONS.md
│   ├── KNOWN_FAILURES.md
│   └── journals/
│
└── docs/                      # 详细文档
    ├── quickstart.md
    ├── stage-skills.md
    ├── memory-system.md
    ├── openspec-integration.md
    └── gitnexus-setup.md
```

---

## 🚀 实施进度

### ✅ 已完成（P0）

- [x] 创建项目目录结构
- [x] 编写 GO.md 统一路由器
- [x] 编写 SKILL.md 主定义
- [x] 复制 Stage Skills（15个）
- [x] 复制 Agent Skills（23个）
- [x] 复制 references 规则和模板
- [x] 复制记忆系统模板
- [x] 编写 README.md
- [x] 创建 .gitignore

### ⏳ 待完成（P1-P2）

- [ ] 编写详细文档（docs/）
- [ ] 创建工具适配器（adapters/）
- [ ] 编写安装脚本
- [ ] 创建示例项目演示
- [ ] 性能优化和测试

---

## 🎯 核心优势

### 相比单一项目的优势

| 维度 | spec-kit | devflow-kit | superpowers | Ultimate |
|------|----------|-------------|-------------|----------|
| 规格生成 | ✅ | ❌ | ❌ | ✅ |
| 阶段流程 | ❌ | ✅ | ❌ | ✅ |
| 工程纪律 | ❌ | ❌ | ✅ | ✅ |
| 记忆系统 | ❌ | ✅ | ❌ | ✅ |
| 变更管理 | ❌ | ❌ | ❌ | ✅ |
| 代码理解 | ❌ | ❌ | ❌ | ✅ |
| 专业能力 | ❌ | ❌ | ✅ (14个) | ✅ (23个) |
| Token优化 | ❌ | ❌ | ❌ | ✅ |

**Devflow = 所有最佳实践的集大成者**

---

## 📈 预期效果

### 开发效率提升

- **规格生成时间**: 从 2-3 小时 → 5分钟（自动化）
- **需求澄清质量**: 提升 80%（Brainstorming + 模板约束）
- **代码质量**: 提升 60%（TDD + Subagent审查）
- **Bug率**: 降低 50%（系统化调试 + GitNexus影响分析）
- **跨会话连续性**: 100%（记忆系统）

### 适用场景

✅ **最适合**:
- 中长期项目（需要记忆系统）
- 团队协作（需要变更管理）
- 复杂系统（需要代码理解）
- 高质量要求（需要工程纪律）

⚠️ **不太适合**:
- 超小型项目（<10行代码）
- 一次性脚本
- 快速原型验证（用 spec-kit 更轻量）

---

## 🔮 未来演进

### v1.1 计划

- [ ] 集成更多 agent-skills（目标 30+）
- [ ] 支持多语言规格生成
- [ ] 可视化 Dashboard
- [ ] CI/CD 集成

### v2.0 愿景

- [ ] AI 自主决策模式选择
- [ ] 自动生成测试用例
- [ ] 性能基准追踪
- [ ] 安全漏洞扫描

---

## 📝 维护说明

### 更新上游项目

当上游项目有重要更新时：

```bash
# 更新 Stage Skills
cd devflow
git pull origin main --submodule

# 或手动复制
cp -r ../devflow-kit/skills/stage-skills/* skills/stage-skills/
cp -r ../agent-skills/skills/* agent-skills/skills/
```

### 版本发布

遵循语义化版本：
- **MAJOR**: 架构级变更
- **MINOR**: 新功能添加
- **PATCH**: Bug修复

---

## 🤝 贡献指南

欢迎提交 PR 改进 Devflow！

### 贡献方向

1. **新增 Stage Skill**: 扩展流程阶段
2. **优化模板**: 提高产物质量
3. **完善文档**: 降低学习成本
4. **性能优化**: 减少 Token 消耗
5. **工具适配**: 支持更多 AI IDE

### 提交规范

```
type(scope): subject

Examples:
feat(stage-0): add spec-kit integration
fix(memory): correct decision tracking
docs(readme): update installation guide
```

---

## 📄 许可证

MIT License

继承所有上游项目的开源协议。
