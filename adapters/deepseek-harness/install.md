# DeepSeek Harness 安装指南

DSH 的扩展分两套，DevFlow 两套都要用：

- **Skill**（Markdown，按需加载）→ 携带 Phase 流程、Gate 规则、模板
- **Cordis 插件**（`apply(ctx, config)`）→ 提供 `ctx.tools.guard`，把 Gate 变成真的拦截

Skill 只能"请求"模型遵守门控；插件才能让门控成立。

---

## 步骤 1：挂载 Skill（无需写代码）

### 1.1 建立 junction

DSH 只从下列根发现技能（**rank 数字小者优先**）：

| 根 | rank |
|---|---|
| `<projectRoot>/.dsh/skills` | 100 |
| `<projectRoot>/.agents/skills` | 200 |
| `customSkillDirs`（配置项） | 300 |
| `$DSH_HOME/skills` | 400 |
| `~/.agents/skills` | 500 |

`projectRoot` = 向上找到的第一个含 `.git` 的祖先目录（找不到则用 cwd 本身）。

**重要：仓库根目录的 `SKILL.md` 不会被发现。** 文件必须位于 `<根>/<名字>/SKILL.md`。用 junction 让 checkout 保持唯一权威：

```powershell
# Windows，无需管理员权限
New-Item -ItemType Junction -Path "$env:USERPROFILE\.agents\skills\devflow" -Target "E:\LLM\skills\devflow"
```

```bash
# POSIX
ln -s /path/to/devflow ~/.agents/skills/devflow
```

DSH 默认跟随符号链接（`watchFollowSymlinks: true`）并监听根目录变化，因此源码改动会实时生效。

> `$DSH_HOME` 在 DSH Desktop 下是 `%APPDATA%\dsh-desktop\harness`。
> 放 `$DSH_HOME\skills`（rank 400）可以盖过 `~/.agents/skills`（rank 500）。

### 1.2 验证

重启 DSH 或在会话中确认技能目录出现 `devflow`。也可以直接看目录：

```powershell
Test-Path "$env:USERPROFILE\.agents\skills\devflow\SKILL.md"   # 必须为 True
```

### 1.3 description 决定能否被自动选中

DSH 只把 **`name` + `description`**（折叠空白、截断 500 字符）渲染进技能目录给模型看，
正文只在模型显式调用 `skill` 工具时才进入上下文。所以 `SKILL.md` 的 description 必须包含
路由词（需求分析 / 方案设计 / 任务拆分 / 代码评审 / 阶段门控 / 用例覆盖），只写产品名会导致
永远选不中。

---

## 步骤 2：挂载 Gate 插件（代码级强制）

插件在独立包 `dsh-devflow` 中，**不在本仓库内**。

### 2.1 确认 profile 与 patch 层

```powershell
$prof = "$env:APPDATA\dsh-desktop\harness\profiles\web"
Get-Content "$prof\cordis.yml"        # 预期输出：[]
Get-Content "$prof\cordis.patch.yml"  # 用户 patch 层，初始也是 []
```

`cordis.yml` 是空条目列表，**不要改它** —— 它自己的注释就写着 "Edit cordis.patch.yml, not this file"。

### 2.2 把 `cordis.patch.yml` 的 row 合并进用户 patch 层

本目录的 `cordis.patch.yml` 是一个**行模板**，把它里面的 `- insert:` 块**追加**到
`$prof\cordis.patch.yml` 数组中（该文件初始为 `[]`，需先把 `[]` 换成数组条目）。
注意是"合并"而不是"覆盖"，因为同一层可能已有别的插件行。

### 2.3 安装插件副本（⚠️ 必须是真实副本，不能是 junction）

这一点与**步骤 1 的技能安装方式相反**，务必分清：

| | 安装方式 | 原因 |
|---|---|---|
| DevFlow Skill（本仓库） | **junction 可以**（步骤 1 用的就是） | DSH 跟随符号链接发现技能 |
| 门控插件 `dsh-devflow` | **必须真实副本** | Node 的 ESM 加载器会把 junction realpath 到链接目标；若目标在别的盘符，裸包名（如 `@deepseek-ai/dsh-tools`）的向上查找会离开 profile 树，**解析失败 → 插件加载失败 → DSH 启动失败** |

已验证可用的布局：

```powershell
$prof = "$env:APPDATA\dsh-desktop\harness\profiles\web"
$dst  = "$prof\plugins\dsh-devflow"

New-Item -ItemType Directory -Path (Split-Path $dst) -Force | Out-Null
Copy-Item "E:\LLM\skills\dsh-devflow" $dst -Recurse -Force
Remove-Item "$dst\.git" -Recurse -Force -ErrorAction SilentlyContinue
```

