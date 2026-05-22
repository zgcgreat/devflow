---
name: dedup-cleanup
version: 3.0.0
layer: L3-ARCHITECTURE
gate: internal
requires: []
provides: [cleanup-plan, deduplicated-structure]
external-inputs: [duplication-report]
description: Deduplication plan for stage-skills/ and references/ directories
source: Gap Analysis P2+Architecture
status: planned
---

# Dedup Cleanup — 去重清理计划

## 1. stage-skills/ 去重

### 问题
`skills/stage-skills/` 有 17 个目录与 `layers/L1-INTERACTION/phase-*` 功能重复：
- stage-0-confirm ≈ phase-0
- stage-1-analysis ≈ phase-1
- stage-2-design ≈ phase-2
- stage-3-task ≈ phase-3
- stage-4-dev ≈ phase-4
- stage-5-test ≈ phase-5
- stage-6-review ≈ phase-6
- stage-7-integration ≈ phase-7
- stage-a-architect ≈ phase-0-yc-strategy
- stage-orchestrator ≈ L2 executor

### 方案
1. **短期**: 在 stage-skills/README.md 中标注"已由 L1 Phase 技能替代"
2. **中期**: 将 stage-skills 中 L1 没有的独有内容合并到对应 Phase
3. **长期**: 删除 stage-skills/ 目录

### 独有内容检查清单
- [ ] stage-3a-plan: 检查是否有 phase-3 没有的内容
- [ ] stage-a-evolve: 检查是否与 learning-workflow 重叠
- [ ] stage-i-intel-scan: 检查是否与 gitnexus-bridge 重叠
- [ ] stage-m-health: 检查是否与 verification-closed-loop 重叠

## 2. references/ 去重

### 问题
references/ 下有重复文件：
- `flow-kit-reference/frontend-engineer-rules.md` ≈ `reference/frontend-engineer-rules.md`
- `flow-kit-reference/tech-stacks.md` ≈ `reference/tech-stacks.md`
- `flow-kit-reference/test-pyramid.md` ≈ `reference/test-pyramid.md`
- `flow-kit-reference/ui-aesthetics.md` ≈ `reference/ui-aesthetics.md`
- `flow-kit-reference/ui-anti-patterns.md` ≈ `reference/ui-anti-patterns.md`

同时 L3 有独立 references:
- `layers/L3-ARCHITECTURE/references/context-budget.md`
- `layers/L3-ARCHITECTURE/references/gates.md`

### 方案
1. **统一到 references/**: 根级 references/ 作为唯一参考文件位置
2. **删除 flow-kit-reference/**: 合并到 references/ 后删除
3. **L3 references 保留**: 架构层专有参考文件保留在原位
4. **符号链接**: 需要从 L3 访问根级 references 时用 symlink

### 执行步骤
```bash
# 1. 比较重复文件
diff references/flow-kit-reference/frontend-engineer-rules.md references/reference/frontend-engineer-rules.md

# 2. 合并差异
# 3. 删除重复
# 4. 更新所有引用路径
```

## 3. 优先级

| 项目 | 优先级 | 风险 | 工时 |
|------|--------|------|------|
| stage-skills 去重 | P2 | 低（只影响旧路径引用） | 2h |
| references 去重 | P2 | 中（需更新所有引用） | 4h |

## Error Taxonomy (Dedup Cleanup 专属)

| Level | Name | Action | Impact |
|-------|------|--------|--------|
| P0 | REFERENCE_PATH_BREAK | 合并后旧路径引用断裂 → 全项目 grep 扫描更新所有引用 | 阻塞 Phase 4/6（编译失败/审查报错） |
| P1 | UNIQUE_CONTENT_LOSS | 合并时覆盖了 stage-skills 独有内容 → 先 diff 再 merge | 功能缺失，需回滚重合并 |
| P2 | SYMLINK_CYCLE | L3 references symlink 指向已被删除的根级文件 → symlink 校验 | 非阻塞，降级为 inline 引用 |
| P3 | STAGE_SKILLS_STALE | stage-skills/ 标注替代但仍有用户引用 → README 加迁移指引 | 非阻塞，仅影响旧路径使用 |

## Boundary Conditions (Dedup Cleanup)

| Condition | Action | Rationale |
|-----------|--------|-----------|
| 重复文件差异 > 30% | 不自动合并，标记为"需人工判定" | 差异过大可能是有意分化，自动合并会丢失信息 |
| stage-skills 独有内容 > 50 行 | 先提取到对应 L1 Phase 再删除 | 防止独有知识丢失 |
| 引用路径更新涉及 > 20 个文件 | 分批更新（每批 ≤10），每批验证 | 降低单次变更风险，便于回滚 |
| references/ 删除后 L3 symlink 失效 | 重建 symlink 或改为 inline 引用 | 确保架构层参考文件可访问 |
