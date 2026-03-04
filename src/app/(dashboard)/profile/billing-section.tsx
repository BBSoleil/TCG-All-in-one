"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkoutAction, portalAction } from "@/features/billing/actions";

interface BillingSectionProps {
  tier: string;
}

export function BillingSection({ tier }: BillingSectionProps) {
  const [isPending, startTransition] = useTransition();

  function handleUpgrade() {
    startTransition(async () => {
      await checkoutAction();
    });
  }

  function handleManage() {
    startTransition(async () => {
      await portalAction();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Manage your subscription plan
            </CardDescription>
          </div>
          <Badge variant={tier === "master" ? "default" : "secondary"}>
            {tier === "master" ? "Master" : "Free"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {tier === "master" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You have the Master plan with unlimited cards, real-time data, and premium features.
            </p>
            <Button
              variant="outline"
              onClick={handleManage}
              disabled={isPending}
            >
              {isPending ? "Loading..." : "Manage Billing"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Upgrade to Master for unlimited card tracking, real-time market data, price alerts, and more.
            </p>
            <Button onClick={handleUpgrade} disabled={isPending}>
              {isPending ? "Loading..." : "Upgrade to Master — $9.99/mo"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
