"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CardGrid } from "./card-grid";
import { CardSearchFilters } from "./card-search-filters";
import { CardPagination } from "./card-pagination";
import { CardBreadcrumb } from "./card-breadcrumb";
import { CardGridSkeleton } from "./card-grid-skeleton";
import { SetGrid } from "./set-grid";
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

  const gameType = searchParams.get("gameType") ?? undefined;
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

  const fetchSets = useCallback(async (signal: AbortSignal, game?: string) => {
    const cacheKey = `sets-${game ?? "all"}`;
    const cached = setsCache.get(cacheKey);
    if (cached) {
      setSets(cached);
      setSetNames(cached.map((s) => s.setName));
      return;
    }

    const url = game ? `/api/cards/sets?gameType=${game}` : "/api/cards/sets";
    const res = await fetch(url, { signal });
    if (signal.aborted) return;
    if (!res.ok) return;
    const json = await res.json() as SetInfo[];
    setsCache.set(cacheKey, json);
    setSets(json);
    setSetNames(json.map((s) => s.setName));
  }, []);

  useEffect(() => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (hasSearchFilters) {
      // Check search cache first (synchronous)
      const cachedSearch = searchCache.get(paramsKey);
      if (cachedSearch) {
        setData(cachedSearch);
        setMode("search");
        setLoading(false);
        // Still fetch sets in background
        fetchSets(controller.signal, gameType);
        return;
      }

      setLoading(true);
      Promise.all([
        fetchData(controller.signal),
        fetchSets(controller.signal, gameType),
      ]).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    } else {
      // Browse mode — just fetch sets
      const setsKey = `sets-${gameType ?? "all"}`;
      const cachedSets = setsCache.get(setsKey);
      if (cachedSets) {
        setSets(cachedSets);
        setSetNames(cachedSets.map((s) => s.setName));
        setMode("browse");
        setLoading(false);
        return;
      }

      setLoading(true);
      setMode("browse");
      fetchSets(controller.signal, gameType).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    }

    return () => controller.abort();
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefetch sets for other game tabs on idle (staggered to avoid burst DB load)
  useEffect(() => {
    const games = ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"];
    const timers: ReturnType<typeof setTimeout>[] = [];

    const prefetch = () => {
      const toPrefetch = games.filter((g) => g !== gameType && !setsCache.get(`sets-${g}`));
      toPrefetch.forEach((game, i) => {
        const timer = setTimeout(() => {
          fetch(`/api/cards/sets?gameType=${game}`)
            .then((res) => res.ok ? res.json() as Promise<SetInfo[]> : null)
            .then((json) => { if (json) setsCache.set(`sets-${game}`, json); })
            .catch(() => { /* swallow prefetch errors */ });
        }, i * 500);
        timers.push(timer);
      });
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(prefetch);
      return () => { cancelIdleCallback(id); timers.forEach(clearTimeout); };
    }
    const id = setTimeout(prefetch, 2000);
    return () => { clearTimeout(id); timers.forEach(clearTimeout); };
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
          <SetGrid sets={sets} groupByGame={!gameType} />
        </>
      )}
    </>
  );
}
