import "server-only";
import { getDb, newId } from "@/lib/db/client";
import { dayKey } from "@/lib/time";

export interface PageView {
  id: string;
  ts: number;
  visitorId: string;
  sessionId: string;
  path: string;
  referrer: string;
  country: string;
  device: string;
  browser: string;
  isNew: boolean;
}

type Raw = Record<string, unknown>;
const parse = (r: Raw): PageView => ({
  id: String(r.id),
  ts: Number(r.ts),
  visitorId: String(r.visitor_id),
  sessionId: String(r.session_id ?? ""),
  path: String(r.path),
  referrer: String(r.referrer ?? ""),
  country: String(r.country ?? ""),
  device: String(r.device ?? ""),
  browser: String(r.browser ?? ""),
  isNew: !!Number(r.is_new),
});

export async function recordView(v: Omit<PageView, "id" | "ts" | "isNew">) {
  const db = await getDb();
  const ts = Date.now();
  const seen = await db.get("SELECT id FROM page_views WHERE visitor_id = $1 LIMIT 1", [v.visitorId]);
  await db.run(
    "INSERT INTO page_views (id, ts, day, visitor_id, session_id, path, referrer, country, device, browser, is_new) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
    [newId("pv_"), ts, dayKey(ts), v.visitorId, v.sessionId, v.path, v.referrer, v.country, v.device, v.browser, seen ? 0 : 1],
  );
}

/** Visitors active in the last few minutes, with the page they are currently on. */
export async function liveVisitors(windowMs = 5 * 60_000) {
  const db = await getDb();
  const since = Date.now() - windowMs;
  const rows = await db.all<Raw>(
    `SELECT p.* FROM page_views p
       JOIN (SELECT visitor_id, MAX(ts) AS last FROM page_views WHERE ts > $1 GROUP BY visitor_id) l
         ON p.visitor_id = l.visitor_id AND p.ts = l.last
      ORDER BY p.ts DESC LIMIT 50`,
    [since],
  );
  return rows.map(parse);
}

export async function recentViews(opts: { limit?: number; offset?: number; since?: number; day?: string } = {}) {
  const db = await getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.since) {
    params.push(opts.since);
    where.push(`ts > $${params.length}`);
  }
  if (opts.day) {
    params.push(opts.day);
    where.push(`day = $${params.length}`);
  }
  params.push(opts.limit ?? 50, opts.offset ?? 0);
  const rows = await db.all<Raw>(
    `SELECT * FROM page_views ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ts DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return rows.map(parse);
}

export async function countViews(day?: string) {
  const db = await getDb();
  const r = await db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM page_views ${day ? "WHERE day = $1" : ""}`, day ? [day] : []);
  return Number(r?.n ?? 0);
}

export async function trafficSeries(days: string[]) {
  if (!days.length) return [];
  const db = await getDb();
  const ph = days.map((_, i) => `$${i + 1}`).join(",");
  const rows = await db.all<Raw>(`SELECT day, COUNT(DISTINCT visitor_id) AS visitors, COUNT(*) AS views FROM page_views WHERE day IN (${ph}) GROUP BY day`, days);
  const m = new Map(rows.map((r) => [String(r.day), { visitors: Number(r.visitors), views: Number(r.views) }]));
  return days.map((d) => ({ day: d, ...(m.get(d) ?? { visitors: 0, views: 0 }) }));
}

export async function trafficSummary(days: string[]) {
  const db = await getDb();
  const ph = days.map((_, i) => `$${i + 1}`).join(",");
  const top = async (col: "path" | "referrer" | "country" | "device", limit = 8) =>
    (
      await db.all<Raw>(
        `SELECT ${col} AS k, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM page_views WHERE day IN (${ph}) GROUP BY ${col} ORDER BY visitors DESC, views DESC LIMIT ${limit}`,
        days,
      )
    ).map((r) => ({ key: String(r.k ?? "") || "—", views: Number(r.views), visitors: Number(r.visitors) }));
  const totals = await db.get<Raw>(
    `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors, COUNT(DISTINCT session_id) AS sessions, COALESCE(SUM(is_new),0) AS new_visitors FROM page_views WHERE day IN (${ph})`,
    days,
  );
  return {
    views: Number(totals?.views ?? 0),
    visitors: Number(totals?.visitors ?? 0),
    sessions: Number(totals?.sessions ?? 0),
    newVisitors: Number(totals?.new_visitors ?? 0),
    pages: await top("path"),
    referrers: await top("referrer"),
    countries: await top("country"),
    devices: await top("device", 4),
  };
}
