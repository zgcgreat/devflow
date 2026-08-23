---
name: security-scan
description: |
  Automated security scanning for code changes. Integrates with OWASP ZAP,
  npm audit, Snyk, and custom security rules.
  Use when: "security scan", "dependency audit", "vulnerability detection".
source: ECC skills/security-scan/SKILL.md
mapped_phase: P5
---

# Security Scan Skill

> 安全底线: 见 rules/prompt-defense-baseline.md

## When to Use

- Phase 5 test phase — automated security scanning
- CI/CD pipeline security gate
- Dependency vulnerability audit

## Scan Categories

### Dependency Scan
```bash
npm audit --audit-level=high
pip audit
snyk test
```

### Static Analysis
- Hardcoded secrets detection
- SQL injection pattern detection
- XSS pattern detection
- Path traversal pattern detection

### Dynamic Analysis (when available)
- OWASP ZAP baseline scan
- API endpoint fuzzing

## Output Format

| Category | Finding | Severity | Status |
|----------|---------|----------|--------|
| Dependency | CVE-XXXX | HIGH | fix available |
| Code | hardcoded key | CRITICAL | needs remediation |
