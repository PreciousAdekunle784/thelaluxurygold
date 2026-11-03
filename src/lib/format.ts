import { currencies, type CurrencyCode } from "./config/store";

export function formatMoney(amountAED: number, currency: CurrencyCode = "AED") {
  const cfg = currencies.find((c) => c.code === currency) ?? currencies[0];
  const value = amountAED * (cfg.rate ?? 1);
  const code = cfg.rate == null ? "AED" : cfg.code;
  const n = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));
  return `${code} ${n}`;
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
