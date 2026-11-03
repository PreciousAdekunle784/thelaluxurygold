import { cx } from "@/lib/format";

type Tone = "ink" | "ivory";

const toneClass: Record<Tone, string> = { ink: "text-ink", ivory: "text-ivory" };

/** LG monogram set within an arch — a nod to Dubai's architecture. */
export function Monogram({ className, tone = "ink", title }: { className?: string; tone?: Tone; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 80"
      className={cx(toneClass[tone], className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M7 79V33a25 25 0 0 1 50 0v46" fill="none" stroke="var(--color-champagne)" strokeWidth="1.1" />
      <path d="M11 79V34a21 21 0 0 1 42 0v45" fill="none" stroke="var(--color-champagne)" strokeWidth="0.5" opacity="0.7" />
      <text
        x="23.5"
        y="62"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500 }}
      >
        L
      </text>
      <text
        x="38"
        y="62"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 400 }}
      >
        G
      </text>
      <line x1="16" y1="70" x2="48" y2="70" stroke="var(--color-champagne)" strokeWidth="0.6" />
    </svg>
  );
}

/** Typographic wordmark. `stacked` adds the Dubai line beneath. */
export function Wordmark({ className, tone = "ink", stacked = true }: { className?: string; tone?: Tone; stacked?: boolean }) {
  return (
    <span className={cx("inline-flex flex-col items-center leading-none", toneClass[tone], className)}>
      <span className="font-display text-[1.32em] font-medium tracking-[0.26em] whitespace-nowrap [margin-right:-0.26em]">
        LA LUXURY GOLD
      </span>
      {stacked && (
        <span className="mt-[0.45em] flex items-center gap-[0.6em] text-[0.5em] font-medium tracking-[0.5em] text-champagne [margin-right:-0.5em]">
          <span className="h-px w-[1.8em] bg-current opacity-70" />
          DUBAI
          <span className="h-px w-[1.8em] bg-current opacity-70" />
        </span>
      )}
    </span>
  );
}

export function Logo({
  variant = "stacked",
  tone = "ink",
  className,
}: {
  variant?: "stacked" | "horizontal" | "wordmark" | "monogram";
  tone?: Tone;
  className?: string;
}) {
  if (variant === "monogram") return <Monogram tone={tone} className={className} title="LA Luxury Gold" />;
  if (variant === "wordmark") return <Wordmark tone={tone} stacked={false} className={className} />;
  if (variant === "horizontal")
    return (
      <span className={cx("inline-flex items-center gap-3", className)} aria-label="LA Luxury Gold">
        <Monogram tone={tone} className="h-[2.6em] w-auto" />
        <Wordmark tone={tone} />
      </span>
    );
  return (
    <span aria-label="LA Luxury Gold" className={className}>
      <Wordmark tone={tone} />
    </span>
  );
}
