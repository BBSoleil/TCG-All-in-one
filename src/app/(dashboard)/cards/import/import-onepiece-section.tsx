"use client";

import { useState, useEffect } from "react";
import {
  importOnePiece,
  importOnePieceStarters,
  getOnePieceSets,
} from "@/features/cards/actions";
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

export function ImportOnePieceSection() {
  const [sets, setSets] = useState<{ id: string; name: string }[]>([]);
  const [selectedSet, setSelectedSet] = useState("");
  const [loading, setLoading] = useState(false);
  const [starterLoading, setStarterLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    getOnePieceSets().then(setSets);
  }, []);

  async function handleImport() {
    if (!selectedSet) return;
    setLoading(true);
    setResult(null);
    const res = await importOnePiece(selectedSet);
    if (res.error) {
      setResult(`Error: ${res.error}`);
    } else {
      setResult(`Imported ${res.imported} One Piece cards`);
    }
    setLoading(false);
  }

  async function handleImportStarters() {
    setStarterLoading(true);
    setResult(null);
    const res = await importOnePieceStarters();
    if (res.error) {
      setResult(`Error: ${res.error}`);
    } else {
      setResult(`Imported ${res.imported} starter deck cards`);
    }
    setStarterLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 h-1.5 w-10 rounded-full bg-blue-500" />
        <CardTitle>One Piece Card Game</CardTitle>
        <CardDescription>Import cards from OPTCG API by set</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedSet} onValueChange={setSelectedSet}>
          <SelectTrigger>
            <SelectValue placeholder="Select a set" />
          </SelectTrigger>
          <SelectContent>
            {sets.map((set) => (
              <SelectItem key={set.id} value={set.id}>
                {set.name} ({set.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleImport}
          disabled={!selectedSet || loading || starterLoading}
          className="w-full"
        >
          {loading ? "Importing..." : "Import set"}
        </Button>
        <Button
          onClick={handleImportStarters}
          disabled={loading || starterLoading}
          variant="outline"
          className="w-full"
        >
          {starterLoading ? "Importing..." : "Import all starter decks"}
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
