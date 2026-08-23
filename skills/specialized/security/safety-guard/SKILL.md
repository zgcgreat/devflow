---
name: safety-guard
description: |
  Safety guardrails enforcement for AI-generated code. Prevents dangerous patterns,
  enforces secure defaults, and validates safety constraints.
  Use when: "safety guard", "guardrails", "dangerous code detection".
source: ECC skills/safety-guard/SKILL.md
mapped_phase: P4, P5, P6
---

# Safety Guard Skill

> 安全底线: 见 rules/prompt-defense-baseline.md

## Safety Guardrails

### Dangerous Pattern Detection
- Command injection: shell commands with user input
- SQL injection: string-concatenated queries
- XSS: unescaped user input in HTML/JSX
- Path traversal: unsanitized file paths
- Hardcoded secrets: API keys, passwords in source

### Secure Default Enforcement
- Use environment variables for secrets
- Use parameterized queries for database access
- Use DOMPurify or equivalent for HTML sanitization
- Validate all external input at boundaries
- Use bcrypt/argon2 for password hashing

### Safety Checklist
- [ ] No hardcoded secrets
- [ ] All user input validated and sanitized
- [ ] All SQL queries parameterized
- [ ] Authentication checked on protected routes
- [ ] Error messages don't leak internal details
- [ ] Rate limiting on public endpoints
- [ ] CORS properly configured
