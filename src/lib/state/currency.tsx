"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { baseCurrency, enabledCurrencies, type CurrencyCode } from "@/lib/config/store";
import { formatMoney } from "@/lib/format";
import { usePersistentState } from "./persisted";

interface CurrencyValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  format: (amountAED: number) => string;
  options: typeof enabledCurrencies;
}

const CurrencyContext = createContext<CurrencyValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [stored, setCurrency] = usePersistentState<CurrencyCode>("llg.currency.v1", baseCurrency);
  const currency = enabledCurrencies.some((c) => c.code === stored) ? stored : baseCurrency;
  const value = useMemo(
    () => ({ currency, setCurrency, format: (a: number) => formatMoney(a, currency), options: enabledCurrencies }),
    [currency, setCurrency],
  );
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}
