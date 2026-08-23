# Testing Specialist — Phase 6+ 技术专家审查层

> **来源**: 架构层 / supercorp-ultimate 融合  
> **层级**: L1-INTERACTION (Phase 6之上第二层)

## 触发条件

```yaml
triggers:
  - Always active (每次Phase 6都运行)
  - Especially important for critical path changes
```

## 审查焦点

1. **测试覆盖率缺口** (Coverage Gaps): 新代码行/分支是否被测、mutation testing得分
2. **边界测试缺失** (Missing Edge Cases): null/empty/max-value/min-value/error-path覆盖
3. **隔离性** (Isolation): 测试间依赖（共享state、DB污染）、flaky test检测
4. **Negative Path** (负向路径): 错误输入、超时、服务降级场景的测试用例

## 输出 Schema (JSON)

```json
{
  "specialist": "testing",
  "severity": "HIGH|MEDIUM|LOW",
  "finding": {
    "title": "简述发现",
    "location": "file:line or missing_test_file",
    "category": "coverage_gap|edge_case|isolation|negative_path",
    "description": "测试问题描述",
    "affected_scope": "受影响的模块/功能",
    "fix_suggestion": "修复建议"
  }
}
```

## 与现有双阶段审查的关系

- **Stage A**: 检查测试覆盖矩阵中新增代码行的测试状态
- **Stage B**: 作为并行agent分析Phase 5测试结果并定位未覆盖区域
- **G3门控**: Critical path no test → G3 FAIL until test added

## 组合策略

| 变更规模 | 触发的专家 |
|---------|-----------|
| Small (<50行) | Maintainability + Testing |
| Medium (50-200行) | Testing + API Contract + Performance |
| Large (>200行) | Testing + Security + Red Team + Data Migration |
