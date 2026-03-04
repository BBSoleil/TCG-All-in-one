"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rateTransactionAction } from "../actions";

export function RateTransactionForm({
  transactionId,
  alreadyRated,
}: {
  transactionId: string;
  alreadyRated: boolean;
}) {
  const [score, setScore] = useState(5);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(alreadyRated);
  const [error, setError] = useState("");

  if (done) {
    return <span className="text-xs text-muted-foreground">Rated</span>;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const comment = (formData.get("comment") as string) || undefined;
    startTransition(async () => {
      const result = await rateTransactionAction(transactionId, score, comment);
      if (result.error) setError(result.error);
      else setDone(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            className={`text-lg ${n <= score ? "text-yellow-500" : "text-muted-foreground"}`}
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={n <= score}
          >
            ★
          </button>
        ))}
      </div>
      <Input name="comment" placeholder="Comment..." className="h-8 w-32 text-xs" aria-label="Rating comment" />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "..." : "Rate"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  );
}
