# Swift Coding Style Rules

## Formatting
- Follow Swift API Design Guidelines and SwiftLint defaults
- Use 4-space indentation; no tabs
- Maximum line length: 120 characters
- Run `swiftlint` in CI with project-specific rules

## Naming Conventions
- Types/protocols: `PascalCase`; functions/properties: `camelCase`
- Boolean properties: `isEmpty`, `hasPrefix`, `shouldAnimate`
- Avoid abbreviations except well-known ones (`URL`, `ID`, `HTTP`)
- Use `Self` for static references in protocols

## Idiomatic Swift
- Prefer `let` over `var`; use value types (struct) over reference types (class) by default
- Use `guard` for early returns; avoid deep nesting
- Use `enum` with associated values for state modeling
- Leverage optionals explicitly — avoid force unwraps (`!`) in production

## Access Control
- Mark types and members with minimum required access level
- Default to `internal`; use `private` for implementation details
- Use `fileprivate` sparingly; prefer `private` with extensions
