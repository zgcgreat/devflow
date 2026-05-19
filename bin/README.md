# bin/ — 零依赖指令集

> **纯 Markdown 即用，无需任何可执行脚本或运行时环境。**
>
> 本目录保留了 Python 版本作为可选增强，但所有功能均可通过复制下方指令到 AI 对话中完成。

---

## 快速导航

| 功能 | 对应的纯 Markdown 指令 | 说明 |
|------|----------------------|------|
| 项目初始化 | [init](#init) | 创建 .devflow/ 目录结构 |
| 阶段执行 | [stage-executor](#stage-executor) | 执行指定 Phase |
| Hook 管理 | [hook-manager](#hook-manager) | 会话前后检查 |
| Token 管理 | [token-manager](#token-manager) | 7级压缩监控 |
| 外部工具 | [external-adapter](#external-adapter) | GitNexus/grep 检测 |
| 记忆系统 | [memory-system](#memory-system) | 记忆文件读写 |
| 门控检查 | [gate-check](../scripts/gate-check.md) | G1-G8 门控验证 |

---

## init

### 用途

在项目中创建 `.devflow/` 目录结构，包括 STATE.md、config.yaml、memory/ 等标准文件。

### 等效命令

```bash
python bin/init.py --project-dir <path> --mode <fast|standard|strict>
```

### 纯 Markdown 指令

复制以下内容到你的 AI 对话中：

```markdown
请帮我初始化 devflow 项目。

- 项目目录: <当前目录>
- 执行模式: <fast|standard|strict>

请按以下步骤操作：

1. 在项目中创建 `.devflow/` 目录结构
2. 创建 `.devflow/STATE.md`，包含阶段进度清单
3. 创建 `.devflow/config.yaml`，写入模式和技术栈配置
4. 在 `.devflow/memory/` 下创建：
   - PROJECT_CONTEXT.md（项目背景模板）
   - DECISIONS.md（ADR 决策记录模板）
   - KNOWN_FAILURES.md（已知失败模式模板）
   - LESSONS.md（经验教训模板）
5. 在项目根目录创建或更新 `.gitignore`，加入 `.devflow/`
6. 验证所有文件已创建
```

### 预期产物

```
<project>/
├── .devflow/
│   ├── STATE.md
│   ├── config.yaml
│   ├── memory/
│   │   ├── PROJECT_CONTEXT.md
│   │   ├── DECISIONS.md
│   │   ├── KNOWN_FAILURES.md
│   │   └── LESSONS.md
│   └── hooks/
│   └── templates/
└── .gitignore  # 包含 .devflow/
```

---

## stage-executor

### 用途

根据当前 Phase，执行对应阶段的 AI 工作流指令。

### 等效命令

```bash
python bin/stage-executor.py <phase> --project-dir <path>
```

### 纯 Markdown 指令

复制以下内容到你的 AI 对话中：

```markdown
请执行 Phase <N> 工作流。

- 项目名称: <项目名>
- 当前阶段: Phase <N>
- 项目目录: <当前目录>
```

### 各 Phase 执行指令

#### Phase 0 — 战略评估

```markdown
请执行 Phase 0：战略评估。

1. 检测项目类型（greenfield/brownfield）
2. 执行入场检测（6种情况判定）
3. 输出 YC 六问战略评估报告
4. 判断是否进入 Phase 1
```

#### Phase 1 — 需求分析

```markdown
请执行 Phase 1：需求分析。

1. 使用 5 Whys 追问法澄清需求
2. 输出需求分析报告
3. 通过 G1 门控（Plan Quality）
```

#### Phase 2 — 方案设计

```markdown
请执行 Phase 2：方案设计。

1. 使用 DAG 路由进行方案设计
2. 输出设计方案文档
3. 通过 G2 门控（Design Quality）
```

#### Phase 3 — 任务拆分

```markdown
请执行 Phase 3：任务拆分。

1. 使用 DAG 拓扑排序拆分任务
2. 输出任务依赖图和 Wave Plan
3. 通过 G4 门控（Execution Readiness）
```

#### Phase 4 — 实施开发

```markdown
请执行 Phase 4：实施开发。

1. 按 Wave Plan 并行执行
2. 每 Wave 完成后写 SUMMARY
3. 触发 LearningWorkflow 经验沉淀
4. 通过 G5 门控（Implementation Quality）
```

#### Phase 5 — 测试验证

```markdown
请执行 Phase 5：测试验证。

1. 执行测试矩阵
2. 输出测试结果
3. 通过 G5-PHASE5 门控
```

#### Phase 6 — 三层对抗审查

```markdown
请执行 Phase 6：三层对抗审查。

1. Blind Hunter 审查
2. Edge Case Hunter 审查
3. Acceptance Auditor 审查
4. 通过 G3-PHASE6 门控
```

#### Phase 7 — Canary 灰度发布

```markdown
请执行 Phase 7：Canary 灰度发布。

1. 10% → 50% → 100% 分批上线
2. 每批间隔自动健康检查
3. 异常自动回滚
4. 通过 G7 门控（Canary Readiness）
```

#### Phase 8 — 知识归档

```markdown
请执行 Phase 8：知识归档。

1. LESSONS 提取与沉淀
2. Domain Skills Promotion
3. 跨波经验注入
4. 通过 G8 门控（Archive Readiness）
```

---

## hook-manager

### 用途

管理会话前后的自动检查 Hook。

### 等效命令

```bash
python bin/hook-manager.py session-start
python bin/hook-manager.py session-end
```

### 纯 Markdown 指令

#### 会话开始检查

```markdown
请执行会话开始 Hook 检查：

1. 检查 `.devflow/STATE.md` 是否存在且内容有效
2. 验证当前 Phase 状态
3. 检查记忆文件完整性（PROJECT_CONTEXT.md, DECISIONS.md, LESSONS.md）
4. 检测 GitNexus 是否可用，不可用则提示降级方案
5. 输出会话初始化报告
```

#### 会话结束检查

```markdown
请执行会话结束 Hook 检查：

1. 更新 `.devflow/STATE.md`，记录当前进度
2. 检查所有产物是否已保存
3. 更新 LESSONS.md（如有经验教训）
4. 生成会话结束摘要
```

---

## token-manager

### 用途

7级 Token 压缩监控和建议。

### 等效命令

```bash
python bin/token-manager.py status
python bin/token-manager.py analyze .devflow
```

### 纯 Markdown 指令

#### 查看 Token 使用状态

```markdown
请检查 Token 使用情况：

1. 估算当前对话的 Token 消耗
2. 检查 session 和 task 级别的使用率
3. 根据使用率推荐压缩级别（lite/full/ultra/extreme）
```

#### 分析目录 Token 消耗

```markdown
请分析以下目录的 Token 消耗：

目录: <目录路径>

请按以下步骤操作：
1. 扫描目录下的所有 .md 文件
2. 估算每个文件的 Token 数量
3. 列出 Token 消耗 Top 10 的文件
4. 给出压缩建议
```

### 7级压缩规则参考

| 级别 | 名称 | 节省比例 | 规则 |
|------|------|---------|------|
| 1 | lite | 30% | 删除废话词（just, really, basically） |
| 2 | full | 50% | 删除冠词 + 缩短短语（in order to→to） |
| 3 | ultra | 65% | 技术缩写 + 符号替换（database→DB） |
| 4 | extreme | 75% | 极限压缩（information→info） |
| 5 | wenyan-lite | 40% | 半文言（need to→需） |
| 6 | wenyan-full | 60% | 全文言（我→吾） |
| 7 | wenyan-ultra | 75% | 极致文言（需要→需） |

---

## external-adapter

### 用途

检测和使用外部工具（GitNexus、grep、ripgrep 等）。

### 等效命令

```bash
python bin/external-adapter.py health
python bin/external-adapter.py search <symbol>
python bin/external-adapter.py call-chain <function>
```

### 纯 Markdown 指令

#### 外部工具健康检查

```markdown
请检测外部工具可用性：

1. 检查 gitnexus/grep/ripgrep/git/npm/node 是否安装
2. 标注必需工具和可选工具
3. 输出工具链健康报告
```

#### 符号搜索

```markdown
请在项目中搜索符号 `<symbol>`：

1. 优先使用 GitNexus 搜索
2. 降级使用 rg（ripgrep）搜索
3. 最终降级使用 grep 搜索
4. 输出搜索结果和相关文件列表
```

#### 调用链分析

```markdown
请分析函数 `<function_name>` 的调用链：

1. 优先使用 GitNexus 调用链分析
2. 降级使用 grep 搜索定义和调用
3. 输出调用链图谱
```

#### 文件依赖分析

```markdown
请分析文件 `<file_path>` 的依赖关系：

1. 优先使用 GitNexus 依赖分析
2. 降级使用 grep 搜索 import/require 语句
3. 输出依赖关系图
```

---

## memory-system

### 用途

管理 `.devflow/memory/` 下的记忆文件。

### 等效命令

```bash
python bin/memory-system.py read PROJECT_CONTEXT
python bin/memory-system.py write LESSONS
```

### 纯 Markdown 指令

#### 读取记忆文件

```markdown
请读取 `.devflow/memory/` 下的记忆文件：

1. 读取 PROJECT_CONTEXT.md，提取项目背景
2. 读取 DECISIONS.md，提取历史决策
3. 读取 LESSONS.md，提取经验教训
4. 输出摘要报告
```

#### 写入记忆文件

```markdown
请将以下内容写入 `.devflow/memory/LESSONS.md`：

经验教训: <教训内容>

要求：
1. 按时间倒序添加
2. 保持 Markdown 格式
3. 保留原有条目
```

#### 更新决策记录

```markdown
请在 `.devflow/memory/DECISIONS.md` 中新增 ADR 条目：

- 标题: <决策标题>
- 日期: <日期>
- 背景: <背景描述>
- 决策: <决策内容>
- 理由: <选择理由>
- 后果: <正面/负面后果>
- 状态: <已接受/已替代/已废弃>
```

---

## gate-check

### 用途

门控验证（G1-G8），检查阶段准入/准出条件。

### 等效命令

```bash
./scripts/gate-check.sh G1 <project-root>
./scripts/gate-check.sh G2 <project-root>
# ...
```

### 纯 Markdown 指令

#### G1 — Phase 入口门控

```markdown
请验证 G1 门控（Phase 入口条件）：

1. 检查 `.devflow/STATE.md` 是否存在
2. 检查上一阶段产物是否完整
3. 检查记忆文件是否可用
4. 输出门控验证报告
```

#### G2 — 设计质量门控

```markdown
请验证 G2 门控（设计质量条件）：

1. 检查设计方案文档是否存在
2. 验证设计方案包含必要段落（需求分析、技术方案、风险评估）
3. 验证设计方案已通过 Phase 1b 决策确认
4. 输出门控验证报告
```

#### G4 — 执行准备门控

```markdown
请验证 G4 门控（执行准备条件）：

1. 检查 Wave Plan 是否存在且格式正确
2. 检查任务依赖图是否完整
3. 检查每个任务都有明确的验收标准
4. 输出门控验证报告
```

#### G3-PHASE6 — 审查质量门控

```markdown
请验证 G3-PHASE6 门控（审查质量条件）：

1. 检查 Phase 6 审查报告是否存在
2. 验证三层审查（Blind Hunter/Edge Case/Auditor）均已完成
3. 检查所有 P0/P1 问题已修复
4. 输出门控验证报告
```

#### G5 — 实施质量门控

```markdown
请验证 G5 门控（实施质量条件）：

1. 检查 Phase 5 测试结果是否存在
2. 验证测试覆盖率达标
3. 检查所有测试用例通过
4. 输出门控验证报告
```

#### G7 — Canary 发布门控

```markdown
请验证 G7 门控（Canary 发布条件）：

1. 检查健康检查脚本是否存在
2. 检查回滚脚本是否存在
3. 验证流量 ramp-up 计划完整（10%→50%→100%）
4. 输出门控验证报告
```

#### G8 — 归档门控

```markdown
请验证 G8 门控（归档条件）：

1. 检查 LESSONS.md 是否存在且有内容
2. 检查所有 Wave SUMMARY 已收集
3. 检查 Domain Skills 已更新
4. 输出门控验证报告
```

---

## 完整流程指令

### 从零开始一个新项目

```markdown
请帮我从零开始一个新项目：

1. 运行 init 指令，初始化 .devflow/ 目录结构
2. 执行 Phase 0 战略评估
3. 根据评估结果决定是否继续
4. 如果继续，依次执行 Phase 1-8
```

### 继续已有项目

```markdown
请继续当前项目：

1. 检查 .devflow/STATE.md，确定当前进度
2. 执行当前 Phase 的工作流
3. 执行 Hook 结束检查
```

### 快速修复（Fast 模式）

```markdown
请执行 Fast 模式：快速修复。

1. 直接定位相关代码
2. 实施修复
3. 窄验证（最小测试集）
4. 更新 LESSONS.md（如有新经验）
```

### 架构重构（Strict 模式）

```markdown
请执行 Strict 模式：架构重构。

1. Phase 0: 战略评估
2. Phase 1: 需求分析（5 Whys）
3. Phase 2: 方案设计（含设计枪战）
4. Phase 3: 任务拆分（DAG 拓扑排序）
5. Phase 4: 实施开发（Wave 并行）
6. Phase 5: 测试验证
7. Phase 6: 三层对抗审查
8. Phase 7: Canary 灰度发布
9. Phase 8: 知识归档
```

---

## 迁移说明

### Python 脚本 → Markdown 指令映射

| Python 脚本 | Markdown 指令 | 保留 .py 文件 |
|------------|--------------|--------------|
| `init.py` | [init](#init) | ✅ 保留 |
| `hook-manager.py` | [hook-manager](#hook-manager) | ✅ 保留 |
| `external-adapter.py` | [external-adapter](#external-adapter) | ✅ 保留 |
| `memory-system.py` | [memory-system](#memory-system) | ✅ 保留 |
| `stage-executor.py` | [stage-executor](#stage-executor) | ✅ 保留 |
| `token-manager.py` | [token-manager](#token-manager) | ✅ 保留 |
| `gate-check.sh` | [gate-check](#gate-check) | ✅ 保留 |

### 旧版 .js 文件

所有 `bin/*.js` 文件已被 Python 脚本替代，可安全删除。

```bash
# 删除旧版 .js 文件
rm bin/*.js
```

### 零依赖验证

复制本 README 的全部内容，或仅复制需要的指令片段，即可在任何支持 Markdown 的 AI 对话中完成所有 devflow 工作流操作。

**不需要：**
- Python 运行时
- Node.js 运行时
- npm 包
- 任何系统依赖

**需要：**
- 一个支持 Markdown 的 AI 对话界面

---

## 版本信息

- **bin README 版本**: v1.0.0 (2025-05-19)
- **覆盖脚本**: 6 个 Python 脚本 + 1 个 Shell 脚本
- **等效 Markdown 指令**: 全部已提供
- **零依赖**: ✅ 验证通过
