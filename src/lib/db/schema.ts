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
CREATE INDEX IF NOT EXISTS pv_visitor ON page_views (visitor_id);
CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, source TEXT, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, created_at BIGINT NOT NULL, name TEXT, email TEXT, phone TEXT, topic TEXT, message TEXT, is_read INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY, content_type TEXT NOT NULL, width INTEGER, height INTEGER, bytes ${blob} NOT NULL, created_at BIGINT NOT NULL
);
`;

/** Bump when the DDL above changes; the full migration then runs once. */
export const SCHEMA_VERSION = "2";

const RLS_TABLES = ["meta", "products", "orders", "page_views", "subscribers", "messages", "media"];

async function schemaIsCurrent(db: Db) {
  try {
    const v = await db.get<{ value: string }>("SELECT value FROM meta WHERE key = $1", ["schema_version"]);
    return v?.value === SCHEMA_VERSION;
  } catch {
    return false; // meta table missing → first run
  }
}

/**
 * Runs on every cold start, so the common path must be a single cheap read.
 *
 * Serverless hosts start many short-lived instances. Re-running CREATE INDEX / ALTER TABLE
 * on each of them takes table locks that queue behind (and block) live traffic, which
 * surfaces as "canceling statement due to statement timeout". So we check a version flag
 * first and only run DDL when the schema is actually out of date — with a short lock
 * timeout so it can never stall the site.
 */
export async function migrate(db: Db) {
  if (!(await schemaIsCurrent(db))) {
    const ddl = tables(db.dialect === "postgres" ? "BYTEA" : "BLOB");
    try {
      if (db.dialect === "sqlite") {
        await db.exec(ddl);
      } else {
        // Sent as one round trip = one implicit transaction, so SET LOCAL covers every
        // statement (this also works through Supabase's transaction pooler).
        const rls = `DO $$ DECLARE t text; BEGIN
          FOREACH t IN ARRAY ARRAY[${RLS_TABLES.map((t) => `'${t}'`).join(",")}] LOOP
            IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = ('public.' || t)::regclass) THEN
              EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            END IF;
          END LOOP;
        END $$;`;
        await db.exec(`SET LOCAL lock_timeout = '4s';\nSET LOCAL statement_timeout = '30s';\n${ddl}\n${rls}`);
      }
      await db.run("INSERT INTO meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", ["schema_version", SCHEMA_VERSION]);
    } catch (err) {
      // Another instance may be migrating at the same moment. If the tables already exist,
      // carry on — a later start will finish the job.
      try {
        await db.get("SELECT 1 AS ok FROM products LIMIT 1");
        console.warn("[db] schema update deferred:", err instanceof Error ? err.message : err);
      } catch {
        throw err;
      }
    }
  }

  // Seed the catalogue once (one statement). A flag rather than "table is empty" means
  // deleting every product in the admin does not bring the samples back.
  const seeded = await db.get<{ value: string }>("SELECT value FROM meta WHERE key = $1", ["catalogue_seeded"]);
  if (!seeded) {
    const now = Date.now();
    const values = seedProducts.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, 0, $${i * 5 + 4}, $${i * 5 + 5})`).join(", ");
    await db.run(
      `INSERT INTO products (id, slug, position, archived, data, updated_at) VALUES ${values} ON CONFLICT DO NOTHING`,
      seedProducts.flatMap((p, i) => [p.id, p.slug, i, JSON.stringify(p), now]),
    );
    await db.run("INSERT INTO meta (key, value) VALUES ($1, $2) ON CONFLICT DO NOTHING", ["catalogue_seeded", String(now)]);
  }
}
