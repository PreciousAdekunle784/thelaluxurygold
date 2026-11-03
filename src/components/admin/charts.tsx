"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

/** Round a max value up to a "nice" axis ceiling (1, 2, 2.5, 5 × 10^n). */
function niceMax(v: number) {
  if (v <= 0) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * p) return m * p;
  return 10 * p;
}
const compact = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000)}K` : n.toLocaleString("en-US"));

export interface BarDatum {
  label: string;
  short: string;
  value: number;
}

/**
 * Single-series column chart. One hue (forest), 4px rounded data end, square baseline,
 * hairline gridlines, hover tooltip and a visually-hidden table for screen readers.
 */
export function ColumnChart({ data, unit = "count", title, height = 200 }: { data: BarDatum[]; unit?: "count" | "aed"; title: string; height?: number }) {
  const format = (n: number) => (unit === "aed" ? formatMoney(n) : n.toLocaleString("en-US"));
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const padL = 44, padB = 26, padT = 12;
  const H = height;
  const innerW = W - padL - 8;
  const innerH = H - padB - padT;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const ticks = [0, max / 2, max];
  const slot = innerW / Math.max(1, data.length);
  const bw = Math.min(24, slot - 2);
  const every = Math.ceil(data.length / 7);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => {
          const y = padT + innerH - (t / max) * innerH;
          return (
            <g key={t}>
              <line x1={padL} x2={W - 8} y1={y} y2={y} stroke="#e7e3da" strokeWidth={1} />
              <text x={padL - 8} y={y + 3.5} textAnchor="end" fontSize={10} fill="#6d6b64">
                {compact(t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = padL + i * slot + (slot - bw) / 2;
          const y = padT + innerH - h;
          const r = Math.min(4, h);
          const path = h > 0 ? `M${x},${padT + innerH} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${padT + innerH} Z` : "";
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${d.label}: ${format(d.value)}`}>
              <rect x={padL + i * slot} y={padT} width={slot} height={innerH + padB} fill="transparent" />
              {h > 0 && <path d={path} fill={hover === null || hover === i ? "#26382f" : "#8fa094"} />}
              {(data.length - 1 - i) % every === 0 && (
                <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="#6d6b64">
                  {d.short}
                </text>
              )}
            </g>
          );
        })}
        <line x1={padL} x2={W - 8} y1={padT + innerH} y2={padT + innerH} stroke="#cfc9bd" strokeWidth={1} />
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap bg-ink px-2.5 py-1.5 text-xs text-ivory shadow"
          style={{ left: `${((padL + hover * slot + slot / 2) / W) * 100}%` }}
        >
          <span className="text-ivory/70">{data[hover].label}</span> · <strong>{format(data[hover].value)}</strong>
        </div>
      )}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th>{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

