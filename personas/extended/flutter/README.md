---
name: Flutter Stack
description: "Flutter/Dart extended personas for Flutter code review and build resolution"
mapped_phases: [P4, P6]
load_policy: on-demand
trigger: "Flutter tech stack detected"
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Flutter Extended Personas

## Available Personas

| Persona | Phase | Trigger |
|---------|-------|---------|
| flutter-reviewer | P6 | Flutter code review |
| dart-build-resolver | P4 | Dart/Flutter build errors |

## Activation

Load when Flutter tech stack is detected.
