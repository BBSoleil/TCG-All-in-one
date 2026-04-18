import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDashboardStats } from "@/features/collection/services";
import { recordPortfolioSnapshot, getPortfolioHistory } from "@/features/collection/services/portfolio-history";
import { getActivityFeed } from "@/features/social/services/activity-feed";
import { ActivityFeed } from "@/features/social/components";
import dynamic from "next/dynamic";

const PortfolioChart = dynamic(
  () => import("@/features/collection/components").then((m) => ({ default: m.PortfolioChart })),
);
import { GAME_LABELS } from "@/shared/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/shared/lib/format";

export const metadata: Metadata = {
  title: "Dashboard | TCG All-in-One",
  description: "Your collection dashboard — portfolio value, stats, and recent activity.",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [result, historyResult, feedResult] = await Promise.all([
    getDashboardStats(session.user.id),
    getPortfolioHistory(session.user.id, 30),
    getActivityFeed(session.user.id, 10),
  ]);
  const stats = result.success
    ? result.data
    : { totalCollections: 0, totalCards: 0, portfolioValue: 0, collectionsByGame: [] };
  const history = historyResult.success ? historyResult.data : [];
  const feed = feedResult.success ? feedResult.data : [];

  // Record a snapshot (fire-and-forget, don't block render)
  void recordPortfolioSnapshot(session.user.id);

  const isNewUser = stats.totalCards === 0 && stats.totalCollections === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          {isNewUser
            ? `Welcome to TCG All-in-One, ${session.user.name ?? "collector"}. Let's get your first collection set up.`
            : `Welcome back, ${session.user.name ?? "collector"}. Here's your overview.`}
        </p>
      </div>

      {isNewUser && <GetStartedGuide />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="dash-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCards.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="dash-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCollections}</p>
          </CardContent>
        </Card>

        <Card className="dash-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Games Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.collectionsByGame.length}
            </p>
          </CardContent>
        </Card>

        <Card className="dash-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {formatPrice(stats.portfolioValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Portfolio Value (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[300px]">
            <PortfolioChart data={history} />
          </div>
        </CardContent>
      </Card>

      {stats.collectionsByGame.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Collections by Game</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.collectionsByGame.map((item) => (
                <div
                  key={item.gameType}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">
                    {GAME_LABELS[item.gameType as keyof typeof GAME_LABELS] ?? item.gameType}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} collection{item.count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              You don&apos;t have any collections yet.
            </p>
            <Link href="/collection" className="mt-4 inline-block">
              <Button>Create your first collection</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <ActivityFeed events={feed} title="Recent Activity" compact />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/collection" className="block">
              <Button variant="outline" className="w-full justify-start">
                Manage collections
              </Button>
            </Link>
            <Link href="/cards" className="block">
              <Button variant="outline" className="w-full justify-start">
                Browse card database
              </Button>
            </Link>
            <Link href="/analytics" className="block">
              <Button variant="outline" className="w-full justify-start">
                Collection analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Explore More</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/wishlist" className="block">
              <Button variant="outline" className="w-full justify-start">
                Wishlist & price alerts
              </Button>
            </Link>
            <Link href="/decks" className="block">
              <Button variant="outline" className="w-full justify-start">
                Deck builder
              </Button>
            </Link>
            <Link href="/market" className="block">
              <Button variant="outline" className="w-full justify-start">
                Marketplace
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GetStartedGuide() {
  const steps: { n: number; title: string; body: string; href: string; cta: string }[] = [
    {
      n: 1,
      title: "Create a collection",
      body: "Pick a game (Pokemon, Yu-Gi-Oh!, Magic, or One Piece) and give your collection a name.",
      href: "/collection",
      cta: "New collection",
    },
    {
      n: 2,
      title: "Browse the database",
      body: "Search 90,000+ cards across 500+ sets. Add any card to your collection, deck, or wishlist in one click.",
      href: "/cards",
      cta: "Browse cards",
    },
    {
      n: 3,
      title: "Track your value",
      body: "Every card you add contributes to your portfolio. Track gainers, losers, and total value over time.",
      href: "/analytics",
      cta: "See analytics",
    },
  ];

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardHeader>
        <CardTitle className="text-lg">Get started in 3 steps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="flex flex-col rounded-lg border border-border bg-card/60 p-4">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                {step.n}
              </div>
              <h3 className="mb-1 font-semibold">{step.title}</h3>
              <p className="mb-4 flex-1 text-sm text-muted-foreground">{step.body}</p>
              <Link href={step.href}>
                <Button variant="secondary" size="sm" className="w-full">
                  {step.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
