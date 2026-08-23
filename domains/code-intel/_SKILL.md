---
name: forge-os:code-intel
version: 1.0.0
---

# 代码智能域

**核心**: `domains/code-intel/code-explorer.js` (符号/调用链/影响分析)
**扩展**: `layers/L3-ARCHITECTURE/` (架构层分析)

## 加载顺序

| 能力 | 位置 |
|------|------|
| 符号搜索 | `code-explorer.js --symbol "funcName"` |
| 调用链追踪 | `code-explorer.js --callchain "func"` |
| 爆炸半径 | `code-explorer.js --impact "file.ts"` |
| 全量代码扫描 | `code-explorer.js --scan "."` |
| 架构层分析 | `layers/L3-ARCHITECTURE/code-intelligence/` |
| 依赖图 | `layers/L3-ARCHITECTURE/dag-router/` |
