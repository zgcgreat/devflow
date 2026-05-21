---
name: devflow-evo
version: 3.2.0
description: |
  AI programming workflow v3.0 — 零配置·零门槛·零依赖
  三层架构: 交互层 → 引擎层 → 架构层
  使用: 加载本文件 → AI自动路由执行。扩展规则在 references/ 中按需加载。
---

# Devflow-Evo v3.0 — AI 编程工作流

> **强制声明**：以下规则 AI 必须遵守。不遵守 = 流程失效。

## 🔒 AI 行为约束（强制）

1. **先路由，后执行**：第一条回复必须是路由声明（模式 + 理由 + 流程裁剪）
2. **渐进式披露**：禁止一次性加载全部文件。只加载当前 Phase 所需内容
3. **停等确认**：模式选择、入场检测 D/E、G1/G2 门控未通过 → 必须等用户确认
4. **产物按模板**：所有产出必须使用模板格式（R19），禁止自由发挥
5. **不跳过 Phase**：Fast/Lean 允许跳过指定 Phase，Standard/Strict 禁止随意跳过
6. **先读后改**：修改文件前必须先 `read_file` 确认当前内容
7. **Token 监控**：>70% 自动压缩，>90% 暂停等待确认
8. **不隐瞒错误**：工具调用失败、数据缺失、接口报错 → 立即告知用户
9. **禁止一次性抛问题** ⭐v3.2：Phase 0/1/1b 禁止一次性列出所有问题让用户自己组织答案，必须采用「批量展示 + 逐个选择题」模式
10. **交互进度可视化** ⭐v3.2：每个 Phase 结束前必须输出进度面板（已完成/进行中/未开始）+ 门控状态

---

## ⚡ 四档模式判定

| 模式 | 触发条件 | 流程 |
|------|---------|------|
| **Fast** | ≤2 文件, <50 行, 影响 ≤1 模块 | Phase 4 直接开发 → Phase 5/6 窄验证 |
| **Lean** | ≤5 文件, <300 行, 不涉及架构/数据模型 | Phase 2(轻量) → 4 → 5/6 窄验证 → 自检 |
| **Standard** | ≤10 文件, <500 行, 影响 ≤3 模块 | Phase 0→1→2→4→5→6（可条件跳过 0/1） |
| **Strict** | 影响 >3 模块 / 新增核心架构 / 数据模型变更 / 公开 API 变更 | Phase 0→1→2→2a→3→4→5→6→7→8 全量执行 |

> **默认推荐 Standard**。实际执行中若变更超出预期 → 自动升级模式。

---

## 🔄 Phase 执行管线

```
Phase 0: YC六问战略评估        (Standard/Strict 可条件跳过)
Phase 1: 5 Whys需求追问       (Standard/Strict 可条件跳过)
Phase 2: 方案设计              (Lean: 轻量1段描述)
Phase 2a: 设计枪战 4-6变体    (前端/UI必跑，其他推荐)
Phase 3: 任务拆分 DAG         (Strict必跑)
Phase 4: 实施 Wave并行        (所有模式必跑)
Phase 5: 测试验证             (Fast/Lean: 窄验证)
Phase 6: 三层对抗审查          (Fast/Lean: 自检清单)
Phase 7: Canary灰度发布       (Standard/Strict)
Phase 8: 知识归档              (Standard/Strict)
```

---

## 🎯 AI 执行流程（统一入口）

```
Step 0.5 模式预判定 → 输出路由声明 → 等用户确认
Step 1   读取项目状态 .devflow-evo/STATE.md
Step 2   入场检测（Fast跳过/Lean简化/Standard/Strict完整）
Step 3   GitNexus可选检测（Fast/Lean跳过）
→ 根据模式跳转到对应 Phase 起点
```

**路由声明模板**：
```
🎯 建议模式：<Fast/Lean/Standard/Strict>
   理由：...
   📋 流程：<该模式的流程步骤>
   请确认或选择其他模式：1.<建议模式> 2.Fast 3.Lean 4.Standard 5.Strict
```

---

## 📋 10 条核心规则

| 规则 | 内容 |
|------|------|
| R1 | **PRD驱动**：无 PRD/需求描述不开发 |
| R2 | **四档模式**：按量化标准判定，不随意选择 |
| R3 | **入场检测**：brownfield 必跑，Fast跳过/Lean简化 |
| R4 | **Stage门禁**：缺前置产物不允许进入下一阶段 |
| R5 | **渐进式披露**：只加载当前 Phase 所需内容 |
| R6 | **Token压缩**：>70% 自动切换高级压缩 |
| R7 | **Wave并行**：DAG拓扑排序，依赖感知执行 |
| R8 | **原子提交**：每 Wave 一个 commit，可追溯 |
| R9 | **LearningWorkflow**：Phase完成→LESSONS沉淀→跨波注入 |
| R10 | **三层审查**：Fast/Lean自检，Standard/Strict三层对抗 |

