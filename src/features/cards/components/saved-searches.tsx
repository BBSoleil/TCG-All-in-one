"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSearchAction, deleteSavedSearchAction } from "../actions/saved-search-actions";
import type { SavedSearchItem } from "../services/saved-searches";

interface SavedSearchesProps {
  searches: SavedSearchItem[];
  onDeleted?: (id: string) => void;
  onSaved?: () => void;
}

export function SavedSearches({ searches, onDeleted, onSaved }: SavedSearchesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleLoad(filters: string) {
    try {
      const parsed = JSON.parse(filters) as Record<string, string>;
      const params = new URLSearchParams(parsed);
      router.push(`/cards?${params.toString()}`);
    } catch {
      // invalid JSON, ignore
    }
  }

  function handleSave() {
    if (!name.trim()) return;

    const currentFilters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== "page") currentFilters[key] = value;
    });

    startTransition(async () => {
      await saveSearchAction(name.trim(), JSON.stringify(currentFilters));
      setName("");
      setShowSave(false);
      onSaved?.();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteSavedSearchAction(id);
      if (!result?.error) {
        onDeleted?.(id);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Bookmark className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Saved Searches</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 text-xs"
          onClick={() => setShowSave(!showSave)}
        >
          <Save className="mr-1 h-3 w-3" />
          Save current
        </Button>
      </div>

      {showSave && (
        <div className="flex gap-2">
          <Input
            placeholder="Search name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
            maxLength={100}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <Button size="sm" className="h-8" onClick={handleSave} disabled={isPending}>
            Save
          </Button>
        </div>
      )}

      {searches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {searches.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
            >
              <button
                className="hover:text-foreground text-muted-foreground transition-colors"
                onClick={() => handleLoad(s.filters)}
              >
                {s.name}
              </button>
              <button
                className="text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => handleDelete(s.id)}
                disabled={isPending}
                aria-label={`Delete saved search "${s.name}"`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
