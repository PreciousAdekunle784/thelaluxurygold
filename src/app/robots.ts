import type { MetadataRoute } from "next";
import { store } from "@/lib/config/store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/checkout", "/cart", "/account", "/wishlist", "/private"] }],
    sitemap: `${store.url}/sitemap.xml`,
  };
}
