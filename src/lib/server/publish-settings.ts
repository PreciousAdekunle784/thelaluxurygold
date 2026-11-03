import "server-only";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { SETTINGS_TAG } from "@/lib/data/site-settings";

/** Expire cached site settings so the store picks up a change immediately. */
export function publishSettings(...paths: string[]) {
  updateTag(SETTINGS_TAG);
  revalidateTag(SETTINGS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  for (const p of paths) revalidatePath(p);
}
