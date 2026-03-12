"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleProfileVisibilityAction, toggleCollectionVisibilityAction } from "../actions";

export function ProfileVisibilityToggle({ isPublic }: { isPublic: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      try {
        const result = await toggleProfileVisibilityAction();
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(isPublic ? "Profile set to private" : "Profile set to public");
        }
      } catch {
        toast.error("Failed to update visibility");
      }
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
      try {
        const result = await toggleCollectionVisibilityAction(collectionId);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(isPublic ? "Collection set to private" : "Collection shared publicly");
        }
      } catch {
        toast.error("Failed to update visibility");
      }
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
