import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CardBrowserClient } from "@/features/cards/components";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const SavedSearchesWrapper = dynamic(
  () => import("@/features/cards/components/saved-searches-wrapper").then((m) => ({ default: m.SavedSearchesWrapper })),
);

export const metadata: Metadata = {
  title: "Card Browser | TCG All-in-One",
  description: "Browse and search 90,000+ cards across Pokemon, Yu-Gi-Oh!, Magic: The Gathering, and One Piece.",
};

// Zero-SSR page: renders a static shell instantly, CardBrowserClient fetches data on mount via cached API routes.
// This avoids 5-13s SSR queries against Supabase EU from Vercel US that cause "Page not responding" crashes.
export default function CardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Card Browser</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Search and browse cards across all supported games.
          </p>
        </div>
        <Link href="/cards/import" className="shrink-0">
          <Button variant="outline" className="w-full sm:w-auto">Import cards</Button>
        </Link>
      </div>

      <Suspense>
        <SavedSearchesWrapper />
      </Suspense>

      <Suspense>
        <CardBrowserClient />
      </Suspense>
    </div>
  );
}
