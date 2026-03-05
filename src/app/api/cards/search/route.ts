import { NextRequest, NextResponse } from "next/server";
import { searchCards } from "@/features/cards/services";
import { rateLimit, RATE_LIMITS } from "@/shared/lib/rate-limit";
import type { GameType } from "@/shared/types";
import type { GameSpecificFilters, SortBy } from "@/features/cards/types";

export async function GET(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const rl = rateLimit(`${ip}:cardSearch`, RATE_LIMITS.cardSearch);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const params = request.nextUrl.searchParams;
  const query = params.get("query") ?? "";
  const gameType = params.get("gameType") as GameType | null;
  const setName = params.get("setName");
  const rarity = params.get("rarity");
  const sortBy = params.get("sortBy") as SortBy | null;
  const page = params.get("page") ? Number(params.get("page")) : 1;
  const pageSize = params.get("pageSize") ? Number(params.get("pageSize")) : 20;

  // Build game-specific filters
  const gameFilters: GameSpecificFilters = {};
  if (params.get("pokemonType")) gameFilters.pokemonType = params.get("pokemonType")!;
  if (params.get("pokemonStage")) gameFilters.pokemonStage = params.get("pokemonStage")!;
  if (params.get("pokemonHpMin")) gameFilters.pokemonHpMin = Number(params.get("pokemonHpMin"));
  if (params.get("pokemonHpMax")) gameFilters.pokemonHpMax = Number(params.get("pokemonHpMax"));
  if (params.get("yugiohCardType")) gameFilters.yugiohCardType = params.get("yugiohCardType")!;
  if (params.get("yugiohAttribute")) gameFilters.yugiohAttribute = params.get("yugiohAttribute")!;
  if (params.get("yugiohLevel")) gameFilters.yugiohLevel = Number(params.get("yugiohLevel"));
  if (params.get("yugiohRace")) gameFilters.yugiohRace = params.get("yugiohRace")!;
  if (params.get("mtgColors")) gameFilters.mtgColors = params.get("mtgColors")!.split(",");
  if (params.get("mtgCmcMin")) gameFilters.mtgCmcMin = Number(params.get("mtgCmcMin"));
  if (params.get("mtgCmcMax")) gameFilters.mtgCmcMax = Number(params.get("mtgCmcMax"));
  if (params.get("mtgTypeLine")) gameFilters.mtgTypeLine = params.get("mtgTypeLine")!;
  if (params.get("onepieceColor")) gameFilters.onepieceColor = params.get("onepieceColor")!;
  if (params.get("onepieceCardType")) gameFilters.onepieceCardType = params.get("onepieceCardType")!;
  if (params.get("onepieceCostMin")) gameFilters.onepieceCostMin = Number(params.get("onepieceCostMin"));
  if (params.get("onepieceCostMax")) gameFilters.onepieceCostMax = Number(params.get("onepieceCostMax"));

  const hasGameFilters = Object.values(gameFilters).some((v) => v !== undefined);

  const result = await searchCards({
    query,
    gameType: gameType ?? undefined,
    setName: setName ?? undefined,
    rarity: rarity ?? undefined,
    sortBy: sortBy ?? undefined,
    page,
    pageSize,
    gameFilters: hasGameFilters ? gameFilters : undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
