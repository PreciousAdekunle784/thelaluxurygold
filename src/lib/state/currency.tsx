"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { baseCurrency, currencies, defaultRates, type CurrencyCode, type Rates } from "@/lib/config/store";
import { formatMoney } from "@/lib/format";
import { usePersistentState } from "./persisted";

interface CurrencyValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  /** Format a USD amount in the shopper's chosen currency. */
  format: (amount: number) => string;
  rates: Rates;
  options: typeof currencies;
}

const CurrencyContext = createContext<CurrencyValue | null>(null);

export function CurrencyProvider({ children, rates = defaultRates }: { children: ReactNode; rates?: Rates }) {
  const [stored, setCurrency, hydrated] = usePersistentState<CurrencyCode | "">("llg.currency.v2", "");
  // First visit: shoppers in Nigeria (by time zone) see naira; everyone else sees dollars.
  useEffect(() => {
    if (!hydrated || stored) return;
    let tz = "";
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      /* ignore */
    }
    setCurrency(tz === "Africa/Lagos" ? "NGN" : "USD");
  }, [hydrated, stored, setCurrency]);

  const currency: CurrencyCode = stored && currencies.some((c) => c.code === stored) ? stored : baseCurrency;
  const value = useMemo(
    () => ({ currency, setCurrency: (c: CurrencyCode) => setCurrency(c), format: (a: number) => formatMoney(a, currency, rates), rates, options: currencies }),
    [currency, setCurrency, rates],
  );
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}
