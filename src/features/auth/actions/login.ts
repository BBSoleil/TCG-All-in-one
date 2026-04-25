"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { loginSchema } from "@/features/auth/schemas";
import type { AuthActionState } from "@/features/auth/types";

export async function login(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const submittedEmail = typeof raw.email === "string" ? raw.email : "";

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors, email: submittedEmail };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email or password", email: submittedEmail };
      }
      return { error: "Something went wrong. Please try again.", email: submittedEmail };
    }
    // NextAuth redirects throw NEXT_REDIRECT which must be re-thrown
    throw error;
  }

  return { success: true };
}
