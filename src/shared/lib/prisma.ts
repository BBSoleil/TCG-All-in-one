// Prisma client singleton
// Adapter setup is required for Prisma 7 — configure when database is ready
// See: https://pris.ly/d/prisma7-client-config

export { PrismaClient } from "@/generated/prisma/client";
export type { User, Card, Collection, CollectionCard } from "@/generated/prisma/client";
