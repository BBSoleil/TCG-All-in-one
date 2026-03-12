"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateBioAction } from "@/features/social/actions";

export function BioForm({ bio }: { bio: string }) {
  const [value, setValue] = useState(bio);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateBioAction(value);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Bio updated!");
        }
      } catch {
        toast.error("Failed to update bio");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Write a short bio..."
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {value.length}/500
        </span>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save Bio"}
        </Button>
      </div>
    </form>
  );
}
