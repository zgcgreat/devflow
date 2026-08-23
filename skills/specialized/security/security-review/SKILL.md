---
name: security-review
description: |
  Deep security review capability for code changes. OWASP Top 10 analysis,
  vulnerability detection, and remediation recommendations.
  Use when: "security review", "security audit", "vulnerability scan".
source: ECC skills/security-review/SKILL.md
mapped_phase: P6
---

# Security Review Skill

> 安全底线: 见 rules/prompt-defense-baseline.md

## When to Use

- Phase 6 code review requires security review
- Any code handling user input, authentication, API endpoints, or sensitive data
- Before production deployment (Audit mode)

## Review Process

### 1. Initial Scan
- Run `npm audit --audit-level=high` or equivalent
- Search for hardcoded secrets (API keys, passwords, tokens)
- Review high-risk areas: auth, API endpoints, DB queries, file uploads, payments

### 2. OWASP Top 10 Check
1. Injection — Parameterized queries? Input sanitized?
2. Broken Auth — Passwords hashed? JWT validated?
3. Sensitive Data — HTTPS enforced? Secrets in env vars?
4. XXE — XML parsers configured securely?
5. Broken Access — Auth checked on every route?
6. Misconfiguration — Debug mode off in prod? Security headers set?
7. XSS — Output escaped? CSP set?
8. Insecure Deserialization — User input deserialized safely?
9. Known Vulnerabilities — Dependencies up to date?
10. Insufficient Logging — Security events logged?

### 3. Report Format
```
[CRITICAL] <issue title>
File: path:line
Issue: <description>
Fix: <remediation>
```

Severity: CRITICAL / HIGH / MEDIUM / LOW
Verdict: APPROVE / WARNING / BLOCK
