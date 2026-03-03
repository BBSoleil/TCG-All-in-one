export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder */}
      <aside className="hidden w-64 border-r border-border bg-muted/30 md:block">
        <div className="p-6">
          <h2 className="text-lg font-bold">TCG All-in-One</h2>
        </div>
        <nav className="space-y-1 px-3">
          <div className="rounded-md px-3 py-2 text-sm text-muted-foreground">
            Dashboard
          </div>
          <div className="rounded-md px-3 py-2 text-sm text-muted-foreground">
            Collection
          </div>
          <div className="rounded-md px-3 py-2 text-sm text-muted-foreground">
            Market
          </div>
          <div className="rounded-md px-3 py-2 text-sm text-muted-foreground">
            Decks
          </div>
          <div className="rounded-md px-3 py-2 text-sm text-muted-foreground">
            Social
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
