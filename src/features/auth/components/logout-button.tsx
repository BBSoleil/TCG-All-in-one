"use client";

import { logout } from "@/features/auth/actions/logout";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost" size="sm" type="submit">
        Log out
      </Button>
    </form>
  );
}
