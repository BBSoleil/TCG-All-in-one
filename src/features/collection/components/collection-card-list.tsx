"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { removeCard } from "@/features/collection/actions/remove-card";
import { toggleCardFlags } from "@/features/collection/actions/toggle-flags";
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
    try {
      const result = await removeCard(id, collectionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Card removed");
        if (onCardRemoved) {
          onCardRemoved();
        } else {
          router.refresh();
        }
      }
    } catch {
      toast.error("Failed to remove card");
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((entry) => (
        <CollectionCardItem
          key={entry.id}
          entry={entry}
          collectionId={collectionId}
          onRemove={handleRemove}
          onFlagsChanged={onCardRemoved}
        />
      ))}
    </div>
  );
}

function CollectionCardItem({
  entry,
  collectionId,
  onRemove,
  onFlagsChanged,
}: {
  entry: CollectionCardWithDetails;
  collectionId: string;
  onRemove: (id: string) => void;
  onFlagsChanged?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(flag: "forSale" | "forTrade") {
    startTransition(async () => {
      try {
        const newValue = flag === "forSale" ? !entry.forSale : !entry.forTrade;
        const result = await toggleCardFlags(entry.id, collectionId, { [flag]: newValue });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(flag === "forSale" ? (newValue ? "Marked for sale" : "Unmarked for sale") : (newValue ? "Marked for trade" : "Unmarked for trade"));
          onFlagsChanged?.();
        }
      } catch {
        toast.error("Failed to update");
      }
    });
  }

  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden">
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
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Badge variant="outline" className="text-[10px]">{entry.language}</Badge>
          {entry.foil && (
            <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-400">
              ✦ Foil
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Qty: {entry.quantity}</span>
          <span>{entry.condition}</span>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <Button
            variant={entry.forSale ? "default" : "outline"}
            size="xs"
            className="flex-1 text-[10px]"
            disabled={isPending}
            onClick={() => handleToggle("forSale")}
          >
            {entry.forSale ? "✓ For Sale" : "For Sale"}
          </Button>
          <Button
            variant={entry.forTrade ? "default" : "outline"}
            size="xs"
            className="flex-1 text-[10px]"
            disabled={isPending}
            onClick={() => handleToggle("forTrade")}
          >
            {entry.forTrade ? "✓ For Trade" : "For Trade"}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="mt-1 w-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(entry.id)}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
