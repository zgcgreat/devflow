# Performance Specialist — Phase 6+ 技术专家审查层

> **来源**: mega-workflow / supercorp-ultimate 融合  
> **层级**: L1-INTERACTION (Phase 6之上第二层)

## 触发条件

```yaml
triggers:
  - Backend scope active
  - or Frontend scope active with rendering changes
  - or diff > 100 lines in query/loop-heavy files
  - or performance regression detected in Phase 5
```

## 审查焦点

1. **N+1查询** (N+1 Queries): ORM eager loading缺失、循环内DB查询、批量操作优化
2. **缺失索引** (Missing DB Indexes): WHERE/JOIN/ORDER BY列未建索引，多对多关系中间表无索引
3. **Bundle Size** (前端): 路由级代码分割缺失、大依赖未懒加载、tree shaking失效
4. **渲染性能** (Rendering): 不必要的re-render、virtual list缺失、debounce/throttle应用

## 输出 Schema (JSON)

```json
{
  "specialist": "performance",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "finding": {
    "title": "简述发现",
    "location": "file:line",
    "category": "query_index|bundle_size|rendering|memory_leak",
    "description": "性能问题描述",
    "estimated_impact": "影响的请求/用户比例",
    "benchmark_data": {
      "before_ms": 数字,
      "after_ms": 数字,
      "n_plus_1_queries": 数字
    },
    "fix_suggestion": "修复建议",
    "optimization_priority": "P0-P3"
  }
}
```

## 与现有双阶段审查的关系

- **Stage A**: Performance AC是否覆盖在PRD中（如API响应时间<200ms）
- **Stage B**: 作为并行agent扫描performance hotspots
- **G3门控**: N+1查询未优化 → G3 conditional pass with optimization todo

## 组合策略

| 变更规模 | 触发的专家 |
|---------|-----------|
| Small (<50行) | Maintainability + Performance (if query change) |
| Medium (50-200行) | Performance + Testing + API Contract |
| Large (>200行) | Performance + Security + Red Team + Data Migration |
