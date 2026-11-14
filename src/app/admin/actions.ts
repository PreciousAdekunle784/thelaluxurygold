"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, SESSION_TTL_MS, adminConfigured, checkPassword, createToken } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/admin";
import { databaseStatus } from "@/lib/db/client";

const attempts = new Map<string, { n: number; first: number }>();

export async function login(_: { error?: string } | undefined, form: FormData) {
  if (!adminConfigured()) return { error: "Admin is not configured. Set ADMIN_PASSWORD in the environment." };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const a = attempts.get(ip);
  const now = Date.now();
  if (a && now - a.first < 10 * 60_000 && a.n >= 8) return { error: "Too many attempts. Please wait a few minutes and try again." };

  const ok = await checkPassword(String(form.get("password") ?? ""));
  if (!ok) {
    attempts.set(ip, a && now - a.first < 10 * 60_000 ? { n: a.n + 1, first: a.first } : { n: 1, first: now });
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Incorrect password." };
  }
  attempts.delete(ip);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await createToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/** Database diagnostics for the admin error screen (admin only; never includes the password). */
export async function databaseDiagnostics() {
  await requireAdmin();
  return databaseStatus();
}
