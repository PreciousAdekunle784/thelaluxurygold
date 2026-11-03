"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Lock, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/state/cart";
import { countries, countryName } from "@/lib/config/countries";
import { paymentOptions, shippingMethodsFor, store, type PaymentOptionId } from "@/lib/config/store";
import { MediaImage } from "@/components/ui/MediaImage";
import { Price } from "@/components/product/Price";
import { buttonClass, Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { whatsappLink } from "@/lib/whatsapp";
import { formatMoney, cx } from "@/lib/format";

type Fields = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  notes: string;
  marketing: boolean;
};

const initial: Fields = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "AE",
  notes: "",
  marketing: false,
};

function validate(f: Fields, shippingId: string | null, payment: PaymentOptionId | null) {
  const e: Record<string, string> = {};
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email address.";
  if (f.phone.replace(/\D/g, "").length < 7) e.phone = "Enter a valid telephone number, including country code.";
  if (!f.firstName.trim()) e.firstName = "Required.";
  if (!f.lastName.trim()) e.lastName = "Required.";
  if (!f.address1.trim()) e.address1 = "Required.";
  if (!f.city.trim()) e.city = "Required.";
  if (!f.country) e.country = "Select a country.";
  if (!shippingId) e.shippingMethodId = "Select a shipping method.";
  if (!payment || !paymentOptions.find((p) => p.id === payment)?.available) e.paymentMethod = "Select an available payment option.";
  return e;
}

function Field({ label, name, error, optional, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: keyof Fields; error?: string; optional?: boolean }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-2 flex justify-between text-[0.66rem] font-semibold uppercase tracking-[0.18em]">
        {label}
        {optional && <span className="font-normal normal-case tracking-normal text-stone">Optional</span>}
      </span>
      <input name={name} aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined} className="field-boxed" {...props} />
      {error && (
        <span id={`${name}-err`} className="mt-1.5 block text-xs text-burgundy">
          {error}
        </span>
      )}
    </label>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-8 first:border-t-0 first:pt-0" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="mb-7 flex items-baseline gap-4">
        <span className="font-display text-2xl italic text-champagne">0{n}</span>
        <span className="eyebrow font-semibold">{title}</span>
      </h2>
      {children}
    </section>
  );
}

