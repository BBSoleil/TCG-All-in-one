"use client";

import { useState } from "react";
import { importYugioh } from "@/features/cards/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ImportYugiohSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [totalImported, setTotalImported] = useState(0);

  async function handleImport() {
    setLoading(true);
    setResult(null);
    const res = await importYugioh(totalImported);
    if (res.error) {
      setResult(`Error: ${res.error}`);
    } else {
      const newTotal = totalImported + (res.imported ?? 0);
      setTotalImported(newTotal);
      setResult(
        `Imported ${res.imported} cards (${newTotal} total)${res.hasMore ? " — more available" : " — done"}`,
      );
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 h-1.5 w-10 rounded-full bg-purple-600" />
        <CardTitle>Yu-Gi-Oh!</CardTitle>
        <CardDescription>
          Import 50 cards at a time from YGOProDeck
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {totalImported > 0
            ? `${totalImported} cards imported so far`
            : "Click to start importing cards"}
        </p>
        <Button
          onClick={handleImport}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Importing..." : totalImported > 0 ? "Import more" : "Import cards"}
        </Button>
        {result && (
          <p className={`text-sm ${result.startsWith("Error") ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
            {result}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
