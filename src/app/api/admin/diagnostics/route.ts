import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { dayKey, lastDays } from "@/lib/time";

/**
 * TEMPORARY admin-only diagnostics: times each visitor-statistics query on the live database, one at a time
 * and then all together (as the dashboard runs them). Read-only. To be removed once the dashboard is fixed.
 */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const db = await getDb();
  const now = Date.now();
  const today = [dayKey(now)];
  const week = lastDays(7, now);
  const ph = (n: number) => Array.from({ length: n }, (_, i) => `$${i + 1}`).join(",");
  const queries: [string, string, unknown[]][] = [
    ["select 1", "SELECT 1 AS ok", []],
    ["page_views rows (estimate)", "SELECT reltuples::bigint AS n FROM pg_class WHERE relname = 'page_views'", []],
    ["page_views indexes", "SELECT string_agg(indexname, ', ') AS n FROM pg_indexes WHERE tablename = 'page_views'", []],
    ["schema version", "SELECT value AS n FROM meta WHERE key = 'schema_version'", []],
    ["traffic_daily exists", "SELECT COUNT(*) AS n FROM traffic_daily", []],
    ["views today (plain count)", `SELECT COUNT(*) AS n FROM page_views WHERE day IN (${ph(1)})`, today],
    ["totals today", `SELECT COUNT(*) AS visitors, COALESCE(SUM(c), 0) AS views FROM (SELECT visitor_id, COUNT(*) AS c, SUM(is_new) AS n FROM page_views WHERE day IN (${ph(1)}) GROUP BY visitor_id) v`, today],
    ["sessions today", `SELECT COUNT(*) AS sessions FROM (SELECT DISTINCT session_id FROM page_views WHERE day IN (${ph(1)}) AND session_id IS NOT NULL) s`, today],
    ["top pages week", `SELECT k, SUM(c) AS views, COUNT(*) AS visitors FROM (SELECT path AS k, visitor_id, COUNT(*) AS c FROM page_views WHERE day IN (${ph(7)}) GROUP BY path, visitor_id) v GROUP BY k ORDER BY visitors DESC LIMIT 8`, week],
    ["visitors per day week", `SELECT day, COUNT(*) AS visitors, SUM(c) AS views FROM (SELECT day, visitor_id, COUNT(*) AS c FROM page_views WHERE day IN (${ph(7)}) GROUP BY day, visitor_id) v GROUP BY day`, week],
    ["orders by day week", `SELECT day, COUNT(*) AS orders FROM orders WHERE day IN (${ph(7)}) GROUP BY day`, week],
    ["locks waiting", "SELECT COUNT(*) AS n FROM pg_locks WHERE NOT granted", []],
  ];
  const run = async ([label, sql, params]: [string, string, unknown[]]) => {
    const t0 = performance.now();
    try {
      const r = await Promise.race([db.all(sql, params), new Promise((_, rej) => setTimeout(() => rej(new Error("no answer within 12 s")), 12_000))]);
      return { label, ms: Math.round(performance.now() - t0), result: JSON.stringify((r as unknown[])[0] ?? null).slice(0, 160) };
    } catch (err) {
      return { label, ms: Math.round(performance.now() - t0), error: (err instanceof Error ? err.message : String(err)).slice(0, 200) };
    }
  };
  const sequential = [];
  for (const q of queries) sequential.push(await run(q));
  const t0 = performance.now();
  const together = await Promise.all(queries.slice(5, 11).map(run));
  return NextResponse.json({ sequential, together: { totalMs: Math.round(performance.now() - t0), results: together } }, { headers: { "Cache-Control": "no-store" } });
}
