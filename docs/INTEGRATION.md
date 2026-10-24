# DevFlow 集成契约（INTEGRATION）

> 任何 AI 编码工具（自研或第三方）按本文档接入 DevFlow，即可获得完整流程强制力。
> 一个内核（`lib/write-guard.js`）+ 三种传输 + 一个无死角兜底；适配各工具的不再是
> DevFlow 的代码，而是本页契约。

```
                ┌──────────────────────────────────┐
                │   唯一内核: lib/write-guard.js     │
                │   evaluatePreToolUse() 纯函数     │
                └──────────────┬───────────────────┘
        ┌──────────────────────┼──────────────────────┐
 传输① 进程内 require      传输② hook 契约        传输③ guard CLI
 (自研工具直连)          (Claude/ZCode/Codex)    (任何能跑命令的工具)
        └──────────────────────┼──────────────────────┘
                ┌──────────────┴───────────────────┐
                │  兜底: git hooks (无死角)          │
                │  所有工具提交必经 git，无法绕过      │
                └──────────────────────────────────┘
```

---

## 契约一：写入守卫纯函数（自研工具推荐）

```js
const { evaluatePreToolUse } = require('<devflow>/lib/write-guard.js');

// 在工具执行 Write/Edit/MultiEdit/NotebookEdit/Bash 之前调用：
const verdict = evaluatePreToolUse({
  tool,                // 'Write' | 'Edit' | 'MultiEdit' | 'NotebookEdit' | 'Bash' | 其他
  toolInput,           // 工具入参: { file_path } / { notebook_path } / { command }
  state,               // .devflow/state.json 解析结果; null = 不存在或损坏
  devflowInitialized,  // 项目是否有 .devflow/ 目录
  currentBranch,       // 当前 git 分支; null = 未知（守卫按未知分支放行）
});
// verdict = { action: 'allow' | 'block', reason: string, rule?: string }
// action === 'block' → 拒绝本次操作，把 verdict.reason 显示给 AI/用户（内含正确路径指引）
```

**规则语义**（命中即返回，按序评估）：

| 规则 | 触发 | 动作 |
|------|------|------|
| R0 | 项目未初始化 devflow（无 `.devflow/`） | 放行（不治安非 devflow 项目） |
| R1 | 目标是 `.devflow/state.json` 或 `state-events.jsonl` | 拦截（流程状态引擎独占） |
| R2 | 目标在 `.devflow/` 内（产物/记忆） | 放行 |
| R3 | 源代码扩展名写入且 `currentPhase < 4` | 拦截（fast 模式起点即 4，天然豁免） |
| R4 | `devflow/<req-id>` 分支上 `git commit` 不符合格式 | 拦截（引导 `devflow git checkpoint`） |
| 兜底 | 内核自身异常 | **fail-open**（放行 + 说明），绝不卡死用户 |

源代码扩展名清单（保守）：`js/ts/jsx/tsx/py/go/java/rs/c/cpp/cs/rb/php/vue/kt/swift/sql/sh/ps1/ipynb` 等，见 `SOURCE_EXTS`。

## 契约二：状态文件 schema

`.devflow/state.json`（原子写：tmp + rename；工具**不得直接手写**，走 CLI 或引擎）：

```json
{
  "currentPhase": 0,          // 数字 id: 0/1/1.5/2/2.5/3/4/5/6/7/8（1.5=文档的 1b，2.5=2a）
  "mode": "standard",         // fast | lean | standard | strict | null（未设置，按 standard 口径）
  "gates": { "G3": { "passed": true, "at": "ISO", "type": "manual" } },
  "outputs": { "02-design.md": { "path": "绝对路径", "at": "ISO" } },
  "approvals": { "G3": { "note": "用户原话摘要", "noteHash": "sha256前16位", "at": "ISO", "via": "cli" } },
  "skips": [ { "from": 0, "to": 4, "at": "ISO", "crossedGates": ["G0"], "crossedSkippedPhase": false } ],
  "createdAt": "ISO", "updatedAt": "ISO"
}
```

`.devflow/state-events.jsonl`：追加式审计日志，每行一事件。事件类型（重建状态的回放集）：
`INITIALIZED / MODE_SET / PHASE_ADVANCED / PHASE_SET / SKIP_FORCED / GATE_PASSED / GATE_APPROVED / OUTPUT_RECORDED`；
辅助事件（不参与回放）：`NEXT_BLOCKED / STATE_CORRUPTED`。state.json 损坏时引擎自动从本日志重建。

## 契约三：CLI 退出码（shell out 集成用）

