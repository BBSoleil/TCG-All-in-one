"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { removeFromWishlist } from "@/features/wishlist/actions/remove-from-wishlist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GAME_LABELS } from "@/shared/types";
import { GAME_BADGE_CLASSES } from "@/shared/constants";
import { formatPrice } from "@/shared/lib/format";
import type { WishlistCardWithDetails } from "@/features/wishlist/services";

export function WishlistList({
  items,
}: {
  items: WishlistCardWithDetails[];
}) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">
          Your wishlist is empty. Browse the card database and add cards you want.
        </p>
        <Link href="/cards" className="mt-4 inline-block">
          <Button variant="outline">Browse cards</Button>
        </Link>
      </div>
    );
  }

  async function handleRemove(id: string) {
    const result = await removeFromWishlist(id);
    if (!result.error) {
      router.refresh();
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const marketPrice = item.card.marketPrice
          ? Number(item.card.marketPrice)
          : null;
        const targetPrice = item.targetPrice
          ? Number(item.targetPrice)
          : null;
        const isAlert =
          marketPrice !== null &&
          targetPrice !== null &&
          marketPrice <= targetPrice;

        return (
          <div
            key={item.id}
            className={`group rounded-lg border bg-card overflow-hidden ${
              isAlert ? "border-green-500 ring-1 ring-green-500/20" : "border-border"
            }`}
          >
            {item.card.imageUrl ? (
              <Link href={`/cards/${item.card.id}`}>
                <div className="relative aspect-[2.5/3.5] bg-muted">
                  <Image
                    src={item.card.imageUrl}
                    alt={item.card.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                </div>
              </Link>
            ) : (
              <div className="flex aspect-[2.5/3.5] items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">No image</span>
              </div>
            )}
            <div className="p-3">
              <p className="truncate text-sm font-medium" title={item.card.name}>{item.card.name}</p>
              <div className="mt-1 flex items-center gap-1">
                <Badge variant="secondary" className={`text-xs ${GAME_BADGE_CLASSES[item.card.gameType] ?? ""}`}>
                  {GAME_LABELS[item.card.gameType as keyof typeof GAME_LABELS] ?? item.card.gameType}
                </Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                {marketPrice !== null && (
                  <p>
                    Market: <span className="font-medium">{formatPrice(marketPrice)}</span>
                  </p>
                )}
                {targetPrice !== null && (
                  <p>
                    Target:{" "}
                    <span className={`font-medium ${isAlert ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                      {formatPrice(targetPrice)}
                    </span>
                    {isAlert && " — Price met!"}
                  </p>
                )}
                {item.notes && (
                  <p className="text-muted-foreground">{item.notes}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="xs"
                className="mt-2 w-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(item.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
