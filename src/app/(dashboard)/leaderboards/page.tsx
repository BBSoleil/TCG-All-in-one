import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLeaderboard } from "@/features/social/services";
import { LEADERBOARD_LABELS } from "@/features/social/types";
import type { LeaderboardCategory, LeaderboardEntry } from "@/features/social/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/shared/lib/format";

export const metadata: Metadata = {
  title: "Leaderboards | TCG All-in-One",
  description: "Top collectors ranked by portfolio value, cards, followers, achievements, and trades.",
};

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

const CATEGORIES: LeaderboardCategory[] = [
  "portfolio",
  "cards",
  "followers",
  "achievements",
  "trades",
];

function formatValue(category: LeaderboardCategory, value: number): string {
  if (category === "portfolio") return formatPrice(value);
  return value.toLocaleString();
}

function rankBadge(rank: number) {
  if (rank === 1) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (rank === 2) return "bg-gray-300/20 text-gray-300 border-gray-400/30";
  if (rank === 3) return "bg-amber-600/20 text-amber-500 border-amber-600/30";
  return "bg-muted text-muted-foreground";
}

export default async function LeaderboardsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const active: LeaderboardCategory = CATEGORIES.includes(
    params.category as LeaderboardCategory,
  )
    ? (params.category as LeaderboardCategory)
    : "portfolio";

  const result = await getLeaderboard(active);
  const entries: LeaderboardEntry[] = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Leaderboards</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Top collectors across all games. Only public profiles are shown.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Link key={cat} href={`/leaderboards?category=${cat}`}>
            <Badge
              variant={cat === active ? "default" : "outline"}
              className="cursor-pointer px-4 py-1.5 text-sm"
            >
              {LEADERBOARD_LABELS[cat]}
            </Badge>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{LEADERBOARD_LABELS[active]}</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No entries yet. Make your profile public to appear here!
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <Link
                  key={entry.userId}
                  href={`/user/${entry.userId}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors sm:gap-4 sm:p-3"
                >
                  <Badge
                    variant="outline"
                    className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-full shrink-0 sm:w-10 sm:h-10 sm:text-lg ${rankBadge(entry.rank)}`}
                  >
                    {entry.rank}
                  </Badge>

                  <div className="relative hidden w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 sm:block">
                    {entry.userImage ? (
                      <Image
                        src={entry.userImage}
                        alt={entry.userName ?? "User"}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold">
                        {entry.userName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate sm:text-base" title={entry.userName ?? "Anonymous"}>
                      {entry.userName ?? "Anonymous"}
                    </p>
                  </div>

                  <div className="text-right font-mono text-xs font-semibold whitespace-nowrap sm:text-sm">
                    {formatValue(active, entry.value)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
