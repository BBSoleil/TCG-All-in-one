import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/collection/:path*",
    "/cards/:path*",
    "/wishlist/:path*",
    "/decks/:path*",
    "/market/:path*",
    "/social/:path*",
    "/profile/:path*",
    "/user/:path*",
  ],
};
