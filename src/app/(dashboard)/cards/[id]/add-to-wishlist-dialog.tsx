"use client";

import { useState } from "react";
import { AddToWishlistForm } from "@/features/wishlist/components";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddToWishlistDialog({
  cardId,
  cardName,
}: {
  cardId: string;
  cardName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add to wishlist</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to wishlist</DialogTitle>
        </DialogHeader>
        <AddToWishlistForm
          cardId={cardId}
          cardName={cardName}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
