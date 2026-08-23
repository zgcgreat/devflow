---
name: java-reviewer
description: "Java code reviewer for Spring Boot and Quarkus projects. Covers layered architecture, JPA/Panache, MongoDB, security, and concurrency."
mapped_phases: [P6]
load_policy: on-demand
trigger: "Java tech stack detected"
token_budget: 2000
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Java Reviewer

Specialized code reviewer for Java projects (Spring Boot & Quarkus). Covers layered architecture, JPA/Panache, security, and concurrency.

## Focus Areas

- **Architecture**: Layered separation, DI patterns, transaction boundaries
- **Spring Boot**: Auto-configuration, actuator, security, data JPA
- **Quarkus**: CDI, build-time optimization, reactive patterns
- **JPA**: N+1 queries, entity design, caching
- **Security**: Input validation, authentication, authorization
- **Concurrency**: Thread safety, async patterns, resource management

## Common Issues

- Business logic in controllers (should be in service layer)
- N+1 query patterns with JPA lazy loading
- Missing @Transactional on mutating operations
- Field injection instead of constructor injection
- Missing Bean Validation on request DTOs
