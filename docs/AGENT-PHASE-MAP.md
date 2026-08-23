# Agent-Phase 映射表

> ForgeOS v1.0.0 — 核心Agent与扩展Agent的Phase映射、Token预算与加载策略

## 1. 核心Agent映射矩阵

| Agent | P0 | P1(5Whys) | P1b | P2 | P2a | P3 | P4 | P5 | P6 | P7 | P8 |
|-------|----|-----------|-----|----|----|----|----|----|----|----|----|
| **planner** | ✅ 种子捕获+战略分解 | ✅ 深度需求分解+AC验证 | ✅ 歧义检测+决策结构化 | — | — | ✅ ADR→Task映射+DAG | — | — | — | — | — |
| **architect** | — | ✅ 技术选型辅助 | ✅ 技术选型对比+CONTEXT.md | ✅ 架构方案+ADR+Brownfield | ✅ 变体维度规划+加权评分 | — | — | — | — | — | — |
| **code-explorer** | ✅ 面包屑收集+代码库扫描 | — | — | ✅ 代码库扫描+影响范围 | — | — | — | — | — | — | — |
| **build-error-resolver** | — | — | — | — | — | — | ✅ 编译错误诊断+依赖冲突 | — | — | — | — |
| **security-reviewer** | — | — | — | — | — | — | — | ✅ OWASP Top10+安全边界 | ✅ Security Specialist | — | — |
| **code-reviewer** | — | — | — | — | — | — | — | — | ✅ Blind Hunter增强 | — | — |
| **refactor-cleaner** | — | — | — | — | — | — | — | — | ✅ 修复建议结构化 | — | — |

**图例**: ✅ = 激活参与, — = 不参与

## 2. 核心Agent详细映射

### 2.1 planner (always, token_budget: 2000)

| Phase | 介入Step | 增强说明 |
|-------|---------|---------|
| P0 | 种子捕获 + 面包屑整理 | 将用户种子结构化为需求草案，识别模糊点，输出 SEED.md |
| P1 | 5 Whys 分析 + 用户故事生成 | 深度需求分解，从5层根因推导AC，验证AC可测性 |
| P1b | 歧义识别 + 决策结构化 | 检测未决歧义点，将开放式讨论收敛为结构化决策表 |
| P3 | ADR解析 + DAG构建 + Wave并行度 | 将ADR拆解为可执行Task，构建依赖DAG，优化Wave并行度 |

### 2.2 architect (always, token_budget: 2000)

| Phase | 介入Step | 增强说明 |
|-------|---------|---------|
| P1 | 风险评估 | 技术选型辅助，识别架构风险，输出风险评估摘要 |
| P1b | 问答 + CONTEXT.md生成 | 技术选型对比，填充CONTEXT.md技术上下文段 |
| P2 | 方案设计 + ADR记录 | 架构方案设计，生成ADR记录，Brownfield影响分析 |
| P2a | 变体规划 + 加权评分 + 混合推荐 | 变体维度规划，AI推荐，最终规格合成 |

### 2.3 code-explorer (always, token_budget: 2000)

| Phase | 介入Step | 增强说明 |
|-------|---------|---------|
| P0 | 面包屑收集 | 代码库快速扫描，收集相关文件路径和模块边界 |
| P2 | 上下文加载 | 深度代码库扫描，标注影响范围，为方案设计提供精确上下文 |

### 2.4 build-error-resolver (always, token_budget: 2000)

| Phase | 介入Step | 增强说明 |
|-------|---------|---------|
| P4 | 编译错误诊断 + 依赖冲突解决 | 编译/构建错误自动诊断，最小diff修复，依赖版本冲突解决 |

### 2.5 security-reviewer (always, token_budget: 2000)

| Phase | 介入Step | 增强说明 |
|-------|---------|---------|
| P5 | OWASP Top10扫描 + 安全边界测试 | 自动安全扫描，注入/SSRF/敏感数据泄露检测 |
| P6 | Security Specialist审查 | 安全维度代码审查，与code-reviewer互补 |

### 2.6 code-reviewer (always, token_budget: 2000)

| Phase | 介入Step | 增强说明 |
|-------|---------|---------|
| P6 | Blind Hunter增强 | 全维度代码质量审查，与security-reviewer互补 |

### 2.7 refactor-cleaner (always, token_budget: 2000)

| Phase | 介入Step | 增强说明 |
|-------|---------|---------|
| P6 | 修复建议结构化 | 将审查发现的结构化修复建议，死代码检测与清理 |

## 3. 扩展Agent映射矩阵

