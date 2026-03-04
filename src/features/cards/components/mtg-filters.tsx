"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MTG_COLORS = [
  { code: "W", label: "White", className: "bg-amber-100 text-amber-900 border-amber-300" },
  { code: "U", label: "Blue", className: "bg-blue-100 text-blue-900 border-blue-300" },
  { code: "B", label: "Black", className: "bg-gray-800 text-gray-100 border-gray-600" },
  { code: "R", label: "Red", className: "bg-red-100 text-red-900 border-red-300" },
  { code: "G", label: "Green", className: "bg-green-100 text-green-900 border-green-300" },
];

export function MtgFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentColors = searchParams.get("mtgColors")?.split(",").filter(Boolean) ?? [];

  const toggleColor = useCallback(
    (code: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const colors = new Set(currentColors);
      if (colors.has(code)) {
        colors.delete(code);
      } else {
        colors.add(code);
      }
      if (colors.size > 0) {
        params.set("mtgColors", [...colors].join(","));
      } else {
        params.delete("mtgColors");
      }
      params.delete("page");
      router.push(`/cards?${params.toString()}`);
    },
    [router, searchParams, currentColors],
  );

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/cards?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
      <span className="text-xs font-medium text-muted-foreground">MTG:</span>
      <div className="flex gap-1">
        {MTG_COLORS.map((c) => (
          <Button
            key={c.code}
            variant="outline"
            size="sm"
            className={`h-7 w-7 rounded-full border p-0 text-xs ${
              currentColors.includes(c.code) ? c.className : "opacity-40"
            }`}
            onClick={() => toggleColor(c.code)}
            title={c.label}
            aria-label={`Filter by ${c.label}`}
            aria-pressed={currentColors.includes(c.code)}
          >
            {c.code}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">CMC:</span>
        <Input
          type="number"
          placeholder="Min"
          className="h-8 w-[70px] text-xs"
          defaultValue={searchParams.get("mtgCmcMin") ?? ""}
          onBlur={(e) => updateParam("mtgCmcMin", e.target.value)}
          aria-label="Minimum converted mana cost"
        />
        <span className="text-xs text-muted-foreground">-</span>
        <Input
          type="number"
          placeholder="Max"
          className="h-8 w-[70px] text-xs"
          defaultValue={searchParams.get("mtgCmcMax") ?? ""}
          onBlur={(e) => updateParam("mtgCmcMax", e.target.value)}
          aria-label="Maximum converted mana cost"
        />
      </div>

      <Input
        placeholder="Type line..."
        className="h-8 w-[150px] text-xs"
        defaultValue={searchParams.get("mtgTypeLine") ?? ""}
        onBlur={(e) => updateParam("mtgTypeLine", e.target.value)}
        aria-label="Filter by type line"
      />
    </div>
  );
}
