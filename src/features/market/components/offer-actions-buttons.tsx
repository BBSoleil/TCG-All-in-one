"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptOfferAction, declineOfferAction, withdrawOfferAction } from "../actions";

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
