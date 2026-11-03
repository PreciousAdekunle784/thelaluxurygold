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

  /**
   * While true, the catalogue contains sample products and sample prices for the
   * development preview. Pages are marked `noindex` and products are labelled.
   * Set NEXT_PUBLIC_SAMPLE_CATALOGUE="false" once verified products are loaded.
   */
  sampleMode: process.env.NEXT_PUBLIC_SAMPLE_CATALOGUE !== "false",

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
   AED is the base currency. Additional currencies appear in the currency
   selector only once a rate is configured (e.g. from a rates service).
   -------------------------------------------------------------------------- */
export type CurrencyCode = "AED" | "USD" | "EUR" | "GBP" | "SAR";

export interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  /** Units of this currency per 1 AED. `null` = not configured, hidden from customers. */
  rate: number | null;
  locale: string;
}

export const baseCurrency: CurrencyCode = "AED";

export const currencies: CurrencyConfig[] = [
  { code: "AED", label: "UAE Dirham", rate: 1, locale: "en-AE" },
  { code: "USD", label: "US Dollar", rate: null, locale: "en-US" },
  { code: "EUR", label: "Euro", rate: null, locale: "en-IE" },
  { code: "GBP", label: "British Pound", rate: null, locale: "en-GB" },
  { code: "SAR", label: "Saudi Riyal", rate: null, locale: "en-SA" },
];

export const enabledCurrencies = currencies.filter((c) => c.rate !== null);

/* --------------------------------------------------------------------------
   Shipping
   Rates and delivery timelines are intentionally left unset (null) — they are
   confirmed by the LA Luxury Gold team. Fill these in to show them at checkout.
   -------------------------------------------------------------------------- */
export interface ShippingMethod {
  id: string;
  label: string;
  description: string;
  /** ISO country codes this method serves, or "*" for all. */
  regions: string[] | "*";
  /** Flat rate in AED, or null when the rate is confirmed after ordering. */
  rateAED: number | null;
  /** Human readable estimate, or null when not yet confirmed. */
  estimate: string | null;
}

export const shippingMethods: ShippingMethod[] = [
  {
    id: "uae-delivery",
    label: "UAE insured delivery",
    description: "Insured, signature-on-delivery service within the United Arab Emirates.",
    regions: ["AE"],
    rateAED: null,
    estimate: null,
  },
  {
    id: "international-express",
    label: "International insured express",
    description: "Insured express courier with tracking. Duties and taxes may apply on arrival.",
    regions: "*",
    rateAED: null,
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
   No payment provider is connected yet. See src/lib/payments.
   -------------------------------------------------------------------------- */
export const paymentOptions = [
  {
    id: "card",
    label: "Credit / debit card",
    description: "Secure card payments will be available once a payment gateway is connected.",
    available: false,
  },
  {
    id: "order-request",
    label: "Reserve & confirm with our team",
    description:
      "Submit your order request. Our team will contact you to confirm availability, delivery and payment details. No payment is taken now.",
    available: true,
  },
] as const;

export type PaymentOptionId = (typeof paymentOptions)[number]["id"];
