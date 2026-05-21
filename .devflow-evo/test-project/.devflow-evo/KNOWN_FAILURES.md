# KNOWN_FAILURES.md — 已知失败记录

> 本文档从 Phase 4 (Wave 执行), Phase 5 (测试), Phase 6 (审查) 中提取所有失败/重试记录。

---

## Phase 4: Wave 执行失败

### F-001: T-003 Cache Race Condition
- **Wave**: 0
- **Task**: T-003 — 创建缓存策略基础模块
- **Attempt 1**: 失败 — Cache invalidation logic 存在竞态条件
- **Retry (Attempt 2)**: ✅ 通过 — 使用 `sync.RWMutex` 修复
- **Root Cause**: Go map 非线程安全，并发写入导致 panic
- **Fix**: 引入 `sync.RWMutex` 保护 map 读写
- **Impact**: LOW — 1st attempt 失败在单元测试阶段捕获

---

### F-002: T-008 RSI Default Period
- **Wave**: 1
- **Task**: T-008 — 实现技术指标计算
- **Attempt 1**: 失败 — RSI 计算使用了错误的默认周期 (14 vs 用户指定值)
- **Retry (Attempt 2)**: ✅ 通过 — 默认值修正为 14
- **Root Cause**: 未查阅行业标准 (RSI=14, MACD=(12,26,9))
- **Fix**: 修正默认周期常量，添加标准参数常量文件
- **Impact**: LOW — 仅在非默认周期场景下触发

---

## Phase 5: 测试失败

### F-003: KLineChart Timezone Handling
- **Test File**: `src/components/TechAnalysis/__tests__/KLineChart.test.tsx`
- **Assertion**: `renders Chinese date labels correctly`
- **Expected**: "2024年1月15日"
- **Received**: "2024年1月14日"
- **Root Cause**: K-line 数据使用 UTC 时间，前端在本地时区渲染时未转换
- **Fix Applied**: 添加时区规范化逻辑 (UTC+8 市场收盘时间)
- **Impact**: MEDIUM — 日期显示偏差 1 天 (UTC+8 用户，市场收盘在当地午夜前)
- **Status**: 🟡 FIX APPLIED — awaiting re-test

### F-004: RSI Calculation Edge Case (NaN)
- **Test File**: `internal/api/techanalysis/indicator_test.go`
- **Assertion**: `TestRSICalculation — RSI returns NaN for single-day data`
- **Root Cause**: 少于 2 个数据点时，RSI 公式除零导致 NaN
- **Fix**: 添加 guard clause，数据点 <2 时返回 "N/A"
- **Impact**: LOW — 仅在单日数据时触发
- **Status**: ✅ RESOLVED

---

## Phase 6: 审查发现

### F-005: B-001 Data Freshness Illusion
- **Reviewer**: Blind Hunter
- **Severity**: MEDIUM
- **Description**: 北向资金数据 24h TTL 缓存，如果 API 某天失败，用户看到的是 2 天前的旧数据且无警告
- **Evidence**: `internal/cache/strategy.go` line 45 — `FundFlowTTL = 24 * time.Hour`
- **Recommendation**: UI 添加"数据截至"时间戳显示，超过 2 个交易日标警告
- **Status**: Open — Action Item A-001

### F-006: B-002 WebSocket Memory Leak
- **Reviewer**: Blind Hunter
- **Severity**: MEDIUM
- **Description**: 用户打开 watchlist 页面后不主动关闭 WebSocket，服务端连接未清理。1000 用户后内存增长 ~50MB
- **Evidence**: `internal/api/watchlist/handler.go` — WebSocket handler 缺少 `defer ws.Close()`
- **Recommendation**: 添加清理 handler 和连接数监控端点
- **Status**: Open — Action Item A-002

### F-007: B-003 Silent API Degradation
- **Reviewer**: Blind Hunter
- **Severity**: LOW
- **Description**: Westock API 和 东方财富 fallback 都失败时，API 返回 200 OK + 空数据，前端无法调试
- **Evidence**: `internal/api/fundflow/handler.go` — 所有数据源失败时无 error 返回
- **Recommendation**: 返回 HTTP 502 + 错误详情，前端显示"数据服务暂时不可用"
- **Status**: Open — Action Item A-003

### F-008: E-004 Negative Price Values
- **Reviewer**: Edge Case Hunter
- **Severity**: LOW
- **Description**: Mock API 返回负数价格时，图表渲染负数价格，视觉上令人困惑
- **Recommendation**: 添加客户端负数价格校验 (defense-in-depth)
- **Status**: Open — Action Item A-004

---

## 失败统计

| 类别 | 失败数 | 已修复 | 进行中 | 待修复 |
|------|--------|--------|--------|--------|
| Phase 4 执行 | 2 | 2 | 0 | 0 |
| Phase 5 测试 | 2 | 1 | 0 | 1 (F-003 awaiting re-test) |
| Phase 6 审查 | 4 | 0 | 0 | 4 (action items) |
| **总计** | **8** | **3** | **0** | **5** |

---

## 失败根因分类

| 根因类型 | 计数 | 占比 |
|----------|------|------|
| 标准/默认值错误 | 2 | 25% (F-002, F-004) |
| 并发安全 | 1 | 12.5% (F-001) |
| 时区/本地化 | 1 | 12.5% (F-003) |
| 资源清理 | 1 | 12.5% (F-006) |
| 数据校验 | 2 | 25% (F-005, F-008) |
| 错误处理 | 1 | 12.5% (F-007) |

---

*最后更新*: 2026-05-25 (Phase 6 审查完成)
