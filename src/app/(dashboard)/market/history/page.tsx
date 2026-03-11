import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserTransactions } from "@/features/market/services/offers";
import { RateTransactionForm, PostPurchaseActions } from "@/features/market/components";
import { getUserCollections } from "@/features/collection/actions";
import { getUserDecksAction } from "@/features/decks/actions/deck-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/shared/lib/format";

export const metadata: Metadata = {
  title: "Transaction History | TCG All-in-One",
  description: "View your completed transactions and leave ratings.",
};

export default async function TransactionHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [result, collections, decks] = await Promise.all([
    getUserTransactions(session.user.id),
    getUserCollections(),
    getUserDecksAction(),
  ]);
  const transactions = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/market">
          <Button variant="ghost" size="sm">&larr; Back</Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No transactions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const isSeller = tx.seller.id === session.user.id;
            const isBuyer = !isSeller;
            const otherParty = isSeller ? tx.buyer : tx.seller;
            const alreadyRated = tx.ratings.some((r) => r.raterId === session.user.id);

            return (
              <Card key={tx.id}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{tx.listing.card.name}</p>
                      <p className="text-sm">
                        {formatPrice(tx.price)} — {isSeller ? "Sold to" : "Bought from"}{" "}
                        {otherParty.name ?? "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <RateTransactionForm
                        transactionId={tx.id}
                        alreadyRated={alreadyRated}
                      />
                      {isBuyer && (
                        <PostPurchaseActions
                          cardId={tx.listing.card.id}
                          cardGameType={tx.listing.card.gameType}
                          collections={collections}
                          decks={decks}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
