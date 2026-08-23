# Universal Adapter — 纯 Markdown 零运行时模式

> ForgeOS 的基础运行模式，不依赖任何脚本运行时，适用于所有能读取 Markdown 的 AI 编码环境。

---

## 概述

ForgeOS 支持两种运行模式：

| 模式 | 运行时要求 | 自动化程度 | 适用场景 |
|------|----------|----------|---------|
| **Hook增强模式** | Node.js ≥ 18 | 高（6个Hook自动检查） | Claude Code 等支持Hook的环境 |
| **零运行时模式** (本模式) | 无 | 基础（AI自律 + 人工确认） | 任何AI编码环境 |

当 `node --version` 不可执行时，ForgeOS 自动降级为零运行时模式。

---

## 零运行时模式特性

### ✅ 完整保留
- Phase 0-8 九阶段管线
- Gate 门控确认机制
- 四档模式判定
- LearningWorkflow 自进化
- Delta Specs 差量规范
- 所有 Agent 指令（作为 Markdown 参考指令）
- 7核心Agent always加载

### ⚠️ 降级处理
| Hook增强模式能力 | 零运行时降级方案 |
|----------------|---------------|
| Hook自动格式化+类型检查 | AI按 `checklist-fallback.md` 手动逐项检查 |
| Hook自动安全扫描 | AI按安全审查清单手动检查 |
| Hook自动 console.log 检测 | AI自查代码中的 console.log |
| Hook自动 compact 建议 | 人工监控 Token 使用率 |
| Hook自动成本追踪 | 人工记录成本 |

### ❌ 不可用
- hooks.json 不生效（无运行时执行）
- 6个 JS Hook 脚本不执行
- cost-tracker 自动统计不可用
- context-monitor 自动监控不可用

---

## 降级清单使用方法

当处于零运行时模式时，每个 Gate 确认前，AI 必须读取 `hooks/checklist-fallback.md`，逐项完成检查后方可请求人工确认。

```
Gate 流程（零运行时模式）：
1. AI 完成 Phase 任务
2. AI 读取 hooks/checklist-fallback.md
3. AI 逐项执行检查，输出结果
4. AI 向用户请求 Gate 确认
5. 用户确认 → 进入下一 Phase
```

---

## 安装指引

### 零运行时模式（任何环境）
1. 复制 `forge-os/` 目录到项目根目录
2. 在 AI 的系统提示或配置中指向 `SKILL.md`
3. 开始使用，无需任何配置

### 升级到 Hook增强模式
1. 确保已安装 Node.js ≥ 18
2. 参照 `adapters/claude-code/README.md` 配置 hooks.json
3. 重启 AI 编码环境，Hook 自动生效

---

## 兼容性

| AI 编码环境 | 零运行时模式 | Hook增强模式 |
|------------|------------|------------|
| Claude Code | ✅ | ✅ (推荐) |
| Cursor | ✅ | ❌ (暂不支持Hook) |
| Codex | ✅ | ❌ (暂不支持Hook) |
| OpenCode | ✅ | ❌ (暂不支持Hook) |
| Gemini | ✅ | ❌ (暂不支持Hook) |
| 通用 AI | ✅ | ❌ |

---

## 文件清单

```
adapters/universal/
  README.md          ← 本文件
  INSTALL.md         ← 安装指引 (M5完善)

hooks/
  checklist-fallback.md  ← 降级检查清单 (M2创建)

SKILL.md              ← 主入口 (含运行时检测)
GO.md                 ← 路由器
```