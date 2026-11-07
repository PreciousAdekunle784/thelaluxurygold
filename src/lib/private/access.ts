import "server-only";
import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { getDb } from "@/lib/db/client";
import { isAdmin } from "@/lib/auth/admin";

/*
 * The Private Collection — invitation-only access, enforced on the server.
 *
 * Codes:    12 random characters from a 31-letter alphabet (~59 bits), shown once to the admin.
 *           Only an HMAC of the normalised code is stored, plus its last four characters as a hint.
 * Sessions: redeeming a code creates a random 256-bit token in an HTTP-only cookie; only its SHA-256
 *           is stored. Every private request re-checks the session AND its code (active, not revoked,
 *           not expired), so revoking/deactivating a code ends access immediately.
 * Guessing: failed attempts are rate-limited per IP in the database (works across server instances).
 */

export const PRIVATE_COOKIE = "llg_private";
/** Non-secret hint cookie so the browser knows to load the private catalogue (security never relies on it). */
export const PRIVATE_HINT_COOKIE = "llg_pc";
const SESSION_DAYS = 30;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
const FAIL_LIMIT = 8;
const FAIL_WINDOW_MS = 15 * 60_000;

export type CodeStatus = "active" | "inactive" | "revoked";

export interface PrivateCode {
  id: string;
  hint: string;
  name: string;
  email: string;
  reference: string;
  singleUse: boolean;
  status: CodeStatus;
  expiresAt: number | null;
  createdAt: number;
  uses: number;
  firstUsedAt: number | null;
  lastUsedAt: number | null;
  revokedAt: number | null;
}

/** What the admin sees for a code (expired / used are derived). */
export function displayStatus(c: PrivateCode, now = Date.now()): "active" | "inactive" | "revoked" | "expired" | "used" {
  if (c.status === "revoked") return "revoked";
  if (c.expiresAt != null && c.expiresAt <= now) return "expired";
  if (c.status === "inactive") return "inactive";
  if (c.singleUse && c.uses > 0) return "used";
  return "active";
}

// ------------------------------------------------------------------------------------- hashing
let pepperCache: string | null = null;
async function pepper() {
  if (process.env.PRIVATE_ACCESS_SECRET) return process.env.PRIVATE_ACCESS_SECRET;
  if (pepperCache) return pepperCache;
  // Generated once per installation and kept in the database, so changing the admin password never invalidates invitations.
  const db = await getDb();
  const row = await db.get<{ value: string }>("SELECT value FROM meta WHERE key = $1", ["private_pepper"]);
  if (row?.value) return (pepperCache = row.value);
  const fresh = randomBytes(32).toString("base64url");
  await db.run("INSERT INTO meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", ["private_pepper", fresh]);
  const again = await db.get<{ value: string }>("SELECT value FROM meta WHERE key = $1", ["private_pepper"]);
  return (pepperCache = again?.value ?? fresh);
}

/** Codes are typed by people: ignore case, spaces, dashes and the LLG prefix. */
export function normaliseCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^LLG/, "");
}

