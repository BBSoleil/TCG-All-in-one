"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GAME_LABELS } from "@/shared/types";
import { GAME_BADGE_CLASSES } from "@/shared/constants";
import { formatPrice } from "@/shared/lib/format";
import { CollectionCardList } from "./collection-card-list";
import { ExportCSVButton } from "./export-csv-button";
import { ImportCSVButton } from "./import-csv-button";
import { CollectionVisibilityToggle } from "@/features/social/components";
import type { CollectionCardWithDetails } from "@/features/collection/services";

interface CollectionDetailData {
  collection: {
    id: string;
    name: string;
    gameType: string;
    isPublic: boolean;
    _count: { cards: number };
  };
  cards: CollectionCardWithDetails[];
  total: number;
  page: number;
  totalPages: number;
  collectionValue: number;
  completion: { setName: string; owned: number; total: number }[];
}

// Simple in-memory cache
const cache = new Map<string, { data: CollectionDetailData; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds

function getCached(key: string): CollectionDetailData | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: CollectionDetailData) {
  cache.set(key, { data, ts: Date.now() });
}

export function invalidateCollectionCache(collectionId: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(`collection:${collectionId}`)) {
      cache.delete(key);
    }
  }
}

export function CollectionDetailClient({
  id,
  AddCardDialog,
}: {
  id: string;
  AddCardDialog: React.ComponentType<{ collectionId: string; gameType: string; onCardAdded?: () => void }>;
}) {
  const [data, setData] = useState<CollectionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const fetchRef = useRef(0);

  const fetchData = useCallback(async (targetPage: number, skipCache = false) => {
    const cacheKey = `collection:${id}:page:${targetPage}`;

    if (!skipCache) {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    const fetchId = ++fetchRef.current;
    setLoading(true);

    try {
      const res = await fetch(`/api/collection/${id}?page=${targetPage}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json() as CollectionDetailData;

      // Only update if this is still the latest fetch
      if (fetchId === fetchRef.current) {
        setData(json);
        setCache(cacheKey, json);
        setLoading(false);
      }
    } catch {
      if (fetchId === fetchRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  // Expose refetch for child components (e.g., after add/remove card)
  const refetch = useCallback(() => {
    invalidateCollectionCache(id);
    fetchData(page, true);
  }, [id, page, fetchData]);

  if (loading && !data) {
    return <CollectionDetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Collection not found.
      </div>
    );
  }

  const { collection, cards, total, totalPages, collectionValue, completion } = data;

  // Client-side filters
  const [filterLang, setFilterLang] = useState<string>("");
  const [filterCondition, setFilterCondition] = useState<string>("");
  const [filterFoil, setFilterFoil] = useState<string>("");
  const [filterForSale, setFilterForSale] = useState(false);
  const [filterForTrade, setFilterForTrade] = useState(false);

  const hasActiveFilters = filterLang || filterCondition || filterFoil || filterForSale || filterForTrade;

  const filteredCards = useMemo(() => {
    if (!hasActiveFilters) return cards;
    return cards.filter((c) => {
      if (filterLang && c.language !== filterLang) return false;
      if (filterCondition && c.condition !== filterCondition) return false;
      if (filterFoil === "yes" && !c.foil) return false;
      if (filterFoil === "no" && c.foil) return false;
      if (filterForSale && !c.forSale) return false;
      if (filterForTrade && !c.forTrade) return false;
      return true;
    });
  }, [cards, filterLang, filterCondition, filterFoil, filterForSale, filterForTrade, hasActiveFilters]);

  // Derive unique values from current page cards for dropdown options
  const languages = useMemo(() => [...new Set(cards.map((c) => c.language))].sort(), [cards]);
  const conditions = useMemo(() => [...new Set(cards.map((c) => c.condition))].sort(), [cards]);

  function clearFilters() {
    setFilterLang("");
    setFilterCondition("");
    setFilterFoil("");
    setFilterForSale(false);
    setFilterForTrade(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/collection">
          <Button variant="ghost" size="sm">
            &larr; Back
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {collection.name}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className={GAME_BADGE_CLASSES[collection.gameType] ?? ""}>
              {GAME_LABELS[collection.gameType as keyof typeof GAME_LABELS] ?? collection.gameType}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {collection._count.cards} card{collection._count.cards !== 1 ? "s" : ""}
            </span>
            {collectionValue > 0 && (
              <span className="text-sm font-medium">
                {formatPrice(collectionValue)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportCSVButton collectionId={id} onImported={refetch} />
          <ExportCSVButton collectionId={id} />
          <CollectionVisibilityToggle
            collectionId={id}
            isPublic={collection.isPublic}
          />
          <AddCardDialog
            collectionId={id}
            gameType={collection.gameType}
            onCardAdded={refetch}
          />
        </div>
      </div>

      {completion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Set Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completion.map((set) => {
                const pct = set.total > 0 ? Math.round((set.owned / set.total) * 100) : 0;
                return (
                  <div key={set.setName}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{set.setName}</span>
                      <span className="text-muted-foreground">
                        {set.owned}/{set.total} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <select
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="">All Languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          value={filterCondition}
          onChange={(e) => setFilterCondition(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="">All Conditions</option>
          {conditions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterFoil}
          onChange={(e) => setFilterFoil(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="">All (Foil/Non-foil)</option>
          <option value="yes">Foil only</option>
          <option value="no">Non-foil only</option>
        </select>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={filterForSale}
            onChange={(e) => setFilterForSale(e.target.checked)}
            className="rounded"
          />
          For Sale
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={filterForTrade}
            onChange={(e) => setFilterForTrade(e.target.checked)}
            className="rounded"
          />
          For Trade
        </label>
        {hasActiveFilters && (
          <Button variant="ghost" size="xs" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
        {hasActiveFilters && (
          <span className="text-xs text-muted-foreground">
            {filteredCards.length} of {cards.length} on this page
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : (
        <CollectionCardList
          cards={filteredCards}
          collectionId={id}
          onCardRemoved={refetch}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)}>
              &larr; Previous
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} cards)
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)}>
              Next &rarr;
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function CollectionDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-16" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      <div className="rounded-lg border p-6 space-y-3">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
