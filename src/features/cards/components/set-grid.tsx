import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GAME_LABELS } from "@/shared/types";
import type { GameType } from "@/shared/types";
import { GAME_BORDER_COLORS } from "@/shared/constants";
import type { SetInfo } from "@/features/cards/types";

export function SetGrid({
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
              <SetGridInner sets={gameSets} />
            </div>
          );
        })}
      </div>
    );
  }

  return <SetGridInner sets={sets} />;
}

function SetGridInner({ sets }: { sets: SetInfo[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {sets.map((set) => (
        <Link
          key={`${set.gameType}-${set.setName}`}
          href={`/cards?gameType=${set.gameType}&setName=${encodeURIComponent(set.setName)}`}
          className={`group rounded-lg border ${GAME_BORDER_COLORS[set.gameType] ?? "border-border"} bg-card p-4 transition-colors hover:border-primary/50`}
        >
          <p className="truncate text-sm font-medium group-hover:text-primary" title={set.setName}>
            {set.setName}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
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
      ))}
    </div>
  );
}
