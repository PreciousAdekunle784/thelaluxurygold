"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClass } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-champagne">Something went wrong</p>
      <h1 className="display mt-5 text-5xl uppercase md:text-6xl">
        Please <span className="font-light italic normal-case">try again</span>
      </h1>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-stone">We couldn&rsquo;t load this page. If the problem continues, please contact us on WhatsApp.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>Try again</Button>
        <Link href="/" className={buttonClass("outline", "lg")}>Return home</Link>
      </div>
    </section>
  );
}
