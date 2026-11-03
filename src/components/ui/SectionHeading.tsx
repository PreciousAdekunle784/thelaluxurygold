import type { ReactNode } from "react";
import { cx } from "@/lib/format";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  tone = "ink",
  className,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  tone?: "ink" | "ivory";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal
      className={cx(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "items-start text-left",
        tone === "ivory" ? "text-ivory" : "text-ink",
        className,
      )}
    >
      {eyebrow && (
        <span className={cx("eyebrow flex items-center gap-3", tone === "ivory" ? "text-gold-pale" : "text-champagne")}>
          <span className="h-px w-8 bg-current" />
          {eyebrow}
        </span>
      )}
      <h2 className="display text-[2.5rem] uppercase leading-[0.95] sm:text-5xl lg:text-[4.25rem]">{title}</h2>
      {intro && (
        <p className={cx("max-w-xl text-[0.95rem] leading-relaxed", tone === "ivory" ? "text-ivory/75" : "text-stone")}>{intro}</p>
      )}
      {action}
    </Reveal>
  );
}
