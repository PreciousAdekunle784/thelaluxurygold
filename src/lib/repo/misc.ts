import "server-only";
import { getDb, newId } from "@/lib/db/client";

// ---------------------------------------------------------------- subscribers
export async function addSubscriber(email: string, source: string) {
  const db = await getDb();
  await db.run("INSERT INTO subscribers (email, source, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [email.toLowerCase(), source, Date.now()]);
}

export async function listSubscribers() {
  const db = await getDb();
  const rows = await db.all<{ email: string; source: string; created_at: number }>("SELECT * FROM subscribers ORDER BY created_at DESC LIMIT 5000");
  return rows.map((r) => ({ email: r.email, source: r.source, createdAt: Number(r.created_at) }));
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

export async function listMessages() {
  const db = await getDb();
  const rows = await db.all<Record<string, unknown>>("SELECT * FROM messages ORDER BY created_at DESC LIMIT 500");
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

export async function unreadMessageCount() {
  const db = await getDb();
  return Number((await db.get<{ n: number }>("SELECT COUNT(*) AS n FROM messages WHERE is_read = 0"))?.n ?? 0);
}

// ---------------------------------------------------------------- uploaded media
export async function saveMedia(bytes: Buffer, contentType: string, width: number, height: number) {
  const db = await getDb();
  const id = newId("m");
  await db.run("INSERT INTO media (id, content_type, width, height, bytes, created_at) VALUES ($1,$2,$3,$4,$5,$6)", [id, contentType, width, height, bytes, Date.now()]);
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

export async function getMedia(id: string) {
  const db = await getDb();
  const r = await db.get<{ content_type: string; bytes: Uint8Array | Buffer }>("SELECT content_type, bytes FROM media WHERE id = $1", [id]);
  return r ? { contentType: r.content_type, bytes: Buffer.from(r.bytes) } : null;
}

export async function listMedia() {
  const db = await getDb();
  const rows = await db.all<{ id: string; width: number; height: number; created_at: number }>("SELECT id, width, height, created_at FROM media ORDER BY created_at DESC LIMIT 300");
  return rows.map((r) => ({ id: r.id, width: Number(r.width), height: Number(r.height), createdAt: Number(r.created_at) }));
}
