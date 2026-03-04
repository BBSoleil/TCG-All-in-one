"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { copyDeckAction } from "@/features/decks/actions";

export function CopyDeckButton({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCopy() {
    startTransition(async () => {
      const result = await copyDeckAction(deckId);
      if (result.id) {
        router.push(`/decks/${result.id}`);
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} disabled={isPending}>
      {isPending ? "Copying..." : "Copy Deck"}
    </Button>
  );
}
