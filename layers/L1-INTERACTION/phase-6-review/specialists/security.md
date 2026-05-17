# Security Specialist — Phase 6+ 技术专家审查层

> **来源**: mega-workflow / supercorp-ultimate 融合  
> **层级**: L1-INTERACTION (Phase 6之上第二层)

## 触发条件

```yaml
triggers:
  - diff > 200 lines
  - or security finding with CRITICAL severity in Stage A/B
  - or SCOPE_SECURITY=true in task metadata
```

## 审查焦点

1. **输入校验** (Input Validation): API端点、表单字段、URL参数的未过滤输入处理
2. **认证绕过** (Auth Bypass): JWT验证、session管理、权限提升路径
3. **注入向量** (Injection Vectors): SQL/HTML/Command/Object injection
4. **加密误用** (Crypto Misuse): 弱算法、硬编码密钥、不安全的随机数生成
5. **凭证泄露** (Secrets Exposure): API keys/passwords/token在日志或错误消息中

## 输出 Schema (JSON)

```json
{
  "specialist": "security",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "finding": {
    "title": "简述发现",
    "location": "file:line",
    "description": "详细描述漏洞及利用路径",
    "exploit_scenario": "攻击者如何利用此漏洞",
    "fix_suggestion": "修复建议",
    "cve_reference": "相关CVE编号(如有)"
  },
  "trust_boundary_violation": true|false
}
```

## 与现有双阶段审查的关系

- **Stage A** (Spec Compliance): Security Specialist在覆盖矩阵中检查安全需求
- **Stage B** (Code Review): 作为并行独立agent注入到review agents列表
- **G3门控**: CRITICAL发现 → 自动触发 G3 FAIL，HIGH发现 → G3 conditional pass

## 组合策略

| 变更规模 | 触发的专家 |
|---------|-----------|
| Small (<50行) | Security (if auth scope) + Maintainability |
| Medium (50-200行) | Security + Performance + Testing |
| Large (>200行) | Security + API Contract + Data Migration + Red Team |
