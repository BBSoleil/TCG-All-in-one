import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserWishlist } from "@/features/wishlist/services";
import { WishlistList } from "@/features/wishlist/components";

export const metadata: Metadata = {
  title: "Wishlist | TCG All-in-One",
  description: "Track cards you want and set target price alerts.",
};

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const result = await getUserWishlist(session.user.id);
  const items = result.success ? result.data : [];

  const alertCount = items.filter((item) => {
    const market = item.card.marketPrice ? Number(item.card.marketPrice) : null;
    const target = item.targetPrice ? Number(item.targetPrice) : null;
    return market !== null && target !== null && market <= target;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wishlist</h1>
        <p className="text-muted-foreground">
          Cards you want to acquire.
          {alertCount > 0 && (
            <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
              {alertCount} price alert{alertCount !== 1 ? "s" : ""} triggered!
            </span>
          )}
        </p>
      </div>

      <WishlistList items={items} />
    </div>
  );
}
