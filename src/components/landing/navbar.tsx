"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 border-white/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-display text-xl font-bold">
            TCG
          </div>
          <span className="font-display text-2xl tracking-wider text-shadow-neon group-hover:text-primary transition-colors">
            ALL-IN-ONE
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Pricing</Link>
          <Link href="/vision" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Vision</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
            <Search className="w-5 h-5" />
          </Button>
          {session?.user ? (
            <Link href="/collection">
              <Button variant="ghost" className="font-display tracking-widest text-lg">Go to Collection</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="font-display tracking-widest text-lg">Log In</Button>
              </Link>
              <Link href="/signup">
                <div className="p-[1px] rounded-md holo-gradient-bg cursor-pointer group animate-pulse-glow">
                  <div className="bg-background px-6 py-2 rounded-[5px] group-hover:bg-transparent transition-colors font-display text-lg tracking-widest text-white group-hover:text-shadow-neon">
                    Get Started
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden text-white">
          <Menu className="w-6 h-6" />
        </Button>
      </div>
    </nav>
  );
}
