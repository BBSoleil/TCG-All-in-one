"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";
import { profileSchema } from "@/features/auth/schemas";
import type { AuthActionState } from "@/features/auth/types";

export async function updateProfile(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to update your profile" };
  }

  const raw = { name: formData.get("name") };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  return { success: true };
}
