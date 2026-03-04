import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { CreateListingForm } from "@/features/market/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sell a Card | TCG All-in-One",
  description: "Create a listing to sell or trade your cards.",
};

export default async function SellPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/market">
          <Button variant="ghost" size="sm">&larr; Back</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateListingForm />
        </CardContent>
      </Card>
    </div>
  );
}
