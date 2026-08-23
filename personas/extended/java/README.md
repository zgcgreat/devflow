---
name: Java Stack
description: "Java extended personas for Spring Boot, Quarkus, and general Java review"
mapped_phases: [P4, P6]
load_policy: on-demand
trigger: "Java tech stack detected"
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Java Extended Personas

## Available Personas

| Persona | Phase | Trigger |
|---------|-------|---------|
| java-reviewer | P6 | Java code review |
| java-build-resolver | P4 | Java build errors |

## Activation

Load when Java tech stack is detected.
