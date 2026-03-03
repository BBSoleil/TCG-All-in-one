import Link from "next/link";

const GAMES = [
  {
    name: "Pokemon TCG",
    key: "pokemon",
    color: "bg-yellow-500",
    description: "Catch, collect, and battle with Pokemon cards",
  },
  {
    name: "Yu-Gi-Oh!",
    key: "yugioh",
    color: "bg-purple-600",
    description: "It's time to duel with the ultimate card game",
  },
  {
    name: "Magic: The Gathering",
    key: "mtg",
    color: "bg-red-600",
    description: "The original trading card game experience",
  },
  {
    name: "One Piece Card Game",
    key: "onepiece",
    color: "bg-blue-600",
    description: "Set sail with the Straw Hat crew",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight">TCG All-in-One</h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your entire card collection,
            <br />
            <span className="text-primary">one platform.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Track, value, and manage your Pokemon, Yu-Gi-Oh!, Magic: The
            Gathering, and One Piece card collections in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started free
            </Link>
            <Link
              href="#games"
              className="rounded-md border border-border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              Learn more
            </Link>
          </div>
        </section>

        {/* Supported Games */}
        <section id="games" className="border-t border-border bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h3 className="text-center text-2xl font-bold tracking-tight">
              Supported Games
            </h3>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {GAMES.map((game) => (
                <div
                  key={game.key}
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <div
                    className={`mb-4 h-2 w-12 rounded-full ${game.color}`}
                  />
                  <h4 className="font-semibold">{game.name}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {game.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <h3 className="text-center text-2xl font-bold tracking-tight">
              Everything you need
            </h3>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Collection Tracking",
                  desc: "Organize cards across all supported games with conditions, quantities, and notes.",
                },
                {
                  title: "Market Valuation",
                  desc: "Real-time price tracking and portfolio value analysis.",
                },
                {
                  title: "Deck Builder",
                  desc: "Build decks with legality checks and synergy analysis.",
                },
                {
                  title: "Price Alerts",
                  desc: "Get notified when cards on your wishlist hit your target price.",
                },
                {
                  title: "Community",
                  desc: "Share collections, follow other collectors, earn achievement badges.",
                },
                {
                  title: "Marketplace",
                  desc: "Buy, sell, and trade cards with smart matching.",
                },
              ].map((feature) => (
                <div key={feature.title}>
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>TCG All-in-One. Built for collectors, by collectors.</p>
        </div>
      </footer>
    </div>
  );
}
