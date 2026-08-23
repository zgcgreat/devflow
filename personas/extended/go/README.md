---
name: Go Stack
description: "Go extended personas for Go code review and build resolution"
mapped_phases: [P4, P6]
load_policy: on-demand
trigger: "Go tech stack detected"
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Go Extended Personas

## Available Personas

| Persona | Phase | Trigger |
|---------|-------|---------|
| go-reviewer | P6 | Go code review |
| go-build-resolver | P4 | Go build errors |

## Activation

Load when Go tech stack is detected.
