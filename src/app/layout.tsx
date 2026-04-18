import type { Metadata } from "next";
import { DM_Sans, Bebas_Neue } from "next/font/google";
import { SessionProvider } from "@/shared/providers/session-provider";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

const SITE_URL =
  process.env["NEXT_PUBLIC_SITE_URL"] ??
  process.env["AUTH_URL"] ??
  "https://tcg-all-in-one.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "TCG All-in-One | Intelligent Collector's Vault",
  description:
    "Turn your TCG collection into an intelligent portfolio. Track, value, build, and connect across Pokemon, Yu-Gi-Oh!, Magic: The Gathering, and One Piece.",
  openGraph: {
    type: "website",
    siteName: "TCG All-in-One",
    title: "TCG All-in-One | Intelligent Collector's Vault",
    description:
      "Track, value, build, and connect across Pokemon, Yu-Gi-Oh!, Magic: The Gathering, and One Piece.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "TCG All-in-One | Intelligent Collector's Vault",
    description:
      "Track, value, build, and connect across Pokemon, Yu-Gi-Oh!, Magic: The Gathering, and One Piece.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TCG AIO",
  },
  other: {
    "theme-color": "#a855f7",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${bebasNeue.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
          <Toaster richColors position="bottom-right" theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  );
}
