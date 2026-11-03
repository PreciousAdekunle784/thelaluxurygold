import { cx } from "@/lib/format";

export function SampleBadge({ className, children = "Sample" }: { className?: string; children?: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center border border-current/30 px-2 py-[3px] text-[0.58rem] font-semibold uppercase tracking-[0.2em]",
        className,
      )}
      title="Development preview: placeholder product data"
    >
      {children}
    </span>
  );
}
