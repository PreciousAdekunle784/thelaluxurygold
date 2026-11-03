import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts, getRelatedProducts } from "@/lib/data/catalogue";
import { getCategory } from "@/lib/data/categories";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { ProductCard } from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/shop/PageIntro";
import { AccordionItem } from "@/components/ui/Accordion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { JsonLd, breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { media } from "@/lib/data/media";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return { title: "Product not found" };
  const img = media(p.images[0].media);
  return {
    title: `${p.name} — ${p.purity} Gold`,
    description: `${p.tagline} ${p.description[0]}`.slice(0, 158),
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { type: "website", title: p.name, description: p.tagline, images: [{ url: img.src, width: img.width, height: img.height, alt: p.images[0].alt }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const category = getCategory(product.category)!;
  const categoryHref = product.category === "gold-bars" ? "/gold-bars" : `/collections/${product.category}`;
  const related = getRelatedProducts(product, 4);
  const crumbs = [
    { name: "Home", href: "/" },
    { name: category.name, href: categoryHref },
    { name: product.name, href: `/product/${product.slug}` },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <div className="container-luxe pt-6 md:pt-10">
        <Breadcrumbs items={crumbs.map((c, i) => (i === crumbs.length - 1 ? { name: c.name } : c))} />
      </div>

      <section className="container-luxe mt-6 grid gap-10 md:mt-10 md:grid-cols-[1.15fr_1fr] md:gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16 xl:gap-24">
        <ProductGallery images={product.images} name={product.name} />

        <div className="md:sticky md:top-[calc(var(--header-h)+2rem)] md:self-start">
          <PurchasePanel product={product} />

          <div className="mt-10 border-t border-line">
            <AccordionItem title="Description" defaultOpen>
              {product.description.map((d) => (
                <p key={d.slice(0, 20)} className="mb-3 last:mb-0">
                  {d}
                </p>
              ))}
            </AccordionItem>
            <AccordionItem title="Details & specifications">
              <dl className="divide-y divide-line">
                {product.specs.map((s) => (
                  <div key={s.label} className="flex justify-between gap-6 py-2.5">
                    <dt className="text-stone">{s.label}</dt>
                    <dd className="text-right">{s.value}</dd>
                  </div>
                ))}
                {product.variants?.map((v) => (
                  <div key={v.name} className="flex justify-between gap-6 py-2.5">
                    <dt className="text-stone">{v.name}s available</dt>
                    <dd className="text-right">{v.options.map((o) => o.value).join(", ")}</dd>
                  </div>
                ))}
              </dl>
            </AccordionItem>
            <AccordionItem title="Delivery">
              <p>
                Every order is dispatched from Dubai with an insured, tracked courier. We deliver within the UAE and internationally. Shipping
                costs and delivery timelines for your destination are confirmed at checkout or by our team before dispatch.
              </p>
              <p className="mt-3">
                International orders may be subject to import duties and taxes in the destination country. <Link href="/shipping" className="underline underline-offset-4">Shipping information</Link>
              </p>
            </AccordionItem>
            <AccordionItem title="Returns & exchanges">
              <p>
                We want you to love your piece. Please read our <Link href="/returns" className="underline underline-offset-4">returns & exchange policy</Link> before ordering. Personalised,
                engraved and made-to-order pieces, as well as gold bars, may be subject to different terms.
              </p>
            </AccordionItem>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-28 bg-linen py-24 md:mt-36 md:py-32" aria-labelledby="related">
          <div className="container-luxe">
            <SectionHeading eyebrow="You may also love" title={<span id="related">Complete the look</span>} />
            <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
