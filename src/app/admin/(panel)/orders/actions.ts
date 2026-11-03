"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { orderStatuses, updateOrderStatus, type OrderStatus } from "@/lib/repo/orders";

export async function setOrderStatus(_: { ok?: boolean; error?: string } | undefined, form: FormData) {
  await requireAdmin();
  const reference = String(form.get("reference") ?? "");
  const status = String(form.get("status") ?? "") as OrderStatus;
  const note = String(form.get("note") ?? "").trim().slice(0, 500);
  if (!orderStatuses.some((s) => s.id === status)) return { error: "Choose a valid status." };
  try {
    await updateOrderStatus(reference, status, note || undefined);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not update the order." };
  }
  revalidatePath(`/admin/orders/${reference}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}
