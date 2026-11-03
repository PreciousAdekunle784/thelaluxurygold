"use client";

import { useCurrency } from "@/lib/state/currency";
import { cx } from "@/lib/format";

export function Price({ amountAED, className, onRequestLabel = "Price on request" }: { amountAED: number | null; className?: string; onRequestLabel?: string }) {
  const { format } = useCurrency();
  return <span className={cx("tabular-nums", className)}>{amountAED == null ? onRequestLabel : format(amountAED)}</span>;
}
