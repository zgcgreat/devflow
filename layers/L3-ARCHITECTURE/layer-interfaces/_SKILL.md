---
name: layer-interfaces
version: 3.0-draft
layer: L3-ARCHITECTURE
gate: internal
requires: [cross-layer-call]
provides: [interface-contract, coupling-report]
description: Formal interface contracts between L1, L2, and L3 layers to reduce coupling and enable independent evolution
source: devflow-evo architecture + clean architecture principles
dependencies: []
triggers:
  - cross-layer call
  - architecture validation
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
node validate-layers.js /path/to/devflow-evo

# 输出违规项
# VIOLATION: L1 phase-4-build references L3 dag-router directly
# VIOLATION: L3 parallel-engine imports L2 executor
```

## 实现方式

- 每层导出 `bridge.js` 作为唯一对外接口
- 内部模块不直接 export 给其他层
- 验证脚本在 CI 中运行
