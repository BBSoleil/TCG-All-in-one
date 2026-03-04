import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components";

export const metadata: Metadata = {
  title: "Log In | TCG All-in-One",
  description: "Sign in to your TCG All-in-One account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none hidden sm:block" />

      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-8 sm:left-8 text-white font-display text-xl tracking-wider hover:text-primary transition-colors flex items-center gap-2 z-20"
      >
        &larr; BACK TO VAULT
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel border-white/10 p-4 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          {/* Top holographic border strip */}
          <div className="absolute top-0 left-0 right-0 h-1 holo-gradient-bg" />

          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-4xl font-display text-white tracking-wider mb-2">ACCESS VAULT</h1>
            <p className="text-muted-foreground font-sans">Enter your credentials to continue</p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-muted-foreground font-sans text-sm">
              Don&apos;t have a vault yet?{" "}
              <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors">
                Initialize one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
