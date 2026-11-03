import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/state/providers";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { store } from "@/lib/config/store";
import { organizationJsonLd, JsonLd } from "@/lib/seo";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
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
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
          Skip to content
        </a>
        <JsonLd data={organizationJsonLd()} />
        <Providers>
          <AnnouncementBar />
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
