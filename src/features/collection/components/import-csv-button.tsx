"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportResult {
  imported: number;
  total: number;
  errors: string[];
}

export function ImportCSVButton({ collectionId, onImported }: { collectionId: string; onImported?: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/collection/${collectionId}/import`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Import failed");
          return;
        }

        setResult(data as ImportResult);
        if (onImported) {
          onImported();
        } else {
          router.refresh();
        }
      } catch {
        setError("Upload failed. Please try again.");
      }

      // Reset file input
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload CSV file"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        <Upload className="mr-1 h-4 w-4" />
        {isPending ? "Importing..." : "Import CSV"}
      </Button>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      {result && (
        <div className="mt-2 text-sm">
          <p className="text-emerald-600 dark:text-emerald-400">
            Imported {result.imported}/{result.total} cards.
          </p>
          {result.errors.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer text-muted-foreground">
                {result.errors.length} warning{result.errors.length !== 1 ? "s" : ""}
              </summary>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {result.errors.slice(0, 20).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {result.errors.length > 20 && (
                  <li>...and {result.errors.length - 20} more</li>
                )}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
