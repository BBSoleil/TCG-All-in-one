import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserOffersSent, getUserOffersReceived } from "@/features/market/services/offers";
import { AcceptOfferButton, DeclineOfferButton, WithdrawOfferButton, CounterOfferButton } from "@/features/market/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/shared/lib/format";

export const metadata: Metadata = {
  title: "My Offers | TCG All-in-One",
  description: "View and manage offers you've sent and received.",
};

export default async function OffersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [sentResult, receivedResult] = await Promise.all([
    getUserOffersSent(session.user.id),
    getUserOffersReceived(session.user.id),
  ]);

  const sent = sentResult.success ? sentResult.data : [];
  const received = receivedResult.success ? receivedResult.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/market">
          <Button variant="ghost" size="sm">&larr; Back</Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">My Offers</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Received ({received.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {received.length === 0 ? (
              <p className="text-sm text-muted-foreground">No offers received.</p>
            ) : (
              <div className="space-y-3">
                {received.map((offer) => (
                  <div key={offer.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/market/listing/${offer.listing.id}`} className="text-sm font-medium hover:underline">
                          {offer.listing.card.name}
                        </Link>
                        <p className="text-sm">
                          {formatPrice(offer.price)} from {offer.buyer.name ?? "Anonymous"}
                        </p>
                        {offer.message && (
                          <p className="text-xs text-muted-foreground">&quot;{offer.message}&quot;</p>
                        )}
                        <Badge variant="outline" className="mt-1">{offer.status}</Badge>
                      </div>
                      {offer.status === "PENDING" && (
                        <div className="flex flex-wrap gap-1">
                          <AcceptOfferButton offerId={offer.id} />
                          <CounterOfferButton offerId={offer.id} />
                          <DeclineOfferButton offerId={offer.id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sent ({sent.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {sent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No offers sent.</p>
            ) : (
              <div className="space-y-3">
                {sent.map((offer) => (
                  <div key={offer.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/market/listing/${offer.listing.id}`} className="text-sm font-medium hover:underline">
                          {offer.listing.card.name}
                        </Link>
                        <p className="text-sm">{formatPrice(offer.price)}</p>
                        <Badge variant="outline" className="mt-1">{offer.status}</Badge>
                      </div>
                      {offer.status === "PENDING" && (
                        <WithdrawOfferButton offerId={offer.id} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
