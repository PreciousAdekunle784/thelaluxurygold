import "server-only";
import { getDb, newId } from "@/lib/db/client";

// ---------------------------------------------------------------- subscribers
export async function addSubscriber(email: string, source: string) {
  const db = await getDb();
  await db.run("INSERT INTO subscribers (email, source, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [email.toLowerCase(), source, Date.now()]);
}

/** Newest first. Without a limit it returns everyone (CSV export). */
export async function listSubscribers(opts: { limit?: number; offset?: number } = {}) {
  const db = await getDb();
  const page = opts.limit ? " LIMIT $1 OFFSET $2" : "";
  const rows = await db.all<{ email: string; source: string; created_at: number }>(
    `SELECT email, source, created_at FROM subscribers ORDER BY created_at DESC, email${page}`,
    opts.limit ? [opts.limit, opts.offset ?? 0] : [],
  );
  return rows.map((r) => ({ email: r.email, source: r.source, createdAt: Number(r.created_at) }));
}

export async function countSubscribers() {
  const db = await getDb();
  return Number((await db.get<{ n: number }>("SELECT COUNT(*) AS n FROM subscribers"))?.n ?? 0);
}

export async function removeSubscriber(email: string) {
  const db = await getDb();
  await db.run("DELETE FROM subscribers WHERE email = $1", [email]);
}

// ---------------------------------------------------------------- contact messages
export interface Message {
  id: string;
  createdAt: number;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  read: boolean;
}

export async function addMessage(m: Omit<Message, "id" | "createdAt" | "read">) {
  const db = await getDb();
  await db.run("INSERT INTO messages (id, created_at, name, email, phone, topic, message, is_read) VALUES ($1,$2,$3,$4,$5,$6,$7,0)", [
    newId("msg_"),
    Date.now(),
    m.name,
    m.email,
    m.phone,
    m.topic,
    m.message,
  ]);
}

export async function listMessages(opts: { limit?: number; offset?: number } = {}) {
  const db = await getDb();
  const rows = await db.all<Record<string, unknown>>("SELECT * FROM messages ORDER BY created_at DESC, id LIMIT $1 OFFSET $2", [opts.limit ?? 500, opts.offset ?? 0]);
  return rows.map(
    (r): Message => ({
      id: String(r.id),
      createdAt: Number(r.created_at),
      name: String(r.name ?? ""),
      email: String(r.email ?? ""),
      phone: String(r.phone ?? ""),
      topic: String(r.topic ?? ""),
      message: String(r.message ?? ""),
      read: !!Number(r.is_read),
    }),
  );
}

export async function setMessageRead(id: string, read: boolean) {
  const db = await getDb();
  await db.run("UPDATE messages SET is_read = $2 WHERE id = $1", [id, read ? 1 : 0]);
}

export async function messageCounts() {
  const db = await getDb();
  const r = await db.get<{ total: number; unread: number }>("SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END), 0) AS unread FROM messages");
  return { total: Number(r?.total ?? 0), unread: Number(r?.unread ?? 0) };
}

// ---------------------------------------------------------------- uploaded media
export type MediaPurpose = "product" | "hero";

/**
 * Store an uploaded image: the exact file as uploaded (kept untouched in `media_originals`) and the image
 * the site serves (watermarked for products). The original is written first, so a served image never
 * exists without its original.
 */
export async function saveMedia(m: {
  bytes: Buffer;
  contentType: string;
  width: number;
  height: number;
  purpose: MediaPurpose;
  watermark: string | null;
  original: { bytes: Buffer; contentType: string; filename?: string };
}) {
  const db = await getDb();
  const id = newId("m");
  const now = Date.now();
  await db.run("INSERT INTO media_originals (media_id, content_type, filename, bytes, created_at) VALUES ($1, $2, $3, $4, $5)", [
    id, m.original.contentType, m.original.filename?.slice(0, 200) || null, m.original.bytes, now,
  ]);
  await db.run("INSERT INTO media (id, content_type, width, height, bytes, created_at, purpose, watermark) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [
    id, m.contentType, m.width, m.height, m.bytes, now, m.purpose, m.watermark,
  ]);
  return id;
}

