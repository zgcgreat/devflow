# Swift Security Rules

## Input Validation
- Validate all user input at view controllers and API boundaries
- Use Swift type system for domain constraints (optionals, enums, value types)
- Sanitize strings before display in WKWebView or dynamic content
- Reject malformed input early with appropriate error responses

## Secure Networking
- Enforce HTTPS everywhere — never use `http://` URLs in production
- Implement certificate pinning with `URLSessionDelegate` for critical APIs
- Use `URLSession` with proper TLS configuration; avoid third-party HTTP clients without TLS review
- Validate server certificates; do not bypass TLS checks in production

## Data Protection
- Store secrets (tokens, passwords, API keys) in iOS Keychain via `Security` framework
- Use `LAContext` / Face ID / Touch ID for biometric-protected Keychain items
- Never store sensitive data in `UserDefaults`, files, or NSCache
- Use `NSFileProtectionComplete` for file-level encryption on disk

## App Transport Security (ATS)
- Keep ATS enabled in `Info.plist` — do not set `NSAllowsArbitraryLoads = true`
- If specific domains need HTTP, add per-domain exceptions with `NSExceptionAllowsInsecureHTTPLoads`
- Document every ATS exception with a security justification
- Migrate exceptions to HTTPS as soon as possible; review ATS config each release
