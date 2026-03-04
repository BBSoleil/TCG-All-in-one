import Link from "next/link";
import { GAME_LABELS } from "@/shared/types";
import type { GameType } from "@/shared/types";

export function CardBreadcrumb({
  gameType,
  setName,
}: {
  gameType?: string;
  setName?: string;
}) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/cards" className="hover:text-foreground">
        All Games
      </Link>
      {gameType && (
        <>
          <span>/</span>
          <Link
            href={`/cards?gameType=${gameType}`}
            className="hover:text-foreground"
          >
            {GAME_LABELS[gameType as GameType] ?? gameType}
          </Link>
        </>
      )}
      {setName && (
        <>
          <span>/</span>
          <span className="truncate text-foreground">{setName}</span>
        </>
      )}
    </nav>
  );
}