> 完整 24 条规则 → `references/RULES-v3.md`（Standard/Strict 模式 Phase 1 加载）

---

## 📂 文件导航

```
SKILL.md          ← 本文件（你正在读的）
GO.md             ← 统一路由入口（Step 1-12 详细流程）

references/
  RULES-v3.md     ← 完整规则集 R1-R24
  mode-rules.md   ← 模式判定详细规则
  entry-check.md  ← 入场检测 7 种情况判定
  gate-rules.md   ← 门控验证规则

layers/
  L1-INTERACTION/ ← 交互层 Phase 0-8
  L2-ENGINE/      ← 引擎层 Wave/Learning/Token
  L3-ARCHITECTURE/← 架构层 DAG/Provider/Agent

memory/           ← 记忆系统 (LESSONS / domain-skills)
```

**按需加载指南**：
- Phase 0 → `references/entry-check.md`
- Phase 1+ → `references/RULES-v3.md`
- 模式选择 → `references/mode-rules.md`
- 门控验证 → `references/gate-rules.md`

---

## 💬 使用方式

**自然语言（推荐）**：
```
Use devflow-evo. 帮我做一个登录功能，支持邮箱密码和JWT认证
```

**明确命令（高级）**：
```
/devflow-evo new "项目名称" --tech React,Node.js --mode Standard
/devflow-evo execute 1         # Phase 4
/status                       # 查看进度
/lessons                      # 查看经验教训
```

---

## 📝 项目产物

```
.devflow-evo/
  STATE.md                   ← 跨会话状态追踪
  memory/
    PROJECT_CONTEXT.md       ← 项目背景
    DECISIONS.md             ← 历史决策
    LESSONS.md               ← 教训库
  <req-id>/                  ← 需求产物
```

---

## 📝 每个 Phase 的最小执行清单

> **规则**：每个 Phase 的 AI 输出必须包含"动作摘要 + 产出文件 + 门控状态 + 进度面板"。

| Phase | Fast/Lean 最小清单 | Standard/Strict 完整清单 |
|-------|-------------------|------------------------|
| **0** | ⏭️ 跳过 | 批量展示进度 → 逐个选择题 → 自定义输入 → G1 通过 |
| **1** | ⏭️ 跳过 | 批量展示澄清项 → 逐项选择题 → 多选支持 → 输出 `01-analysis.md` |
| **2** | 1段轻量方案描述 | 完整方案设计 + 技术选型 + 影响分析 |
| **2a** | ⏭️ 跳过 | 设计变体对比表 → AI 推荐最优 → 用户快速选择 → 更新设计文档 |
| **3** | ⏭️ 跳过 | DAG 依赖图 → Wave 计划可视化 → 用户确认/修改/合并/拆分 → 输出 Wave 计划 |
| **4** | 直接编码 + atom commit | Wave 进度面板 → 实时追踪 → Heartbeat 输出 → LESSONS 提名 |
| **5** | 窄验证（核心功能） | 测试进度面板 → 质量门交互式确认 → 不通过处理 → G2 门控 |
| **6** | 自检清单（5项） | 三层对抗审查 → 分级展示(高/中/低风险) → 交互式修复确认 |
| **7** | ⏭️ 跳过 | 发布进度面板 → 健康检查实时展示 → 一键确认/回滚 → 发布总结 |
| **8** | ⏭️ 跳过 | 归档进度可视化 → LESSONS 价值分级 → 最终统计汇总 → STATE.md 更新 |

---

## 🚦 门控检查表（AI 自测）

每个 Phase 结束前，AI 必须自评：

```markdown
## Phase <N> 完成检查

- [ ] 产物已按模板生成 → 存到 .devflow-evo/<req-id>/
- [ ] 门控条件已满足 → <G1/G2/G2.5/G5>
- [ ] 与用户确认 → <已确认/跳过/无需确认>
- [ ] Token 使用率 < 70% → <当前: XX%>
```

---

## 版本

### v3.2.0 (2026-05-20)
- **交互模式重构** ⭐ 核心改动: 禁止一次性抛给用户大量问题，改为「批量展示 + 逐个选择」
- **Phase 0-8 全部交互优化**: 每个 Phase 都提供进度可视化、选择题交互、快速确认机制
- **交互铁律** ⭐ 新增: 4步标准流程（展示全局→逐个提问→更新进度→总结门控）
- **选择题设计原则** ⭐ 新增: 严重程度/频率/技术选型/UI布局/优先级 的标准选项设计
- **Phase 4 实时进度**: Wave 执行进度面板 + Heartbeat 自动输出
- **Phase 5-8 交互式**: 测试进度/审查结果/发布监控/知识归档全部可视化

### v3.1.0 (2026-05-20)
- 四档模式升级: Fast/Lean/Standard/Strict
- 模式自适应流程: 模式×前置步骤矩阵
- 入场检测模式适配: Fast跳过/Lean简化/Standard/Strict完整
- Phase 0/1 条件跳过规则
