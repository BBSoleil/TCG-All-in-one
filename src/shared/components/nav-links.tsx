"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Search,
  BarChart3,
  ShoppingCart,
  Heart,
  Swords,
  Users,
  Trophy,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Collection", href: "/collection", icon: Library },
      { label: "Cards", href: "/cards", icon: Search },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Trade",
    items: [
      { label: "Market", href: "/market", icon: ShoppingCart },
      { label: "Wishlist", href: "/wishlist", icon: Heart },
    ],
  },
  {
    title: "Play",
    items: [
      { label: "Decks", href: "/decks", icon: Swords },
    ],
  },
  {
    title: "Social",
    items: [
      { label: "Social", href: "/social", icon: Users },
      { label: "Leaderboards", href: "/leaderboards", icon: Trophy },
    ],
  },
  {
    title: "Me",
    items: [
      { label: "Profile", href: "/profile", icon: User },
    ],
  },
];

// Flat list for backward compatibility
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            {group.title}
          </p>
          {group.items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium nav-active-holo"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
