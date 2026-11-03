import type { ReactNode } from "react";

/** Ranked horizontal bars (top pages, referrers, countries). Values are always printed. */
export function BarList({ items, valueLabel = "visitors", renderKey }: { items: { key: string; value: number; sub?: string }[]; valueLabel?: string; renderKey?: (k: string) => ReactNode }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-sm text-stone">No data yet.</p>;
  return (
    <ul className="space-y-2.5" aria-label={`Ranked by ${valueLabel}`}>
      {items.map((it) => (
        <li key={it.key} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
          <div className="relative min-w-0">
            <div className="absolute inset-y-0 left-0 rounded-r-[4px] bg-sage-mist" style={{ width: `${(it.value / max) * 100}%` }} />
            <span className="relative block truncate px-2 py-1">{renderKey ? renderKey(it.key) : it.key}</span>
          </div>
          <span className="tabular-nums text-ink/80">
            {it.value.toLocaleString("en-US")}
            {it.sub && <span className="ml-2 text-xs text-stone">{it.sub}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
