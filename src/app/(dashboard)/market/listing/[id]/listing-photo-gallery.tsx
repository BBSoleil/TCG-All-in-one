"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function ListingPhotoGallery({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [current, setCurrent] = useState(0);
  const [errored, setErrored] = useState<Set<number>>(new Set());

  if (photos.length === 0) return null;

  return (
    <div className="w-48 shrink-0 space-y-2">
      <div className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-lg bg-muted">
        {errored.has(current) ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Image unavailable
          </div>
        ) : (
          <Image
            src={photos[current]}
            alt={`${alt} - photo ${current + 1}`}
            fill
            className="object-cover"
            sizes="192px"
            onError={() => setErrored((prev) => new Set(prev).add(current))}
          />
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setCurrent((c) => (c - 1 + photos.length) % photos.length)}
          >
            &larr;
          </Button>
          <div className="flex gap-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === current ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setCurrent((c) => (c + 1) % photos.length)}
          >
            &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}
