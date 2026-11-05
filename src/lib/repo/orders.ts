import "server-only";
import { getDb } from "@/lib/db/client";
import type { OrderRecord } from "@/lib/server/orders";
import type { PaymentInfo } from "@/lib/payments/paystack";
import { dayKey } from "@/lib/time";

export const orderStatuses = [
  { id: "awaiting_payment", label: "Awaiting payment" },
  { id: "pending_confirmation", label: "Awaiting confirmation" },
  { id: "confirmed", label: "Confirmed" },
  { id: "paid", label: "Paid" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
] as const;
export type OrderStatus = (typeof orderStatuses)[number]["id"];
/** Statuses that count as money received. */
export const PAID_STATUSES: OrderStatus[] = ["paid", "shipped", "delivered"];

export interface StoredOrder {
  reference: string;
  createdAt: number;
  status: OrderStatus;
  email: string;
  name: string;
  phone: string;
  country: string;
  subtotal: number;
  itemCount: number;
  hasPriceOnRequest: boolean;
  record: OrderRecord;
  history: { status: OrderStatus; at: number; note?: string }[];
}

type Raw = Record<string, unknown>;
const parse = (r: Raw): StoredOrder => ({
  reference: String(r.reference),
  createdAt: Number(r.created_at),
  status: r.status as OrderStatus,
  email: String(r.email),
  name: String(r.name),
  phone: String(r.phone ?? ""),
  country: String(r.country ?? ""),
  subtotal: Number(r.subtotal),
  itemCount: Number(r.item_count),
  hasPriceOnRequest: !!Number(r.has_por),
  record: JSON.parse(String(r.data)),
  history: JSON.parse(String(r.history)),
});

export async function insertOrder(o: OrderRecord) {
  const db = await getDb();
  const ts = Date.parse(o.createdAt);
  await db.run(
    `INSERT INTO orders (reference, created_at, day, status, email, name, phone, country, subtotal, item_count, has_por, data, history, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      o.reference, ts, dayKey(ts), o.status, o.customer.email.toLowerCase(), `${o.customer.firstName} ${o.customer.lastName}`.trim(),
      o.customer.phone, o.shipping.country, Math.round(o.subtotal), o.resolvedLines.reduce((n, l) => n + l.quantity, 0), o.hasPriceOnRequest ? 1 : 0,
      JSON.stringify(o), JSON.stringify([{ status: o.status, at: ts }]), ts,
    ],
  );
}

export async function listOrders(opts: { status?: string; q?: string; limit?: number; offset?: number; since?: number } = {}) {
  const db = await getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.status) { params.push(opts.status); where.push(`status = $${params.length}`); }
  if (opts.since) { params.push(opts.since); where.push(`created_at > $${params.length}`); }
  if (opts.q) {
    params.push(`%${opts.q.toLowerCase()}%`);
    const n = params.length;
    where.push(`(LOWER(reference) LIKE $${n} OR email LIKE $${n} OR LOWER(name) LIKE $${n} OR phone LIKE $${n})`);
  }
  params.push(opts.limit ?? 50, opts.offset ?? 0);
  const rows = await db.all<Raw>(`SELECT * FROM orders ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return rows.map(parse);
}

export async function countOrders(opts: { status?: string } = {}) {
  const db = await getDb();
  const r = await db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM orders ${opts.status ? "WHERE status = $1" : ""}`, opts.status ? [opts.status] : []);
  return Number(r?.n ?? 0);
}

/** Order counts for every status in one query: { all, pending_confirmation, paid, ... }. */
export async function countOrdersByStatus() {
  const db = await getDb();
  const rows = await db.all<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM orders GROUP BY status");
  const counts: Record<string, number> = { all: 0 };
  for (const r of rows) {
    counts[r.status] = Number(r.n);
    counts.all += Number(r.n);
  }
  return counts;
}

export async function getOrder(reference: string) {
  const db = await getDb();
  const r = await db.get<Raw>("SELECT * FROM orders WHERE reference = $1", [reference]);
  return r ? parse(r) : null;
}

export async function updateOrderStatus(reference: string, status: OrderStatus, note?: string) {
  const db = await getDb();
  const o = await getOrder(reference);
  if (!o) throw new Error("Order not found");
  const history = [...o.history, { status, at: Date.now(), ...(note ? { note } : {}) }];
  await db.run("UPDATE orders SET status = $2, history = $3, updated_at = $4 WHERE reference = $1", [reference, status, JSON.stringify(history), Date.now()]);
}

/** Store the latest payment attempt on the order (no status change). */
export async function setOrderPayment(reference: string, payment: PaymentInfo) {
  const db = await getDb();
  const o = await getOrder(reference);
  if (!o) throw new Error("Order not found");
  await db.run("UPDATE orders SET data = $2, updated_at = $3 WHERE reference = $1", [reference, JSON.stringify({ ...o.record, payment }), Date.now()]);
}

/**
 * Mark an order paid after the payment provider has confirmed it. Idempotent: an order that is
 * already paid (or further along) is left untouched, so the redirect and the webhook can both call it.
 */
export async function markOrderPaid(reference: string, payment: PaymentInfo, note: string) {
  const db = await getDb();
  const o = await getOrder(reference);
  if (!o) throw new Error("Order not found");
  if (PAID_STATUSES.includes(o.status)) return { order: o, changed: false };
  const now = Date.now();
  const history = [...o.history, { status: "paid" as const, at: now, note }];
  const record = { ...o.record, payment };
  await db.run(
    "UPDATE orders SET status = 'paid', data = $2, history = $3, updated_at = $4 WHERE reference = $1 AND status NOT IN ('paid', 'shipped', 'delivered')",
    [reference, JSON.stringify(record), JSON.stringify(history), now],
  );
  return { order: { ...o, status: "paid" as OrderStatus, record, history }, changed: true };
}

export async function orderStats(days: string[]) {
  const db = await getDb();
  const paidList = PAID_STATUSES.map((s) => `'${s}'`).join(",");
  const totalsP = db.get<Raw>(
    `SELECT COUNT(*) AS orders,
            COUNT(DISTINCT email) AS buyers,
            COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN subtotal ELSE 0 END), 0) AS requested,
            COALESCE(SUM(CASE WHEN status IN (${paidList}) THEN subtotal ELSE 0 END), 0) AS paid,
            COALESCE(SUM(CASE WHEN status IN (${paidList}) THEN 1 ELSE 0 END), 0) AS paid_orders,
            COALESCE(SUM(CASE WHEN status = 'pending_confirmation' THEN 1 ELSE 0 END), 0) AS pending
       FROM orders`,
  );
  const ph = days.map((_, i) => `$${i + 1}`).join(",");
  const byDayP = days.length
    ? db.all<Raw>(`SELECT day, COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN subtotal ELSE 0 END),0) AS value FROM orders WHERE day IN (${ph}) GROUP BY day`, days)
    : Promise.resolve([] as Raw[]);
  const [totals, byDay] = await Promise.all([totalsP, byDayP]);
  const map = new Map(byDay.map((r) => [String(r.day), { orders: Number(r.orders), value: Number(r.value) }]));
  return {
    orders: Number(totals?.orders ?? 0),
    buyers: Number(totals?.buyers ?? 0),
    requested: Number(totals?.requested ?? 0),
    paid: Number(totals?.paid ?? 0),
    paidOrders: Number(totals?.paid_orders ?? 0),
    pending: Number(totals?.pending ?? 0),
    series: days.map((d) => ({ day: d, ...(map.get(d) ?? { orders: 0, value: 0 }) })),
  };
}

export async function listCustomers(opts: { q?: string; limit?: number } = {}) {
  const db = await getDb();
  const paidList = PAID_STATUSES.map((s) => `'${s}'`).join(",");
  const params: unknown[] = [];
  let where = "";
  if (opts.q) { params.push(`%${opts.q.toLowerCase()}%`); where = "WHERE email LIKE $1 OR LOWER(name) LIKE $1 OR phone LIKE $1"; }
  params.push(opts.limit ?? 200);
  const rows = await db.all<Raw>(
    `SELECT email, MAX(name) AS name, MAX(phone) AS phone, MAX(country) AS country, COUNT(*) AS orders,
            COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN subtotal ELSE 0 END),0) AS requested,
            COALESCE(SUM(CASE WHEN status IN (${paidList}) THEN subtotal ELSE 0 END),0) AS paid,
            MAX(created_at) AS last_order, MIN(created_at) AS first_order
       FROM orders ${where} GROUP BY email ORDER BY paid DESC, requested DESC LIMIT $${params.length}`,
    params,
  );
  return rows.map((r) => ({
    email: String(r.email),
    name: String(r.name),
    phone: String(r.phone ?? ""),
    country: String(r.country ?? ""),
    orders: Number(r.orders),
    requested: Number(r.requested),
    paid: Number(r.paid),
    lastOrder: Number(r.last_order),
    firstOrder: Number(r.first_order),
  }));
}
