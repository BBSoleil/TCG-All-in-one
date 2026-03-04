"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { makeOfferAction } from "../actions";

export function OfferForm({
  listingId,
  askingPrice,
}: {
  listingId: string;
  askingPrice: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const price = Number(formData.get("price"));
    const message = (formData.get("message") as string) || undefined;

    startTransition(async () => {
      const result = await makeOfferAction(listingId, price, message);
      if (result.error) {
        setError(result.error);
        setSuccess(false);
      } else {
        setError("");
        setSuccess(true);
      }
    });
  }

  if (success) {
    return <p className="text-sm text-emerald-600 dark:text-emerald-400">Offer sent successfully!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="offer-price">Your Offer ($)</Label>
        <Input
          id="offer-price"
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={askingPrice.toFixed(2)}
          required
        />
      </div>
      <div>
        <Label htmlFor="offer-message">Message (optional)</Label>
        <Input id="offer-message" name="message" placeholder="Add a message to the seller..." />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send Offer"}
      </Button>
    </form>
  );
}
