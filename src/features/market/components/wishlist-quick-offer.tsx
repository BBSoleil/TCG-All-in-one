"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/shared/lib/format";
import { makeOfferAction } from "../actions";
import { computeQuickOfferPrice } from "../lib/quick-offer-price";

export function WishlistQuickOffer({
  listingId,
  listingPrice,
  targetPrice,
  currency,
  cardName,
}: {
  listingId: string;
  listingPrice: number;
  targetPrice: number | null;
  currency: string;
  cardName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { offerPrice, atTarget } = computeQuickOfferPrice(listingPrice, targetPrice);

  function handleConfirm() {
    startTransition(async () => {
      try {
        const result = await makeOfferAction(listingId, offerPrice);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(`Offer sent at ${formatPrice(offerPrice, currency)}`);
          setOpen(false);
        }
      } catch {
        toast.error("Failed to send offer");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto">
          Offer {formatPrice(offerPrice, currency)}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send offer on {cardName}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-1 text-sm">
              <p>
                You&apos;ll offer{" "}
                <span className="font-semibold text-foreground">
                  {formatPrice(offerPrice, currency)}
                </span>
                {atTarget ? " (your wishlist target)" : " (the asking price)"}.
              </p>
              <p className="text-xs">
                Seller is asking {formatPrice(listingPrice, currency)}.
                {atTarget && " They may accept, decline, or counter."}
              </p>
              <p className="text-xs text-muted-foreground">
                Offer expires in 48h.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Sending..." : "Send offer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
