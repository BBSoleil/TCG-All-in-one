"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { removeCardFromDeckAction } from "../actions";
import type { DeckCardWithDetails } from "../types";

export function DeckCardList({
  cards,
  isOwner,
}: {
  cards: DeckCardWithDetails[];
  isOwner: boolean;
}) {
  const mainCards = cards.filter((c) => !c.isSideboard);
  const sideboardCards = cards.filter((c) => c.isSideboard);
  const mainTotal = mainCards.reduce((s, c) => s + c.quantity, 0);
  const sideTotal = sideboardCards.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Main Deck ({mainTotal})</CardTitle>
        </CardHeader>
        <CardContent>
          {mainCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No cards in main deck yet.
            </p>
          ) : (
            <div className="space-y-1">
              {mainCards.map((dc) => (
                <DeckCardRow key={dc.id} deckCard={dc} isOwner={isOwner} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(sideboardCards.length > 0 || isOwner) && (
        <Card>
          <CardHeader>
            <CardTitle>Sideboard ({sideTotal})</CardTitle>
          </CardHeader>
          <CardContent>
            {sideboardCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sideboard cards.
              </p>
            ) : (
              <div className="space-y-1">
                {sideboardCards.map((dc) => (
                  <DeckCardRow key={dc.id} deckCard={dc} isOwner={isOwner} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DeckCardRow({
  deckCard,
  isOwner,
}: {
  deckCard: DeckCardWithDetails;
  isOwner: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      await removeCardFromDeckAction(deckCard.id);
    });
  }

  return (
    <div className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/50">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-6 text-center text-sm font-medium text-muted-foreground">
          {deckCard.quantity}x
        </span>
        <span className="truncate text-sm" title={deckCard.card.name}>{deckCard.card.name}</span>
        {deckCard.card.setName && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            ({deckCard.card.setName})
          </span>
        )}
      </div>
      {isOwner && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isPending}
          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
        >
          {isPending ? "..." : "Remove"}
        </Button>
      )}
    </div>
  );
}
