import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";
import { getCardById } from "@/features/cards/services";
import { getPriceHistory } from "@/features/cards/services/price-history";
import { browseListings } from "@/features/market/services/listings";

/**
 * Admin-only debug endpoint for the card-detail 404 bug.
 * GET /api/admin/card-debug?id=pokemon-base1-43
 *
 * Runs the exact same 3 service calls the detail page uses, plus a raw
 * findUnique and findFirst, and reports which one fails and how.
 */
export async function GET(request: Request) {
  const session = await auth();
  const adminEmail = process.env["ADMIN_EMAIL"];
  if (!adminEmail || !session?.user?.email || session.user.email !== adminEmail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const report: Record<string, unknown> = { queried: id };

  // 1. Raw Prisma findUnique
  try {
    const raw = await prisma.card.findUnique({ where: { id }, select: { id: true, name: true } });
    report["rawFindUnique"] = raw ?? "null";
  } catch (e) {
    report["rawFindUnique_error"] = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  // 2. getCardById (the same call the page uses, with all includes)
  try {
    const result = await getCardById(id);
    report["getCardById"] = result.success
      ? { ok: true, name: result.data.name, hasPokemonDetails: !!result.data.pokemonDetails }
      : { ok: false, error: result.error.message };
  } catch (e) {
    report["getCardById_throw"] = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  // 3. browseListings
  try {
    const result = await browseListings({ cardId: id });
    report["browseListings"] = result.success
      ? { ok: true, count: result.data.listings.length }
      : { ok: false, error: result.error.message };
  } catch (e) {
    report["browseListings_throw"] = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  // 4. getPriceHistory
  try {
    const result = await getPriceHistory(id, 90);
    report["getPriceHistory"] = result.success
      ? { ok: true, points: result.data.length }
      : { ok: false, error: result.error.message };
  } catch (e) {
    report["getPriceHistory_throw"] = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  return NextResponse.json(report);
}
