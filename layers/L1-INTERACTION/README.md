# Layer 1: 交互层 (SuperCorp) — Zero-Threshold Entry

## Phase 0-8 全流程实现

此目录封装 SuperCorp 的全部 Phase Skill，作为 v3.0 的零门槛用户入口。

### 文件结构

```
L1-INTERACTION/
├── README.md              ← 本文件
├── phase-0-yc-strategy/      # YC六问战略评估 ⭐v3入口
│   └── _SKILL.md
├── phase-1-5whys/            # ⭐5 Whys需求追问 (v3新增 _SKILL.md)
│   └── _SKILL.md
├── phase-2-design/           # ⭐方案设计 (v3新增 _SKILL.md, 与L3协作)
│   └── _SKILL.md
├── phase-2a-shotgun/         # ⭐⭐设计枪战变体生成 (v3独有)
│   └── _SKILL.md
├── phase-3-task-plan/        # ⭐任务拆分/DAG拓扑 (v3新增 _SKILL.md, 与L3 DAG协作)
│   └── _SKILL.md
├── phase-4-build/            # ⭐实施/Wave并行执行 (v3新增 _SKILL.md, 对接L2引擎)
│   └── _SKILL.md
├── phase-5-test/             # ⭐测试/交叉波矩阵 (v3新增 _SKILL.md, 对接L3 QA)
│   └── _SKILL.md
├── phase-6-review/           # ⭐三层对抗审查 (v3升级)
│   └── _SKILL.md
├── phase-7-canary/           # ⭐Canary灰度发布 (v3独有)
│   └── _SKILL.md
└── phase-8-archive/          # 知识归档 + LearningWorkflow沉淀 (v3升级)
    └── _SKILL.md
```

### Layer 1 ↔ Layer 3 协作协议

| Phase | Layer 1职责 | Layer 3支持 |
|-------|------------|-------------|
| Phase 0 | YC六问输出 | - |
| Phase 1 | 5 Whys穷追 | Provider路由选择最佳模型 |
| Phase 2 | 方案理解 + 用户确认 | DAG路由 + Provider智能选择 |
| Phase 2a | **设计枪战**变体呈现给用户 | 生成4-6变体 + AI推荐最优 |
| Phase 3 | 任务优先级排序 | DAG拓扑排序 + Wave分配 |
| Phase 4 | 实施指导原则 | L2 Wave并行执行引擎 |

### Layer 1 ↔ Layer 1 内部协作

Phase 0→1→2→[2a]→3→4→5→6→7→8 线性流水线，G门控检查点。

**关键门控**:
- **G1 (Plan Quality)**: Phase 0六问中至少4个有满意回答 → 通过
- **G2 (Code Quality)**: 所有测试通过 + 代码审查通过 → 通过
- **G5 (Integration)**: Canary批次全部上线无异常 → 通过
