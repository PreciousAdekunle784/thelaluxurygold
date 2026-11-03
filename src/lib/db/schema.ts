import "server-only";
import type { Db } from "./client";
import { products as seedProducts } from "@/lib/data/products";

const tables = (blob: string) => `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, position INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, updated_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  reference TEXT PRIMARY KEY, created_at BIGINT NOT NULL, day TEXT NOT NULL, status TEXT NOT NULL,
  email TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, country TEXT,
  subtotal_aed BIGINT NOT NULL DEFAULT 0, item_count INTEGER NOT NULL DEFAULT 0, has_por INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL, history TEXT NOT NULL, updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS orders_created ON orders (created_at);
CREATE INDEX IF NOT EXISTS orders_email ON orders (email);
CREATE TABLE IF NOT EXISTS page_views (
  id TEXT PRIMARY KEY, ts BIGINT NOT NULL, day TEXT NOT NULL, visitor_id TEXT NOT NULL, session_id TEXT,
  path TEXT NOT NULL, referrer TEXT, country TEXT, device TEXT, browser TEXT, is_new INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS pv_ts ON page_views (ts);
CREATE INDEX IF NOT EXISTS pv_day ON page_views (day);
CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, source TEXT, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, created_at BIGINT NOT NULL, name TEXT, email TEXT, phone TEXT, topic TEXT, message TEXT, is_read INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY, content_type TEXT NOT NULL, width INTEGER, height INTEGER, bytes ${blob} NOT NULL, created_at BIGINT NOT NULL
);
`;

export async function migrate(db: Db) {
  const ddl = tables(db.dialect === "postgres" ? "BYTEA" : "BLOB");
  if (db.dialect === "sqlite") await db.exec(ddl);
  else for (const stmt of ddl.split(";").map((s) => s.trim()).filter(Boolean)) await db.exec(stmt);

  // Seed the catalogue once. A flag (rather than "table is empty") means deleting every
  // product in the admin does not bring the samples back.
  const seeded = await db.get<{ value: string }>("SELECT value FROM meta WHERE key = $1", ["catalogue_seeded"]);
  if (!seeded) {
    const now = Date.now();
    for (const [i, p] of seedProducts.entries()) {
      await db.run("INSERT INTO products (id, slug, position, archived, data, updated_at) VALUES ($1, $2, $3, 0, $4, $5) ON CONFLICT DO NOTHING", [p.id, p.slug, i, JSON.stringify(p), now]);
    }
    await db.run("INSERT INTO meta (key, value) VALUES ($1, $2) ON CONFLICT DO NOTHING", ["catalogue_seeded", String(now)]);
  }
}
