---
name: C/C++ Stack
description: "C/C++ extended personas for code review and build resolution"
mapped_phases: [P4, P6]
load_policy: on-demand
trigger: "C/C++ tech stack detected"
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# C/C++ Extended Personas

## Available Personas

| Persona | Phase | Trigger |
|---------|-------|---------|
| cpp-reviewer | P6 | C/C++ code review |
| cpp-build-resolver | P4 | C/C++ build errors |

## Activation

Load when C/C++ tech stack is detected.
