/**
 * Admin session tokens — signed with HMAC-SHA256 via Web Crypto so they can be verified
 * both in `proxy.ts` and in server code. Token format: `<expiresAtMs>.<base64url signature>`.
 */
export const ADMIN_COOKIE = "llg_admin";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET || (process.env.ADMIN_PASSWORD ? `llg::${process.env.ADMIN_PASSWORD}` : "");
  return s || null;
}

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hmac(data: string) {
  const s = secret();
  if (!s) throw new Error("Admin is not configured");
  const key = await crypto.subtle.importKey("raw", enc.encode(s), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export function adminConfigured() {
  return !!process.env.ADMIN_PASSWORD;
}

export async function createToken(now = Date.now()) {
  const exp = String(now + SESSION_TTL_MS);
  return `${exp}.${await hmac(exp)}`;
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function verifyToken(token: string | undefined | null, now = Date.now()) {
  if (!token || !secret()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  return safeEqual(sig, await hmac(exp));
}

/** Constant-time password check (compares SHA-256 digests). */
export async function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(input)), crypto.subtle.digest("SHA-256", enc.encode(expected))]);
  return safeEqual(b64url(a), b64url(b));
}
