import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserTier } from "@/features/billing/services";
import { getUserTotalCardCount } from "@/features/collection/services";
import { ROOKIE_CARD_LIMIT } from "@/shared/constants";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BillingActions } from "./billing-actions";

export const metadata: Metadata = {
  title: "Billing & Plans | TCG All-in-One",
  description: "Upgrade to Master for unlimited cards, real-time data, and premium features.",
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [tierResult, cardCount] = await Promise.all([
    getUserTier(session.user.id),
    getUserTotalCardCount(session.user.id),
  ]);
  const tier = tierResult.success ? tierResult.data.tier : "free";
  const isMaster = tier === "master";
  const usagePct = Math.min(100, Math.round((cardCount / ROOKIE_CARD_LIMIT) * 100));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground">
          {isMaster
            ? "You're on the Master plan. Manage your subscription below."
            : "Upgrade to unlock unlimited cards, real-time market data, and more."}
        </p>
      </div>

      {!isMaster && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usage</CardTitle>
                <CardDescription>
                  {cardCount.toLocaleString()} of {ROOKIE_CARD_LIMIT.toLocaleString()} cards tracked
                </CardDescription>
              </div>
              <Badge variant="secondary">Free</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {usagePct >= 80
                ? "You're approaching the free plan limit. Upgrade to keep collecting without restrictions."
                : `${(100 - usagePct)}% remaining on the free plan.`}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={isMaster ? "opacity-60" : "border-primary"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Rookie</CardTitle>
              <span className="text-2xl font-bold">Free</span>
            </div>
            <CardDescription>Get started with core features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✓ Up to {ROOKIE_CARD_LIMIT.toLocaleString()} cards</p>
            <p>✓ 4 supported games</p>
            <p>✓ Deck builder & marketplace</p>
            <p>✓ Basic analytics</p>
            <p className="text-muted-foreground">✗ Real-time market data</p>
            <p className="text-muted-foreground">✗ Price alerts</p>
          </CardContent>
        </Card>

        <Card className={!isMaster ? "border-primary" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Master</CardTitle>
              <span className="text-2xl font-bold">$9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
            </div>
            <CardDescription>Unlimited power for serious collectors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✓ Unlimited cards</p>
            <p>✓ Real-time market data</p>
            <p>✓ Price alerts</p>
            <p>✓ Advanced analytics</p>
            <p>✓ Exclusive badges</p>
            <p>✓ Priority support</p>
          </CardContent>
        </Card>
      </div>

      <BillingActions isMaster={isMaster} />
    </div>
  );
}
