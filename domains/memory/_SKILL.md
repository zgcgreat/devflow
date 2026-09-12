---
name: devflow:memory
version: 1.0.0
---

# 记忆域

**核心**: `lib/memory.js` (4 层持久记忆 + BM25 搜索)
**扩展**: `domains/memory/caveman.js` (4 级 Token 压缩)

## 加载顺序

| 能力 | 位置 |
|------|------|
| 保存记忆 | `lib/memory.js --save "内容" --tags tag` |
| 搜索记忆 | `lib/memory.js --search "关键词"` |
| 记忆统计 | `lib/memory.js --stats` |
| 遗忘旧记忆 | `lib/memory.js --forget --older 7` |
| Lite 压缩 (~35%) | `caveman.js --compress-level lite` |
| Full 压缩 (~50%) | `caveman.js --compress-level full` |
| Ultra 压缩 (~65%) | `caveman.js --compress-level ultra` |
| WenYan 压缩 (~70%) | `caveman.js --compress-level wenyan` |
