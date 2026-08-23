# Kotlin Security Rules

## SQL Injection Prevention
- Use Exposed DSL or parameterized queries with `addSqlParameter`
- Never concatenate user input into SQL strings
- With Ktor: validate query parameters before database access
- Use `java.sql.PreparedStatement` if using raw JDBC

## Input Validation
- Validate all HTTP request inputs at the route handler level
- Use Kotlin type system for domain boundaries (value classes, sealed classes)
- Sanitize string inputs before logging, rendering, or persistence
- Reject malformed input early with 400 responses

## Command Injection
- Avoid `Runtime.exec()` or `ProcessBuilder` with user-controlled input
- If unavoidable, use `ProcessBuilder` with explicit argument list — never shell interpolation
- Never pass user input to shell interpreters (`bash -c`, `sh -c`)

## Secure HTTP (Ktor)
- Enforce HTTPS with `HSTS` header in production
- Configure CORS with explicit `allowHosts` — never wildcard for authenticated routes
- Set security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`
- Use `Authentication` plugin with proper JWT/session validation on protected routes

## Secrets Management
- Never hardcode API keys, passwords, or tokens in source code
- Use environment variables (`System.getenv()`) or secret managers
- Store secrets in `local.properties` (gitignored) for Android; never commit
- Use Kotlin `by lazy` for deferred secret loading at runtime