async function hashCode(normalised: string) {
  return createHmac("sha256", await pepper()).update(normalised).digest("hex");
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function newCode() {
  let raw = "";
  for (let i = 0; i < 12; i++) raw += ALPHABET[randomInt(ALPHABET.length)];
  return { raw, display: `LLG-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}` };
}

// ------------------------------------------------------------------------------------- admin
type Raw = Record<string, unknown>;
const parse = (r: Raw): PrivateCode => ({
  id: String(r.id),
  hint: String(r.code_hint),
  name: String(r.name ?? ""),
  email: String(r.email ?? ""),
  reference: String(r.reference ?? ""),
  singleUse: !!Number(r.single_use),
  status: String(r.status) as CodeStatus,
  expiresAt: r.expires_at == null ? null : Number(r.expires_at),
  createdAt: Number(r.created_at),
  uses: Number(r.uses ?? 0),
  firstUsedAt: r.first_used_at == null ? null : Number(r.first_used_at),
  lastUsedAt: r.last_used_at == null ? null : Number(r.last_used_at),
  revokedAt: r.revoked_at == null ? null : Number(r.revoked_at),
});

export async function listCodes() {
  const db = await getDb();
  return (await db.all<Raw>("SELECT * FROM private_codes ORDER BY created_at DESC")).map(parse);
}

/** Create an invitation. Returns the plaintext code — the only time it ever exists. */
export async function createCode(input: { name: string; email: string; reference: string; singleUse: boolean; expiresAt: number | null }) {
  const db = await getDb();
  const now = Date.now();
  const { raw, display } = newCode();
  const id = `pc_${randomBytes(8).toString("hex")}`;
  await db.run(
    `INSERT INTO private_codes (id, code_hash, code_hint, name, email, reference, single_use, status, expires_at, created_at, uses, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, 0, $9)`,
    [id, await hashCode(raw), raw.slice(-4), input.name, input.email, input.reference, input.singleUse ? 1 : 0, input.expiresAt, now],
  );
  return { id, code: display };
}

/** Replace a code with a new one (the old code and its sessions stop working). */
export async function regenerateCode(id: string) {
  const db = await getDb();
  const { raw, display } = newCode();
  const now = Date.now();
  await db.run("UPDATE private_codes SET code_hash = $2, code_hint = $3, uses = 0, first_used_at = NULL, status = CASE WHEN status = 'revoked' THEN 'active' ELSE status END, revoked_at = NULL, updated_at = $4 WHERE id = $1", [
    id, await hashCode(raw), raw.slice(-4), now,
  ]);
  await db.run("UPDATE private_sessions SET revoked = 1 WHERE code_id = $1", [id]);
  return { id, code: display };
}

export async function setCodeStatus(id: string, status: CodeStatus) {
  const db = await getDb();
  const now = Date.now();
  await db.run("UPDATE private_codes SET status = $2, revoked_at = CASE WHEN $2 = 'revoked' THEN $3 ELSE revoked_at END, updated_at = $3 WHERE id = $1", [id, status, now]);
  if (status !== "active") await db.run("UPDATE private_sessions SET revoked = 1 WHERE code_id = $1", [id]);
}

export async function setCodeExpiry(id: string, expiresAt: number | null) {
  const db = await getDb();
  await db.run("UPDATE private_codes SET expires_at = $2, updated_at = $3 WHERE id = $1", [id, expiresAt, Date.now()]);
  // sessions never outlive their code
  if (expiresAt != null) await db.run("UPDATE private_sessions SET expires_at = $2 WHERE code_id = $1 AND expires_at > $2", [id, expiresAt]);
}

export async function activeSessionCounts() {
  const db = await getDb();
  const rows = await db.all<{ code_id: string; n: number }>("SELECT code_id, COUNT(*) AS n FROM private_sessions WHERE revoked = 0 AND expires_at > $1 GROUP BY code_id", [Date.now()]);
  return new Map(rows.map((r) => [r.code_id, Number(r.n)]));
}

// ------------------------------------------------------------------------------------- rate limiting
async function clientKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return `private:${sha256(ip)}`;
}

async function isLimited(key: string) {
  const db = await getDb();
  const r = await db.get<{ count: number; window_start: number }>("SELECT count, window_start FROM rate_limits WHERE key = $1", [key]);
  return !!r && Date.now() - Number(r.window_start) < FAIL_WINDOW_MS && Number(r.count) >= FAIL_LIMIT;
}

async function recordFailure(key: string) {
  const db = await getDb();
  const now = Date.now();
  await db.run(
    `INSERT INTO rate_limits (key, count, window_start) VALUES ($1, 1, $2)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN $2 - rate_limits.window_start >= $3 THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE WHEN $2 - rate_limits.window_start >= $3 THEN $2 ELSE rate_limits.window_start END`,
    [key, now, FAIL_WINDOW_MS],
  );
}

// ------------------------------------------------------------------------------------- redeem & sessions
export type RedeemResult = { ok: true } | { ok: false; reason: "invalid" | "limited" };

