"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function id(storage: Storage, key: string) {
  try {
    let v = storage.getItem(key);
    if (!v) {
      v = crypto.randomUUID();
      storage.setItem(key, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

/**
 * First-party, cookie-free page-view beacon. Sends the path, an anonymous visitor id
 * (localStorage) and session id (sessionStorage). No IP address or personal data is stored.
 */
export function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const payload = {
      path: pathname,
      vid: id(window.localStorage, "llg.vid"),
      sid: id(window.sessionStorage, "llg.sid"),
      referrer: first.current ? document.referrer : "",
    };
    first.current = false;
    const body = JSON.stringify(payload);
    try {
      if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) throw new Error("beacon");
    } catch {
      fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
