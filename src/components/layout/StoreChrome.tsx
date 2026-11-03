import type { ReactNode } from "react";
import { Providers } from "@/lib/state/providers";
import { getCatalogue } from "@/lib/data/store-catalogue";
import { AnnouncementBar } from "./AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { Analytics } from "./Analytics";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { organizationJsonLd, JsonLd } from "@/lib/seo";

/** Storefront shell: providers (with the live catalogue), header, footer and global UI. */
export async function StoreChrome({ children }: { children: ReactNode }) {
  const products = await getCatalogue();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <JsonLd data={organizationJsonLd()} />
      <Providers products={products}>
        <AnnouncementBar />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <CartDrawer />
        <WhatsAppButton />
        <Analytics />
      </Providers>
    </>
  );
}
