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
          <Link href="/" className="flex items-center gap-2 text-lg font-bold group">
            <span className="inline-block h-7 w-7 rounded-lg bg-gradient-to-tr from-primary to-secondary text-center text-sm font-black leading-7 text-primary-foreground group-hover:shadow-[0_0_12px_hsla(var(--primary)/0.5)] transition-shadow">
              T
            </span>
            <span className="group-hover:text-primary transition-colors">TCG All-in-One</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <NavLinks />
        </nav>

        <SidebarUser />
      </aside>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
