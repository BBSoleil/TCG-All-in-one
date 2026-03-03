# Code Review

When I say /review [file-or-folder?]:

Delegate to the review-agent (Opus model) to:
1. Check TypeScript strictness (no `any`, no unsafe assertions)
2. Verify Server Component vs Client Component boundaries
3. Check for proper error handling (Result pattern in services)
4. Verify naming conventions
5. Check file length (<300 lines)
6. Look for security issues (SQL injection, XSS, auth bypasses)
7. Verify barrel exports are maintained
8. Check for missing tests

Output a structured report with: PASS / WARN / FAIL per category.
If no file specified, review all staged changes.
