"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CardGrid } from "./card-grid";
import { CardSearchFilters } from "./card-search-filters";
import { CardPagination } from "./card-pagination";
import { CardBreadcrumb } from "./card-breadcrumb";
import { CardGridSkeleton } from "./card-grid-skeleton";
import { InfiniteSetGrid } from "./infinite-set-grid";
import { GameTabsClient } from "./game-tabs-client";
import type { CardSearchResult } from "@/features/cards/services";
import type { SetInfo } from "@/features/cards/types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 50;

function createCache<T>() {
  const map = new Map<string, CacheEntry<T>>();
  return {
    get(key: string): T | undefined {
      const entry = map.get(key);
      if (!entry) return undefined;
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        map.delete(key);
        return undefined;
      }
      return entry.data;
    },
    set(key: string, data: T) {
      // Evict oldest entries if over limit
      if (map.size >= MAX_CACHE_ENTRIES) {
        const oldest = map.keys().next().value;
        if (oldest !== undefined) map.delete(oldest);
      }
      map.set(key, { data, timestamp: Date.now() });
    },
  };
}

const searchCache = createCache<CardSearchResult>();
const setsCache = createCache<SetInfo[]>();

/**
 * Sort sets by (gameType, setCode ascending with null-last, setName as tie-break).
 * With 2-digit numeric suffixes (OP-01, OP-02, ..., OP-13, EB-01, PRB-01, ST-01),
 * alphanumeric sort is release-order for One Piece. Other games follow their own
 * conventions but at least the order is deterministic, not random-alphabetical.
 */
function sortSetsByCode(sets: SetInfo[]): SetInfo[] {
  return [...sets].sort((a, b) => {
    if (a.gameType !== b.gameType) return a.gameType.localeCompare(b.gameType);
    const aCode = a.setCode ?? "";
    const bCode = b.setCode ?? "";
    if (aCode && !bCode) return -1;
    if (!aCode && bCode) return 1;
    const byCode = aCode.localeCompare(bCode, undefined, { numeric: true, sensitivity: "base" });
    if (byCode !== 0) return byCode;
    return a.setName.localeCompare(b.setName);
  });
}

