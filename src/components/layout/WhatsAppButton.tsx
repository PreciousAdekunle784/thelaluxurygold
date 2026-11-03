"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { useScrolled } from "@/lib/hooks/ui";
import { whatsappLink, defaultWhatsappMessage } from "@/lib/whatsapp";

export function WhatsAppButton() {
  const pathname = usePathname();
  const scrolled = useScrolled(280);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // On the homepage, phones show the button once the visitor scrolls past the hero's
  // buttons, so it never covers them. Everywhere else (and on desktop) it is always shown.
  const hidden = phone && pathname === "/" && !scrolled;

  return (
    <motion.a
      href={whatsappLink(defaultWhatsappMessage)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with LA Luxury Gold on WhatsApp"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      initial={{ opacity: 0, y: 16 }}
      animate={hidden ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
      transition={{ delay: hidden ? 0 : scrolled ? 0 : 1.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: hidden ? "none" : undefined }}
      className="group fixed bottom-5 right-5 z-40 flex h-12 items-center gap-0 overflow-hidden rounded-full border border-ivory/20 bg-forest pl-3.5 pr-3.5 text-ivory shadow-[0_14px_40px_-16px_rgba(17,17,17,0.55)] transition-[gap,padding] duration-500 ease-[var(--ease-luxe)] hover:gap-2.5 hover:pr-5 md:bottom-7 md:right-7"
    >
      <WhatsAppIcon width={21} height={21} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[0.62rem] font-semibold uppercase tracking-[0.2em] transition-[max-width] duration-500 ease-[var(--ease-luxe)] group-hover:max-w-[160px]">
        Ask a question
      </span>
    </motion.a>
  );
}
