# Kotlin Coding Style Rules

## Formatting
- Follow Kotlin official coding conventions (or Ktlint defaults)
- Use 4-space indentation; no tabs
- Maximum line length: 120 characters
- Run `ktlint` or `detekt` in CI

## Naming Conventions
- Classes/interfaces: `PascalCase`; functions/properties: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`; backing fields: `_propertyName`
- Packages: lowercase, no underscores (e.g., `com.example.auth`)
- Boolean properties: prefix with `is`, `has`, `should`

## Idiomatic Kotlin
- Prefer `val` over `var`; use immutable collections (`listOf`, `mapOf`)
- Use scope functions (`let`, `run`, `apply`, `also`, `with`) appropriately
- Use sealed classes for restricted hierarchies; data classes for DTOs
- Prefer extension functions over utility classes

## Null Safety
- Leverage nullability in the type system — avoid `!!` operator
- Use `?.let {}` for safe chains; `?:` (Elvis) for defaults
- Annotate platform types explicitly (`@Nullable` / `@NonNull`) for Java interop
