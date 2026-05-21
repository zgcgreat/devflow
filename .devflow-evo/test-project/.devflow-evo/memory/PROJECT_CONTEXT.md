# Project Context

## Tech Stack
- **Backend**: Go (Gin framework)
- **Frontend**: React + Ant Design
- **Data Source**: Westock API (腾讯自选股)
- **Database**: SQLite
- **Deployment**: Docker

## Business Domain
金融数据终端 / 股票行情监控工具

## Target Users
- A 股/港股/美股 个人投资者
- 需要实时行情 + 基础分析的交易者
- 追求轻量、快速的投资工具用户

## Project Background
go-stock 是一个开源的 A 股/港股/美股行情监控工具，已具备：
- Westock API 集成
- 实时行情数据获取
- 基础行情展示

## Current Request
增强现有功能，实现：
1. 资金流向追踪（北向资金、主力资金）
2. 简单技术分析（K线、MACD、RSI）
3. 自定义监控列表

## Key Decisions
- 保持轻量级定位，不做臃肿功能
- 优先覆盖 A 股主流数据
- 保持现有 Go + React 技术栈
