---
name: scale-domain-adaptive
version: 3.2.2
layer: L2-ENGINE
gate: internal
requires: [phase-0, hooks-system]
provides: [dynamic-planning-depth, domain-complexity-mapping, scale-detection, workflow-adaptation]
description: BMAD-METHOD inspired dynamic planning depth — auto-adjust Phase granularity based on project scale and domain complexity
source: BMAD-METHOD domain-complexity.csv + bmad-create-architecture workflow selection
---

# Scale-Domain-Adaptive — 动态规划深度

## 核心能力

借鉴 BMAD-METHOD 的领域复杂度矩阵,根据项目规模(domain signals)和领域复杂度自动调整 Phase 规划深度。
**小项目快速通过,大项目精细打磨。**

## 设计理念

DevFlow-Evo v3.2 之前是**固定粒度**的 Phase 流程,无论项目是 5 个文件的脚本还是 500 模块的微服务架构。
Scale-Domain-Adaptive 引入三级粒度映射:

| 项目规模 | Phase 粒度 | Phase 数量 | 适用场景 |
|---------|-----------|-----------|---------|
| **Lite** (≤3 模块) | 压缩 | 5-7 步 | 个人脚本、demo、快速原型 |
| **Standard** (4-20 模块) | 标准 | 9-11 步 | 中小型项目、单一功能迭代 |
| **Enhanced** (21-100 模块) | 增强 | 11-13 步 | 中型项目、跨模块重构 |
| **Advanced** (>100 模块) | 精细 | 13-15 步 | 大型系统、微服务、架构演进 |

## 领域复杂度映射

基于 BMAD-METHOD 的 `domain-complexity.csv`,扩展为更完整的信号库:

### 复杂度评估规则

```yaml
# 领域信号扫描 → 复杂度评级
domain_signal_scanner:
  high_compliance_domains:
    - fintech: ["banking", "payment", "trading", "PCI", "GDPR"]
    - healthcare: ["HIPAA", "FDA", "patient", "clinical"]
    - government: ["accessibility", "security_clearance", "audit"]
    → 强制: Enhanced 起步, Phase 2 增加 compliance check

  high_concurrency_domains:
    - social: ["real-time", "feed", "notification", "websocket"]
    - iot: ["sensor", "edge", "MQTT", "Kafka"]
    - gaming: ["multiplayer", "real-time", "matchmaking"]
    → 强制: Enhanced 起步, Phase 4 增加 load testing

  high_data_domains:
    - media: ["CDN", "streaming", "encoding", "S3"]
    - education: ["LMS", "video", "progress_tracking"]
    - process_control: ["SCADA", "PLC", "MES", "real-time"]
    → 强制: Enhanced 起步, Phase 5 增加 data integrity test

  standard_domains:
    - productivity: ["tasks", "workflow", "collaboration"]
    - e_commerce: ["cart", "checkout", "payment"]
    - blog: ["posts", "comments", "markdown"]
    → Standard 粒度
```

### 信号检测算法

```
Phase 0 (启动) 自动执行:

1. 扫描项目根目录结构
   ├── 统计模块数 (package.json dependencies / requirements.txt packages / Go modules)
   ├── 检测领域信号文件 (.domain-signals / bmads-domain.json)
   └── 检测项目特征文件 (Dockerfile, docker-compose, monorepo 结构)

2. 根据模块数量定规模等级:
   - ≤3 模块 → Lite (5-7 Phase)
   - 4-20 模块 → Standard (9-11 Phase)
   - 21-100 模块 → Enhanced (11-13 Phase)
   - >100 模块 → Advanced (13-15 Phase)

3. 根据领域复杂度升/降级:
   - 检测到 high_compliance 信号 → +1 级粒度
   - 检测到 high_concurrency 信号 → +1 级粒度
   - 用户手动指定 /dfevo:scale [lite|standard|enhanced|advanced] → 覆盖自动检测

4. 输出 Scale 报告:
   "项目规模: Standard (12 模块)
    领域信号: e_commerce (cart, checkout, payment) → 未触发强制升规
    最终粒度: Standard (11 Phase, 含标准 Phase 0-8 + G0-G8)"
```

## Phase 粒度映射

### Lite 模式 (5-7 Phase)

```
压缩 Phase 序列:
  G0 → Phase 1 → Phase 3 → Phase 4 → Phase 5 → Phase 8
  (需求 → 设计 → 实施 → 测试 → 归档)
  跳过: Phase 0 (快速启动), Phase 2 (精简设计), Phase 6/7 (跳过独立审查)
```

### Standard 模式 (9-11 Phase)

```
标准 Phase 序列 (默认):
  G0 → Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
  (启动 → 需求 → 设计 → 任务分解 → 实施 → 测试 → 审查 → 发布 → 归档)
```

