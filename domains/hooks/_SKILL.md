---
name: forge-os:hooks
version: 1.0.0
---

# 钩子域

**核心**: `domains/hooks/` (门控/上下文/Token 监控 JS 脚本)
**扩展**: `hooks/` (ForgeOS 运行时钩子) + `hooks/markdown-hooks.yaml`

## 加载顺序

| 能力 | 位置 |
|------|------|
| 门控验证 G0-G7 | `gate-check.js --gate G3` |
| 上下文衰减监测 | `context-rot-monitor.js --current 35000` |
| Token 使用率监控 | `token-monitor.js --check` |
| 运行时钩子 | `hooks/scripts/` (18 个 JS + 1 Python) |
| 钩子配置 | `hooks/markdown-hooks.yaml` |