| 技术栈 | Agent文件 | load_policy | 触发条件 | 激活Phase |
|--------|----------|-------------|---------|----------|
| **python** | python-reviewer.md, django-reviewer.md, django-build-resolver.md, fastapi-reviewer.md | on-demand | `.py` / `requirements.txt` / `pyproject.toml` | P4, P5, P6 |
| **go** | go-reviewer.md, go-build-resolver.md | on-demand | `.go` / `go.mod` | P4, P5, P6 |
| **rust** | rust-reviewer.md, rust-build-resolver.md | on-demand | `.rs` / `Cargo.toml` | P4, P5, P6 |
| **java** | java-reviewer.md, java-build-resolver.md | on-demand | `.java` / `pom.xml` / `build.gradle` | P4, P5, P6 |
| **kotlin** | kotlin-reviewer.md, kotlin-build-resolver.md | on-demand | `.kt` / `.kts` | P4, P5, P6 |
| **flutter** | flutter-reviewer.md, flutter-build-resolver.md | on-demand | `pubspec.yaml` / `.dart` | P4, P5, P6 |
| **cpp** | cpp-reviewer.md, cpp-build-resolver.md | on-demand | `.cpp` / `.h` / `CMakeLists.txt` | P4, P5, P6 |
| **swift** | swift-reviewer.md | on-demand | `.swift` / `Package.swift` | P4, P5, P6 |
| **typescript** | typescript-reviewer.md | on-demand | `tsconfig.json` / `.tsx` / `.ts` | P4, P5, P6 |
| **database** | db-migration-reviewer.md | on-demand | migration文件 / schema变更 / ORM配置 | P4, P6 |
| **network** | network-config-reviewer.md | on-demand | `nginx.conf` / docker网络 / API网关配置 | P4, P6 |
| **performance** | performance-analyzer.md | on-demand | Phase 6 检测到性能问题 | P6 |

## 4. Token预算分配

### 4.1 每Phase预算上限

| Phase | 核心Agent数 | 核心Token | 扩展Token(上限) | 总预算上限 |
|-------|-----------|----------|---------------|-----------|
| P0 | 2 (planner+code-explorer) | 4000 | 0 | 4000 |
| P1 | 2 (planner+architect) | 4000 | 0 | 4000 |
| P1b | 2 (planner+architect) | 4000 | 0 | 4000 |
| P2 | 2 (architect+code-explorer) | 4000 | 0 | 4000 |
| P2a | 1 (architect) | 2000 | 0 | 2000 |
| P3 | 1 (planner) | 2000 | 0 | 2000 |
| P4 | 1 (build-error-resolver) | 2000 | 2000 (按技术栈) | 4000 |
| P5 | 1 (security-reviewer) | 2000 | 2000 (按技术栈) | 4000 |
| P6 | 3 (code-reviewer+security-reviewer+refactor-cleaner) | 6000 | 2000 (按技术栈) | 8000 |
| P7 | 0 | 0 | 0 | 0 |
| P8 | 0 | 0 | 0 | 0 |

### 4.2 预算控制规则

1. **核心Agent**: 每个 token_budget=2000，always 加载，不可跳过
2. **扩展Agent**: 每个 token_budget≤1000，on-demand 加载，仅在技术栈匹配时激活
3. **单Phase上限**: 核心Token + 扩展Token ≤ 总预算上限
4. **全流程累计**: 核心Token ≤ 18000，扩展Token ≤ 6000，总计 ≤ 24000（增幅<30% 相对纯ForgeOS基线~80000）
5. **超预算处理**: 若某Phase扩展Agent总Token超限，按优先级裁剪：reviewer > build-resolver > 其他
6. **Phase 7/8**: 无Agent参与，纯流程控制，Token消耗为零

### 4.3 Token增幅验证

| 指标 | 纯ForgeOS | ForgeOS(含Agent) | 增幅 |
|------|----------|-------------------|------|
| 单Phase最大增幅 | — | P6: +8000 | +10% |
| 全流程Agent累计 | 0 | 24000(上限) | <30% ✅ |
| 基线Prompt约 | ~80000 | ~104000 | +30% |

> **结论**: Agent Token增幅控制在30%以内，满足融合原则R11（选择性加载）

## 5. 技术栈检测规则

### 5.1 Phase 0 自动检测

Phase 0 执行时，AI 自动扫描项目文件，识别技术栈并记录到 `CONTEXT.md` 的 `tech_stack` 字段。

