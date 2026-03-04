"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CARD_CONDITIONS } from "@/shared/constants";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price Low-High" },
  { value: "price_desc", label: "Price High-Low" },
];

export function MarketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/market?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      updateParam("q", formData.get("q") as string);
    },
    [updateParam],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <form onSubmit={handleSearch} className="flex flex-1 gap-2">
        <Input
          name="q"
          placeholder="Search listings..."
          defaultValue={searchParams.get("q") ?? ""}
          className="min-w-0 flex-1 sm:max-w-xs"
        />
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Select
          defaultValue={searchParams.get("condition") ?? "all"}
          onValueChange={(v) => updateParam("condition", v)}
        >
          <SelectTrigger className="h-9 w-full sm:w-[150px]">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All conditions</SelectItem>
            {CARD_CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="Min $"
            className="h-9 w-[80px] text-sm"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => updateParam("minPrice", e.target.value)}
          />
          <span className="text-xs text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max $"
            className="h-9 w-[80px] text-sm"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => updateParam("maxPrice", e.target.value)}
          />
        </div>

        <Select
          defaultValue={searchParams.get("sort") ?? "newest"}
          onValueChange={(v) => updateParam("sort", v)}
        >
          <SelectTrigger className="h-9 w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
