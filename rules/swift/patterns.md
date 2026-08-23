# Swift Design Patterns

## Architecture
- Use MVVM with Combine/SwiftUI or Coordinator pattern with UIKit
- Repository pattern: abstract data sources behind protocols
- Use dependency injection via protocol-based initializers
- Keep view controllers thin — delegate logic to view models

## Concurrency
- Use Swift Concurrency (`async/await`, `Actor`) for modern async code
- `@MainActor` for UI-bound work; actors for shared mutable state
- Use structured concurrency with `TaskGroup` for parallel work
- Avoid unstructured `Task {}` unless lifecycle-managed explicitly

## Error Handling
- Use typed `throws` (Swift 6+) or `Result<Success, Failure>` for recoverable errors
- Define domain error enums conforming to `LocalizedError`
- Map framework errors to domain errors at repository boundaries
- Never silently swallow errors — at minimum, log them

## Protocol-Oriented Design
- Prefer protocols over inheritance for polymorphism
- Use protocol extensions for default implementations
- Compose small protocols rather than large monolithic ones
- Use `some Protocol` (opaque types) for return type hiding
