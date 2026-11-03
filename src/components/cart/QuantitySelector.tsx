"use client";

import { Minus, Plus } from "lucide-react";
import { cx } from "@/lib/format";

export function QuantitySelector({ value, onChange, min = 1, max = 10, size = "md", label = "Quantity" }: { value: number; onChange: (n: number) => void; min?: number; max?: number; size?: "sm" | "md"; label?: string }) {
  const h = size === "sm" ? "h-9" : "h-12";
  return (
    <div className={cx("inline-flex items-center border border-line", h)} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min - 1, value - 1))} disabled={value <= min - 1} aria-label="Decrease quantity" className={cx("flex items-center justify-center transition-opacity hover:opacity-60 disabled:opacity-30", size === "sm" ? "w-8" : "w-11")}>
        <Minus size={13} strokeWidth={1.4} />
      </button>
      <span className={cx("text-center text-sm tabular-nums", size === "sm" ? "w-6" : "w-8")} aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity" className={cx("flex items-center justify-center transition-opacity hover:opacity-60 disabled:opacity-30", size === "sm" ? "w-8" : "w-11")}>
        <Plus size={13} strokeWidth={1.4} />
      </button>
    </div>
  );
}
