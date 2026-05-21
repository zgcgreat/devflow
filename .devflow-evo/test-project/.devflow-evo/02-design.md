# Phase 2: Design — Feature Enhancement for Stock Monitor

## Design Overview

**Project**: go-stock 功能增强 — 资金流向追踪 + 技术分析 + 自定义监控
**Mode**: Standard (full Phase 0→1→2→4→5→6)
**Design Complexity**: Moderate — 3 feature modules with clear boundaries

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React+AntD)              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │ Stock Monitor│  │ Fund Flow    │  │ Tech       ││
│  │ Dashboard    │  │ Tracker      │  │ Analysis   ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│         │                │                │          │
│         └────────┬───────┴────────────────┘         │
│                  ▼                                   │
│         ┌─────────────────┐                         │
│         │  Monitoring     │                         │
│         │  Config Panel   │                         │
│         └─────────────────┘                         │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/WebSocket
┌──────────────────▼──────────────────────────────────┐
│                 Backend (Go/Gin)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │ Westock      │  │ Technical    │  │ Watchlist  ││
│  │ Adapter      │  │ Indicator    │  │ Service    ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│         │                │                │          │
│         └────────┬───────┴────────────────┘         │
│                  ▼                                   │
│         ┌─────────────────┐                         │
│         │   SQLite        │                         │
│         │   (Config +     │                         │
│         │    Cache)       │                         │
│         └─────────────────┘                         │
└─────────────────────────────────────────────────────┘
```

## Module 1: Fund Flow Tracker (资金流向追踪)

### Requirements
- 北向资金 (Northbound Fund) daily flow
- 主力资金 (Main Force Fund) real-time approximation
- 行业资金流 (Sector Fund Flow)

### Data Source
- Primary: Westock API (`westock-data asfund sz000001`)
- Secondary: 东方财富公开接口 (fallback)

### API Design
```go
// GET /api/fund-flow/northbound — 北向资金
// GET /api/fund-flow/main-force/:code — 主力资金
// GET /api/fund-flow/sector/:industry — 行业资金流
```

### Frontend Components
- `FundFlowChart`: 折线图展示资金流向
- `FundFlowTable`: 表格展示各板块资金排行
- `AutoRefresh`: 配置刷新频率 (5s/30s/1min)

### Files to Create/Modify
```
internal/api/fundflow/
  handler.go
  service.go
  model.go

frontend/src/components/FundFlow/
  FundFlowChart.tsx
  FundFlowTable.tsx
  index.ts
```

---

## Module 2: Technical Analysis (技术分析)

### Requirements
- K-line chart (日K/周K/月K)
- MACD indicator
- RSI indicator
- Moving Averages (MA5/MA10/MA20/MA60)

### Data Source
- Primary: Westock API (`westock-data kline`)
- Historical data caching strategy: SQLite, refresh daily

### API Design
```go
// GET /api/tech/kline/:code — K线数据
// GET /api/tech/indicator/:code?type=macd — 技术指标
```

### Frontend Components
- `KLineChart`: 使用 ECharts/TradingView Lightweight Charts
- `IndicatorOverlay`: MACD/RSI 叠加层
- `MASelector`: MA 周期选择器

### Files to Create/Modify
```
internal/api/techanalysis/
  handler.go
  service.go
  indicator.go  ← 新增指标计算

frontend/src/components/TechAnalysis/
  KLineChart.tsx
  IndicatorPanel.tsx
  index.ts
```

---

## Module 3: Custom Watchlist (自定义监控列表)

### Requirements
- Add/remove stocks from watchlist
- Real-time price change notification
- Custom grouping (e.g., "A股持仓"，"港股关注"，"美股观察")
- Persistence (SQLite)

### API Design
```go
// GET /api/watchlist — 获取监控列表
// POST /api/watchlist — 添加股票
// DELETE /api/watchlist/:id — 移除股票
// PUT /api/watchlist/:id — 更新分组
```

### Database Schema
```sql
CREATE TABLE watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,  -- e.g., "sh600519"
    name TEXT NOT NULL,
    group_name TEXT DEFAULT 'default',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_watchlist_code ON watchlist(code);
```

### Files to Create/Modify
```
internal/api/watchlist/
  handler.go
  service.go
  repository.go

frontend/src/components/Watchlist/
  WatchlistPanel.tsx
  WatchlistTable.tsx
  GroupSelector.tsx
  index.ts
```

---

## Cross-Cutting Concerns

### 1. Caching Strategy
- K-line data: Cache 1 hour (not frequently changing)
- Real-time quotes: Cache 5 seconds (frequent updates)
- Fund flow: Cache 1 day (daily data)

### 2. Error Handling
- Westock API failure → show cached data with "data delayed" warning
- Network error → retry 3 times with exponential backoff
- Invalid stock code → show validation error immediately

### 3. Performance
- WebSocket push for real-time updates (if supported)
- Debounce search input (300ms)
- Virtual scroll for large watchlists (>100 stocks)

## Gate Checkpoints

### G2.5 (Design Review Gate)
- [x] All modules have clear API contracts
- [x] Data sources identified with fallback
- [x] Frontend component boundaries defined
- [x] No breaking changes to existing API

### G3 (Implementation Readiness)
- [x] All files to be created/modified listed
- [x] Database schema designed
- [x] Error handling strategy defined
- [x] Performance considerations addressed
