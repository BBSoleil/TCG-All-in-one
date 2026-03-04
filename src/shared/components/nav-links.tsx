"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/" },
  { label: "Collection", href: "/collection" },
  { label: "Cards", href: "/cards" },
  { label: "Analytics", href: "/analytics" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Market", href: "/market" },
  { label: "Decks", href: "/decks" },
  { label: "Social", href: "/social" },
  { label: "Leaderboards", href: "/leaderboards" },
  { label: "Profile", href: "/profile" },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
