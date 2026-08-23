# ForgeOS Persona-Phase 映射表

> v2.0 核心概念: Persona ≠ Execution Agent
> Persona (ECC语义) = 专业角色指令（嵌入Execution Agent）
> Execution Agent (ForgeOS语义) = 执行隔离单元，~200K独立tokens
> Cavecrew (ForgeOS语义) = 轻量级子代理，输出压缩60%注入主上下文

---

## Persona-Phase 映射表

| Phase | Gate | always Persona | on-demand Persona | Cavecrew |
|-------|------|---------------|-------------------|----------|
| P0 strategy | G0 | planner | 技术栈Persona(项目识别) | - |
| P1 5whys | G1 | planner | architect | - |
| P1b discuss | G2.5 | planner, architect | - | - |
| P2 design | G3 | architect, code-explorer | database-reviewer, network-architect | Investigator |
| P2a shotgun | G3.5 | architect | 技术栈reviewer | - |
| P3 task-plan | G4 | planner | 技术栈Persona | - |
| P4 build | G5 | build-error-resolver | 技术栈build-resolver | Builder |
| P5 test | G6 | tdd-guide, security-reviewer | 技术栈Agent | - |
| P6 review | G7 | code-reviewer, refactor-cleaner, security-reviewer | performance-optimizer | Reviewer |
| P7 canary | G7.5 | - | - | - |
| P8 archive | G8 | - | - | - |

---

## 核心 Persona (8个, always 加载)

| # | Persona | mapped_phases | 职责 | Token预算 |
|---|---------|-------------|------|----------|
| 1 | planner | P0, P1, P1b, P3 | 需求分析、根因、任务分解 | ~2K |
| 2 | architect | P1, P1b, P2, P2a | 架构设计、技术选型 | ~2K |
| 3 | code-reviewer | P6 | 代码审查 | ~2K |
| 4 | security-reviewer | P5, P6 | 安全审查 | ~2K |
| 5 | build-error-resolver | P4 | 构建错误解决 | ~2K |
| 6 | code-explorer | P0, P2 | 代码探索理解 | ~2K |
| 7 | refactor-cleaner | P6 | 重构清理 | ~2K |
| 8 | tdd-guide | P5 | TDD引导 | ~2K |

---

## 扩展 Persona (on-demand, 按技术栈触发)

| 技术栈 | Persona列表 | 触发条件 |
|--------|-----------|---------|
| Python | python-reviewer, django-reviewer, django-build-resolver, fastapi-reviewer | .py / requirements.txt / pyproject.toml |
| Go | go-reviewer, go-build-resolver | .go / go.mod |
| Rust | rust-reviewer, rust-build-resolver | .rs / Cargo.toml |
| Java | java-reviewer, java-build-resolver | .java / pom.xml / build.gradle |
| Kotlin | kotlin-reviewer, kotlin-build-resolver | .kt / .kts |
| Flutter | flutter-reviewer, dart-build-resolver | pubspec.yaml / .dart |
| C++ | cpp-reviewer, cpp-build-resolver | .cpp / CMakeLists.txt |
| Swift | swift-build-resolver | .swift / Package.swift |
| TypeScript | typescript-reviewer | .ts / .tsx / tsconfig.json |
| 数据库 | database-reviewer | *.sql / migrations/ / prisma/schema.prisma / alembic/ |
| 网络 | network-architect | nginx.conf / k8s/*.yaml / terraform/*.tf |
| 性能 | performance-optimizer | benchmark / load-test / *.bench.* |

多语言项目支持同时加载多个技术栈Persona。

---

## Cavecrew 子代理 (on-demand)

| 子代理 | mapped_phases | 职责 | Token预算 |
|--------|-------------|------|----------|
| Investigator | P2, P6 | 只读定位，file:line表格输出，~60%压缩 | ~1K |
| Builder | P4 | 1-2文件精确编辑，拒绝3+文件范围 | ~1K |
| Reviewer | P6 | Diff审查，one-line severity findings | ~1K |

---

## Persona 格式规范 (v2.0)

所有 Persona 遵循统一格式:
- frontmatter: name, description, mapped_phases, load_policy, trigger, token_budget, references
- 安全底线: 引用 rules/prompt-defense-baseline.md（不内联）
- 不含 tools/model 字段（工具权限由 Execution Agent 决定，模型由 Provider Gateway 调度）

---

## Token 预算策略

| 模式 | Persona加载 | 预算增量 |
|------|-----------|---------|
| Fast | 无Persona | 0% |
| Lean | 核心Persona | +14K |
| Standard | 核心+按需 | +14K+按需 |
| Strict | 核心+按需+安全 | +14K+按需+安全 |
| Audit | 全量 | 全量 |

硬性约束: ForgeOS Standard 基线增幅 <= ForgeOS 原版的 30%
