# DEPRECATED — 此模块已被 GitNexus Bridge 替代

**状态**: 已弃用（保留作为 regex fallback）

**替代模块**: `L3-ARCHITECTURE/gitnexus-bridge/`

**弃用原因**:
- code-intelligence 使用 regex 解析，分析深度有限（仅支持5种工具）
- GitNexus 使用 tree-sitter + graph DB，支持44种节点类型、21种边类型
- GitNexus 独有能力：git-diff→symbol 影响分析、API 路线图、变更检测

**降级策略**:
- `gitnexus-bridge/mcp-server.js` 中的 `withFallback()` 会自动引用此模块作为 regex fallback
- 当 GitNexus 未安装或调用失败时，自动降级到此模块

**迁移指引**:
- MCP 工具名不变：`devflow_analyze` / `devflow_trace_chain` / `devflow_blast_radius` / `devflow_dep_graph` / `devflow_find_references`
- 新增工具：`devflow_detect_changes` / `devflow_route_map`（仅 GitNexus 支持）
- 安装 GitNexus: `npm install -g gitnexus` (需要 Node.js >=22)

**删除计划**: 待 GitNexus 稳定运行3个月后可移除此目录