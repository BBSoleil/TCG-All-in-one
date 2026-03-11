"use client";

import { useState } from "react";
import Image from "next/image";
import type { GameType } from "@/shared/types";
import { GAME_CONFIG, isHoloRarity } from "@/shared/constants/game-config";
import { GAME_COLORS } from "@/shared/constants";

export type CardImageSize = "thumb" | "small" | "medium" | "large" | "detail";

const VALID_GAMES = new Set<string>(["POKEMON", "YUGIOH", "MTG", "ONEPIECE"]);

function toGameType(game: string): GameType {
  return VALID_GAMES.has(game) ? (game as GameType) : "POKEMON";
}

interface CardImageProps {
  src: string | null;
  alt: string;
  gameType: string;
  rarity?: string | null;
  size: CardImageSize;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

/** Fixed dimensions per size (no aspect-ratio needed) */
const FIXED_SIZES: Partial<Record<CardImageSize, { w: number; h: number }>> = {
  thumb: { w: 24, h: 32 },
  small: { w: 56, h: 80 },
  medium: { w: 128, h: 176 },
};

/** responsive sizes hints per variant */
const DEFAULT_SIZES: Record<CardImageSize, string> = {
  thumb: "24px",
  small: "56px",
  medium: "128px",
  large: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  detail: "300px",
};

/**
 * Static glow class map — keys must be literal so Tailwind can detect them.
 * Falls back to a generic purple glow if gameType is somehow unknown.
 */
const GLOW_CLASSES: Record<string, string> = {
  POKEMON: "group-hover:shadow-yellow-500/40",
  YUGIOH: "group-hover:shadow-purple-500/40",
  MTG: "group-hover:shadow-red-500/40",
  ONEPIECE: "group-hover:shadow-blue-500/40",
};

export function CardImage({
  src,
  alt,
  gameType,
  rarity,
  size,
  priority = false,
  sizes: sizesProp,
  className = "",
}: CardImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const game = toGameType(gameType);
  const showFallback = !src || errored;
  const showHolo = isHoloRarity(game, rarity ?? null);
  const fixed = FIXED_SIZES[size];
  const sizesAttr = sizesProp ?? DEFAULT_SIZES[size];
  const glowClass = GLOW_CLASSES[game] ?? "group-hover:shadow-purple-500/40";
  const aspectRatio = GAME_CONFIG[game].cardRatio;
  // optcgapi.com blocks Next.js image optimizer — bypass it
  const unoptimized = game === "ONEPIECE";

  // For thumb/small/medium we use fixed pixel dimensions
  if (fixed) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded ${className}`}
        style={{ width: fixed.w, height: fixed.h }}
      >
        {showFallback ? (
          <Fallback gameType={gameType} />
        ) : (
          <>
            {!loaded && <Skeleton />}
            <Image
              src={src}
              alt={alt}
              fill
              sizes={sizesAttr}
              unoptimized={unoptimized}
              className={`object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              priority={priority}
            />
            {showHolo && loaded && <HoloOverlay />}
          </>
        )}
      </div>
    );
  }

  // For large/detail we use aspect-ratio
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border transition-shadow duration-300 group-hover:shadow-lg ${glowClass} ${className}`}
      style={{ aspectRatio }}
    >
      {showFallback ? (
        <Fallback gameType={gameType} />
      ) : (
        <>
          {!loaded && <Skeleton />}
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizesAttr}
            unoptimized={unoptimized}
            className={`object-cover transition-all duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            } ${size === "large" ? "group-hover:scale-[1.02]" : ""}`}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            priority={priority}
          />
          {showHolo && loaded && <HoloOverlay />}
        </>
      )}
    </div>
  );
}

/** Animated shimmer skeleton */
function Skeleton() {
  return (
    <div className="absolute inset-0 bg-muted">
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsla(0 0% 100% / 0.08), transparent)",
          animation: "shimmer 1.5s infinite",
        }}
      />
    </div>
  );
}

/** Holographic overlay for rare cards */
function HoloOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30"
      style={{
        background:
          "conic-gradient(from 0deg, hsl(var(--holo-1)), hsl(var(--holo-2)), hsl(var(--holo-3)), hsl(var(--holo-1)))",
        backgroundSize: "300% 300%",
        animation: "holo-gradient 4s ease infinite",
      }}
    />
  );
}

/** Game-colored placeholder when image is missing or broken */
function Fallback({ gameType }: { gameType: string }) {
  const bgClass = GAME_COLORS[gameType] ?? "bg-gray-500";
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <div className="text-center">
        <div className={`mx-auto mb-1 h-1.5 w-6 rounded-full ${bgClass}`} />
        <span className="text-[10px] text-muted-foreground">No image</span>
      </div>
    </div>
  );
}