/**
 * Validate a code and, if valid, start a private session (sets the cookies).
 * Invalid, expired, revoked, inactive and already-used codes all give the same answer.
 */
export async function redeemCode(input: string): Promise<RedeemResult> {
  const key = await clientKey();
  if (await isLimited(key)) return { ok: false, reason: "limited" };
  const normalised = normaliseCode(input);
  const db = await getDb();
  const row = normalised.length === 12 ? await db.get<Raw>("SELECT * FROM private_codes WHERE code_hash = $1", [await hashCode(normalised)]) : undefined;
  const now = Date.now();
  const code = row ? parse(row) : null;
  if (!code || displayStatus(code, now) !== "active") {
    await recordFailure(key);
    await new Promise((r) => setTimeout(r, 350)); // slow down scripted guessing a little more
    return { ok: false, reason: "invalid" };
  }
  // single-use codes: the conditional update makes the claim atomic, so two simultaneous redemptions can't both succeed
  const claim = code.singleUse ? " AND uses = 0" : "";
  await db.run(`UPDATE private_codes SET uses = uses + 1, first_used_at = COALESCE(first_used_at, $2), last_used_at = $2, updated_at = $2 WHERE id = $1${claim}`, [code.id, now]);
  if (code.singleUse) {
    const after = await db.get<{ uses: number; last_used_at: number }>("SELECT uses, last_used_at FROM private_codes WHERE id = $1", [code.id]);
    if (!after || Number(after.uses) !== 1 || Number(after.last_used_at) !== now) {
      await recordFailure(key);
      return { ok: false, reason: "invalid" };
    }
  }
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Math.min(now + SESSION_DAYS * 86_400_000, code.expiresAt ?? Infinity);
  await db.run("INSERT INTO private_sessions (token_hash, code_id, created_at, expires_at, last_seen_at, revoked) VALUES ($1, $2, $3, $4, $3, 0)", [sha256(token), code.id, now, expiresAt]);
  const jar = await cookies();
  const opts = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", expires: new Date(expiresAt) };
  jar.set(PRIVATE_COOKIE, token, { ...opts, httpOnly: true });
  jar.set(PRIVATE_HINT_COOKIE, "1", { ...opts, httpOnly: false });
  return { ok: true };
}

/** Is the current visitor allowed into the Private Collection? (valid session, or a signed-in admin) */
export async function hasPrivateAccess(): Promise<boolean> {
  if (await privateSession()) return true;
  return isAdmin();
}

/** The visitor's valid private session, re-checked against its code on every call. */
export async function privateSession() {
  await connection(); // always request-time: never part of a prerendered shell
  const token = (await cookies()).get(PRIVATE_COOKIE)?.value;
  if (!token || token.length < 32) return null;
  const db = await getDb();
  const now = Date.now();
  const row = await db.get<Raw>(
    `SELECT s.token_hash, s.last_seen_at, s.expires_at AS s_exp, c.* FROM private_sessions s JOIN private_codes c ON c.id = s.code_id
      WHERE s.token_hash = $1 AND s.revoked = 0 AND s.expires_at > $2`,
    [sha256(token), now],
  );
  if (!row) return null;
  const code = parse(row);
  // a used single-use code still admits the session it created; everything else must be currently valid
  const status = displayStatus(code, now);
  if (status !== "active" && status !== "used") return null;
  if (now - Number(row.last_seen_at) > 10 * 60_000) {
    await db.run("UPDATE private_sessions SET last_seen_at = $2 WHERE token_hash = $1", [row.token_hash, now]);
    await db.run("UPDATE private_codes SET last_used_at = $2 WHERE id = $1", [code.id, now]);
  }
  return { codeId: code.id, name: code.name };
}

/** Leave the Private Collection on this device. */
export async function endPrivateSession() {
  const jar = await cookies();
  const token = jar.get(PRIVATE_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.run("UPDATE private_sessions SET revoked = 1 WHERE token_hash = $1", [sha256(token)]);
  }
  jar.delete(PRIVATE_COOKIE);
  jar.delete(PRIVATE_HINT_COOKIE);
}
