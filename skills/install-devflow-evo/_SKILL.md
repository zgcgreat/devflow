---
name: install-devflow-evo
description: 自动安装和初始化 DevFlow Evo 到当前项目。当用户想要开始使用 DevFlow Evo 时触发。
version: 3.0-draft
phase: setup
triggers:
  - 用户说"安装 devflow-evo"
  - 用户说"初始化工作流系统"
  - 用户说"开始使用 devflow-evo"
  - 用户首次提到需要使用结构化开发流程
---

# Install DevFlow Evo

自动将 DevFlow Evo 安装并配置到当前项目中。

## 触发场景

- 用户说"安装 devflow-evo"
- 用户说"初始化工作流系统"
- 用户说"开始使用 devflow-evo"
- 用户首次提到需要使用结构化开发流程

## 执行流程

### Step 1: 检测当前环境

```markdown
🔍 检测当前项目状态
检查项:
- [ ] 是否已存在 references/GO.md?
- [ ] 是否已存在 .specs/ 目录?
- [ ] AI工具类型 (Cursor/Claude Code/Gemini等)
```

**输出**:
```
✅ DevFlow Evo 安装状态:
- references/GO.md: 存在/不存在
- .specs/: 存在/不存在
- AI工具: <检测到的工具>

→ 如已安装: Use devflow-evo. <你的需求>
→ 如未安装: 继续下一步
```

---

### Step 2: 项目上下文扫描

```markdown
📋 扫描项目上下文
自动检测:
- 项目类型 (Web/API/Mobile/Library/CLI)
- 技术栈 (语言/框架/构建工具)
- 项目规模 (文件数/目录结构)
- 现有配置 (lint/test/ci)
```

**输出示例**:
```
项目扫描结果:
- 类型: Web前端项目
- 技术栈: React 18 + TypeScript + Vite
- 规模: 中型 (15组件, 8页面, 5 API模块)
- 配置: ESLint ✓, Vitest ✓, GitHub Actions ✓
```

---

### Step 3: 选择安装模式

向用户确认安装模式:

| 模式 | 适用场景 | 安装内容 |
|------|---------|---------|
| **Standard** | 大多数项目 | GO.md + 核心references + 适配器 |
| **Minimal** | 小型/实验项目 | 仅GO.md + gate-rules |
| **Full** | 企业级项目 | 全部references + 适配器 + 模板 + 记忆系统 |

**确认问题**:
1. 安装模式选择哪种？(Standard/Minimal/Full)
2. 使用哪个AI工具？(Cursor/Claude Code/Copilot/Gemini/其他)
3. 是否启用记忆系统？(是/否)

---

### Step 4: 执行安装

根据选择的模式，将必要文件复制到项目:

```markdown
📁 安装文件清单 (Standard模式):
- references/GO.md          ← 统一路由器
- references/gate-rules.md  ← Gate规则
- references/RULES-v3.md    ← 规则集
- references/entry-check.md ← 入口检查
- references/delta-specs.md ← 差量规范
- adapters/<tool>/          ← 对应AI工具适配器
```

**关键原则**: DevFlow Evo 是纯 Markdown 系统，零配置、零依赖、零脚本。所有"执行"由 AI 按指令完成。

---

### Step 5: 适配器配置

根据用户选择的AI工具，配置对应适配器:

**Cursor**:
```bash
cp adapters/cursor/devflow-evo.mdc .cursor/rules/devflow-evo.mdc
```

**Claude Code**:
```bash
# 添加到 .claude/settings.json
```

**Copilot**:
```bash
# 添加到 .github/copilot-instructions.md
```

---

### Step 6: 验证安装

```markdown
✅ 安装验证
- [ ] references/GO.md 可访问
- [ ] 适配器已配置
- [ ] AI工具可响应 devflow-evo 指令
```

**测试命令**:
```
Use devflow-evo. 健康检查
```

---

### Step 7: 首次使用引导

安装完成后，引导用户开始首次使用:

```
🎉 DevFlow Evo 安装完成！

快速开始:
1. Use devflow-evo. <你的项目需求>
2. 系统将自动进入 Phase 0 (策略阶段)
3. 每个Phase结束时会确认是否继续

常用命令:
- /devflow-evo new "项目名称" --tech <技术栈>
- /devflow-evo discuss 1    # 需求分析
- /devflow-evo plan 1       # 方案设计
- /devflow-evo execute 1    # 实施开发
- /devflow-evo verify 1     # 测试验证
- /devflow-evo ship 1       # 交付部署
```

---

## Error Taxonomy

| 级别 | 错误场景 | 处理方式 |
|------|---------|---------|
| P0 | 项目目录不存在 | 提示用户先创建项目 |
| P1 | 适配器配置失败 | 降级为手动配置指引 |
| P2 | 已安装旧版本 | 提供迁移指引 |
| P3 | AI工具不识别指令 | 提供替代触发方式 |

## Boundary Conditions

- **已安装**: 如果检测到GO.md已存在，提示用户使用 `Use devflow-evo.` 而非重新安装
- **旧版本迁移**: 如果检测到旧版 devflow-evo 文件，提供迁移步骤
- **多项目**: 支持在同一工作区管理多个项目，每个项目独立配置
