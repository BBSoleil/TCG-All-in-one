import type { MetadataRoute } from "next";

const SITE_URL =
  process.env["NEXT_PUBLIC_SITE_URL"] ??
  process.env["AUTH_URL"] ??
  "https://tcg-all-in-one.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/debug", "/dashboard", "/collection", "/profile", "/billing", "/market/my-listings", "/market/offers", "/market/history"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
