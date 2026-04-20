import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserCollections } from "@/features/collection/services";
import { getTrackedSets } from "@/features/cards/services/tracked-sets";
import { CollectionList } from "@/features/collection/components";
import { TrackedSetsGrid } from "./tracked-sets-grid";
import { Button } from "@/components/ui/button";
import { CreateCollectionDialog } from "./create-collection-dialog";

export const metadata: Metadata = {
  title: "My Collections | TCG All-in-One",
  description: "Manage your TCG card collections across Pokemon, Yu-Gi-Oh!, MTG, and One Piece.",
};

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [collectionsResult, trackedSetsResult] = await Promise.all([
    getUserCollections(session.user.id),
    getTrackedSets(session.user.id),
  ]);
  const collections = collectionsResult.success ? collectionsResult.data : [];
  const trackedSets = trackedSetsResult.success ? trackedSetsResult.data : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collection</h1>
          <p className="text-muted-foreground">
            Track progress on official sets and manage custom collections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/collection/compare">
            <Button variant="outline">Compare</Button>
          </Link>
          <CreateCollectionDialog />
        </div>
      </div>

      {trackedSets.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-semibold">Sets you&apos;re tracking</h2>
              <p className="text-xs text-muted-foreground">
                Every set where you own at least one card. Completion updates as
                you add cards to any collection.
              </p>
            </div>
            <Link href="/cards" className="text-xs text-muted-foreground hover:text-foreground underline">
              Browse all sets &rarr;
            </Link>
          </div>
          <TrackedSetsGrid sets={trackedSets} />
        </section>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Custom collections</h2>
          <p className="text-xs text-muted-foreground">
            Your own named collections. Use these for themes, decks-in-progress,
            or anything that doesn&apos;t fit a single set.
          </p>
        </div>
        <CollectionList collections={collections} />
      </section>
    </div>
  );
}
