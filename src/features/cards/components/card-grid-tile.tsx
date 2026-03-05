"use client";

import { memo, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GAME_LABELS } from "@/shared/types";
import { quickAddToWishlist } from "@/features/wishlist/actions/quick-add";
import { AddToCollectionPopover } from "./add-to-collection-popover";
import { QuickSellPopover } from "./quick-sell-popover";
import { GAME_COLORS } from "@/shared/constants";
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
    <div className="group relative rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-primary/50">
      <Link href={`/cards/${card.id}`}>
        {card.imageUrl ? (
          <div className="relative aspect-[2.5/3.5] bg-muted">
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[2.5/3.5] items-center justify-center bg-muted">
            <div className="text-center">
              <div
                className={`mx-auto mb-2 h-1.5 w-8 rounded-full ${GAME_COLORS[card.gameType] ?? "bg-gray-500"}`}
              />
              <span className="text-xs text-muted-foreground">No image</span>
            </div>
          </div>
        )}
        <div className="p-3">
          <p className="truncate text-sm font-medium group-hover:text-primary" title={card.name}>
            {card.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="text-xs">
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

      {/* Hover overlay with quick actions */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-[2.5/3.5] items-end justify-center gap-1.5 bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
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
            onClick={(e) => e.preventDefault()}
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
            onClick={(e) => e.preventDefault()}
            title="List for sale"
            aria-label="List for sale"
          >
            $
          </Button>
        </QuickSellPopover>
      </div>
    </div>
  );
});
