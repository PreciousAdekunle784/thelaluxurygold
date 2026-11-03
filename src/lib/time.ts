export const STORE_TIME_ZONE = process.env.NEXT_PUBLIC_STORE_TIME_ZONE ?? "Asia/Dubai";

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** YYYY-MM-DD in the store's time zone (Dubai by default). */
export function dayKey(ts: number) {
  return dayFmt.format(new Date(ts));
}

export function lastDays(n: number, now: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(now - i * 86_400_000));
  return [...new Set(out)];
}

/** Current time for request-time rendering (call only after `connection()`). */
export function requestTime() {
  return Date.now();
}

export function formatDateTime(ts: number) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: STORE_TIME_ZONE, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
}

export function timeAgo(ts: number, now: number) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
