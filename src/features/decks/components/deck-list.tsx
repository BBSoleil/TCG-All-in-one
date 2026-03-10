"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { GAME_LABELS } from "@/shared/types";
import { GAME_BADGE_CLASSES } from "@/shared/constants";
import { ConfirmDialog, EmptyState } from "@/shared/components";
import { deleteDeckAction } from "../actions";
import type { Deck } from "../types";

export function DeckList({ decks }: { decks: Deck[] }) {
  if (decks.length === 0) {
    return (
      <EmptyState
        title="No decks yet"
        description="Create your first deck to get started."
      />
    );
  }

  return (
    <div className="space-y-3">
      {decks.map((deck) => (
        <DeckRow key={deck.id} deck={deck} />
      ))}
    </div>
  );
}

function DeckRow({ deck }: { deck: Deck }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteDeckAction(deck.id);
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/decks/${deck.id}`}
            className="text-sm font-medium hover:underline"
          >
            {deck.name}
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className={GAME_BADGE_CLASSES[deck.gameType] ?? ""}>
              {GAME_LABELS[deck.gameType] ?? deck.gameType}
            </Badge>
            {deck.format && (
              <Badge variant="outline">{deck.format.split("-").pop()}</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {deck.cardCount} card{deck.cardCount !== 1 ? "s" : ""}
            </span>
            {deck.isPublic && (
              <Badge variant="outline">Public</Badge>
            )}
          </div>
        </div>
        <ConfirmDialog
          title="Delete deck?"
          description={`This will permanently delete "${deck.name}".`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            className="text-destructive hover:text-destructive"
          >
            {isPending ? "..." : "Delete"}
          </Button>
        </ConfirmDialog>
      </CardContent>
    </Card>
  );
}
