import "server-only";
import path from "node:path";
import fs from "node:fs";
import { migrate } from "./schema";

/**
 * Minimal SQL client used by the admin and store.
 *
 *  - DATABASE_URL set  → PostgreSQL (Neon, Supabase, RDS, Railway…). Use this in production.
 *  - otherwise         → a local SQLite file (.data/llg.sqlite) via Node's built-in `node:sqlite`.
 *                        Zero-config for development and single-server hosting.
 *
 * Queries are written once with `$1, $2…` placeholders and portable SQL.
 */
export type Dialect = "sqlite" | "postgres";

export interface Db {
  dialect: Dialect;
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
  run(sql: string, params?: unknown[]): Promise<void>;
  exec(sql: string): Promise<void>;
}

const g = globalThis as unknown as { __llgDb?: Promise<Db> };

function sqliteDb(): Db {
  // Loaded at runtime via getBuiltinModule so the bundler never tries to resolve it
  // (and Postgres deployments never touch it). Requires Node.js 22.13+.
  const { DatabaseSync } = process.getBuiltinModule("node:sqlite") as typeof import("node:sqlite");
  const file = process.env.SQLITE_PATH ?? path.join(process.cwd(), ".data", "llg.sqlite");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA busy_timeout = 8000; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");
  const conv = (sql: string) => sql.replace(/\$(\d+)/g, "?$1");
  const norm = (params: unknown[] = []) =>
    params.map((p) => (p === undefined ? null : typeof p === "boolean" ? (p ? 1 : 0) : p instanceof Buffer ? new Uint8Array(p) : p)) as never[];
  return {
    dialect: "sqlite",
    async all(sql, params) {
      return db.prepare(conv(sql)).all(...norm(params)) as never;
    },
    async get(sql, params) {
      return db.prepare(conv(sql)).get(...norm(params)) as never;
    },
    async run(sql, params) {
      db.prepare(conv(sql)).run(...norm(params));
    },
    async exec(sql) {
      db.exec(sql);
    },
  };
}

export class DatabaseConfigError extends Error {}

/** Catch the most common Supabase mistake: pasting the project URL instead of the connection string. */
export function checkDatabaseUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    throw new DatabaseConfigError(
      "DATABASE_URL is set to a web address (like https://xxxx.supabase.co). It must be the PostgreSQL connection string from Supabase → Project Settings → Database → Connection string → Transaction pooler, starting with postgresql://",
    );
  }
  if (!/^postgres(ql)?:\/\//i.test(url)) throw new DatabaseConfigError("DATABASE_URL must start with postgresql://");
  if (/\[YOUR-PASSWORD\]/i.test(url)) throw new DatabaseConfigError("DATABASE_URL still contains [YOUR-PASSWORD] — replace it with your Supabase database password.");
}

async function postgresDb(url: string): Promise<Db> {
  checkDatabaseUrl(url);
  const { default: postgres } = await import("postgres");
  const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
  // prepare:false is required for Supabase's transaction pooler (port 6543); SSL for hosted databases.
  const sql = postgres(url, { max: 5, idle_timeout: 20, prepare: false, ssl: local ? false : "require", types: { bigint: postgres.BigInt } });
  const norm = (params: unknown[] = []) => params.map((p) => (p === undefined ? null : p)) as never[];
  const fix = <T,>(rows: T[]) =>
    rows.map((r) => {
      const o = { ...(r as Record<string, unknown>) };
      for (const k in o) if (typeof o[k] === "bigint") o[k] = Number(o[k]);
      return o as T;
    });
  return {
    dialect: "postgres",
    async all(q, params) {
      return fix(await sql.unsafe(q, norm(params))) as never;
    },
    async get(q, params) {
      return fix(await sql.unsafe(q, norm(params)))[0] as never;
    },
    async run(q, params) {
      await sql.unsafe(q, norm(params));
    },
    async exec(q) {
      await sql.unsafe(q);
    },
  };
}

export function getDb(): Promise<Db> {
  if (!g.__llgDb) {
    g.__llgDb = (async () => {
      const db = process.env.DATABASE_URL ? await postgresDb(process.env.DATABASE_URL) : sqliteDb();
      await migrate(db);
      return db;
    })().catch((err) => {
      g.__llgDb = undefined;
      throw err;
    });
  }
  return g.__llgDb;
}

/** Live connection check for the admin (never exposes the password). */
export async function databaseStatus(): Promise<{ ok: boolean; dialect: Dialect; host: string; message?: string }> {
  const url = process.env.DATABASE_URL;
  let host = "local SQLite file";
  if (url) {
    try {
      host = new URL(url).hostname;
    } catch {
      host = "invalid DATABASE_URL";
    }
  }
  try {
    const db = await getDb();
    await db.get("SELECT 1 AS ok");
    return { ok: true, dialect: db.dialect, host };
  } catch (err) {
    const message = err instanceof Error ? err.message.replace(/postgres(ql)?:\/\/[^\s]+/gi, "[connection string]") : String(err);
    return { ok: false, dialect: url ? "postgres" : "sqlite", host, message };
  }
}

export function databaseInfo() {
  return {
    dialect: (process.env.DATABASE_URL ? "postgres" : "sqlite") as Dialect,
    ephemeralRisk: !process.env.DATABASE_URL && (!!process.env.VERCEL || !!process.env.NETLIFY),
  };
}

export function newId(prefix = "") {
  return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
