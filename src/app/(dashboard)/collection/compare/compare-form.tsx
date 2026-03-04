"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CollectionOption {
  id: string;
  name: string;
  _count: { cards: number };
}

export function CompareForm({
  collections,
  defaultA,
  defaultB,
}: {
  collections: CollectionOption[];
  defaultA: string;
  defaultB: string;
}) {
  return (
    <form className="space-y-4">
      <div>
        <label className="text-sm font-medium">Collection A</label>
        <Select name="a" defaultValue={defaultA || undefined}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({c._count.cards} cards)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Collection B</label>
        <Select name="b" defaultValue={defaultB || undefined}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({c._count.cards} cards)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">Compare</Button>
    </form>
  );
}
