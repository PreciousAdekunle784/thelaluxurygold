import "server-only";
import type { Db } from "./client";
import type { Product } from "@/lib/data/types";

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

/**
 * Catalogue v2 (new imagery). For databases seeded before it:
 *  - adds the jewellery-set products (if they are not there yet);
 *  - for starting-catalogue products whose images are unchanged, refreshes the image descriptions and
 *    marks the images as studio renders;
 *  - replaces copy that described markings the new imagery doesn't show (monogram, engraved / hallmarked bars).
 * Products edited by the client keep their own text.
 */
export async function refreshCatalogue(db: Db, seed: Product[]) {
  const rows = await db.all<{ id: string; data: string; position: number }>("SELECT id, data, position FROM products");
  const byId = new Map(rows.map((r) => [r.id, r]));
  const outdated = /LG monogram|Our monogram|engraved face|hallmark design/;
  for (const sp of seed) {
    const row = byId.get(sp.id);
    if (!row) continue;
    const p = JSON.parse(row.data) as Product;
    let changed = false;
    const sameImages = p.images?.length === sp.images.length && p.images.every((im, i) => im.media === sp.images[i].media);
    if (sameImages) {
      p.images = sp.images;
      if (p.illustrativeImages === undefined) p.illustrativeImages = true;
      changed = true;
    }
    if (outdated.test(p.tagline)) {
      p.tagline = sp.tagline;
      changed = true;
    }
    if (p.description?.some((d) => outdated.test(d))) {
      p.description = sp.description;
      changed = true;
    }
    for (const spec of p.specs ?? []) {
      if (spec.value === "Minted, polished face") {
        spec.value = "Minted, mirror-polished";
        changed = true;
      }
    }
    if (changed) await db.run("UPDATE products SET data = $1 WHERE id = $2", [JSON.stringify(p), sp.id]);
  }
  const maxPos = rows.reduce((m, r) => Math.max(m, Number(r.position)), 0);
  const now = Date.now();
  const add = seed.filter((p) => p.category === "sets" && !byId.has(p.id));
  for (const [i, p] of add.entries()) {
    await db.run("INSERT INTO products (id, slug, position, archived, data, updated_at) VALUES ($1, $2, $3, 0, $4, $5) ON CONFLICT DO NOTHING", [p.id, p.slug, maxPos + 1 + i, JSON.stringify(p), now]);
  }
}

/**
 * Catalogue v3: remove packaging promises from the starting catalogue's copy ("presented in protective
 * packaging", "presented together in a lined gift box"). Only exact starting sentences are replaced, so
 * text the client has edited is left alone.
 */
export async function refreshCatalogueCopyV3(db: Db) {
  const swaps: [string, string][] = [
    ["Presented together in a lined gift box. Choose", "Offered together as a set. Choose"],
    ["A timeless way to own gold — for yourself, or as a gift that endures. Each bar is presented in protective packaging.", "A timeless way to own gold — for yourself, or as a gift that endures."],
  ];
  const rows = await db.all<{ id: string; data: string }>("SELECT id, data FROM products");
  for (const row of rows) {
    if (!swaps.some(([from]) => row.data.includes(from))) continue;
    const p = JSON.parse(row.data) as Product;
    p.description = (p.description ?? []).map((d) => swaps.reduce((t, [from, to]) => t.replace(from, to), d));
    await db.run("UPDATE products SET data = $1 WHERE id = $2", [JSON.stringify(p), row.id]);
  }
}
