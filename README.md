# ForgeOS — AI 开发操作系统

**完全自包含。零外部依赖。所有能力内置。**

| 组件 | 文件 | 替代来源项目 |
|------|------|-------------|
| Phase 管线引擎 | `lib/phase-engine.js` | ForgeOS Phase + Gate |
| 4层持久记忆 | `lib/memory.js` | agentmemory |
| DAG 任务分解 | `lib/task-planner.js` | claude-task-master + superpowers |
| Party 仲裁器 | `lib/party-arbiter.js` | gstack CEO + BMAD Party |
| 代码解析引擎 | `domains/code-intel/code-explorer.js` | GitNexus + codegraph |
| 4级压缩引擎 | `domains/memory/caveman.js` | caveman |
| 门控验证器 | `domains/hooks/gate-check.js` | ForgeOS gate-rules |
| CLI 入口 | `bin/forge-os.js` | — |

## 快速开始

```bash
node bin/forge-os.js init --mode standard
node bin/forge-os.js status
node bin/forge-os.js doctor
node bin/forge-os.js task --describe "JWT登录" --visualize
node bin/forge-os.js party --scenario "登录方案"
node bin/forge-os.js party --role 架构师 "方案A" --role 前端 "方案B"
node bin/forge-os.js code --symbol "login"
node bin/forge-os.js code --scan src
node bin/forge-os.js mem --save "决策内容" --tags auth
node bin/forge-os.js mem --search jwt
node bin/forge-os.js mem --stats
node bin/forge-os.js caveman --file SKILL.md --level ultra
node bin/forge-os.js caveman --compress "长文本压缩测试"
node bin/forge-os.js gates --phase 3
node bin/forge-os.js install --target workbuddy
```

## 验证

```bash
node bin/forge-os.js doctor   # 核心文件完整性自检
node test/all.js              # 完整性验证套件（16 项：文件/frontmatter/门控顺序/版本一致性等）
```
