"use client";

import { useState, useEffect } from "react";
import { importMtg, getMtgSets } from "@/features/cards/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ImportMtgSection() {
  const [sets, setSets] = useState<{ code: string; name: string; card_count: number }[]>([]);
  const [selectedSet, setSelectedSet] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    getMtgSets().then(setSets);
  }, []);

  async function handleImport() {
    if (!selectedSet) return;
    setLoading(true);
    setResult(null);
    const res = await importMtg(selectedSet);
    if (res.error) {
      setResult(`Error: ${res.error}`);
    } else {
      setResult(`Imported ${res.imported} MTG cards`);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 h-1.5 w-10 rounded-full bg-red-600" />
        <CardTitle>Magic: The Gathering</CardTitle>
        <CardDescription>Import cards from Scryfall by set</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedSet} onValueChange={setSelectedSet}>
          <SelectTrigger>
            <SelectValue placeholder="Select a set" />
          </SelectTrigger>
          <SelectContent>
            {sets.map((set) => (
              <SelectItem key={set.code} value={set.code}>
                {set.name} ({set.card_count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleImport}
          disabled={!selectedSet || loading}
          className="w-full"
        >
          {loading ? "Importing..." : "Import set"}
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
