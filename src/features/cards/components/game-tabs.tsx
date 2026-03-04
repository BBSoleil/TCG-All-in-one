import Link from "next/link";
import { GAME_LABELS } from "@/shared/types";
import type { GameType } from "@/shared/types";

const GAME_TAB_ACTIVE_COLORS: Record<GameType, string> = {
  POKEMON: "bg-yellow-500 hover:bg-yellow-400",
  YUGIOH: "bg-purple-600 hover:bg-purple-500",
  MTG: "bg-red-600 hover:bg-red-500",
  ONEPIECE: "bg-blue-600 hover:bg-blue-500",
};

export function GameTabs({ activeGame }: { activeGame?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/cards"
        className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          !activeGame
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        All Games
      </Link>
      {(Object.entries(GAME_LABELS) as [GameType, string][]).map(([key, label]) => (
        <Link
          key={key}
          href={`/cards?gameType=${key}`}
          className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeGame === key
              ? `${GAME_TAB_ACTIVE_COLORS[key]} text-white`
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
