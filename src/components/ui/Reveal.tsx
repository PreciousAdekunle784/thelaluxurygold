"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export const luxeEase = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
  ...rest
}: { delay?: number; y?: number; as?: "div" | "li" | "section" | "article" } & HTMLMotionProps<"div">) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1.1, ease: luxeEase, delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Image reveal: a soft scale-down with a fade, used on editorial imagery. */
export function ImageReveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 1.06 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.6, ease: luxeEase, delay }}
    >
      {children}
    </motion.div>
  );
}
