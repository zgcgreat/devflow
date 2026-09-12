---
name: layer-interfaces
version: 3.0.0
layer: L3-ARCHITECTURE
gate: internal
implementation: spec-only
requires: []
provides: [interface-contract, coupling-report]
description: Formal interface contracts between L1, L2, and L3 layers to reduce coupling and enable independent evolution
source: DevFlow architecture + clean architecture principles
dependencies: []
triggers:
  - cross-layer call
  - architecture validation
runtime-inputs: [cross-layer-call]
---

# Layer Interfaces — 层接口契约

## 问题

当前三层间耦合度不清晰：L1 Phase 技能直接调用 L2 Engine 的具体实现，L2 直接依赖 L3 的具体模块。

## 接口定义

### L1 → L2 接口 (Phase 调用 Engine)

```typescript
// L1 只能通过此接口调用 L2
interface IEngineBridge {
  // 阶段路由
  routePhase(currentState: ProjectState, input: UserInput): PhaseAction;
  
  // 门禁检查
  checkGate(projectDir: string, targetPhase: string): GateResult;
  
  // 记忆操作
  loadMemory(projectDir: string, options?: MemoryOptions): MemoryStore;
  saveDecision(projectDir: string, decision: Decision): void;
  saveLesson(projectDir: string, lesson: Lesson): void;
  
  // 变更管理
  createChange(projectDir: string, name: string, goal: string): string;
  applyChange(changeDir: string, mainSpec: string): ApplyResult;
  verifyChange(changeDir: string): VerifyResult;
  
  // 压缩
  compressMemory(projectDir: string, level: CompressionLevel): CompressResult;
}
```

### L2 → L3 接口 (Engine 调用 Architecture)

```typescript
// L2 只能通过此接口调用 L3
interface IArchitectureBridge {
  // DAG 路由
  planExecution(tasks: Task[]): ExecutionPlan;
  
  // Provider 选择
  selectProvider(taskType: TaskType): ProviderConfig;
  
  // Agent 隔离
  createAgent(config: AgentConfig): AgentHandle;
  
  // 代码理解
  analyzeFile(path: string): FileStructure;
  computeBlastRadius(files: string[]): ImpactReport;
  buildDependencyGraph(scope: string): DependencyGraph;
}
```

### L1 ↔ L3 禁止直接调用

L1 (Phase 技能) 不得直接调用 L3 (Architecture) 模块。所有调用必须经过 L2 中转。

## 依赖规则

```
L1 (INTERACTION)
  ↓ 可调用
L2 (ENGINE)
  ↓ 可调用
L3 (ARCHITECTURE)

禁止:
  L1 → L3 (直接调用)
  L2 → L1 (反向依赖)
  L3 → L2 (反向依赖)
  L3 → L1 (反向依赖)
```

## 验证

```bash
# 检查层间依赖是否合规
node validate-layers.js /path/to/DevFlow

# 输出违规项
# VIOLATION: L1 phase-4-build references L3 dag-router directly
# VIOLATION: L3 parallel-engine imports L2 executor
```

## 实现方式

- 每层导出 `bridge.js` 作为唯一对外接口
- 内部模块不直接 export 给其他层
- 验证脚本在 CI 中运行

## Error Taxonomy (Layer Interfaces 专属)

| Level | Name | Action | Impact |
|-------|------|--------|--------|
| P0 | L1_DIRECT_L3_CALL | Phase 技能直接调用 L3 模块 → 阻断并要求经 L2 中转 | 架构违规，破坏隔离性，必须修复 |
| P1 | BRIDGE_CONTRACT_BREAK | L2 bridge 接口签名变更但 L1 未更新 → 版本锁定 + 兼容层 | 跨层编译失败 |
| P2 | REVERSE_DEPENDENCY | L3/L2 反向依赖上层 → validate-layers 检测并告警 | 耦合度上升，非阻塞 |
| P3 | BRIDGE_METHOD_UNUSED | bridge 导出方法无消费者 → 标记 deprecated，下版移除 | 死代码，非阻塞 |

## Boundary Conditions (Layer Interfaces)

| Condition | Action | Rationale |
|-----------|--------|-----------|
| L1 需要调用 L3 功能 | 必须经 IEngineBridge → IArchitectureBridge 两跳 | 强制三层隔离，任何直调都是 P0 违规 |
| 新增跨层接口方法 | L2 bridge 同步更新，旧方法保留 1 个版本周期 | 防止接口变更导致跨层断裂 |
| validate-layers 检出违规 | CI 阻断，标记为 P0/P1 修复项 | 架构一致性是系统健康的底线 |
| L2 bridge 方法数 > 15 | 评估拆分为子接口（如 IEngineBridgeRouting / IEngineBridgeMemory） | 单接口过大降低可维护性 |
