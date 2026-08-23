---
name: Database Stack
description: "Database extended personas for PostgreSQL/Supabase review"
mapped_phases: [P6]
load_policy: on-demand
trigger: "Database changes detected"
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Database Extended Personas

## Available Personas

| Persona | Phase | Trigger |
|---------|-------|---------|
| database-reviewer | P6 | Database schema/query review |

## Activation

Load when database changes are detected (migrations, schema changes, ORM config).