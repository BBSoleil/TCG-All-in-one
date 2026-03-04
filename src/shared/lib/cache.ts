import { unstable_cache } from "next/cache";

/**
 * Type-safe wrapper around Next.js unstable_cache with tag-based revalidation.
 * Usage: const getCachedData = cached(fn, ["tag1"], { revalidate: 60 })
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- unstable_cache has loose typing
export function cached<A extends any[], R>(
  fn: (...args: A) => Promise<R>,
  tags: string[],
  options: { revalidate?: number } = {},
): (...args: A) => Promise<R> {
  return unstable_cache(fn, tags, {
    tags,
    revalidate: options.revalidate ?? 60,
  }) as (...args: A) => Promise<R>;
}
