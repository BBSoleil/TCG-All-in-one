import Link from "next/link";
import { CardImage } from "@/shared/components";
import { ShoppingCart, ArrowLeftRight, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GAME_LABELS } from "@/shared/types";
import { formatPrice } from "@/shared/lib/format";
import type { MarketOverviewData } from "@/features/market/services/market-stats";

export function MarketOverview({ data }: { data: MarketOverviewData }) {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ShoppingCart className="h-4 w-4 text-primary" />}
          label="Active Listings"
          value={String(data.totalActiveListings)}
        />
        <StatCard
          icon={<ArrowLeftRight className="h-4 w-4 text-emerald-500" />}
          label="Trades (24h)"
          value={String(data.transactionsLast24h)}
        />
        {data.avgPriceByGame.slice(0, 2).map((g) => (
          <StatCard
            key={g.gameType}
            icon={<DollarSign className="h-4 w-4 text-yellow-500" />}
            label={`Avg ${GAME_LABELS[g.gameType as keyof typeof GAME_LABELS] ?? g.gameType}`}
            value={formatPrice(g.avgPrice)}
            sub={`${g.listingCount} listings`}
          />
        ))}
      </div>

      {/* Hot cards */}
      {data.hotCards.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Hot Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.hotCards.map((card) => (
                <Link
                  key={card.cardId}
                  href={`/cards/${card.cardId}`}
                  className="group flex flex-col items-center gap-2 rounded-lg border border-border p-3 transition-colors hover:border-primary/50"
                >
                  <CardImage
                    src={card.imageUrl}
                    alt={card.cardName}
                    gameType={card.gameType}
                    size="small"
                  />
                  <div className="text-center">
                    <p className="truncate text-xs font-medium max-w-24">{card.cardName}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {card.listingCount} listed
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
