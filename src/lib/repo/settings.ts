import "server-only";
import { getDb } from "@/lib/db/client";

/** Site settings live in the `meta` key/value table, prefixed with "setting:". */
export async function getSettings(keys: string[]) {
  const db = await getDb();
  const ph = keys.map((_, i) => `$${i + 1}`).join(",");
  const rows = await db.all<{ key: string; value: string }>(
    `SELECT key, value FROM meta WHERE key IN (${ph})`,
    keys.map((k) => `setting:${k}`),
  );
  return Object.fromEntries(rows.map((r) => [r.key.slice(8), r.value])) as Record<string, string | undefined>;
}

export async function setSetting(key: string, value: string | null) {
  const db = await getDb();
  if (value == null) {
    await db.run("UPDATE meta SET value = '' WHERE key = $1", [`setting:${key}`]);
    return;
  }
  await db.run("INSERT INTO meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [`setting:${key}`, value]);
}
