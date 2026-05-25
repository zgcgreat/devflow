# 集成指南 — DevFlow v3.2.3

本文档介绍如何集成外部工具和工作流到 DevFlow。

## 📋 内容索引

| 集成 | 说明 |
|------|------|
| [spec-kit 集成](#spec-kit-集成) | PRD → Plan → Tasks 自动化生成 |
| [OpenSpec 集成](#openspec-集成) | proposal → apply → archive 变更管理 |
| [GitNexus 配置](#gitnexus-配置) | tree-sitter + graphDB 代码理解 |
| [CI/CD 流水线集成](#cicd-流水线集成) | GitHub Actions / GitLab CI |
| [自定义 Hooks](#自定义-hooks) | 扩展运行时钩子系统 |
| [多项目支持](#多项目支持) | 多个 .devflow 目录隔离 |

---

## spec-kit 集成

### 角色定位

spec-kit 是 DevFlow Phase 2（方案设计）的输入源之一。它负责：

```
PRD → Plan → Tasks → CONTEXT.md (Phase 1b产物)
```

DevFlow 使用 spec-kit 生成的 `tasks.md` 作为 DAG Router 的输入，自动拆分为 Waves。

### 工作流程

```
用户提交需求描述
    ↓
spec-kit PRD 生成（可选）
    ↓
spec-kit Plan 生成（从PRD推导技术方案）
    ↓
spec-kit Tasks 生成（从Plan推导可执行任务列表）
    ↓
DevFlow Phase 3 DAG Router 读取 tasks.md → 自动 Wave 拆分
```

### 命令调用

```bash
# 在 DevFlow 的 Phase 1b 决策确认后运行
/devflow spec define "需求描述"    # 生成 PRD
/devflow spec plan "技术描述"      # 生成 Plan
/devflow spec tasks                # 生成 Tasks → DAG输入
```

### Delta-Specs 差量集成

Brownfield 场景下，使用 Delta-Specs 减少 Token 消耗：

1. `git diff` → symbol 级影响分析
2. 仅对变更文件运行 spec-kit 生成
3. 未变动的 spec 引用已有版本（不重新生成）

详见 [Delta-Specs 文档](../references/delta-specs.md)

---

## OpenSpec 集成

### 角色定位

OpenSpec 是 DevFlow Phase 8（知识归档）的持久化层。它负责：

```
Phase完成 → proposal → apply → archive → OpenSpec记录
```

### 工作流程

```
Phase 8 触发归档
    ↓
为本次 req 创建 OpenSpec proposal
    ↓
apply: 将所有变更纳入版本控制
    ↓
archive: 标记proposal为已归档，更新索引
```

### 目录约定

```
OpenSpec/
├── proposals/        # DevFlow 归档的proposal放这里
│   └── <req-id>/     # 每个需求一个目录
├── archives/         # 已归档proposal
└── INDEX.md          # proposal索引
```

### 与记忆系统的关系

| 系统 | 职责 | 持久化 |
|------|------|--------|
| `.devflow/memory/` | 运行时快速检索（PROJECT_CONTEXT/DECISIONS/LESSONS） | 项目本地 |
| `OpenSpec/` | 企业级变更追踪 + proposal生命周期管理 | Git版本控制 |

---

## GitNexus 配置

### 能力等级

DevFlow 自动按以下步骤检测并降级：

```
Step 3.1: gitnexus --version
  ├─ ✅ 成功 → 启用完整代码理解
  └─ ❌ 失败 → Step 3.2
      ↓
Step 3.2: 提示用户选择
  ├─ [1] 现在安装
  ├─ [2] 跳过本次会话 (使用 grep fallback)
  └─ [3] 永久跳过 (使用 grep fallback + 记录到 STATE.md)
```

### 能力对照表

| 能力 | GitNexus就绪 | grep Fallback | 关闭 |
|------|-------------|---------------|------|
| 文件搜索 | ✅ tree-sitter AST | ✅ glob+grep | ✅ glob |
| 调用链分析 | ✅ symbol级 + graphDB | ⚠️ grep -rn | ❌ |
| 依赖影响追踪 | ✅ blast radius分析 | 🟡 静态文本匹配 | ❌ |

### MCP集成配置

```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "gitnexus",
      "args": ["serve"],
      "env": {}
    }
  }
}
```

详见 `layers/L2-ENGINE/codegraph-bridge/_SKILL.md`

---

## CI/CD 流水线集成

### GitHub Actions 示例

```yaml
name: DevFlow Pipeline
on: [push, pull_request]

jobs:
  devflow-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: DevFlow Phase Check
        run: |
          # 验证当前req的Phase门控状态
          if [ -f .devflow/STATE.md ]; then
            echo "Found existing devflow state"
            cat .devflow/STATE.md
          fi
      
      - name: Run Quality Gate
        run: |
          # Phase 6 三层对抗审查的自动化版本
          echo "Running automated review..."
      
      - name: Check Code Quality
        run: |
          # G2质量门验证
          python -m pytest --cov=src --cov-fail-under=80
```

### GitLab CI 示例

```yaml
devflow-check:
  stage: test
  script:
    - echo "Running DevFlow quality gates"
    - cat .devflow/STATE.md || echo "No devflow state found"
  only:
    - main
```

---

## 自定义 Hooks

### Hooks 系统概览

DevFlow v3.2+ 内置运行时钩子系统（`hooks-system/_SKILL.md`），支持在关键事件发生时触发回调。

### 可用钩子

| 钩子 | 触发时机 | 默认行为 |
|------|---------|---------|
| `context-monitor` | Token达到阈值 | 自动进入更高压缩级别 |
| `prompt-guard` | AI输出时 | 脱敏 + 注入检测 |
| `phase-transition` | Phase切换时 | checkpoint保存状态 |
| `tool-execution` | 工具调用完成时 | 审计日志 + 失败重试 |

### 自定义 Hook 配置

在 `.devflow/hooks.json` 中配置：

```json
{
  "hooks": {
    "phase-transition": {
      "on_enter_phase_4": [
        "log-phase-start",
        "budget-check"
      ]
    },
    "tool-execution": {
      "on_failure": ["retry-3x", "log-error"]
    }
  }
}
```

### Chain-Trigger 配置语法

```json
{
  "chain_triggers": [
    {
      "trigger": "context-monitor:threshold_reached",
      "then": [
        { "action": "caveman-shrink:compress_to", "params": ["ultra"] },
        { "action": "surface-switch:set_mode", "params": ["lite"] }
      ],
      "mode": "parallel"
    }
  ]
}
```

- **parallel**: 所有回调并发执行
- **serial**: 按顺序串行执行，前一个失败则中断链式触发

---

## 多项目支持

### 目录结构

每个项目独立维护自己的 `.devflow/` 目录：

```
project-a/
├── .devflow/          # 项目A的产物和记忆系统
│   ├── STATE.md
│   └── memory/
│       ├── PROJECT_CONTEXT.md
│       └── ...
└── src/

project-b/
├── .devflow/          # 项目B独立目录
│   ├── STATE.md
│   └── memory/
│       └── ...
└── src/
```

### 记忆隔离

- `PROJECT_CONTEXT.md`: 每个项目的业务背景（不共享）
- `DECISIONS.md`: 每个项目的决策记录（不共享）
- `LESSONS.md`: 经验教训可按需跨项目复用
- `domain-skills/`: 领域技能可跨项目共享（手动迁移）

### 跨项目复用 LESSONS

```bash
# 从项目A复制通用LESSON到项目B
cat project-a/.devflow/memory/LESSONS.md >> project-b/.devflow/memory/LESSONS.md
# 然后运行去重
```

---

## 常见集成问题

### Q: DevFlow 与其他 AI 工作流工具（如 agent-skills、superpowers）的区别？

**A**: DevFlow 是 **整合层**。它不是替代其他工具，而是将 spec-kit / devflow-kit / superpowers / OpenSpec / GitNexus 等工具统一编排到标准化流程中。详见 [README.md](../README.md)中的整合图表。

### Q: 如何跳过某个 Phase？

**A**: 
1. Fast/Lean 模式自动跳过 Phase 0/1/1b
2. Standard 模式可条件跳过 Phase 0/1（满足规则）
3. Lean 模式跳过头部检测
4. Phase 7 Canary 在非生产环境可选择跳过

### Q: 产物目录可以被删除吗？

**A**: `.devflow/<req-id>/` 可以安全删除（保留 STATE.md 和 memory/ 即可）。删除前确保已归档 LESSONS。
