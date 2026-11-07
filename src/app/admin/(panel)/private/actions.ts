"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createCode, regenerateCode, setCodeExpiry, setCodeStatus, type CodeStatus } from "@/lib/private/access";

export type IssueResult = { ok: true; code: string; name: string } | { ok: false; error: string };

/** Parse a YYYY-MM-DD date as the end of that day (Dubai time). Empty = no expiry. */
function parseExpiry(v: unknown): number | null | "invalid" {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "invalid";
  const t = Date.parse(`${s}T23:59:59+04:00`);
  return Number.isFinite(t) ? t : "invalid";
}

export async function issueCode(_prev: IssueResult | undefined, form: FormData): Promise<IssueResult> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const email = String(form.get("email") ?? "").trim().slice(0, 120);
  const reference = String(form.get("reference") ?? "").trim().slice(0, 120);
  const expiresAt = parseExpiry(form.get("expires"));
  if (!name && !email && !reference) return { ok: false, error: "Add the customer's name, email or an invitation reference, so you know who this code is for." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "That email address doesn't look right." };
  if (expiresAt === "invalid") return { ok: false, error: "Choose a valid expiry date." };
  if (expiresAt != null && expiresAt <= Date.now()) return { ok: false, error: "The expiry date must be in the future." };
  const { code } = await createCode({ name, email, reference, singleUse: form.get("singleUse") === "on", expiresAt });
  revalidatePath("/admin/private");
  return { ok: true, code, name: name || email || reference };
}

export async function regenerate(id: string): Promise<{ code: string }> {
  await requireAdmin();
  const { code } = await regenerateCode(id);
  revalidatePath("/admin/private");
  return { code };
}

export async function changeStatus(id: string, status: CodeStatus) {
  await requireAdmin();
  if (!["active", "inactive", "revoked"].includes(status)) throw new Error("Invalid status");
  await setCodeStatus(id, status);
  revalidatePath("/admin/private");
}

export async function changeExpiry(id: string, date: string) {
  await requireAdmin();
  const expiresAt = parseExpiry(date);
  if (expiresAt === "invalid") throw new Error("Invalid date");
  await setCodeExpiry(id, expiresAt);
  revalidatePath("/admin/private");
}
