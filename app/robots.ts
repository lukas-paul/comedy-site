import type { MetadataRoute } from "next";

// Test deploys stay out of search engines. Set ALLOW_INDEXING=true on the
// production site (read at build time, so redeploy after changing it).
export default function robots(): MetadataRoute.Robots {
  if (process.env.ALLOW_INDEXING !== "true") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/", disallow: "/studio" } };
}
