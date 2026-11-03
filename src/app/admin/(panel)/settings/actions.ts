"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { setSetting } from "@/lib/repo/settings";
import { publishSettings } from "@/lib/server/publish-settings";

export async function setHeroImage(slot: "heroDesktop" | "heroMobile", key: string | null) {
  await requireAdmin();
  if (slot !== "heroDesktop" && slot !== "heroMobile") throw new Error("Unknown setting");
  if (key !== null && !/^uploads\/m[a-f0-9]{16}$/.test(key) && !/^editorial\/[a-z0-9-]+$/.test(key)) throw new Error("Invalid image");
  await setSetting(slot, key);
  publishSettings("/admin/settings");
}

export async function setNgnRate(rate: number): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const n = Math.round(Number(rate) * 100) / 100;
  if (!Number.isFinite(n) || n < 1 || n > 100_000) return { ok: false, error: "Enter the number of naira per US dollar, e.g. 1550." };
  await setSetting("ngnPerUsd", String(n));
  publishSettings("/admin/settings");
  return { ok: true };
}
