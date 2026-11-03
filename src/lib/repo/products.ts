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

export async function listProductRows(opts: { includeArchived?: boolean } = {}) {
  const db = await getDb();
  const rows = await db.all<Raw>(`SELECT data, position, archived, updated_at FROM products ${opts.includeArchived ? "" : "WHERE archived = 0"} ORDER BY position ASC, updated_at DESC`);
  return rows.map(parse);
}

export async function getProductRow(id: string) {
  const db = await getDb();
  const r = await db.get<Raw>("SELECT data, position, archived, updated_at FROM products WHERE id = $1", [id]);
  return r ? parse(r) : null;
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
  if (existing) {
    await db.run("UPDATE products SET slug = $2, data = $3, updated_at = $4 WHERE id = $1", [p.id, p.slug, JSON.stringify(p), now]);
  } else {
    const top = await db.get<{ m: number | null }>("SELECT MIN(position) AS m FROM products");
    await db.run("INSERT INTO products (id, slug, position, archived, data, updated_at) VALUES ($1, $2, $3, 0, $4, $5)", [p.id, p.slug, Number(top?.m ?? 0) - 1, JSON.stringify(p), now]);
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
