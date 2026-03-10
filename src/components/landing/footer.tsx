import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background/80 backdrop-blur-md pt-20 pb-10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/10 blur-[120px] rounded-t-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 cursor-pointer group mb-6 inline-flex">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-display text-xl font-bold text-white">
                TCG
              </div>
              <span className="font-display text-2xl tracking-wider text-white">
                ALL-IN-ONE
              </span>
            </Link>
            <p className="text-muted-foreground font-sans max-w-sm mb-6">
              Turn your TCG collection into an intelligent portfolio, a social asset, and a competitive ecosystem.
            </p>
          </div>

          <div>
            <h4 className="font-display text-xl text-white mb-6 tracking-wider">PLATFORM</h4>
            <ul className="space-y-4 text-muted-foreground font-sans">
              <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/market" className="hover:text-primary transition-colors">Market Data</Link></li>
              <li><Link href="/decks" className="hover:text-primary transition-colors">Deck Builder</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xl text-white mb-6 tracking-wider">GAMES</h4>
            <ul className="space-y-4 text-muted-foreground font-sans">
              <li><span className="hover:text-secondary transition-colors cursor-default">Pokemon TCG</span></li>
              <li><span className="hover:text-secondary transition-colors cursor-default">Yu-Gi-Oh!</span></li>
              <li><span className="hover:text-secondary transition-colors cursor-default">Magic: The Gathering</span></li>
              <li><span className="hover:text-secondary transition-colors cursor-default">One Piece Card Game</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xl text-white mb-6 tracking-wider">COMMUNITY</h4>
            <ul className="space-y-4 text-muted-foreground font-sans">
              <li><span className="text-muted-foreground/50 cursor-default">Discord <span className="text-xs">(coming soon)</span></span></li>
              <li><span className="text-muted-foreground/50 cursor-default">Twitter / X <span className="text-xs">(coming soon)</span></span></li>
              <li><Link href="/vision" className="hover:text-accent transition-colors">About Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-sans">
          <p>&copy; {new Date().getFullYear()} TCG All-in-One. Built for collectors.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