| 技术栈 | 检测文件/模式 | 触发的扩展Agent |
|--------|-------------|----------------|
| python | `*.py`, `requirements.txt`, `pyproject.toml`, `setup.py` | python-reviewer, fastapi-reviewer/django-reviewer, django-build-resolver |
| go | `*.go`, `go.mod`, `go.sum` | go-reviewer, go-build-resolver |
| rust | `*.rs`, `Cargo.toml`, `Cargo.lock` | rust-reviewer, rust-build-resolver |
| java | `*.java`, `pom.xml`, `build.gradle`, `build.gradle.kts` | java-reviewer, java-build-resolver |
| kotlin | `*.kt`, `*.kts` | kotlin-reviewer, kotlin-build-resolver |
| flutter | `pubspec.yaml`, `*.dart` | flutter-reviewer, flutter-build-resolver |
| cpp | `*.cpp`, `*.h`, `*.hpp`, `CMakeLists.txt`, `Makefile` | cpp-reviewer, cpp-build-resolver |
| swift | `*.swift`, `Package.swift` | swift-reviewer |
| typescript | `tsconfig.json`, `*.ts`, `*.tsx` | typescript-reviewer |
| database | `migrations/`, `*.sql`, `schema.rb`, `prisma/schema.prisma` | db-migration-reviewer |
| network | `nginx.conf`, `docker-compose*.yml`, `*.gateway.yml` | network-config-reviewer |

### 5.2 框架二次检测

Python 技术栈检测后，进一步识别 Web 框架：

| 框架 | 检测文件/模式 | 触发的扩展Agent |
|------|-------------|----------------|
| Django | `manage.py`, `settings.py`, `urls.py` | django-reviewer, django-build-resolver |
| FastAPI | `*.py` 含 `from fastapi` / `app = FastAPI(` | fastapi-reviewer |
| Flask | `*.py` 含 `from flask` / `Flask(__name__)` | python-reviewer（共用） |

### 5.3 检测输出格式

```yaml
# CONTEXT.md 中 tech_stack 字段示例
tech_stack:
  primary: [python, typescript]
  frameworks: [fastapi, react]
  database: postgresql
  detected_agents:
    - python-reviewer (on-demand)
    - fastapi-reviewer (on-demand)
    - typescript-reviewer (on-demand)
    - db-migration-reviewer (on-demand)
```

### 5.4 检测规则

1. **仅Phase 0执行一次**: 技术栈检测结果写入 CONTEXT.md，后续Phase直接读取
2. **多技术栈并存**: 允许多个技术栈同时激活（如前后端分离项目）
3. **动态追加**: 若 Phase 4 引入新依赖，可追加检测，但不覆盖已有结果
4. **零运行时降级**: 无 Node.js 时，AI 按文件名模式手动匹配，不执行脚本

## 6. 加载策略

### 6.1 加载时序

```
Phase 0: 检测技术栈 → 加载 core: planner + code-explorer → 写入 CONTEXT.md
Phase 1: 加载 core: planner + architect
Phase 1b: 加载 core: planner + architect
Phase 2: 加载 core: architect + code-explorer
Phase 2a: 加载 core: architect
Phase 3: 加载 core: planner
Phase 4: 加载 core: build-error-resolver + 扩展: (按tech_stack激活)
Phase 5: 加载 core: security-reviewer + 扩展: (按tech_stack激活)
Phase 6: 加载 core: code-reviewer + security-reviewer + refactor-cleaner + 扩展: (按tech_stack激活)
Phase 7: 无Agent
Phase 8: 无Agent
```

### 6.2 Agent文件路径

| 类别 | 路径模式 |
|------|---------|
| 核心 | `agents/core/<agent-name>.md` |
| 扩展 | `agents/extended/<tech>/<agent-name>.md` |

### 6.3 加载规则

1. **always**: 每个 Phase 开始时自动加载对应核心Agent，无需检测
2. **on-demand**: Phase 4/5/6 才可能激活，需 CONTEXT.md 中 `tech_stack` 匹配
3. **未匹配**: 若项目技术栈不在扩展Agent覆盖范围内，仅使用核心Agent，不报错
4. **性能优先**: 单次最多加载 3 个扩展Agent（P6 多审查场景），超出按 Token 预算裁剪

## 7. Phase 7/8 说明

Phase 7（Canary 部署）和 Phase 8（归档）不涉及 Agent 增强：

- **Phase 7**: 纯运维流程，由 AI 按 checklist 执行，无需 Agent 辅助
- **Phase 8**: 归档与知识沉淀，由 LearningWorkflow 处理，Agent 不直接参与

---

> 本文档由 M1-S1-4 生成，与 `agents/core/*.md` frontmatter 和 `agents/extended/*/README.md` 保持同步