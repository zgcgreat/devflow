# Go Testing Rules

## Test Structure
- File naming: `xxx_test.go` in the same package (or `_test` package for black-box)
- Test function naming: `TestUnitOfWork_Scenario_ExpectedResult`
- Table-driven tests: define `[]struct{ name, input, want }` and loop with `t.Run`

## Assertions
- Use `t.Errorf` / `t.Fatalf` for failures — avoid external assertion libraries in core logic
- For comparisons: `if got != want { t.Errorf("got %v, want %v", got, want) }`
- Use `testify/assert` only if the team convention requires it

## Coverage
- Target >= 80% for core packages; 100% for utility helpers
- Run `go test -cover ./...` and `go test -race ./...` in CI
- Use build tags for integration tests: `//go:build integration`

## Mocking
- Define interfaces for external dependencies; mock the interface
- Use `gomock` or hand-written fakes — avoid mocking concrete types
- Test error paths: inject failures via mock returns
