"use client";

import { useState, useTransition } from "react";
import { updateListingPriceAction } from "@/features/market/actions/listing-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditPriceDialog({
  listingId,
  currentPrice,
}: {
  listingId: string;
  currentPrice: number;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(String(currentPrice));
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const newPrice = Number(price);
    if (isNaN(newPrice) || newPrice <= 0) return;

    startTransition(async () => {
      const result = await updateListingPriceAction(listingId, newPrice);
      if (!result.error) {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Price
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Price</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="New price"
          />
          <Button
            onClick={handleSubmit}
            disabled={isPending || !price || Number(price) <= 0}
            className="w-full"
          >
            {isPending ? "Updating..." : "Update Price"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
