import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { Monogram } from "@/components/brand/Logo";
import { Reveal } from "@/components/ui/Reveal";

export function NewsletterSection() {
  return (
    <section className="bg-sand py-24 md:py-32" aria-labelledby="newsletter">
      <div className="container-luxe">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <Monogram className="h-16 w-auto" />
          <h2 id="newsletter" className="display mt-10 text-[2.4rem] uppercase sm:text-5xl lg:text-[3.8rem]">
            A little luxury <span className="font-light italic normal-case">in your inbox.</span>
          </h2>
          <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-stone">
            Be the first to discover new collections, exclusive releases and special updates.
          </p>
          <div className="mt-10 w-full max-w-lg text-left">
            <NewsletterForm source="home" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
