# LESSONS.md — 项目教训与最佳实践

> 从 Phase 8 的 08-archive.md 提取，经去重 + 合并后生成。

---

## Technical Lessons

### L-001: WebSocket Heartbeat 调优 (金融数据)
- **Context**: Canary 部署发现 WebSocket 在 20 分钟后断开
- **Lesson**: 默认 25 分钟心跳对严格防火墙/NAT 后的用户太激进。许多企业网络在 20 分钟时超时空闲连接
- **Action**: 将 WebSocket 心跳间隔设为 15 分钟。添加服务端连接监控端点
- **来源**: L-20260524-TECHNICAL

### L-002: Cache TTL 应尊重交易日历
- **Context**: 资金流数据 24h 缓存，但交易日节假日打破了这一假设
- **Lesson**: 金融数据缓存失效必须考虑交易日历，而不仅是墙钟时间
- **Action**: 添加交易日历检查到缓存失效逻辑。使用"最后交易日"而非"24 小时前"
- **来源**: L-20260524-TECHNICAL

### L-003: SQLite WAL 模式防止锁竞争
- **Context**: 20 个并发写操作在 WAL 模式下成功，默认模式会失败
- **Lesson**: 对于任何有并发写的应用，SQLite WAL 模式是必须的
- **Action**: 初始化 SQLite 数据库时始终启用 WAL 模式
- **来源**: L-20260524-DESIGN

### L-004: RSI 默认周期标准
- **Context**: RSI 计算使用错误的默认周期 (14 vs 用户指定值)
- **Lesson**: 始终使用行业标准默认值 (RSI=14, MACD=(12,26,9)) 并清晰文档化
- **Action**: 添加技术指标默认参数常量文件，附标准定义引用
- **来源**: L-20260524-TECHNICAL, F-002

### L-005: 缓存竞态条件需 RWMutex
- **Context**: T-003 Cache invalidation logic 存在竞态条件
- **Lesson**: Go map 非线程安全，并发读写必须使用 `sync.RWMutex` 保护
- **Action**: 所有共享 map 的缓存模块必须使用 `sync.RWMutex`
- **来源**: F-001

---

## Process Lessons

### L-006: Canary Batch 1 是最有价值的批次
- **Context**: Batch 1 仅 ~10 用户，但发现了 2 个不同的问题，避免了更大影响
- **Lesson**: 不要跳过或匆忙 Batch 1。小用户数是特性而非缺陷
- **Action**: 始终从最小可行批次开始 (10 用户或 1% 用户)
- **来源**: L-20260524-PROCESS

### L-007: 技术指标计算必须 TDD
- **Context**: RSI bug 在用户看到之前被单元测试捕获
- **Lesson**: 金融计算 (指标、度量) 必须有单元测试。边界情况是非直观的
- **Action**: 设计审查规则添加: "所有金融计算函数必须有 ≥5 个单元测试覆盖边界情况"
- **来源**: L-20260524-PROCESS, F-004

### L-008: Error Rate 应排除预期的 404
- **Context**: 某些 API 调用对退市股票返回 404 — 这些不是错误
- **Lesson**: 为每个数据源定义什么是"错误"。非所有非 200 响应是等同的
- **Action**: 创建错误分类系统: client_errors (4xx) vs server_errors (5xx) vs expected_absences (404 for delisted)
- **来源**: L-20260524-OPERATIONAL

---

## UX Lessons

### L-009: 金融数据需要清晰的鲜度指示器
- **Context**: 用户看到过期的资金流数据且无警告
- **Lesson**: 金融数据用户关心鲜度。始终显示"最后更新"时间戳
- **Action**: 所有金融数据组件添加数据鲜度徽章
- **来源**: L-20260524-UX, F-005

### L-010: 数据源需要 UX 差异化
- **Context**: Westock API 失败时 fallback 到 东方财富 工作正常，但用户看不出哪个源
- **Lesson**: 用户应知道数据源质量等级
- **Action**: 添加小徽章显示数据源: "数据来源: 腾讯自选股" 或 "数据来源: 东方财富 (延迟)"
- **来源**: L-20260524-DESIGN

### L-011: 虚拟滚动对大数据列表是必须的
- **Context**: 初始 100 项 watchlist 渲染 800ms。虚拟滚动后: 120ms
- **Lesson**: 金融应用常处理大数据集。虚拟滚动不是可选的
- **Action**: 设计审查清单强制: 任何 >20 项的列表必须使用虚拟滚动
- **来源**: L-20260524-PERFORMANCE

---

## Lessons Summary

| 类别 | 计数 | 关键词 |
|------|------|--------|
| Technical | 5 | WebSocket, Cache, SQLite, RSI, Mutex |
| Process | 3 | Canary, TDD, Error Classification |
| UX | 3 | Freshness, Data Source, Virtual Scroll |
| **总计** | **11** | |

---

## 跨波上下文注入记录

| 注入源 | 注入目标 | Lesson | 影响 |
|--------|---------|--------|------|
| Wave 0 → Wave 1 | RSI 标准参数 | L-004 | 标准化 indicator 常量文件 |
| Wave 1 → Wave 2 | SQLite WAL 模式 | L-003 | 防止 API 层锁竞争 |
| Wave 2 → Wave 3 | 数据鲜度指示 | L-009 | UI 组件显示"最后更新"徽章 |
| Wave 3 → Wave 4 | 虚拟滚动 | L-011 | WatchlistTable 从开始使用虚拟滚动 |

**跨波学习效果**: 4/4 lessons 成功注入并应用

---

*提取日期*: 2026-05-25
*来源*: Phase 8 Archive (08-archive.md)
*去重策略*: 按类别分组，合并相似教训，保留最具体的 action item
