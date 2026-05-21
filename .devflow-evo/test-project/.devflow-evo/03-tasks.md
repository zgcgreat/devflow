# Phase 3: Task Plan — Wave Execution

## Wave 0: Foundation (Dependencies: none)
**Goal**: 创建基础架构和共享代码

| Task | Description | Files | Est. |
|------|-------------|-------|------|
| T-001 | 创建数据库迁移和 watchlist schema | `internal/db/migrations/001_watchlist.sql` | 2h |
| T-002 | 创建 Westock API 适配器接口 | `internal/api/westock/adapter.go` | 2h |
| T-003 | 创建缓存策略基础模块 | `internal/cache/strategy.go` | 3h |

## Wave 1: Data Services (Dependencies: Wave 0)
**Goal**: 实现数据服务层

| Task | Description | Files | Est. |
|------|-------------|-------|------|
| T-004 | 实现北向资金数据服务 | `internal/api/fundflow/service.go` | 4h |
| T-005 | 实现主力资金数据服务 | `internal/api/fundflow/service.go` | 4h |
| T-006 | 实现行业资金流数据服务 | `internal/api/fundflow/service.go` | 4h |
| T-007 | 实现 K线数据服务 | `internal/api/techanalysis/service.go` | 3h |
| T-008 | 实现技术指标计算 (MACD/RSI/MA) | `internal/api/techanalysis/indicator.go` | 6h |

## Wave 2: API Handlers (Dependencies: Wave 1)
**Goal**: 实现 API 端点

| Task | Description | Files | Est. |
|------|-------------|-------|------|
| T-009 | 实现北向资金 API | `internal/api/fundflow/handler.go` | 2h |
| T-010 | 实现主力资金 API | `internal/api/fundflow/handler.go` | 2h |
| T-011 | 实现 K线数据 API | `internal/api/techanalysis/handler.go` | 2h |
| T-012 | 实现技术指标 API | `internal/api/techanalysis/handler.go` | 2h |
| T-013 | 实现 watchlist CRUD API | `internal/api/watchlist/handler.go` | 4h |
| T-014 | 实现 watchlist 实时推送 | `internal/api/watchlist/handler.go` | 3h |

## Wave 3: Frontend Components (Dependencies: Wave 2, can be parallel)
**Goal**: 实现前端组件

| Task | Description | Files | Est. |
|------|-------------|-------|------|
| T-015 | 实现 FundFlowChart 组件 | `frontend/src/components/FundFlow/FundFlowChart.tsx` | 4h |
| T-016 | 实现 FundFlowTable 组件 | `frontend/src/components/FundFlow/FundFlowTable.tsx` | 3h |
| T-017 | 实现 KLineChart 组件 | `frontend/src/components/TechAnalysis/KLineChart.tsx` | 6h |
| T-018 | 实现 IndicatorPanel 组件 | `frontend/src/components/TechAnalysis/IndicatorPanel.tsx` | 4h |
| T-019 | 实现 WatchlistPanel 组件 | `frontend/src/components/Watchlist/WatchlistPanel.tsx` | 4h |
| T-020 | 实现 WatchlistTable 组件 | `frontend/src/components/Watchlist/WatchlistTable.tsx` | 3h |
| T-021 | 实现 GroupSelector 组件 | `frontend/src/components/Watchlist/GroupSelector.tsx` | 2h |

## Wave 4: Integration (Dependencies: Wave 3)
**Goal**: 集成测试和优化

| Task | Description | Files | Est. |
|------|-------------|-------|------|
| T-022 | 集成前端后端联调 | N/A | 4h |
| T-023 | 错误处理和边界情况 | Multiple | 4h |
| T-024 | 性能优化 (debounce, virtual scroll) | Multiple | 3h |
| T-025 | 端到端测试 | `frontend/tests/` | 4h |
| T-026 | 文档更新 | `docs/` | 2h |

## Dependencies Summary

```
Wave 0 (T-001 → T-003)
    ↓
Wave 1 (T-004 → T-008)
    ↓
Wave 2 (T-009 → T-014)
    ↓
Wave 3 (T-015 → T-021)  ← T-015/T-016 和 T-017/T-018 和 T-019/T-020/T-021 可并行
    ↓
Wave 4 (T-022 → T-026)
```

## Total Estimates
- **Effort**: ~78 hours
- **Duration**: ~2 weeks (2 engineers)
- **Risk**: LOW — most tasks are well-defined
