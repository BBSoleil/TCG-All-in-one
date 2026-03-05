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

          {card.pokemonDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Pokemon Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {card.pokemonDetails.hp && (
                    <>
                      <dt className="text-muted-foreground">HP</dt>
                      <dd>{card.pokemonDetails.hp}</dd>
                    </>
                  )}
                  {card.pokemonDetails.types.length > 0 && (
                    <>
                      <dt className="text-muted-foreground">Types</dt>
                      <dd>{card.pokemonDetails.types.join(", ")}</dd>
                    </>
                  )}
                  {card.pokemonDetails.stage && (
                    <>
                      <dt className="text-muted-foreground">Stage</dt>
                      <dd>{card.pokemonDetails.stage}</dd>
                    </>
                  )}
                  {card.pokemonDetails.evolvesFrom && (
                    <>
                      <dt className="text-muted-foreground">Evolves From</dt>
                      <dd>{card.pokemonDetails.evolvesFrom}</dd>
                    </>
                  )}
                  {card.pokemonDetails.weakness && (
                    <>
                      <dt className="text-muted-foreground">Weakness</dt>
                      <dd>{card.pokemonDetails.weakness}</dd>
                    </>
                  )}
                  {card.pokemonDetails.resistance && (
                    <>
                      <dt className="text-muted-foreground">Resistance</dt>
                      <dd>{card.pokemonDetails.resistance}</dd>
                    </>
                  )}
                  {card.pokemonDetails.retreatCost !== null && (
                    <>
                      <dt className="text-muted-foreground">Retreat Cost</dt>
                      <dd>{card.pokemonDetails.retreatCost}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {card.yugiohDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Yu-Gi-Oh! Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {card.yugiohDetails.cardType && (
                    <>
                      <dt className="text-muted-foreground">Type</dt>
                      <dd>{card.yugiohDetails.cardType}</dd>
                    </>
                  )}
                  {card.yugiohDetails.attribute && (
                    <>
                      <dt className="text-muted-foreground">Attribute</dt>
                      <dd>{card.yugiohDetails.attribute}</dd>
                    </>
                  )}
                  {card.yugiohDetails.level !== null && (
                    <>
                      <dt className="text-muted-foreground">Level</dt>
                      <dd>{card.yugiohDetails.level}</dd>
                    </>
                  )}
                  {card.yugiohDetails.attack !== null && (
                    <>
                      <dt className="text-muted-foreground">ATK / DEF</dt>
                      <dd>
                        {card.yugiohDetails.attack} / {card.yugiohDetails.defense}
                      </dd>
                    </>
                  )}
                  {card.yugiohDetails.race && (
                    <>
                      <dt className="text-muted-foreground">Race</dt>
                      <dd>{card.yugiohDetails.race}</dd>
                    </>
                  )}
                  {card.yugiohDetails.archetype && (
                    <>
                      <dt className="text-muted-foreground">Archetype</dt>
                      <dd>{card.yugiohDetails.archetype}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {card.mtgDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Magic Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {card.mtgDetails.typeLine && (
                    <>
                      <dt className="text-muted-foreground">Type</dt>
                      <dd>{card.mtgDetails.typeLine}</dd>
                    </>
                  )}
                  {card.mtgDetails.manaCost && (
                    <>
                      <dt className="text-muted-foreground">Mana Cost</dt>
                      <dd>{card.mtgDetails.manaCost}</dd>
                    </>
                  )}
                  {card.mtgDetails.cmc !== null && (
                    <>
                      <dt className="text-muted-foreground">CMC</dt>
                      <dd>{card.mtgDetails.cmc}</dd>
                    </>
                  )}
                  {card.mtgDetails.colors.length > 0 && (
                    <>
                      <dt className="text-muted-foreground">Colors</dt>
                      <dd>{card.mtgDetails.colors.join(", ")}</dd>
                    </>
                  )}
                  {card.mtgDetails.oracleText && (
                    <>
                      <dt className="text-muted-foreground">Text</dt>
                      <dd className="col-span-2 whitespace-pre-line">
                        {card.mtgDetails.oracleText}
                      </dd>
                    </>
                  )}
                  {card.mtgDetails.power && (
                    <>
                      <dt className="text-muted-foreground">P/T</dt>
                      <dd>
                        {card.mtgDetails.power}/{card.mtgDetails.toughness}
                      </dd>
                    </>
                  )}
                  {card.mtgDetails.loyalty && (
                    <>
                      <dt className="text-muted-foreground">Loyalty</dt>
                      <dd>{card.mtgDetails.loyalty}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {card.onepieceDetails && (
            <Card>
              <CardHeader>
                <CardTitle>One Piece Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {card.onepieceDetails.cardType && (
                    <>
                      <dt className="text-muted-foreground">Type</dt>
                      <dd>{card.onepieceDetails.cardType}</dd>
                    </>
                  )}
                  {card.onepieceDetails.color && (
                    <>
                      <dt className="text-muted-foreground">Color</dt>
                      <dd>{card.onepieceDetails.color}</dd>
                    </>
                  )}
                  {card.onepieceDetails.cost !== null && (
                    <>
                      <dt className="text-muted-foreground">Cost</dt>
                      <dd>{card.onepieceDetails.cost}</dd>
                    </>
                  )}
                  {card.onepieceDetails.power !== null && (
                    <>
                      <dt className="text-muted-foreground">Power</dt>
                      <dd>{card.onepieceDetails.power}</dd>
                    </>
                  )}
                  {card.onepieceDetails.counter !== null && (
                    <>
                      <dt className="text-muted-foreground">Counter</dt>
                      <dd>{card.onepieceDetails.counter}</dd>
                    </>
                  )}
                  {card.onepieceDetails.attribute && (
                    <>
                      <dt className="text-muted-foreground">Attribute</dt>
                      <dd>{card.onepieceDetails.attribute}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

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
