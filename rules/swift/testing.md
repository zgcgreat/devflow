# Swift Testing Rules

## Test Structure
- Use XCTest framework; place tests in `Tests/` directory mirroring source
- Naming: `test_unitOfWork_scenario_expectedResult`
- Use `XCTContext.runActivity` for grouping related assertions
- Organize with `// MARK: - Test Group` comments

## Assertions
- Use `XCTAssertEqual`, `XCTAssertTrue`, `XCTAssertNotNil` for clarity
- For async: `XCTestExpectation` or `async/await` with `await fulfillment`
- Use `XCTAssertThrowsError` for error-path testing

## Mocking
- Define protocols for dependencies; create mock conformances in test targets
- Use `@Mockable` macro (if available) or hand-written mocks
- Verify mock interactions with call-count tracking
- Avoid mocking Swift standard library types

## Coverage and CI
- Target >= 80% coverage for core modules
- Enable code coverage in Xcode scheme settings
- Run `xcodebuild test -scheme MyScheme -destination 'platform=iOS Simulator,name=iPhone 16'`
- Use UI test targets (`XCUITest`) for critical user flows only
