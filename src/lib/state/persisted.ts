"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** useState that persists to localStorage, safe for SSR (hydrates after mount). */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from storage after mount is intentional
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* storage unavailable — keep in-memory state */
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / privacy mode errors */
    }
  }, [key, value, hydrated]);

  // keep tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue == null) return;
      try {
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const set = useCallback((v: T | ((prev: T) => T)) => setValue(v), []);
  return [value, set, hydrated] as const;
}
