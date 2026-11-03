"use client";

import { useCurrency } from "@/lib/state/currency";
import { cx } from "@/lib/format";

/** Compact USD / NGN switch. */
export function CurrencySwitch({ className, tone = "auto" }: { className?: string; tone?: "auto" | "light" }) {
  const { currency, setCurrency, options } = useCurrency();
  return (
    <div role="group" aria-label="Currency" className={cx("inline-flex items-center text-[0.62rem] font-semibold uppercase tracking-[0.16em]", className)}>
      {options.map((o, i) => (
        <span key={o.code} className="flex items-center">
          {i > 0 && <span className={cx("mx-1.5 h-3 w-px", tone === "light" ? "bg-ivory/30" : "bg-current opacity-30")} aria-hidden />}
          <button
            type="button"
            onClick={() => setCurrency(o.code)}
            aria-pressed={currency === o.code}
            title={o.label}
            className={cx("py-1 transition-opacity", currency === o.code ? "opacity-100" : "opacity-50 hover:opacity-80")}
          >
            {o.code === "USD" ? "$ USD" : "₦ NGN"}
          </button>
        </span>
      ))}
    </div>
  );
}
