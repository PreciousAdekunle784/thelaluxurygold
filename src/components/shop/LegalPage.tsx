import type { ReactNode } from "react";
import { PageIntro } from "./PageIntro";

export function LegalPage({ title, eyebrow, intro, children, draft = true }: { title: ReactNode; eyebrow: string; intro?: string; children: ReactNode; draft?: boolean }) {
  return (
    <>
      <PageIntro crumbs={[{ name: "Home", href: "/" }, { name: eyebrow }]} eyebrow={eyebrow} title={title} intro={intro} />
      <div className="container-luxe grid gap-12 pb-28 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          {draft && (
            <div className="border-l-2 border-champagne bg-linen p-5 text-[0.8rem] leading-relaxed text-ink/75">
              <p className="eyebrow mb-2 font-semibold text-champagne">Draft for review</p>
              This page provides a structure for LA Luxury Gold&rsquo;s policy. Bracketed items must be confirmed by the business (and reviewed by a legal adviser) before launch.
            </div>
          )}
        </aside>
        <article className="prose-luxe max-w-2xl text-[0.98rem] text-ink/80 lg:col-span-7 lg:col-start-5">{children}</article>
      </div>
    </>
  );
}
