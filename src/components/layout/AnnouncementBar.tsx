"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { store } from "@/lib/config/store";

export function AnnouncementBar() {
  const items = store.announcements;
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % items.length), 5200);
    return () => window.clearInterval(t);
  }, [items.length]);

  return (
    <div className="relative z-[60] bg-forest-deep text-ivory" role="region" aria-label="Announcements">
      <div className="container-luxe flex h-9 items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="truncate text-center text-[0.56rem] font-medium uppercase tracking-[0.18em] text-ivory/90 sm:text-[0.62rem] sm:tracking-[0.3em]"
            aria-live="polite"
          >
            {items[i]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
