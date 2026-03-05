/**
 * In-memory rate limiter for server actions.
 * Tracks request counts per key within a sliding window.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Max requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and consume a rate limit token.
 * @param key - Unique identifier (e.g., `${userId}:${action}`)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // Window expired or first request — start new window
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Pre-configured rate limiters for common actions
export const RATE_LIMITS = {
  createListing: { maxRequests: 10, windowMs: 60_000 },
  makeOffer: { maxRequests: 10, windowMs: 60_000 },
  followUser: { maxRequests: 20, windowMs: 60_000 },
  importCards: { maxRequests: 5, windowMs: 60_000 },
  cardSearch: { maxRequests: 60, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;
