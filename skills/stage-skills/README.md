# devflow-kit Stage Skills

> **模块化工作流设计** - 将devflow-kit各阶段封装为独立skill

## 目录结构

```
skills/stage-skills/
├── stage-0-confirm/          # 需求确认
├── stage-1-analysis/         # 需求分析
├── stage-2-design/           # 方案设计
├── stage-2a-ui-design/       # UI设计
├── stage-3-task/             # 任务拆分
├── stage-3a-plan/            # 实施计划
├── stage-4-dev/              # 开发执行
├── stage-5-test/             # 测试验证
├── stage-6-review/           # 代码审查
├── stage-7-integration/      # 集成发布
├── stage-a-architect/        # 架构梳理
├── stage-a-evolve/           # 架构演进
├── stage-m-health/           # 健康检查
├── stage-i-intel-scan/       # 入场扫描
└── stage-orchestrator/       # 阶段编排器
```

## 设计理念

### 为什么需要Stage Skills？

**问题**：
- GO.md长达962行，弱AI难以完整理解
- 各阶段逻辑分散在prompt文件中，缺乏统一约束
- AI容易偏离规范，跳过关键步骤

**解决方案**：
- 每个stage封装为独立skill，职责单一
- 结构化的Step流程 + 自检清单 + 错误处理
- AI每次只加载一个stage，降低认知负担

### Stage Skill vs Prompt

| 维度 | Prompt方案 | Stage Skill方案 |
|---|-----------|---|
| 组织方式 | 分散在多个md文件 | 模块化skill目录 |
| 依赖管理 | 隐式（靠注释说明） | 显式（YAML dependencies） |
| 版本控制 | 无 | 每个skill有版本号 |
| 可复用性 | 低（耦合到devflow-kit） | 高（其他项目可引用） |
| 测试难度 | 高（需模拟整个流程） | 低（单独测试每个stage） |
| 弱AI友好度 | 中（需阅读长文档） | 高（结构化Step流程） |

## 使用方式

### 方式1：通过GO.md路由（推荐）

```markdown
用户: "实现用户通知功能"

↓ GO.md解析意图
↓ 路由到: stage-0-confirm
↓ 加载: skills/stage-skills/stage-0-confirm/_SKILL.md
↓ 执行: 需求澄清 + 模式判定
↓ 产物: .devflow-kit/REQ-001/00-requirements.md
↓ 更新: .devflow-kit/STATE.md → 下一阶段: analysis
```

### 方式2：直接调用stage skill

```markdown
用户: "/stage 3-task"

↓ 直接加载: skills/stage-skills/stage-3-task/_SKILL.md
↓ 执行入口门禁检查
↓ 如缺前置产物，提示补齐
↓ 生成: .devflow-kit/REQ-001/03-tasks.md
```

## Stage Skill结构规范

每个stage skill必须包含以下章节：

```markdown
# devflow-kit Stage: X-Name

## Skill元信息
name, version, description, dependencies

## 输入
必需的前置产物

## 输出
本阶段生成的产物

## 入口门禁
前置产物检查逻辑（IF缺XX则STOP）

## 执行流程
Step 1: ...
Step 2: ...
...
Step N: ...

## 自检清单
- ⏳ 检查项1
- ⏳ 检查项2

## 约束
强制规则（禁止XX，必须XX）

## 触发下一步
完成后路由到哪里

## 错误处理
常见错误的处理方式
```

## 已完成的Stage Skills

### 主流程（10个）

#### ✅ stage-0-confirm（需求确认）
- 需求澄清
- 模式判定（Fast/Standard/Strict）
- 入场检测

#### ✅ stage-1-analysis（需求分析）
- AC拆解（Given/When/Then）
- 非功能需求分析
- Delta模式支持

#### ✅ stage-2-design（方案设计）
- 技术栈预选
- 既有架构对齐（brownfield）
- 技术决策 + ADR
- 风险识别

#### ✅ stage-2a-ui-design（UI设计）
- UI组件树
- 交互状态设计
- 响应式设计
- 无障碍要求（WCAG 2.1 AA）

#### ✅ stage-3-task（任务拆分）
- 任务拆解原则
- XML格式任务定义
- 并行规划
- write_files边界控制

