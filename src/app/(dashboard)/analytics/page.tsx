import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAnalytics } from "@/features/analytics/services";
import { getPortfolioHistory } from "@/features/collection/services/portfolio-history";
import dynamic from "next/dynamic";
import { TopCardsTable } from "@/features/analytics/components";

const PortfolioChart = dynamic(
  () => import("@/features/collection/components").then((m) => ({ default: m.PortfolioChart })),
);
const GameBreakdownChart = dynamic(
  () => import("@/features/analytics/components").then((m) => ({ default: m.GameBreakdownChart })),
);
const RarityChart = dynamic(
  () => import("@/features/analytics/components").then((m) => ({ default: m.RarityChart })),
);
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/shared/lib/format";

export const metadata: Metadata = {
  title: "Analytics | TCG All-in-One",
  description: "Detailed analytics for your TCG collection — breakdown by game, rarity, and top cards.",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [analyticsResult, historyResult] = await Promise.all([
    getAnalytics(session.user.id),
    getPortfolioHistory(session.user.id, 90),
  ]);

  const analytics = analyticsResult.success
    ? analyticsResult.data
    : {
        gameBreakdown: [],
        rarityBreakdown: [],
        topCards: [],
        totalUniqueCards: 0,
        totalCardCopies: 0,
        totalValue: 0,
        avgCardValue: 0,
        collectionsCount: 0,
      };

  const history = historyResult.success ? historyResult.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed insights into your collection.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(analytics.totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalUniqueCards}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Copies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalCardCopies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Card Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(analytics.avgCardValue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value (90 days)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[300px]">
            <PortfolioChart data={history} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Value by Game</CardTitle>
          </CardHeader>
          <CardContent>
            <GameBreakdownChart data={analytics.gameBreakdown} mode="value" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cards by Game</CardTitle>
          </CardHeader>
          <CardContent>
            <GameBreakdownChart data={analytics.gameBreakdown} mode="count" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rarity Distribution</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[300px]">
            <RarityChart data={analytics.rarityBreakdown} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Most Valuable Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <TopCardsTable cards={analytics.topCards} />
        </CardContent>
      </Card>
    </div>
  );
}
