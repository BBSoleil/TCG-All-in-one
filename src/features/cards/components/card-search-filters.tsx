"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const GAME_FILTERS = {
  POKEMON: dynamic(() => import("./pokemon-filters").then((m) => ({ default: m.PokemonFilters }))),
  YUGIOH: dynamic(() => import("./yugioh-filters").then((m) => ({ default: m.YugiohFilters }))),
  MTG: dynamic(() => import("./mtg-filters").then((m) => ({ default: m.MtgFilters }))),
  ONEPIECE: dynamic(() => import("./onepiece-filters").then((m) => ({ default: m.OnepieceFilters }))),
} as const;

const RARITIES = [
  { value: "all", label: "All rarities" },
  { value: "COMMON", label: "Common" },
  { value: "UNCOMMON", label: "Uncommon" },
  { value: "RARE", label: "Rare" },
  { value: "SUPER_RARE", label: "Super Rare" },
  { value: "ULTRA_RARE", label: "Ultra Rare" },
  { value: "SECRET_RARE", label: "Secret Rare" },
  { value: "SPECIAL", label: "Special" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name A-Z" },
  { value: "price_desc", label: "Price High-Low" },
  { value: "price_asc", label: "Price Low-High" },
  { value: "newest", label: "Newest" },
];

export function CardSearchFilters({
  sets,
  gameType,
}: {
  sets?: string[];
  gameType?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/cards?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const query = formData.get("query") as string;
      updateParams("query", query);
    },
    [updateParams],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    const gt = searchParams.get("gameType");
    if (gt) params.set("gameType", gt);
    startTransition(() => {
      router.push(`/cards?${params.toString()}`);
    });
  }, [router, searchParams]);

  const hasFilters =
    searchParams.get("query") ||
    searchParams.get("rarity") ||
    searchParams.get("setName") ||
    searchParams.get("sortBy");

  return (
    <div className={`space-y-3 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <Input
            name="query"
            placeholder="Search cards..."
            defaultValue={searchParams.get("query") ?? ""}
            className="min-w-0 flex-1 sm:max-w-sm"
            aria-label="Search cards by name"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {sets && sets.length > 0 && (
            <Select
              defaultValue={searchParams.get("setName") ?? "all"}
              onValueChange={(value) => updateParams("setName", value)}
            >
              <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by set">
                <SelectValue placeholder="All sets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sets</SelectItem>
                {sets.map((set) => (
                  <SelectItem key={set} value={set}>
                    {set}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            defaultValue={searchParams.get("rarity") ?? "all"}
            onValueChange={(value) => updateParams("rarity", value)}
          >
            <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by rarity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RARITIES.map((rarity) => (
                <SelectItem key={rarity.value} value={rarity.value}>
                  {rarity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            defaultValue={searchParams.get("sortBy") ?? "name"}
            onValueChange={(value) => updateParams("sortBy", value)}
          >
            <SelectTrigger className="w-full sm:w-[160px]" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {gameType && gameType in GAME_FILTERS && (() => {
        const FilterComponent = GAME_FILTERS[gameType as keyof typeof GAME_FILTERS];
        return <FilterComponent />;
      })()}
    </div>
  );
}
