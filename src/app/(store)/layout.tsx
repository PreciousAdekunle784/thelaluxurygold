import { StoreChrome } from "@/components/layout/StoreChrome";

/**
 * The store header, cart and analytics read the current URL. Allowing this segment to
 * block lets new or freshly edited products render on demand (and then be cached)
 * instead of failing; every known page is still prerendered at build time.
 */
export const instant = false;

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return <StoreChrome>{children}</StoreChrome>;
}
