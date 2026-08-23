# 技术栈检测指令

> ForgeOS 在 Phase 0 启动时自动检测项目技术栈，决定加载哪些扩展 Agent 和语言规则。

---

## 检测流程

### Step 1: 文件指纹检测

扫描项目根目录及一级子目录，匹配以下文件指纹：

| 文件指纹 | 检测到的技术栈 | 应加载的扩展Agent | 应加载的语言规则 |
|---------|-------------|----------------|--------------|
| `package.json` | Node.js / TypeScript | typescript-reviewer | `rules/typescript/` |
| `tsconfig.json` | TypeScript | typescript-reviewer | `rules/typescript/` |
| `requirements.txt` / `pyproject.toml` / `setup.py` | Python | python-reviewer, django-reviewer/fastapi-reviewer | `rules/python/` |
| `go.mod` | Go | go-reviewer, go-build-resolver | — |
| `Cargo.toml` | Rust | rust-reviewer, rust-build-resolver | — |
| `pom.xml` / `build.gradle` | Java | java-reviewer, java-build-resolver | — |
| `*.kt` / `*.kts` | Kotlin | kotlin-reviewer, kotlin-build-resolver | — |
| `pubspec.yaml` | Flutter/Dart | flutter-reviewer, flutter-build-resolver | — |
| `CMakeLists.txt` / `*.cpp` | C++ | cpp-reviewer, cpp-build-resolver | — |
| `Package.swift` / `*.swift` | Swift | swift-reviewer | — |
| `nginx.conf` / `docker-compose.yml` | Infrastructure | network-config-reviewer | — |
| migration/ / schema/ | Database | db-migration-reviewer | — |

### Step 2: 框架精确识别

检测到 Python 后，进一步识别框架：

| 特征文件 | 框架 | 精确Agent |
|---------|------|----------|
| `manage.py` / `settings/` | Django | django-reviewer, django-build-resolver |
| `app = FastAPI()` / `fastapi` in requirements | FastAPI | fastapi-reviewer |
| `flask` in requirements | Flask | python-reviewer (无专用) |

检测到 TypeScript 后，进一步识别框架：

| 特征文件 | 框架 | 精确Agent |
|---------|------|----------|
| `next.config.*` | Next.js | typescript-reviewer |
| `nuxt.config.*` | Nuxt | typescript-reviewer |
| `vite.config.*` | Vite | typescript-reviewer |

### Step 3: 加载决策

```
检测结果 = [检测到的技术栈列表]
加载规则:
  1. 核心Agent (7个) — 始终加载，不依赖技术栈
  2. 扩展Agent — 仅加载与检测结果匹配的 Agent
  3. 语言规则 — 仅加载与检测结果匹配的 rules/ 子目录
  4. 无匹配 — 仅使用核心Agent + 通用规则 (rules/common/)
```

### Step 4: 通知用户

```
📋 技术栈检测结果:
  - 主要语言: [检测结果]
  - 已加载扩展Agent: [N个] ([名称列表])
  - 已加载语言规则: [M个] ([名称列表])
  - Token预算: 核心 [X] + 扩展 [Y] = 总计 [Z]
```

---

## 默认行为

- **未检测到任何指纹**: 仅加载 7 核心Agent + `rules/common/`，无扩展Agent
- **多语言项目**: 加载所有匹配的扩展Agent，但 Token 预算按 AGENT-PHASE-MAP 的上限控制
- **用户覆盖**: 用户可在 Phase 0 明确指定技术栈，覆盖自动检测结果

---

## 与 Phase 0 的集成

本检测在 Phase 0 的 Step 1（项目探索）中执行，检测结果写入 Gate G0 确认项：

> G0 确认项新增: "技术栈检测结果是否符合预期？是否需要手动指定？"
