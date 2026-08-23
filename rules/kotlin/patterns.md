# Kotlin Design Patterns

## Architecture
- Follow MVVM for Android; clean architecture for backend (Ktor)
- Repository pattern: abstract data sources behind interfaces
- Use cases / interactors: single-responsibility business logic
- Dependency injection: Hilt (Android) or Koin (multiplatform)

## Coroutines
- Use `kotlinx.coroutines` for async work — structured concurrency
- `viewModelScope` / `lifecycleScope` for lifecycle-aware coroutines
- Use `Flow` for reactive streams; `SharedFlow` for hot streams
- Always handle cancellation: check `isActive` or use `ensureActive()`

## Error Handling
- Use `Result<T>` or `Either<Error, T>` for domain-level errors
- `try/catch` in coroutine scope handlers, not deep in call chains
- Map exceptions to domain types at repository boundaries
- Use sealed class hierarchies for typed error states

## Functional Patterns
- Use `map`, `filter`, `fold` over imperative loops
- Keep functions pure where possible; side effects at the boundary
- Use value classes for type-safe primitives (`@JvmInline value class UserId(val value: String)`)
