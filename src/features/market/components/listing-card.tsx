import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GAME_LABELS } from "@/shared/types";
import { formatPrice } from "@/shared/lib/format";
import type { ListingItem } from "../types";

export function ListingCard({ listing }: { listing: ListingItem }) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          {listing.card.imageUrl && (
            <div className="relative h-20 w-14 shrink-0">
              <Image
                src={listing.card.imageUrl}
                alt={listing.card.name}
                fill
                sizes="56px"
                className="rounded object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Link
              href={`/market/listing/${listing.id}`}
              className="text-sm font-medium hover:underline truncate"
              title={listing.card.name}
            >
              {listing.card.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge variant="secondary">
                {GAME_LABELS[listing.card.gameType as keyof typeof GAME_LABELS] ?? listing.card.gameType}
              </Badge>
              <Badge variant="outline">{listing.condition}</Badge>
              {listing.isTradeOnly && <Badge variant="outline">Trade Only</Badge>}
              {listing.quantity > 1 && (
                <span className="text-xs text-muted-foreground">x{listing.quantity}</span>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold">
                {listing.isTradeOnly ? "Trade" : formatPrice(listing.price)}
              </span>
              <div className="text-right text-xs text-muted-foreground">
                <p>{listing.seller.name ?? "Anonymous"}</p>
                {listing.seller.avgRating !== null && (
                  <p>{listing.seller.avgRating.toFixed(1)}/5 rating</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
