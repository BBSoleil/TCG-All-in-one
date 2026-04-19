"use client";

import { memo, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GAME_LABELS } from "@/shared/types";
import { quickAddToWishlist } from "@/features/wishlist/actions/quick-add";
import { AddToCollectionPopover } from "./add-to-collection-popover";
import { QuickSellPopover } from "./quick-sell-popover";
import { GAME_BADGE_CLASSES } from "@/shared/constants";
import { CardImage } from "@/shared/components";
import { formatPrice } from "@/shared/lib/format";
import type { CardListItem } from "@/features/cards/types";

export const CardGridTile = memo(function CardGridTile({ card }: { card: CardListItem }) {
  const [isPending, startTransition] = useTransition();

  function handleWishlist(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    startTransition(() => {
      quickAddToWishlist(card.id);
    });
  }

  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-primary/50">
      <div className="relative">
        <Link href={`/cards/${card.id}`}>
          <CardImage
            src={card.imageUrl}
            alt={card.name}
            gameType={card.gameType}
            rarity={card.rarity}
            size="large"
          />
        </Link>

        {/* Hover overlay with quick actions */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-1.5 bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 rounded-full p-0 text-xs"
            onClick={handleWishlist}
            disabled={isPending}
            title="Add to wishlist"
            aria-label="Add to wishlist"
          >
            {isPending ? "..." : "\u2661"}
          </Button>

          <AddToCollectionPopover cardId={card.id}>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 rounded-full p-0 text-xs"
              title="Add to collection"
              aria-label="Add to collection"
            >
              +
            </Button>
          </AddToCollectionPopover>

          <QuickSellPopover cardId={card.id}>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 rounded-full p-0 text-xs"
              title="List for sale"
              aria-label="List for sale"
            >
              $
            </Button>
          </QuickSellPopover>
        </div>
      </div>

      <Link href={`/cards/${card.id}`}>
        <div className="p-3">
          <p className="truncate text-sm font-medium group-hover:text-primary" title={card.name}>
            {card.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className={`text-xs ${GAME_BADGE_CLASSES[card.gameType] ?? ""}`}>
              {GAME_LABELS[card.gameType] ?? card.gameType}
            </Badge>
            {card.rarity && (
              <Badge variant="outline" className="text-xs">
                {card.rarity}
              </Badge>
            )}
          </div>
          {card.setName && (
            <p className="mt-1 truncate text-xs text-muted-foreground" title={card.setName}>
              {card.setName}
            </p>
          )}
          {card.marketPrice !== null && (
            <p className="mt-1 text-sm font-medium">
              {formatPrice(card.marketPrice)}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
});
