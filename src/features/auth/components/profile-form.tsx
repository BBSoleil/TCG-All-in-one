"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/features/auth/actions/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/features/auth/types";

const initialState: AuthActionState = {};

export function ProfileForm({ name }: { name: string | null }) {
  const [state, formAction, isPending] = useActionState(
    async (prev: AuthActionState, formData: FormData) => {
      try {
        const result = await updateProfile(prev, formData);
        if (result.success) {
          toast.success("Profile updated!");
        } else if (result.error) {
          toast.error(result.error);
        }
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        toast.error(msg);
        return { error: msg };
      }
    },
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name ?? ""}
        />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
