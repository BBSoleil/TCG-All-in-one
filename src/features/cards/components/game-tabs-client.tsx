"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { GAME_LABELS } from "@/shared/types";
import type { GameType } from "@/shared/types";
import { GAME_COLORS } from "@/shared/constants";

const GAME_TAB_HOVER: Record<GameType, string> = {
  POKEMON: "hover:bg-yellow-400",
  YUGIOH: "hover:bg-purple-500",
  MTG: "hover:bg-red-500",
  ONEPIECE: "hover:bg-blue-500",
};

export function GameTabsClient({ activeGame }: { activeGame?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const switchGame = useCallback(
    (game?: string) => {
      const params = new URLSearchParams();
      if (game) params.set("gameType", game);
      // Preserve query if present
      const query = searchParams.get("query");
      if (query) params.set("query", query);
      startTransition(() => {
        router.replace(`/cards?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  return (
    <div className={`flex flex-wrap gap-2 ${isPending ? "opacity-70" : ""}`}>
      <button
        type="button"
        onClick={() => switchGame()}
        className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          !activeGame
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        All Games
      </button>
      {(Object.entries(GAME_LABELS) as [GameType, string][]).map(([key, label]) => (
        <button
          type="button"
          key={key}
          onClick={() => switchGame(key)}
          className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeGame === key
              ? `${GAME_COLORS[key]} ${GAME_TAB_HOVER[key]} text-white`
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
