"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GAME_LABELS } from "@/shared/types";
import type { GameType } from "@/shared/types";
import { GAME_BORDER_COLORS, GAME_BADGE_CLASSES } from "@/shared/constants";
import type { SetInfo } from "@/features/cards/types";

const BATCH_SIZE = 24;

export function InfiniteSetGrid({
  sets,
  groupByGame,
}: {
  sets: SetInfo[];
  groupByGame?: boolean;
}) {
  if (sets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">No sets found.</p>
      </div>
    );
  }

  if (groupByGame) {
    return <GroupedInfiniteGrid sets={sets} />;
  }

  return <FlatInfiniteGrid sets={sets} />;
}

function FlatInfiniteGrid({ sets }: { sets: SetInfo[] }) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when sets change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [sets]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, sets.length));
  }, [sets.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const visible = sets.slice(0, visibleCount);
  const hasMore = visibleCount < sets.length;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((set) => (
          <SetCard key={`${set.gameType}-${set.setName}`} set={set} />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <p className="text-sm text-muted-foreground">
            Showing {visible.length} of {sets.length} sets...
          </p>
        </div>
      )}
    </>
  );
}

function GroupedInfiniteGrid({ sets }: { sets: SetInfo[] }) {
  const grouped = new Map<GameType, SetInfo[]>();
  for (const set of sets) {
    const existing = grouped.get(set.gameType) ?? [];
    existing.push(set);
    grouped.set(set.gameType, existing);
  }

  return (
    <div className="space-y-8">
      {(["POKEMON", "YUGIOH", "MTG", "ONEPIECE"] as GameType[]).map((game) => {
        const gameSets = grouped.get(game);
        if (!gameSets || gameSets.length === 0) return null;
        return (
          <div key={game}>
            <h2 className="mb-3 text-lg font-semibold">
              {GAME_LABELS[game]}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {gameSets.length} sets
              </span>
            </h2>
            <FlatInfiniteGrid sets={gameSets} />
          </div>
        );
      })}
    </div>
  );
}

function SetCard({ set }: { set: SetInfo }) {
  return (
    <Link
      href={`/cards?gameType=${set.gameType}&setName=${encodeURIComponent(set.setName)}`}
      className={`group rounded-lg border ${GAME_BORDER_COLORS[set.gameType] ?? "border-border"} bg-card p-4 transition-colors hover:border-primary/50`}
    >
      <p className="truncate text-sm font-medium group-hover:text-primary" title={set.setName}>
        {set.setName}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <Badge variant="secondary" className={`text-xs ${GAME_BADGE_CLASSES[set.gameType] ?? ""}`}>
          {GAME_LABELS[set.gameType] ?? set.gameType}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {set.cardCount} cards
        </span>
      </div>
      {set.setCode && (
        <p className="mt-1 text-xs text-muted-foreground">{set.setCode}</p>
      )}
    </Link>
  );
}
