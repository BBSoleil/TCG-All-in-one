# Run & Generate Tests

When I say /test [feature-name?]:

1. If feature specified, run: npx vitest run tests/unit/[feature-name]
2. If no feature, run full suite: npx vitest run
3. Check coverage gaps and suggest new test cases
4. For any failing test, explain the root cause and fix it
5. Ensure all service functions have at least one happy path + one error path test
