import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/format";

type Variant = "solid" | "outline" | "light" | "outline-light" | "gold" | "ghost";
type Size = "md" | "lg" | "sm";

const base =
  "group relative inline-flex items-center justify-center gap-3 overflow-hidden whitespace-nowrap text-[0.7rem] font-semibold uppercase tracking-[0.24em] transition-[color,background-color,border-color,opacity] duration-500 ease-[var(--ease-luxe)] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  solid: "bg-ink text-ivory hover:bg-forest",
  outline: "border border-ink/80 text-ink hover:bg-ink hover:text-ivory",
  light: "bg-ivory text-ink hover:bg-gold-pale",
  "outline-light": "border border-ivory/70 text-ivory hover:bg-ivory hover:text-ink",
  gold: "bg-champagne text-ink hover:bg-gold",
  ghost: "text-ink hover:opacity-70",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5",
  md: "h-12 px-7",
  lg: "h-14 px-9",
};

export function buttonClass(variant: Variant = "solid", size: Size = "md", className?: string) {
  return cx(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "className"> & { variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

export function TextLink({ href, children, className, light }: { href: string; children: ReactNode; className?: string; light?: boolean }) {
  return (
    <Link
      href={href}
      className={cx("link-underline eyebrow font-semibold", light ? "text-ivory" : "text-ink", className)}
    >
      {children}
      <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
        <path d="M0 4h16M13 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </Link>
  );
}
