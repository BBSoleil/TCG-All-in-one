import Link from "next/link";
import { CardImage } from "@/shared/components";
import { GAME_LABELS } from "@/shared/types";
import { GAME_BADGE_CLASSES } from "@/shared/constants";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/shared/lib/format";
import type { TopCard } from "../types";

interface TopCardsTableProps {
  cards: TopCard[];
}

export function TopCardsTable({ cards }: TopCardsTableProps) {
  if (cards.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No priced cards in your collection yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {cards.map((card, i) => (
        <Link
          key={card.id}
          href={`/cards/${card.id}`}
          className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
        >
          <span className="w-6 text-sm font-bold text-muted-foreground">
            #{i + 1}
          </span>
          <CardImage
            src={card.imageUrl}
            alt={card.name}
            gameType={card.gameType}
            size="thumb"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" title={card.name}>{card.name}</p>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className={`text-[10px] px-1 py-0 ${GAME_BADGE_CLASSES[card.gameType] ?? ""}`}>
                {GAME_LABELS[card.gameType as keyof typeof GAME_LABELS] ?? card.gameType}
              </Badge>
              {card.setName && (
                <span className="truncate text-xs text-muted-foreground" title={card.setName}>
                  {card.setName}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold">{formatPrice(card.totalValue)}</p>
            <p className="text-xs text-muted-foreground">
              {card.quantity}x @ {formatPrice(card.marketPrice)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
