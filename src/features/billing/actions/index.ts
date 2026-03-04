"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createCheckoutSession, createPortalSession } from "../services";

export async function checkoutAction(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const baseUrl = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";
  const result = await createCheckoutSession(
    session.user.id,
    `${baseUrl}/profile`,
  );

  if (!result.success) return { error: result.error.message };

  redirect(result.data.url);
}

export async function portalAction(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const baseUrl = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";
  const result = await createPortalSession(
    session.user.id,
    `${baseUrl}/profile`,
  );

  if (!result.success) return { error: result.error.message };

  redirect(result.data.url);
}