export function CheckoutView() {
  const { lines, subtotalAED, hydrated, hasPriceOnRequest, clear } = useCart();
  const [f, setF] = useState<Fields>(initial);
  const methods = useMemo(() => shippingMethodsFor(f.country), [f.country]);
  const [shippingPick, setShippingPick] = useState<string | null>(null);
  const shippingId = methods.some((m) => m.id === shippingPick) ? shippingPick : (methods[0]?.id ?? null);
  const [payment, setPayment] = useState<PaymentOptionId | null>("order-request");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<{ reference: string; summary: string } | null>(null);
  const countryList = useMemo(() => countries(), []);

  const method = methods.find((m) => m.id === shippingId);
  const shippingAED = method?.rateAED ?? null;
  const totalAED = subtotalAED + (shippingAED ?? 0);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate(f, shippingId, payment);
    setErrors(v);
    if (Object.keys(v).length) {
      const first = document.querySelector<HTMLElement>(`[name="${Object.keys(v)[0]}"]`);
      first?.focus();
      return;
    }
    setStatus("submitting");
    setServerError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { email: f.email, phone: f.phone, firstName: f.firstName, lastName: f.lastName, marketing: f.marketing },
          shipping: { address1: f.address1, address2: f.address2, city: f.city, region: f.region, postalCode: f.postalCode, country: f.country },
          shippingMethodId: shippingId,
          paymentMethod: payment,
          notes: f.notes,
          lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, variant: l.variant })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error ?? "Something went wrong.");
      }
      const summary = lines.map((l) => `${l.quantity} × ${l.product.name}${l.variant ? ` (${l.variant.value})` : ""}`).join(", ");
      setResult({ reference: data.reference, summary });
      setStatus("done");
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "done" && result) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="container-luxe flex flex-col items-center pb-32 pt-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-champagne text-champagne">
          <Check size={26} strokeWidth={1.2} />
        </span>
        <p className="eyebrow mt-8 text-champagne">Order request received</p>
        <h1 className="display mt-4 text-5xl uppercase md:text-6xl">Thank you</h1>
        <p className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-stone">
          Your reference is <strong className="font-semibold text-ink">{result.reference}</strong>. Our team will contact you at {f.email} to confirm availability,
          delivery and payment. <strong className="font-semibold text-ink">No payment has been taken.</strong>
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappLink(`Hello LA Luxury Gold, I've just placed order request ${result.reference}: ${result.summary}. Delivery to ${countryName(f.country)}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("solid", "lg")}
          >
            <WhatsAppIcon width={17} height={17} /> Confirm on WhatsApp
          </a>
          <Link href="/shop" className={buttonClass("outline", "lg")}>
            Continue shopping
          </Link>
        </div>
      </motion.div>
    );
  }

  if (!hydrated) return <div className="container-luxe h-[60vh] animate-pulse bg-sand/40" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <div className="container-luxe flex flex-col items-center pb-32 pt-6 text-center">
        <ShoppingBag size={38} strokeWidth={0.9} className="text-champagne" />
        <p className="mt-7 font-display text-4xl">Your bag is empty</p>
        <p className="mt-3 text-sm text-stone">Add a piece to your bag to check out.</p>
        <Link href="/shop" className={buttonClass("solid", "lg", "mt-9")}>
          Explore the collection
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="container-luxe grid gap-14 pb-28 lg:grid-cols-[1fr_420px] lg:gap-16 xl:gap-24">
      <div className="space-y-10">
        <Step n={1} title="Contact">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email address" name="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} error={errors.email} />
            <Field label="Telephone" name="phone" type="tel" autoComplete="tel" placeholder="+971 …" value={f.phone} onChange={set("phone")} error={errors.phone} />
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-stone">
            <input type="checkbox" name="marketing" checked={f.marketing} onChange={set("marketing")} className="h-4 w-4 accent-[var(--color-forest)]" />
            Email me about new collections and releases
          </label>
        </Step>

        <Step n={2} title="Delivery address">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-[0.66rem] font-semibold uppercase tracking-[0.18em]">Country / region</span>
              <select name="country" value={f.country} onChange={set("country")} autoComplete="country" className="field-boxed appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23111%22 stroke-width=%221.5%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat">
                {countryList.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="First name" name="firstName" autoComplete="given-name" value={f.firstName} onChange={set("firstName")} error={errors.firstName} />
            <Field label="Last name" name="lastName" autoComplete="family-name" value={f.lastName} onChange={set("lastName")} error={errors.lastName} />
            <Field className="sm:col-span-2" label="Address" name="address1" autoComplete="address-line1" value={f.address1} onChange={set("address1")} error={errors.address1} />
            <Field className="sm:col-span-2" label="Apartment, villa, building" name="address2" optional autoComplete="address-line2" value={f.address2} onChange={set("address2")} />
            <Field label="City" name="city" autoComplete="address-level2" value={f.city} onChange={set("city")} error={errors.city} />
            <Field label={f.country === "AE" ? "Emirate" : "State / region"} name="region" optional autoComplete="address-level1" value={f.region} onChange={set("region")} />
            <Field label="Postal code" name="postalCode" optional autoComplete="postal-code" value={f.postalCode} onChange={set("postalCode")} />
          </div>
        </Step>

        <Step n={3} title="Shipping method">
          <div className="space-y-3" role="radiogroup" aria-label="Shipping method">
            {methods.map((m) => (
              <label key={m.id} className={cx("flex cursor-pointer items-start gap-4 border p-5 transition-colors", shippingId === m.id ? "border-ink bg-white" : "border-line hover:border-ink/50")}>
                <input type="radio" name="shippingMethodId" checked={shippingId === m.id} onChange={() => setShippingPick(m.id)} className="mt-1 accent-[var(--color-ink)]" />
                <span className="flex-1">
                  <span className="flex flex-wrap justify-between gap-2">
                    <span className="text-sm font-semibold">{m.label}</span>
                    <span className="text-sm">{m.rateAED == null ? "Rate confirmed by our team" : m.rateAED === 0 ? "Complimentary" : formatMoney(m.rateAED)}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-stone">
                    {m.description} {m.estimate ? `Estimated delivery: ${m.estimate}.` : "Delivery timeline confirmed with your order."}
                  </span>
                </span>
              </label>
            ))}
            {errors.shippingMethodId && <p className="text-xs text-burgundy">{errors.shippingMethodId}</p>}
          </div>
          {f.country !== "AE" && (
            <p className="mt-4 text-xs leading-relaxed text-stone">
              Orders shipped outside the UAE may be subject to import duties, taxes and customs procedures, payable by the recipient. <Link href="/shipping" className="underline underline-offset-4">Shipping & customs</Link>
            </p>
          )}
        </Step>

        <Step n={4} title="Payment">
          <div className="space-y-3" role="radiogroup" aria-label="Payment method">
            {paymentOptions.map((p) => (
              <label
                key={p.id}
                className={cx(
                  "flex items-start gap-4 border p-5 transition-colors",
                  !p.available ? "cursor-not-allowed border-line opacity-60" : payment === p.id ? "cursor-pointer border-ink bg-white" : "cursor-pointer border-line hover:border-ink/50",
                )}
              >
                <input type="radio" name="paymentMethod" disabled={!p.available} checked={payment === p.id} onChange={() => setPayment(p.id)} className="mt-1 accent-[var(--color-ink)]" />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{p.label}</span>
                    {!p.available && <span className="border border-line px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-stone">Coming soon</span>}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-stone">{p.description}</span>
                </span>
              </label>
            ))}
            {errors.paymentMethod && <p className="text-xs text-burgundy">{errors.paymentMethod}</p>}
          </div>
          <label className="mt-6 block">
            <span className="mb-2 flex justify-between text-[0.66rem] font-semibold uppercase tracking-[0.18em]">
              Order notes <span className="font-normal normal-case tracking-normal text-stone">Optional — gift messages, engraving requests</span>
            </span>
            <textarea name="notes" rows={3} value={f.notes} onChange={set("notes")} className="field-boxed resize-y" />
          </label>
        </Step>
      </div>

      <aside className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
        <div className="bg-linen p-7 md:p-9">
          <h2 className="eyebrow font-semibold">Order summary</h2>
          <ul className="mt-6 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
                  <MediaImage mediaKey={l.product.images[0].media} alt={l.product.images[0].alt} sizes="64px" className="object-cover" />
                  <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[0.6rem] text-ivory">{l.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1.05rem] leading-tight">{l.product.name}</p>
                  <p className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-stone">
                    {l.product.purity}
                    {l.variant ? ` · ${l.variant.value}` : ""}
                  </p>
                </div>
                <Price amountAED={l.lineTotalAED} className="shrink-0 text-sm" />
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone">Subtotal</dt>
              <dd>
                <Price amountAED={subtotalAED} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone">Shipping</dt>
              <dd className="text-right">{shippingAED == null ? <span className="text-stone">To be confirmed</span> : <Price amountAED={shippingAED} />}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone">Duties & taxes</dt>
              <dd className="text-right text-stone">{f.country === "AE" ? "Confirmed with order" : "May apply on arrival"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-4 text-base font-semibold">
              <dt>{shippingAED == null || hasPriceOnRequest ? "Estimated total" : "Total"}</dt>
              <dd>
                <Price amountAED={totalAED} />
              </dd>
            </div>
          </dl>

          <Button type="submit" size="lg" className="mt-8 w-full" disabled={status === "submitting"}>
            {status === "submitting" ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} strokeWidth={1.5} />}
            {payment === "card" ? "Pay securely" : "Submit order request"}
          </Button>
          {serverError && (
            <p role="alert" className="mt-4 text-sm text-burgundy">
              {serverError}
            </p>
          )}
          <p className="mt-5 text-xs leading-relaxed text-stone">
            No payment is taken at this step. Our team will confirm your order, delivery and payment details before anything is charged. By submitting you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4">terms</Link> and <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link>.
          </p>
          {store.sampleMode && <p className="mt-4 border-t border-line pt-4 text-[0.7rem] leading-relaxed text-stone">Development preview: products and prices in this order are sample data.</p>}
        </div>
      </aside>
    </form>
  );
}
