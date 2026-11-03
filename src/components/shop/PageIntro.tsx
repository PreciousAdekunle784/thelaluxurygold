import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.66rem] uppercase tracking-[0.2em] text-stone">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="h-px w-3 bg-current opacity-50" />}
            {it.href ? (
              <Link href={it.href} className="hover:text-ink">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageIntro({ eyebrow, title, intro, crumbs, children }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; crumbs?: { name: string; href?: string }[]; children?: ReactNode }) {
  return (
    <header className="container-luxe pb-10 pt-10 md:pb-16 md:pt-14">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <Reveal className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          {eyebrow && <p className="eyebrow mb-5 text-champagne">{eyebrow}</p>}
          <h1 className="display text-[3rem] uppercase sm:text-6xl lg:text-[5.2rem]">{title}</h1>
        </div>
        {intro && <div className="text-[0.98rem] leading-relaxed text-stone lg:col-span-4 lg:col-start-9 lg:pb-3">{intro}</div>}
      </Reveal>
      {children}
    </header>
  );
}
