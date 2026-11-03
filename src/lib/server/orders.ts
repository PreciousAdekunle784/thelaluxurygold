import "server-only";
import { listProductRows } from "@/lib/repo/products";
import { getSiteSettings } from "@/lib/data/site-settings";
import type { CurrencyCode } from "@/lib/config/store";
import { insertOrder } from "@/lib/repo/orders";
import type { Product } from "@/lib/data/types";
import { paymentOptions, shippingMethods, shippingMethodsFor } from "@/lib/config/store";
import { unitPrice } from "@/lib/state/cart-math";

export interface OrderInput {
  customer: { email: string; phone: string; firstName: string; lastName: string; marketing?: boolean };
  shipping: { address1: string; address2?: string; city: string; region?: string; postalCode?: string; country: string };
  shippingMethodId: string;
  paymentMethod: string;
  /** Currency the shopper was viewing prices in. */
  displayCurrency: CurrencyCode;
  notes?: string;
  lines: { productId: string; quantity: number; variant?: { name: string; value: string } }[];
}

export interface OrderRecord extends OrderInput {
  reference: string;
  createdAt: string;
  status: "pending_confirmation";
  /** Amounts are stored in US dollars. */
  currency: "USD";
  /** Naira per dollar at the time of the order (for orders placed while viewing NGN). */
  ngnPerUsd: number;
  resolvedLines: { productId: string; name: string; quantity: number; variant?: { name: string; value: string }; unitPrice: number | null }[];
  subtotal: number;
  shippingCost: number | null;
  hasPriceOnRequest: boolean;
}

export class ValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super("Please check the highlighted fields.");
  }
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Live product list straight from the database (never cached) so prices and availability are always current. */
async function liveCatalogue() {
  return (await listProductRows()).map((r) => r.product);
}

export async function validateOrder(body: unknown): Promise<OrderInput> {
  const catalogue = await liveCatalogue();
  const getProductById = (id: string) => catalogue.find((p) => p.id === id);
  const b = (body ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const errors: Record<string, string> = {};
  const customer = {
    email: str(b.customer?.email, 160),
    phone: str(b.customer?.phone, 40),
    firstName: str(b.customer?.firstName, 80),
    lastName: str(b.customer?.lastName, 80),
    marketing: !!b.customer?.marketing,
  };
  const shipping = {
    address1: str(b.shipping?.address1),
    address2: str(b.shipping?.address2),
    city: str(b.shipping?.city, 100),
    region: str(b.shipping?.region, 100),
    postalCode: str(b.shipping?.postalCode, 20),
    country: str(b.shipping?.country, 2).toUpperCase(),
  };
  if (!/^\S+@\S+\.\S+$/.test(customer.email)) errors.email = "Enter a valid email address.";
  if (customer.phone.replace(/\D/g, "").length < 7) errors.phone = "Enter a valid telephone number.";
  if (!customer.firstName) errors.firstName = "Required.";
  if (!customer.lastName) errors.lastName = "Required.";
  if (!shipping.address1) errors.address1 = "Required.";
  if (!shipping.city) errors.city = "Required.";
  if (!/^[A-Z]{2}$/.test(shipping.country)) errors.country = "Select a country.";

  const shippingMethodId = str(b.shippingMethodId, 60);
  if (!shippingMethodsFor(shipping.country).some((m) => m.id === shippingMethodId)) errors.shippingMethodId = "Select a shipping method.";
  const paymentMethod = str(b.paymentMethod, 40);
  if (!paymentOptions.some((p) => p.id === paymentMethod && p.available)) errors.paymentMethod = "Select an available payment option.";

  const lines = Array.isArray(b.lines) ? b.lines.slice(0, 50) : [];
  const cleanLines = lines
    .map((l: Record<string, unknown>) => ({
      productId: str(l?.productId, 60),
      quantity: Math.max(1, Math.min(10, Math.floor(Number(l?.quantity) || 0))),
      variant: l?.variant && typeof l.variant === "object" ? { name: str((l.variant as Record<string, unknown>).name, 40), value: str((l.variant as Record<string, unknown>).value, 40) } : undefined,
    }))
    .filter((l: { productId: string }) => {
      const p = getProductById(l.productId);
      return !!p && p.availability !== "out_of_stock";
    });
  if (!cleanLines.length) errors.lines = "Your bag is empty.";

  if (Object.keys(errors).length) throw new ValidationError(errors);
  const displayCurrency: CurrencyCode = b.currency === "NGN" ? "NGN" : "USD";
  return { customer, shipping, shippingMethodId, paymentMethod, displayCurrency, notes: str(b.notes, 1000), lines: cleanLines };
}

export async function buildOrder(input: OrderInput, reference: string, createdAt: string): Promise<OrderRecord> {
  const catalogue = await liveCatalogue();
  const getProductById = (id: string): Product | undefined => catalogue.find((p) => p.id === id);
  const resolvedLines = input.lines.map((l) => {
    const p = getProductById(l.productId)!;
    return { productId: p.id, name: p.name, quantity: l.quantity, variant: l.variant, unitPrice: unitPrice(p, l.variant) };
  });
  const method = shippingMethods.find((m) => m.id === input.shippingMethodId);
  return {
    ...input,
    reference,
    createdAt,
    status: "pending_confirmation",
    currency: "USD",
    ngnPerUsd: (await getSiteSettings()).ngnPerUsd,
    resolvedLines,
    subtotal: resolvedLines.reduce((n, l) => n + (l.unitPrice ?? 0) * l.quantity, 0),
    shippingCost: method?.rate ?? null,
    hasPriceOnRequest: resolvedLines.some((l) => l.unitPrice == null),
  };
}

/**
 * Persist the order (visible in /admin) and optionally forward it to ORDER_WEBHOOK_URL
 * (CRM, email automation, Google Sheets, Make, Zapier…).
 */
export async function saveOrder(order: OrderRecord) {
  await insertOrder(order);
  const hook = process.env.ORDER_WEBHOOK_URL;
  if (hook) {
    const res = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "order.requested", order }) });
    if (!res.ok) throw new Error(`Order webhook failed (${res.status})`);
    return;
  }
  console.info(`[orders] ${order.reference} saved`);
}
