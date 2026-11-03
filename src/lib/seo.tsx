import { store } from "@/lib/config/store";
import { media } from "@/lib/data/media";
import type { Product } from "@/lib/data/types";

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: store.name,
    url: store.url,
    description: store.description,
    logo: `${store.url}/icon.png`,
    image: `${store.url}/images/editorial/hero.webp`,
    telephone: store.contact.phones[0].display,
    address: { "@type": "PostalAddress", addressLocality: "Dubai", addressCountry: "AE" },
    sameAs: store.social.links.map((s) => s.href),
  };
}

const availabilityMap: Record<Product["availability"], string> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  made_to_order: "https://schema.org/PreOrder",
  out_of_stock: "https://schema.org/OutOfStock",
};

export function productJsonLd(p: Product) {
  const url = `${store.url}/product/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description.join(" "),
    sku: p.id,
    url,
    image: p.images.map((i) => `${store.url}${media(i.media).src}`),
    brand: { "@type": "Brand", name: store.name },
    category: p.category,
    material: `${p.purity} gold`,
    ...(p.weightGrams ? { weight: { "@type": "QuantitativeValue", value: p.weightGrams, unitCode: "GRM" } } : {}),
    ...(p.priceAED != null
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "AED",
            price: p.priceAED,
            availability: availabilityMap[p.availability],
            seller: { "@type": "Organization", name: store.name },
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${store.url}${it.href}` })),
  };
}
