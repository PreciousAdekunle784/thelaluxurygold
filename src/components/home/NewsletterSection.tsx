import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { Monogram } from "@/components/brand/Logo";
import { Reveal } from "@/components/ui/Reveal";

export function NewsletterSection() {
  return (
    <section className="bg-sand py-24 md:py-32" aria-labelledby="newsletter">
      <div className="container-luxe">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <Monogram className="h-12 w-auto" />
          <h2 id="newsletter" className="display mt-8 text-[2.4rem] uppercase sm:text-5xl lg:text-[3.8rem]">
            A little luxury <span className="script">in your inbox.</span>
          </h2>
          <p className="mt-5 text-[0.9rem] text-stone">New collections and releases, first.</p>
          <div className="mt-10 w-full max-w-lg text-left">
            <NewsletterForm source="home" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
