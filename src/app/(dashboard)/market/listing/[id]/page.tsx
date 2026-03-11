import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CardImage } from "@/shared/components";
import { auth } from "@/auth";
import { getListingById } from "@/features/market/services/listings";
import { getOffersOnListing } from "@/features/market/services/offers";
import { OfferForm, AcceptOfferButton, DeclineOfferButton } from "@/features/market/components";
import { CancelListingButton } from "./cancel-listing-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GAME_LABELS } from "@/shared/types";
import { GAME_BADGE_CLASSES } from "@/shared/constants";
import { formatPrice } from "@/shared/lib/format";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const result = await getListingById(id);
  if (!result.success) notFound();

  const listing = result.data;
  const isOwner = listing.seller.id === session.user.id;

  // Fetch offers if owner
  const offersResult = isOwner ? await getOffersOnListing(id, session.user.id) : null;
  const offers = offersResult?.success ? offersResult.data : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/market">
          <Button variant="ghost" size="sm">&larr; Back</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <CardImage
              src={listing.card.imageUrl}
              alt={listing.card.name}
              gameType={listing.card.gameType}
              rarity={listing.card.rarity}
              size="medium"
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold">{listing.card.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary" className={GAME_BADGE_CLASSES[listing.card.gameType] ?? ""}>
                  {GAME_LABELS[listing.card.gameType as keyof typeof GAME_LABELS] ?? listing.card.gameType}
                </Badge>
                <Badge variant="outline">{listing.condition}</Badge>
                {listing.isTradeOnly && <Badge variant="outline">Trade Only</Badge>}
                <Badge variant={listing.status === "ACTIVE" ? "default" : "secondary"}>
                  {listing.status}
                </Badge>
              </div>
              <p className="mt-3 text-2xl font-bold">
                {listing.isTradeOnly ? "Trade Only" : formatPrice(listing.price)}
              </p>
              {listing.quantity > 1 && (
                <p className="text-sm text-muted-foreground">Quantity: {listing.quantity}</p>
              )}
              {listing.description && (
                <p className="mt-2 text-sm text-muted-foreground">{listing.description}</p>
              )}
              <div className="mt-3 text-sm text-muted-foreground">
                <p>Seller: {listing.seller.name ?? "Anonymous"}</p>
                {listing.seller.avgRating !== null && (
                  <p>Rating: {listing.seller.avgRating.toFixed(1)}/5</p>
                )}
              </div>

              {isOwner && listing.status === "ACTIVE" && (
                <div className="mt-4">
                  <CancelListingButton listingId={id} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!isOwner && listing.status === "ACTIVE" && (
        <Card>
          <CardHeader>
            <CardTitle>Make an Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <OfferForm listingId={id} askingPrice={listing.price} />
          </CardContent>
        </Card>
      )}

      {isOwner && offers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Offers ({offers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {formatPrice(offer.price)} from {offer.buyer.name ?? "Anonymous"}
                    </p>
                    {offer.message && (
                      <p className="text-xs text-muted-foreground">{offer.message}</p>
                    )}
                    <Badge variant="outline" className="mt-1">{offer.status}</Badge>
                  </div>
                  {offer.status === "PENDING" && (
                    <div className="flex gap-2">
                      <AcceptOfferButton offerId={offer.id} />
                      <DeclineOfferButton offerId={offer.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
