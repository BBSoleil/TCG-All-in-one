import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CardImage } from "@/shared/components";
import { getCardById } from "@/features/cards/services";
import { getPriceHistory } from "@/features/cards/services/price-history";
import { browseListings } from "@/features/market/services/listings";
import dynamic from "next/dynamic";

const PriceHistoryChart = dynamic(
  () => import("@/features/cards/components/price-history-chart").then((m) => ({ default: m.PriceHistoryChart })),
);
import { TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GAME_LABELS } from "@/shared/types";
import { GAME_BADGE_CLASSES } from "@/shared/constants";
import { formatPrice } from "@/shared/lib/format";
import { getPriceSource, formatLastUpdated } from "@/shared/lib/price-source";
import { AddToWishlistDialog } from "./add-to-wishlist-dialog";
import { AddToCollectionDialog } from "./add-to-collection-dialog";
import { AddToDeckDialog } from "./add-to-deck-dialog";
import { GameDetails } from "./game-details";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getCardById(id);
  if (!result.success) return { title: "Card Not Found" };
  const card = result.data;
  const price = card.marketPrice ? `$${Number(card.marketPrice).toFixed(2)}` : "";
  return {
    title: `${card.name} | TCG All-in-One`,
    description: `${card.name} from ${card.setName ?? card.gameType}${price ? ` — ${price}` : ""}. Browse, collect, and trade on TCG All-in-One.`,
  };
}

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, listingsResult, priceHistoryResult] = await Promise.all([
    getCardById(id),
    browseListings({ cardId: id }),
    getPriceHistory(id, 90),
  ]);
  if (!result.success) notFound();

  const card = result.data;
  const listings = listingsResult.success ? listingsResult.data.listings : [];
  const priceHistory = priceHistoryResult.success ? priceHistoryResult.data : [];

  return (
    <div className="space-y-6">
      <Link href="/cards">
        <Button variant="ghost" size="sm">
          &larr; Back to browser
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div>
          <CardImage
            src={card.imageUrl}
            alt={card.name}
            gameType={card.gameType}
            rarity={card.rarity}
            size="detail"
            priority
          />
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{card.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={GAME_BADGE_CLASSES[card.gameType] ?? ""}>
                {GAME_LABELS[card.gameType as keyof typeof GAME_LABELS] ?? card.gameType}
              </Badge>
              {card.rarity && <Badge variant="secondary">{card.rarity}</Badge>}
              {card.setName && (
                <Badge variant="outline">{card.setName}</Badge>
              )}
            </div>
          </div>

          {card.marketPrice !== null && card.marketPrice !== undefined && (
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primary">
                {formatPrice(Number(card.marketPrice))}
              </p>
              <PriceSourceAttribution
                gameType={card.gameType}
                updatedAt={card.updatedAt}
              />
              {priceHistory.length > 1 && (
                <PriceAnalytics
                  currentPrice={Number(card.marketPrice)}
                  history={priceHistory}
                />
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <AddToCollectionDialog cardId={card.id} cardName={card.name} />
            <AddToDeckDialog cardId={card.id} cardName={card.name} gameType={card.gameType} />
            <AddToWishlistDialog cardId={card.id} cardName={card.name} />
            <Link href={`/market?cardId=${card.id}`}>
              <Button variant="outline">View marketplace</Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Price History (90 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceHistoryChart data={priceHistory} />
            </CardContent>
          </Card>

          <GameDetails
            pokemonDetails={card.pokemonDetails}
            yugiohDetails={card.yugiohDetails}
            mtgDetails={card.mtgDetails}
            onepieceDetails={card.onepieceDetails}
          />

          {listings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Market Depth</span>
                  <Badge variant="secondary">{listings.length} listing{listings.length !== 1 ? "s" : ""}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...listings].sort((a, b) => a.price - b.price).map((listing, i) => (
                    <Link
                      key={listing.id}
                      href={`/market/listing/${listing.id}`}
                      className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                        <div>
                          <p className="text-sm font-semibold">
                            {formatPrice(listing.price)}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {listing.condition}
                            </span>
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{listing.seller.name ?? "Anonymous"}</span>
                            {listing.seller.avgRating !== null && (
                              <span className="inline-flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {listing.seller.avgRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {listing.isTradeOnly ? "Trade" : "Buy"}
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function computePriceAnalytics(
  currentPrice: number,
  history: { date: string; price: number }[],
) {
  const now = Date.now();
  const d7 = now - 7 * 86400000;
  const d30 = now - 30 * 86400000;
  const d90 = now - 90 * 86400000;

  function getChangeFromDate(since: number): { change: number; pct: number } | null {
    const older = history.find((h) => new Date(h.date).getTime() >= since);
    if (!older || older.price === 0) return null;
    const change = currentPrice - older.price;
    const pct = (change / older.price) * 100;
    return { change, pct };
  }

  const prices = history.map((h) => h.price).filter((p) => p > 0);
  const high = prices.length > 0 ? Math.max(...prices) : currentPrice;
  const low = prices.length > 0 ? Math.min(...prices) : currentPrice;

  return {
    periods: [
      { label: "7D", data: getChangeFromDate(d7) },
      { label: "30D", data: getChangeFromDate(d30) },
      { label: "90D", data: getChangeFromDate(d90) },
    ],
    high,
    low,
  };
}

function PriceAnalytics({
  currentPrice,
  history,
}: {
  currentPrice: number;
  history: { date: string; price: number }[];
}) {
  const { periods, high, low } = computePriceAnalytics(currentPrice, history);

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {periods.map((p) =>
        p.data ? (
          <div key={p.label} className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{p.label}:</span>
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                p.data.pct > 0
                  ? "text-emerald-500"
                  : p.data.pct < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
              }`}
            >
              {p.data.pct > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : p.data.pct < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {p.data.pct > 0 ? "+" : ""}
              {p.data.pct.toFixed(1)}%
            </span>
          </div>
        ) : null,
      )}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>90D Range:</span>
        <span className="font-medium text-foreground">
          {formatPrice(low)} — {formatPrice(high)}
        </span>
      </div>
    </div>
  );
}

function PriceSourceAttribution({
  gameType,
  updatedAt,
}: {
  gameType: string;
  updatedAt: Date | string;
}) {
  const source = getPriceSource(gameType);
  const lastUpdated = formatLastUpdated(updatedAt);
  if (!source && !lastUpdated) return null;

  return (
    <p className="text-xs text-muted-foreground">
      {source && (
        <>
          Source:{" "}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            {source.label}
          </a>
        </>
      )}
      {source && lastUpdated && <span className="mx-1">·</span>}
      {lastUpdated && <>Last synced {lastUpdated}</>}
    </p>
  );
}
