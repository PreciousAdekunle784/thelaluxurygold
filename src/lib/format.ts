import { baseCurrency, currencies, defaultRates, type CurrencyCode, type Rates } from "./config/store";

const formatters = new Map<CurrencyCode, Intl.NumberFormat>();
function formatter(code: CurrencyCode) {
  let f = formatters.get(code);
  if (!f) {
    const cfg = currencies.find((c) => c.code === code) ?? currencies[0];
    f = new Intl.NumberFormat(cfg.locale, { style: "currency", currency: code, currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 0 });
    formatters.set(code, f);
  }
  return f;
}

/** Convert a base-currency (USD) amount for display. Naira is rounded to the nearest ₦100. */
export function convert(amount: number, currency: CurrencyCode = baseCurrency, rates: Rates = defaultRates) {
  const value = amount * (rates[currency] ?? 1);
  return currency === "NGN" ? Math.round(value / 100) * 100 : Math.round(value);
}

/** Format a base-currency (USD) amount, e.g. "$1,075" or "₦1,666,300". */
export function formatMoney(amount: number, currency: CurrencyCode = baseCurrency, rates: Rates = defaultRates) {
  return formatter(currency).format(convert(amount, currency, rates));
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
