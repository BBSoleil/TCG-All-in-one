"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Authentication Error</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Something went wrong during authentication."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/login">
          <Button variant="outline">Back to login</Button>
        </Link>
      </div>
    </div>
  );
}
