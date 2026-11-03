"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { setMessageRead } from "@/lib/repo/misc";
import { removeSubscriber } from "@/lib/repo/misc";

export async function toggleRead(id: string, read: boolean) {
  await requireAdmin();
  await setMessageRead(id, read);
  revalidatePath("/admin/messages");
}

export async function unsubscribe(email: string) {
  await requireAdmin();
  await removeSubscriber(email);
  revalidatePath("/admin/subscribers");
}
