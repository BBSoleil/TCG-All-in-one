"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";
import { cookies } from "next/headers";

export async function debugAction(): Promise<Record<string, unknown>> {
  try {
    // Check cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll().map((c) => c.name);
    const hasSessionToken =
      allCookies.includes("authjs.session-token") ||
      allCookies.includes("__Secure-authjs.session-token");

    // Check auth
    let session: Record<string, unknown> | null = null;
    let authError: string | null = null;
    try {
      const s = await auth();
      session = s
        ? {
            userId: s.user?.id ?? null,
            email: s.user?.email ?? null,
            name: s.user?.name ?? null,
            expires: s.expires ?? null,
          }
        : null;
    } catch (e) {
      authError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }

    // Check DB
    let dbConnected = false;
    let cardCount = 0;
    try {
      cardCount = await prisma.card.count({ take: 1 });
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    return {
      cookies: allCookies,
      hasSessionToken,
      session,
      authError,
      dbConnected,
      cardCount,
      env: {
        hasAuthSecret: !!process.env["AUTH_SECRET"],
        hasAuthUrl: !!process.env["AUTH_URL"],
        authUrl: process.env["AUTH_URL"] ?? "(not set)",
        hasDbUrl: !!process.env["DATABASE_URL"],
        nodeEnv: process.env["NODE_ENV"],
      },
    };
  } catch (e) {
    return {
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }
}
