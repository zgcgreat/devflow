---
name: Rust Stack
description: "Rust extended personas for Rust code review and build resolution"
mapped_phases: [P4, P6]
load_policy: on-demand
trigger: "Rust tech stack detected"
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Rust Extended Personas

## Available Personas

| Persona | Phase | Trigger |
|---------|-------|---------|
| rust-reviewer | P6 | Rust code review |
| rust-build-resolver | P4 | Rust build errors |

## Activation

Load when Rust tech stack is detected.
