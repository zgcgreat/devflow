# Maintainability Specialist — Phase 6+ 技术专家审查层

> **来源**: 架构层 / supercorp-ultimate 融合  
> **层级**: L1-INTERACTION (Phase 6之上第二层)

## 触发条件

```yaml
triggers:
  - Always active (每次Phase 6都运行)
  - Especially important after large refactors
```

## 审查焦点

1. **死代码** (Dead Code): 未引用的函数/组件、废弃的import、注释掉的代码块
2. **魔法数字** (Magic Numbers): 硬编码阈值、超时时间、重试次数、缓冲区大小
3. **过时注释** (Stale Comments): 与实现不同步的文档行、错误的示例代码
4. **DRY违规** (DRY Violations): 重复逻辑片段超过3处、可抽取的通用工具函数

## 输出 Schema (JSON)

```json
{
  "specialist": "maintainability",
  "severity": "MEDIUM|LOW"
}
```

## 与现有双阶段审查的关系

- **Stage A**: 检查CODE_QUALITY AC是否覆盖
- **Stage B**: 作为并行agent扫描代码可维护性指标
- **G3门控**: 通常不阻塞发布，但积累为technical debt清单

## 组合策略

| 变更规模 | 触发的专家 |
|---------|-----------|
| Small (<50行) | Always: Maintainability only |
| Medium (50-200行) | Maintainability + Testing |
| Large (>200行) | Maintainability + Security + Performance |
