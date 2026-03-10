import Image from "next/image";
import Link from "next/link";
import { Star, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GAME_LABELS } from "@/shared/types";
import { GAME_BORDER_COLORS } from "@/shared/constants";
import { formatPrice } from "@/shared/lib/format";
import type { ListingItem } from "../types";

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function ListingCard({ listing }: { listing: ListingItem }) {
  const gameColor = GAME_BORDER_COLORS[listing.card.gameType] ?? "border-border";

  return (
    <Card className={`overflow-hidden border-l-4 ${gameColor} transition-all hover:shadow-md hover:border-l-primary/50`}>
      <CardContent className="p-0">
        <div className="flex gap-0">
          {/* Card image — larger */}
          <Link href={`/market/listing/${listing.id}`} className="shrink-0">
            {listing.card.imageUrl ? (
              <div className="relative h-44 w-32 bg-muted">
                <Image
                  src={listing.card.imageUrl}
                  alt={listing.card.name}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-44 w-32 items-center justify-center bg-muted text-xs text-muted-foreground">
                No image
              </div>
            )}
          </Link>

          {/* Card details */}
          <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
            <div>
              <Link
                href={`/market/listing/${listing.id}`}
                className="text-sm font-semibold hover:underline line-clamp-2"
              >
                {listing.card.name}
              </Link>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {GAME_LABELS[listing.card.gameType as keyof typeof GAME_LABELS] ?? listing.card.gameType}
                </Badge>
                <Badge variant="outline" className="text-[10px]">{listing.condition}</Badge>
                {listing.isTradeOnly && <Badge variant="outline" className="text-[10px]">Trade Only</Badge>}
                {listing.quantity > 1 && (
                  <Badge variant="outline" className="text-[10px]">x{listing.quantity}</Badge>
                )}
              </div>
            </div>

            {/* Price + seller */}
            <div className="mt-3 space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-xl font-bold text-primary">
                  {listing.isTradeOnly ? "Trade" : formatPrice(listing.price)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                {/* Seller info */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {listing.seller.image ? (
                    <Image src={listing.seller.image} alt="" width={16} height={16} className="h-4 w-4 rounded-full" />
                  ) : (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold">
                      {(listing.seller.name ?? "?")[0]}
                    </div>
                  )}
                  <span className="truncate max-w-20">{listing.seller.name ?? "Anonymous"}</span>
                  {listing.seller.avgRating !== null && (
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {listing.seller.avgRating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Time */}
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {timeAgo(listing.createdAt)}
                </span>
              </div>

              {/* Quick action */}
              <Link href={`/market/listing/${listing.id}`} className="block">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  {listing.isTradeOnly ? "View & Offer Trade" : "View & Buy"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