| 命令 | 0 | 非零 | 说明 |
|------|---|------|------|
| `devflow guard [--tool T --file-path P]` / stdin JSON | 放行 | **2**=拦截 | 拦截理由在 stderr；`--verbose` 显示放行原因 |
| `devflow gates --phase <N>` | 全过 | 1 | 存在性+内容级检查 |
| `devflow gates --ac <目录>` | 达标 | 1 | AC 覆盖率 <90% 或有 ❌ 用例 |
| `devflow phase --next` | 已推进 | 1 | 门控拦截时输出原因 |
| `devflow phase --gate <G> --note "<确认>"` | 已过 | 1 | 人工门无凭证拒绝 |
| `devflow git pre-commit` | 通过 | 1 | git hook 调用 |
| `devflow git commit-msg <文件>` | 通过 | 1 | git hook 调用 |

## 契约四：hook stdin/stdout 协议（有 hook 系统的宿主）

**PreToolUse**（拦截型）：宿主在工具调用前，把 JSON 从 stdin 喂给命令：

```json
{ "session_id": "...", "tool_name": "Write", "tool_input": { "file_path": "src/a.js" } }
```

约定：`exit 0` = 放行；**`exit 2` + stderr 文本 = 拒绝本次工具调用**（stderr 回给模型）。
Claude Code 与 Codex 已验证此契约（Codex 0.142.5+）。现成处理器：

```
node "<devflow>/hooks/scripts/phase-write-guard.js" pretooluse
```

**Stop**（提醒型，不阻断）：stdin `{ "stop_hook_active": true|false }`；有未关门控时 stdout 输出
`{"systemMessage": "..."}`。处理器：`node "<devflow>/hooks/scripts/phase-write-guard.js" stop`。

**注册方式**：

Claude Code（托管段合并，幂等/备份/可卸载）：

```bash
devflow install --target claude
```

ZCode（已按官方契约验证：`~/.zcode/cli/config.json` → `hooks.events.PreToolUse`，
配置文件 hook 必须显式 `enabled: true`；`type: "process"` 无 shell 最跨平台；
**exit 2 = deny** 与本守卫同款契约。注意 ZCode 的 Stop 输出走严格 JSON schema，
多余键判失败——故 ZCode 只注册 PreToolUse 拦截、不注册 Stop 提醒）：

```bash
devflow install --target zcode
```

落盘形状（由 `devflow install --target zcode` 托管生成）：

```json
{ "hooks": { "enabled": true, "events": { "PreToolUse": [
  { "matcher": "Write|Edit|MultiEdit|NotebookEdit|Bash",
    "hooks": [ { "type": "process", "command": "node",
                 "args": ["<devflow>/hooks/scripts/phase-write-guard.js", "pretooluse"],
                 "timeoutMs": 10000 } ] } ] } }
```

其他宿主按各自的 hook 配置格式把上述命令挂到 PreToolUse/Stop 事件即可（参考 `adapters/claude-code/hooks.json`，该文件由 `scripts/gen-adapters.js` 生成）。

**WorkBuddy 接入状态**：其 settings.json 目前无 hook 生命周期——技能层经
`~/.workbuddy/skills/devflow` junction 全量生效，提交侧可用 git 兜底（见下节）。
要在 WorkBuddy 内获得写入级真实拦截，需在其源码的工具执行路径加一处调用
（契约一，约 10 行），或实现契約四的 PreToolUse 生命周期后即可复用
`devflow install --target workbuddy` 注册。

## 兜底：git hooks（零工具配合，唯一无死角拦截点）

```bash
devflow git install-hook     # 写入 .git/hooks/pre-commit + commit-msg（带 devflow-managed 标记）
devflow git uninstall-hook   # 只移除托管 hook，不动 husky 等用户配置
```

- **pre-commit**：`.devflow/state.json` 损坏/缺失 → 阻止提交；`devflow/*` 分支缺链路记录 → 阻止并指引 `devflow git start`。
- **commit-msg**：`devflow/*` 分支上的提交必须 `devflow(<req-id>): <说明>`（Merge 提交豁免）。
- 已存在非 DevFlow 的同名 hook（如 husky）时拒绝覆盖，给出手工共存指引。

## 接入清单（按你的工具能力选传输）

| 你的工具 | 选哪个 | 接入成本 |
|----------|--------|---------|
| 自研（Node/Electron） | 传输① require 直连 | 半小时，进程内零开销 |
| 有 hook 系统（Claude/ZCode/Codex 类） | 传输② 契约四 | 一条配置 |
| 能在动作前跑命令 | 传输③ `devflow guard` | 一行包装 |
| 什么都不支持 | git hooks 兜底 | 一条命令，拦截提交侧 |
| 任何工具（最低限） | 入口文件 + SKILL.md | 纯提示词，约定式纪律 |
