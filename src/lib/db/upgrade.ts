import "server-only";
import type { Db } from "./client";

/**
 * One-time upgrade for databases created before prices moved from UAE dirham to US dollars
 * (schema version 1–2). Safe to run repeatedly: rows already in the new format are skipped.
 *
 *  - orders.subtotal_aed  → orders.subtotal
 *  - product JSON: priceAED / compareAtAED / priceDeltaAED → price / compareAt / priceDelta (USD)
 *  - order JSON:   subtotalAED / shippingAED / unitPriceAED → subtotal / shippingCost / unitPrice (USD)
 *  - development-only fields (isSample, "Specification status") are removed
 */

const AED_PER_USD = 3.6725;

/** The starting catalogue's dirham prices and the dollar prices that replaced them. */
const STARTING_PRICES: Record<number, number> = {
  1850: 495, 3400: 925, 2150: 585, 4200: 1145, 3950: 1075, 2900: 790, 5600: 1525, 2450: 665, 7800: 2125,
  5200: 1415, 2650: 720, 1950: 530, 1250: 340, 3100: 845, 1750: 475, 3450: 940, 6850: 1865, 16900: 4600,
};

const RENAMED: Record<string, string> = { shippingAED: "shippingCost" };

function toUsd(aed: unknown, exact: boolean) {
  if (typeof aed !== "number") return aed ?? null;
  return (exact && STARTING_PRICES[aed]) || Math.round(aed / AED_PER_USD);
}

/** Recursively rename `…AED` keys and convert their values. */
function convert(value: unknown, exact: boolean): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, exact));
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === "isSample") continue;
    if (k.endsWith("AED")) out[RENAMED[k] ?? k.slice(0, -3)] = toUsd(v, exact);
    else if (k === "currency" && v === "AED") out[k] = "USD";
    else out[k] = convert(v, exact);
  }
  return out;
}

const isLegacy = (json: string) => /AED"\s*:|"isSample"|Specification status/.test(json);

async function columns(db: Db, table: string) {
  const rows =
    db.dialect === "sqlite"
      ? await db.all<{ name: string }>(`SELECT name FROM pragma_table_info('${table}')`)
      : await db.all<{ name: string }>("SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1", [table]);
  return new Set(rows.map((r) => r.name));
}

async function renameSubtotalColumn(db: Db) {
  if (!(await columns(db, "orders")).has("subtotal_aed")) return;
  if (db.dialect === "sqlite") {
    await db.exec("ALTER TABLE orders RENAME COLUMN subtotal_aed TO subtotal");
    return;
  }
  // The optional Table Editor views from supabase/schema.sql depend on the old column name.
  await db.exec(`SET LOCAL lock_timeout = '4s';
    DROP VIEW IF EXISTS order_overview;
    DROP VIEW IF EXISTS product_overview;
    ALTER TABLE orders RENAME COLUMN subtotal_aed TO subtotal;
    CREATE VIEW product_overview WITH (security_invoker = true) AS
      SELECT id, slug, data::jsonb ->> 'name' AS name, data::jsonb ->> 'category' AS category, data::jsonb ->> 'purity' AS purity,
        (data::jsonb ->> 'price')::numeric AS price_usd, (data::jsonb ->> 'weightGrams')::numeric AS weight_grams,
        data::jsonb ->> 'availability' AS availability, archived = 1 AS hidden, to_timestamp(updated_at / 1000.0) AS updated
      FROM products ORDER BY position;
    CREATE VIEW order_overview WITH (security_invoker = true) AS
      SELECT reference, to_timestamp(created_at / 1000.0) AS placed_at, status, name, email, phone, country, item_count, subtotal AS subtotal_usd
      FROM orders ORDER BY created_at DESC;`);
}

export async function upgradeLegacyData(db: Db) {
  await renameSubtotalColumn(db);

  const products = await db.all<{ id: string; data: string }>("SELECT id, data FROM products");
  for (const row of products) {
    if (!isLegacy(row.data)) continue;
    const p = convert(JSON.parse(row.data), true) as { specs?: { label: string }[] };
    if (Array.isArray(p.specs)) p.specs = p.specs.filter((s) => s.label !== "Specification status");
    await db.run("UPDATE products SET data = $1 WHERE id = $2", [JSON.stringify(p), row.id]);
  }

  const orders = await db.all<{ reference: string; data: string }>("SELECT reference, data FROM orders");
  for (const row of orders) {
    if (!isLegacy(row.data)) continue;
    const o = convert(JSON.parse(row.data), true) as { subtotal?: number; resolvedLines?: { unitPrice: number | null; quantity: number }[] };
    if (Array.isArray(o.resolvedLines)) o.subtotal = o.resolvedLines.reduce((n, l) => n + (l.unitPrice ?? 0) * l.quantity, 0);
    await db.run("UPDATE orders SET data = $1, subtotal = $2 WHERE reference = $3", [JSON.stringify(o), Math.round(o.subtotal ?? 0), row.reference]);
  }
}
