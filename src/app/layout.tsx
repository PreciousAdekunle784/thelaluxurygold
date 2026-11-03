import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Corinthia, Manrope } from "next/font/google";
import "./globals.css";
import { store } from "@/lib/config/store";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  // Only the weights the design uses (each extra weight/style is another font download).
  weight: ["400", "500"],
  style: ["normal"],
  variable: "--font-cormorant",
  display: "swap",
});

// Bold copperplate script for headline accent words ("timeless", "a legacy"…).
const script = Corinthia({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-corinthia",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(store.url),
  title: {
    default: "LA Luxury Gold — Fine Gold Jewellery & 24K Gold Bars | Dubai",
    template: "%s | LA Luxury Gold",
  },
  description: store.description,
  applicationName: "LA Luxury Gold",
  keywords: ["gold jewellery Dubai", "18K gold", "22K gold", "24K gold bars", "gold rings", "gold necklaces", "gold bracelets", "gold earrings"],
  openGraph: {
    type: "website",
    siteName: "LA Luxury Gold",
    title: "LA Luxury Gold — The Art of Timeless Gold",
    description: store.description,
    images: [{ url: "/images/editorial/hero.webp", width: 2400, height: 1400, alt: "LA Luxury Gold jewellery still life" }],
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image", site: "@laluxurygold" },
  // Sample catalogue must never be indexed.
  robots: store.sampleMode ? { index: false, follow: false } : { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#26382f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${script.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">{children}
      </body>
    </html>
  );
}
