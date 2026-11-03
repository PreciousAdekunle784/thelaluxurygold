"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import type { Product } from "@/lib/data/types";
import { availabilityLabel } from "@/lib/data/catalogue";
import { useCart, unitPrice } from "@/lib/state/cart";
import { Button } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/cart/QuantitySelector";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { whatsappLink, productEnquiry } from "@/lib/whatsapp";
import { store } from "@/lib/config/store";
import { cx } from "@/lib/format";
import { Price } from "./Price";
import { WishlistButton } from "./WishlistButton";
import { SampleBadge } from "./SampleBadge";

export function PurchasePanel({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const variant = product.variants?.[0];
  const [selected, setSelected] = useState<string | null>(variant && variant.options.length === 1 ? variant.options[0].value : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const onRequest = product.priceAED == null;
  const unavailable = product.availability === "out_of_stock";
  const price = unitPrice(product, variant && selected ? { name: variant.name, value: selected } : undefined);
  const url = `${store.url}/product/${product.slug}`;

  const commit = (thenCheckout: boolean) => {
    if (variant && !selected) {
      setError(`Please select a ${variant.name.toLowerCase()}.`);
      return;
    }
    setError(null);
    add(product.id, qty, variant && selected ? { name: variant.name, value: selected } : undefined, { silent: thenCheckout });
    if (thenCheckout) router.push("/checkout");
    else {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2200);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="eyebrow text-champagne">{product.purity} gold</span>
        {product.isNew && <span className="eyebrow text-stone">· New</span>}
      </div>
      <h1 className="display mt-4 text-[2.6rem] leading-[0.98] md:text-[3.4rem]">{product.name}</h1>
      <p className="mt-4 text-[0.98rem] leading-relaxed text-stone">{product.tagline}</p>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Price amountAED={price} className="text-xl" />
        {product.isSample && <SampleBadge className="text-stone">Sample price</SampleBadge>}
      </div>
      {product.isSample && <p className="mt-2 text-xs text-stone">Development preview — product details and price are placeholders.</p>}

      <dl className="mt-8 grid grid-cols-3 border-y border-line text-center">
        <div className="py-4">
          <dt className="eyebrow text-stone">Purity</dt>
          <dd className="mt-1.5 font-display text-xl">{product.purity}</dd>
        </div>
        <div className="border-x border-line py-4">
          <dt className="eyebrow text-stone">Weight</dt>
          <dd className="mt-1.5 font-display text-xl">{product.weightGrams ? `${product.weightGrams} g` : "—"}</dd>
        </div>
        <div className="py-4">
          <dt className="eyebrow text-stone">Status</dt>
          <dd className={cx("mt-1.5 font-display text-xl", product.availability === "low_stock" && "text-burgundy")}>{availabilityLabel[product.availability]}</dd>
        </div>
      </dl>

      {variant && !onRequest && (
        <fieldset className="mt-8">
          <legend className="eyebrow mb-4 flex w-full items-center justify-between font-semibold">
            <span>
              {variant.name}
              {selected && <span className="ml-2 font-normal normal-case tracking-normal text-stone">— {selected}</span>}
            </span>
            {variant.name === "Ring size" && (
              <a href={whatsappLink(`Hello LA Luxury Gold, could you help me find my ring size for the ${product.name}?`)} target="_blank" rel="noopener noreferrer" className="font-normal normal-case tracking-normal text-stone underline underline-offset-4 hover:text-ink">
                Size guidance
              </a>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((o) => (
              <button
                key={o.value}
                type="button"
                disabled={o.available === false}
                onClick={() => {
                  setSelected(o.value);
                  setError(null);
                }}
                aria-pressed={selected === o.value}
                className={cx(
                  "h-11 min-w-12 border px-4 text-sm transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-30",
                  selected === o.value ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink",
                )}
              >
                {o.value}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {onRequest ? (
        <div className="mt-8 space-y-3">
          <a href={whatsappLink(productEnquiry(product.name, url))} target="_blank" rel="noopener noreferrer" className="flex h-14 w-full items-center justify-center gap-3 bg-ink text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ivory transition-colors hover:bg-forest">
            <WhatsAppIcon width={18} height={18} /> Enquire for price
          </a>
          <p className="text-xs leading-relaxed text-stone">Pricing for this piece is confirmed on request by our team.</p>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex gap-3">
            <QuantitySelector value={qty} onChange={(n) => setQty(Math.max(1, n))} />
            <Button size="lg" className="h-12 flex-1" disabled={unavailable} onClick={() => commit(false)}>
              {added ? (
                <>
                  <Check size={15} /> Added to bag
                </>
              ) : (
                "Add to bag"
              )}
            </Button>
          </div>
          <Button variant="outline" size="lg" className="mt-3 w-full" disabled={unavailable} onClick={() => commit(true)}>
            Buy now
          </Button>
          <p role="alert" className="mt-3 min-h-5 text-sm text-burgundy">
            {error}
          </p>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <WishlistButton productId={product.id} name={product.name} withLabel className="hover:text-burgundy" />
        <a href={whatsappLink(productEnquiry(product.name, url))} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] hover:text-forest">
          <WhatsAppIcon width={16} height={16} /> Ask about this piece
        </a>
      </div>

      <ul className="mt-9 space-y-3 border-t border-line pt-7 text-[0.85rem] text-ink/75">
        <li className="flex items-center gap-3">
          <Truck size={17} strokeWidth={1.1} className="text-champagne" /> Insured worldwide delivery from Dubai
        </li>
        <li className="flex items-center gap-3">
          <ShieldCheck size={17} strokeWidth={1.1} className="text-champagne" /> Gold purity stated for every piece
        </li>
        <li className="flex items-center gap-3">
          <RotateCcw size={17} strokeWidth={1.1} className="text-champagne" /> Returns & exchanges — see policy below
        </li>
      </ul>
    </div>
  );
}
