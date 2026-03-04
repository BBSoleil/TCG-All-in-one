import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserListingsByStatus } from "@/features/market/services/listings";
import { cancelListingAction } from "@/features/market/actions/listing-actions";
import { EditPriceDialog } from "@/features/market/components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/shared/lib/format";

export const metadata: Metadata = {
  title: "My Listings | TCG All-in-One",
  description: "Manage your active, sold, and cancelled marketplace listings.",
};

function CancelButton({ listingId }: { listingId: string }) {
  async function handleCancel() {
    "use server";
    await cancelListingAction(listingId);
  }

  return (
    <form action={handleCancel}>
      <Button variant="destructive" size="sm" type="submit">
        Cancel
      </Button>
    </form>
  );
}

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { tab } = await searchParams;
  const activeTab = tab ?? "ACTIVE";

  const result = await getUserListingsByStatus(session.user.id, activeTab);
  if (!result.success) {
    return <p className="text-destructive">Failed to load listings</p>;
  }

  const { listings, stats } = result.data;

  const tabs = [
    { key: "ACTIVE", label: "Active", count: stats.active },
    { key: "SOLD", label: "Sold", count: stats.sold },
    { key: "CANCELLED", label: "Cancelled", count: stats.cancelled },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground">Manage your marketplace listings.</p>
        </div>
        <Link href="/market">
          <Button variant="outline">Back to Market</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Sold</p>
            <p className="text-2xl font-bold">{stats.sold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold">{stats.cancelled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">{formatPrice(stats.revenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <Link key={t.key} href={`/market/my-listings?tab=${t.key}`}>
            <Button
              variant={activeTab === t.key ? "default" : "outline"}
              size="sm"
            >
              {t.label}
              <Badge variant="secondary" className="ml-1.5">
                {t.count}
              </Badge>
            </Button>
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No {activeTab.toLowerCase()} listings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  {activeTab === "ACTIVE" && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {listing.card.imageUrl && (
                          <div className="relative h-12 w-9 shrink-0">
                            <Image
                              src={listing.card.imageUrl}
                              alt={listing.card.name}
                              fill
                              sizes="36px"
                              className="rounded object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/market/listing/${listing.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {listing.card.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {listing.card.setName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {listing.isTradeOnly ? "Trade" : formatPrice(listing.price)}
                    </TableCell>
                    <TableCell>{listing.condition}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          listing.status === "ACTIVE"
                            ? "default"
                            : listing.status === "SOLD"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {listing.status}
                      </Badge>
                    </TableCell>
                    {activeTab === "ACTIVE" && (
                      <TableCell>
                        <div className="flex gap-2">
                          <EditPriceDialog
                            listingId={listing.id}
                            currentPrice={listing.price}
                          />
                          <CancelButton listingId={listing.id} />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
