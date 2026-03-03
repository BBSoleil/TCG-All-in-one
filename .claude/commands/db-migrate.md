# Database Migration

When I say /db-migrate [description]:

1. Review current schema.prisma for the change
2. Generate migration: npx prisma migrate dev --name [description]
3. Generate client: npx prisma generate
4. Update any affected service types
5. Commit: "chore(db): [description]"
