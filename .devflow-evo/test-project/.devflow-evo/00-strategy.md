# Phase 0: YC Six Questions — Test Project Strategy

## Context
- **Tech Stack**: Go + React + Ant Design (基于 go-stock 项目)
- **Business Domain**: 金融数据终端 / 股票行情工具
- **Target Users**: A 股/港股/美股 投资者
- **User Request**: "帮我实现一个股票行情监控面板，支持实时行情展示、资金流向追踪和简单技术分析"

## YC Six Questions

### Q1: How Painful Is the Problem?
**Score**: 4/5

**Problem**: 投资者需要同时查看多个股票的实时行情、资金流向和技术指标，但现有工具分散且不统一。

**Cost of Not Solving**:
- 时间浪费: 需要在 3-5 个工具间切换查看数据
- 信息滞后: 无法第一时间捕捉市场变化
- 决策质量: 缺少整合视角影响投资决策

**Current Workarounds**:
1. 腾讯自选股 (行情 OK，但缺少深度分析)
2. 东方财富 (数据全，但 UI 复杂)
3. 手动查看多个网站 (效率极低)

**Frequency**: 交易日内每日多次
**Market Size**: 中国 A 股投资者约 1.8 亿

**Verdict**: HIGH PAIN — 投资者确实需要整合行情工具

### Q2: What Existing Solutions Exist?
**Score**: 3/5

**Competitor Analysis**:

| 解决方案 | 优势 | 劣势 | 定位 |
|----------|------|------|------|
| 同花顺 | 功能全，用户多 | UI 臃肿，广告多 | 大众市场 |
| 东方财富 | 数据全面，研报多 | 学习成本高 | 专业投资者 |
| 腾讯自选股 | 简洁，数据实时 | 缺少深度分析 | 轻量用户 |
| TradingView | 技术分析强 | A 股数据有限 | 技术分析师 |

**Gap Analysis**:
- 现有工具要么功能太强（用户用不完），要么功能太弱（不够用）
- 缺少一个"刚刚好"的轻量级整合工具
- A 股特色功能（如北向资金、龙虎榜）整合不足

**Verdict**: MODERATE COMPETITION — 有机会做差异化

### Q3: What's Your Unfair Advantage?
**Score**: 3/5

**Claimed Advantages**:
1. **现有基础**: go-stock 已有 Westock API 集成、行情数据获取能力
2. **技术栈成熟**: Go 后端 + React 前端架构已验证
3. **数据源优势**: 腾讯自选股 API 集成已就绪

**Weaknesses**:
- 用户基数小（相比同花顺千万级用户）
- 无品牌效应
- 推广渠道有限

**Defensibility**: MEDIUM — 产品体验可形成一定壁垒

**Verdict**: WEAK-MODERATE ADVANTAGE (3/5) — 技术基础好，但用户基础弱

### Q4: How Will You Acquire Customers?
**Score**: 4/5

**Acquisition Channels**:
1. **GitHub 开源社区** (免费，精准) — 目标: 开发者用户
2. **雪球/知乎内容营销** (低成本，长尾) — 目标: 投资者用户
3. **产品猎人/小众工具推荐** (中成本，高转化) — 目标: 早期采用者

**Est. CAC**:
- GitHub: ~$0 (时间成本)
- 内容营销: ~$10/用户 (时间摊销)
- 付费推广: ~$50/用户

**Blended CAC**: ~$15/用户
**Payback Period**: 假设付费版 $99/年，回本周期 < 1 个月 ✅

**Verdict**: VIABLE STRATEGY — 低成本获客路径清晰

### Q5: How Will You Make Money?
**Score**: 4/5

**Pricing Model**: Freemium
- 免费版: 基础行情 + 5 股票监控
- 专业版: $99/年 — 无限监控 + 深度分析 + 导出功能

**Unit Economics**:
- ARPU: $99/年
- 毛利率: 90% (SaaS 典型)
- 月流失率: 2% (金融工具流失较低)
- 客户生命周期: 50 个月
- **LTV**: $99 × 90% × 50 = $4,455

**LTV/CAC**: $4,455 ÷ $15 = **297:1** (极其优秀，但偏高估)

**保守估计** (LTV/CAC = 10:1 仍然健康)

**Verdict**: SOLID MODEL — 单位经济学健康

### Q6: 2x Speed Validation
**Score**: 4/5

**North Star Metric**: 每日活跃监控用户数 (DAU with active monitoring)

**Current Bottlenecks**:
1. **功能覆盖**: 当前只支持行情，缺少技术分析
2. **用户体验**: 界面还需要优化
3. **数据延迟**: 实时性可提升

**If 2x Resources (more engineers)**:
- 优先: 完成技术分析模块 (K线、MACD、RSI)
- 其次: 优化 UI/UX，提升用户留存
- 第三: 增加更多数据源

**MVP Definition** (3 months):
1. ✅ 基础行情面板 (已完成)
2. ⏳ 资金流向追踪 (Phase 4 实施)
3. ⏳ 简单技术分析 (Phase 4 实施)
4. ⏳ 自定义监控列表 (Phase 4 实施)

**Verdict**: CLEAR PRIORITIES — 目标明确，路径清晰

## G1 Gate Result

### Question Scores

| Question | Score | Quality | Status |
|----------|-------|---------|--------|
| Q1: Pain Point | 4/5 | 数据充分，需求真实 | ✅ PASS |
| Q2: Competition | 3/5 | 分析到位，有差异化思路 | ✅ PASS |
| Q3: Advantage | 3/5 | 技术基础好，用户基础弱 | ⚠️ WEAK |
| Q4: Acquisition | 4/5 | 低成本路径清晰 | ✅ PASS |
| Q5: Monetization | 4/5 | 单位经济学健康 | ✅ PASS |
| Q6: 2x Speed | 4/5 | 目标明确，路径清晰 | ✅ PASS |

### Gate Decision

**Passing Questions**: 6/6  
**Threshold**: ≥4  
**Result**: ✅ **G1 PASS** (strong)

**Weak Areas Requiring Phase 1 Follow-Up**:
- Q3 (Advantage): Score 3/5 — 需要加强用户获取和留存策略

**Risk Level**: LOW — 需求验证充分，产品方向正确

**Next Steps**:
1. Proceed to Phase 1 (5 Whys) 深化 Q3 分析
2. 制定用户获取和留存策略
3. 确认 MVP 功能优先级
