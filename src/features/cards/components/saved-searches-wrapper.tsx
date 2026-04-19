"use client";

import { useState, useEffect, useCallback } from "react";
import { SavedSearches } from "./saved-searches";
import type { SavedSearchItem } from "../services/saved-searches";

export function SavedSearchesWrapper() {
  const [searches, setSearches] = useState<SavedSearchItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/saved-searches", { cache: "no-store" });
      const data = (await res.json()) as unknown;
      if (Array.isArray(data)) setSearches(data as SavedSearchItem[]);
    } catch {
      /* swallow */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SavedSearches
      searches={searches}
      onDeleted={(id) => setSearches((prev) => prev.filter((s) => s.id !== id))}
      onSaved={() => void refresh()}
    />
  );
}
