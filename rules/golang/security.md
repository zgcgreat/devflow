# Go Security Rules

## SQL Injection Prevention
- Always use `database/sql` with parameterized queries (`$1`, `$2` placeholders)
- Never concatenate user input into SQL strings
- Use `db.Query("SELECT * FROM users WHERE id = $1", userID)` pattern
- Prefer ORM/query builders (sqlc, squirrel) that enforce parameterization

## Input Validation
- Validate all external input at system boundaries (HTTP handlers, CLI args)
- Use `validator` package or manual bounds checking
- Reject unexpected input early; never pass raw input to internal layers
- Sanitize strings before logging to prevent log injection

## Command Injection
- Avoid `os/exec` with user-controlled arguments
- If unavoidable, use `exec.Command(name, args...)` with explicit arg list — never shell string interpolation
- Never pass user input through `sh -c` or `bash -c`

## Secure HTTP
- Enforce TLS 1.2+ in production; configure `tls.Config` with `MinVersion: tls.VersionTLS12`
- Set timeouts on HTTP servers and clients: `ReadTimeout`, `WriteTimeout`, `IdleTimeout`
- Configure CORS with explicit allowed origins — never use `*` for authenticated endpoints
- Set security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`

## Secrets Management
- Never hardcode API keys, passwords, or tokens in source code
- Use environment variables (`os.Getenv`) or secret managers (Vault, AWS Secrets Manager)
- Load secrets at startup, not at build time
- Add `.env` files to `.gitignore`; provide `.env.example` templates only
