"use client";

import { useRouter } from "next/navigation";
import { removeCard } from "@/features/collection/actions/remove-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, CardImage } from "@/shared/components";
import type { CollectionCardWithDetails } from "@/features/collection/services";

export function CollectionCardList({
  cards,
  collectionId,
  onCardRemoved,
}: {
  cards: CollectionCardWithDetails[];
  collectionId: string;
  onCardRemoved?: () => void;
}) {
  const router = useRouter();

  if (cards.length === 0) {
    return (
      <EmptyState
        title="No cards yet"
        description="Browse the card database to add cards to this collection."
        action={{ label: "Browse cards", href: "/cards" }}
      />
    );
  }

  async function handleRemove(id: string) {
    const result = await removeCard(id, collectionId);
    if (!result.error) {
      if (onCardRemoved) {
        onCardRemoved();
      } else {
        router.refresh();
      }
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((entry) => (
        <div
          key={entry.id}
          className="group rounded-lg border border-border bg-card overflow-hidden"
        >
          <CardImage
            src={entry.card.imageUrl}
            alt={entry.card.name}
            gameType={entry.card.gameType}
            rarity={entry.card.rarity}
            size="large"
          />
          <div className="p-3">
            <p className="truncate text-sm font-medium" title={entry.card.name}>{entry.card.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {entry.card.setName && (
                <span className="text-xs text-muted-foreground">
                  {entry.card.setName}
                </span>
              )}
              {entry.card.rarity && (
                <Badge variant="outline" className="text-xs">
                  {entry.card.rarity}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Qty: {entry.quantity}</span>
              {entry.condition && <span>{entry.condition}</span>}
            </div>
            <Button
              variant="ghost"
              size="xs"
              className="mt-2 w-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemove(entry.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
