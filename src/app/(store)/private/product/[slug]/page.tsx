import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MobileBuyBar } from "@/components/product/MobileBuyBar";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { ProductCard } from "@/components/product/ProductCard";
import { AccordionItem } from "@/components/ui/Accordion";
import { hasPrivateAccess } from "@/lib/private/access";
import { listProductRows } from "@/lib/repo/products";
import { RegisterPrivateProducts } from "@/lib/state/catalogue";
import { whatsappLink } from "@/lib/whatsapp";

export const instant = false;
export const metadata: Metadata = { title: "The Private Collection", robots: { index: false, follow: false } };

/** A Private Collection piece. Only reachable with a valid private session (or as an admin). */
export default async function PrivateProductPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await hasPrivateAccess())) redirect("/private");
  const { slug } = await params;
  const pieces = (await listProductRows({ visibility: "private" })).map((r) => r.product);
  const product = pieces.find((p) => p.slug === slug);
  if (!product) notFound();
  const others = pieces.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <>
      <RegisterPrivateProducts products={pieces} />
      <div className="bg-emerald-deep text-ivory">
        <div className="container-luxe flex h-14 items-center justify-between text-[0.64rem] font-semibold uppercase tracking-[0.22em]">
          <Link href="/private/collection" className="text-gold-pale hover:text-ivory">
            ← The Private Collection
          </Link>
          <span className="text-ivory/50 max-sm:hidden">Reserved for invited clients</span>
        </div>
      </div>

      <section className="container-luxe mt-8 grid gap-10 md:mt-12 md:grid-cols-[1.15fr_1fr] md:gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16 xl:gap-24">
        <div>
          <ProductGallery images={product.images} name={product.name} />
          {product.illustrativeImages && (
            <p className="mt-4 text-[0.78rem] leading-relaxed text-stone">
              Images are studio renderings of this design. Ask us on{" "}
              <a href={whatsappLink(`Hello LA Luxury Gold, could you send me photographs of the ${product.name} from the Private Collection?`)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
                WhatsApp
              </a>{" "}
              for photographs of the piece itself.
            </p>
          )}
        </div>
        <div id="purchase-panel" className="scroll-mt-[calc(var(--header-h)+1rem)] md:sticky md:top-[calc(var(--header-h)+2rem)] md:self-start">
          <p className="eyebrow mb-4 text-forest">Private Collection</p>
          <PurchasePanel product={product} />
          <div className="mt-10 border-t border-line">
            <AccordionItem title="Description" defaultOpen>
              {product.description.map((d) => (
                <p key={d.slice(0, 20)} className="mb-3 last:mb-0">
                  {d}
                </p>
              ))}
            </AccordionItem>
            {product.specs.length > 0 && (
              <AccordionItem title="Details & specifications">
                <dl className="divide-y divide-line">
                  {product.specs.map((s) => (
                    <div key={s.label} className="flex justify-between gap-6 py-2.5">
                      <dt className="text-stone">{s.label}</dt>
                      <dd className="text-right">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </AccordionItem>
            )}
            <AccordionItem title="Delivery & questions">
              <p>
                The delivery charge and timeline for your destination are confirmed by our team with your order. For anything else,{" "}
                <a href={whatsappLink(`Hello LA Luxury Gold, I have a question about the ${product.name} from the Private Collection.`)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  ask us on WhatsApp
                </a>
                .
              </p>
            </AccordionItem>
          </div>
        </div>
      </section>

      <MobileBuyBar product={product} />

      {others.length > 0 && (
        <section className="mt-28 bg-emerald-deep py-20 text-ivory md:mt-36 md:py-28" aria-labelledby="more-private">
          <div className="container-luxe">
            <h2 id="more-private" className="display text-center text-[2.2rem] uppercase sm:text-5xl">
              Also <span className="script text-gold-pale">reserved for you</span>
            </h2>
            <ul className="mt-14 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-3 [&_h3]:text-ivory [&_p]:text-ivory/70">
              {others.map((p) => (
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
