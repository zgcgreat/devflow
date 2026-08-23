# Go Design Patterns

## Concurrency
- Use `errgroup` for concurrent tasks that can fail
- Prefer channels over shared memory; prefer `sync.Mutex` over channels for simple state
- Always close channels from the sender side; never close a receive-only channel
- Use `context.Context` for cancellation and deadlines — pass as first parameter

## Dependency Injection
- Accept interfaces, return structs
- Constructor pattern: `func NewService(dep Dep) *Service`
- Avoid `init()` for complex setup — explicit construction is testable

## Error Propagation
- Bubble errors up; handle at the boundary (HTTP handler, CLI main)
- Use custom error types for domain-specific errors
- Implement `Unwrap()` for error chain inspection

## Resource Management
- Use `defer` for cleanup: file closes, mutex unlocks, response body closes
- Close HTTP response bodies: `defer resp.Body.Close()`
- Set timeouts on all network operations via `context.WithTimeout`
