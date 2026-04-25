"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/shared/components";
import { cancelListingAction } from "@/features/market/actions";

export function CancelListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      await cancelListingAction(listingId);
      router.push("/market");
    });
  }

  return (
    <ConfirmDialog
      title="Cancel listing?"
      description="All pending offers will be declined."
      confirmLabel="Cancel Listing"
      onConfirm={handleCancel}
    >
      <Button variant="destructive" size="sm" disabled={isPending}>
        {isPending ? "Cancelling..." : "Cancel Listing"}
      </Button>
    </ConfirmDialog>
  );
}
