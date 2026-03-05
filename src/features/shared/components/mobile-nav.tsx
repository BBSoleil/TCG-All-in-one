"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { NavLinks } from "@/shared/components";

export function MobileNav() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "User";
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <Link href="/collection" className="text-lg font-bold" onClick={() => setOpen(false)}>
          TCG All-in-One
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
          >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-b border-border bg-muted/30 px-3 py-2">
          <NavLinks onNavigate={() => setOpen(false)} />
          <div className="mt-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
            {userName}
          </div>
        </nav>
      )}
    </div>
  );
}
