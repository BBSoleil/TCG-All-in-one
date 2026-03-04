"use client";

import { useActionState } from "react";
import { addToWishlist } from "@/features/wishlist/actions/add-to-wishlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WishlistActionState } from "@/features/wishlist/types";

const initialState: WishlistActionState = {};

export function AddToWishlistForm({
  cardId,
  cardName,
  onSuccess,
}: {
  cardId: string;
  cardName: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: WishlistActionState, formData: FormData) => {
      const result = await addToWishlist(prev, formData);
      if (result.success) onSuccess?.();
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="cardId" value={cardId} />

      <p className="text-sm">
        Adding <span className="font-medium">{cardName}</span> to your wishlist
      </p>

      <div className="space-y-2">
        <Label htmlFor="targetPrice">Target price (optional)</Label>
        <Input
          id="targetPrice"
          name="targetPrice"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 5.00"
        />
        <p className="text-xs text-muted-foreground">
          You&apos;ll see an alert when the market price drops to or below this
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" name="notes" placeholder="Any notes about this card" />
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Adding..." : "Add to wishlist"}
      </Button>
    </form>
  );
}
