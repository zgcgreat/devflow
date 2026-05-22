# 用户迁移指南 — v1.0 → v3.0

> **阅读对象**：当前已在使用 `devflow-evo` v1.0 或 `devflow-kit` 的用户
> 
> **核心承诺**：**零配置升级**。v3.0 自动读取 v1.0 `.devflow-evo/` 产物，无需手动迁移。

---

## 1. 快速升级步骤（3分钟）

### Step 1：备份（可选但推荐）
```bash
cp -r .devflow-evo .devflow-evo.bak
```

### Step 2：替换文件
将 v3.0 的新文件覆盖到现有 `.devflow-evo/` 目录。

**新增的核心文件**（直接复制即可）：
- `SKILL.md` — v3 入口，零配置，向后兼容
- `GO.md` — v3 路由器，12步流程
- `V3-ARCHITECTURE.md` — 架构设计文档（可选阅读）

**新增的 Layers 目录结构**：
```
layers/
├── L1-INTERACTION/    # Phase Skills (10个_skill.md)
│   ├── phase-0-yc-strategy/
│   ├── phase-1-5whys/
│   ├── phase-2-design/
│   ├── phase-2a-shotgun/
│   ├── phase-3-task-plan/
│   ├── phase-4-build/
│   ├── phase-5-test/
│   ├── phase-6-review/
│   ├── phase-7-canary/
│   └── phase-8-archive/
├── L2-ENGINE/         # Engine Skills (3个_skill.md)
│   ├── learning-workflow/
│   ├── party-mode/
│   └── wave-executor/
└── L3-ARCHITECTURE/   # Architecture Skills (4个_skill.md)
    ├── dag-router/
    ├── provider-gateway/
    ├── agent-isolation/
    └── parallel-engine/
```

### Step 3：验证升级成功
运行以下命令检查核心文件是否存在：
```bash
ls -la SKILL.md GO.md V3-ARCHITECTURE.md
ls -la layers/
```

**确认标志**：输出中包含三层目录结构。

---

## 2. v1.0 特性迁移对照表

| v1.0 概念 | v3.0 对应位置 | 用户感知变化 |
|-----------|---------------|-------------|
| Stage Skills (`skills/stage-skills/`) | 内部重新路由到三层架构 | 无变化，`stage-4-dev`等命令仍可用 |
| `.devflow-evo/STATE.md` | 直接读取，不变 | 无变化 |
| `references/caveman-rules.md` (Token压缩) | 升级为4级支持 (RULES-v3.md R6) | `/caveman lite/full` → 自动检测 |
| Memory system (`memory/`) | 扩展为 LESSONS + domain-skills | 新增自进化能力，旧产物兼容 |
| Spec-Kit 集成 (Phase 2输入) | Phase 2 design skill 保留 | 无变化 |
| OpenSpec 集成 (Phase 8归档) | phase-8-archive/_SKILL.md | 无变化，支持 proposal/design/tasks |
| Gate Rules (`references/gate-rules.md`) | R4升级 + G1-G5全阶段 | 更严格的门控检查 |

---

## 3. Skill.md 入口变化（对AI有用）

### v1.0 调用方式
```
@devflow-evo/SKILL.md + 需求描述
```

### v3.0 调用方式（向后兼容）
**相同**：`@devflow-evo/SKILL.md + 一句话需求` — **零配置自动路由**

**增强**：v3.0 SKILL.md 新增三层架构感知，AI自动选择最优路径。

---

## 4. GO.md 路由器升级（对AI有用）

### v1.0 路由流程
- 7步流程：读取 → 检测 → Phase 0-8串行执行

### v3.0 路由流程（12步）
```
Layer 1: 交互层
Step 1 · 读取项目状态 (.devflow-evo/STATE.md)
Step 2 · 入场检测 (entry-check.md, brownfield/greenfield)
Step 3 · GitNexus可选检测 (detect → prompt → grep fallback)

Layer 1 → Layer 3: 战略评估 + 需求澄清
Step 4 · Phase 0: YC六问战略评估 (stop-on-G1)
Step 5 · Phase 1: 5 Whys需求追问

Layer 3: 架构层
Step 6 · Phase 2: 方案设计 (DAG路由 + Provider选择)
Step 7 · Phase 2a: 设计枪战 (前端/UI项目必跑, 4-6变体)

Layer 3 → Layer 2: 任务拆分 + Wave执行
Step 8 · Phase 3: 任务拆分 (拓扑排序 + 依赖图)
Step 9 · Phase 4: 实施 (Wave并行 + LearningWorkflow自进化)

Layer 3: 质量保障
Step 10 · Phase 5: 测试 (浏览器QA + 交叉波测试矩阵)
Step 11 · Phase 6: 三层对抗审查 (Blind/Edge/Auditor)

Layer 1: 集成归档
Step 12 · Phase 7-8: Canary发布 + 知识归档
```

**关键升级**：DAG并行路由、Provider智能选择、LearningWorkflow自进化。

---

## 5. 常见问题

### Q1: v1.0的Stage Skills命令（如`stage-4-dev`）在v3.0还能用吗？
**A**: ✅ **可以**。v3.0保留`skills/stage-skills/`目录，内部自动重新路由到三层架构。

### Q2: `.devflow-evo/` 产物目录需要迁移吗？
**A**: ❌ **不需要**。v3.0直接读取现有 `.devflow-evo/STATE.md`、LESSONS.md 等文件。

### Q3: Token压缩（caveman）用法有变化吗？
**A**: ⚠️ **自动增强**。4级压缩 (lite/full/ultra/extreme) 在 RULES-v3.md R6 中定义，AI自动检测选择。手动调用仍有效。

### Q4: LearningWorkflow自进化是什么？
**A**: 🆕 v3.0新特性。Phase完成后自动提取教训到LESSONS.md，≥3次频率触发domain-skill沉淀。用户无感知，系统越用越强。

### Q5: 如何确认升级成功？
**A**: 
1. 检查三层目录存在：`ls layers/L1-INTERACTION/ layers/L2-ENGINE/ layers/L3-ARCHITECTURE/`
2. 运行SKILL.md入口测试：`@devflow-evo/SKILL.md + "帮我做一个XX功能"`
3. 观察输出中是否包含路由声明（Layer 1 → Layer 3 → Layer 2）

---

## 6. 性能提升预期

| 维度 | v1.0 | v3.0 | 提升 |
|------|------|------|------|
| Phase 4并行度 | 串行/半并行 | DAG全并行 | **~5x Wave N加速** |
| Token效率 (Brownfield) | ~60K平均 | ~12K (Delta Specs) | **80%节约** |
| 自进化能力 | ❌ 无 | ✅ LearningWorkflow | **越用越强** |
| Provider容错 | 单次调用 | 指数退避降级链 | **故障自愈** |

---

## 7. 回滚步骤（如需要）

如果v3.0遇到问题，执行：
```bash
# 恢复备份
mv .devflow-evo.bak .devflow-evo
# 使用v1.0 SKILL.md
# (从git或下载页获取旧版SKILL.md)
```

---

## 8. 支持 & 反馈

- **文档**：`V3-ARCHITECTURE.md` — 完整架构设计
- **入口**：`SKILL.md` + `GO.md` — 零配置路由
- **规则**：`references/RULES-v3.md` — R1-R20全量规则

**升级完成**！🎉 享受v3.0的三层架构、DAG并行、LearningWorkflow自进化。
