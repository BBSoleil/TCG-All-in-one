import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Reset password | TCG All-in-One",
  description: "Get help recovering access to your TCG All-in-One account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Email-based password reset is still being wired up. In the meantime,
          here are the fastest ways to get back in.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Sign in with Google or Discord</h2>
          <p className="text-xs text-muted-foreground">
            If you registered with either provider, or your email matches the
            one on your Google / Discord account, you can sign straight in.
          </p>
          <Link href="/login" className="inline-block">
            <Button variant="outline" size="sm" className="mt-2">
              Go to login
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <h2 className="text-sm font-semibold">Still stuck? Email the team</h2>
        <p className="text-xs text-muted-foreground">
          During the private beta, password resets are handled manually. Send
          a short message from the email on your account to{" "}
          <a
            href="mailto:support@tcg-all-in-one.app"
            className="text-primary hover:underline"
          >
            support@tcg-all-in-one.app
          </a>{" "}
          and you&apos;ll hear back within 24 hours.
        </p>
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          &larr; Back to login
        </Link>
      </div>
    </div>
  );
}