#### ✅ stage-3a-plan（实施计划）
- 双模板策略（精简版/完整版）
- 整体架构设计
- 数据层设计
- 任务详细实施计划

#### ✅ stage-4-dev（开发执行）
- TDD优先
- Self-review（6维自查）
- Diff边界验证（R6.5）
- dev-log生成

#### ✅ stage-5-test（测试验证）
- 五轮测试（单元/集成/AC覆盖/回归/性能）
- AC覆盖矩阵
- 量化测试结果

#### ✅ stage-6-review（代码审查）
- 三轮审查（代码质量/安全/业务逻辑）
- 问题分级（🔴🟡🟢）
- 修复验证

#### ✅ stage-7-integration（集成发布）
- 发布检查清单
- 蓝绿部署步骤
- 回滚方案
- lessons-learned归档

### 可选命令（4个）

#### ✅ stage-a-architect（架构梳理）
- 扫描项目结构
- 提取历史ADR
- 生成system-architecture文档
- 识别架构问题

#### ✅ stage-a-evolve（架构演进）
- 从历史需求提取经验
- 同步到上下文
- 更新system-architecture
- 识别架构债务

#### ✅ stage-m-health（健康检查）
- 代码质量扫描
- 安全漏洞检测
- 性能基准测试
- 架构一致性检查
- 技术债识别

#### ✅ stage-i-intel-scan（入场扫描）
- 项目类型检测
- 目录结构扫描
- 依赖分析
- 既有抽象提取
- 生成上下文文档

### 辅助文件

#### ✅ orchestrator.md（阶段编排器）
- 完整阶段映射表
- 使用指南
- 迁移策略

## 优势总结

### 对AI友好
- ✅ 结构化的Step流程，不会遗漏
- ✅ 明确的入口/出口检查
- ✅ 自检清单强制执行质量检查
- ✅ 错误处理指导
- ✅ 避免阅读超长GO.md

### 对开发者友好
- ✅ 模块化，易于维护和测试
- ✅ 可复用，其他项目可直接引用
- ✅ 版本控制，每个stage有独立版本
- ✅ 依赖管理，显式声明避免遗漏

### 对项目友好
- ✅ 降低AI出错率
- ✅ 提高产出质量
- ✅ 便于团队协作（统一的stage规范）
- ✅ 易于定制（替换特定stage）

## 示例：完整执行流程

```markdown
1. 用户输入: "实现用户通知功能"

2. GO.md解析:
   - 意图: 新需求
   - 路由: stage-0-confirm

3. 加载stage-0-confirm:
   - 读取: skills/stage-skills/stage-0-confirm/_SKILL.md
   - 加载依赖: idea-refine, development-core

4. 执行stage-0-confirm:
   - Step 1: 读取项目状态
   - Step 2: 入场检测
   - Step 3: 需求澄清
   - Step 4: 模式判定 → Standard
   - Step 5: 生成00-requirements.md
   - Step 6: 更新项目状态

5. 路由到下一阶段:
   - 读取项目状态 → 下一阶段: analysis
   - 加载: skills/stage-skills/stage-1-analysis/_SKILL.md

6. 重复步骤3-5，直到所有阶段完成
```

## 注意事项

1. **不要重复逻辑** - stage skill和prompt不要有重复的执行逻辑
2. **保持幂等性** - 同一stage多次执行应产生相同结果
3. **明确边界** - 每个stage的职责要清晰，不越权
4. **文档同步** - stage skill更新后，同步更新GO.md的说明
5. **向后兼容** - 新增stage时，确保不影响现有流程

## 贡献指南

创建新的stage skill：

1. 复制 `stage-0-confirm` 作为模板
2. 修改元信息（name/version/description/dependencies）
3. 定义输入/输出
4. 编写入口门禁检查
5. 编写执行流程（Step 1-N）
6. 编写自检清单
7. 编写约束和错误处理
8. 更新 `orchestrator.md` 的映射表
9. 提交PR

## 相关链接

- [GO.md](../GO.md) - 工作流总控
- [Prompts](../prompts/) - 阶段prompt文件
- [Templates](../templates/) - 产物模板
- [Reference](../reference/) - 参考文档
- [Agent Skills](../../agent-skills/skills/) - 通用工程skill

