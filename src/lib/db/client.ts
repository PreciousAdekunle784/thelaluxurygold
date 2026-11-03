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

const g = globalThis as unknown as { __llgDb?: Promise<Db>; __llgDbFailure?: { at: number; error: Error } };

/** After a failed connection, fail fast for this long instead of hammering the database
 *  (Supabase's pooler temporarily blocks clients after repeated failed logins). */
const FAILURE_BACKOFF_MS = 30_000;

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

export interface ParsedDbUrl {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  issues: string[];
}

/**
 * Parse a PostgreSQL connection string by hand (splitting on the LAST "@"), so passwords
 * containing @ # / ? : % work without URL-encoding. Also collects human-readable problems
 * for the admin — never including the password itself.
 */
export function parseDatabaseUrl(input: string): ParsedDbUrl {
  const url = input.trim().replace(/^["']|["']$/g, "");
  if (/^https?:\/\//i.test(url)) {
    throw new DatabaseConfigError(
      "DATABASE_URL is set to a web address (like https://xxxx.supabase.co). It must be the PostgreSQL connection string from Supabase → Connect → Transaction pooler, starting with postgresql://",
    );
  }
  const m = /^postgres(?:ql)?:\/\/(.*)$/i.exec(url);
  if (!m) throw new DatabaseConfigError("DATABASE_URL must start with postgresql://");
  const raw = m[1];
  const at = raw.lastIndexOf("@");
  if (at < 0) throw new DatabaseConfigError("DATABASE_URL has no user/password part (expected postgresql://user:password@host:port/postgres).");
  const userinfo = raw.slice(0, at);
  const rest = raw.slice(at + 1);
  const colon = userinfo.indexOf(":");
  const user = colon < 0 ? userinfo : userinfo.slice(0, colon);
  let password = colon < 0 ? "" : userinfo.slice(colon + 1);
  const hp = /^([^:/?#]+)(?::(\d+))?(?:\/([^?#]*))?/.exec(rest);
  if (!hp) throw new DatabaseConfigError("DATABASE_URL host is not valid.");
  const host = hp[1];
  const port = Number(hp[2] ?? 5432);
  const database = decodeURIComponent(hp[3] || "postgres");

  const issues: string[] = [];
  if (/\[YOUR-PASSWORD\]/i.test(password)) throw new DatabaseConfigError("DATABASE_URL still contains [YOUR-PASSWORD] — replace it (including the square brackets) with your Supabase database password.");
  if (!password) issues.push("There is no password in DATABASE_URL (expected postgresql://user:PASSWORD@host…).");
  if (password.startsWith("[") && password.endsWith("]")) {
    issues.push("Your password is wrapped in square brackets [ ]. Remove the brackets — they were only part of the [YOUR-PASSWORD] placeholder.");
  }
  if (/\.pooler\.supabase\.com$/i.test(host) && !user.includes(".")) {
    issues.push('For the Supabase pooler the username must be "postgres.<your-project-ref>" (e.g. postgres.fzudfnxhrdcoeprflooj), not just "postgres".');
  }
  if (/\.pooler\.supabase\.com$/i.test(host) && port !== 6543 && port !== 5432) issues.push("Supabase pooler ports are 6543 (transaction) or 5432 (session).");
  if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(host)) issues.push("This is the direct connection address. Many hosts (including Vercel) cannot reach it — use the Transaction pooler string instead.");
  // Accept URL-encoded passwords (e.g. %40 for @) as well as raw ones.
  if (/%[0-9a-f]{2}/i.test(password)) {
    try {
      password = decodeURIComponent(password);
    } catch {
      /* keep raw */
    }
  }
  return { user: decodeURIComponent(user), password, host, port, database, issues };
}

/** Kept for callers that only need validation. */
export function checkDatabaseUrl(url: string) {
  parseDatabaseUrl(url);
}

async function postgresDb(url: string): Promise<Db> {
  const cfg = parseDatabaseUrl(url);
  const { default: postgres } = await import("postgres");
  const local = /^(localhost|127\.0\.0\.1)$/.test(cfg.host);
  // prepare:false is required for Supabase's transaction pooler (port 6543); SSL for hosted databases.
  const sql = postgres({
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    username: cfg.user,
    password: cfg.password,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {}, // silence "already exists, skipping" notices from idempotent DDL
    prepare: false,
    ssl: local ? false : "require",
    types: { bigint: postgres.BigInt },
  });
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
      // Simple protocol: allows several statements in one round trip (one implicit transaction).
      await sql.unsafe(q).simple();
    },
  };
}

export function getDb(): Promise<Db> {
  const failure = g.__llgDbFailure;
  if (!g.__llgDb && failure && performance.now() - failure.at < FAILURE_BACKOFF_MS) return Promise.reject(failure.error);
  if (!g.__llgDb) {
    g.__llgDb = (async () => {
      const db = process.env.DATABASE_URL ? await postgresDb(process.env.DATABASE_URL) : sqliteDb();
      await migrate(db);
      g.__llgDbFailure = undefined;
      return db;
    })().catch((err) => {
      g.__llgDb = undefined;
      g.__llgDbFailure = { at: performance.now(), error: err instanceof Error ? err : new Error(String(err)) };
      throw err;
    });
  }
  return g.__llgDb;
}

/** Reject if `p` takes longer than `ms` (keeps prerendering well inside Next's 50 s limit). */
export function withTimeout<T>(p: Promise<T>, ms: number, label = "database"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} did not respond within ${ms / 1000}s`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Live connection check for the admin (never exposes the password). */
export async function databaseStatus(): Promise<{ ok: boolean; dialect: Dialect; host: string; user?: string; message?: string; hints: string[] }> {
  const url = process.env.DATABASE_URL;
  let host = "local SQLite file";
  let user: string | undefined;
  let hints: string[] = [];
  if (url) {
    try {
      const p = parseDatabaseUrl(url);
      host = p.host;
      user = p.user;
      hints = p.issues;
    } catch {
      host = "invalid DATABASE_URL";
    }
  }
  try {
    let db: Db;
    try {
      db = await getDb();
      await db.get("SELECT 1 AS ok");
    } catch (first) {
      // One retry for transient blips (pooler hiccup, a cold instance) before reporting.
      if (!/timeout|terminat|ECONNRESET|reset/i.test(String(first))) throw first;
      await new Promise((r) => setTimeout(r, 400));
      g.__llgDbFailure = undefined;
      db = await getDb();
      await db.get("SELECT 1 AS ok");
    }
    return { ok: true, dialect: db.dialect, host, user, hints: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message.replace(/postgres(ql)?:\/\/[^\s]+/gi, "[connection string]") : String(err);
    if (/password authentication failed/i.test(message) && !hints.length) {
      hints = [
        "The username and address are fine, but Supabase rejected the password.",
        "Use the DATABASE password (Supabase → Project Settings → Database), not your Supabase account password.",
        "Easiest fix: click “Reset database password”, choose one with only letters and numbers, paste it into DATABASE_URL, save, and redeploy.",
      ];
    }
    if (/tenant or user not found/i.test(message)) hints.push('Supabase could not find the project: check the username is "postgres.<your-project-ref>" and the region in the address matches your project.');
    if (/ENOTFOUND|getaddrinfo/i.test(message)) hints.push("The database address could not be found — copy the connection string again from Supabase → Connect.");
    if (/statement timeout/i.test(message)) {
      hints.push("Supabase answered but a query took too long. This is usually temporary — reload in a few seconds. If it keeps happening, make sure the site's Vercel functions run in the same region as your database (this project sets Dublin, dub1, in vercel.json).");
    } else if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(message)) {
      hints.push("The connection timed out — use the Transaction pooler string (port 6543).");
    }
    return { ok: false, dialect: url ? "postgres" : "sqlite", host, user, message, hints };
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
