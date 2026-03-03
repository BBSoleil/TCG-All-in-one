# New Feature Scaffold

When I say /new-feature [feature-name] [game-scope?]:

1. Create the feature folder under src/features/[feature-name]/
2. Generate these files:
   - types/index.ts (with placeholder interfaces)
   - components/ (empty, with a barrel export)
   - actions/ (server actions stub)
   - hooks/ (custom hooks stub)
   - services/ (data access layer stub)
   - index.ts (barrel export)
3. If game-scope is provided, include game-specific type extensions
4. Add a basic Vitest file in tests/unit/[feature-name].test.ts
5. Update CLAUDE.md status section
6. Commit: "feat: scaffold [feature-name] feature"

Always define types FIRST before any implementation.
