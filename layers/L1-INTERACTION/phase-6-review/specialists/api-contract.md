# API Contract Specialist — Phase 6+ 技术专家审查层

> **来源**: mega-workflow / supercorp-ultimate 融合  
> **层级**: L1-INTERACTION (Phase 6之上第二层)

## 触发条件

```yaml
triggers:
  - SCOPE_API=true in task metadata
  - or diff modifies REST/GraphQL endpoints
  - or changes request/response schemas/types
  - or adds/removes API version routes
```

## 审查焦点

1. **破坏性变更** (Breaking Changes): 移除字段、重命名列、更改响应类型、修改required fields
2. **版本策略** (Versioning Strategy): API版本管理(deprecation cycle)、backward compatibility保证
3. **错误响应一致性** (Error Response Consistency): HTTP状态码与body格式统一、错误码枚举完整性
4. **请求体验证** (Request Validation): required字段校验、类型安全、boundary值处理

## 输出 Schema (JSON)

```json
{
  "specialist": "api-contract",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "finding": {
    "title": "简述发现",
    "endpoint": "HTTP METHOD /path",
    "breaking_change": true|false,
    "affected_version": "当前版本/受影响客户端",
    "description": "契约变更描述",
    "backward_compatible": true|false,
    "fix_suggestion": "修复建议",
    "canary_safe": true|false
  }
}
```

## 与现有双阶段审查的关系

- **Stage A**: API AC覆盖矩阵中检查breaking changes清单
- **Stage B**: 作为并行agent diff审查所有endpoint变更
- **G3门控**: Breaking change未versioned → G3 FAIL until v2 route added

## 组合策略

| 变更规模 | 触发的专家 |
|---------|-----------|
| Small (<50行) | Maintainability (if inconsistent error format) |
| Medium (50-200行) | API Contract + Testing + Performance |
| Large (>200行) | API Contract + Security + Data Migration + Red Team |
