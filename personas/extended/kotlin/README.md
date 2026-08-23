---
name: Kotlin Stack
description: "Kotlin extended personas for Kotlin/Android/KMP review and build resolution"
mapped_phases: [P4, P6]
load_policy: on-demand
trigger: "Kotlin tech stack detected"
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Kotlin Extended Personas

## Available Personas

| Persona | Phase | Trigger |
|---------|-------|---------|
| kotlin-reviewer | P6 | Kotlin code review |
| kotlin-build-resolver | P4 | Kotlin build errors |

## Activation

Load when Kotlin tech stack is detected.
