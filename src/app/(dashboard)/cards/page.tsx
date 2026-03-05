import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { searchCards, getSetsForGame } from "@/features/cards/services";
import { CardBrowserClient } from "@/features/cards/components";
import { Button } from "@/components/ui/button";
import type { GameType } from "@/shared/types";
import type { GameSpecificFilters, SortBy } from "@/features/cards/types";
import dynamic from "next/dynamic";

const SavedSearchesWrapper = dynamic(
  () => import("@/features/cards/components/saved-searches-wrapper").then((m) => ({ default: m.SavedSearchesWrapper })),
);

export const metadata: Metadata = {
  title: "Card Browser | TCG All-in-One",
  description: "Browse and search 90,000+ cards across Pokemon, Yu-Gi-Oh!, Magic: The Gathering, and One Piece.",
};

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.query === "string" ? params.query : "";
  const gameType = typeof params.gameType === "string" ? (params.gameType as GameType) : undefined;
  const setName = typeof params.setName === "string" ? params.setName : undefined;
  const rarity = typeof params.rarity === "string" ? params.rarity : undefined;
  const sortBy = typeof params.sortBy === "string" ? (params.sortBy as SortBy) : undefined;
  const page = typeof params.page === "string" ? Number(params.page) : 1;

  // Build game-specific filters from URL params
  const gameFilters: GameSpecificFilters = {};
  if (typeof params.pokemonType === "string") gameFilters.pokemonType = params.pokemonType;
  if (typeof params.pokemonStage === "string") gameFilters.pokemonStage = params.pokemonStage;
  if (typeof params.pokemonHpMin === "string") gameFilters.pokemonHpMin = Number(params.pokemonHpMin);
  if (typeof params.pokemonHpMax === "string") gameFilters.pokemonHpMax = Number(params.pokemonHpMax);
  if (typeof params.yugiohCardType === "string") gameFilters.yugiohCardType = params.yugiohCardType;
  if (typeof params.yugiohAttribute === "string") gameFilters.yugiohAttribute = params.yugiohAttribute;
  if (typeof params.yugiohLevel === "string") gameFilters.yugiohLevel = Number(params.yugiohLevel);
  if (typeof params.yugiohRace === "string") gameFilters.yugiohRace = params.yugiohRace;
  if (typeof params.mtgColors === "string") gameFilters.mtgColors = params.mtgColors.split(",");
  if (typeof params.mtgCmcMin === "string") gameFilters.mtgCmcMin = Number(params.mtgCmcMin);
  if (typeof params.mtgCmcMax === "string") gameFilters.mtgCmcMax = Number(params.mtgCmcMax);
  if (typeof params.mtgTypeLine === "string") gameFilters.mtgTypeLine = params.mtgTypeLine;
  if (typeof params.onepieceColor === "string") gameFilters.onepieceColor = params.onepieceColor;
  if (typeof params.onepieceCardType === "string") gameFilters.onepieceCardType = params.onepieceCardType;
  if (typeof params.onepieceCostMin === "string") gameFilters.onepieceCostMin = Number(params.onepieceCostMin);
  if (typeof params.onepieceCostMax === "string") gameFilters.onepieceCostMax = Number(params.onepieceCostMax);

  const hasGameFilters = Object.values(gameFilters).some((v) => v !== undefined);
  const showCardList = Boolean(query || setName || rarity || hasGameFilters);

  // Fetch initial data server-side for SSR/SEO
  const setsResult = await getSetsForGame(gameType);
  const sets = setsResult.success ? setsResult.data : [];
  const setNamesList = sets.map((s) => s.setName);

  let initialData = null;
  if (showCardList) {
    const result = await searchCards({
      query,
      gameType,
      setName,
      rarity,
      sortBy,
      page,
      pageSize: 20,
      gameFilters: hasGameFilters ? gameFilters : undefined,
    });
    initialData = result.success ? result.data : null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Card Browser</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Search and browse cards across all supported games.
          </p>
        </div>
        <Link href="/cards/import" className="shrink-0">
          <Button variant="outline" className="w-full sm:w-auto">Import cards</Button>
        </Link>
      </div>

      <Suspense>
        <SavedSearchesWrapper />
      </Suspense>

      <Suspense>
        <CardBrowserClient
          initialData={initialData}
          initialSets={sets}
          initialSetNames={setNamesList}
          initialMode={showCardList ? "search" : "browse"}
        />
      </Suspense>
    </div>
  );
}
