import Link from "next/link";
import { Monogram } from "@/components/brand/Logo";
import { buttonClass } from "@/components/ui/Button";
import { StoreChrome } from "@/components/layout/StoreChrome";

export default function NotFound() {
  return (
    <StoreChrome>
    <section className="container-luxe flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <Monogram className="h-20 w-auto" />
      <p className="eyebrow mt-10 text-champagne">Error 404</p>
      <h1 className="display mt-5 text-5xl uppercase md:text-7xl">
        This page has <span className="font-light italic normal-case">moved on</span>
      </h1>
      <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-stone">The page you are looking for doesn&rsquo;t exist or is no longer available.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonClass("solid", "lg")}>Return home</Link>
        <Link href="/shop" className={buttonClass("outline", "lg")}>Shop the collection</Link>
      </div>
    </section>
    </StoreChrome>
  );
}
