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

const placeholders = (n: number, from = 1) => Array.from({ length: n }, (_, i) => `$${i + from}`).join(",");

/**
 * Unique visitors and page views per day.
 *
 * Page views are only ever recorded for the current day, so a day's figures are final once it is over.
 * Days before yesterday are therefore computed once and kept in `traffic_daily`; only yesterday and today
 * (and any day not cached yet) are counted from the raw visit log. Same numbers, a fraction of the work.
 */
export async function trafficSeries(days: string[]) {
  if (!days.length) return [];
  const db = await getDb();
  const yesterday = dayKey(Date.now() - 86_400_000);
  const closed = days.filter((d) => d < yesterday);
  const open = days.filter((d) => d >= yesterday);
  const [cached, live] = await Promise.all([
    closed.length ? db.all<Raw>(`SELECT day, visitors, views FROM traffic_daily WHERE day IN (${placeholders(closed.length)})`, closed) : Promise.resolve([] as Raw[]),
    countByDay(db, open),
  ]);
  const m = new Map<string, { visitors: number; views: number }>();
  for (const r of cached) m.set(String(r.day), { visitors: Number(r.visitors), views: Number(r.views) });
  for (const [d, v] of live) m.set(d, v);
  const missing = closed.filter((d) => !m.has(d));
  if (missing.length) {
    const counted = await countByDay(db, missing);
    const now = Date.now();
    const rows = missing.map((d) => [d, counted.get(d)?.visitors ?? 0, counted.get(d)?.views ?? 0, now]);
    await db.run(
      `INSERT INTO traffic_daily (day, visitors, views, computed_at) VALUES ${rows.map((_, i) => `(${placeholders(4, i * 4 + 1)})`).join(", ")} ON CONFLICT (day) DO NOTHING`,
      rows.flat(),
    );
    for (const [d, visitors, views] of rows) m.set(String(d), { visitors: Number(visitors), views: Number(views) });
  }
  return days.map((d) => ({ day: d, ...(m.get(d) ?? { visitors: 0, views: 0 }) }));
}

/** Visitors/views per day straight from the visit log (count per visitor first: hash aggregation, no big sort). */
async function countByDay(db: Awaited<ReturnType<typeof getDb>>, days: string[]) {
  const out = new Map<string, { visitors: number; views: number }>();
  if (!days.length) return out;
  const rows = await db.all<Raw>(
    `SELECT day, COUNT(*) AS visitors, SUM(c) AS views FROM (SELECT day, visitor_id, COUNT(*) AS c FROM page_views WHERE day IN (${placeholders(days.length)}) GROUP BY day, visitor_id) v GROUP BY day`,
    days,
  );
  for (const r of rows) out.set(String(r.day), { visitors: Number(r.visitors), views: Number(r.views) });
  return out;
}

/**
 * Totals and top pages / referrers / countries / devices over a set of days. Every figure is exact: unique
 * visitors are counted by grouping per visitor first, which PostgreSQL does with a hash table instead of the
 * large sort (and on-disk spill) that COUNT(DISTINCT ...) needs over weeks of visits.
 */
export async function trafficSummary(days: string[], opts: { sessions?: boolean } = {}) {
  const db = await getDb();
  const ph = placeholders(days.length);
  const top = async (col: "path" | "referrer" | "country" | "device", limit = 8) =>
    (
      await db.all<Raw>(
        `SELECT k, SUM(c) AS views, COUNT(*) AS visitors
           FROM (SELECT ${col} AS k, visitor_id, COUNT(*) AS c FROM page_views WHERE day IN (${ph}) GROUP BY ${col}, visitor_id) v
          GROUP BY k ORDER BY visitors DESC, views DESC LIMIT ${limit}`,
        days,
      )
    ).map((r) => ({ key: String(r.k ?? "") || "—", views: Number(r.views), visitors: Number(r.visitors) }));
  // Independent queries, sent together (one round trip of latency, not six).
  const [totals, sessions, pages, referrers, countries, devices] = await Promise.all([
    db.get<Raw>(
      `SELECT COUNT(*) AS visitors, COALESCE(SUM(c), 0) AS views, COALESCE(SUM(n), 0) AS new_visitors
         FROM (SELECT visitor_id, COUNT(*) AS c, SUM(is_new) AS n FROM page_views WHERE day IN (${ph}) GROUP BY visitor_id) v`,
      days,
    ),
    opts.sessions === false
      ? Promise.resolve(undefined)
      : db.get<Raw>(`SELECT COUNT(*) AS sessions FROM (SELECT DISTINCT session_id FROM page_views WHERE day IN (${ph}) AND session_id IS NOT NULL) s`, days),
    top("path"),
    top("referrer"),
    top("country"),
    top("device", 4),
  ]);
  return {
    views: Number(totals?.views ?? 0),
    visitors: Number(totals?.visitors ?? 0),
    sessions: Number(sessions?.sessions ?? 0),
    newVisitors: Number(totals?.new_visitors ?? 0),
    pages,
    referrers,
    countries,
    devices,
  };
}
