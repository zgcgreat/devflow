---
name: Swift Stack
description: "Swift extended personas for build resolution"
mapped_phases: [P4]
load_policy: on-demand
trigger: "Swift tech stack detected"
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Swift Extended Personas

## Available Personas

| Persona | Phase | Trigger |
|---------|-------|---------|
| swift-build-resolver | P4 | Swift build errors |

## Activation

Load when Swift tech stack is detected.