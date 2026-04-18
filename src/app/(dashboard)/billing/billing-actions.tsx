"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checkoutAction, portalAction } from "@/features/billing/actions";

export function BillingActions({ isMaster }: { isMaster: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleUpgrade() {
    startTransition(async () => {
      try {
        const result = await checkoutAction();
        if (result?.error) toast.error(result.error);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        toast.error(msg);
      }
    });
  }

  function handleManage() {
    startTransition(async () => {
      try {
        const result = await portalAction();
        if (result?.error) toast.error(result.error);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        toast.error(msg);
      }
    });
  }

  return (
    <div className="flex gap-3">
      {isMaster ? (
        <Button variant="outline" onClick={handleManage} disabled={isPending}>
          {isPending ? "Loading..." : "Manage billing"}
        </Button>
      ) : (
        <Button size="lg" onClick={handleUpgrade} disabled={isPending}>
          {isPending ? "Loading..." : "Upgrade to Master — $9.99/mo"}
        </Button>
      )}
    </div>
  );
}
