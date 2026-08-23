---
name: Python Stack
description: "Python extended personas for Django, FastAPI, and general Python review"
mapped_phases: [P4, P6]
load_policy: on-demand
trigger: "Python tech stack detected"
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Python Extended Personas

## Available Personas

| Persona | Phase | Trigger |
|---------|-------|---------|
| python-reviewer | P6 | Python project |
| django-build-resolver | P4 | Django build errors |
| django-reviewer | P6 | Django code review |
| fastapi-reviewer | P6 | FastAPI code review |

## Activation

Load when Python tech stack is detected or when the project uses Django/FastAPI.
