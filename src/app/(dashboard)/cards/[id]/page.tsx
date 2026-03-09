import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCardById } from "@/features/cards/services";
import { getPriceHistory } from "@/features/cards/services/price-history";
import { browseListings } from "@/features/market/services/listings";
import dynamic from "next/dynamic";

const PriceHistoryChart = dynamic(
  () => import("@/features/cards/components/price-history-chart").then((m) => ({ default: m.PriceHistoryChart })),
);
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GAME_LABELS } from "@/shared/types";
import { AddToWishlistDialog } from "./add-to-wishlist-dialog";
import { AddToCollectionDialog } from "./add-to-collection-dialog";
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
          {card.imageUrl ? (
            <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg border border-border">
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                sizes="300px"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="flex aspect-[2.5/3.5] items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{card.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge>
                {GAME_LABELS[card.gameType as keyof typeof GAME_LABELS] ?? card.gameType}
              </Badge>
              {card.rarity && <Badge variant="secondary">{card.rarity}</Badge>}
              {card.setName && (
                <Badge variant="outline">{card.setName}</Badge>
              )}
            </div>
          </div>

          {card.marketPrice !== null && card.marketPrice !== undefined && (
            <p className="text-2xl font-bold">
              ${Number(card.marketPrice).toFixed(2)}
            </p>
          )}

          <div className="flex gap-2">
            <AddToCollectionDialog cardId={card.id} cardName={card.name} />
            <AddToWishlistDialog cardId={card.id} cardName={card.name} />
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
                <CardTitle>Marketplace Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {listings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/market/listing/${listing.id}`}
                      className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          ${listing.price.toFixed(2)}
                          <span className="ml-2 text-muted-foreground">
                            {listing.condition}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Seller: {listing.seller.name ?? "Unknown"}
                          {listing.seller.avgRating !== null && (
                            <span> ({listing.seller.avgRating.toFixed(1)} stars)</span>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {listing.isTradeOnly ? "Trade" : "Buy"}
                      </Badge>
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
