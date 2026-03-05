import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  // Strip pgbouncer param — session pooler (port 5432) doesn't need it,
  // and pg library doesn't understand it
  const connectionString = process.env["DATABASE_URL"]
    ?.trim()
    .replace(/[?&]pgbouncer=true/g, "");
  // Reuse pool across warm invocations to avoid reconnection overhead
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }
  const adapter = new PrismaPg(globalForPrisma.pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache PrismaClient globally to reuse across warm serverless invocations
globalForPrisma.prisma = prisma;

export type { User, Account, Session, Collection, CollectionCard, Card } from "@/generated/prisma/client";
