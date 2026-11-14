"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, LazyMotion, m } from "framer-motion";
import { Bell, ShoppingBag, X } from "lucide-react";
import { formatMoney } from "@/lib/format";

export interface LiveView { id: string; ts: number; path: string; country: string; device: string; referrer?: string; visitorId: string; isNew: boolean }
export interface LiveOrder { reference: string; ts: number; name: string; country: string; subtotal: number; items: number; hasPriceOnRequest: boolean }
interface LiveState {
  now: number;
  live: LiveView[];
  feed: LiveView[];
  orders: LiveOrder[];
  pending: number;
  unread: number;
  connected: boolean;
  notificationsEnabled: boolean;
  enableNotifications: () => void;
}

const LiveContext = createContext<LiveState | null>(null);
const POLL_MS = 8000;
/** After failed polls, wait longer each time (up to a minute) instead of hammering a struggling server. */
const MAX_BACKOFF_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000;

// One audio context for the whole session: browsers cap how many can exist, and each holds audio resources.
let audio: AudioContext | null = null;
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = (audio ??= new Ctx());
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.16 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.16);
      o.stop(ctx.currentTime + i * 0.16 + 0.55);
    });
  } catch {
    /* audio blocked until the user interacts — fine */
  }
}

/** Polls the server for live visitors and new orders; shows a toast (and optional desktop notification) for every new order. */
export function LiveProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<LiveState, "notificationsEnabled" | "enableNotifications">>({ now: 0, live: [], feed: [], orders: [], pending: 0, unread: 0, connected: false });
  const [toasts, setToasts] = useState<LiveOrder[]>([]);
  const [notificationsEnabled, setNotif] = useState(false);
  const since = useRef<number>(0);
  const seenOrders = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);
  const inFlight = useRef<AbortController | null>(null);
  const failures = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser permission after mount
    if (typeof Notification !== "undefined" && Notification.permission === "granted") setNotif(true);
  }, []);

  const poll = useCallback(async () => {
    // Never stack requests: if the previous poll is still running (slow network or server), skip this tick.
    if (inFlight.current) return;
    const ctrl = new AbortController();
    inFlight.current = ctrl;
    const timer = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/admin/live?since=${since.current || ""}`, { cache: "no-store", signal: ctrl.signal });
      if (res.status === 401) {
        window.location.assign(new URL("/admin/login", window.location.origin));
        return;
      }
      if (!res.ok) throw new Error(`live ${res.status}`);
      const data = await res.json();
      failures.current = 0;
      since.current = data.now - 1000;
      const fresh: LiveOrder[] = (data.orders as LiveOrder[]).filter((o) => !seenOrders.current.has(o.reference));
      fresh.forEach((o) => seenOrders.current.add(o.reference));
      // Only orders from the last ~30 minutes can come back, so the remembered set never needs to grow far.
      if (seenOrders.current.size > 500) seenOrders.current = new Set([...seenOrders.current].slice(-200));
      if (!firstLoad.current && fresh.length) {
        setToasts((t) => [...fresh, ...t].slice(0, 4));
        chime();
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          for (const o of fresh) new Notification(`New order ${o.reference}`, { body: `${o.name} · ${o.hasPriceOnRequest ? "price on request" : formatMoney(o.subtotal)}`, tag: o.reference });
        }
      }
      firstLoad.current = false;
      setState((s) => {
        const ids = new Set(s.feed.map((v) => v.id));
        const newViews = (data.views as LiveView[]).filter((v) => !ids.has(v.id));
        const live = sameLive(s.live, data.live) ? s.live : (data.live as LiveView[]);
        // Keep the same arrays when nothing new arrived, so lists that depend on them don't re-render.
        const feed = newViews.length ? [...newViews, ...s.feed].slice(0, 60) : s.feed;
        const orders = fresh.length ? [...fresh, ...s.orders].slice(0, 20) : s.orders;
        return { now: data.now, live, feed, orders, pending: data.pending, unread: data.unread, connected: true };
      });
    } catch {
      failures.current++;
      setState((s) => (s.connected ? { ...s, connected: false } : s));
    } finally {
      window.clearTimeout(timer);
      inFlight.current = null;
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let t = 0;
    // A self-scheduling loop rather than setInterval: the next poll is planned only after the last one
    // finished, and the wait grows after failures (8 s, 16 s, 32 s… up to a minute).
    const loop = async () => {
      if (document.visibilityState === "visible" && navigator.onLine !== false) await poll();
      if (stopped) return;
      const wait = failures.current ? Math.min(MAX_BACKOFF_MS, POLL_MS * 2 ** failures.current) : POLL_MS;
      t = window.setTimeout(loop, wait);
    };
    loop();
    const wake = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(t);
      failures.current = 0;
      loop();
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    return () => {
      stopped = true;
      window.clearTimeout(t);
      inFlight.current?.abort();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
    };
  }, [poll]);

  useEffect(() => {
    if (!toasts.length) return;
    const t = window.setTimeout(() => setToasts((x) => x.slice(0, -1)), 12000);
    return () => window.clearTimeout(t);
  }, [toasts]);

  const enableNotifications = useCallback(() => {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then((p) => setNotif(p === "granted"));
  }, []);
  const value = useMemo(() => ({ ...state, notificationsEnabled, enableNotifications }), [state, notificationsEnabled, enableNotifications]);

  return (
    <LazyMotion features={() => import("@/lib/motion-features").then((r) => r.default)}>
    <LiveContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[340px] max-w-[calc(100vw-2.5rem)] flex-col gap-3" aria-live="assertive">
        <AnimatePresence>
          {toasts.map((o) => (
            <m.div
              key={o.reference}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="pointer-events-auto flex items-start gap-3 border-l-2 border-champagne bg-forest p-4 text-ivory shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]"
            >
              <ShoppingBag size={18} className="mt-0.5 shrink-0 text-gold" />
              <Link href={`/admin/orders/${o.reference}`} className="min-w-0 flex-1">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold-pale">New order</p>
                <p className="mt-1 text-sm font-semibold">{o.reference} · {o.hasPriceOnRequest ? "price on request" : formatMoney(o.subtotal)}</p>
                <p className="mt-0.5 truncate text-xs text-ivory/70">{o.name} · {o.country} · {o.items} item{o.items === 1 ? "" : "s"}</p>
              </Link>
              <button type="button" aria-label="Dismiss" onClick={() => setToasts((t) => t.filter((x) => x.reference !== o.reference))} className="text-ivory/60 hover:text-ivory">
                <X size={14} />
              </button>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </LiveContext.Provider>
    </LazyMotion>
  );
}

/** Same visitors on the same pages as before? (then the list doesn't need to change) */
function sameLive(a: LiveView[], b: LiveView[]) {
  return a.length === b.length && a.every((v, i) => v.id === b[i].id);
}

const subscribe = () => () => {};
/** false while hydrating, true afterwards — keeps live widgets identical to the server HTML during hydration. */
function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

const initialLive = { now: 0, live: [], feed: [], orders: [], pending: 0, unread: 0, connected: false };

export function useLive(): LiveState {
  const ctx = useContext(LiveContext);
  const hydrated = useHydrated();
  if (!ctx) throw new Error("useLive must be used inside <LiveProvider>");
  return useMemo(() => (hydrated ? ctx : { ...ctx, ...initialLive }), [ctx, hydrated]);
}

export function NotificationToggle() {
  const { notificationsEnabled, enableNotifications } = useLive();
  if (notificationsEnabled) return <span className="flex items-center gap-2 text-xs text-ivory/60"><Bell size={13} /> Desktop alerts on</span>;
  return (
    <button type="button" onClick={enableNotifications} className="flex items-center gap-2 text-xs text-ivory/80 underline-offset-4 hover:underline">
      <Bell size={13} /> Enable order alerts
    </button>
  );
}