export function CardBrowserClient() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<CardSearchResult | null>(null);
  const [sets, setSets] = useState<SetInfo[]>([]);
  const [setNames, setSetNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"search" | "browse">("browse");
  const abortRef = useRef<AbortController | null>(null);

  // Build a stable key from current search params
  const paramsKey = searchParams.toString();

  const rawGameType = searchParams.get("gameType");
  // Default to POKEMON on first visit, "ALL" means user explicitly chose all games
  const gameType = rawGameType === "ALL" ? undefined : (rawGameType ?? "POKEMON");
  const query = searchParams.get("query") ?? undefined;
  const setName = searchParams.get("setName") ?? undefined;
  const rarity = searchParams.get("rarity") ?? undefined;

  // Determine if we're in search mode (filters applied beyond just gameType)
  const hasSearchFilters = Boolean(
    query || setName || rarity ||
    searchParams.get("pokemonType") || searchParams.get("pokemonStage") ||
    searchParams.get("pokemonHpMin") || searchParams.get("pokemonHpMax") ||
    searchParams.get("yugiohCardType") || searchParams.get("yugiohAttribute") ||
    searchParams.get("yugiohLevel") || searchParams.get("yugiohRace") ||
    searchParams.get("mtgColors") || searchParams.get("mtgCmcMin") ||
    searchParams.get("mtgCmcMax") || searchParams.get("mtgTypeLine") ||
    searchParams.get("onepieceColor") || searchParams.get("onepieceCardType") ||
    searchParams.get("onepieceCostMin") || searchParams.get("onepieceCostMax"),
  );

  const fetchData = useCallback(async (signal: AbortSignal) => {
    // Fetch card search results
    const searchUrl = `/api/cards/search?${searchParams.toString()}`;
    const searchCacheKey = searchParams.toString();
    const cachedSearch = searchCache.get(searchCacheKey);
    if (cachedSearch) {
      setData(cachedSearch);
      setMode("search");
      return;
    }

    const res = await fetch(searchUrl, { signal });
    if (signal.aborted) return;
    if (!res.ok) return;
    const json = await res.json() as CardSearchResult;
    searchCache.set(searchCacheKey, json);
    setData(json);
    setMode("search");
  }, [searchParams]);

  // Fetch sets from static JSON (CDN, ~5ms) with API fallback
  const fetchGameSets = useCallback(async (signal: AbortSignal, game: string): Promise<SetInfo[]> => {
    const cacheKey = `sets-${game}`;
    const cached = setsCache.get(cacheKey);
    if (cached) return cached;

    // Try static JSON first (CDN-cached, no DB query)
    try {
      const res = await fetch(`/data/sets-${game}.json`, { signal });
      if (res.ok) {
        const json = await res.json() as SetInfo[];
        setsCache.set(cacheKey, json);
        return json;
      }
    } catch { /* fall through to API */ }

    // Fallback to API route
    const res = await fetch(`/api/cards/sets?gameType=${game}`, { signal });
    if (!res.ok) return [];
    const json = await res.json() as SetInfo[];
    setsCache.set(cacheKey, json);
    return json;
  }, []);

  const fetchSets = useCallback(async (signal: AbortSignal, game?: string) => {
    if (game) {
      const result = await fetchGameSets(signal, game);
      if (signal.aborted) return;
      const sorted = sortSetsByCode(result);
      setSets(sorted);
      setSetNames(sorted.map((s) => s.setName));
    } else {
      // All games — fetch all 4 static files in parallel
      const games = ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"];
      const results = await Promise.all(games.map((g) => fetchGameSets(signal, g)));
      if (signal.aborted) return;
      const allSets = sortSetsByCode(results.flat());
      setsCache.set("sets-all", allSets);
      setSets(allSets);
      setSetNames(allSets.map((s) => s.setName));
    }
  }, [fetchGameSets]);

  useEffect(() => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (hasSearchFilters) {
      // Check search cache first
      const cachedSearch = searchCache.get(paramsKey);
      if (cachedSearch) {
        // Apply cached data + fetch sets via microtask to avoid sync setState in effect
        Promise.resolve().then(() => {
          if (!controller.signal.aborted) {
            setData(cachedSearch);
            setMode("search");
            setLoading(false);
            fetchSets(controller.signal, gameType);
          }
        });
        return;
      }

      Promise.resolve().then(() => {
        if (controller.signal.aborted) return;
        setLoading(true);
        Promise.all([
          fetchData(controller.signal),
          fetchSets(controller.signal, gameType),
        ]).finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      });
    } else {
      // Browse mode — just fetch sets
      const setsKey = `sets-${gameType ?? "all"}`;
      const cachedSets = setsCache.get(setsKey);
      if (cachedSets) {
        Promise.resolve().then(() => {
          if (controller.signal.aborted) return;
          setSets(cachedSets);
          setSetNames(cachedSets.map((s) => s.setName));
          setMode("browse");
          setLoading(false);
        });
        return;
      }

      Promise.resolve().then(() => {
        if (controller.signal.aborted) return;
        setLoading(true);
        setMode("browse");
        fetchSets(controller.signal, gameType).finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      });
    }

    return () => controller.abort();
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Eagerly preload ALL games in parallel on mount (static files are tiny, ~5ms each)
  useEffect(() => {
    const controller = new AbortController();
    const games = ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"];
    games.forEach((game) => {
      if (!setsCache.get(`sets-${game}`)) {
        fetchGameSets(controller.signal, game).catch(() => { /* swallow */ });
      }
    });
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <GameTabsClient activeGame={gameType} />

      <CardBreadcrumb gameType={gameType} setName={setName} />

      <CardSearchFilters sets={setNames} gameType={gameType} />

      {loading ? (
        <>
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          </div>
          <CardGridSkeleton />
        </>
      ) : mode === "search" && data ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.total} card{data.total !== 1 ? "s" : ""} found
            </p>
          </div>
          <CardGrid cards={data.cards} />
          <CardPagination page={data.page} totalPages={data.totalPages} />
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Browse {sets.reduce((sum, s) => sum + s.cardCount, 0).toLocaleString()} cards across {sets.length} sets.
          </p>
          <InfiniteSetGrid sets={sets} groupByGame={!gameType} />
        </>
      )}
    </>
  );
}
