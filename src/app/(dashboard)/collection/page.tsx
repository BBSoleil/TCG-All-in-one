import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserCollections } from "@/features/collection/services";
import { CollectionList } from "@/features/collection/components";
import { Button } from "@/components/ui/button";
import { CreateCollectionDialog } from "./create-collection-dialog";

export const metadata: Metadata = {
  title: "My Collections | TCG All-in-One",
  description: "Manage your TCG card collections across Pokemon, Yu-Gi-Oh!, MTG, and One Piece.",
};

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const result = await getUserCollections(session.user.id);
  const collections = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collection</h1>
          <p className="text-muted-foreground">
            Manage your card collections across all supported games.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/collection/compare">
            <Button variant="outline">Compare</Button>
          </Link>
          <CreateCollectionDialog />
        </div>
      </div>
      <CollectionList collections={collections} />
    </div>
  );
}
