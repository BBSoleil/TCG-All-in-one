import { vi } from "vitest";

// Mock next/cache — unstable_cache should pass through to the original function
vi.mock("next/cache", () => ({
  unstable_cache: (fn: Function) => fn,
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
