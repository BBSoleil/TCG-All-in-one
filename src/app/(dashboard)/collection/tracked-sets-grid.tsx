import Link from "next/link";
import type { TrackedSet } from "@/features/cards/services/tracked-sets";
import { GAME_LABELS } from "@/shared/types";
import { GAME_BADGE_CLASSES, GAME_BORDER_COLORS } from "@/shared/constants";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/shared/lib/format";

export function TrackedSetsGrid({ sets }: { sets: TrackedSet[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sets.map((set) => (
        <Link
          key={`${set.gameType}-${set.setName}`}
          href={`/sets/${set.gameType}/${encodeURIComponent(set.setName)}`}
          className={`group rounded-lg border ${
            GAME_BORDER_COLORS[set.gameType] ?? "border-border"
          } bg-card p-4 transition-colors hover:border-primary/50`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium group-hover:text-primary"
                title={set.setName}
              >
                {set.setName}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                {set.setCode && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {set.setCode}
                  </span>
                )}
                <Badge
                  variant="secondary"
                  className={`text-xs ${GAME_BADGE_CLASSES[set.gameType] ?? ""}`}
                >
                  {GAME_LABELS[set.gameType]}
                </Badge>
              </div>
            </div>
            <span className="text-xl font-bold text-primary">
              {set.completionPct}%
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${set.completionPct}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {set.uniqueOwned} / {set.totalCards} cards
            </span>
            {set.ownedValue > 0 && (
              <span className="font-medium text-foreground">
                {formatPrice(set.ownedValue)}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
