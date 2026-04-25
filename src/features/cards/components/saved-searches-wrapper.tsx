"use client";

import { use, useCallback, useState, useTransition } from "react";
import { SavedSearches } from "./saved-searches";
import type { SavedSearchItem } from "../services/saved-searches";

async function fetchSearches(): Promise<SavedSearchItem[]> {
  try {
    const res = await fetch("/api/saved-searches", { cache: "no-store" });
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as SavedSearchItem[]) : [];
  } catch {
    return [];
  }
}

// Module-scope promise — fetched once per page load, consumed via React 19 use()
// so the parent <Suspense> boundary handles the loading state. Refresh after a
// save/delete swaps the promise, triggering a re-render with fresh data.
// This avoids the fetch-in-useEffect pattern that triggers
// react-hooks/set-state-in-effect.
let searchesPromise: Promise<SavedSearchItem[]> = fetchSearches();

export function SavedSearchesWrapper() {
  const initial = use(searchesPromise);
  const [searches, setSearches] = useState(initial);
  const [, startTransition] = useTransition();

  const refresh = useCallback(() => {
    searchesPromise = fetchSearches();
    void searchesPromise.then((data) => {
      startTransition(() => setSearches(data));
    });
  }, []);

  return (
    <SavedSearches
      searches={searches}
      onDeleted={(id) => setSearches((prev) => prev.filter((s) => s.id !== id))}
      onSaved={refresh}
    />
  );
}
