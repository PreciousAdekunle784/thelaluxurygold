import Link from "next/link";
import type { ReactNode } from "react";
import { PageIntro } from "./PageIntro";
import { store } from "@/lib/config/store";
import { whatsappLink, defaultWhatsappMessage } from "@/lib/whatsapp";

/** Date shown as "Last updated" on the policy pages — change it whenever a policy is edited. */
export const POLICIES_UPDATED = "3 November 2026";

export function LegalPage({ title, eyebrow, intro, children }: { title: ReactNode; eyebrow: string; intro?: string; children: ReactNode }) {
  return (
    <>
      <PageIntro crumbs={[{ name: "Home", href: "/" }, { name: eyebrow }]} eyebrow={eyebrow} title={title} intro={intro} />
      <div className="container-luxe grid gap-12 pb-28 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="space-y-4 border-l-2 border-champagne bg-linen p-5 text-[0.8rem] leading-relaxed text-ink/75 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <p>
              <span className="eyebrow mb-1 block font-semibold text-champagne">Last updated</span>
              {POLICIES_UPDATED}
            </p>
            <p>
              <span className="eyebrow mb-1 block font-semibold text-champagne">Questions?</span>
              Our team is happy to help on{" "}
              <a href={whatsappLink(defaultWhatsappMessage)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
                WhatsApp
              </a>{" "}
              ({store.contact.whatsapp.display}) or through the <Link href="/contact" className="underline underline-offset-4 hover:text-ink">contact page</Link>.
            </p>
          </div>
        </aside>
        <article className="prose-luxe max-w-2xl text-[0.98rem] text-ink/80 lg:col-span-7 lg:col-start-5">{children}</article>
      </div>
    </>
  );
}
