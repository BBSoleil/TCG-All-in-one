"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function CardPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    startTransition(() => {
      router.push(`/cards?${params.toString()}`);
    });
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1 || isPending}
        onClick={() => goToPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages || isPending}
        onClick={() => goToPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
