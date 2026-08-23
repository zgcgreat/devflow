---
name: Network Stack
description: "Network extended personas for network architecture planning"
mapped_phases: [P2, P6]
load_policy: on-demand
trigger: "Network configuration changes detected"
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Network Extended Personas

## Available Personas

| Persona | Phase | Trigger |
|---------|-------|---------|
| network-architect | P2, P6 | Network architecture design |

## Activation

Load when network configuration changes are detected (nginx.conf, Docker networks, API gateway configs).