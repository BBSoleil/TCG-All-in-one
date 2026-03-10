"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AddCardToCollectionForm } from "@/features/collection/components";
import { fetchCardsForSelect } from "@/features/cards/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddCardDialog({
  collectionId,
  gameType,
  onCardAdded,
}: {
  collectionId: string;
  gameType: string;
  onCardAdded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      fetchCardsForSelect(gameType).then(setCards);
    }
  }, [open, gameType]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add card</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add card to collection</DialogTitle>
        </DialogHeader>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No cards found in the database for this game. Add cards via the card browser first.
          </p>
        ) : (
          <AddCardToCollectionForm
            collectionId={collectionId}
            cards={cards}
            onSuccess={() => {
              setOpen(false);
              if (onCardAdded) {
                onCardAdded();
              } else {
                router.refresh();
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
