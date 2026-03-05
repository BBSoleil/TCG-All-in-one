"use client";

import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { LogoutButton } from "@/features/auth/components";
import dynamic from "next/dynamic";

const NotificationBell = dynamic(
  () => import("@/features/notifications/components").then((m) => ({ default: m.NotificationBell })),
);

export function SidebarUser() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="border-t border-border p-4">
        <div className="h-10 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {session.user.name ?? "User"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {session.user.email}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
