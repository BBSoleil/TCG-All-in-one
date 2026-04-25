import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { browseListings } from "@/features/market/services/listings";
import { getWishlistMatches } from "@/features/market/services/ratings";
import { getMarketOverview } from "@/features/market/services/market-stats";
import { ListingCard, MarketFilters, MarketPagination, PriceTicker, MarketOverview, WishlistQuickOffer } from "@/features/market/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GAME_LABELS } from "@/shared/types";
import { GAME_COLORS } from "@/shared/constants";
import { formatPrice } from "@/shared/lib/format";

export const metadata: Metadata = {
  title: "Marketplace | TCG All-in-One",
  description: "Buy, sell, and trade TCG cards with other collectors.",
};

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const game = params.game;
  const q = params.q;
  const condition = params.condition;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const sort = params.sort;
  const page = params.page ? Number(params.page) : 1;

  const [listingsResult, matchesResult, overviewResult] = await Promise.all([
    browseListings({
      gameType: game,
      search: q,
      condition,
      minPrice,
      maxPrice,
      sort,
      page,
      pageSize: 24,
    }),
    getWishlistMatches(session.user.id),
    getMarketOverview(),
  ]);

  const data = listingsResult.success
    ? listingsResult.data
    : { listings: [], total: 0, page: 1, totalPages: 0 };
  const matches = matchesResult.success ? matchesResult.data : [];
  const overview = overviewResult.success ? overviewResult.data : null;

  return (
    <div className="space-y-6">
      {overview && overview.topMovers.length > 0 && (
        <PriceTicker movers={overview.topMovers} />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Marketplace</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Buy, sell, and trade cards with other collectors.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Link href="/market/my-listings">
            <Button variant="outline" className="w-full sm:w-auto" size="sm">My Listings</Button>
          </Link>
          <Link href="/market/offers">
            <Button variant="outline" className="w-full sm:w-auto" size="sm">My Offers</Button>
          </Link>
          <Link href="/market/history">
            <Button variant="outline" className="w-full sm:w-auto" size="sm">History</Button>
          </Link>
          <Link href="/market/sell">
            <Button className="w-full sm:w-auto" size="sm">Sell a Card</Button>
          </Link>
        </div>
      </div>

      {overview && <MarketOverview data={overview} />}

      <div className="flex flex-wrap gap-2">
        <Link href="/market">
          <Button variant={!game ? "default" : "outline"} size="sm">All</Button>
        </Link>
        {Object.entries(GAME_LABELS).map(([key, label]) => (
          <Link key={key} href={`/market?game=${key}`}>
            <Button
              variant="outline"
              size="sm"
              className={game === key ? `${GAME_COLORS[key] ?? ""} text-white border-transparent hover:opacity-90` : ""}
            >
              {label}
            </Button>
          </Link>
        ))}
      </div>

      <Suspense>
        <MarketFilters />
      </Suspense>

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Wishlist Matches
              <Badge variant="secondary">{matches.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matches.slice(0, 5).map((m) => (
                <div key={m.listing.id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/market/listing/${m.listing.id}`} className="text-sm font-medium hover:underline">
                      {m.listing.card.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(m.listing.price, m.listing.currency)} — {m.listing.condition}
                      {m.targetPrice !== null && (
                        <span className={m.listing.price <= m.targetPrice ? " text-emerald-600 dark:text-emerald-400" : ""}>
                          {" "}(target: {formatPrice(m.targetPrice, m.listing.currency)})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <WishlistQuickOffer
                      listingId={m.listing.id}
                      listingPrice={m.listing.price}
                      targetPrice={m.targetPrice}
                      currency={m.listing.currency}
                      cardName={m.listing.card.name}
                    />
                    <Link href={`/market/listing/${m.listing.id}`}>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
              {matches.length > 5 && (
                <p className="text-center text-xs text-muted-foreground">
                  +{matches.length - 5} more matches
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.total} listing{data.total !== 1 ? "s" : ""}
        </p>
      </div>

      {data.listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No listings found. Be the first to list a card!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      <Suspense>
        <MarketPagination page={data.page} totalPages={data.totalPages} />
      </Suspense>
    </div>
  );
}
