"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createListingAction, searchCardsForListing } from "../actions";
import {
  CURRENCY_OPTIONS,
  LISTING_LANGUAGE_OPTIONS,
  SHIPPING_ZONE_OPTIONS,
} from "../types";

const CONDITIONS = [
  "Mint",
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
];

interface CardOption {
  id: string;
  name: string;
  gameType: string;
  setName: string | null;
}

interface ShippingZoneEntry {
  zone: string;
  price: string;
  currency: string;
  estimatedMin: string;
  estimatedMax: string;
}

export function CreateListingForm() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CardOption[]>([]);
  const [selected, setSelected] = useState<CardOption | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();
  const [error, setError] = useState("");

  // Photo upload state
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Shipping zones state
  const [showShipping, setShowShipping] = useState(false);
  const [shippingZones, setShippingZones] = useState<ShippingZoneEntry[]>([]);

  function handleSearch() {
    if (!search.trim()) return;
    startSearch(async () => {
      try {
        const cards = await searchCardsForListing(search.trim());
        setResults(cards);
        if (cards.length === 0) {
          toast.info("No cards found");
        }
      } catch {
        toast.error("Search failed");
      }
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (photos.length + files.length > 6) {
      toast.error("Maximum 6 photos allowed");
      return;
    }

    setIsUploading(true);
    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.error) {
          toast.error(`${file.name}: ${data.error}`);
        } else {
          newPhotos.push(data.url);
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    setIsUploading(false);
    e.target.value = "";
  }

  function addShippingZone() {
    const usedZones = new Set(shippingZones.map((sz) => sz.zone));
    const available = SHIPPING_ZONE_OPTIONS.filter((z) => !usedZones.has(z));
    if (available.length === 0) {
      toast.info("All shipping zones already added");
      return;
    }
    setShippingZones((prev) => [
      ...prev,
      { zone: available[0], price: "0", currency: "EUR", estimatedMin: "3", estimatedMax: "7" },
    ]);
  }

  function removeShippingZone(index: number) {
    setShippingZones((prev) => prev.filter((_, i) => i !== index));
  }

  function updateShippingZone(index: number, field: keyof ShippingZoneEntry, value: string) {
    setShippingZones((prev) =>
      prev.map((sz, i) => (i === index ? { ...sz, [field]: value } : sz)),
    );
  }

  function handleSubmit(formData: FormData) {
    if (!selected) return;
    formData.set("cardId", selected.id);
    formData.set("photos", JSON.stringify(photos));
    if (shippingZones.length > 0) {
      formData.set(
        "shippingZones",
        JSON.stringify(
          shippingZones.map((sz) => ({
            zone: sz.zone,
            price: Number(sz.price),
            currency: sz.currency,
            estimatedMin: Number(sz.estimatedMin),
            estimatedMax: Number(sz.estimatedMax),
          })),
        ),
      );
    }
    startSubmit(async () => {
      try {
        const result = await createListingAction(formData);
        if (result.error) {
          setError(result.error);
          toast.error(result.error);
        } else {
          toast.success("Listing created!");
          router.push("/market");
        }
      } catch {
        toast.error("Failed to create listing");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label>Card</Label>
        {selected ? (
          <div className="flex items-center justify-between rounded-md border border-input p-2">
            <span className="text-sm font-medium">{selected.name}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSelected(null); setResults([]); }}>
              Change
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Search for a card..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                aria-label="Search cards to list"
              />
              <Button type="button" onClick={handleSearch} disabled={isSearching || !search.trim()}>
                {isSearching ? "..." : "Search"}
              </Button>
            </div>
            {results.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded border border-input">
                {results.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelected(card)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{card.name}</span>
                    {card.setName && <span className="text-xs text-muted-foreground">({card.setName})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="listing-price">Price</Label>
          <Input id="listing-price" name="price" type="number" step="0.01" min="0" defaultValue="0" />
        </div>
        <div>
          <Label htmlFor="listing-currency">Currency</Label>
          <select
            id="listing-currency"
            name="currency"
            defaultValue="EUR"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c === "EUR" ? "€ EUR" : "$ USD"}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="listing-quantity">Quantity</Label>
          <Input id="listing-quantity" name="quantity" type="number" min="1" defaultValue="1" />
        </div>
        <div>
          <Label htmlFor="listing-language">Card Language</Label>
          <select
            id="listing-language"
            name="language"
            defaultValue="EN"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {LISTING_LANGUAGE_OPTIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="listing-condition">Condition</Label>
        <select
          id="listing-condition"
          name="condition"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Photo upload */}
      <div>
        <Label>Photos (up to 6)</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {photos.map((url, i) => (
            <div key={url} className="relative h-16 w-16 rounded border border-input overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < 6 && (
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded border border-dashed border-input text-muted-foreground hover:border-primary hover:text-primary">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoUpload}
                disabled={isUploading}
                className="hidden"
              />
              {isUploading ? "..." : "+"}
            </label>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="listing-description">Description (optional)</Label>
        <Input id="listing-description" name="description" placeholder="Any additional details..." />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isTradeOnly" value="true" />
        Trade only (no cash offers)
      </label>

      {/* Shipping zones */}
      <div className="rounded-md border border-input p-3">
        <button
          type="button"
          onClick={() => setShowShipping(!showShipping)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {showShipping ? "▼ Shipping info" : "▶ Add shipping info (optional)"}
        </button>
        {showShipping && (
          <div className="mt-3 space-y-3">
            {shippingZones.map((sz, i) => (
              <div key={sz.zone} className="flex flex-wrap items-end gap-2 rounded border border-input p-2">
                <div>
                  <Label className="text-xs">Zone</Label>
                  <select
                    value={sz.zone}
                    onChange={(e) => updateShippingZone(i, "zone", e.target.value)}
                    className="rounded border border-input bg-background px-2 py-1 text-xs"
                  >
                    {SHIPPING_ZONE_OPTIONS.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sz.price}
                    onChange={(e) => updateShippingZone(i, "price", e.target.value)}
                    className="h-7 w-20 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Days (min-max)</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      min="1"
                      value={sz.estimatedMin}
                      onChange={(e) => updateShippingZone(i, "estimatedMin", e.target.value)}
                      className="h-7 w-14 text-xs"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={sz.estimatedMax}
                      onChange={(e) => updateShippingZone(i, "estimatedMax", e.target.value)}
                      className="h-7 w-14 text-xs"
                    />
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeShippingZone(i)} className="h-7 text-xs text-destructive">
                  Remove
                </Button>
              </div>
            ))}
            {shippingZones.length < 3 && (
              <Button type="button" variant="outline" size="sm" onClick={addShippingZone} className="text-xs">
                + Add shipping zone
              </Button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting || !selected}>
        {isSubmitting ? "Creating..." : "Create Listing"}
      </Button>
    </form>
  );
}
