"use client";

import { motion } from "framer-motion";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { whatsappLink, defaultWhatsappMessage } from "@/lib/whatsapp";

export function WhatsAppButton() {
  return (
    <motion.a
      href={whatsappLink(defaultWhatsappMessage)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with LA Luxury Gold on WhatsApp"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="group fixed bottom-5 right-5 z-40 flex h-12 items-center gap-0 overflow-hidden rounded-full border border-ivory/20 bg-forest pl-3.5 pr-3.5 text-ivory shadow-[0_14px_40px_-16px_rgba(17,17,17,0.55)] transition-[gap,padding] duration-500 ease-[var(--ease-luxe)] hover:gap-2.5 hover:pr-5 md:bottom-7 md:right-7"
    >
      <WhatsAppIcon width={21} height={21} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[0.62rem] font-semibold uppercase tracking-[0.2em] transition-[max-width] duration-500 ease-[var(--ease-luxe)] group-hover:max-w-[160px]">
        Ask a question
      </span>
    </motion.a>
  );
}
