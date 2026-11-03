"use server";

import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { setSetting } from "@/lib/repo/settings";
import { SETTINGS_TAG } from "@/lib/data/site-settings";

export async function setHeroImage(slot: "heroDesktop" | "heroMobile", key: string | null) {
  await requireAdmin();
  if (slot !== "heroDesktop" && slot !== "heroMobile") throw new Error("Unknown setting");
  if (key !== null && !/^uploads\/m[a-f0-9]{16}$/.test(key) && !/^editorial\/[a-z0-9-]+$/.test(key)) throw new Error("Invalid image");
  await setSetting(slot, key);
  updateTag(SETTINGS_TAG);
  revalidateTag(SETTINGS_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}
