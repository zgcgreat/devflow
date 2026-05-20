# DEPRECATED — 此模块已被 GitNexus Bridge 替代

**状态**: 已弃用，脚本已移除

**替代模块**: `L3-ARCHITECTURE/gitnexus-bridge/`

**弃用原因**:
- code-intelligence 使用 regex 解析，分析深度有限
- GitNexus 使用 tree-sitter + graph DB，支持44种节点类型、21种边类型
- devflow-evo 已转为零脚本纯 Markdown 架构，AI 直接调用 GitNexus CLI

**降级策略**:
- GitNexus 可用时：AI 执行 `gitnexus context` / `gitnexus impact` 等 CLI 命令
- GitNexus 不可用时：AI 使用 `grep -rn` / `git diff` / `git log` 手动分析

**迁移指引**:
- 安装 GitNexus: `npm install -g gitnexus` (需要 Node.js >=22)
- 首次索引: `cd <project> && gitnexus analyze`
