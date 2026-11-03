"use client";

import { useCurrency } from "@/lib/state/currency";
import { cx } from "@/lib/format";

export function Price({ amount, className, onRequestLabel = "Price on request" }: { amount: number | null; className?: string; onRequestLabel?: string }) {
  const { format } = useCurrency();
  return <span className={cx("tabular-nums", className)}>{amount == null ? onRequestLabel : format(amount)}</span>;
}
