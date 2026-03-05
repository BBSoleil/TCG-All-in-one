"use client";

import { useState, useEffect } from "react";
import { SavedSearches } from "./saved-searches";
import type { SavedSearchItem } from "../services/saved-searches";

export function SavedSearchesWrapper() {
  const [searches, setSearches] = useState<SavedSearchItem[]>([]);

  useEffect(() => {
    fetch("/api/saved-searches")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSearches(data);
      })
      .catch(() => {});
  }, []);

  return <SavedSearches searches={searches} />;
}
