"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { acceptOfferAction, declineOfferAction, withdrawOfferAction, counterOfferAction } from "../actions";

export function AcceptOfferButton({ offerId }: { offerId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      onClick={() => startTransition(async () => { await acceptOfferAction(offerId); })}
      disabled={isPending}
    >
      {isPending ? "..." : "Accept"}
    </Button>
  );
}

export function DeclineOfferButton({ offerId }: { offerId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => startTransition(async () => { await declineOfferAction(offerId); })}
      disabled={isPending}
    >
      {isPending ? "..." : "Decline"}
    </Button>
  );
}

export function WithdrawOfferButton({ offerId }: { offerId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => startTransition(async () => { await withdrawOfferAction(offerId); })}
      disabled={isPending}
    >
      {isPending ? "..." : "Withdraw"}
    </Button>
  );
}

export function CounterOfferButton({ offerId }: { offerId: string }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");

  if (!showForm) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
        Counter
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Price"
        value={counterPrice}
        onChange={(e) => setCounterPrice(e.target.value)}
        className="h-8 w-20 text-xs"
      />
      <Button
        size="sm"
        disabled={isPending || !counterPrice}
        onClick={() =>
          startTransition(async () => {
            const result = await counterOfferAction(offerId, parseFloat(counterPrice));
            if (result.error) {
              toast.error(result.error);
            } else {
              toast.success("Counter-offer sent!");
              setShowForm(false);
              setCounterPrice("");
            }
          })
        }
      >
        {isPending ? "..." : "Send"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setCounterPrice(""); }}>
        X
      </Button>
    </div>
  );
}
