import "server-only";
import { getDb } from "@/lib/db/client";
import type { Product } from "@/lib/data/types";

export interface ProductRow {
  product: Product;
  position: number;
  archived: boolean;
  updatedAt: number;
}

type Raw = { data: string; position: number; archived: number | boolean; updated_at: number };
const parse = (r: Raw): ProductRow => ({ product: JSON.parse(r.data) as Product, position: Number(r.position), archived: !!Number(r.archived), updatedAt: Number(r.updated_at) });

/**
 * Products for listing. Defaults to the PUBLIC store: private (Private Collection) products are
 * excluded in the query itself, so they can never leak into public pages, search, the sitemap or
 * the catalogue sent to browsers. Pass `visibility: "private"` (access-checked callers only) or "all" (admin).
 */
export async function listProductRows(opts: { includeArchived?: boolean; visibility?: "public" | "private" | "all" } = {}) {
  const db = await getDb();
  const where: string[] = [];
  if (!opts.includeArchived) where.push("archived = 0");
  const visibility = opts.visibility ?? "public";
  if (visibility === "public") where.push("private = 0");
  if (visibility === "private") where.push("private = 1");
  const rows = await db.all<Raw & { private?: number }>(
    `SELECT data, position, archived, updated_at, private FROM products ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY position ASC, updated_at DESC`,
  );
  return rows.map((r) => {
    const row = parse(r);
    row.product.private = !!Number(r.private);
    return row;
  });
}

export async function getProductRow(id: string) {
  const db = await getDb();
  const r = await db.get<Raw & { private?: number }>("SELECT data, position, archived, updated_at, private FROM products WHERE id = $1", [id]);
  if (!r) return null;
  const row = parse(r);
  row.product.private = !!Number(r.private);
  return row;
}

export async function slugTaken(slug: string, exceptId?: string) {
  const db = await getDb();
  const r = await db.get<{ id: string }>("SELECT id FROM products WHERE slug = $1", [slug]);
  return !!r && r.id !== exceptId;
}

export async function saveProduct(p: Product) {
  const db = await getDb();
  const existing = await db.get<{ position: number }>("SELECT position FROM products WHERE id = $1", [p.id]);
  const now = Date.now();
  const priv = p.private ? 1 : 0;
  if (existing) {
    await db.run("UPDATE products SET slug = $2, data = $3, updated_at = $4, private = $5 WHERE id = $1", [p.id, p.slug, JSON.stringify(p), now, priv]);
  } else {
    const top = await db.get<{ m: number | null }>("SELECT MIN(position) AS m FROM products");
    await db.run("INSERT INTO products (id, slug, position, archived, data, updated_at, private) VALUES ($1, $2, $3, 0, $4, $5, $6)", [
      p.id, p.slug, Number(top?.m ?? 0) - 1, JSON.stringify(p), now, priv,
    ]);
  }
}

export async function setArchived(id: string, archived: boolean) {
  const db = await getDb();
  await db.run("UPDATE products SET archived = $2, updated_at = $3 WHERE id = $1", [id, archived ? 1 : 0, Date.now()]);
}

export async function deleteProduct(id: string) {
  const db = await getDb();
  await db.run("DELETE FROM products WHERE id = $1", [id]);
}
