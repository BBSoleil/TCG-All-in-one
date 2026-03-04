"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateDeckAction } from "@/features/decks/actions";

export function DeckSettings({
  deckId,
  isPublic,
}: {
  deckId: string;
  isPublic: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("isPublic", isPublic ? "false" : "true");
      await updateDeckAction(deckId, formData);
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle} disabled={isPending}>
      {isPending ? "..." : isPublic ? "Make Private" : "Share Public"}
    </Button>
  );
}
