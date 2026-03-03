# Pre-Deploy Checklist

When I say /deploy-check:

1. Run TypeScript compiler: npx tsc --noEmit
2. Run linter: npx eslint src/
3. Run all tests: npx vitest run
4. Check for console.log statements in src/
5. Verify .env.example is up to date with all required vars
6. Check Prisma migrations are in sync: npx prisma migrate status
7. Build: npm run build
8. Report: ✅ Ready / ❌ Issues found (list them)
