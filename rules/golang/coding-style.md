# Go Coding Style Rules

## Formatting
- Run `gofmt` (or `goimports`) on all code — no exceptions
- Use `golint` / `staticcheck` for static analysis warnings

## Naming Conventions
- Exported names: `PascalCase`; unexported: `camelCase`
- Acronyms stay uppercase: `HTTPClient`, not `HttpClient`
- Interfaces: prefer single-method names like `Reader`, `Writer`
- Packages: short, lowercase, single word (e.g., `http`, `json`)

## Error Handling
- Always check errors: never discard `_ = doSomething()`
- Wrap errors with context: `fmt.Errorf("reading config: %w", err)`
- Use `errors.Is` / `errors.As` for error inspection
- Sentinel errors: `var ErrNotFound = errors.New("not found")`

## Package Layout
- Follow standard layout: `cmd/`, `internal/`, `pkg/`, `api/`
- Keep `main.go` minimal — wire dependencies and call `run()`
- Prefer small interfaces in the package that consumes them
