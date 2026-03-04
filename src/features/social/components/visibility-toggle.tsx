"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleProfileVisibilityAction, toggleCollectionVisibilityAction } from "../actions";

export function ProfileVisibilityToggle({ isPublic }: { isPublic: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleProfileVisibilityAction();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? "..." : isPublic ? "Make Private" : "Make Public"}
    </Button>
  );
}

export function CollectionVisibilityToggle({
  collectionId,
  isPublic,
}: {
  collectionId: string;
  isPublic: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleCollectionVisibilityAction(collectionId);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? "..." : isPublic ? "Make Private" : "Share Public"}
    </Button>
  );
}