### Enhanced 模式 (11-13 Phase)

```
增强 Phase 序列:
  + Phase 2.5 (compliance/security review, 仅 high_compliance 领域)
  + Phase 4.5 (load/performance testing, 仅 high_concurrency 领域)
  + Phase 6.5 (data integrity review, 仅 high_data 领域)
  → 总计 12-14 Phase
```

### Advanced 模式 (13-15 Phase)

```
精细 Phase 序列:
  + Phase 2.5 (compliance/security review)
  + Phase 3.5 (dependency impact analysis, 使用 codegraph-bridge)
  + Phase 4.5 (load/performance testing + integration test)
  + Phase 6.5 (security audit + data integrity)
  + Phase 7.5 (canary deployment with metrics)
  + Phase 8.5 (post-decision monitoring window)
  → 总计 15-16 Phase
```

## Hooks 集成

Scale-Domain-Adaptive 与 hooks-system 深度集成:

| Hooks 钩子 | Scale 联动 |
|-----------|----------|
| **Phase-Transition** | 根据 Scale 级别决定 checkpoint 详细程度 |
| **Context-Monitor** | Advanced 模式阈值更严格 (warn:40, compress:60) |
| **Tool-Execution** | Enhanced/Advanced 模式下自动审计所有工具调用 |

```yaml
# Scale 感知的 Hooks 默认配置
hooks_defaults_by_scale:
  lite:
    context-monitor:
      check_interval: 150  # 减少检查频率
      warn: 60
      compress: 80
    phase-transition:
      checkpoint_detail: minimal  # 仅保存 SUMMARY
    tool-execution:
      audit_all: false
      max_calls_per_phase: 50

  standard:
    context-monitor:
      check_interval: 100
      warn: 50
      compress: 70
    phase-transition:
      checkpoint_detail: normal
    tool-execution:
      audit_all: false
      max_calls_per_phase: 100

  enhanced:
    context-monitor:
      check_interval: 80
      warn: 45
      compress: 65
    phase-transition:
      checkpoint_detail: detailed  # 保存 SUMMARY + DAG snapshot
    tool-execution:
      audit_all: true  # 审计所有调用
      max_calls_per_phase: 150

  advanced:
    context-monitor:
      check_interval: 60  # 高频检查
      warn: 40  # 更低的 warn 阈值
      compress: 60
    phase-transition:
      checkpoint_detail: full  # 保存 SUMMARY + DAG + CodeGraph index + build manifest
    tool-execution:
      audit_all: true
      max_calls_per_phase: 200
```

## 用户命令

```bash
# 手动指定 Scale (覆盖自动检测)
/dfevo:scale lite|standard|enhanced|advanced

# 查看当前 Scale 状态
/dfevo:scale status

# 运行时动态调整 Scale (触发 surface-switch 联动)
/dfevo:scale enhanced  # → 自动扩展 Phase 序列 + 调整 Hooks 配置
```

## 与 BMAD-METHOD 对比

| 特性 | BMAD-METHOD | DevFlow-Evo |
|------|-----------|-----------|
| **复杂度评估** | domain-complexity.csv 静态表 | 动态扫描 + 信号检测 |
| **流程选择** | 硬编码 standard/enhanced/advanced | 自动映射到 Phase 粒度 |
| **信号来源** | 人工维护 .domain-signals | 自动扫描目录结构 + package.json + Dockerfile |
| **Phase 映射** | bmad-sprint-planning 手动选择 | 自动映射到 G0-G8 门控链 |
| **Hooks 联动** | 无 | Context-Monitor/Phase-Transition 自动适配 |
| **运行时调整** | 不支持 | `/dfevo:scale` 动态切换 |

## Phase 集成

### Phase 0 (启动) — Scale 检测入口
- 执行信号扫描算法
- 输出 Scale 报告
- 用户可手动覆盖
- 触发 hooks-system 加载对应的 hooks_defaults_by_scale

### Phase 3 (任务分解) — Scale 感知
- Lite: 直接生成任务列表,不分 Wave
- Standard: 标准 Wave 分割
- Enhanced/Advanced: Wave + 依赖 DAG + codegraph affected 影响分析

### Phase 4 (实施) — Scale 感知
- Lite: 直接实施,Phase 4→5 转换
- Standard: 标准 Wave 执行
- Enhanced/Advanced: Wave + Phase-Transition checkpoint 保存详细快照

### Phase 8 (归档) — Scale 感知
- Lite: 仅保存 SUMMARY
- Standard: SUMMARY + LESSONS
- Enhanced: SUMMARY + LESSONS + Domain-Skills
- Advanced: SUMMARY + LESSONS + Domain-Skills + 完整回滚点