`insert` 行的 `name` 以 `./` 开头时会被解析为**相对该 patch 文件所在目录**的 `file://` URL，
所以写成 `name: './plugins/dsh-devflow'`。

> 放在 `plugins/` 而不是 `node_modules/`：后者会被 pnpm 视为未知目录，后续 `pnpm install` 可能清掉。

### 2.4 挂载前验证（不要跳过）

```powershell
# 纯 Node 解析（不注入任何钩子）真实 import + 挂载 + 功能冒烟
node "$dst\test\verify-mount.mjs" $dst
```

输出 `✅ 挂载验证全部通过` 才继续。这一步覆盖的是 `test/run.js` 覆盖不到的那条路径：
**"安装后由 Node 自己解析"**。

### 2.5 写入 patch 行

```powershell
node "$dst\install\cordis-patch.mjs" --status              # 只读：看挂载状态与将写入的内容
node "$dst\install\cordis-patch.mjs" --apply --dry-run     # 预览（含 DSH 解析器校验）
node "$dst\install\cordis-patch.mjs" --apply               # 备份 + 写入
```

脚本做三件确定性的事：先备份 `cordis.patch.yml`、按"注释头 / 条目区"分段处理
（模板初始态是「注释 + `[]`」，**直接在末尾追加 `- insert:` 会产生非法 YAML**）、
并用 DSH **自己的** `loadOverlayPatches()` 解析待写入内容后才落盘。

回滚：

```powershell
node "$dst\install\cordis-patch.mjs" --revert
```

### 2.6 `--apply` 之后：必须重启 DSH（实测）

**实测结论（DSH Desktop 0.8.2 / 打包 Electron）：写入 patch 文件不会热挂载插件。**

profile 声明了 `patchReload: "live"`，desktop 也补了 config-watching 的 HMR fallback
（`dsh-desktop.patch.yml` 注释说明：打包 Electron 提供不了完整 Cordis HMR 服务），
但实测写入 `cordis.patch.yml` 后守卫**并未触发** —— 破坏性命令仍能到达 PowerShell。

| 时刻 | 4 个工具 | 守卫 |
|---|---|---|
| `--apply` 后、重启前 | 不在工具表里 | **未生效** |
| 重启 DSH 后 | 可用 | 生效 |

> ⚠️ 重启之前不要误以为门控已在强制 —— 它此时只是一份磁盘上的配置。

重启后自证：这条命令应被**拒绝**并给出 Gate 理由，而不是报"路径不存在"。

```powershell
Remove-Item -Recurse -Force .\some-nonexistent-dir   # 期望：被 DevFlow G5 拒绝
```

### 2.7 验证

重启 DSH 后：

1. 在任意会话里调用 `devflow_status` —— 应返回当前 `.devflow/state.json` 的 Phase/门控状态
2. 故意在 G5 未通过时让模型改 `package.json` —— 应被 **拒绝** 并给出 Gate 理由

若启动失败，DSH 是 fail-loud 的（插件解析不出来会直接中断启动）。恢复入口：

- `resources\safe-mode.html`
- `resources\plugin-recovery.html`

或直接从命令行回滚 patch：

```powershell
node "$dst\install\cordis-patch.mjs" --revert
```

---

## 限制与注意

| 项 | 说明 |
|---|---|
| **不要桥接 `hooks.json`** | `dsh-hooks-claude-code` 需要显式 `configPath`，且只认 Claude Code 的 `事件 → matcher 数组` 结构。DevFlow 的 `hooks/hooks.json` 是 `{hooks: {"<id>": {event, script}}}`，在 DSH 里会解析出 **0 个 hook** |
| **不要移植 `hooks/scripts/`** | 那些脚本依赖 `CLAUDE_SESSION_ID` / `CLAUDE_PLUGIN_ROOT` / `CLAUDE_TRANSCRIPT_PATH` / `ECC_*`，DSH 从不设置这些变量 |
| **不要直接发布到插件市场** | DSH 启动是 fail-loud，插件崩了会挡住启动。先本地挂载、跑通、再用 safe-mode 兜底 |
| **npm 包名冲突** | registry 上的 `devflow` 由他人持有（latest `0.0.1`，2021），发布必须换名 |

## 卸载

```powershell
# 移除 junction
Remove-Item "$env:USERPROFILE\.agents\skills\devflow" -Force

# 从 $prof\cordis.patch.yml 里删掉 devflow-gate 那一行
# 并删除 $prof\plugins\dsh-devflow（若用了方案 A）
```
