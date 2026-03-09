import { NextRequest, NextResponse } from "next/server";
import { getSetsForGame } from "@/features/cards/services";
import type { GameType } from "@/shared/types";

export async function GET(request: NextRequest) {
  const gameType = request.nextUrl.searchParams.get("gameType") as GameType | null;

  const result = await getSetsForGame(gameType ?? undefined);

  if (!result.success) {
    return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 });
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
