import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The HEIC decoder loads its own WebAssembly at runtime; keep it out of the server bundle.
  serverExternalPackages: ["heic-decode", "libheif-js"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Let browsers and the CDN reuse images and the hero film between visits
  // (file names are stable, so a week plus background revalidation is a safe balance).
  async headers() {
    const longCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }];
    return [
      { source: "/videos/:path*", headers: longCache },
      { source: "/images/:path*", headers: longCache },
    ];
  },
  // The returns & exchanges page was removed; send old links and bookmarks to the homepage.
  async redirects() {
    return [{ source: "/returns", destination: "/", permanent: true }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400, // 31 days for optimised images
  },
  experimental: {
    // Admin image uploads go through a Server Action (images are resized server-side).
    serverActions: { bodySizeLimit: "16mb" },
    proxyClientMaxBodySize: "16mb",
  },
};

export default nextConfig;
