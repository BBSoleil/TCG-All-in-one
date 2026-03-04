"use server";

import { signIn } from "@/auth";

export async function oauthSignIn(provider: "google" | "discord") {
  await signIn(provider, { redirectTo: "/collection" });
}
