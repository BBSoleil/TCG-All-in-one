"use client";

import { useState, useEffect } from "react";
import { importYugioh, getYugiohSets } from "@/features/cards/actions";
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

export function ImportYugiohSection() {
  const [sets, setSets] = useState<{ set_name: string; set_code: string; num_of_cards: number }[]>(
    [],
  );
  const [selectedSet, setSelectedSet] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    getYugiohSets().then(setSets);
  }, []);

  async function handleImport() {
    if (!selectedSet) return;
    setLoading(true);
    setResult(null);
    const res = await importYugioh(0, selectedSet);
    if (res.error) {
      setResult(`Error: ${res.error}`);
    } else {
      setResult(`Imported ${res.imported} cards from ${selectedSet}`);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 h-1.5 w-10 rounded-full bg-purple-600" />
        <CardTitle>Yu-Gi-Oh!</CardTitle>
        <CardDescription>Import cards from YGOProDeck by set</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedSet} onValueChange={setSelectedSet}>
          <SelectTrigger>
            <SelectValue placeholder="Select a set" />
          </SelectTrigger>
          <SelectContent>
            {sets.map((set) => (
              <SelectItem key={set.set_code} value={set.set_name}>
                {set.set_name} ({set.num_of_cards})
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
          <p
            className={`text-sm ${
              result.startsWith("Error")
                ? "text-destructive"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {result}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
