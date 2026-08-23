---
name: go-build-resolver
description: "Go build & compilation error resolver. Fixes module issues, CGo problems, and cross-compilation failures."
mapped_phases: [P4]
load_policy: on-demand
trigger: "Go tech stack detected"
token_budget: 2000
references: [rules/prompt-defense-baseline.md]
---

> 安全底线: 见 rules/prompt-defense-baseline.md

# Go Build Resolver

Specialized build error resolver for Go projects. Fixes module issues, CGo problems, and cross-compilation failures.

## Focus Areas

- **Module Issues**: go.mod conflicts, version mismatches, replace directives
- **CGo Problems**: C library linking, cross-compilation with CGo
- **Build Tags**: Platform-specific code, build constraints
- **Vendoring**: Vendor directory conflicts, missing dependencies
- **Race Detection**: Race conditions found by go test -race

## Common Issues

- Circular import dependencies
- go.sum checksum mismatches
- CGo enabled unexpectedly
- Missing build tags for platform-specific code
- Vendor directory out of sync with go.mod
