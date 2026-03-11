import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";

// Edge-compatible auth config (no Prisma, no bcrypt)
// Used by middleware for route protection
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    Google,
    Discord,
    // Credentials provider stub for middleware — actual authorize logic is in auth.ts
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = [
        "/dashboard",
        "/collection",
        "/cards",
        "/wishlist",
        "/decks",
        "/market",
        "/social",
        "/profile",
        "/user",
      ].some((path) => nextUrl.pathname.startsWith(path));

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      // Redirect authenticated users from landing page to dashboard
      if (isLoggedIn && nextUrl.pathname === "/") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
