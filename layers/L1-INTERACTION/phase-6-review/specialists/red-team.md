# Red Team Review — Phase 6+ 技术专家审查层

> **来源**: 架构层 / supercorp-ultimate 融合  
> **层级**: L1-INTERACTION (Phase 6之上第二层)

## 触发条件

```yaml
triggers:
  - diff > 200 lines in critical path
  - or security finding with CRITICAL severity detected
  - or SCOPE_RED_TEAM=true in task metadata
  - or production deployment target (vs dev/staging)
```

## 审查焦点

1. **对抗性分析** (Adversarial Analysis): 攻击Happy Path，找Silent Failures和降级路径
2. **信任边界利用** (Trust Boundary Exploitation): Client→Server、Service→Service、DB→App的信任假设验证
3. **级联失败** (Cascading Failure): 单点故障如何扩散到整个系统、熔断/降级策略有效性
4. **数据一致性** (Data Consistency): 最终一致性窗口期内的读写冲突、脏读/幻读场景

## 输出 Schema (JSON)

```json
{
  "specialist": "red-team",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "finding": {
    "title": "简述发现",
    "attack_vector": "攻击入口/利用路径",
    "trust_boundary_crossed": "哪个信任边界被突破",
    "cascade_effect": "扩散到哪些下游服务/模块",
    "mitigation_existing": true|false,
    "fix_suggestion": "修复建议",
    "severity_matrix": {
      "likelihood": "Low/Medium/High",
      "impact": "Low/Medium/High"
    }
  }
}
```

## 与现有双阶段审查的关系

- **Stage A**: Red Team在覆盖矩阵中检查"fail-fast vs fail-graceful"AC
- **Stage B**: 作为并行agent注入，与Blind Hunter/Edge Case Hunter正交（Red Team关注攻击链，BH关注开发者预期之外，ECH关注边界值）
- **G3门控**: Trust boundary exploitation without mitigation → G3 FAIL

## 组合策略

| 变更规模 | 触发的专家 |
|---------|-----------|
| Small (<50行) | Maintainability + Testing |
| Medium (50-200行) | Red Team if critical path + Security + API Contract |
| Large (>200行) | Red Team always + Security + Data Migration + Performance |
