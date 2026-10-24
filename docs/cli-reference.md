---
name: devflow-cli-reference
version: 3.4.0
description: DevFlow CLI 命令完整参考手册
---

# DevFlow CLI 命令参考

> 来源：`bin/devflow.js` 实际实现。完整版见 [SKILL.md](../SKILL.md)。

## 通用旗标

```bash
devflow --version                                  # 输出版本号（等价 -v）
devflow --help                                     # 输出帮助（等价 -h / devflow help）
```

## Phase 管线

```bash
devflow init [--mode fast|lean|standard|strict]    # 初始化管线
devflow status                                     # 当前状态
devflow phase [--next|--gate G3]                   # 阶段操作（详见下方子命令）
devflow phase --status                             # Phase 详情（进度/门控/产出）
devflow phase --list                               # Phase 管线总览
devflow phase --mode <fast|lean|standard|strict>   # 设置模式（重置起始 Phase）
devflow phase --set <N> [--force]                  # 切换到指定 Phase（0/1/1.5/2/2.5/3-8）
devflow phase --next [--force]                     # 推进到下一阶段（受门控护卫）
devflow phase --gate <G3> [--note <用户确认>]      # 标记门控通过（人工门必须携带确认凭证）
devflow phase --output <文件> [--note <确认>]       # 记录产物并通过门控（manual 主门控需 --note）
devflow phase --journal                             # 事件日志（状态变更审计时间线，最近 20 条）
```

> **`init` 模式自动判定**：未指定 `--mode` 时按项目规模自动调用 `detectMode()`；空目录（greenfield：0 文件 0 行且非 brownfield）自动判为 STANDARD — 从零开始必跑 Phase 0。初始化会创建记忆骨架（含 `domain-skills/` 子目录，用于领域技能沉淀）与项目宪法。

> **`phase --set` 门控语义**：前向跳跃会校验途经所有门控（当前 Phase 之后、目标 Phase 之前），任一未通过即拒绝；经用户确认后可加 `--force` 显式跳过 —— 强制跳过会记录到 state.json 的 `skips` 数组（含 from/to/at/越过的门控清单），供审计追溯，并须在路由声明的『前置裁剪』中标注。

> **`phase --output` 产物校验**：产物路径必填、文件必须存在且为普通文件，且文件名必须等于当前 Phase 的预期产物名（如 `02-design.md`），否则拒绝。

> **`--note` 审批凭证（v3.5.0）**：人工门控（G2/G2.5/G3/G3.5/G5/G7/G7.5）必须携带 `--note "<用户原话或确认摘要>"` 才能标记通过，凭证 sha256 哈希入 `state.approvals` 账本，无凭证直接拒绝 —— 防止 AI 自批门控。自动门（G0/G1/G4/G6/G8）不要求凭证。

> **`phase --journal` 事件日志（v3.5.0）**：全部状态变更（MODE_SET/GATE_PASSED/GATE_APPROVED/SKIP_FORCED/OUTPUT_RECORDED/NEXT_BLOCKED…）原子追加到 `.devflow/state-events.jsonl`；state.json 损坏时引擎自动从该日志重建状态。

> **写入守卫（v3.5.0）**：`devflow install --target claude` 把守卫注册进 `~/.claude/settings.json`（托管段，幂等/备份/可卸载）后，违规写入在宿主 PreToolUse 层被真实拒绝（exit 2）：Phase < 4 拦源代码写入、`.devflow/state.json` 引擎独占、devflow/* 分支提交格式守卫。Stop 事件提供温和续跑提醒。

## 模式判定

```bash
devflow detect [--files N] [--lines N] [--modules N] [--risk low|medium|high]
               [--brownfield] [--arch-change] [--data-change]
# 按规模/风险输出建议模式与命中规则；devflow phase --mode <模式> 应用结果
```

## 任务规划

```bash
devflow task --describe "描述" [--visualize]        # DAG 分解
devflow task --file <tasks.json> [--json]          # 加载并校验已有任务计划
devflow task [--describe ... | --file ...] --save <文件>   # 保存任务计划
devflow task [--describe ... | --file ...] --json   # 以 JSON 输出（含 Wave/DAG/mermaid）
```

> **`task --file` 校验流程**：依赖完整性（引用不存在的任务 id 直接报错）→ 环检测（成环时报出环上任务链）→ Kahn 拓扑排序 → 按 deps 最长依赖深度重算 Wave。输入中的 wave 字段缺失/非法会被重算覆盖，以保证依赖永远落在更早的 Wave。

## 记忆系统

```bash
devflow mem --save "内容" [--tags a,b]             # 保存记忆
devflow mem --search <关键词>                       # 搜索记忆
devflow mem --recent                                # 最近记忆
devflow mem --stats                                 # 统计信息
devflow mem --forget [--older N]                    # 遗忘过期条目
```

## Party 仲裁

```bash
devflow party --scenario "场景名"                   # Demo 评分
devflow party --role <角色1> <方案1> [--role ...]   # 手动评分
```

## 代码工具

```bash
devflow code --symbol <名称>                        # 符号查询
devflow code --scan <目录>                          # 目录扫描
```

## 压缩引擎 (Caveman)

```bash
devflow caveman --file <路径> [--level level]       # 文件压缩
devflow caveman --compress <文本>                   # 文本压缩
# level: lite | full | ultra | wenyan
```

## 门控 & 健康

```bash
devflow gates --phase <N>                           # 门控检查（存在性 + 内容级：模板必填段落 + G6 AC 覆盖率）
devflow gates --gate <GID> [--dir <目录>]           # 单门控检查 / --all 全量
devflow gates --ac <目录>                           # AC 覆盖率报告（目录 = .devflow 或 .devflow/<req-id>）
devflow gates --template <产物文件>                 # 模板内容校验（必填段落 + 未替换占位符）
devflow install [--target <name>] [--dry-run]       # 安装到运行时 (--list 查看目标)
devflow install --target claude                     # 安装并注册写入守卫到 ~/.claude/settings.json（托管段）
devflow install --list                              # 列出安装目标与状态
devflow install --uninstall [--target <name>]       # 卸载（claude 目标同步移除托管 hook）
devflow doctor                                      # 健康检查
devflow help                                        # 帮助信息
```

- `gates --phase 5`：先按名字定位产物（缺任一 FAIL），再对每个产物执行模板内容校验（以 `references/templates/` 同名模板的 R13.11 必填段落清单为单一来源），G6 额外解析 `01-analysis.md` 的 `### AC-N` ↔ `05-test-report.md` 用例映射表，覆盖率 ≥ 90% 且无 ❌ 用例才通过。Fast/Lean 无 AC 来源时豁免（ℹ️）。
- 退出码：0 = 通过，1 = 未通过（可接入脚本/钩子判定）。

## Git 链路 (v3.4.0)

```bash
devflow git start <req-id> [--from <base>]          # 创建/切换 devflow/<req-id> 分支并写 .devflow/<req-id>/git.json
devflow git status                                  # 当前分支/已链路 req/分支提交数/未提交产物
devflow git checkpoint "<说明>"                     # 提交流程产物检查点: devflow(<req-id>): <说明>
devflow git verify                                  # 分支约定 + 链路记录 + 未提交产物检查
```

- 约定：分支 `devflow/<req-id>`，提交格式 `devflow(<req-id>): <说明>`。
- 安全边界：`checkpoint` 只 stage `.devflow/<req-id>/` 与 `.devflow/state.json`，**绝不自动提交源代码**。
- 未配置 git 身份时 checkpoint 以本地一次性身份兜底（`-c user.name=devflow`）。