/** Store one piece of a large upload; also clears pieces of uploads abandoned more than an hour ago. */
export async function saveUploadChunk(uploadId: string, idx: number, bytes: Buffer) {
  const db = await getDb();
  const now = Date.now();
  await db.run("DELETE FROM upload_chunks WHERE created_at < $1", [now - 3_600_000]);
  await db.run(
    "INSERT INTO upload_chunks (upload_id, idx, bytes, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (upload_id, idx) DO UPDATE SET bytes = excluded.bytes, created_at = excluded.created_at",
    [uploadId, idx, bytes, now],
  );
}

/** All pieces of an upload, in order, removed from storage. */
export async function takeUploadChunks(uploadId: string) {
  const db = await getDb();
  const rows = await db.all<{ bytes: Uint8Array | Buffer }>("SELECT bytes FROM upload_chunks WHERE upload_id = $1 ORDER BY idx", [uploadId]);
  await db.run("DELETE FROM upload_chunks WHERE upload_id = $1", [uploadId]);
  return rows.map((r) => Buffer.from(r.bytes));
}

/** The image the site serves for an upload, with what it is for and which watermark it carries. */
export async function getMedia(id: string) {
  const db = await getDb();
  const r = await db.get<{ content_type: string; bytes: Uint8Array | Buffer; purpose: string; watermark: string | null }>(
    "SELECT content_type, bytes, purpose, watermark FROM media WHERE id = $1",
    [id],
  );
  return r ? { contentType: r.content_type, bytes: Buffer.from(r.bytes), purpose: r.purpose as MediaPurpose, watermark: r.watermark } : null;
}

/** Which watermark an upload's served image carries (without loading the image). */
export async function getMediaState(id: string) {
  const db = await getDb();
  const r = await db.get<{ purpose: string; watermark: string | null }>("SELECT purpose, watermark FROM media WHERE id = $1", [id]);
  return r ? { purpose: r.purpose as MediaPurpose, watermark: r.watermark } : null;
}

/**
 * Make sure an upload has a preserved original. Uploads made before watermarking existed only have the image
 * they were saved as, so that image (still unwatermarked: `watermark IS NULL`) is copied as the original.
 * Never copies an image that already carries a watermark, and never replaces an existing original.
 */
export async function preserveOriginal(id: string) {
  const db = await getDb();
  await db.run(
    `INSERT INTO media_originals (media_id, content_type, filename, bytes, created_at)
     SELECT id, content_type, NULL, bytes, $2 FROM media WHERE id = $1 AND watermark IS NULL
     ON CONFLICT (media_id) DO NOTHING`,
    [id, Date.now()],
  );
}

export async function getMediaOriginal(id: string) {
  const db = await getDb();
  const r = await db.get<{ content_type: string; bytes: Uint8Array | Buffer; filename: string | null }>("SELECT content_type, bytes, filename FROM media_originals WHERE media_id = $1", [id]);
  return r ? { contentType: r.content_type, bytes: Buffer.from(r.bytes), filename: r.filename } : null;
}

/** Replace the SERVED image of a product upload with its watermarked version (the original is never touched). */
export async function setWatermarkedImage(id: string, img: { bytes: Buffer; width: number; height: number }, revision: string) {
  const db = await getDb();
  await db.run("UPDATE media SET bytes = $2, width = $3, height = $4, content_type = 'image/webp', watermark = $5 WHERE id = $1 AND purpose = 'product'", [
    id, img.bytes, img.width, img.height, revision,
  ]);
}

/** Product images for the admin's "Choose existing" picker (homepage hero images are left out). */
export async function listMedia() {
  const db = await getDb();
  const rows = await db.all<{ id: string; width: number; height: number; created_at: number }>(
    "SELECT id, width, height, created_at FROM media WHERE purpose = 'product' ORDER BY created_at DESC LIMIT 300",
  );
  return rows.map((r) => ({ id: r.id, width: Number(r.width), height: Number(r.height), createdAt: Number(r.created_at) }));
}
