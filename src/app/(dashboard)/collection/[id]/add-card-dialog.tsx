"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddCardToCollectionForm } from "@/features/collection/components";
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
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add card</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add card to collection</DialogTitle>
        </DialogHeader>
        <AddCardToCollectionForm
          collectionId={collectionId}
          gameType={gameType}
          onSuccess={() => {
            setOpen(false);
            if (onCardAdded) {
              onCardAdded();
            } else {
              router.refresh();
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
