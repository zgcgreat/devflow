# Kotlin Testing Rules

## Test Structure
- Use JUnit 5 for unit tests; `@Test` annotation on each test
- Naming: `` `should do X when Y`() `` or `shouldDoXWhenY()`
- Place tests in `src/test/kotlin/` mirroring source structure
- Use `@Nested` for grouping related test cases

## Assertions
- Prefer Kotlin-native assertions or `assertj-kotlin` for fluent API
- `assertEquals(expected, actual)` for simple cases
- Use `assertSoftly` from `assertj` for multiple assertions without short-circuit

## Mocking
- Use MockK for Kotlin-native mocking — avoids final class issues
- Mock interfaces, not concrete classes
- Verify interactions: `verify { mock.method(any()) }`
- Use `relaxed = true` only when default returns are needed

## Coverage and CI
- Target >= 80% coverage for core modules
- Run `./gradlew test jacocoTestReport` in CI
- Integration tests: use `@Tag("integration")` with separate task
- Use Testcontainers for database/service integration tests
