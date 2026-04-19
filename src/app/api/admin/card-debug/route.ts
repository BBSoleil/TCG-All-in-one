import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";

/**
 * Admin-only debug endpoint for the "Card not found" 404 bug.
 * GET /api/admin/card-debug?id=onepiece-OP11-097
 * Returns what findUnique vs findMany(contains) see, to diagnose ID mismatches.
 * Delete once bug #5 is closed.
 */
export async function GET(request: Request) {
  const session = await auth();
  const adminEmail = process.env["ADMIN_EMAIL"];
  if (!adminEmail || !session?.user?.email || session.user.email !== adminEmail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const [exact, byContains, byLower] = await Promise.all([
    prisma.card.findUnique({
      where: { id },
      select: { id: true, name: true, gameType: true, setName: true },
    }),
    prisma.card.findMany({
      where: { id: { contains: id.split("-").slice(1).join("-") } },
      select: { id: true, name: true },
      take: 5,
    }),
    prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
      `SELECT id, name FROM cards WHERE LOWER(id) = LOWER($1) LIMIT 5`,
      id,
    ),
  ]);

  return NextResponse.json({ queried: id, exact, byContains, byLower });
}
