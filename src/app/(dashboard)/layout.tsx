import Link from "next/link";
import { NavLinks } from "@/shared/components";
import { MobileNav } from "@/features/shared/components/mobile-nav";
import { SidebarUser } from "@/features/shared/components/sidebar-user";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileNav />

      <aside className="hidden w-64 flex-col border-r border-border bg-muted/30 md:flex">
        <div className="p-6">
          <Link href="/collection" className="text-lg font-bold">
            TCG All-in-One
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <NavLinks />
        </nav>

        <SidebarUser />
      </aside>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
