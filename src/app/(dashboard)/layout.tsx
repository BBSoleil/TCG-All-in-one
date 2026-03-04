import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogoutButton } from "@/features/auth/components";
import { NotificationBell } from "@/features/notifications/components";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { NavLinks } from "@/shared/components";
import { MobileNav } from "@/features/shared/components/mobile-nav";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileNav userName={session.user.name ?? "User"} />

      <aside className="hidden w-64 flex-col border-r border-border bg-muted/30 md:flex">
        <div className="p-6">
          <Link href="/collection" className="text-lg font-bold">
            TCG All-in-One
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <NavLinks />
        </nav>

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
      </aside>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
