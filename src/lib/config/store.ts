/**
 * Central store configuration.
 *
 * Everything that is business-specific and may change (contact details, currencies,
 * shipping methods, policies) lives here so it can later be moved to a CMS or database
 * without touching components.
 */

export const store = {
  name: "LA Luxury Gold",
  legalName: "LA Luxury Gold",
  tagline: "Timeless gold. Exceptional craftsmanship.",
  description:
    "LA Luxury Gold is a Dubai-based luxury jewellery house offering authentic 18K–24K gold jewellery and 24K gold bars, delivered worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://laluxurygold.com",
  location: "Dubai, United Arab Emirates",


  contact: {
    // Numbers as supplied by LA Luxury Gold. International formats are used for links.
    whatsapp: { display: "+234 814 973 4675", e164: "2348149734675", local: "08149734675" },
    phones: [
      { label: "Main / WhatsApp", display: "+234 814 973 4675", href: "tel:+2348149734675" },
      { label: "UAE", display: "+971 50 625 9597", href: "tel:+971506259597" },
      { label: "Secondary", display: "+234 814 966 6013", href: "tel:+2348149666013" },
    ],
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null, // add when available
  },

  social: {
    handle: "@laluxurygold",
    links: [
      { name: "Instagram", href: "https://www.instagram.com/laluxurygold" },
      { name: "TikTok", href: "https://www.tiktok.com/@laluxurygold" },
      { name: "Snapchat", href: "https://www.snapchat.com/add/laluxurygold" },
      { name: "X", href: "https://x.com/laluxurygold" },
      { name: "Threads", href: "https://www.threads.net/@laluxurygold" },
    ],
  },

  announcements: [
    "Timeless gold. Exceptional craftsmanship. Worldwide delivery.",
    "18K – 24K gold jewellery & 24K gold bars",
    "Personal assistance on WhatsApp",
  ],
} as const;

/* --------------------------------------------------------------------------
   Currency
   Prices are stored in US dollars. Shoppers can switch to Nigerian naira; the
   naira rate is set in Admin → Store settings (falls back to the value below).
   -------------------------------------------------------------------------- */
export type CurrencyCode = "USD" | "NGN";

export interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  locale: string;
}

export const baseCurrency: CurrencyCode = "USD";

export const currencies: CurrencyConfig[] = [
  { code: "USD", label: "US Dollar", locale: "en-US" },
  { code: "NGN", label: "Nigerian Naira", locale: "en-NG" },
];

/** Naira per US dollar used until a rate is saved in the admin. */
export const DEFAULT_NGN_PER_USD = Number(process.env.NEXT_PUBLIC_NGN_PER_USD) || 1550;

export type Rates = Record<CurrencyCode, number>;
export const defaultRates: Rates = { USD: 1, NGN: DEFAULT_NGN_PER_USD };

/* --------------------------------------------------------------------------
   Shipping
   Rates are confirmed by the team with each order (null). Set a flat rate or an
   estimate here to show it at checkout and on the shipping page.
   -------------------------------------------------------------------------- */
export interface ShippingMethod {
  id: string;
  label: string;
  description: string;
  /** ISO country codes this method serves, or "*" for all. */
  regions: string[] | "*";
  /** Flat rate in USD, or null when the rate is confirmed after ordering. */
  rate: number | null;
  /** Human readable estimate, or null when not yet confirmed. */
  estimate: string | null;
}

export const shippingMethods: ShippingMethod[] = [
  {
    id: "uae-delivery",
    label: "UAE insured delivery",
    description: "Insured, signature-on-delivery service within the United Arab Emirates.",
    regions: ["AE"],
    rate: null,
    estimate: null,
  },
  {
    id: "international-express",
    label: "International insured express",
    description: "Insured express courier with tracking. Duties and taxes may apply on arrival.",
    regions: "*",
    rate: null,
    estimate: null,
  },
];

/** Methods for a destination: region-specific methods win over the "*" fallback. */
export function shippingMethodsFor(country: string) {
  const specific = shippingMethods.filter((m) => m.regions !== "*" && m.regions.includes(country));
  return specific.length ? specific : shippingMethods.filter((m) => m.regions === "*");
}

/* --------------------------------------------------------------------------
   Payments
   "paystack" takes payment online through Paystack's hosted checkout (card,
   bank transfer, USSD…). It is offered only when PAYSTACK_SECRET_KEY is set on
   the server — see src/lib/payments/paystack.ts. "order-request" lets the team
   confirm the order and arrange payment directly with the customer.
   -------------------------------------------------------------------------- */
export const paymentOptions = [
  {
    id: "paystack",
    label: "Pay now — card, bank transfer or USSD",
    description: "You'll be taken to Paystack's secure checkout to pay. Your order is confirmed as soon as the payment clears.",
    available: true,
  },
  {
    id: "order-request",
    label: "Confirm & pay with our team",
    description:
      "Place your order now and our team will contact you, usually within one business day, to confirm availability, delivery and payment. No payment is taken now.",
    available: true,
  },
] as const;

export type PaymentOptionId = (typeof paymentOptions)[number]["id"];
