import type { MetadataRoute } from "next";
import { store } from "@/lib/config/store";
import { getProducts } from "@/lib/data/catalogue";
import { categories, collections } from "@/lib/data/categories";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = store.url;
  const pages = ["", "/shop", "/collections", "/gold-bars", "/about", "/contact", "/shipping", "/returns", "/faq", "/privacy", "/terms"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...categories.filter((c) => c.slug !== "gold-bars").map((c) => ({ url: `${base}/collections/${c.slug}`, priority: 0.8 })),
    ...collections.map((c) => ({ url: `${base}/collections/${c.slug}`, priority: 0.6 })),
    ...getProducts().map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.createdAt, priority: 0.8 })),
  ];
}
